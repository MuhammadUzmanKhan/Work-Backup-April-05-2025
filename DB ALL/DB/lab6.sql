use [L191359]
--***************InLab
----  1 Inlab

select e.fname,e.lname 
from employee e inner join works_on w on e.ssn =w.Essn
inner join project p on p.Pnumber=w.Pno
where p.Pname='ProductX'
union
select e.fname,e.lname
from employee e inner join works_on w on e.ssn=w.Essn
inner join project p on p.Pnumber=w.Pno
where p.Pname='ProductY'

----  2 Inlab
select e.fname,e.lname
from employee e inner join works_on w on e.ssn=w.Essn
inner join project P on P.Pnumber=w.Pno
where p.Pname='ProductX'
intersect 
select e.fname , e.lname
from employee e inner join works_on w on e.ssn=w.Essn
inner join project P on p.Pnumber=w.Pno
where p.Pname='ProductY'


----  3  Inlab
select e.fname,e.lname
from employee e inner join works_on w on e.ssn=w.essn
inner join project P on p.Pnumber=w.Pno
where p.Pname='ProductY' 
except 
select e.fname ,e.lname
from employee e inner join works_on w on e.ssn=w.Essn
inner join project P on p.Pnumber=w.Pno
where p.Pname='ProductX'

----  4  Inlab
select fname,lname,salary from employee
where salary=(select min (salary) from employee )



-- 5 Inlab 





------  6 Inlab

-- 1st Approach --CG
SELECT e.fname, e.Lname
FROM employee e
JOIN works_on w ON e.ssn = w.essn
JOIN project p ON w.Pno = p.Pnumber
JOIN department d ON p.Dnum = d.Dnumber
WHERE d.Dnumber <> e.Dno

--2nd Approach --AJ
select e.fname,e.lname from employee e
join works_on w on e.ssn=w.Essn
join project p on p.Pnumber=w.Pno
where e.Dno<>P.Dnum












