/**
 * Created by muna on 4/24/17.
 */

$(document).ready(()=>{
    $('#Course').on('change',()=>{

    })
})

async function enableAllCheckbox() {
    $('#teenCheck').prop('disabled',false);
    $('#fiftenCheck').prop('disabled',false);
    $('#tweentyCheck').prop('disabled',false);
    $('#tweentyfiveCheck').prop('disabled',false);
    $('#noneCheckReport').prop('disabled',false);
    $('#noneCheckAlert').prop('disabled',false);
    $('#dailyCheck').prop('disabled',false);
    $('#weeklyCheck').prop('disabled',false);
    $('#monthlyCheck').prop('disabled',false);

}



async function loadCourseSection(InstId) {


    let CourseCode = $('#selectclass').val();
    CourseCode = `${CourseCode}`;
    let url = `/course/${CourseCode}/${InstId}`;
    //console.log("CourseCode = "+CourseCode);
    let template = ` 
                            <option selected> Select Section</option>
                             {{#sections}}
                             <option value="{{CRN}}">{{SectionNo}}</option>
                            {{/sections}}
                             <option value="all">All</option>`;
    console.log(CourseCode);
    if (CourseCode == 'all'){
        enableAllCheckbox();
        console.log('Sections hide');
        $('#sectionDiv').hide();
    }
    else {
        $('#sectionDiv').show();
        //console.log("URL ="+url);
        let data = await fetch(url);

        let sections = await data.json();
        //console.log("Sections ="+sections);

        //let sections = await JSON.parse(data);
        let handlebars = Handlebars.compile(template);
        let html = handlebars({sections});
        $('#sectionList').html(html);
    }

}

async function reportTimeCheck(chk) {
    if (chk.value == 'none'){
        if (chk.checked == true){
            $('#dailyCheck').prop('checked',false);
            $('#weeklyCheck').prop('checked',false);
            $('#monthlyCheck').prop('checked',false);

            $('#dailyCheck').prop('disabled',true);
            $('#weeklyCheck').prop('disabled',true);
            $('#monthlyCheck').prop('disabled',true);

        }
        else {
            $('#dailyCheck').prop('disabled',false);
            $('#weeklyCheck').prop('disabled',false);
            $('#monthlyCheck').prop('disabled',false);
        }
    }
}

async function alertTimeCheck(chk) {
    if (chk.value == 'none'){
        if (chk.checked == true){
            $('#teenCheck').prop('checked',false);
            $('#fiftenCheck').prop('checked',false);
            $('#tweentyCheck').prop('checked',false);
            $('#tweentyfiveCheck').prop('checked',false);

            $('#teenCheck').prop('disabled',true);
            $('#fiftenCheck').prop('disabled',true);
            $('#tweentyCheck').prop('disabled',true);
            $('#tweentyfiveCheck').prop('disabled',true);

        }
        else {
            $('#teenCheck').prop('disabled',false);
            $('#fiftenCheck').prop('disabled',false);
            $('#tweentyCheck').prop('disabled',false);
            $('#tweentyfiveCheck').prop('disabled',false);
        }
    }
}

async function onSectionListChange() {
    enableAllCheckbox();

}

async function SaveSettings() {
    let CRN = $('#sectionList').val();
    let CourseCode = $('#selectclass').val();

    let changes = [];

    $('.setting').map((idx,c) => {

        if (c.checked == true && $(c).attr('data-state') =='0'){ // '0' not absent 'true' instructor mark as absent
            changes.push("1");//{settingType:$(c).attr('data-settingType'),IsAbsent: 1}) // absent == true
        }
        else if (c.checked == false && $(c).attr('data-state') =='1'){ //'1' absent 'false' instructor mark as not absent
            changes.push("2");//{StudentId:$(c).attr('data-Student_id'),IsAbsent: 0}) // absent == false
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




