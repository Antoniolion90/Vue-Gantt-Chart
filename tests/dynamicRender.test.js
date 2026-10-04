import { describe, it, expect } from "vitest";
import dynamicRender from "@/components/v-gantt/mixin/dynamic-render.js";

const rows = (count) => Array.from({ length: count }, (_, id) => ({ id }));

// Run sliceData on a plain object with the mixin's props and return the rendered range
function slice(props) {
  const ctx = {
    heightOfBlocksWrapper: 100,
    cellHeight: 20,
    preload: 1,
    scrollTop: 0,
    groupTop: 0,
    isOpen: true,
    datas: rows(100),
    ...props
  };
  dynamicRender.methods.sliceData.call(ctx);
  return [ctx.startRenderNum, ctx.endRenderNum];
}

describe("dynamic-render sliceData", () => {
  it("renders the visible rows plus preload below the group header", () => {
    // Viewport 0..120 (one extra row), the header takes 20px: rows 0..5, plus one preloaded
    expect(slice({})).toEqual([0, 6]);
  });

  it("follows the scroll position", () => {
    // Viewport 400..520 is rows 19..25 of the group, preload adds one on each side
    expect(slice({ scrollTop: 400 })).toEqual([18, 26]);
  });

  it("does not go past the group rows", () => {
    expect(slice({ datas: rows(3) })).toEqual([0, 3]);
    expect(slice({ scrollTop: 1960 })).toEqual([96, 100]);
  });

  it("renders nothing for a group outside the viewport", () => {
    expect(slice({ groupTop: 1000 })).toEqual([0, 0]);
    expect(slice({ scrollTop: 5000 })).toEqual([0, 0]);
  });

  it("renders nothing for a collapsed group or before the size is known", () => {
    expect(slice({ isOpen: false })).toEqual([0, 0]);
    expect(slice({ heightOfBlocksWrapper: 0 })).toEqual([0, 0]);
  });

  it("renders all rows when preload is 0", () => {
    expect(slice({ preload: 0, scrollTop: 5000 })).toEqual([0, 100]);
  });
});
