class StudentController {
    async StudentLanding (req,res){
        req.session.student = true;
        res.redirect('/getClasses');
    }


    getClasses(req,res){
        res.render('StudentClass',{currentUser: req.session.user, student:true });
    }
}

module.exports = new StudentController();