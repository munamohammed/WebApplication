/**
 * Created by muna on 4/1/17.
 */
let repo = require('../models/Repository.js');

class AdminController {
    async AdmintLanding (req,res){
        req.session.admin = true;
        res.redirect('/checktag');
    }


    async getStudents(req,res){
        let students = await repo.getStudents();
        res.render('CheckTag',{students});
    }

    async getStudentTags(req, res){
        let data = req.body.searchstudent;
        let sid = data.split('-')[0]; //take only the first element of the array
        let tags = await repo.getStudentTags(sid);
console.log(tags);
        let students = await repo.getStudents();


        tags.map(d=> {  // loop in every object in the table
            if (d.Active == 'N') // if the tag is not active remove the check
                delete d.Active;

        });

        res.render('CheckTag',{students,tags,data});
    }

    async postNewTag(req, res){
        let data = req.body.searchstudent;
        let studentId = data.split('-')[0]; //take only the first element of the array
       await repo.deactivateStudentTags(studentId);
       await repo.addNewTag(studentId);
        let tags = await repo.getStudentTags(studentId);

        tags.map(d=> {  // loop in every object in the table
            if (d.Active == 'N') // if the tag is not active remove the check
                delete d.Active;

        });

        let students = await repo.getStudents();

        res.render('CheckTag',{students,tags,data});


    }
}

module.exports = new AdminController();