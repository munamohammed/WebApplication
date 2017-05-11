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

let repo = require('./models/Repository');
let date = new Date();
let day = date.getDay();
let month = date.getMonth();
let year = date.getYear();



async function getRFServiceReading(ip, user, password, database, lastReadingID) { // connect to the temporary database (RF Service)
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

async function insertRFServiceReading(rows) {
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

async function updateLastReadingID(readerID, lastReadingID) {
    let query = `update Rf_reader 
        set lastReadingID = ${lastReadingID} 
        where Reader_id = ${readerID};`;
    return mysql.query(query).spread(rows => {
        return rows.rowsAffected;
    })

}

async function fetchAllReaderData() {

    let query = `select IP ,Reader_id , RoomCode,Rf_user_name, Rf_pass, lastReadingID  from Rf_reader`;
    return mysql.query(query).spread(rows => {
        for (let r of rows) {
            getRFServiceReading(r.IP, r.Rf_user_name, r.Rf_pass, 'attendance', r.lastReadingID).then(readerData => {
                if (readerData.length > 0) //if there are any readings in the remote RF-Reader
                {
                    insertRFServiceReading(readerData);
                    updateLastReadingID(r.Reader_id, readerData[readerData.length - 1].id)
                }
            })
        }
    })
}

async function updateInOut(date) {
    let query = `SELECT RoomCode, Student_ID, Reading_date_time, in_Out_Status FROM Reading
            inner join Rfid_tag on Rfid_tag.Serial_no = Reading.Tag_serial_no
            inner join Rf_reader on Rf_reader.Reader_id = Reading.Reader_Id 
            where Rfid_tag.Active = 'Y'  and date_format(Reading_date_time, '%d-%m-%Y') = '${date}' 
            order by Rf_reader.RoomCode , Student_ID , Reading_date_time;`

    return mysql.query(query).spread(rows => {
        return rows;
    })

    //***** for loop for in-Out readings

}

// check if it is the beginning of the day
if (date.getHours() == 0 && date.getMinutes() <= 5) { // 00:00:00
    repo.initDayAttendance(`${day}-${month}-${year}`);
}

fetchAllReaderData();


//ex:
//9-5-2017   23:54
//          23:59
//10-5-2017   00:04
//            00:09
