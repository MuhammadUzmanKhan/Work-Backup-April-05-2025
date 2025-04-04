class Department {
    name: string;

    constructor(n: string) {
        this.name = n;
    }

    describe(this: Department) {
        console.log("Department" + this.name); // this typically refers to the thing which is responsible for calling the method to make it refer to the same class take it in the parameter
    }
}


const accounting = new Department(" Information Technology");

const accountingCopy = { describe: accounting.describe, flag: true };

// accountingCopy.describe();


console.log(accountingCopy);