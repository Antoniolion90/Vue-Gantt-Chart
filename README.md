<h1 align="center">vue-drag-gantt-chart</h1>

Based on [Vue-Gantt-chart](https://github.com/w1301625107/Vue-Gantt-chart) with the following changes:

- Style updates: added top time scales and left-side date labels. Scrolling is implemented with [iscroll](https://github.com/cubiq/iscroll) to keep scrollbar behavior consistent across browsers and support drag-like scrolling.
- Data grouping: gantt rows can be grouped by different attributes. Rendering is dynamic and only visible viewport data is rendered.
- Data search: highlights matches and scrolls to the matched task. If there are multiple matches, clicking search again jumps to the next one.
- Drag adjustment for gantt blocks: implemented with native browser drag events. Blocks can be adjusted across rows with validation (currently time validation). After dragging, a black shadow block can show previous task position; this and confirmation dialogs are configurable.
- Context menu: when row spacing is too large for convenient dragging, tasks can be adjusted from the right-click menu (copy/swap).

### Demo: [Online Preview](https://liyang5945.github.io/vue-drag-gantt-chart)

### GIF Demos
Drag move

![](screenshot/vue_drag_gantt_1.gif)

Data grouping

![](screenshot/vue_drag_gantt_2.gif)

Search

![](screenshot/vue_drag_gantt_3.gif)

Task drag adjustment

![](screenshot/vue_drag_gantt_4.gif)

Task adjustment via context menu

![](screenshot/vue_drag_gantt_5.gif)

Data format: each row looks like this. `rawIndex` is the original row order and is used to calculate the vertical position (`top`). `gtArray` contains each block in the row.

```json
{
  "rawIndex": 2,
  "id": "JHR725ST",
  "type": "🚄",
  "speed": 88,
  "name": "Officer",
  "colorPair": {
    "dark": "rgb(247, 167, 71,0.8)",
    "light": "rgb(247, 167, 71,0.1)"
  },
  "gtArray": [
    {
      "id": "UM4366",
      "passenger": 40,
      "start": "Tue, 31 May 2022 21:00:28 GMT",
      "end": "Wed, 01 Jun 2022 02:00:28 GMT",
      "type": "🚄",
      "parentId": "JHR725ST"
    },
    {
      "id": "RA6062",
      "passenger": 120,
      "start": "Wed, 01 Jun 2022 06:00:28 GMT",
      "end": "Wed, 01 Jun 2022 10:00:28 GMT",
      "type": "🚄",
      "parentId": "JHR725ST"
    },
    {
      "id": "TR8476",
      "passenger": 52,
      "start": "Wed, 01 Jun 2022 15:00:28 GMT",
      "end": "Wed, 01 Jun 2022 20:00:28 GMT",
      "type": "🚄",
      "parentId": "JHR725ST"
    },
    {
      "id": "VX5715",
      "passenger": 44,
      "start": "Wed, 01 Jun 2022 23:00:28 GMT",
      "end": "Thu, 02 Jun 2022 04:00:28 GMT",
      "type": "🚄",
      "parentId": "JHR725ST"
    }
  ]
}
```
