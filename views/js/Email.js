/**
 * Created by muna on 4/23/17.
 */


async function loadEmails(stuId,InstId) {

    let url = `/emails/${InstId}/${stuId}`;
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

