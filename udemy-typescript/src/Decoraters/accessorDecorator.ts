function Log1(target: any, propertyName: string) { // target here is the prototype of an object which is populated by the dom
    console.log("Property Logger..");
    console.log(target, propertyName);
}

function Log2(target: any, name: string, descriptor: TypedPropertyDescriptor<number>) {
    console.log("Accessor Logger..");
    console.log(target, name, descriptor);
}

function Log3(target: any, name: string, descriptor: TypedPropertyDescriptor<(T: number) => number>) {
    console.log("Method Logger..");
    console.log(target, name, descriptor);
}

function Log4(target: any, name: string, position: number) {
    console.log("Parameter Logger..");
    console.log(target, name, position);
}

class Product { // On class declaration these all decorators will also be called it has nothing to do with class instances 
    @Log1
    title: string;

    constructor( title: string, @Log4 private _price: number) {
        this.title = title;
    }
    @Log2
    set price(val: number) {
        if (val <= 0) throw new Error("")
        this._price = val;
    }
    @Log3
    getPriceWithTax(@Log4 tax: number) {
        return this._price + (1 * tax);
    }

}

const product1 = new Product("Book", 330);

// product1.price=550;

console.log(product1);