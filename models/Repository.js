/**
 * Created by muna on 4/1/17.
 */

const mysql = require('mysql-promise')();

class Repository{


    constructor() {

        mysql.configure ({
            host     : 'localhost',
            user     : 'root',
            password : 'muna12345',
            database : 'attendance'
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


    authenticate(userInfo){
        let query = `select User_ID,First_name,Last_name,user_type from User where User_ID='${userInfo.userId}' and User_password='${userInfo.password}'`;
        return mysql.query(query).spread(rows=>{
            console.log(JSON.stringify(rows));
            if (rows.length==0){
                return undefined;
            }

            else{
                return {username:`${rows[0]["First_name"]} ${rows[0]["Last_name"]}`, userId: rows[0]["User_ID"], userType: rows[0]["user_type"]};
            }
        })
    }
}

module.exports = new Repository();