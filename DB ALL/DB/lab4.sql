Use [InLab4]
create schema lab4


CREATE TABLE lab4.School(
schID [int] NOT NULL,
schName [varchar](50) NULL,
schdeanID [int] NULL,
)

CREATE TABLE lab4.Staff(
staffID [int] NOT NULL,
staffName [varchar](50) NULL,
staffRole [varchar](50) 
)



drop table lab4.Staff


CREATE TABLE lab4.Staff(
staffID [int] NOT NULL,
staffName [varchar](50) NULL,
staffRole [varchar](50),
constraint staffPK primary key (staffId)
)


Alter TABLE lab4.School add constraint schPK primary key(schID)

drop table lab4.School


CREATE TABLE lab4.School(
schID [int] NOT NULL primary key,
schName [varchar](50) NULL,
schdeanID [int] NULL,
constraint deanFK foreign key (schdeanID) references lab4.Staff(staffId)
)

Alter table lab4.school drop constraint deanFK

Alter table lab4.school add constraint deanFK foreign key (schdeanID) references lab4.Staff(staffId)
Alter table lab4.school drop constraint deanFK


Alter table lab4.school add constraint deanFK foreign
key(schdeanID)references lab4.Staff(staffID)
on delete set null on update cascade



Insert into lab4.staff values (101, 'Ahmed', 'Principal')
Insert into lab4.staff values (102, 'Ali', 'Head Teacher')
Insert into lab4.staff values (103, 'Salman', 'Teacher')
Insert into Lab4.staff(staffName, staffId) values ('Fatima', 104)
Insert into lab4.school values (1, 'DPS', 101)
Insert into lab4.school values (2, 'LGS', 102)
Insert into lab4.school values (3, 'BeaconHouse', 103)

Select * from lab4.staff
Select * from lab4.school


Update lab4.staff set staffId=106 where staffId=103

Select * from lab4.staff
Select * from lab4.school

Delete from lab4.staff where staffId=102


Select * from lab4.staff
Select * from lab4.school


Alter table lab4.school add schAddress varchar(100)

Alter table lab4.school drop column schAddress


Insert into lab4.school values (1, 'DPS', 101)
Insert into lab4.school values (2, 'LGS', 102)
Insert into lab4.school values (3, 'BeaconHouse', 106)
Insert into lab4.school values (4, 'ucp', 104)
Insert into lab4.school values (5, 'fast', 103)

 truncate table lab4.school 

Select * from lab4.school