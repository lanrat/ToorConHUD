//
// Settings and variables
//

var calendar = 'ukbq57knmgtm7tubcclr43lrjo@group.calendar.google.com';

var API_KEY = 'AIzaSyAwQwg4O6M_G1hqWxsRJMMAohIm57WmhTI';
var DEBUG = false;
var testDate = new Date(2016, 10 -1, 15, 13, 20); // month is offset 0
var render_interval = 60*1000; // every 1 minute
var update_interval = 5*60*1000; // every 5 minutes
var max_google_results = 250;
var display_old = true;
var single_day = true;
var max_display_events = 40;

//
// Code
//

function ISODateString(d){
    function pad(n){return n<10 ? '0'+n : n}
    return d.getUTCFullYear()+'-'
        + pad(d.getUTCMonth()+1)+'-'
        + pad(d.getUTCDate())+'T'
        + pad(d.getUTCHours())+':'
        + pad(d.getUTCMinutes())+':'
        + pad(d.getUTCSeconds())+'Z'
}

function getQueryVariable(variable){
   var query = window.location.search.substring(1);
   var vars = query.split("&");
   for (var i=0;i<vars.length;i++) {
       var pair = vars[i].split("=");
        if(pair[0] == variable){return pair[1];}
   }
   return "";
}

// check for rotate
var r = getQueryVariable("r");
if (r !=- "") {
    var m = document.getElementById("main");
    m.className += m.className ? ' rotate' : 'rotate';
}

// check for test
var t = getQueryVariable("t");
if (t != "") {
    DEBUG = true;
}

// unused
function trimString(str) {
    var len = 100;
    if(!str) {
        return "";
    }
    var r = str.substring(0,len);
    if (str.length > len) {
        r = r + "&hellip;";
    }
    return r;
}

function supports_html5_storage() {
    try {
        return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
        return false;
    }
}

function AJAXget(url, handler) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);

    request.onload = function() {
        if (request.status >= 200 && request.status < 400) {
            // Success!
            handler(request.responseText);
        } else {
            // We reached our target server, but it returned an error
            console.log("AJAX server response error ", request.statusText);
        }
    };

    request.onerror = function() {
        // There was a connection error of some sort
        console.log("AJAX connection error");
    };

    request.send();
}


var dataStore;

// get template
var schedule = document.getElementById("schedule");
var template = schedule.children[0];

function getRoom(){

    // Room
    //var room = window.location.search.substr(1).replace('/','');
    var room = getQueryVariable("s").toLowerCase();
    if (room == "") {
        room = window.location.hash.substr(1).toLowerCase();
    }

    return room;
}

function renderCal() {
    // remove if first load
    template.remove();

    // remove existing events
    while (schedule.firstChild) {
        schedule.removeChild(schedule.firstChild);
    }

    var now = new Date();
    if (DEBUG) {
        now = testDate;
    }

    var room = getRoom();

    // today
    var day_start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // midnight
    var day_end = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1); // midnight

    var events = JSON.parse(dataStore['events']);

    var displayed_events = 0;
    // add new events
    for (var i = 0; i < events.length && displayed_events < max_display_events; i++) {
        var e = events[i];
        // event data from google
        var event_start = new Date(e.start.dateTime);
        var event_end = new Date(e.end.dateTime);
        var event_title = e.summary;
        var event_description = e.description;
        var event_location = e.location;
        if (event_location) {
            event_location = event_location.toLowerCase();
        }

        // checks to test if event should be displayed
        // do we display past events?
        if (!display_old && now > event_end) {
            continue;
        }
        // do we show events before or after the current day today?
        if (single_day && (event_end < day_start || event_start > day_end)) {
            continue;
        }
        // check room
        if (!((!event_location) || event_location == "" || event_location == room || room == "")) {
            continue;
        }

        // TODO insert header for events on differnet days

        // prossessing
        var title = event_title;
        var description = "";
        if (event_description) {
            description = event_description.split('\n')[0]; // first line
        }

        // get parts of event element
        var event_element = template.cloneNode(true);
        var event_element_time = event_element.getElementsByClassName("event-time")[0];
        var event_element_title = event_element.getElementsByClassName("event-title")[0];
        var event_element_details = event_element.getElementsByClassName("event-details")[0];
        var event_element_box = event_element.getElementsByClassName("event-box")[0];

        // set event element text
        event_element_time.innerText = event_start.format("HH:MM");
        event_element_title.innerHTML = title;
        event_element_details.innerHTML = description;

        // add CSS for old or current events
        if (now > event_end) {
            event_element_box.className = event_element_box.className + " event-old";
        }
        if (event_start < now && now < event_end) {
            event_element_box.className = event_element_box.className + " event-current";
        }
        // display event
        schedule.appendChild(event_element);
        displayed_events++;
    }
}

var videoTrackURL = "ws://svr-1.toorcon.local"
var portTrack1 = "8081";
var portTrack2 = "8082";
var player;

function renderVideo(){

    var enabled = getQueryVariable("v").toLowerCase();
    if(enabled != "1"){
        document.getElementById("video").style.display = "none";
        return false;
    }

    var room = getRoom();
    var port = portTrack1;

    if(room=="track2"){
        port = portTrack2;   
    }

    var canvas = document.getElementById('videoCanvas');
    var client = new WebSocket( videoTrackURL + ':' + port + '/' );
    // var canvas = document.createElement('canvas');
    // canvas.setAttribute('width', '640');
    // canvas.setAttribute('height', '480');
    // document.body.appendChild(canvas);
    player = new jsmpeg(client, {canvas:canvas});
}

var lastFrame = 0;
function videoCheck() {
    if (!player) {
        return;
    }
    if (lastFrame == player.currentFrame) {
        player.stop();
        renderVideo();
    }
    lastFrame = player.currentFrame;
}

function saveData(raw_data) {
    if (raw_data) {
        var data = JSON.parse(raw_data);
        // only update if changed
        if (dataStore['updated'] != data.updated) {
            console.log("Calendar Updated");
            // sort
            data.items.sort(function(a, b) {
                return new Date(a.start.dateTime || a.start.date).getTime() - new Date(b.start.dateTime || b.start.date).getTime();
            });
            // save
            dataStore['events'] = JSON.stringify(data.items);
            dataStore['updated'] = data.updated;
            renderCal();
        }
    }
}

function updateFeed() {
    //console.log("Checking for calendar update");
    var d = new Date();
    if (DEBUG) {
        d = testDate;
    }
    var timeMin = ISODateString(new Date(d.getFullYear(), d.getMonth(), d.getDate())); // midnight
    //var calID = calendars[window.location.hash.substr(1)];
    var calID = calendar;
    // https://developers.google.com/google-apps/calendar/v3/reference/events/list#parameters
    var url = 'https://www.googleapis.com/calendar/v3/calendars/'+calID+'/events?key='+API_KEY+'&timeMin='+timeMin+'&mexResults='+max_google_results;
    AJAXget(url, saveData);
}


// localstorage test
if (supports_html5_storage() == false) {
    console.log("WARNING, browser does not support localStorage, page may not work.");
    dataStore = new Object();
}else{
    dataStore = localStorage;
}

// if we have saved local events then display it
if (dataStore['events']) {
    renderCal();
}

updateFeed();
setInterval(updateFeed, update_interval);
setInterval(renderCal, render_interval);
setInterval(videoCheck, 5*1000 ); // every 5s

document.addEventListener("DOMContentLoaded", function(event) { 
  renderVideo();
});