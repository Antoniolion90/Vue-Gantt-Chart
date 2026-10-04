import { expect } from "@playwright/test";

/**
 * Open the demo and wait until rows are rendered. Collects console errors,
 * Vue warnings and Element Plus warnings, so a test can fail on them.
 */
export async function openGantt(page) {
  const problems = [];
  page.on("console", (message) => {
    const text = message.text();
    if (message.type() === "error" || /\[Vue warn\]|ElementPlusError/.test(text)) {
      problems.push(text);
    }
  });
  page.on("pageerror", (error) => problems.push(error.message));

  // Data starts at 00:00 today and only future blocks can be moved, so the clock is fixed
  // in the morning: the visible part of the timeline then has both started and future blocks
  const morning = new Date();
  morning.setHours(6, 0, 0, 0);
  // setSystemTime keeps the time running: with a frozen Date.now() Vue drops events
  // handled by nested listeners, since their timestamps are equal
  await page.clock.setSystemTime(morning);

  await page.goto("/");
  await expect(page.locator(".gantt-block-row").first()).toBeVisible();
  return problems;
}

/**
 * Replace demo data with known rows. Block times are hours from 00:00 today
 * (the page clock starts at 06:00).
 *
 * @param {import("@playwright/test").Page} page
 * @param {Array<{ id: string, blocks: Array<{ id: string, from: number, to: number }> }>} rows
 */
export async function loadRows(page, rows) {
  await page.evaluate((rowList) => {
    const store = document.querySelector("#app").__vue_app__.config.globalProperties.$store;
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    const at = (hours) => new Date(day.getTime() + hours * 3600 * 1000).toString();
    store.commit(
      "setShowRowList",
      rowList.map((row, index) => ({
        rawIndex: index,
        id: row.id,
        name: row.id,
        type: "🚅",
        speed: 10,
        colorPair: { dark: "rgb(83, 186, 241,0.8)", light: "rgb(83, 186, 241,0.1)" },
        gtArray: row.blocks.map((block) => ({
          id: block.id,
          passenger: 10,
          start: at(block.from),
          end: at(block.to),
          type: "🚅",
          parentId: row.id
        }))
      }))
    );
  }, rows);
  await expect(page.locator(`.gantt-block-row[data-row-id="${rows[0].id}"]`)).toBeVisible();
}

/** Store state of the demo */
export function getState(page) {
  return page.evaluate(() => {
    const { state } = document.querySelector("#app").__vue_app__.config.globalProperties.$store;
    return {
      rows: state.showRowList.map((row) => ({
        id: row.id,
        blocks: row.gtArray.map((b) => ({ id: b.id, movedStatus: b.movedStatus ?? null }))
      })),
      firstBlockStart: state.showRowList[0]?.gtArray[0]?.start ?? null,
      cutBlockId: state.cutBlock?.id ?? null
    };
  });
}

/** Block element by id inside the given row */
export function blockInRow(page, rowId, blockId) {
  return page.locator(`.gantt-block-row[data-row-id="${rowId}"] [data-block-id="${blockId}"]`);
}

/** Row id of the block with the given id, ignoring shadows of moved blocks */
export function findRowOfBlock(state, blockId) {
  return state.rows.find((row) =>
    row.blocks.some((b) => b.id === blockId && b.movedStatus !== "before")
  )?.id;
}

/** A point inside a rendered row that is not covered by a block */
export async function emptyPointInRow(page, rowId) {
  const point = await page.evaluate((id) => {
    const el = document.querySelector(`.gantt-block-row[data-row-id="${id}"]`);
    const rect = el.getBoundingClientRect();
    const wrapper = document.querySelector(".gantt-blocks-wrapper").getBoundingClientRect();
    const y = rect.top + rect.height / 2;
    for (let x = wrapper.left + 5; x < wrapper.right - 5; x += 5) {
      if (document.elementFromPoint(x, y) === el) return { x, y };
    }
    return null;
  }, rowId);
  expect(point, "row has free space").not.toBeNull();
  return point;
}
