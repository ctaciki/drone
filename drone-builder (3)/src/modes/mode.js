export class Mode {
    constructor(name) {
        this.name = name;
        this.active = false;
    }
    enter(data) { this.active = true; }
    exit() { this.active = false; }
}
