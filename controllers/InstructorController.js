
/**
 * Created by muna on 4/1/17.
 */

let repo = require('../models/Repository.js');

class InstructorController {
    async InstructorLanding (req,res){
        req.session.instructor = true;
        res.redirect('/studentattendance');
    }

    async studentattendance(req,res) {
        let classes = await repo.getInstClasses(req.session.user.userId);
        res.render('StudentAttendance',{currentUser: req.session.user, instructor:true,classes });
    }

    async getEmails(req, res){
        let students = await repo.getInstructorStudents(req.session.user.userId);
        res.render('Email',{currentUser: req.session.user, instructor:true ,students});
    }

    async getInstEmails(req, res){
        let student_id = req.params.Student_id;
        let inst_id = req.params.instId;
        let emails = await repo.getStudentEmails(student_id,inst_id);

        res.json(emails);
    }


    statistic(req, res){
        res.render('Statistic',{currentUser: req.session.user, instructor:true });

    }


    async setting(req, res){
        let classes = await repo.getInstClasses(req.session.user.userId);
        res.render('Setting',{currentUser: req.session.user, instructor:true,classes });
    }


    async getSectionsJson(req,res){
        let CourseCode = req.params.CourseCode;
        let userId = req.params.InstId;
        console.log("User is ="+userId);
        let sections = await repo.getClassSections(userId,CourseCode);
        console.log("Section="+JSON.stringify(sections));
        res.json(sections); // return sections based on json format
    }


    async getClassSections(req,res){

        let classes = await repo.getClassSections();
        res.render('StudentAttendance',{classes});
    }

    async getClassDates(req,res){
        let CRN = req.params.CRN;
        let dates = await repo.getClassDates(CRN);
        console.log("Dates="+JSON.stringify(dates));
        res.json(dates); // return dates based on json format
    }

    async getSectionAttendance(req,res){
        let CRN = req.params.CRN;
        let date = req.params.date;

        let attendance = await repo.getSectionAttendance(CRN,date);
        res.json(attendance);

    }

    async getSectionApproval(req,res){
        let CRN = req.params.CRN;
        let date = req.params.date;

        let approved = await repo.getSectionApproval(CRN,date);
        res.json(approved);
    }

    async ApproveLecture(req,res){
        let CRN = req.params.CRN;
        let date = req.params.date;

        let numStudent = await repo.ApproveLecture(CRN,date);
        res.json(numStudent);
    }

    async UpdateAttendance(req,res){
        //  let data = await req; // convert from text to json object
        //  console.log(data);
        let CRN = req.body.CRN;
        let date = req.body.date;
        let changes = req.body.changes;

        await repo.UpdateAttendance(CRN,date,changes).then(numChanges=>{
            console.log("numOfChanges=" + numChanges)
            res.json(numChanges);
        })


    }
}

module.exports = new InstructorController();