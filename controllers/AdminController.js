/**
 * Created by muna on 4/1/17.
 */
class AdminController {
    async AdmintLanding (req,res){
        req.session.admin = true;
        res.redirect('/checktag');
    }

    checktag(req, res){
        res.render('CheckTag',{currentUser: req.session.user, admin:true });
    }
}

module.exports = new AdminController();