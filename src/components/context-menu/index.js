import { defineComponent, h, onBeforeUnmount, ref } from "vue";

const openedMenus = new Set();

function hideAllMenus() {
  openedMenus.forEach((menuRef) => menuRef?.hide());
}

if (typeof window !== "undefined") {
  window.addEventListener("click", hideAllMenus);
  window.addEventListener("contextmenu", hideAllMenus);
  window.addEventListener("resize", hideAllMenus);
}

const VContextmenu = defineComponent({
  name: "VContextmenu",
  setup(_, { slots, expose }) {
    const visible = ref(false);
    const x = ref(0);
    const y = ref(0);

    const show = (positionX, positionY) => {
      x.value = positionX;
      y.value = positionY;
      visible.value = true;
      openedMenus.add(api);
    };

    const hide = () => {
      visible.value = false;
      openedMenus.delete(api);
    };

    const api = { show, hide };
    expose(api);

    onBeforeUnmount(() => {
      openedMenus.delete(api);
    });

    return () =>
      h(
        "div",
        {
          class: "v-contextmenu",
          style: {
            display: visible.value ? "block" : "none",
            left: `${x.value}px`,
            top: `${y.value}px`
          }
        },
        slots.default ? slots.default() : []
      );
  }
});

const VContextmenuItem = defineComponent({
  name: "VContextmenuItem",
  props: {
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ["click"],
  setup(props, { slots, emit }) {
    const handleClick = (event) => {
      if (props.disabled) return;
      emit("click", event);
      hideAllMenus();
    };

    return () =>
      h(
        "div",
        {
          class: ["v-contextmenu-item", { disabled: props.disabled }],
          onClick: handleClick
        },
        slots.default ? slots.default() : []
      );
  }
});

const contextmenuDirective = {
  mounted(el, binding) {
    const listener = (event) => {
      event.preventDefault();
      event.stopPropagation();

      const menuRefName = binding.arg;
      const ctx = binding.instance;
      const menu = menuRefName && ctx && ctx.$refs ? ctx.$refs[menuRefName] : null;
      if (menu && typeof menu.show === "function") {
        menu.show(event.clientX, event.clientY);
      }
    };

    el.__vContextmenuListener__ = listener;
    el.addEventListener("contextmenu", listener);
  },
  unmounted(el) {
    el.removeEventListener("contextmenu", el.__vContextmenuListener__);
    delete el.__vContextmenuListener__;
  }
};

export default {
  install(app) {
    app.component("v-contextmenu", VContextmenu);
    app.component("v-contextmenu-item", VContextmenuItem);
    app.directive("contextmenu", contextmenuDirective);
  }
};
