/**
 * Created by muna on 5/9/17.
 */

// 1- get the attendance data from each RF Service every 5 min
// 2- updeate the lastReadingID to the reader table (readerId row)
// 3- inseret the data into the readings table
    //3.1 : group by student , order by time
    //3.2 : for each room: consider the first reading as IN and the next as OUT and so on.
// 4- analysis
    // any student has at least 1 IN reading within the lecture time-frame,
    // OR attended a previous lecture in the same room without leaving - > attend
    //
    // any student has no readings within the lecture time-frame - > absent

    // any student with IN time after the grace period -> late
// any student attended one lecture , she should be recorded as attended for the subsequent lectures in the same room
// any student left from a lecture , she should be recoreded as absent for the subsequent lecture in the same room
// this service will initialize each day attendance as absent for all student at the beginning of the day
    // by default all students are absent

    //-------------------------------
    //will run every 5 mins and check the current lecture
    // retreive the current lecture student's
    // get the closest (in) status to the lecture time (before/ after)
    // decide on the status of the student (absent , late or attend)

let repo = require('./models/Repository');
const mysql = require('mysql-promise')();
let moment = require('moment');

let date = new Date();
let day = date.getDay();
let month = date.getMonth();
let year = date.getYear();

class service {


    constructor() {

        mysql.configure({
            host: 'localhost',
            user: 'root',
            password: 'muna12345',
            database: 'attendance'
        });

        // this.connect();

    }


async  getRFServiceReading(ip, user, password, database, lastReadingID) { // connect to the temporary database (RF Service)
    remoteMysql.configure({
        host: ip, // IP of the PC running the RF Service
        user: user,
        password: password,
        database: database
    });

    let query = `select * from readings where id > ${lastReadingID} order by id`;
    return mysql.query(query).spread(rows => {
        return rows;
    })
}

async  insertRFServiceReading(rows) {
    mysql.configure({
        host: 'localhost', // IP of the PC running the RF Service
        user: 'root',
        password: 'muna12345',
        database: 'attendance'
    });

    rows.map(r => {
        let d = moment(r.Reading_date_time);
        let dString = d.format('YYYY-MM-DD HH:mm:ss');
        //console.log(dString);
        let insertQuery = `insert into attendance.Reading (Tag_serial_no,Reading_date_time,Reader_Id)
 values ('${r.Tag_serial_no}','${dString}',${r.Reader_id})`;//insert into the table Reading
        //console.log(insertQuery);
        return mysql.query(insertQuery).spread(rows => {
            return rows.rowsAffected;
        })
    })

}

async  updateLastReadingID(readerID, lastReadingID) {
    let query = `update Rf_reader 
        set lastReadingID = ${lastReadingID} 
        where Reader_id = ${readerID};`;
    return mysql.query(query).spread(rows => {
        return rows.rowsAffected;
    })

}

async  fetchAllReaderData() {

    let query = `select IP ,Reader_id , RoomCode,Rf_user_name, Rf_pass, lastReadingID  from Rf_reader`;
    return mysql.query(query).spread(rows => {
        for (let r of rows) {
            this.getRFServiceReading(r.IP, r.Rf_user_name, r.Rf_pass, 'attendance', r.lastReadingID).then(readerData => {
                if (readerData.length > 0) //if there are any readings in the remote RF-Reader
                {
                    this.insertRFServiceReading(readerData);
                    this.updateLastReadingID(r.Reader_id, readerData[readerData.length - 1].id)
                }
            })
        }
    })
}

async  updateInOut(date) {
    let query = `SELECT id, RoomCode, Student_ID, Reading_date_time, in_Out_Status FROM Reading
            inner join Rfid_tag on Rfid_tag.Serial_no = Reading.Tag_serial_no
            inner join Rf_reader on Rf_reader.Reader_id = Reading.Reader_Id 
            where Rfid_tag.Active = 'Y'  and date_format(Reading_date_time, '%d-%m-%Y') = '${date}' 
            order by Rf_reader.RoomCode , Student_ID , Reading_date_time;`

    return mysql.query(query).spread(rows => {
        let lastRoomCode = '';
        let lastStudentID  = -1 ;
        let lastState = 'o' ;
        let _in = 'i';
        let _out = 'o';
        for (let r of rows){  //***** for loop for in-Out readings
            if (r.RoomCode != lastRoomCode){ // move to another room (not the same previous room

                if (r.in_Out_Status == null){
                    r.in_Out_Status = _in;
                    lastState = _in;
                    r.changed = true; // to find only the changed in_out so we can update them on database

                }
                else { // student has record
                    lastState = r.in_Out_Status;
                }
            }
            else { // the same room as the previous row
                if (r.Student_ID == lastStudentID){ // another record for the same student and room
                    if (r.in_Out_Status == null){
                        if (lastState == _out){
                            r.in_Out_Status = _in;
                            lastState = _in
                        }
                        else {
                            r.in_Out_Status = _out;
                            lastState = _out;
                        }
                        r.changed = true;
                    }
                    else {
                        lastState = r.in_Out_Status;
                    }
                }
                else { // another student but same room
                    if (r.in_Out_Status == null){ // new reading for this student
                        r.in_Out_Status = _in;
                        lastState = _in;
                        r.changed = true;
                    }
                    else {
                        lastState = r.in_Out_Status; // old reading
                    }


                }
            }
            lastRoomCode = r.RoomCode;
            lastStudentID = r.Student_ID ;
        }

        for (let r of rows){
            if (r.changed){
                let query = `update Reading set in_Out_Status= '${r.in_Out_Status}' where id = ${r.id}`


                mysql.query(query).spread(rows => {
                    return rows.rowsAffected;
                })

            }
        }

    })

}

async AnalysisStudentAttendance(){
        let query = `SELECT table1.* , (StartDateTime  - Reading_date_time) as timeAfterStart , (lateTime - Reading_date_time) as timeAfterLate
            from (
            select Schedule.ScheduleID , StartDateTime, EndDataTime, Schedule.RoomCode, Reading.Tag_serial_no, Reading.Reading_date_time,
            Reading.in_Out_Status , Rfid_tag.Student_ID , date_add(StartDateTime,interval 10 minute) as lateTime
            from Schedule
            inner join Rf_reader on Rf_reader.RoomCode = Schedule.RoomCode
            inner join Reading on Rf_reader.Reader_id = Reading.Reader_Id 
            inner join Rfid_tag on Rfid_tag.Serial_no = Reading.Tag_serial_no
            where StartDateTime <= STR_TO_DATE('2017-04-13 12:00:00','%Y-%m-%d %H:%i:%s')
            and EndDataTime >= STR_TO_DATE('2017-04-13 12:00:00','%Y-%m-%d %H:%i:%s') 
            and Attendance_approve = 0 
            and Reading.Reading_date_time <=  Schedule.EndDataTime 
            order by Rfid_tag.Student_ID , Reading.Reading_date_time ) table1
            `;

    return mysql.query(query).spread(rows => {
        let previousRow = null;
        for(let r of rows){
           // if(r.Student_ID != lastStudent) { // new student
           //     lastStudent = r.Student_ID;
                if(r.in_Out_Status == 'i'){
                    r.status = 'attend';
                    if(previousRow != null && previousRow.Student_ID == r.Student_ID){
                        previousRow.status = '';
                    }
                    console.log(`this student ${r.Student_ID} is attend`)
                    r.inTime = new moment(r.Reading_date_time).format('YYYY-MM-DD HH:mm:ss');
                    if(r.timeAfterLate < 0){
                        r.status='late';
                        if(previousRow != null && previousRow.Student_ID == r.Student_ID){
                            previousRow.status = '';
                        }
                        console.log(`this student ${r.Student_ID} is late`)
                    }
                }
                else {  //if the reading is out and left before the start of lecture
                    if (r.timeAfterStart >= 0) {
                        console.log(`this student ${r.Student_ID} is absent afterStartTime ${r.timeAfterStart}`)
                        r.status = 'absent';
                        if(previousRow != null && previousRow.Student_ID == r.Student_ID){
                            previousRow.status = '';
                        }
                    }
                    else {
                        console.log(`this student ${r.Student_ID} has left during the lecture time`)

                        r.OutTime = new moment(r.Reading_date_time).format('YYYY-MM-DD HH:mm:ss');
                    }
                }
            //}
           // else { // the same student


            //}
            previousRow = r;
        }

        // , Calculated_attend_time = '${r.inTime}', Calculate_leave_time = '${r.OutTime}'
        for (let r of rows){
            if (r.inTime && r.status != 'absent'){
                let query = `update StudentAttendance set Calculated_attend_time = '${r.inTime}' where  Schedule_id = ${r.ScheduleID} 
                    and Student_id = ${r.Student_ID}`;

                console.log(query);

                mysql.query(query).spread(rows => {

                })
            }
            if (r.OutTime){
                let query = `update StudentAttendance set Calculated_leave_time = '${r.OutTime}' where  Schedule_id = ${r.ScheduleID} 
                    and Student_id = ${r.Student_ID}`;

                console.log(query);

                mysql.query(query).spread(rows => {

                })
            }
            if (r.status == 'late'){ // if late
                let query = `update StudentAttendance set IsAbsent = 0 , IsLate = 1 where  Schedule_id = ${r.ScheduleID} 
                    and Student_id = ${r.Student_ID}`;
            console.log(query);

                mysql.query(query).spread(rows => {

                })

            }
            else if(r.status == 'attend'){ // if attend
                let query = `update StudentAttendance set IsAbsent = 0 , IsLate = 0  where  Schedule_id = ${r.ScheduleID} 
                    and Student_id = ${r.Student_ID}`;

                console.log(query);

                mysql.query(query).spread(rows => {

                })
            }
            else if (r.status == 'absent'){
                let query = `update StudentAttendance set IsAbsent = 1 , IsLate = 0 ,
                    Calculated_attend_time = null , Calculated_leave_time = null where  Schedule_id = ${r.ScheduleID} 
                    and Student_id = ${r.Student_ID}`;

                console.log(query);

                mysql.query(query).spread(rows => {

                })
            }


        }


    })


}


/*


// check if it is the beginning of the day
if (date.getHours() == 0 && date.getMinutes() <= 5) { // 00:00:00
    repo.initDayAttendance(`${day}-${month}-${year}`);
}

fetchAllReaderData();
    */
}

module.exports = new service();


//ex:
//9-5-2017   23:54
//          23:59
//10-5-2017   00:04
//            00:09
