const dynamicRender = {
  props: {
    scrollTop: {
      type: Number,
      required: true
    },
    heightOfBlocksWrapper: {
      type: Number,
      required: true
    },
    isOpen: {
      type: Boolean,
      default: true
    },
    cellHeight: {
      type: Number,
      required: true
    },
    datas: {
      type: Array,
      required: true
    },
    // Load all rows when set to 0
    // Preload count applies to both before and after
    preload: {
      type: Number,
      default: 1
    },
    totalHeight: {
      type: Number,
      default: 0
    },
    groupIndex: Number
  },

  data() {
    return {
      // First node loaded in previous render
      wrapperElement: null,
      oldTopIndex: 0,
      startRenderNum: 0,
      endRenderNum: 0,
      topSpace: 0,
      renderPosition: [],
      top: 0,
      bottom: 0
    };
  },

  computed: {
    // Calculate index of first visible row
    showDatas() {
      const { startRenderNum, endRenderNum, datas } = this;
      return datas.slice(startRenderNum, endRenderNum);
    }
  },

  watch: {
    scrollTop() {
      this.sliceData();
    },
    datas() {
      this.sliceData();
    },
    totalHeight() {
      this.$nextTick(() => {
        this.sliceData();
      });
    },
    heightOfBlocksWrapper() {
      this.sliceData();
    },
    cellHeight() {
      this.sliceData();
    },
    preload() {
      this.sliceData();
    }
  },

  created() {
    this.sliceData();
  },
  mounted() {
    this.wrapperElement = this.$refs.wrapperElement || null;
  },

  methods: {
    /**
     * Split out data that should be shown in DOM
     */
    sliceData() {
      const {
        heightOfBlocksWrapper,
        cellHeight,
        preload,
        datas,
        scrollTop,
        groupIndex,
        datas: groupDatas
      } = this;

      // No height means no need to render elements
      if (heightOfBlocksWrapper === 0 || cellHeight === 0) {
        this.startRenderNum = 0;
        this.endRenderNum = 0;
        return;
      }

      // Render all when set to 0
      if (preload === 0) {
        this.startRenderNum = 0;
        this.endRenderNum = datas.length;
        return;
      }

      // Calculate the start position of the group relative to the container
      // This is a fixed value for each group, assuming row heights are constant
      let groupTop = 0;
      const allDatas = this.$parent.datas || [];
      for (let i = 0; i < groupIndex; i++) {
        const group = allDatas[i];
        const groupRows = group.isOpen ? (group.children ? group.children.length : 0) + 1 : 1;
        groupTop += groupRows * cellHeight;
      }

      const groupHeight = (this.isOpen ? groupDatas.length + 1 : 1) * cellHeight;
      const groupBottom = groupTop + groupHeight;

      const viewportTop = scrollTop;
      const viewportBottom = scrollTop + heightOfBlocksWrapper;

      // If the group is completely outside the viewport
      if (groupBottom < viewportTop || groupTop > viewportBottom) {
        this.startRenderNum = 0;
        this.endRenderNum = 0;
        return;
      }

      // Calculate relative viewport within the group
      // The group header takes 1 cellHeight
      const relativeViewportTop = Math.max(0, viewportTop - groupTop - cellHeight);
      const relativeViewportBottom = Math.min(groupHeight, viewportBottom - groupTop - cellHeight);

      const startRenderNum = Math.floor(relativeViewportTop / cellHeight) - preload;
      this.startRenderNum = Math.max(0, startRenderNum);

      const endRenderNum = Math.ceil(relativeViewportBottom / cellHeight) + preload;
      this.endRenderNum = Math.min(datas.length, endRenderNum);
    }
  }
};

export default dynamicRender;

