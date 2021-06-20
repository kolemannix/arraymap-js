# What

A thin wrapper around Array and some Maps that provides relatively efficient array-like and map-like 
methods and functions. Index-based operations and key-based operations are both usually constant time.

# Why

My JavaScript and TypeScript work is all frontend work, specifically single page apps with React.
When working on such applications, almost all the data I work with has an "id" field of some kind.
This is usually a `string`, `number`, or `uuid`, which I just model as a `string` in TS.

I find myself needing to update or remove elements by ID, but also needing array-like operations 
such as `map` and `filter` (plus some other operations that I miss from other languages!). Sometimes
I use a `Map`, but then I can't access elements by index or `push` something to the end, so most often
I'm just using `Array`, which of course does not know that my elements all have unique IDs.

Enter `ArrayMap`, which does both. In addition to the usual suspects of `put`, `get`, `push`, `map`, and `filter`, it
provides some additional operations such as `collect`, `groupBy`, `sortByKey`, and more.

I find this to be a highly convenient solution that makes state management much easier when building my applications.

# Performance

ArrayMap does its best to be efficient, but it is primarily about convenience and correctness, not performance. Since ArrayMap has to maintain additional information
 about the position of each key within the primary array, some of the operations are a bit more expensive, notably 'remove'.
  However, it should be more than fast enough for any reasonable frontend use case. Don't build a game-engine on top of it.

# The Basics

`ArrayMap` works with any type `T`, but it needs to know how to get the ID of that type. It does this
with the provided `identify` function which takes a `T` and returns its ID. For example, if we had a user
named Alex and a `User` model type:
```ts
interface User {
  id: number;
  name: string;
  email: string;
}
const alex = { id: 1, name: "Alex", email: "alex@example.com" };
```
We could add Alex to our `users` collection like so:
```ts
import ArrayMap from "arraymap-js"; 
const users = ArrayMap.empty(user => user.id);
users.push(alex);
//or
const users = ArrayMap.fromArray([alex], user => user.id);
```

# Usage
IDE dot completion is your friend here, as the names, docstrings, and types of every method should
explain its usage. For constructors, try `ArrayMap.`. For operations on an ArrayMap `x`, try `x.`