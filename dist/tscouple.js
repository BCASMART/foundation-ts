import { $compare, $equal, $json, $jsonobj } from "./commons";
import { Same } from "./types";
/**
 * OK, right, JS Tupples are more flexible than a TSCouple
 * object but, you known, it's still impossible to check
 * if a variable is a tupple or not... so TSCouple is a class
 * and instanceof works.
 */
export class TSCouple {
    constructor(first, second) {
        this.first = first;
        this.second = second;
    }
    // ============ TSObject conformance =============== 
    get isa() { return this.constructor; }
    get className() { return this.constructor.name; }
    isEqual(other) {
        return this === other || (other instanceof TSCouple && $equal(other.first, this.first) && $equal(other.second, this.second));
    }
    compare(other) {
        if (this.isEqual(other)) {
            return Same;
        }
        else if (other instanceof TSCouple) {
            const c = $compare(this.first, other.first);
            return c === Same ? $compare(this.second, other.second) : c;
        }
        return undefined;
    }
    toString() { return $json(this); }
    toJSON() { return { first: $jsonobj(this.first), second: $jsonobj(this.second) }; }
    toArray() { return [this.first, this.second]; }
}
//# sourceMappingURL=tscouple.js.map