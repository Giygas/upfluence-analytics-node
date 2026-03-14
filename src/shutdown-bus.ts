import EventEmitter from "events";
export const shutdownBus = new EventEmitter();
shutdownBus.setMaxListeners(0);
