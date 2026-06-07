class EventBus {
    constructor() {
        this.events = {};
    }
    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(cb => cb(data));
    }
}

export const eventBus = new EventBus();
