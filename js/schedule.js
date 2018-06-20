//
// Settings and variables
//

var DEBUG = false;
var testDate = new Date('2018/6/21 13:20');
var render_interval = 60*1000; // every 1 minute
var update_interval = 5*60*1000; // every 5 minutes
var max_google_results = 250;
var display_old = true;
var single_day = true;
var max_display_events = 40;

// google vars
var d = new Date();
if (DEBUG) {
    d = testDate;
}
var goole_calendar_id = 'toorcon.org_fingd5s7evv78jsjdprf1ctvr4@group.calendar.google.com';
var GOOGCAL_API_KEY = 'AIzaSyAwQwg4O6M_G1hqWxsRJMMAohIm57WmhTI';
var timeMin = ISODateString(new Date(d.getFullYear(), d.getMonth(), d.getDate())); // midnight
// https://developers.google.com/google-apps/calendar/v3/reference/events/list#parameters
var google_url = 'https://www.googleapis.com/calendar/v3/calendars/'+goole_calendar_id+'/events?key='+GOOGCAL_API_KEY+'&timeMin='+timeMin+'&mexResults='+max_google_results;


// frab vars
var frab_url = 'https://frab.toorcon.net/en/toorcamp2018/public/schedule.json';


//
// Code
//


// For convenience...
Date.prototype.format = function (mask) {
    return moment(this).format(mask);
};

// object to hold all offline data
var dataStore;
var effective_single_day = single_day;

function roomSanitize(event_room) {
    event_room = event_room.toLowerCase();
    event_room = event_room.replace(/[\W_]+/g," "); // remove all non alpha-numeric
    event_room = event_room.replace(/ /g,''); // remove all spaces
    return event_room;
}


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

function NTPUp() {
    var ancient_history = new Date('01/01/2015');
    var system_now = new Date();
    return (system_now > ancient_history || !dataStore['last_known_date']);
}

// returns a new date object with the current timestamp or last known good time if NTP has failed
function getNow() {
    if (NTPUp()) {
        // looks like NTP is working, save the good date, or we have no history...
        dataStore['last_known_date'] = new Date();
        effective_single_day = single_day;
    } else {
        // else put calendar into show all mode
        effective_single_day = false;
    }
    // return last known good date
    return new Date(dataStore['last_known_date']);
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
    console.log("Debug mode activated to:", testDate);
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

String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

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

    room = room.replace('/','');

    console.log("Room:",room)

    return room;
}

function resetLocalStorage() {
    dataStore = new Object();
    dataStore['updated'] = null;
}

function renderCal() {
    // remove if first load
    template.remove();

    // remove existing events
    while (schedule.firstChild) {
        schedule.removeChild(schedule.firstChild);
    }

    var ntp = NTPUp();
    var now = getNow();
    if (DEBUG) {
        now = testDate;
    }

    var room = getRoom();

    // today
    var day_start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // midnight
    var day_end = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1); // midnight

    var events = JSON.parse(dataStore['events']);
    //console.log("number of events:", events.length);

    var displayed_events = 0;
    // add new events
    for (var i = 0; i < events.length && displayed_events < max_display_events; i++) {
        var e = events[i];
        //console.log("event", e);
        var event_start = new Date(e.start);
        var event_end = new Date(e.end);
        var event_title = e.title;
        var event_description = e.speaker;
        var event_location = e.room_clean;
        /*if (event_location) {
            event_location = event_location.toLowerCase();
        }*/

        // checks to test if event should be displayed
        // do we display past events?
        if (!display_old && now > event_end) {
            continue;
        }
        // do we show events before or after the current day today?
        if (effective_single_day && (event_end <= day_start || event_start > day_end)) {
            continue;
        }

        // check room
        if (!((!event_location) || event_location == "" || event_location == room || room == "")) {
            continue;
        }

        // insert header for events on different days
        if ((!effective_single_day) && (i > 1)) {
            var prev_start = new Date(events[i-1].start.raw)
            var new_start = new Date(events[i].start.raw)
            if (prev_start.getDate() != new_start.getDate()) {
                // show date header
                var event_element = template.cloneNode(true);
                var event_element_time = event_element.getElementsByClassName("event-time")[0];
                event_element_time.innerHTML = new_start.format("dddd DD");
                event_element_time.className = "day-seperator";
                var event_element_box = event_element.getElementsByClassName("event-box")[0];
                event_element_box.style.display = "none";
                schedule.appendChild(event_element);
            }
        }

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
        var event_element_details1 = event_element.getElementsByClassName("event-details1")[0];
        var event_element_details2 = event_element.getElementsByClassName("event-details2")[0];
        var event_element_box = event_element.getElementsByClassName("event-box")[0];

        // set event element text
        event_element_time.innerText = event_start.format("HH:mm");
        event_element_title.innerHTML = title;
        event_element_details1.innerHTML = description;
        // if no room is given, and the event has one, show it
        if ((!room || room == "") && (e.room && e.room != "")) {
            event_element_details2.innerHTML = e.room; // TODO this might cause problems with "&" in location
        }
        if (ntp) {
            // add CSS for old or current events
            if (now > event_end) {
                event_element_box.className = event_element_box.className + " event-old";
            }
            if (event_start < now && now < event_end) {
                event_element_box.className = event_element_box.className + " event-current";
            }
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

function googleSaveData(raw_data) {
    if (raw_data) {
        // parse
        var data = JSON.parse(raw_data);
        // only update if changed
        if (dataStore['updated'] != data.updated || dataStore['events'].length != data.items.length) {
            console.log("Calendar Updated");
            // give all events the same date structure
            // TODO need to update to use new event object layout
            // TODO use room sanitize
            for (var i =0; i < data.items.length; i++) {
                data.items[i].start.raw = data.items[i].start.dateTime || data.items[i].start.date;
                data.items[i].end.raw = data.items[i].end.dateTime || data.items[i].end.date;
            }

            // sort
            data.items.sort(function(a, b) {
                return new Date(a.start.raw).getTime() - new Date(b.start.raw).getTime();
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

    // TODO google vs frab url
    //AJAXget(google_url, googleSaveData);
    AJAXget(frab_url, frabSaveData);
}

// event (e) object
// e.title
// e.room
// e.room_clean
// e.start
// e.end
// e.speaker

function frabSaveData(raw_data) {
    if (raw_data) {
        // parse
        var hash = raw_data.hashCode();
        // only update if changed
        if (dataStore['updated'] != hash) {
            console.log("Calendar Updated");

            var frab_data = JSON.parse(raw_data);
            var data = [];
            var days = frab_data.schedule.conference.days;
            for (var i = 0; i < days.length; i++) {
                for (var room in days[i].rooms) {
                    if (days[i].rooms.hasOwnProperty(room))
                        for (var j = 0; j < days[i].rooms[room].length; j++) {
                            var event = days[i].rooms[room][j];
                            var e = {};
                            e.title = event.title;
                            e.room = event.room;
                            e.room_clean = roomSanitize(e.room);
                            e.start = new Date(event.date);
                            var duration = moment.duration(event.duration);
                            var end = moment(event.date).add(duration).toDate();
                            e.end = end;
                            var people = "";
                            for (var k = 0; k < event.persons.length; k++) {
                                people = people + ", " + event.persons[k].public_name;
                            }
                            people = people.substr(2)
                            e.speaker = people;
                            data.push(e);
                        }
                }
            }
            console.log(data);

            // sort
            data.sort(function(a, b) {
                return new Date(a.start).getTime() - new Date(b.start).getTime();
            });


            //save
            dataStore['events'] = JSON.stringify(data);
            dataStore['updated'] = hash;
            renderCal();
        }
    }
}

function frabTest() {
    AJAXget(frab_url, frabSaveData);
}

/* Clock */
function update_clock() {
    var clock = document.getElementById("clock");
    var today = getNow();
    var dateString = today.format("dddd MMMM DD, HH:mm");
    if (!NTPUp()) {
        dateString = today.format("dddd MMMM DD");
    }
    clock.innerText = dateString;
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

update_clock();
updateFeed();
setInterval(updateFeed, update_interval);
setInterval(renderCal, render_interval);
setInterval(videoCheck, 5*1000 ); // every 5s
setInterval(update_clock, 5000); // every 5 secconds

document.addEventListener("DOMContentLoaded", function(event) { 
  renderVideo();
});