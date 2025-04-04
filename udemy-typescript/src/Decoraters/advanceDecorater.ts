// Decorates give us the meta programming ability by which we can use utilities tools for the class also other developers can take advantage from it .
function Logger(string:string) {
    return function(constructor:Function){
        console.log("string...", string);
        console.log("logging...", constructor);
    }
}

function withTemplate(template: string, hookId: string) {
    return function (constructor: any) {
        const hookEl = document.getElementById(hookId);
        const p = new constructor();
        if (hookEl) {
            hookEl.innerHTML = template;
            hookEl.querySelector('h1')!.textContent = p.name;
        }
    }
}

// if its only a function then js rules apply and a first function will execute first  

@Logger("Logger-decorator")
@withTemplate("<h1>My Person Object!</h1>", "app")  //bottom-most decorator will execute first 
class Person2 {
    name = 'Maxi';
    constructor() {
        console.log("creating person object...");
    }
}


const person = new Person2();

console.log(person);