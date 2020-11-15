import { NOOP } from "./types";

export default function createEmitter() {
  let all = new Map();
  let lastEvent;
  let lastEmitter;

  function get(event) {
    if (lastEvent === event) return lastEmitter;
    let emitter = all.get(event);
    lastEvent = event;
    if (emitter) return (lastEmitter = emitter);

    let listeners = [];
    let mutatingListeners;
    let notifying = 0;
    let lastPayload;
    let sealed = false;

    function on(listener) {
      if (sealed) {
        listener(lastPayload);
        return NOOP;
      }
      let isActive = true;

      getMutableListeners().push(listener);

      return () => {
        if (!isActive) return;
        isActive = false;
        let l = getMutableListeners();
        let index = l.indexOf(listener);
        index !== -1 && l.splice(index, 1);
      };
    }

    function getMutableListeners() {
      if (!notifying) return listeners;
      if (mutatingListeners) return mutatingListeners;
      mutatingListeners = listeners.slice(0);
      return mutatingListeners;
    }

    function length() {
      return (mutatingListeners || listeners).length;
    }

    function notify(payload) {
      try {
        notifying++;
        let length = listeners.length;
        if (typeof payload === "function") {
          for (let i = 0; i < length; i++) {
            payload(listeners[i]);
          }
        } else {
          for (let i = 0; i < length; i++) {
            listeners[i](payload);
          }
        }
      } finally {
        notifying--;
        if (!notifying && mutatingListeners) {
          listeners = mutatingListeners;
          mutatingListeners = undefined;
        }
      }
    }

    function emit(payload) {
      !sealed && notify(payload);
    }

    function clear() {
      getMutableListeners().length = 0;
    }

    function once(listener) {
      let remove = on(function () {
        remove();
        return listener.apply(this, arguments);
      });
      return remove;
    }

    function emitOnce(payload) {
      if (sealed) return;
      sealed = true;
      lastPayload = payload;
      notify(payload);
      clear();
    }

    lastEmitter = emitter = {
      on,
      emit,
      emitOnce,
      clear,
      once,
      length,
    };
    all.set(event, emitter);
    return emitter;
  }

  function on(event, listener = NOOP) {
    return get(event).on(listener);
  }

  function emit(event, payload) {
    return get(event).emit(payload);
  }

  function emitOnce(event, payload) {
    return get(event).emitOnce(payload);
  }

  function once(event, listener = NOOP) {
    return get(event).once(listener);
  }

  function has(event) {
    let emitter = all.get(event);
    return emitter && emitter.length();
  }

  return {
    on,
    once,
    emit,
    emitOnce,
    get,
    has,
    clear(event) {
      if (event) {
        // clear specified event listeners
        get(event).clear();
        delete all[event];
      } else {
        // clear all event listeners
        all = {};
      }
    },
  };
}
