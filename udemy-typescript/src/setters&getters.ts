class Computer_Science {
    private report: string[] = [];
    constructor(id: string) { }

    get mostRecentReport() {
        if (!this.report.length) throw new Error("No Report Found");
        return this.report[0];
    }

    set mostRecentReport(value:string){
        if(!value) throw new Error("Please pass in the valid value");
        this.report.push(value);
    }

}

const record1=new Computer_Science("123");

record1.mostRecentReport='report123';
record1.mostRecentReport='report12345';
record1.mostRecentReport='report1234';

console.log(record1.mostRecentReport);
