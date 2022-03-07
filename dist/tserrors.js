import { $ok } from "./commons";
// TODO: several singletons for each kind of errors...
export class TSUniqueError extends Error {
    constructor(message) {
        super(message);
    }
    static singleton() {
        if (!$ok(this.__instance)) {
            this.__instance = new TSUniqueError('ESINGLETONERROR');
        }
        return this.__instance;
    }
}
//# sourceMappingURL=tserrors.js.map