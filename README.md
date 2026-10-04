<h1 align="center">vue-drag-gantt-chart</h1>

A drag-and-drop Gantt chart for Vue 3 with virtualized rendering, grouping, search and conflict-checked task moves.

Fork of [liyang5945/vue-drag-gantt-chart](https://github.com/liyang5945/vue-drag-gantt-chart), which is based on [Vue-Gantt-chart](https://github.com/w1301625107/Vue-Gantt-chart).

## Features

- **Timeline**: day and time scales in the header, day navigation (◀ ▶), current-time and custom mark lines. Scrolling is implemented with [BetterScroll](https://github.com/ustbhuangyi/better-scroll) to keep scrollbar behavior consistent across browsers and support drag-like scrolling.
- **Virtualized rendering**: only rows and blocks inside the viewport are rendered, so thousands of rows stay smooth.
- **Data grouping**: rows can be grouped by different attributes; groups can be collapsed.
- **Search**: highlights matches and scrolls to the matched task. If there are multiple matches, clicking search again jumps to the next one.
- **Drag adjustment**: blocks are moved across rows with native browser drag events and validated (currently time conflicts). After a move, a shadow block can show the previous position; the shadow and the confirmation dialog are configurable.
- **Context menu**: when dragging is inconvenient, tasks can be moved from the right-click menu (cut / paste / swap); Escape cancels a cut. Tasks that already started can not be moved.

### Demo: [Online Preview](https://liyang5945.github.io/vue-drag-gantt-chart) (original project)

## Tech stack

Vue 3, Vuex 4, Vite 8, Element Plus, BetterScroll, Day.js, Vitest, Playwright, ESLint, Prettier.

## Getting started

Requires Node.js 22.13+, 24 or 26+ (the common range of Vite 8, Vitest 5 and ESLint 10).

```bash
npm install
npm run dev      # dev server on http://localhost:3001
npm run dev:host # the same, also reachable from the local network
npm run build    # production build into dist/
npm run preview  # preview the production build
npm test         # unit tests (Vitest)
npm run test:e2e # end-to-end tests (Playwright; run `npx playwright install chromium` once)
                 # E2E_TARGET=preview npm run test:e2e tests the production build
npm run lint     # ESLint
npm run format   # Prettier
```

## Project structure

```
src/
  components/
    v-gantt/        Gantt chart component (timeline, left bar, blocks, mark lines)
    context-menu/   Lightweight context menu component and directive
    demo/           Demo-specific task block, row label and adjustment dialog
  utils/            Time/position calculations, conflict checking, event bus
  store/            Vuex store with selection and drag state
  api/              Mock data generator
tests/              Unit and component tests (Vitest)
e2e/                End-to-end tests (Playwright)
```

## Usage

The component is registered globally as `v-gantt-chart`:

```vue
<v-gantt-chart
  :startTime="start"
  :endTime="end"
  :cellWidth="60"
  :cellHeight="50"
  :scale="60"
  :datas="groups"
  dataKey="id"
  showCurrentTime
/>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `startTime` | date-like | now | Start of the timeline |
| `endTime` | date-like | now | End of the timeline |
| `currentTime` | Day.js | now | Time used to mark tasks as past / current / future |
| `datas` | Array | `[]` | Groups of rows, see [Data format](#data-format) |
| `dataKey` | String | — | Row field used as a key in the left bar |
| `cellWidth` | Number | `50` | Width of one scale cell, px |
| `cellHeight` | Number | `20` | Row height, px |
| `titleHeight` | Number | `40` | Header height, px |
| `titleWidth` | Number | `200` | Left bar width, px |
| `scale` | Number | `60` | Minutes per cell: 1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60, 120, 180, 240, 360, 720 or a multiple of 1440 |
| `showCurrentTime` | Boolean | `false` | Show the current-time mark line |
| `timeLines` | Array | — | Extra mark lines: `{ time, color? }` |
| `hideHeader` | Boolean | `false` | Hide the timeline header |
| `timeRangeCorrection` | Boolean | `true` | Extend the end time when the range is narrower than the viewport |
| `preload` | Number | `1` | Rows rendered above and below the viewport; `0` renders all rows |

### Slots

- `timeline` — custom header cell, receives `{ day, getTimeScales }`.
- `markLine` — custom mark line, receives `{ timeConfig, getPosition }`.

## Data format

`datas` is a list of groups. Each group contains its rows in `children`:

```json
[
  {
    "groupType": { "type": "🚄", "speed": "50~100" },
    "isOpen": true,
    "children": [ /* rows */ ]
  }
]
```

Each row looks like this. `gtArray` contains the blocks in the row; `rawIndex` is the original row order and is used by the demo search to scroll to a row.

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
    }
  ]
}
```

## GIF demos

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

## License

[MIT](LICENSE)
