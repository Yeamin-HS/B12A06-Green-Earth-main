
---


### 1) What is the difference between `var`, `let`, and `const`?
- **var**: It is a Function-scoped, hoisted (initialized as `undefined`), allows re-declaration; can leak outside blocks—avoid in modern code.
- **let**: Block-scoped and  hoisted,no re-declaration in the same scope. Used for variables that will be reassigned.
- **const**: Block-scoped like `let` but cannot be reassigned. For objects/arrays, that binding is constant but internal values can change.

### 2) What is the difference between `map()`, `forEach()`, and `filter()`?
- **forEach**: Iterates and runs a callback for each element and does not return a new array (returns `undefined`).
- **map**: map convert each element and returns a new array of the same length.
- **filter**: It Returns a new array containing only the elements for which the callback returned `true`.

### 3) What are arrow functions in ES6?
 the arrow function do not have their own `this`, `arguments`, `super` and are not suitable as constructors. its basically used  for callbacks and keeping the outer `this` type of keywords.

### 4) How does destructuring assignment work in ES6?
Destructuring means pulls values out from arrays or objects into variables :

const [yooo, sheii] = [10, 20];

thats how variables will assigned value of list or object easily 
