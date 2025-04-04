class Employee {
    static employees: string[] = [];
    constructor(id: string) { }

    static createEmployees(value: string) {  // utility function 
        return { name: value };
    }

    // static createEmployees(value: string) {  // accessing class static property 
    //      Employee.employees.push(value);
    //      return Employee.employees;
    // }

}


// static methods and properties are usually used for making utilities functions 
// the main idea is to detach it with the instance of the class
// these are just like the global variables of that class
// you can only use this with instances of the class ,if the the class is static then we cannot access this in it 
// the only way to access the property of the class is by making them static and access

const employee1 = Employee.createEmployees("Max");
const employee2 = Employee.createEmployees("Ahmad");


console.log(employee1);