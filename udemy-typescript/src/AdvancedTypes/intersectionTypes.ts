type Admin = {
    name: string;
    privileges: string[];
}

type Employee2 = {
    name: string;
    startDate: Date;
}


// interface ElevatedEmployee extends Admin, Employee {}

type ElevatedEmployee = Admin & Employee2; // types describe in both will be mandatory then


let e1: ElevatedEmployee = {
    name: 'Max',
    privileges: ['create-server'],
    startDate: new Date()
}