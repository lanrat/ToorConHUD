//
// Settings and variables
//

// set default settings
var settings = {
    test: true,
    testDate: new Date('2018/09/15 13:20'),
    render_interval: 30*1000, // every 30s
    update_interval: 5*60*1000, // every 5 minutes
    display_old: true,
    single_day: true,
    max_display_events: 40,
    rotate: false,
    room: ""
};

// override default settings by screen ID
var id = getQueryVariable("id");
switch(id) {
    case "1":
        settings.room = "track1";
        settings.rotate = false;
        break;
    case "2":
        settings.room = "track2";
        settings.rotate = false;
        break;
    case "f1":
        settings.room = "track1";
        settings.rotate = true;
        break;
    case "f2":
        settings.room = "track2";
        settings.rotate = true;
        break;
    default:
        // no id set...
}

// check for rotate
var r = getQueryVariable("r");
if (r !=- "") {
    settings.rotate = true
}

// check for test
var t = getQueryVariable("t");
if (t != "") {
    settings.test = true;
}

// check for room
var s = getQueryVariable("s");
if (s != "") {
    settings.room = s.toLowerCase();
}

if (settings.test) {
    console.log("Test mode activated to:", settings.testDate);
    console.log(settings);
}


// Google vars
// https://developers.google.com/google-apps/calendar/v3/reference/events/list#parameters
var GOOGCAL_API_KEY = 'AIzaSyAwQwg4O6M_G1hqWxsRJMMAohIm57WmhTI';
var max_google_results = 250;
var goole_calendar_id = 'toorcon.org_fingd5s7evv78jsjdprf1ctvr4@group.calendar.google.com';
var d = new Date();
if (settings.test) {
    d = settings.testDate;
}
var timeMin = ISODateString(new Date(d.getFullYear(), d.getMonth(), d.getDate())); // midnight
var google_url = 'https://www.googleapis.com/calendar/v3/calendars/'+goole_calendar_id+'/events?key='+GOOGCAL_API_KEY+'&timeMin='+timeMin+'&mexResults='+max_google_results;

// frab vars
var frab_url = 'https://frab.toorcon.net/en/toorcon20/public/schedule.json';

// gets new schedule data
function updateFeed() {
    // change to Google vs Frab
    //AJAXget(google_url, googleSaveData);
    AJAXget(frab_url, frabSaveData);
}

// rotate?
if (settings.rotate) {
    var m = document.getElementById("main");
    m.className += m.className ? ' rotate' : 'rotate';
}

// start clock 
update_clock();
setInterval(update_clock, 5000); // every 5 seconds

// start feed checker
updateFeed();
setInterval(updateFeed, settings.update_interval);

// if we have saved local events then display it
if (dataStore['events']) {
    renderCal();
}
setInterval(renderCal, settings.render_interval);
