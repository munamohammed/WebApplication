let repo = require('../models/Repository.js');

class StudentController {
    async StudentLanding (req,res){
        req.session.student = true;
        res.redirect('/getClasses');
    }


    async getClasses(req,res){
        let Class = await repo.getStudentClassesAttendance(req.session.user.userId);
        res.render('StudentClass',{Class});
    }

    async getClassDetails(req,res){
        let CRN = req.params.crn;
        let CourseName = await repo.getCourseName(CRN);
        //CourseName = CourseName.CourseName;
        let details = await repo.getClassDetails(CRN,req.session.user.userId);
        details.map(d=>{  // loop in every object in the table
            if(d.IsLate=='') // if the student is not late remove the check
                delete d.IsLate;
            if(d.IsAbsent=='') // if the student is not absent remove the check
                delete d.IsAbsent;

        })
        res.render('StudentClassDetails',{details,CourseName});
    }



}

module.exports = new StudentController();