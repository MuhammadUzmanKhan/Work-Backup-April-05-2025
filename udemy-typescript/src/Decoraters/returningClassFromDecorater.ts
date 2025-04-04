// returning a class decorator ; 

// withTemplate is class decorator will added to the class in the end;

// we can create a new constructor function which will replace the class constructor to which it will added

// in this below withTemplate code the template will always be rendered to the dom as it is instantiating itself in the decorator

// function withTemplate(template: string, hookId: string) {
//     return function (constructor: any) {
//         const hookEl = document.getElementById(hookId);
//         const p = new constructor();
//         if (hookEl) {
//             hookEl.innerHTML = template;
//             hookEl.querySelector('h1')!.textContent = p.name;
//         }
//     }
// }

// to avoid that and to make it only instantiate when the instance is created we have to return a new class doing this

function withTemplate(template: string, hookId: string) {
    return function <T extends { new(...args: any[]): { name: string } }>(originalConstructor: T) {
        return class extends originalConstructor {
            constructor(...args: any[]) {
                super();
                console.log("Rendering Template!");
                const hookEl = document.getElementById(hookId);
                if (hookEl) {
                    hookEl.innerHTML = template;
                    hookEl.querySelector('h1')!.textContent = this.name;
                }
            }
        }
    }
}

// if its only a function then js rules apply and a first function will execute first  

@withTemplate("<h1>My Person Object!</h1>", "app")  //bottom-most decorator will execute first 
class Person2 {
    name = 'Maxi';
    constructor() {
        console.log("creating person object...");
    }
}


const person = new Person2();

// now the template will only be created when class is instantiated .

console.log(person);