/**
 * Created by muna on 4/15/17.
 */


/** Days to be disabled as an array */
var disableddates = [];
var colors = [];
var approvalDates = [];

function DisableSpecificDates(date) {
    //console.log("Disable Dates:"+disableddates);
    var m = date.getMonth();
    var d = date.getDate();
    var y = date.getFullYear();

    // First convert the date in to the mm-dd-yyyy format
    // Take note that we will increment the month count by 1
    var currentdate = (m + 1) + '-' + d + '-' + y ;
//console.log("CurrentDate="+currentdate);
    // We will now check if the date belongs to disableddates array
    //for (var i = 0; i < disableddates.length; i++) {

        // Now check if the current date is in disabled dates array.
    let index = $.inArray(currentdate, disableddates);
        if (index != -1 ) {
            //console.log('false');
            return [true,colors[index],""];
        }
        else{
        //console.log('false');
        return [false,'']; //disable the date in the calender
        }

}


$(function() {
    $( "#datepicker" ).datepicker({
        beforeShowDay: DisableSpecificDates
    });
    $( "#datepicker" ).datepicker( "option", "dateFormat", 'dd-mm-yy' );
});