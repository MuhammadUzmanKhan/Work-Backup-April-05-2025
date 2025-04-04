class Company {
    protected employees: string[] = [];

    constructor(protected name: string, private id: string = "123") {  // readonly means that it should only assign once at the time of initialization and then it would not change
    }

    addEmployee($employee: string) {
        this.employees.push($employee);
    };

    printEmployee() {
        console.log(this.employees);

    };

}

class CompanyDepartments extends Company {
    private departments: string[] = [];
    constructor(name: string, id: string) {
        super(name, id);
    }
    addDepartment($department: string) {
        this.departments.push($department);
    }

    printDepartment(this:CompanyDepartments) {
        console.log(this.departments);
        console.log(this.name);
    }
}



const department = new CompanyDepartments("Phaedra", "12345");

department.addDepartment("HR-Department");

department.printDepartment();

