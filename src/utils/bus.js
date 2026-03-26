import mitt from "mitt";

const emitter = mitt();

const bus = {
  $on(event, handler) {
    emitter.on(event, handler);
  },
  $off(event, handler) {
    emitter.off(event, handler);
  },
  $emit(event, payload) {
    emitter.emit(event, payload);
  }
};

export default bus;
