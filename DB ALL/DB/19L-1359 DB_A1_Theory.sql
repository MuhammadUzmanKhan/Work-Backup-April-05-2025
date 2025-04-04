use [DB Theory A1]

CREATE TABLE Patient(
	Patient_id INT NOT NULL,
	name VARCHAR(50) NOT NULL,
	DOB DATE NULL,
	ailment VARCHAR(50) NOT NULL,
	CONSTRAINT PK_PATIENT 
		PRIMARY KEY(Patient_id)
)
CREATE TABLE Department(
	dep_id INT NOT NULL,
	dname VARCHAR(50) NOT NULL,
	CONSTRAINT PK_DEPT 
		PRIMARY KEY (dep_id)
)
CREATE TABLE Doctor(
	Doc_id INT NOT NULL,
	Doc_name VARCHAR(50) NOT NULL,
	qualification VARCHAR(50) NOT NULL,
	fee INT NOT NULL,
	dep INT NOT NULL,
	supervisor INT NULL,
	CONSTRAINT PK_DOC 
		PRIMARY KEY (Doc_id),
	CONSTRAINT FK_DOC_DEPT 
		FOREIGN KEY(dep) 
		REFERENCES Department(dep_id),
	CONSTRAINT FK_DOC_SPVSR 
		FOREIGN KEY(supervisor) 
		REFERENCES Doctor(Doc_id)
)
CREATE TABLE Consult_room(
	room_id INT NOT NULL,
	rname VARCHAR(50) NOT NULL,
	CONSTRAINT PK_CR
		PRIMARY KEY (room_id)
)
CREATE TABLE Doctor_Consult(
	Doc_id INT NOT NULL,
	Room_id INT NOT NULL,
	Day_of_week VARCHAR(9) CHECK (Day_of_week IN ('Saturday', 'Wednesday')),
	Start_time TIME NOT NULL,
	End_Time TIME NOT NULL,
	CONSTRAINT PK_DC
		PRIMARY KEY(Doc_id,Room_id),
	CONSTRAINT FK_DOC_DC
		FOREIGN KEY(Doc_id)
		REFERENCES Doctor(Doc_id),
	CONSTRAINT FK_ROOM_DC
		FOREIGN KEY(Room_id)
		REFERENCES Consult_room(room_id)
)


CREATE TABLE Patient_appointment(
	Doc_id INT NOT NULL,
	Pat_id INT NOT NULL,
	apdate DATE NOT NULL,
	Start_time TIME NOT NULL,
	CONSTRAINT PK_APPTMNT
		PRIMARY KEY(Doc_id,Pat_id,apdate),
	CONSTRAINT FK_PA_DOC
		FOREIGN KEY (Doc_id)
		REFERENCES Doctor(Doc_id),
	CONSTRAINT FK_PA_PAT
		FOREIGN KEY (Pat_id)
		REFERENCES Patient(Patient_id),
)

select* from Patient
select*from Department
select* from Doctor
select *from Consult_room
select * from Doctor_Consult
select * from Patient_appointment