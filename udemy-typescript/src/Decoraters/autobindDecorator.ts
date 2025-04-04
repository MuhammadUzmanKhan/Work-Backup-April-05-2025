function Autobind<T>(target: T, name: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const adjustedDescriptor: PropertyDescriptor = {
        configurable: true,
        enumerable: false,
        get() {
            const boundFn = originalMethod.bind(this);
            return boundFn;
        }
    };
    return adjustedDescriptor;
}

class Printer {
    message = "This Works!";

    @Autobind
    showMessage() {
        console.log(this.message);
    }
}

const p = new Printer();

const button = document.querySelector("button")!;
// button.addEventListener('click',p.showMessage.bind(p))

// Above one is the conventional way to bind the event to the instance of the class otherwise it is targeting to the event that triggers that method and not that instance  

button.addEventListener('click',p.showMessage);