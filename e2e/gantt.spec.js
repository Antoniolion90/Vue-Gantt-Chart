import { test, expect } from "@playwright/test";
import {
  blockInRow,
  emptyPointInRow,
  findRowOfBlock,
  getState,
  loadRows,
  openGantt,
  chartCenter,
  scrollChart,
  setViewOptions
} from "./helpers.js";

// The page clock starts at 06:00. S has started, A, B, C, D are in the future.
// A fits into R3, C conflicts with D in R3.
const ROWS = [
  {
    id: "R1",
    blocks: [
      { id: "S", from: 2, to: 5 },
      { id: "A", from: 8, to: 10 }
    ]
  },
  {
    id: "R2",
    blocks: [
      { id: "B", from: 11, to: 13 },
      { id: "C", from: 14, to: 16 }
    ]
  },
  { id: "R3", blocks: [{ id: "D", from: 15, to: 18 }] }
];

let problems;

test.beforeEach(async ({ page }) => {
  problems = await openGantt(page);
});

test.afterEach(() => {
  expect(problems, "console errors and warnings").toEqual([]);
});

test.describe("rendering", () => {
  test("renders only rows near the viewport", async ({ page }) => {
    const state = await getState(page);
    expect(state.rows.length).toBe(500);
    const rendered = await page.locator(".gantt-block-row").count();
    expect(rendered).toBeGreaterThan(5);
    expect(rendered).toBeLessThan(60);
  });

  test("fills the viewport after fast scrolling", async ({ page }) => {
    const box = await page.locator(".gantt-blocks-wrapper").boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 15; i++) {
      await page.mouse.wheel(250, 900);
    }
    await page.waitForTimeout(800);

    // Every probed point of the viewport must hit a row or a block, not empty space
    const emptyPoints = await page.evaluate(() => {
      const rect = document.querySelector(".gantt-blocks-wrapper").getBoundingClientRect();
      const empty = [];
      for (let y = rect.top + 10; y < rect.bottom - 10; y += 40) {
        for (let x = rect.left + 10; x < rect.right - 20; x += 150) {
          const el = document.elementFromPoint(x, y);
          if (!el.closest(".gantt-block-row, .gantt-block-top-space")) empty.push([x, y]);
        }
      }
      return empty;
    });
    expect(emptyPoints).toEqual([]);
  });

  test("collapses and expands a group with a visible button", async ({ page }) => {
    const toggle = page.locator("button.btn-toggle").first();
    await expect(toggle).toHaveText("▼");
    await toggle.click();
    await expect(toggle).toHaveText("▶");
    await expect(page.locator(".gantt-block-row")).toHaveCount(0);
    await toggle.click();
    await expect(page.locator(".gantt-block-row").first()).toBeVisible();
  });

  test("shows block details in a popover", async ({ page }) => {
    const block = page.locator(".gantt-block-item").filter({ visible: true }).first();
    const id = await block.getAttribute("data-block-id");
    await block.locator(".plan").click();
    const detail = page.locator(".detail").filter({ visible: true });
    await expect(detail).toContainText("Departure time");
    await expect(detail).toContainText(id);
    // Times include the date
    await expect(detail).toContainText(/[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}/);

    await page.mouse.move(5, 5);
    await expect(detail).toHaveCount(0);
  });
});

test.describe("moving blocks", () => {
  test.beforeEach(async ({ page }) => {
    await loadRows(page, ROWS);
  });

  test("cut and paste moves a block, Escape cancels cut", async ({ page }) => {
    const menu = page.locator(".v-contextmenu").filter({ visible: true });
    const r3 = await emptyPointInRow(page, "R3");

    // Nothing is cut yet: Paste is disabled
    await page.mouse.click(r3.x, r3.y, { button: "right" });
    await expect(menu.getByText("Paste")).toHaveClass(/disabled/);
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);

    // Cut, then cancel with Escape
    await blockInRow(page, "R1", "A").click({ button: "right" });
    await menu.getByText("Cut").click();
    expect((await getState(page)).cutBlockId).toBe("A");
    await page.keyboard.press("Escape");
    expect((await getState(page)).cutBlockId).toBeNull();

    // Cut and paste into R3
    await blockInRow(page, "R1", "A").click({ button: "right" });
    await menu.getByText("Cut").click();
    await page.mouse.click(r3.x, r3.y, { button: "right" });
    await menu.getByText("Paste").click();

    const state = await getState(page);
    expect(findRowOfBlock(state, "A")).toBe("R3");
    // R1 keeps a shadow of the moved block, and the cut is done
    expect(state.rows[0].blocks).toContainEqual({ id: "A", movedStatus: "before" });
    expect(state.cutBlockId).toBeNull();

    // Paste is not possible again
    await page.mouse.click(r3.x, r3.y, { button: "right" });
    await expect(menu.getByText("Paste")).toHaveClass(/disabled/);
  });

  test("a block that already started can not be cut or swapped", async ({ page }) => {
    const menu = page.locator(".v-contextmenu").filter({ visible: true });
    await blockInRow(page, "R2", "B").click({ button: "right" });
    await menu.getByText("Cut").click();

    await blockInRow(page, "R1", "S").click({ button: "right" });
    await expect(menu.getByText("Cut")).toHaveClass(/disabled/);
    await expect(menu.getByText("Swap")).toHaveClass(/disabled/);
  });

  test("drag and drop moves a block, moving it back restores it", async ({ page }) => {
    const wrapper = page.locator(".gantt-blocks-wrapper");

    async function dragToRow(block, rowId) {
      const point = await emptyPointInRow(page, rowId);
      const box = await wrapper.boundingBox();
      await block.dragTo(wrapper, {
        sourcePosition: { x: 5, y: 5 },
        targetPosition: { x: point.x - box.x, y: point.y - box.y }
      });
    }

    await dragToRow(blockInRow(page, "R1", "A"), "R3");
    expect(findRowOfBlock(await getState(page), "A")).toBe("R3");

    await dragToRow(blockInRow(page, "R3", "A"), "R1");
    const state = await getState(page);
    // One block A in R1 again, without a shadow or a duplicate
    const blocksA = state.rows.flatMap((row) => row.blocks.filter((b) => b.id === "A"));
    expect(blocksA).toEqual([{ id: "A", movedStatus: null }]);
    expect(findRowOfBlock(state, "A")).toBe("R1");
  });

  test("a move with a time conflict is rejected", async ({ page }) => {
    const wrapper = page.locator(".gantt-blocks-wrapper");
    const point = await emptyPointInRow(page, "R3");
    const box = await wrapper.boundingBox();
    await blockInRow(page, "R2", "C").dragTo(wrapper, {
      sourcePosition: { x: 5, y: 5 },
      targetPosition: { x: point.x - box.x, y: point.y - box.y }
    });

    await expect(page.locator(".el-message")).toContainText("time conflicts");
    expect(findRowOfBlock(await getState(page), "C")).toBe("R2");
  });
});

test.describe("demo controls", () => {
  test("search scrolls to a block in another group", async ({ page }) => {
    // Group by type, then search a block of a row near the end of the last group
    await page.getByRole("button", { name: "Grouping" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByText("🚅").click();
    await dialog.getByText("🚄").click();
    await dialog.getByRole("button", { name: "Confirm" }).click();
    await expect(dialog).toBeHidden();

    const id = await page.evaluate(() => {
      const { state } = document.querySelector("#app").__vue_app__.config.globalProperties.$store;
      const rows = state.showRowList.filter((row) => row.type === "🚄");
      return rows[rows.length - 5].gtArray[3].id;
    });
    await page.getByPlaceholder("ID").fill(id);
    await page.getByRole("button", { name: /Search/ }).click();

    const found = page.locator(`[data-block-id="${id}"] .plan.highlight`);
    await expect(found).toBeInViewport();
  });

  test("changing the date range regenerates data inside the new range", async ({ page }) => {
    const before = new Date((await getState(page)).firstBlockStart);
    await page.locator(".time-picker").click();
    // Pick the first two days of the next month in the range panel
    const panel = page.locator(".el-date-range-picker").filter({ visible: true });
    const rightCells = panel.locator(".el-date-range-picker__content.is-right td.available");
    await rightCells.nth(0).click();
    await rightCells.nth(1).click();
    await expect(panel).toBeHidden();

    await expect
      .poll(async () => new Date((await getState(page)).firstBlockStart).getMonth())
      .toBe((before.getMonth() + 1) % 12);
  });
});

test.describe("view settings", () => {
  test("block text stays inside blocks on a large scale", async ({ page }) => {
    await setViewOptions(page, { scaleLabel: "6 hours" });
    const outside = await page.evaluate(() => {
      const result = [];
      for (const plan of document.querySelectorAll(".gantt-block-item .plan")) {
        const box = plan.getBoundingClientRect();
        for (const child of plan.children) {
          const rect = child.getBoundingClientRect();
          if (rect.left < box.left - 1 || rect.right > box.right + 1) {
            result.push(plan.parentElement.dataset.blockId);
            break;
          }
        }
      }
      return result;
    });
    expect(outside).toEqual([]);
  });

  test("labels of close time lines do not overlap", async ({ page }) => {
    await setViewOptions(page, { scaleLabel: "6 hours" });
    const overlaps = await page.evaluate(() => {
      const rects = [...document.querySelectorAll(".gantt-markline-label")].map((el) =>
        el.getBoundingClientRect()
      );
      let count = 0;
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i];
          const b = rects[j];
          if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) count++;
        }
      }
      return { count, labels: rects.length };
    });
    expect(overlaps.labels).toBe(3);
    expect(overlaps.count).toBe(0);
  });

  test("zooming keeps the time in the middle of the viewport", async ({ page }) => {
    await scrollChart(page, 1500, 2000);
    const center = await chartCenter(page);
    // A block under the vertical center line, in any row
    const blockId = await page.evaluate(({ x }) => {
      const el = [...document.querySelectorAll("[data-block-id]")].find((block) => {
        const rect = block.getBoundingClientRect();
        return rect.left < x - 2 && rect.right > x + 2 && rect.top > 130;
      });
      return el?.dataset.blockId;
    }, center);
    expect(blockId).toBeTruthy();

    await setViewOptions(page, { scaleLabel: "30 minutes" });
    const rect = await page.locator(`[data-block-id="${blockId}"]`).boundingBox();
    expect(rect.x).toBeLessThan(center.x + 2);
    expect(rect.x + rect.width).toBeGreaterThan(center.x - 2);
  });

  test("changing the row height keeps the row in the middle of the viewport", async ({ page }) => {
    await scrollChart(page, 0, 6000);
    const center = await chartCenter(page);
    const rowAt = (y) =>
      page.evaluate((py) => {
        const row = [...document.querySelectorAll(".gantt-block-row")].find((el) => {
          const rect = el.getBoundingClientRect();
          return rect.top <= py && rect.bottom > py;
        });
        return row?.dataset.rowId;
      }, y);
    const before = await rowAt(center.y);
    expect(before).toBeTruthy();

    await setViewOptions(page, { rowHeight: 80 });
    expect(await rowAt(center.y)).toBe(before);
  });

  test("header date follows the date range and the day buttons", async ({ page }) => {
    await page.locator(".time-picker").click();
    const panel = page.locator(".el-date-range-picker").filter({ visible: true });
    const rightCells = panel.locator(".el-date-range-picker__content.is-right td.available");
    await rightCells.nth(0).click();
    await rightCells.nth(4).click();
    await expect(panel).toBeHidden();

    const start = new Date((await getState(page)).firstBlockStart);
    const label = (date) =>
      `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const firstDay = new Date(start.getFullYear(), start.getMonth(), 1);
    const currentDate = page.locator(".current-date");
    await expect(currentDate).toHaveText(label(firstDay));

    await page.getByRole("button", { name: "Next day" }).click();
    await expect(currentDate).toHaveText(label(new Date(firstDay.getTime() + 24 * 3600 * 1000)));
    await page.getByRole("button", { name: "Previous day" }).click();
    await expect(currentDate).toHaveText(label(firstDay));
  });
});
