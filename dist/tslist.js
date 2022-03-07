import { $compare, $equal, $jsonobj, $length, $ok, $string } from "./commons";
import { TSRootObject } from "./tsobject";
import { Ascending, Descending, Same } from "./types";
export class TSListNode {
    constructor(data) {
        this.data = data;
        this.next = null;
        this.prev = null;
    }
    // ============ TSObject conformance =============== 
    get isa() { return this.constructor; }
    get className() { return this.constructor.name; }
    isEqual(other) {
        return this === other || (other instanceof TSListNode && $equal(other.data, this.data));
    }
    compare(other) {
        if (this === other) {
            return Same;
        }
        return (other instanceof TSListNode) ? $compare(this.data, other.data) : undefined;
    }
    toJSON() { return $jsonobj(this.data); }
    toString() { return $string(this.data); }
    toArray() { return [this]; }
}
export class TSList extends TSRootObject {
    constructor() {
        super(...arguments);
        this._f = null;
        this._l = null;
        this._n = 0;
    }
    get length() { return this._n; }
    get count() { return this._n; }
    get first() { return this._f; }
    get last() { return this._l; }
    insert(data, before) {
        const node = new TSListNode(data);
        if (!this._f) {
            if ($ok(before))
                throw 'Try to insert before a non existing node';
            this._f = this._l = node;
            this._n = 1;
        }
        else if (!$ok(before) || before === this._f) {
            this._f.prev = node;
            node.next = this._f;
            this._f = node;
            node.prev = null;
            this._n++;
        }
        /* warning, we dont verify the node appartenance here */
        else {
            const prev = before.prev;
            prev.next = node;
            node.prev = prev;
            node.next = before;
            before.prev = node;
            this._n++;
        }
        return node;
    }
    add(data) {
        if (!this._f)
            return this.insert(data);
        const node = new TSListNode(data);
        this._l.next = node;
        node.prev = this._l;
        this._l = node;
        this._n++;
        return node;
    }
    /* warning, we dont verify the node appartenance here */
    removeNode(node) {
        if (node === this._f) {
            this._f = node.next;
            if (this._f)
                this._f.prev = null;
            else
                this._l = null;
        }
        else if (node === this._l) {
            this._l = node.prev;
            if (this._l)
                this._l.next = null;
            else
                this._f = null; // should never occur
        }
        else {
            const previous = node.prev;
            const succ = node.next;
            previous.next = succ;
            succ.prev = previous;
        }
        this._n--;
        node.next = node.prev = null; // remove useless pointers
    }
    clear() {
        let l = this._f;
        if (l != null) {
            while (l.next !== null) {
                l.prev = null;
                l = l.next;
                l.prev.next = null;
            }
            this._f = this._l = null;
            this._n = 0;
        }
    }
    forEach(callback) {
        if (this._f) {
            const traverseMe = (node) => {
                callback(node.data);
                if (node.next)
                    traverseMe(node.next);
            };
            traverseMe(this._f);
        }
    }
    search(callback) {
        if (this._f) {
            const findMe = (node) => {
                if (callback(node.data))
                    return node;
                return node.next ? findMe(node.next) : null;
            };
            return findMe(this._f);
        }
        return null;
    }
    // ============ TSObject conformance =============== 
    isEqual(other) {
        if (this === other) {
            return true;
        }
        if (!(other instanceof TSList) || this._n !== other.count) {
            return false;
        }
        let a = this._f;
        let b = other.first;
        while (a !== null && b !== null) {
            if (!a.isEqual(b)) {
                return false;
            }
            a = a.next;
            b = b.next;
        }
        return a === null && b === null;
    }
    compare(other) {
        if (this === other) {
            return Same;
        }
        if (!(other instanceof TSList)) {
            return undefined;
        }
        let a = this._f;
        let b = other.first;
        while (a !== null && b !== null) {
            const c = a.compare(b);
            if (c !== Same) {
                return c;
            }
            a = a.next;
            b = b.next;
        }
        return a === null ? (b === null ? Same : Ascending) : Descending;
    }
    toString(opts = { prefix: '(', separator: ',', suffix: ')' }) {
        let s = $ok(opts.prefix) ? opts.prefix : '';
        if (!$ok(opts.printer))
            opts.printer = d => d.toString();
        if (this._f) {
            const hasSepa = $length(opts.separator) > 0;
            const printMe = (node) => {
                const element = opts.printer(node.data);
                if ($ok(element)) {
                    s = s + element;
                }
                if (node.next !== null) {
                    if (hasSepa) {
                        s = s + opts.suffix;
                    }
                    printMe(node.next);
                }
            };
            printMe(this._f);
        }
        if ($length(opts.suffix))
            s = s + opts.suffix;
        return s;
    }
    toJSON() { return this.toArray(e => $jsonobj(e)); }
    toArray(map) {
        let array = [];
        if (this._f) {
            const addMe = (node) => {
                if (map) {
                    const v = map(node.data);
                    if ($ok(v))
                        array.push(v);
                }
                else
                    array.push(node.data);
                if (node.next)
                    addMe(node.next);
            };
            addMe(this._f);
        }
        return array;
    }
}
//# sourceMappingURL=tslist.js.map