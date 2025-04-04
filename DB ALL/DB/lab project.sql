use [l191359 Project]

create table Nadra
(
CNIC varchar(20),
ADDR varchar(50),
Name varchar(30),
gender varchar(2),
DOB date,
constraint NPK primary key (CNIC),

)

select * from Nadra

create table Users
(
User_I int,
CNIC varchar(20),
pname varchar(20),
utype varchar(20),
constraint UPK primary key (User_I),
unique (CNIC),
constraint UFK foreign key (CNIC) references Nadra (CNIC),
)
 
select *from Users

create table Adminstrator
(
AD_ID int,
ADDR varchar(50),
CNIC varchar(20),
constraint ADPK primary key (AD_ID,CNIC),
constraint ADFK foreign key (CNIC) references Nadra (CNIC)
)

select *from Adminstrator

create table secure
(
User_I int,
question varchar(60),
spassword varchar(20),
constraint SEPK primary key (spassword,User_I),
constraint SEFK foreign key (User_I) references Users (User_I)
)
select *from secure

create table MPA
(
symbol varchar(50),
UC_No int,
PName varchar(50),
User_I int,
votecount int,
constraint MPAPK primary key (symbol,UC_No),
constraint MPAFK foreign key (User_I) references Users (User_I),

)
select *from MPA

create table MNA
(
NA int,
symbol varchar(50),
votecount int,
PName varchar(50),
User_I int,
constraint MNAPK primary key (symbol,NA),
constraint MNAFK foreign key (User_I) references Users (User_I),
)


create table AreaResult
(
PName varchar(50),
symbol varchar(50),
UC_No int,
NA int,
total_no_vote int,
constraint MPAARPK primary key (PName),
constraint MPAARFK foreign key (symbol,UC_No) references MPA (symbol,UC_No),
constraint MNAARFK foreign key (symbol,NA) references MNA (symbol,NA),
)

create table GeneralResult
(

PName varchar(50),
NOSNA int ,
NOSPA int,
constraint GRPK primary key (PName),

)

create table AreaResultMNA
(

PName varchar(50),
symbolMNA varchar(50),
NA int,
total_no_vote int,
constraint MNARPK primary key (PName,NA)
--,
--constraint MNARFK foreign key (symbolMNA,NA) references MNA (symbol,NA),
)

DROP TABLE AreaResultMNA

create table AreaResultMPA
(

PName varchar(50),
symbolMPA varchar(50),
UC_No int,
total_no_vote int,
constraint MPARPK primary key (PName,UC_No),
constraint MPARFK foreign key (symbolMPA,UC_No) references MPA (symbol,UC_No),

)

-------------------------------------Create Table Finiah Here ----------------------------------------
Insert into Nadra values ('35104-0942987-1','House no #54G,Muhalla Fasial Town, bahawalpur','Nida Waqar','F','8/7/1987')


insert into AreaResultMNA values('PTI','BAT','122',0)
insert into AreaResultMNA values('PML_N','LOIN','155',0)

insert into AreaResultMPA values('PPP','ARROW','545',0)
insert into AreaResultMPA values('PTI','BAT','545',0)


---------------------------------Inserting data into tables ends here-----------------------------------
--delete from Nadra
--delete from Adminstrator
--drop table AreaResult
--drop table MPA
--delete from Users
--delete from Secure
--drop table MNA

----------------------------Drop paturn of the tables given above---------------------------------------

select*from Nadra
select*from Users
select *from Adminstrator
select*from secure
select*from Vote
select *from MPA
select *from MNA
select * from AreaResult
select*from GeneralResult
select*from AreaResultMPA
select *from AreaResultMNA

--------------------Select commands given above -----------------------------------------

--------------------------------Stored Procedure Starts------------------------------
-----------------Administrator Insert data procedure ------------------------

CREATE PROCEDURE [dbo].[Admistratoruserinsert] 
	@CNIC varchar(20),
	@NUUtyp varchar(20),
	@NUUserid int,
	@NUpname varchar(20)
	
AS
BEGIN
	SET NOCOUNT ON;
	SET @NUUtyp = 'ADMINISTRATOR';
	SET @NUpname = NULL;
INSERT INTO Users (User_I, CNIC, pname, utype)
	VALUES (@NUUserid, @CNIC, @NUpname, @NUUtyp);


END
-------------

EXEC [dbo].[Admistratoruserinsert] '1234567890', 'Administrator', 1, NULL;


----------
EXEC [dbo].[Admistratoruserinsert] 
	@CNIC = '35202-09861903-3', -- Replace XXXXXXXXXXXXX with the actual CNIC value
	@NUUtyp = 'Candidate', -- Leave this parameter empty or provide a specific value if required
	@NUUserid = 5000, -- Replace 123 with the actual User ID value
	@NUpname = 'Imrabn khan' -- Leave this parameter empty or provide a specific value if required


DROP PROCEDURE [dbo].[Admistratoruserinsert]

------------------------------

CREATE PROCEDURE [dbo].[Admistratoruserinsert] 
	@CNIC varchar(20),
	@NUUserid int
AS
BEGIN
	SET NOCOUNT ON;
	
	INSERT INTO Users (User_I, CNIC)
	VALUES (@NUUserid, @CNIC);
END

EXEC [dbo].[Admistratoruserinsert] '1234567890', 2;


DROP PROCEDURE [dbo].[Admistratoruserinsert]





drop procedure [dbo].[Admistratoruserinsert] 

----------------------------Deleting Administrator User Procedure --------------------------
CREATE PROCEDURE [dbo].[Admistratoruserdelete] 
@UserCNIC varchar(20)

AS
BEGIN
	SET NOCOUNT ON;
delete from Users where CNIC=@UserCNIC;

END


 --------------------User Profile Search Procedure -----------------------
create procedure ProfileSearchItem
@Name varchar(30),
@Found int output

AS
SELect * from Nadra where Name=@Name

if @@ROWCOUNT>0 --item found
set @Found=1
else 
set @Found=0


-- onwards 9/5/2018
--------------- MPA Search Procedure ------------------------------------

create procedure MPASearchItem
@UC_No varchar(5),
@Found int output

AS
SELect * from AreaResultMPA where UC_No=@UC_No

if @@ROWCOUNT>0 --item found
set @Found=1
else 
set @Found=0

----------------------------------MNA Search Procedure ------------------------
create procedure MNASearchItem
@NA varchar(8),
@Found int output

AS
SELect * from AreaResultMNA where NA=@NA

if @@ROWCOUNT>0 --item found
set @Found=1
else 
set @Found=0

--onwards
------------------------Verify User Procedure --------------------------

create procedure verifyUser
@CNIC varchar(20),
@passw varchar(20),
@Found int output

AS
Select * from Users  u inner join secure s on  u.User_I=s.User_I
where u.CNIC = @CNIC and s.spassword = @passw and u.utype='VOTER'
union
Select * from Users  u inner join secure s on  u.User_I=s.User_I
where u.CNIC = @CNIC and s.spassword = @passw and u.utype='CANDIDATE'  
if @@ROWCOUNT>0 --item found
set @Found=1
else 
set @Found=0

select * from Users
select * from secure
-----------------------------------verify Administrator -------------------------------
create procedure verifyAdministrator
@CNIC varchar(20),
@passw varchar(20),
@Found int output

AS
SELect * from Users  u inner join secure s on  u.User_I=s.User_I
where u.CNIC = @CNIC and s.spassword = @passw and u.utype='ADMINISTRATOR'
 
if @@ROWCOUNT>0 --item found
set @Found=1
else 
set @Found=0

------------------------Candidate Profile Search Procedure ---------------------
create procedure CandidateProfileSearchItem
@Name varchar(30),
@Found int output

AS
SELect u.User_I,n.Name,u.pname,n.gender from Nadra n inner join users u on u.CNIC=n.CNIC where Name=@Name and u.utype='CANDIDATE'

if @@ROWCOUNT>0 --item found
set @Found=1
else 
set @Found=0

--------------------------MPA Area Search Procedure -------------------------

create procedure MPAareaSearch
@UC_no int,
@Found int output

AS
SELect pname from MPA where UC_No=@UC_no

if @@ROWCOUNT>0 --item found
set @Found=1
else 
set @Found=0

-------------------------------------------------
CREATE PROCEDURE MPAareaSResult
	@UC_No INT,
	@Pname VARCHAR(50),
	@Found INT OUTPUT
AS
BEGIN
	SET NOCOUNT ON;

	UPDATE AreaResultMPA
	SET total_no_vote = total_no_vote + 1
	WHERE UC_No = @UC_No AND Pname = @Pname;

	IF @@ROWCOUNT > 0 -- Item found
		SET @Found = 1;
	ELSE
		SET @Found = 0;
END

DECLARE @UC_No INT = 545; -- Specify the UC_No value
DECLARE @Pname VARCHAR(50) = 'PPP'; -- Specify the Pname value
DECLARE @Found INT; -- Output parameter

EXEC MPAareaSResult @UC_No, @Pname, @Found OUTPUT;

SELECT @Found; -- Check the value of the output parameter
truncate table AreaResultMPA
insert into AreaResultMPA values ('PPP','ARROW',545,0)
select * from AreaResultMPA
-------------------------------------------------


insert into AreaResultMNA values ('PML_N','LION',155,0)
SELECT * FROM AreaResultMNA
drop procedure MPAareaSResult


--------------MPA Area Search Procedure -------------------------------------
create procedure MPAareaSResult
@UC_No int,
@PName varchar(20),
@Found int output

as begin 
update AreaResultMPA
set total_no_vote=total_no_vote+1
where UC_No=@UC_No and PName=@PName
end
if @@ROWCOUNT>0 --item found
set @Found=1
else 
set @Found=0

select* from AreaResultMPA

DECLARE @UC_No INT
DECLARE @PName VARCHAR(20)
DECLARE @Found INT

SET @UC_No = 545
SET @PName = 'PPP'

EXEC MPAareaSResult @UC_No, @PName, @Found OUTPUT

SELECT @Found


------------------------MNA Area Search Procedure------------------------
create procedure MNAareaSearch
@NA int,
@Found int output

AS
SELect pname from MNA where NA=@NA

if @@ROWCOUNT>0 --item found
set @Found=1
else 
set @Found=0

--------------------------------MNA Area Result Procedure------------------------
create procedure MNAareaSResult
@NA int,
@PName varchar(20),
@Found int output
as 
begin 
update AreaResultMNA
set total_no_vote=total_no_vote+1
where NA=@NA and PName=@PName

if @@ROWCOUNT>0 --item found
set @Found=1
else 
set @Found=0
end







drop table MPA
drop table AreaResultMPA
drop table AreaResultMNA

create table MPA
(
    symbol varchar(50),
    UC_No int,
    PName varchar(50),
    User_I int,
    votecount int,
    constraint MPAPK primary key (symbol, UC_No),
    constraint MPAFK foreign key (User_I) references Users (User_I)
);

create table AreaResultMPA
(
    PName varchar(50),
    symbolMPA varchar(50),
    UC_No int,
    total_no_vote int,
    constraint MPARPK primary key (PName, UC_No),
    constraint MPARFK foreign key (symbolMPA, UC_No) references MPA (symbol, UC_No)
);


insert into Users values(4009,	'35202-6703458-5' ,NULL, NULL);