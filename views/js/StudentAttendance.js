$(document).ready(()=>{
    $('#Course').on('change',()=>{

    })
})

async function loadCourseSection(InstId) {
    let CourseCode = $('#selectclass').val();
    CourseCode = `${CourseCode}`;
    let url = `/course/${CourseCode}/${InstId}`;
    //console.log("CourseCode = "+CourseCode);
    let template = ` 
                            <option selected> Select Section</option>
                             {{#sections}}
                             <option value="{{CRN}}">{{SectionNo}}</option>
                            {{/sections}}`;
    //console.log("URL ="+url);
    let data = await fetch(url);

    let sections = await data.json();
    //console.log("Sections ="+sections);

    //let sections = await JSON.parse(data);
    let handlebars = Handlebars.compile(template);
    let html = handlebars({sections});
    $('#sectionList').html(html);

}

async function loadClassDates() {
    let CRN = $('#sectionList').val();
    let url = `/dates/${CRN}`;
    //console.log("CRN = " + CRN);

    //console.log("URL =" + url);
    let data = await fetch(url);

    let dates = await data.json();
    //console.log("Date =" + dates);

    //let sections = await JSON.parse(data);
    disableddates = []; // clear the array
    colors =[];
    approvalDates =[];
    dates.map((d) => {
        disableddates.push(d.LectureDate);  //fill the calendar with lecture dates of this CRN
        colors.push((d.color));
        approvalDates.push(d.ApprovalDate);
    })
}

async function DisplayAttendance() {
    let CRN = $('#sectionList').val();
    let date = $('#datepicker').val();
    date = `${date}`;
    let url = `/attendance/${CRN}/${date}`;

    let data = await fetch(url);
    let attendance = await data.json();


    url = `/approval/${CRN}/${date}`;
    data = await fetch(url);
    let approved = await data.json();

    let template = ` <table style="width: 95%; margin-left:20px">
                <tr>
                    <th>Picture</th>
                    <th>Student Name</th>
                    <th>SID</th>
                    <th>In-Time</th>
                    <th>Out-Time</th>
                    <th>Late</th>
                    <th>Absent</th>
                    <th>% Absent</th>
                </tr>
 
 
 
 {{#attendance}}
                    <tr>
                        <td style="width: 20px"><img src="/views/images/{{Student_id}}.jpg" class="profile"></td>
                        <td style="width: 100px">{{First_name}} {{Last_name}}</td>
                        <td style="width: 50px">{{Student_id}}</td>
                        <td style="width: 80px">{{attendtime}}</td>
                        <td style="width: 80px">{{leavetime}}</td>
                        <td style="width: 10px"><input type="checkbox"  disabled {{#if IsLate}} checked {{/if}}></td>
                        <td style="width: 5px"><input type="checkbox" class="absent" data-Student_id = "{{Student_id}}" {{#if final_approve}} disabled  {{/if}}
                        {{#if IsAbsent}} data-state="1" checked {{else}} data-state="0" {{/if}} ></td>
                        <td style="width: 15px">{{percent}}</td>
                    </tr>
                    {{/attendance}}
  </table>
  <br>

    <label style="margin-left:20px">Student Attend: {{numattend}}</label>
    <label style="margin-left:40px">Student Absent: {{numabsent}}</label>
    <br>`;

    let buttonTemplate = `<div id="approvediv"><button type="button" onclick="SaveAttendance()" class="w3-button w3-grey w3-round w3-border" style="margin-left:20px">Save</button></div>`
    let approvedMess = `<div id="approvediv">This Lecture Attendance has been approved</div>`
    approved = parseInt(approved); // convert from string to int
    let numabsent = 0;
    let numattend = 0;
    if (attendance.length > 0) // if there is attendance
    {
        numabsent = attendance.reduce((total,cur) => {
            if(cur.IsAbsent){ // if the student is absent
               // pre = pre+1;
                return total+1; // increment the total number of absent students
            }
            else
                return total;
        },0) // initial value 0
        numattend = attendance.length - numabsent ;

    if (approved == 2)
        template += approvedMess ;
    else
        template += buttonTemplate ;
    }

    let handlebars = Handlebars.compile(template);
    let html = handlebars({attendance,numabsent,numattend});
    $('#attendanceTable').html(html);

}

async function ApproveAttendance() {
    
}

async function SaveAttendance(){
    let CRN = $('#sectionList').val();
    let date = $('#datepicker').val();
    date = `${date}`;
    let changes = [];

    $('.absent').map((idx,c) => {

        if (c.checked == true && $(c).attr('data-state') =='0'){ // '0' not absent 'true' instructor mark as absent
            changes.push({StudentId:$(c).attr('data-Student_id'),IsAbsent: 1}) // absent == true
        }
        else if (c.checked == false && $(c).attr('data-state') =='1'){ //'1' absent 'false' instructor mark as not absent
            changes.push({StudentId:$(c).attr('data-Student_id'),IsAbsent: 0}) // absent == false
        }

    })
    if(changes.length==0){
        alert('No Changes were made !')
        return;  //exit
    }
    //alert(JSON.stringify(changes));
    let requestBody = {CRN:CRN,date:date,changes:changes};

    let url = '/update/attendance/';
    let data = await fetch(url, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }, method: 'POST', body: JSON.stringify(requestBody)
    });



    $('#approvediv').html(`Your changes have been saved for this lecture`)

}



