# dmriprep-viewer

This viewer is for the [dmriprep](https://github.com/nipreps/dmriprep) report's interactive component.
The workflow create a `report.json` file which is injected into the HTML of a reportlet. 
This library then renders the object in a series of interactive widgets.

## Relevant files:

The relevant files for this repo are:

| Location             |  Content                                   |
|----------------------|--------------------------------------------|
| `src/components/ReportStandalone.vue`  |  Main file to render contents of the `report` object from `dmriprep`|
| `src/App.vue`              | Main entrypoint, its child component is `src/components/GenReport.vue`  |
| `src/GenReport.vue`        | Loads `examples/report.json` and passes it to its child component, `src/components/ReportStandalone.vue`|
| `package.json`              | File that contains all the JS libraries we need for this.  |

The widget files are:


| Location             |  Content                                   |
|----------------------|--------------------------------------------|
| `src/components/BrainSprite.vue`  | 3D (brainsprite)[https://github.com/SIMEXP/brainsprite.js]s|
| `src/components/CarpetPlot.vue`  | Interactive heatmap (carpetplot)|
| `src/components/LineChart.vue`  | Interactive line chart for motion parameters|
| `src/components/QSpaceGroup.vue`  | 3D QSpace widget for 2 QSpace plots|
| `src/components/QSpaceView.vue`  | Widget for single QSpace plot|
| `src/components/Sprite4D.vue`  | Widget for axial, sagittal, and coronal views over time|


## Project setup

You should first have NodeJS installed (version >= 8). Then install dependencies with:

```
yarn install
```

### Compiles and hot-reloads for development

During development, do:

```
yarn serve
```

### Compiles and minifies for production

To build the minified widget files:

```
yarn build
```

### Lints and fixes files
```
yarn lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
