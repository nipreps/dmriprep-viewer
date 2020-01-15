<template>
  <div :id="elementId"></div>
</template>

<script>
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import Stats from 'three/examples/jsm/libs/stats.module.js';
  const disc = require('./disc.png');
  // const snowflake = require('three/examples/textures/sprites/snowflake2.png');

  export default {
    name: 'sampling',
    props: {
      data: {
        type: Object
      },
      elementId: {
        type: String
      },
      cameraPosition: {
        type: Object
      }
    },
    data () {
      return {
        scene: null,
        camera: null,
        controls: null,
        renderer: null,
        ambient: null,
        directionalLight: null,
        particles: null,
        showStats: false,
        stats: null,
        container: null,
      };
    },
    mounted() {
      this.init();
      this.animate();
    },
    methods: {
      init: function() {
        this.container = document.getElementById( this.elementId );

        this.scene = new THREE.Scene();

        const xyz = this.data['q_coords'];
        const rgb = this.data['color'];

        let positions = [];
        let colors = [];

        let vertex;
        const color = new THREE.Color();
        let absMax = 0;

        const npoints = xyz.length;
        for ( let i = 0, l = npoints; i < l; i++ ) {
          vertex = xyz[ i ];
          positions.push( vertex[0], vertex[1], vertex[2] );
          const localMax = Math.max(Math.abs(vertex[0], vertex[1], vertex[2]));
          if (localMax > absMax) {
            absMax = localMax;
          }

          color.setRGB(rgb[i][0], rgb[i][1], rgb[i][2]);
          colors.push( color.r, color.g, color.b );
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
        geometry.setAttribute( 'customColor', new THREE.Float32BufferAttribute( colors, 3 ) );
        // geometry.setAttribute( 'size', absMax * 0.05 );
        geometry.computeBoundingSphere();

        this.camera = new THREE.PerspectiveCamera( 75, 1, 0.001, absMax * 3 );
        this.camera.position.z = absMax * 2;

        // Use ambient light
        this.ambient = new THREE.AmbientLight(0x111111);
        this.scene.add(this.ambient);

        // And a directional light always pointing from the camera
        this.directionalLight = new THREE.DirectionalLight(0xffeedd, 1);
        this.directionalLight.position.set(
            this.camera.position.x,
            this.camera.position.y,
            this.camera.position.z
        );
        this.scene.add(this.directionalLight);

        //

        // const material = new THREE.PointsMaterial({
        //   size: absMax * 0.05,
        //   vertexColors: THREE.VertexColors
        // });
        const vertexShader = `
        attribute float size;
        attribute vec3 customColor;
        varying vec3 vColor;

        void main() {
          vColor = customColor;
          vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
          gl_PointSize = size * ( 300.0 / -mvPosition.z );
          gl_Position = projectionMatrix * mvPosition;
        }
        `

        const fragmentShader = `
        uniform vec3 color;
        uniform sampler2D pointTexture;
        varying vec3 vColor;

        void main() {
          gl_FragColor = vec4( color * vColor, 1.0 );
          gl_FragColor = gl_FragColor * texture2D( pointTexture, gl_PointCoord );
          if ( gl_FragColor.a < ALPHATEST ) discard;
        }
        `

        const discTexture = new THREE.TextureLoader().load(disc);

        const material = new THREE.ShaderMaterial({
          uniforms: {
            color: { value: new THREE.Color( 0x000000 ) },
            pointTexture: { value: discTexture }
          },
          vertexShader: vertexShader,
          fragmentShader: fragmentShader,
          alphaTest: 0.9
        });

        //

        this.particles = new THREE.Points( geometry, material );

        const axesGroup = new THREE.Group();

        const axesPoints = {
          x: [[0, 0, 0], [1.25 * absMax, 0, 0]],
          y: [[0, 0, 0], [0, 1.25 * absMax, 0]],
          z: [[0, 0, 0], [0, 0, 1.25 * absMax]]
        };

        const axesPaths = Object.assign(
            ...Object.entries(axesPoints).map(
                ([key, value]) => ({ [key]: value.map(function (element) {
                  return new THREE.Vector3(element[0], element[1], element[2]);
                  })})
            )
        );

        const axesCurves = Object.assign(
            ...Object.entries(axesPaths).map(
                ([key, value]) => ({ [key]: new THREE.CatmullRomCurve3( value ) })
            )
        );

        const axesGeometries = Object.assign(
            ...Object.entries(axesCurves).map(
                ([key, value]) => ({ [key]: new THREE.TubeBufferGeometry(
                    value, 50, absMax * 0.01, 8, true
                  )})
            )
        );

        const axesMaterials = {
          x: new THREE.MeshBasicMaterial({ color: 'red', depthWrite: true }),
          y: new THREE.MeshBasicMaterial({ color: 'green', depthWrite: true }),
          z: new THREE.MeshBasicMaterial({ color: 'blue', depthWrite: true }),
        };

        const xAxisMesh = new THREE.Mesh( axesGeometries.x, axesMaterials.x );
        const yAxisMesh = new THREE.Mesh( axesGeometries.y, axesMaterials.y );
        const zAxisMesh = new THREE.Mesh( axesGeometries.z, axesMaterials.z );

        axesGroup.add( xAxisMesh );
        axesGroup.add( yAxisMesh );
        axesGroup.add( zAxisMesh );

        this.particles.add( axesGroup );

        this.scene.add( this.particles );

        //

        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( this.container.clientWidth, this.container.clientWidth );
        this.container.appendChild( this.renderer.domElement );

        //

        this.controls = new OrbitControls (this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.25;
        this.controls.enableZoom = true;
        this.controls.autoRotate = false;

        this.controls.addEventListener('change', this.updateCameras);
        this.controls.enableKeys = false;

        //

        if (this.showStats) {
          this.stats = new Stats();
          this.stats.domElement.style.position = 'relative';
          this.stats.domElement.style.top = '0px';
          this.stats.domElement.style.right = '0px';
          this.container.appendChild( this.stats.domElement );
        }

        this.container.addEventListener( 'resize', this.onWindowResize, false );
      },
      animate: function() {
        requestAnimationFrame( this.animate );
        this.render();
        if (this.showStats) {
          this.stats.update();
        }
      },
      render: function() {
        const time = Date.now() * 0.0005;
        this.particles.rotation.x = time * 0.25;
        this.particles.rotation.y = time * 0.5;
        this.renderer.render( this.scene, this.camera );
        if (this.cameraPosition) {
          this.camera.position.copy(this.cameraPosition);
        }
        this.controls.update();
      },
      onWindowResize: function() {
        this.renderer.setSize( this.container.clientWidth, this.container.clientWidth );
      },
      updateCameras: function() {
        // this.cameraPosition = this.camera.position;
        this.$emit( 'updateCameraPosition', this.camera.position );
      }
    }
  }
</script>