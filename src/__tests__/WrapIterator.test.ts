import { mapIterator } from "../ArrayMap";

it("wraps lazily", () => {
  const xs = [1,2,3,4,5].values();
  let trip = false;
  const printXs = mapIterator(xs, x => {
    trip = true;
    return x;
  });
  expect(trip).toEqual(false);
});