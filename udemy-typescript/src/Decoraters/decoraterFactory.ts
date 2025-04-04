function Logger(string:string) {
    return function(constructor:Function){
        console.log("string...", string);
        console.log("logging...", constructor);
    }
}


@Logger("This is decorator factory!")
class Person2 {
    name = 'Max';
    constructor() {
        console.log("creating person object...");
    }
}


const person = new Person2();

console.log(person);