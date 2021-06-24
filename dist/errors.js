import { $ok } from "./commons";
// TODO: several singletons for each kind of errors...
export class UniqueError extends Error {
    constructor(message) {
        super(message);
    }
    static singleton() {
        if (!$ok(this.__instance)) {
            this.__instance = new UniqueError('ESINGLETONERROR');
        }
        return this.__instance;
    }
}
//# sourceMappingURL=errors.js.map