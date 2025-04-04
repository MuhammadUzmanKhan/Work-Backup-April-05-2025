function Logger(target: any, propertyName: string) { // target here is the prototype of an object which is populated by the dom
    console.log("Property Logger..");
    console.log(target, propertyName);
}

class Product {
    @Logger
    title: string;
    private _price: number;
    constructor(t: string, p: number) {
        this.title = t;
        this._price = p;
    }

    set price(val: number) {
        if (val <= 0) throw new Error("")
        this._price = val;
    }

    getPriceWithTax(tax: number) {
        return this._price + (1 * tax);
    }

}

const product1=new Product("Book",330);

// product1.price=550;

console.log(product1);