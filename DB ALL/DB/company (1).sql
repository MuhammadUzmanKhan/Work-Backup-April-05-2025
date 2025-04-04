use [l191359]
create table employee
(  fname varchar(15) not null,
   Minit  char,
   Lname varchar(15) not null,
   ssn char(9) not null,
   bdate  date,
   address  varchar(30),
   sex char,
   salary  decimal(10, 2) check (salary<100000),
   super_ssn   char(9),
   Dno int not null,
   constraint emppk primary key (ssn)
   )

create table department
   ( Dname  varchar(15)  not null,
   Dnumber  int not null,
   Mgr_ssn   char(9) ,
   mgr_start_date   date,
   primary key (dnumber),
   unique (dname),
   foreign key (mgr_ssn) references employee(ssn) on delete set null)

create table project
  ( Pname varchar(15) not null,
    Pnumber   int  not null,
    Plocation  varchar(15),
    Dnum  int not null,
    constraint projkey primary key (Pnumber),
    foreign key(Dnum) references department(Dnumber)
    )



create table works_on
    (essn char(9) not null,
    Pno  int not null,
    hours  decimal(3,1) not null,
    primary key (essn, Pno),
    foreign key(essn) references employee(ssn),
    foreign key (Pno)  references project(Pnumber)
    )

create table dependent
  ( essn  char(9) not null,
    dependent_name  varchar(15)  not null,
    sex char,
    bdate date,
    relationship varchar(8),
    primary key (essn, dependent_name),
    foreign key(essn) references employee(ssn)
    )

create table dept_locations
(  Dnumber  int ,
   dlocation varchar(20),
   primary key (dnumber, dlocation),
   foreign key (dnumber) references 
   department(dnumber) 
   )
  
  select* from employee
  -- Lab 5 


Select fname, lname, salary, bdate
From employee

Select fname, lname, salary,bdate
From employee
Where salary >25000

Select fname, lname, salary, bdate
From employee
Where salary >25000
Order by salary desc,fname


Select distinct fname,salary
From employee




Select datediff(yy, bdate,GETDATE()) age, 
fname from employee

 select fname, Lname, salary, bdate
 from employee
 where bdate between '01-Jan-1960' and '31-Dec-1969'
 and lname like '%S'



 select fname, Lname, salary, bdate
 from employee
 where super_ssn is null




 select e.fname, e.Lname, d.Dname
from employee e inner join department d on e.Dno=d.Dnumber
order by d.Dname, e.fname


select * from employee
select* from department




select e.fname, e.Lname, d.dependent_name
from employee e left outer join dependent d on e.ssn=d.essn
order by e.fname, e.lname

select e.fname, e.Lname, d.dependent_name
from dependent d right outer join employee e  on e.ssn=d.essn
order by e.fname, e.lname


insert into department(Dname, dnumber) values ('Accounts', 10)

select e.fname, e.Lname, d.dName
from department d full outer join employee e  on e.ssn=d.Mgr_ssn
order by e.fname, e.lname


select COUNT(*) NumberOfEmployee,AVG(salary) CompanyAverage,MAX(salary)CompanyMax,MIN(salary)CompanyMin,
SUM(salary) CompanySum
from employee


select d.dname,COUNT(*) DepartmentEmps,SUM(salary) DepartmentSum
from employee e, department d
where e.Dno=d.Dnumber
group by d.dname


select d.dname,COUNT(*) DepartmentEmps,SUM(salary) DepartmentSum
from employee e, department d
where e.Dno=d.Dnumber
group by d.dname
having COUNT(*)>1 and SUM(salary)>125000





















--- Quiz  2



SELECT e.fname, e.Lname
FROM employee e
INNER JOIN employee s ON e.super_ssn = s.ssn
WHERE s.fname = 'Franklin' AND s.Lname = 'Wong';



SELECT e.fname, e.Lname
FROM employee e
INNER JOIN works_on w ON e.ssn = w.essn
INNER JOIN project p ON w.Pno = p.Pnumber
WHERE p.Pname = 'Product X' AND p.Dnum = 5 AND w.hours > 10;





SELECT DISTINCT e.fname, e.Lname
FROM employee e
INNER JOIN dependent d ON e.ssn = d.essn
WHERE e.fname = d.dependent_name;



SELECT DISTINCT e.fname, e.Lname
FROM employee e
INNER JOIN department d ON e.ssn = d.Mgr_ssn
INNER JOIN dependent dp ON e.ssn = dp.essn;




--3rd

SELECT e.fname, e.lname
FROM employee e
JOIN works_on w ON e.ssn = w.essn
JOIN project p ON w.pno = p.pnumber
WHERE p.pname = 'Product X' AND p.dnum = 5 AND w.hours > 10;







SELECT e.fname, e.lname
FROM employee e
JOIN dependent d ON e.ssn = d.essn
WHERE d.dependent_name LIKE CONCAT(e.fname, '%');




SELECT e.fname, e.lname
FROM employee e
JOIN dependent d ON e.ssn = d.essn
WHERE d.dependent_name LIKE CONCAT(e.fname, '%');






----  Q3 




CREATE TRIGGER data_violation
ON employee
FOR INSERT, UPDATE, DELETE
AS
BEGIN
    IF ORIGINAL_LOGIN() <> 'sa' --change 'sa' to the name of an authorized user who can make changes to the table
    BEGIN
        RAISERROR('Access Denied', 16, 1)
        ROLLBACK TRANSACTION
    END
END


INSERT INTO employee (fname, Minit, Lname, ssn, bdate, address, sex, salary, super_ssn, Dno)
VALUES ('John', 'D', 'Doe', '123456789', '1980-01-01', '123 Main St', 'M', 50000, '999888777', 5);




CREATE PROCEDURE max_project_details
    @dept_name VARCHAR(15)
AS
BEGIN
    SELECT TOP 1 e.fname + ' ' + e.lname AS EmployeeName, COUNT(*) AS ProjectCount
    FROM employee e
    INNER JOIN works_on w ON e.ssn = w.essn
    INNER JOIN project p ON w.Pno = p.Pnumber
    INNER JOIN department d ON p.Dnum = d.Dnumber
    WHERE d.Dname = @dept_name
    GROUP BY e.ssn, e.fname, e.lname
    ORDER BY COUNT(*) DESC

END
EXEC max_project_details 'Research'













