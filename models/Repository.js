
/**
 * Created by muna on 4/1/17.
 */

const mysql = require('mysql-promise')();
const remoteMysql = require('mysql-promise')();
const moment = require('moment');
class Repository {


    constructor() {

        mysql.configure({
            host: 'localhost',
            user: 'root',
            password: 'muna12345',
            database: 'attendance'
        });

        // this.connect();

    }

    /*    connect(){
     this.connection.connect((err)=>{
     if ( ! err ){
     console.log("Connected to MySQL !");
     }
     else {
     console.log("Cannot Connect to MySQL !"+err);
     }
     })
     }*/


    authenticate(userInfo) {
        let query = `select User_ID,First_name,Last_name,user_type from User where User_ID='${userInfo.userId}' and User_password='${userInfo.password}'`;
        return mysql.query(query).spread(rows => {
            //console.log(JSON.stringify(rows));
            if (rows.length == 0) {
                return undefined;
            }

            else {
                return {
                    username: `${rows[0]["First_name"]} ${rows[0]["Last_name"]}`,
                    userId: rows[0]["User_ID"],
                    userType: rows[0]["user_type"]
                };
            }
        })
    }
/*
       getRFServiceReading(){ // connect to the temporary database (RF Service)
     remoteMysql.configure ({
     host     : '192.168.1.53', // IP of the PC running the RF Service
     user     : 'root',
     password : 'muna12345',
     database : 'attendance'
     });

     let query = `select * from readings`;
     return mysql.query(query).spread (rows => {
     return rows;
     })
     }
     insertRFServiceReading(rows){
     mysql.configure ({
     host     : 'localhost', // IP of the PC running the RF Service
     user     : 'root',
     password : 'muna12345',
     database : 'attendance'
     });

     rows.map(r=>{
     let d= moment(r.Reading_date_time);
     let dString = d.format('YYYY-MM-DD HH:mm:ss');
     console.log(dString);
     let insertQuery = `insert into attendance.Reading (Tag_serial_no,Reading_date_time,Reader_Id)
     values ('${r.Tag_serial_no}','${dString}',${r.Reader_id})`;//insert into the table Reading
     console.log(insertQuery);
     return mysql.query(insertQuery).spread (rows => {
     return rows;
     })
     })

     }
     */
    async getStudentClassesAttendance(studentId) {
        let query = `SELECT Enrollment.CRN , Section.CourseCode, Course.CourseName, 10 as absence 
            from Enrollment inner join Section on Enrollment.CRN = Section.CRN 
            inner join Course on Course.CourseCode = Section.CourseCode
            where Student_ID= ${studentId}`;

        return mysql.query(query).spread(rows => {
            return rows;
        })
    }

    async getClassDetails(CRN, studentId) {
        let query = `SELECT sc.StartDateTime, sc.EndDataTime, sc.RoomCode,  sa.Calculated_attend_time, sa.Calculated_leave_time,
            DATE_FORMAT(sc.StartDateTime,'%W') dayname, DATE_FORMAT(sc.StartDateTime,'%d/%m/%Y') lectureDate,
            DATE_FORMAT(sa.Calculated_attend_time,'%r') attendtime, DATE_FORMAT(sa.Calculated_leave_time,'%r') leavetime,
            case when sa.IsLate=1 then 'checked' else ''  end as  IsLate,
            case when  sa.IsAbsent=1 then'checked' else '' end as IsAbsent
            FROM attendance.StudentAttendance sa
            inner join attendance.Schedule sc on sa.Schedule_id = sc.ScheduleID
            where sa.Student_id = ${studentId} and sc.CRN = ${CRN} `;
        console.log(query);
        return mysql.query(query).spread(rows => {
            return rows;
        })
    }

    async getCourseName(CRN) {
        let query = `select CourseName from Course
            inner join Section on Course.CourseCode = Section.CourseCode
            where Section.CRN = ${CRN}`;

        return mysql.query(query).spread(rows => {
            return rows[0].CourseName;

        })
    }

    async getStudents() {
        let query = `SELECT ID,First_name, Last_name FROM attendance.Student s
                inner join attendance.User u on s.ID = u.User_ID `;

        return mysql.query(query).spread(rows => {
            return rows;

        })
    }

    async getInstructorStudents(instId) {
        let query = `SELECT distinct ID,First_name, Last_name FROM attendance.Student s
                inner join attendance.User u on s.ID = u.User_ID 
                inner join attendance.Enrollment e on e.Student_ID = s.ID
                where e.CRN in (select CRN from Section where InstructorID= ${instId})`;

        return mysql.query(query).spread(rows => {
            return rows;

        })
    }

    async getStudentTags(sid) {
        let query = `SELECT * FROM attendance.Rfid_tag
            where Student_ID = ${sid}`;

        return mysql.query(query).spread(rows => {
            if (rows.length == 0) {
                rows.push({Serial_no: '', Active: 'Y', Student_ID: sid});
            }
            return rows;

        })
    }

    async getTagsStudent(Tag_serial) {
        let query = `SELECT * FROM attendance.Rfid_tag
            where Serial_no = ${Tag_serial}`;

        return mysql.query(query).spread(rows => {
            return rows;

        })
    }

    async getMaxTag() {
        let query = `SELECT max(Serial_no) as Serial_no FROM attendance.Rfid_tag`
        return mysql.query(query).spread(rows => {
            let str = rows[0].Serial_no;
            console.log("*Str = " + str);
            str = str.replace(/ /g, '');
            console.log("*Str = " + str);
            return parseInt(str)
                ;
        })
    }

    async generateNewTag() {
        let max = await this.getMaxTag();
        console.log("max: " + max);
        max += 1;
        let str = await this.pad(max.toString(), 6); //TO add zeros in the left side of the number
        console.log("str: " + str);
        str = str.charAt(0) + str.charAt(1) + ' ' + str.charAt(2) + str.charAt(3) + ' ' + str.charAt(4) + str.charAt(5);
        return str;

    }


    async pad(n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    }

    async addNewTag(studentId) {
        let newTag = await this.generateNewTag();
        let query = `insert into  attendance.Rfid_tag (Serial_no, Active, Student_ID)
           values ('${newTag}', 'Y', ${studentId})`;
        return mysql.query(query).spread(rows => {
            return rows;
        })
    }

    async deactivateStudentTags(studentId) {
        let query = `update attendance.Rfid_tag set Active= 'N' where Student_ID= ${studentId}`;
        return mysql.query(query).spread(rows => {
            return rows;
        })
    }

    async getInstClasses(instId) {
        let query = `select distinct Course.CourseName, Course.CourseCode From  Course 
            inner join Section on Course.CourseCode = Section.CourseCode
            where InstructorID = ${instId}`;

        return mysql.query(query).spread(rows => {
            return rows;
        })
    }


    async getClassSections(instId, CourseCode) {
        let query = `select Course.CourseCode , Section.SectionNo , Section.CRN From  Course 
            inner join Section on Course.CourseCode = Section.CourseCode 
            where Section.InstructorID = ${instId} and Course.CourseCode = '${CourseCode}'`;

        return mysql.query(query).spread(rows => {
            return rows;
        })

    }

    async getClassDates(CRN) {
        let query = `SELECT DATE_FORMAT (StartDateTime,'%c-%e-%Y') LectureDate ,
        case when StartDateTime > current_date() then ''
        else
        case when Attendance_approve = 0 then 'yellow' else 'green' end
        end as color
        FROM attendance.Schedule where CRN = ${CRN}`;

        return mysql.query(query).spread(rows => {
            return rows;
        })
    }

    async getSectionAttendance(CRN, date) {
        let query = `SELECT s.CRN, sa.Student_id, u.First_name, u.Last_name, 
            DATE_FORMAT(sa.Calculated_attend_time,'%r') attendtime, DATE_FORMAT(sa.Calculated_leave_time,'%r') leavetime,
            sa.IsLate, sa.IsAbsent , getStudentAbsentPercent(sa.Student_id,s.ScheduleID) as percent 
            FROM attendance.StudentAttendance sa
            inner join User u on u.User_ID=sa.Student_id
            inner join Schedule s on s.ScheduleID=sa.Schedule_id
            where s.CRN = ${CRN} and
            DATE_FORMAT(s.StartDateTime,'%d-%m-%Y') = '${date}'`;

        return mysql.query(query).spread(rows => {
            return rows;
        })
    }

    async getSectionApproval(CRN, date) {
        let query = `SELECT Attendance_approve
 FROM attendance.Schedule where CRN = ${CRN} 
 and DATE_FORMAT(StartDateTime,'%d-%m-%Y') = '${date}'`;

        return mysql.query(query).spread(rows => {
            if (rows.length == 0)
                return 0;
            else
                return rows[0].Attendance_approve; //only retreive first column of the first row
        })

    }

    async ApproveLecture(CRN, date) {
        let query = `update  attendance.Schedule set Attendance_approve = 1, Approval_dateTime = current_date()
                where CRN= ${CRN}
                and DATE_FORMAT(StartDateTime,'%d-%m-%Y') = '${date}'`;

        return mysql.query(query).spread(rows => {
            console.log("Rows= " + JSON.stringify(rows));
            return rows.affectedRows;

        })

    }

    async updateStudentAbsence(ScheduleID, Student_id, IsAbsent) {
        let query = `update  attendance.StudentAttendance set IsAbsent = ${IsAbsent}
                where Schedule_id = ${ScheduleID}
                and Student_id = ${Student_id};`;

        return mysql.query(query).spread(rows => {
            console.log("Rows= " + JSON.stringify(rows));
            return rows.affectedRows;

        })

    }

    async getScheduleID(CRN, date) {

        let query = '';
        query = `select ScheduleID, Attendance_approve from Schedule where CRN= ${CRN}
                and DATE_FORMAT(StartDateTime,'%d-%m-%Y') = '${date}'`;
        console.log(query);

        return mysql.query(query).spread(rows => {
            console.log("Rows= " + JSON.stringify(rows));

            let attendance_approve = rows[0].Attendance_approve;
            let scheduleId = rows[0].ScheduleID;
            return {scheduleId, attendance_approve}
        })
    }
    async sendEmails(scheduleId){
        console.log("Send Emails to Students");
    }

    async updateApproveStatus(scheduleId, status){
        let query = `update  attendance.Schedule set Attendance_approve = ${status}
                where ScheduleID = ${scheduleId};`;

        return mysql.query(query).spread(rows => {
            console.log("Rows= " + JSON.stringify(rows));
            return rows.affectedRows;

        })

    }
    async UpdateAttendance(CRN, date, changes) {

        let numStudent = 0;
        let  sch= await this.getScheduleID(CRN, date);
        let scheduleId= sch.scheduleId;
        let attendance_approve= sch.attendance_approve;

        if (attendance_approve==0){
            this.sendEmails(scheduleId);
            this.updateApproveStatus(scheduleId,1);
        }

        return await Promise.all(changes.map((c) => {
                this.updateStudentAbsence(scheduleId, c.StudentId, c.IsAbsent).then(x => {
                    console.log("x="+x);
                    numStudent += x;
                    return numStudent;
                })

            })
        ).then(() => {
            return numStudent
        });


    }

    async getStudentEmails(student_id,inst_id){
        let query = `SELECT Subject , Message, DATE_FORMAT(DateTime, '%d/%m/%Y %H:%i:%s') DateTime FROM attendance.Email
            where Student_ID=${student_id} and Instructor_id= ${inst_id}`;

        return mysql.query(query).spread(rows => {
            return rows;
        })
    }
}

module.exports = new Repository();