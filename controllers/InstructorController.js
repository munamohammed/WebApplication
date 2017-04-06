/**
 * Created by muna on 4/1/17.
 */

class InstructorController {
    async InstructorLanding (req,res){
        req.session.instructor = true;
        res.redirect('/studentattendance');
    }

    studentattendance(req,res) {
        res.render('StudentAttendance',{currentUser: req.session.user, instructor:true });
    }

    email(req, res){
        res.render('Email',{currentUser: req.session.user, instructor:true });
    }

    statistic(req, res){
        res.render('Statistic',{currentUser: req.session.user, instructor:true });

    }

    setting(req, res){
        res.render('Setting',{currentUser: req.session.user, instructor:true });
    }
}

module.exports = new InstructorController();