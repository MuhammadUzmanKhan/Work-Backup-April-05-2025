// A decorator is a function that modifies the behavior of another function,
// typically by wrapping the function in some sort of wrapper function.


function Logger(constructor: Function) {
    console.log("logging...", constructor);
}


@Logger
class Person {
    name = 'Max';
    constructor() {
        console.log("creating person object...");
    }
}


const pers = new Person();

console.log(pers);