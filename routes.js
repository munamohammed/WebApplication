let express = require('express');

let router = express.Router();
//const fs = require("fs-promise")

let studentController = require('./controllers/StudentController');
let instructorController = require('./controllers/InstructorController');
let adminController = require('./controllers/AdminController');
let loginController = require('./controllers/LoginController');


router.get('/login', (req, res) => {
    loginController.loginForm(req, res)
});

router.post('/login', (req,res) =>{
    console.log(req.body);
    loginController.authenticate(req,res)
}) ;
router.get('/logout', (req, res) => loginController.logout(req, res));



router.get('/landing', (req, res) => {

    let user = req.session.user;
    if (user){
        if (user.userType == 's')
            studentController.StudentLanding(req,res);
        else if (user.userType == 'i')
            instructorController.InstructorLanding(req,res);
        else if (user.userType == 'a')
            adminController.AdmintLanding(req,res);
    } else {
        res.status(500).send("User Not Found in the cookie");
    }
});



//Middleware to intercept requests and redirect to the login page if the user is not logged-in. Only apllies to /students and /heroes
function isAuthenticated(req, res, next) {
    const username = req.cookies.username
    console.log("isAuthenticated.username", username)
    if (!username) {
        res.redirect("/login")
    } else {
        return next()
    }
}

//Instructor
router.get('/Email', (req, res) => instructorController.getEmails(req, res));
router.get('/studentattendance',(req,res) => instructorController.studentattendance(req,res));
router.get('/statistics', (req, res) => instructorController.statistic(req, res));
router.get('/settings', (req, res) => instructorController.setting(req, res));
router.get('/course/:CourseCode/:InstId',(req,res) => instructorController.getSectionsJson(req,res));
router.get('/dates/:CRN',(req,res) => instructorController.getClassDates(req,res));
router.get('/attendance/:CRN/:date',(req,res) => instructorController.getSectionAttendance(req,res));
router.get('/approval/:CRN/:date', (req,res) => instructorController.getSectionApproval(req,res));
router.get('/save/:CRN/:date', (req,res) => instructorController.ApproveLecture(req,res));
router.post('/update/attendance/', (req,res)=> instructorController.UpdateAttendance(req,res));
router.get('/emails/:instId/:Student_id' , (req,res)=> instructorController.getInstEmails(req,res));

//Student
router.get('/getClasses', (req, res) => studentController.getClasses(req,res));
router.get('/getClasses/:crn', (req, res) => studentController.getClassDetails(req,res));

//Admin
router.get('/checktag', (req, res) => adminController.getStudents(req, res));
router.post('/studentTag', (req, res) => adminController.getStudentTags(req, res));
router.post('/student/Tag', (req, res) => adminController.postNewTag(req, res));




module.exports = router;
