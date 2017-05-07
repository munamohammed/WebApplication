/**
 * Created by muna on 4/1/17.
 */

const mysql = require('mysql-promise')();
const remoteMysql = require('mysql-promise')();
const moment = require('moment');
var sg = require('sendgrid')('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');
var helper = require('sendgrid').mail;

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
     //console.log("Connected to MySQL !");
     }
     else {
     //console.log("Cannot Connect to MySQL !"+err);
     }
     })
     }*/


    authenticate(userInfo) {
        let query = `select User_ID,First_name,Last_name,user_type from User where User_ID='${userInfo.userId}' and User_password='${userInfo.password}'`;
        return mysql.query(query).spread(rows => {
            ////console.log(JSON.stringify(rows));
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
     //console.log(dString);
     let insertQuery = `insert into attendance.Reading (Tag_serial_no,Reading_date_time,Reader_Id)
     values ('${r.Tag_serial_no}','${dString}',${r.Reader_id})`;//insert into the table Reading
     //console.log(insertQuery);
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
        //console.log(query);
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
            //console.log("*Str = " + str);
            str = str.replace(/ /g, '');
            //console.log("*Str = " + str);
            return parseInt(str)
                ;
        })
    }

    async generateNewTag() {
        let max = await this.getMaxTag();
        //console.log("max: " + max);
        max += 1;
        let str = await this.pad(max.toString(), 6); //TO add zeros in the left side of the number
        //console.log("str: " + str);
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

    async getInstSections(instId) {
        let query = `select distinct CRN From  Section 
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
        console.log(query);
        return mysql.query(query).spread(rows => {
            console.log("Rows= " + JSON.stringify(rows));
            return rows.affectedRows;

        })

    }

    async studentsExceededAbsentLimit(CRN, date) {
        let query1 = `SELECT settingSubtype from Settings 
        where CRN = ${CRN} and settingType='alert'
        order by settingSubtype  desc`;

        mysql.query(query1).spread(rows => {
            let q = '';
            let index = 0;
            for (let r of rows) {

                let prct = parseInt(r.settingSubtype);
                if (index == 0) {
                    q = q + `percentage >= ${prct} `
                }
                else {
                    console.log("index",index)
                    let oldpercent = parseInt(rows[index - 1].settingSubtype) - 1;
                    q = q + `  or percentage between ${prct} and ${oldpercent}.9999 `
                }

                index++;
            }


            let query2 = `
SELECT 
    tbl3.*
FROM
    (SELECT 
        tbl2.Student_id,
            tbl2.CRN,
            tbl2.numofAbsence,tbl2.x,  round (tbl2.numofAbsence * 100 / tbl2.x ) AS percentage
    FROM
        (SELECT 
        tbl.Student_id, tbl.CRN, tbl.numofAbsence, (SELECT COUNT(*)   FROM Schedule WHERE CRN = ${CRN}) AS x
    FROM
        (SELECT Student_id, CRN,SUM(CASE WHEN isAbsent = 1 THEN 1 ELSE 0  END) AS numofAbsence
    FROM         StudentAttendance INNER JOIN Schedule 
    ON StudentAttendance.Schedule_id = Schedule.ScheduleID
    where Schedule.StartDateTime <= STR_TO_DATE('${date}', '%d-%m-%Y')

    GROUP BY Student_id,CRN
    
    ) AS tbl
    INNER JOIN Enrollment ON tbl.Student_id = Enrollment.Student_ID
        AND tbl.CRN = Enrollment.CRN
    WHERE
        tbl.numofAbsence > Enrollment.numofAbsence) AS tbl2
    ) AS tbl3
    WHERE
        (${q} )
`;


            console.log(query2);

            mysql.query(query2).spread(rows => {
                for (let r of rows) {
                    let query3 = `INSERT INTO attendance.Email (Student_ID, Instructor_id, CRN, DateTime, Subject, Message)
                        select ${r.Student_id}, Section.InstructorID, ${r.CRN}, now() as emailTime,
                         concat('Attendance Warning for: ', Section.CourseCode ,' - ' , CourseName) as Subject ,
                         concat('Your Absence Percent is now:   ', ${r.percentage} ) as Message from Section 
                         inner join Course on Course.CourseCode = Section.CourseCode
                         where CRN = ${r.CRN}`;

                    console.log('insertQurey',query3)
                    return mysql.query(query3).spread(rows => {
                       // this.sendEmail('linaselim77@gmail.com','muna.alremaihi@gmail.com','Hi','Test email');

                        ////console.log("Rows= " + JSON.stringify(rows));
                        return rows.affectedRows;

                    })

                }



            })

        })


    }

    async insertEmails(CRN, date) {
        let query = `INSERT INTO attendance.Email
        (
        Student_ID,
        Instructor_id,
        CRN,
        DateTime,
        Subject,
        Message
        )

        select Student_id , InstructorID, Schedule.CRN, now() as emailTime,
         concat('Attendance for: ', Section.CourseCode ,' - ' , CourseName) as Subject ,
         concat('You have been recorded as Absent in ', DATE_FORMAT(StartDateTime,'%d-%m-%Y') ) as Message
         from StudentAttendance
        inner join Schedule on Schedule.ScheduleID = StudentAttendance.Schedule_id
        inner join Section on Section.CRN = Schedule.CRN
        inner join Course on Section.CourseCode = Course.CourseCode
        where Schedule.CRN = ${CRN} and DATE_FORMAT(StartDateTime,'%d-%m-%Y') = '${date}'
        and StudentAttendance.IsAbsent = 1
        
        Union
        
        select Student_id , InstructorID, Schedule.CRN, now() as emailTime,
         concat('Attendance for: ', Section.CourseCode ,' - ' , CourseName) as Subject ,
         concat('You have been recorded as Late in ', DATE_FORMAT(StartDateTime,'%d-%m-%Y') ) as Message
         from StudentAttendance
        inner join Schedule on Schedule.ScheduleID = StudentAttendance.Schedule_id
        inner join Section on Section.CRN = Schedule.CRN
        inner join Course on Section.CourseCode = Course.CourseCode
        where Schedule.CRN = ${CRN} and DATE_FORMAT(StartDateTime,'%d-%m-%Y') = '${date}'
        and StudentAttendance.IsLate = 1
`;
        return mysql.query(query).spread(rows => {
            ////console.log("Rows= " + JSON.stringify(rows));
            return rows.affectedRows;

        })

    }

    async updateStudentAbsence(ScheduleID, Student_id, IsAbsent) {
        let query = `update  attendance.StudentAttendance set IsAbsent = ${IsAbsent}
                where Schedule_id = ${ScheduleID}
                and Student_id = ${Student_id};`;

        return mysql.query(query).spread(rows => {
            ////console.log("Rows= " + JSON.stringify(rows));
            return rows.affectedRows;

        })

    }

    async getScheduleID(CRN, date) {

        let query = '';
        query = `select ScheduleID, Attendance_approve from Schedule where CRN= ${CRN}
                and DATE_FORMAT(StartDateTime,'%d-%m-%Y') = '${date}'`;
        //console.log(query);

        return mysql.query(query).spread(rows => {
            //console.log("Rows= " + JSON.stringify(rows));

            let attendance_approve = rows[0].Attendance_approve;
            let scheduleId = rows[0].ScheduleID;
            return {scheduleId, attendance_approve}
        })
    }

    async sendEmails(scheduleId) {
        //console.log("Send Emails to Students");
    }

    async updateApproveStatus(scheduleId, status) {
        let query = `update  attendance.Schedule set Attendance_approve = ${status}
                where ScheduleID = ${scheduleId};`;

        return mysql.query(query).spread(rows => {
            //console.log("Rows= " + JSON.stringify(rows));
            return rows.affectedRows;

        })

    }

    async UpdateAttendance(CRN, date, changes) {

        let numStudent = 0;
        let sch = await this.getScheduleID(CRN, date);
        let scheduleId = sch.scheduleId;
        let attendance_approve = sch.attendance_approve;

        if (attendance_approve == 0) {
            this.sendEmails(scheduleId);
            this.updateApproveStatus(scheduleId, 1);
        }

        return await Promise.all(changes.map((c) => {
                this.updateStudentAbsence(scheduleId, c.StudentId, c.IsAbsent).then(x => {
                    //console.log("x="+x);
                    numStudent += x;
                    return numStudent;
                })

            })
        ).then(() => {
            return numStudent
        });


    }

    async getStudentEmails(student_id, inst_id) {
        let query = `SELECT Subject , Message, DATE_FORMAT(DateTime, '%d/%m/%Y %H:%i:%s') DateTime FROM attendance.Email
            where Student_ID=${student_id} and Instructor_id= ${inst_id}`;

        return mysql.query(query).spread(rows => {
            return rows;
        })
    }

    async deleteAllInstSectionsSettings(instId) {
        let sections = await this.getInstSections(instId);
        let temp = '';
        sections.map((s) => {
            if (temp != '') {
                temp += ','
            }
            temp += s.CRN;
        })

        let query = `delete from Settings where CRN in (${temp})`; // delete from setting table all CRN taught by that InstId
        return mysql.query(query).spread(rows => {
            //console.log("Rows= " + JSON.stringify(rows));
            return rows.affectedRows;

        })

    }

    async deleteSectionSettings(CRN) {
        let query = `delete from Settings where CRN=${CRN}`; // delete from setting table that CRN settings
        return mysql.query(query).spread(rows => {
            //console.log("Rows= " + JSON.stringify(rows));
            return rows.affectedRows;

        })
    }

    async applySettingChanges(CRN, changes) {
        return Promise.all(changes.map((c) => {
            let query = '';
            if (c.change == 'insert' && c.settingSubtype != 'none') {
                query = `insert into Settings (CRN,settingType,settingSubtype) values (${CRN},'${c.settingType}','${c.settingSubtype}')`;

            }
            else {
                query = `delete from Settings where CRN= ${CRN} and settingType= '${c.settingType}' and settingSubtype='${c.settingSubtype}'`;
            }

            //console.log(query);
            return mysql.query(query).spread(rows => {
                //console.log("Rows= " + JSON.stringify(rows));
                return rows.affectedRows;

            })
        }))
    }

    async applySettingToAllCourses(instId, changes) {
        await this.deleteAllInstSectionsSettings(instId);
        let sections = await this.getInstSections(instId);

        sections.map((s) => {
            this.applySettingChanges(s.CRN, changes);// apply to all sections of this instructor
        })

    }

    async applySettingToAllCourseSections(instId, CourseCode, changes) {
        await this.deleteAllInstSectionsSettings(instId);
        let sections = await this.getClassSections(instId, CourseCode);

        sections.map((s) => {
            this.applySettingChanges(s.CRN, changes);// apply to all sections of this instructor
        })
    }

    async applySettingToCourseSection(CRN, changes) {
        await this.deleteSectionSettings(CRN);
        await this.applySettingChanges(CRN, changes);// apply to all sections of this instructor

    }

    async getSectionSettings(CRN) {
        let query = `SELECT *  FROM attendance.Settings
            where CRN=${CRN} `;

        return mysql.query(query).spread(rows => {
            return rows;
        })
    }


    async UpdateSettings(instId, CRN, CourseCode, changes) {
        //console.log("Update Settings function",instId,CRN,CourseCode);
        if (CRN == 'all')
            if (CourseCode == 'all')
                this.applySettingToAllCourses(instId, changes);
            else
                this.applySettingToAllCourseSections(CourseCode, changes);
        else
            this.applySettingToCourseSection(CRN, changes);


    }

    async sendBatchEmailViaSendGrid(){  //batch = group
        let query = `select Email_id , Subject , Message,  iuser.Email as instructorEmail , suser.Email as studentEmail , suser.First_name as studentName
            from Email
            inner join User as iuser on Email.Instructor_id = iuser.User_ID
            inner join User as suser on Email.Student_ID = suser.User_ID
            where Email.sendDateTime is null`;

        return mysql.query(query).spread(rows => {
            for (let r of rows){
                console.log('r',r);
                var fromEmail = new helper.Email(r.instructorEmail);
                var toEmail = new helper.Email(r.studentEmail);
                var cc = new helper.Email(r.instructorEmail);
                var subject = r.Subject;
                var content = new helper.Content('text/plain', `Hi ${r.studentName}\n ${r.Message}`);
                var mail = new helper.Mail(fromEmail, subject, toEmail, content);

                var request = sg.emptyRequest({
                    method: 'POST',
                    path: '/v3/mail/send',
                    body: mail.toJSON()
                });

                sg.API(request, function (error, response) {
                    if (error) {
                        console.log('Error response received');
                    }
                    console.log('statusCode',response.statusCode);
                    console.log('Body',response.body);
                    console.log('Headers',response.headers);

                    let query2= `update Email set senddatetime = now()
                        where Email_id = ${r.Email_id} `;



                    mysql.query(query2).spread(rows => {
                        //console.log("Rows= " + JSON.stringify(rows));
                        return rows.affectedRows;

                    })

                });
            }
        })

        // using SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs


    }
}

module.exports = new Repository();