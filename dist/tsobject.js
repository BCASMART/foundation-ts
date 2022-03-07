import { $json, $jsonobj } from "./commons";
import { Same } from "./types";
export class TSRootObject {
    get isa() { return this.constructor; }
    get className() { return this.constructor.name; }
    compare(other) { return this.isEqual(other) ? Same : undefined; }
    isEqual(other) { return this === other; }
    toString() { return $json(this); }
    toJSON() {
        const keys = Object.getOwnPropertyNames(this);
        let ret = {};
        for (let k of keys) {
            ret[k] = $jsonobj(this[k]);
        }
        return ret;
    }
    toArray() { return [this]; }
}
//# sourceMappingURL=tsobject.js.map