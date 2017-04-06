/**
 * Created by muna on 4/1/17.
 */

class LoginController{
constructor (){
    this.repo = require('../models/Repository');
}

   async loginForm(req, res){
       res.sendfile("login.html")

   }

    async authenticate(req,res) {
       let userInfo = req.body;
       this.repo.authenticate(userInfo).then(user=>{
          console.log("user is "+JSON.stringify(user));
          if (user != undefined){
              res.redirect('/landing');
          }
          else {
              res.redirect('/login');
          }
      })
//,{message:'User /password not correct'}

    }
}
module.exports = new LoginController();