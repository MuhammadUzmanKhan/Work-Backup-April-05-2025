class AccountingDepartment {
    protected static instance: AccountingDepartment;
    private constructor(private id: string, protected bills: string[]) { } // private constructor will make sure that no new instance will be created and we can follow singleton pattern 
    static getInstance() {
        if (!this.instance) {
            this.instance = new AccountingDepartment('123', ["Max"])
            return this.instance;
        }
        return this.instance;
    }
}

const accountingDepartment1 = AccountingDepartment.getInstance(); 
const accountingDepartment2 = AccountingDepartment.getInstance(); //Same copy of previous obj
const accountingDepartment3 = AccountingDepartment.getInstance();

console.log({accountingDepartment1,accountingDepartment2,accountingDepartment3}); 