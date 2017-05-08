/**
 * Created by muna on 5/8/17.
 */

google.charts.load('current', {packages: ['corechart', 'bar']});

var xaxisTitle = '';
var dataArray = [];



var chartTitle = 'Absent percentage of all classes';
var chartSubtitle = '';

function drawTitleSubtitle() {
    var data = new google.visualization.DataTable();
    data.addColumn('string', xaxisTitle);
    data.addColumn('number', 'Absent percentage');
    //data.addColumn('number', 'Energy Level');

    data.addRows(dataArray);

    var options = {
        chart: {
            title: chartTitle,
            subtitle: chartSubtitle
        },

        vAxis: {
            viewWindow: {
                min: [7, 30, 0],
                max: [17, 30, 0]
            }
        }
    };

    var materialChart = new google.charts.Bar(document.getElementById('chart_div'));
    materialChart.draw(data, options);
}

async function loadCourseSection(InstId) {

    let CourseCode = $('#selectclass').val();
    CourseCode = `${CourseCode}`;
    let url = `/course/${CourseCode}/${InstId}`;
    //console.log("CourseCode = "+CourseCode);
    let template = ` 
                            <option selected>Select Section</option>
                             {{#sections}}
                             <option value="{{CRN}}">{{SectionNo}}</option>
                            {{/sections}}
                             <option value="all">All</option>`;
    console.log(CourseCode);
    let sections = {}
    if (CourseCode == 'all'){
        chartTitle = 'Absent percentage of all classes';
        chartSubtitle = '';
        xaxisTitle = 'Course';
        $('#basedon').hide();
        let response=await fetch('/stat/all',{credentials:'include'}) // to save the session
        let stats = await response.json();
        dataArray = []; // clear the array
        for (let s of stats){
            dataArray.push([s.CourseCode, s.percentage]);
        }
        google.charts.setOnLoadCallback(drawTitleSubtitle);



    }
    else {
        $('#basedon').show();
        //console.log("URL ="+url)

    }


}




async function drawChart() {

    let CourseCode = $('#selectclass').val();
    let basedon = $('#basedon').val();
    dataArray = []; // clear the array
    chartTitle = 'absent percentage of '+CourseCode;
    chartSubtitle = 'Based on '+basedon;

    let response=await fetch(`/stat/${CourseCode}/${basedon}`,{credentials:'include'}) // to save the session
    let stats = await response.json();

    for (let s of stats){
        if(basedon == 'section'){
            xaxisTitle = 'Sections';
            dataArray.push([s.SectionNo, s.percentage]);
        }
        else {
            xaxisTitle = 'gender';
            if (s.Gender == 'F'){
                s.Gender = 'Female';
            }
            else {
                s.Gender = 'Male';
            }
            dataArray.push([s.Gender, s.percentage]);
        }
    }
    google.charts.setOnLoadCallback(drawTitleSubtitle);

}
