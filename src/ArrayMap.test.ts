import ArrayMap from "./ArrayMap";
interface Cat {
    id: number;
    name: string;
}
const idCat: (c: Cat) => number = c => c.id;
const bob = { id: 1, name: "Bob" };
const jane = { id: 2, name: "Jane" };
const derek = { id: 3, name: "Derek" };
const sue = { id: 4, name: "Sue" };
const emptyCats = ArrayMap.empty(idCat);

interface Dog {
    id: string;
    name: string;
}
const idDog: (d: Dog) => string = d => d.id;
const tucker = { id: "d0", name: "tucker" };
const daisy = { id: "d1", name: "daisy" };

it("empty", () => {
    expect(emptyCats.empty()).toEqual(true);
    expect(ArrayMap.fromArray([1, 2, 3], x => x).empty()).toEqual(false);
});
it("nonEmpty", () => {
    expect(emptyCats.nonEmpty()).toEqual(false);
    expect(ArrayMap.fromArray([1, 2, 3], x => x).nonEmpty()).toEqual(true);
});
it("length", () => {
    expect(emptyCats.length).toEqual(0);
    const xs = ArrayMap.fromArray([1, 2, 3], x => x);
    expect(xs.length).toEqual(3);
    xs.put(6);
    expect(xs.length).toEqual(4);
    xs.put(6);
    expect(xs.length).toEqual(4);
});
it("clone", () => {
    const xs = ArrayMap.fromArray([bob, jane, derek], idCat);
    expect(xs.clone().array()).toEqual(xs.array());
    expect(xs.clone().length).toEqual(xs.length);
});
it("indexOf", () => {
    const xs = ArrayMap.fromArray([1, 2, 3], x => x);
    expect(xs.indexOf(1)).toEqual(0);
    expect(xs.indexOf(2)).toEqual(1);
    expect(xs.indexOf(3)).toEqual(2);

    expect(xs.indexOf(0)).toEqual(-1);
    expect(xs.indexOf(4)).toEqual(-1);
});
it("indexOfKey", () => {
    const xs = ArrayMap.fromArray([bob, jane, derek], idCat);
    expect(xs.indexOfKey(bob.id)).toEqual(0);
    expect(xs.indexOfKey(jane.id)).toEqual(1);
    expect(xs.indexOfKey(derek.id)).toEqual(2);

    expect(xs.indexOfKey(0)).toEqual(-1);
    expect(xs.indexOfKey(4)).toEqual(-1);
});
it("head", () => {
    const xs = ArrayMap.fromArray([bob, jane, derek], idCat);
    expect(xs.head()).toEqual(bob);
    expect(ArrayMap.empty(idCat).head()).toEqual(undefined);
});
it("ArrayMap.map", () => {
    const xs = ArrayMap.fromArray([1, 2, 3], x => x);
    expect(xs.map(x => x + 1)).toEqual([2, 3, 4]);
    expect(xs.map((x, idx) => idx)).toEqual([0, 1, 2]);
});
it("set", () => {
    const xs = ArrayMap.empty(idCat);
    xs.push(bob);
    xs.push(jane);
    xs.push(bob);
    expect(xs.array()).toEqual([jane, bob]);
});
it("update", () => {
    const xs = ArrayMap.empty(idCat);
    xs.put(bob);
    xs.put(jane);
    xs.update(jane.id, j => ({ ...j, name: "JaneXXX" }));
    expect(xs.get(jane.id)).toEqual({ id: jane.id, name: "JaneXXX" });
});
it("spread", () => {
    const xs: ArrayMap<Cat, number> = ArrayMap.fromArray([bob], idCat);
    const withJane = [...xs, jane];
    expect(withJane).toEqual([bob, jane]);
});
it("fold", () => {
    const xs = ArrayMap.fromArray([1, 2, 3, 4, 5, 6, 7], x => x);
    const weirdSum = xs.fold(20, (a, b) => a + b);
    expect(weirdSum).toEqual(48);
});
it("reduce", () => {
    const xs = ArrayMap.fromArray([bob, derek], idCat);
    const concatName = xs.reduce((x1, x2) => ({ id: 1, name: x1.name + x2.name }));
    expect(concatName).toEqual({ id: 1, name: bob.name + derek.name });
});
it("sortByKey - number", () => {
    const xs = ArrayMap.fromArray([derek, bob], idCat);
    expect(xs.sortByKey().array()).toEqual([bob, derek]);
});
it("sortByKey - string", () => {
    const xs = ArrayMap.fromArray([daisy, tucker], idDog);
    expect(xs.sortByKey().array()).toEqual([tucker, daisy]);
});
it("groupBy", () => {
    const xs = ArrayMap.fromArray([bob, jane, derek], idCat);
    const groups = xs.groupBy(k => k.name);
    expect(groups.get(bob.name)).toEqual([bob]);
    expect(groups.get(jane.name)).toEqual([jane]);
    expect(groups.get(derek.name)).toEqual([derek]);
});
it("slice plain", () => {
    const xs = ArrayMap.fromArray([bob, jane, derek], idCat);
    expect(xs.slice().array()).toEqual(xs.array());
});
it("slice start", () => {
    const xs = ArrayMap.fromArray([bob, jane, derek], idCat);
    expect(xs.slice(1).array()).toEqual([jane, derek]);
});
it("slice start end", () => {
    const xs = ArrayMap.fromArray([bob, jane, derek], idCat);
    expect(xs.slice(1, 2).array()).toEqual([jane]);
});
it("splice removal", () => {
    const xs = ArrayMap.fromArray([bob, jane, derek], idCat);
    expect(xs.splice(0, 2).array()).toEqual([derek]);
});
it("splice insert", () => {
    const xs = ArrayMap.fromArray([bob, jane, derek], idCat);
    const result = xs.splice(0, 0, sue);
    expect(result.array()).toEqual([sue, bob, jane, derek]);
});
it("unshift", () => {
    const xs = ArrayMap.fromArray([bob, jane, derek], idCat);
    expect(xs.unshift(sue, jane).array()).toEqual([sue, jane, bob, derek]);
});