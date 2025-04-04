use [L5_Inlab_19l1359]

create table hotel(
hotelno varchar(10) primary key,
hotelname varchar(20),
city varchar(20),
)

insert into hotel values('fb01', 'Grosvenor', 'Houston');
insert into hotel values('fb02', 'Watergate', 'Paris');
insert into hotel values('ch01', 'Omni Shoreham', 'London');
insert into hotel values('ch02', 'Phoenix Park', 'Amsterdam');
insert into hotel values('dc01', 'Latham', 'Berlin');
insert into hotel values('ch03', 'Sheraton', 'London');

 -- create a table named hotel

 create table room(
roomno numeric(5),
hotelno varchar(10),
type varchar(10),
price decimal(5,2),
primary key (roomno, hotelno),
foreign key (hotelno) REFERENCES hotel(hotelno)
)

insert into room values(501, 'fb01', 'single', 19);
insert into room values(601, 'fb01', 'double', 29);
insert into room values(701, 'fb01', 'family', 39);
insert into room values(1001, 'fb02', 'single', 58);
insert into room values(1101, 'fb02', 'double', 86);
insert into room values(1001, 'ch01', 'single', 29.99);
insert into room values(1101, 'ch01', 'family', 59.99);
insert into room values(701, 'ch02', 'single', 10);
insert into room values(801, 'ch02', 'double', 15);
insert into room values(901, 'dc01', 'single', 18);
insert into room values(1001, 'dc01', 'double', 30);
insert into room values(1101, 'dc01', 'family', 35);
insert into room values(1102, 'dc01', 'family', 40);
insert into room values(1103, 'ch03', 'family', 40);

create table guest(
guestno numeric(5),
guestname varchar(20),
guestaddress varchar(50),
primary key (guestno)
)

insert into guest values(10001, 'John Kay', '56 High St, London');
insert into guest values(10002, 'Mike Ritchie', '18 Tain St, London');
insert into guest values(10003, 'Mary Tregear', '5 Tarbot Rd, Aberdeen');
insert into guest values(10004, 'Joe Keogh', '2 Fergus Dr, Aberdeen');
insert into guest values(10005, 'Carol Farrel', '6 Achray St, Glasgow');
insert into guest values(10006, 'Tina Murphy', '63 Well St, Glasgow');
insert into guest values(10007, 'Tony Shaw', '12 Park Pl, Glasgow');


create table booking(
hotelno varchar(10),
guestno numeric(5),
datefrom datetime,
dateto datetime,
roomno numeric(5),
primary key (hotelno, guestno, datefrom),
foreign key (roomno, hotelno) REFERENCES room(roomno, hotelno),
foreign key (guestno) REFERENCES guest(guestno)
)

 

insert into booking values('fb01', 10001, '04-04-01', '04-04-08', 501);
insert into booking values('fb01', 10004, '04-04-15', '04-05-15', 601);
insert into booking values('fb01', 10005, '04-05-02', '04-05-07', 501);
insert into booking values('fb01', 10001, '04-05-01', null, 701);
insert into booking values('fb02', 10003, '04-04-05', '10-04-04', 1001);
insert into booking values('ch01', 10006, '04-04-21', null, 1101);
insert into booking values('ch02', 10002, '04-04-25', '04-05-06', 801);
insert into booking values('dc01', 10007, '04-05-13', '04-05-15', 1001);
insert into booking values('dc01', 10003, '04-05-20', null, 1001);




--1
select guestname,guestaddress
from guest
where guestaddress like'%London%'
order by guestname asc


--2
select g.guestname
from guest g inner join booking b
on g.guestno=b.guestno
where b.dateto is null
order by guestname



--3  
SELECT DISTINCT h.hotelname, h.city
FROM booking b
JOIN hotel h ON b.hotelno = h.hotelno
JOIN guest g ON b.guestno = g.guestno
WHERE g.guestaddress LIKE '%London%'



--4 
select AVG(r.price) AvgPrice
from room r inner join hotel h 
on h.hotelno=r.hotelno
where h.city like'%London%'


--5

select max(price) price from room r
group by r.type

--6
select h.hotelname ,count(*) room_no
from hotel h inner join room r
on h.hotelno=r.hotelno
group by h.hotelname  -- display by name --q'

--7 
select Distinct h.hotelname,h.city ,count(*) room_no 
from hotel h  inner join room r
on h.hotelno=r.hotelno 
group by h.hotelname,h.city


--8 

select h.hotelname , b.datefrom
from  booking b right join hotel h 
--from  booking b left join hotel h 
--from hotel h  right join booking b  check and test 

on h.hotelno=b.hotelno
order by h.hotelno 




 --*****Post lab

 -- 1--Post lab
select h.hotelname,b.guestno,b.roomno 
from hotel h inner join booking b
on h.hotelno=b.hotelno
where b.datefrom like'%2001%' or b.datefrom like'%2002%'

-- 2--Post lab
select h.hotelname,h.hotelno,r.roomno,
case 
when( r.type= 'family') THEN 'family'
else 'NULL'
end t
from hotel h inner join room r 
on r.hotelno=h.hotelno 

-- 3--Post lab
select count(*) number_of_hotel,h.city
 from hotel h 
 group by h.city


 -- 4--Post lab
 select sum(r.price) total_price,r.type
  from room r
  where r.type='double'
  group by r.type



   -- 5--Post lab
  select distinct count (g.guestname) GUEST
   from guest g inner join booking b
   on b.guestno=g.guestno
   where b.dateto<='05-01-15'

   -- 5 second method
 select distinct count (b.guestno) GUEST
 from  booking b
 where b.dateto<='05-01-15'  -- 05-01-15 MM-DD-YY is same as 2015-05-01 YY-MM-DD


    -- 6--Post lab

	select min(r.price) min_Price ,h.city 
	from hotel h inner join room r 
	on h.hotelno=r.hotelno
	group by h.city

	--7- Post lab


	select count( b.guestno) roomsbooked,g.guestname,b.guestno
	from booking b , guest g 
	where b.guestno=g.guestno
    group by b.guestno,g.guestname
	having count(b.guestno) >=2 


	--7  another approach
	select count(b.guestno) guestn,g.guestname,b.guestno
	from booking b,guest g
	where b.guestno=g.guestno
	group by g.guestname,b.guestno
	having count(b.guestno)>=2


  
  --8 Post lab

