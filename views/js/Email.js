/**
 * Created by muna on 4/22/17.
 */


async function getEmails(instId) {
    console.log("Hi");
    let Student_id = $('#searchstudent').val().split('-')[0];
    let url = `/emails/${instId}/${Student_id}`;
    //console.log("CourseCode = "+CourseCode);
    let template = ` 
                <table style="width: 70%; margin-left:20px" id="AttendanceList">

                <tr>
                    <th>Subject</th>
                    <th>Message</th>
                    <th>Time</th>
                </tr>
                {{#emails}}
                <tr>
                    <td>{{Subject}}</td>
                    <td style="width: 40%">{{Message}}</td>
                    <td>{{DateTime}}</td>
                </tr>
                {{/emails}}

            </table>`;
    //console.log("URL ="+url);
    let data = await fetch(url);

    let emails = await data.json();
    //console.log("Sections ="+sections);

    //let sections = await JSON.parse(data);
    let handlebars = Handlebars.compile(template);
    let html = handlebars({emails});
    $('#emails').html(html);


}
