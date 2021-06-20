export type Key = number | string;

export function mapIterator<T, U>(itT: IterableIterator<T>, fn: (t: T, idx: number) => U): IterableIterator<U> {
    let idx = 0;
    const next: () => IteratorResult<U> = () => {
        const n = itT.next();
        const t: T = n.value;
        if (!n.done) {
            const res = {done: false, value: fn(t, idx)}
            idx++
            return res;
        }
        else return {done: true, value: undefined};
    };
    return {
        next: next,
        [Symbol.iterator]: function () {
            return this;
        }
    };
}

class ArrayMap<T, K extends Key> {
    private readonly ts: [K, T][];
    private indexesByKey: Map<K, number>;
    private keysByIndex: Map<number, K>;

    readonly identify: (t: T) => K;

    /**
     * Requires that `key` is not already present
     */
    private doPush(index: number, key: K, t: T): void {
        this.ts.push([key, t]);
        this.indexesByKey.set(key, index);
        this.keysByIndex.set(index, key);
    }

    private updateIndexOfKey(key: K, index: number): void {
        this.indexesByKey.set(key, index);
        this.keysByIndex.set(index, key);
    }

    private clearIndexOfKey(key: K): void {
        this.indexesByKey.delete(key);
    }

    /**
     * Create an ArrayMap from an iterator
     * with elements of type T and keys of type K, provided a function `identify` mapping T to K.
     */
    constructor(entries: IterableIterator<[K, T]>, identify: (t: T) => K) {
        this.ts = []
        this.indexesByKey = new Map();
        this.keysByIndex = new Map();
        let idx = 0;
        for (const [k, t] of entries) {
            if (this.indexOfKey(k) === undefined) {
                this.doPush(idx, k, t);
                idx++;
            }
        }
        this.identify = identify;
    }

    /**
     * Create an ArrayMap from an iterator with elements of type T, provided a function `identify` mapping T to K.
     */
    static fromValueIterator<T, K extends Key>(items: IterableIterator<T>, identify: (t: T) => K) {
        const entriesIterator = mapIterator(items, i => [identify(i), i] as [K, T]);
        return new ArrayMap(entriesIterator, identify);
    }

    /**
     * Create an ArrayMap from an Array with elements of type T and keys of type K, provided a function `identify` mapping T to K.
     */
    static fromArray<T, K extends Key>(items: T[], identify: (t: T) => K) {
        return this.fromValueIterator<T, K>(items.values(), identify);
    }

    /**
     * Return a clone of the given ArrayMap
     */
    static clone<T, K extends Key>(that: ArrayMap<T, K>): ArrayMap<T, K> {
        return new ArrayMap(that.entries(), that.identify);
    }

    /**
     * Get an empty ArrayMap of type <T, K>
     */
    static empty<T, K extends Key>(identify: (t: T) => K): ArrayMap<T, K> {
        return ArrayMap.fromArray([], identify);
    }

    /**
     * Return a clone of this ArrayMap
     */
    public clone(): ArrayMap<T, K> {
        return ArrayMap.clone(this);
    }

    /**
     * Iterator over values only
     */
    public [Symbol.iterator](): IterableIterator<T> {
        return this.values();
    }

    /**
     * Get an array of the values
     */
    public array(): T[] {
        return Array.from(this);
    }

    /**
     * Iterator over keys only
     */
    public keys(): IterableIterator<K> {
        return mapIterator(this.entries(), pair => pair[0]);
    }

    /**
     * Iterator over values only
     */
    public values(): IterableIterator<T> {
        const iter: IterableIterator<[K, T]> = this.ts.values();
        return mapIterator(iter, pair => pair[1]);
    }

    /**
     * Iterator over pairs of Keys and Values of type [K, T]
     */
    public entries(): IterableIterator<[K, T]> {
        return this.ts.values();
    }

    /**
     * Returns true if and only if there are no elements in this collection
     */
    public isEmpty(): boolean {
        return this.ts.length === 0;
    }

    /**
     * Returns true if and only if there are elements in this collection
     */
    public nonEmpty(): boolean {
        return this.ts.length !== 0;
    }

    /**
     * Returns the number of elements in this collection
     */
    get length(): number {
        return this.ts.length;
    }

    /**
     * Returns the number of elements in this collection
     */
    public size(): number {
        return this.length;
    }

    /**
     * Searches for key, returning the index of the element with that key, if it exists, and undefined otherwise.
     */
    public indexOfKey(key: K): number | undefined {
        return this.indexesByKey.get(key);
    }

    /**
     * Searches for value by key, returning the index if it exists, and undefined otherwise.
     */
    public indexOf(t: T): number | undefined {
        const key = this.identify(t);
        return this.indexOfKey(key);
    }

    /**
     * Standard index operation, properly returning undefined if index is out of bounds.
     */
    public getAtIndex(index: number): T | undefined {
        const item = this.ts[index];
        if (item === undefined) return undefined;
        else return item[1];
    }

    /**
     * Removes the element at index `index`, returning true if it existed, false otherwise.
     */
    public removeAtIndex(index: number): boolean {
        const key = this.keysByIndex.get(index);
        if (key) {
            this.remove(key);
            return true;
        } else {
            return false;
        }
    }

    /**
     * Returns the first element of this collection, or undefined if empty
     */
    public head(): T | undefined {
        return this.getAtIndex(0);
    }

    // I can't make much sense of how to do a .map that returns an ArrayMap
    // without asking for a new ID function...
    // public map<U>(fn: (value: T, index: number) => U): ArrayMap<T, K> {
    //     const iter = this.ts.values();
    //     let idx = 0;
    //     const mapped = mapIterator(iter, pair => {
    //        const [k, t] = pair;
    //        const u = fn(t, idx);
    //        idx++;
    //        return [k, u];
    //     });
    //     return new ArrayMap(mapped, this.identify);
    // }

    public map<U>(fn: (value: T, index: number) => U): U[] {
        return this.ts.map((pair, idx) => fn(pair[1], idx));
    }

    public forEach(fn: (t: T, index: number) => void): void {
        // @TODO: Use Function.length to accept 3rd argument efficiently
        // if (fn.length === 3) { ... }
        return this.ts.forEach((pair, idx) => fn(pair[1], idx));
    }

    /**
     * Filter by predicate `fn`. Keep trues.
     */
    public filter(fn: (t: T, index: number) => boolean): ArrayMap<T, K> {
        const copy = ArrayMap.empty<T, K>(this.identify);
        let idx = 0;
        for (const [k, t] of this.entries()) {
            if (fn(t, idx)) copy.doPush(copy.length, k, t);
            idx += 1;
        }
        return copy;
    }

    /**
     * Update the value at key K using newT, either a function of type T => T or a new T.
     */
    public update(key: K, newT: ((t: T) => T) | T): void {
        const index = this.indexOfKey(key);
        let updated;
        if (typeof newT === "function") {
            const f = newT as (t: T) => T;
            const [k, t] = this.ts[index];
            updated = [k, f(t)];
        } else {
            updated = [key, newT];
        }
        this.ts[index] = updated;
    }

    /**
     * Add t to the collection, at an unspecified location
     */
    public put(t: T): void {
        const key = this.identify(t);
        const exists = this.contains(key);
        if (exists) {
            this.update(key, t);
        } else {
            this.push(t);
        }
    }

    /**
     * Inserts at end, skipping duplicates
     */
    public push(...items: T[]): void {
        let n = this.length;
        for (const t of items) {
            const key = this.identify(t);
            if (this.indexOfKey(key) === undefined) {
                this.doPush(n, key, t);
                n++;
            }
        }
    }

    public contains(key: K): boolean {
        return this.indexesByKey.has(key);
    }

    public get(key: K): T | undefined {
        const idx = this.indexesByKey.get(key);
        if (idx) return this.getAtIndex(idx);
        else return undefined;
    }

    public remove(key: K): boolean {
        const start = this.indexOfKey(key);
        if (start) {
            this.ts.splice(start, 1);
            this.clearIndexOfKey(key);
            let n = start;
            while (n < this.length) {
                let [k, _t] = this.ts[n];
                this.updateIndexOfKey(k, n);
                n++;
            }
            return true;
        } else {
            return false;
        }
    }

    public sortByKey(): ArrayMap<T, K> {
        const arr = Array.from(this.ts.values());
        arr.sort((a, b) => {
            const aKey = a[0];
            if (typeof aKey === "string") {
                // String
                return aKey.localeCompare(b[0] as string);
            } else {
                // Number
                return (aKey as number) - (b[0] as number);
            }
        });
        return new ArrayMap(arr.values(), this.identify);
    }

    /**
     * Map and Filter in one pass.
     * Note: Key type cannot change. for that, make a new collection
     */
    public collect<U>(fn: (t: T) => U | undefined, identify: (u: U) => K): ArrayMap<U, K> {
        const res: [K, U][] = [];
        for (const t of this.values()) {
            const maybeU = fn(t);
            if (maybeU) res.push([identify(maybeU), maybeU]);
        }
        return new ArrayMap(res.values(), identify);
    }

    /**
     * Map and Filter in one pass. Returns a standard Array
     * Note: Key type cannot change. for that, make a new collection
     */
    public collectToArray<U>(fn: (t: T) => U | undefined): U[] {
        const res: U[] = [];
        for (const t of this.values()) {
            const maybeU = fn(t);
            if (maybeU) res.push(maybeU);
        }
        return res;
    }

    /**
     * A left-to-right fold.
     */
    public fold<A>(initial: A, step: (a: A, t: T) => A): A {
        let acc: A = initial;
        for (const t of this) {
            acc = step(acc, t);
        }
        return acc;
    }

    /**
     * Standard reduce; initial value optional.
     * Throws if empty and no initial value provided.
     */
    public reduce(step: (t1: T, t2: T) => T, initial?: T): T {
        const xs = this.array();
        if (!initial && xs.length === 0) {
            throw "reduce of empty collection with no initial value provided";
        }
        let acc = initial ? step(initial, xs[0]) : xs[0];
        let i = 1;
        while (i < xs.length) {
            acc = step(acc, xs[i]);
            i++;
        }
        return acc;
    }

    /**
     * Returns a Map of K2s to Ts, keyed by the given function
     */
    public groupBy<K2>(fn: (t: T) => K2): Map<K2, T[]> {
        const map = new Map<K2, T[]>();
        for (const t of this) {
            const key = fn(t);
            const collection = map.get(key);
            if (!collection) {
                map.set(key, [t]);
            } else {
                collection.push(t);
            }
        }
        return map;
    }

    /**
     * See Array.slice
     */
    public slice(start?: number, end?: number): ArrayMap<T, K> {
        const arr = Array.from(this.entries()).slice(start, end);
        return new ArrayMap(arr.values(), this.identify);
    }

    /**
     * See Array.splice
     */
    public splice(start: number, deleteCount: number, ...items: T[]): ArrayMap<T, K> {
        const toInsert: [K, T][] = items.map(i => [this.identify(i), i]);
        const newTs = [...this.ts];
        newTs.splice(start, deleteCount, ...toInsert);
        return new ArrayMap(newTs.values(), this.identify);
    }

    /**
     * Prepends the given items.
     * In the event of a duplicate key, the provided argument elements get priority
     */
    public prepend(...items: T[]): ArrayMap<T, K> {
        const newItems: [K, T][] = [];
        for (const t of items) {
            newItems.push([this.identify(t), t]);
        }
        return new ArrayMap([...newItems, ...Array.from(this.entries())].values(), this.identify);
    }
}

export default ArrayMap;