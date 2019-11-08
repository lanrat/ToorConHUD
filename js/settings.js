//
// Settings and variables
//

// set default settings
var settings = {
    test: null,
    render_interval: 30*1000, // every 30s
    update_interval: 60*1000, // every 1 minutes
    wallpaper_interval: 90*1000, // 90 sec
    display_old: false,
    single_day: true,
    max_display_events: 14,
    rotate: false,
    room: "",
    wallpaper: ["img/portraint.png"],
    landscape: false,
    display_next_abstract: false,
    announcement: null,
    announcement_id: 0,
};

// override default settings by screen ID
var id = getQueryVariable("id");
switch(id) {
    case "1":
        settings.room = "";
        settings.rotate = false;
        settings.wallpaper = ["img/landscape.png"];
        settings.landscape = true;
        settings.display_old = false;
        settings.max_display_events = 6;
        settings.display_next_abstract = false;
        break;
    case "2":
        settings.room = "track2";
        settings.rotate = false;
        break;
    case "f1":
       //settings.room = "track1";
        settings.wallpaper = ["img/landscape.png"];
        settings.landscape = true;
        settings.display_old = false;
        //settings.rotate = true;
        settings.max_display_events = 7;
        settings.display_next_abstract = true;
        break;
    case "f2":
        settings.room = "track2";
        settings.rotate = true;
        break;
    case "f3":
        //settings.room = "track2";
        //settings.wallpaper = ["img/landscape.png"];
        //settings.landscape = true;
        settings.display_old = false;
        settings.rotate = true;
        settings.max_display_events = 13;
        settings.display_next_abstract = true;
        break;
    case "f4": /* tape */
        //settings.room = "track1";
        settings.wallpaper = ["img/landscape.png"];
        settings.landscape = true;
        settings.display_old = false;
        //settings.rotate = true;
        settings.max_display_events = 7;
        settings.display_next_abstract = true;
        break;
    default:
        // no id set...
        console.log("no id set")
}

// check for rotate
var r = getQueryVariable("r");
if (r !=- "") {
    settings.rotate = true
}

// check for test
var test = getQueryVariable("test");
if (test != "") {
    // test=2018/09/15-13:20
    test = test.replace("-", " ")
    settings.test = new Date(test)
    console.log("Test mode activated to:", settings.test);
    console.log(settings);
}

// check for room
var s = getQueryVariable("s");
if (s != "") {
    settings.room = s.toLowerCase();
}

// Google vars
// https://developers.google.com/google-apps/calendar/v3/reference/events/list#parameters
var GOOGCAL_API_KEY = 'AIzaSyAwQwg4O6M_G1hqWxsRJMMAohIm57WmhTI';
var max_google_results = 250;
var goole_calendar_id = 'toorcon.org_fingd5s7evv78jsjdprf1ctvr4@group.calendar.google.com';
var d = new Date();
if (settings.test) {
    d = settings.test;
}
var timeMin = ISODateString(new Date(d.getFullYear(), d.getMonth(), d.getDate())); // midnight
var google_url = 'https://www.googleapis.com/calendar/v3/calendars/'+goole_calendar_id+'/events?key='+GOOGCAL_API_KEY+'&timeMin='+timeMin+'&mexResults='+max_google_results;

// frab vars
var frab_url = 'https://talks.toorcon.net/toorcon21/schedule/export/schedule.json';

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

// landscape?
if (settings.landscape) {
    var m = document.getElementById("main");
    m.className += m.className ? ' landscape' : 'landscape';
}

// change the wallpaper
updateWallpaper()
setInterval(updateWallpaper, settings.wallpaper_interval)

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
