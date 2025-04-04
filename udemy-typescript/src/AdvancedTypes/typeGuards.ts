
// type guard helps us in union types or where we not sure what the type will be 

// 1st-case - basic type guard  

type Combinable = string | number;

function add2(a: Combinable, b: Combinable) {
    if (typeof a === 'string' || typeof b === "string") {  // basic type guard 
        return (+a + +b);
    } else {
        return a + b;
    }
}

// 2nd-case - Property in an Object type guard using 'in' keyword of ts

type AdminType = {
    name: string;
    privileges: string[];
}

type Employee2Type = {
    name: string;
    startDate: Date;
}

type UnknownEmployee = Employee2Type | AdminType;

function printEmployeeInfo(emp: UnknownEmployee) {

    // what if we only want to console privileges from admin ts will not allow us to do if(emp?.privileges)
    // then we can use in operator to find if the object has that key

    if ("privileges" in emp) {
        console.log("privilege " + emp.privileges);
    }
    if ("startDate" in emp) {
        console.log("startDate " + emp.startDate);
    }
    console.log("Name " + emp.name);
}


printEmployeeInfo({
    name: 'Max',
    privileges: ['create-server'],
    startDate: new Date()
})

// 3rd-case - type-guard in class with instanceof operator


class Car {
    drive() {
        console.log("car driving...");
    }
}

class Truck {
    drive() {
        console.log("truck driving...");
    }

    loadCargo(amount: number) {
        console.log("loading cargo ..." + amount);
    }
}

type Vehicle = Car | Truck;  // one has loadCargo and one class not 

const v1 = new Car();
const v2 = new Truck();

function useVehicle(vehicle:Vehicle){

    vehicle.drive();
    vehicle instanceof Truck && vehicle.loadCargo(1000);    // with classes we can use instanceof operator for type check 
    
}

useVehicle(v1);
useVehicle(v2);


