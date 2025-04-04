interface Greetable {  // interfaces has no implementation details at all while class has
    name: string;
    greet(phrase: string): void;
}

class User implements Greetable { // by implementing interface we enforce certain structure for the class implements that 
    constructor(public name: string) { }
    greet(phrase: string) {
        console.log(phrase + " " + this.name);
    }
}

let user:Greetable; // also it can be used on the object variable to ensure it must have the specified properties and method

user= new User('Ahmad');

user.greet('Hi there - I m');