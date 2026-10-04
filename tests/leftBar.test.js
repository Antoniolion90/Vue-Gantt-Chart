// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import LeftBar from "@/components/v-gantt/left-bar/index.vue";

function mountLeftBar(props = {}) {
  const bus = { $emit: vi.fn() };
  const wrapper = mount(LeftBar, {
    props: {
      datas: [],
      scrollTop: 0,
      heightOfBlocksWrapper: 0,
      cellHeight: 20,
      groupIndex: 2,
      ...props
    },
    global: {
      config: { globalProperties: { $bus: bus } }
    }
  });
  return { wrapper, bus };
}

describe("LeftBar group toggle", () => {
  it("shows a visible collapse button for an open group", () => {
    const { wrapper } = mountLeftBar({ isOpen: true });
    const button = wrapper.get("button.btn-toggle");
    expect(button.text()).toBe("▼");
    expect(button.attributes("aria-expanded")).toBe("true");
    expect(button.attributes("aria-label")).toBe("Collapse group");
  });

  it("shows a visible expand button for a closed group", () => {
    const { wrapper } = mountLeftBar({ isOpen: false });
    const button = wrapper.get("button.btn-toggle");
    expect(button.text()).toBe("▶");
    expect(button.attributes("aria-expanded")).toBe("false");
  });

  it("requests toggling its group on click", async () => {
    const { wrapper, bus } = mountLeftBar({ isOpen: true });
    await wrapper.get("button.btn-toggle").trigger("click");
    expect(bus.$emit).toHaveBeenCalledWith("toggleGroupOpen", 2);
  });
});
