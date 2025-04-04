interface Named {
    readonly name:string;  // readonly can be used for both interfaces and types ensures that it initializes only once 
}

interface Greetable extends Named {  // interface can inherit, and can also inherit multiple interfaces separated by coma (i.e Named, Another Interface)
    greet(phrase: string): void;
}

class Person implements Greetable { 
    constructor(public name: string) { }
    greet(phrase: string) {
        console.log(phrase + " " + this.name);
    }
}

let user1:Greetable; 


user1= new Person('Ahmad');

// user1.name="Masss"; // getting readonly error;

user1.greet('Hi there - I m');