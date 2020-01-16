<!--
/**
 * This component creates a three.js canvas displaying a point cloud for the q-space sampling scheme
 *
 * The points are represented using THREE.Points with a vertex shader. We chose this method
 * because we believe it is more lightweight than a group of spheres or something similar.
 */
 -->
<template>
  <div :id="elementId"></div>
</template>

<script>
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import Stats from 'three/examples/jsm/libs/stats.module.js';
  const disc = require('./disc.png');

  export default {
    name: 'qSpaceViewer',
    props: {
      qcoords: {
        type: Array
      },
      colors: {
        type: Array
      },
      elementId: {
        type: String
      },
      cameraPosition: {
        type: Object
      },
      autoRotate: {
        type: Boolean
      },
      showReflectedPoints: {
        type: Boolean
      },
      highlightIdx: {
        type: Number
      }
    },
    data () {
      return {
        scene: null,
        camera: null,
        controls: null,
        renderer: null,
        ambient: null,
        particles: null,
        reflectedParticles: null,
        showStats: false,
        stats: null,
        container: null,
        unselectedSize: null,
        unselectedAlpha: 0.3,
      };
    },
    mounted() {
      this.init();
      this.animate();
    },
    watch: {
      highlightIdx() {
        this.highlightPoint()
      },
      autoRotate() {
        this.toggleAutoRotate()
      },
      showReflectedPoints() {
        this.toggleReflectedPoints()
      }
    },
    methods: {
      init: function() {
        // There may be multiple QSpaceViewer components so `elementId` is
        // passed in as an input using Vue magic. We insert the viewer canvas
        // element into the div with this elementId
        this.container = document.getElementById( this.elementId );

        // The q-space coords will be scaled by b-val. So we don't know a priori
        // what the scale will be. Thus, we read in the data first and then
        // determine the scale of the point cloud. We then set the camera
        // position, marker size, etc. dynamically.
        const xyz = this.qcoords;  // q-space coords
        const rgb = this.colors;  // color encodes the imaging run

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

        // Now that we've determined `absMax`, set the point size and fill the
        // sizes and alphas arrays.
        this.unselectedSize = absMax * 0.15;
        const sizes = new Float32Array( npoints );
        const alphas = new Float32Array( npoints );

        for ( let i = 0, l = npoints; i < l; i++ ) {
          sizes[i] = i === this.highlightIdx ? 3.0 * this.unselectedSize : this.unselectedSize;
          alphas[i] = i === this.highlightIdx ? 1.0 : 0.25;
        }

        // Set the positions, colors, sizes, and alphas as attributes of a
        // buffer geometry. These attributes will be sent as arguments to the
        // shaders defined below.
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
        geometry.setAttribute( 'customColor', new THREE.Float32BufferAttribute( colors, 3 ) );
        geometry.setAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );
        geometry.setAttribute( 'alpha', new THREE.BufferAttribute( alphas, 1 ) );

        // Create the scene and camera.
        // Camera position is set dynamically based on `absMax`.
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( 75, 1, 0.001, absMax * 10 );
        this.camera.position.z = absMax * 2;

        // Use ambient light
        this.ambient = new THREE.AmbientLight(0x111111);
        this.scene.add(this.ambient);

        // Use vertex and fragment shaders to change the display of each point
        // Without this, each point is rendered as a square. The shaders take
        // as arguments the attributes of the geometry defined above (i.e.
        // alpha, size, and customColor).
        const vertexShader = `
        attribute float alpha;
        attribute float size;
        attribute vec3 customColor;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = customColor;
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
          gl_PointSize = size * ( 300.0 / -mvPosition.z );
          gl_Position = projectionMatrix * mvPosition;
        }
        `;

        const fragmentShader = `
        uniform vec3 color;
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          gl_FragColor = vec4( color * vColor, vAlpha );
          gl_FragColor = gl_FragColor * texture2D( pointTexture, gl_PointCoord );
        }
        `;

        // Use the disc.png image for each point.
        const discTexture = new THREE.TextureLoader().load(disc);

        // Put it all together (the shaders and the image texture) into a
        // shader material.
        const material = new THREE.ShaderMaterial({
          uniforms: {
            color: { value: new THREE.Color( 0xFFFFFF ) },
            pointTexture: { value: discTexture }
          },
          vertexShader: vertexShader,
          fragmentShader: fragmentShader,
          transparent: true
        });

        // Create points from geometry and material and add to the scene.
        this.particles = new THREE.Points( geometry, material );
        this.scene.add( this.particles );

        // Do this all over again for the reflected points.
        let reflectedPositions = [];
        for ( let i = 0, l = npoints; i < l; i++ ) {
          vertex = xyz[ i ];
          reflectedPositions.push( -vertex[0], -vertex[1], -vertex[2] );
        }

        const reflectedGeometry = new THREE.BufferGeometry();
        reflectedGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( reflectedPositions, 3 ) );
        reflectedGeometry.setAttribute( 'customColor', new THREE.Float32BufferAttribute( colors, 3 ) );
        reflectedGeometry.setAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );
        reflectedGeometry.setAttribute( 'alpha', new THREE.BufferAttribute( alphas, 1 ) );

        this.reflectedParticles = new THREE.Points( reflectedGeometry, material );
        this.scene.add( this.reflectedParticles );

        // Only display the reflected particles if the checkbox is selected
        this.reflectedParticles.visible = this.showReflectedPoints

        // three.js has an AxesHelper object but one can't change the line
        // width. So instead we create one TubeGeometry for each axis and
        // combine them all into `axesGroup`.
        const axesGroup = new THREE.Group();

        const axesPoints = {
          x: [[0, 0, 0], [1.25 * absMax, 0, 0]],
          y: [[0, 0, 0], [0, 1.25 * absMax, 0]],
          z: [[0, 0, 0], [0, 0, 1.25 * absMax]]
        };

        // This somewhat complicated pattern iterates through each key/value
        // in the previous object and creates a new object based on a map
        // In this case we are creating a path from each set of points.
        const axesPaths = Object.assign(
            ...Object.entries(axesPoints).map(
                ([key, value]) => ({ [key]: value.map(function (element) {
                  return new THREE.Vector3(element[0], element[1], element[2]);
                  })})
            )
        );

        // Use the same pattern to create a curve from each path.
        const axesCurves = Object.assign(
            ...Object.entries(axesPaths).map(
                ([key, value]) => ({ [key]: new THREE.CatmullRomCurve3( value ) })
            )
        );

        // Use same pattern to create a geometry from each curve
        const axesGeometries = Object.assign(
            ...Object.entries(axesCurves).map(
                ([key, value]) => ({ [key]: new THREE.TubeBufferGeometry(
                    value, 50, absMax * 0.01, 8, true
                  )})
            )
        );

        // Now create axes materials with a different color for each axis.
        const axesMaterials = {
          x: new THREE.MeshBasicMaterial({ color: 'red', depthWrite: true }),
          y: new THREE.MeshBasicMaterial({ color: 'green', depthWrite: true }),
          z: new THREE.MeshBasicMaterial({ color: 'blue', depthWrite: true }),
        };

        // Create the tube meshes
        const xAxisMesh = new THREE.Mesh( axesGeometries.x, axesMaterials.x );
        const yAxisMesh = new THREE.Mesh( axesGeometries.y, axesMaterials.y );
        const zAxisMesh = new THREE.Mesh( axesGeometries.z, axesMaterials.z );

        // Add each one to the group and add group to scene
        axesGroup.add( xAxisMesh );
        axesGroup.add( yAxisMesh );
        axesGroup.add( zAxisMesh );
        this.scene.add( axesGroup );

        // Create the renderer and append to the div container
        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( this.container.clientWidth, this.container.clientWidth );
        this.container.appendChild( this.renderer.domElement );

        // Add orbit controls.
        this.controls = new OrbitControls (this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.25;
        this.controls.enableZoom = true;
        this.controls.autoRotate = this.autoRotate;
        this.controls.maxDistance = absMax * 5;
        this.controls.enableKeys = false;

        // We will have multiple QSpaceViewers and we want their orbit
        // controls to be yoked to each other. We do this with the
        // `emitCameraEvent` method.
        this.controls.addEventListener('change', this.emitCameraEvent);

        // For development, it's nice to have stats on frame rate, etc.
        // Set showStats to tru up top to see the sets.
        // Be sure to turn it back off for the production version
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
      highlightPoint() {
        // When the volume selection slider changes, we call this method
        // to change the size and opacity of the selected point.
        const alphas = this.particles.geometry.attributes.alpha;
        const sizes = this.particles.geometry.attributes.size;
        for (let i = 0; i < alphas.count; i++) {
          alphas.array[i] = i === this.highlightIdx ? 1.0 : 0.25;
          sizes.array[i] = i === this.highlightIdx ? 3.0 * this.unselectedSize : this.unselectedSize;
        }
        alphas.needsUpdate = true;
        sizes.needsUpdate = true;

        // Do it all over again for the reflected points.
        const alphasRef = this.reflectedParticles.geometry.attributes.alpha;
        const sizesRef = this.reflectedParticles.geometry.attributes.size;
        for (let i = 0; i < alphasRef.count; i++) {
          alphasRef.array[i] = i === this.highlightIdx ? 1.0 : 0.25;
          sizesRef.array[i] = i === this.highlightIdx ? 3.0 * this.unselectedSize : this.unselectedSize;
        }
        alphasRef.needsUpdate = true;
        sizesRef.needsUpdate = true;
      },
      toggleAutoRotate() {
        // When the auto rotate checkbox changes, change the autoRotate property
        this.controls.autoRotate = this.autoRotate;
      },
      toggleReflectedPoints() {
        // When the reflected points checkbox changes, change the visible property
        this.reflectedParticles.visible = this.showReflectedPoints;
      },
      render: function() {
        this.renderer.render( this.scene, this.camera );
        if (this.cameraPosition) {
          this.camera.position.copy(this.cameraPosition);
        }
        this.controls.update();
      },
      onWindowResize: function() {
        this.renderer.setSize( this.container.clientWidth, this.container.clientWidth );
      },
      emitCameraEvent: function() {
        // When the camera position updates on this viewer component,
        // emit an `updateCameraPosition` event, which will trigger
        // the QSpaceGroup component to send it back down to each
        // child component via the `cameraPosition` parameter.
        this.$emit( 'updateCameraPosition', this.camera.position );
      }
    }
  }
</script>