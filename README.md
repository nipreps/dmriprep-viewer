# dmriprep-viewer

This viewer is for the visualization of interactive reports from both
[dmriprep](https://github.com/nipreps/dmriprep) and
[qsiprep](https://github.com/PennBBL/qsiprep). The dmriprep and qsiprep
workflows create a `report.json` file which is injected into the HTML of a
reportlet. This library then renders the object in a series of interactive
widgets.

## Relevant files:

The relevant files for this repo are:

| Location                               | Content                                                                                                           |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `src/components/ReportParticipant.vue` | Renders contents of a participant level `report` object from `dmriprep`                                           |
| `src/components/ReportGroup.vue`       | Renders contents of a group level `report` object from `dmriprep`                                                 |
| `src/App.vue`                          | Main entrypoint, its child component is `src/components/GenReport.vue`                                            |
| `src/components/GenReport.vue`         | Determines if report.json contains a particpant or group level report and calls the appropriate report component. |
| `package.json`                         | File that contains all the JS libraries we need for this.                                                         |

The widget files are:

| Location                          | Content                                                                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/components/BrainSprite.vue`  | 3D [brainsprite](https://github.com/SIMEXP/brainsprite.js)                                                                                       |
| `src/components/CarpetPlot.vue`   | Interactive heatmap or [carpetplot](https://qsiprep.readthedocs.io/en/latest/preprocessing.html#confounds-and-carpet-plot-on-the-visual-reports) |
| `src/components/LineChart.vue`    | Interactive line chart for motion parameters                                                                                                     |
| `src/components/QSpaceGroup.vue`  | 3D QSpace widget for 2 QSpace plots                                                                                                              |
| `src/components/QSpaceViewer.vue` | Widget for single [QSpace plot](https://qsiprep.readthedocs.io/en/latest/preprocessing.html#visual-reports)                                      |
| `src/components/Sprite4D.vue`     | Widget for axial, sagittal, and coronal views over time                                                                                          |

## Project setup

You should first have NodeJS installed (version >= 10). Then install dependencies with:

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
