// object to hold all offline data
var dataStore;
var effective_single_day = true;

// get template
var schedule = document.getElementById("schedule");
var template = schedule.children[0];

// For convenience, add format method to date to use moment.js
Date.prototype.format = function (mask) {
    return moment(this).format(mask);
};

// add hashcode like functionality to string objects
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

// given a query param, returns the string value
// returns empty string if it does not exist.
// TODO deprecate this
function getQueryVariable(variable){
   var query = window.location.search.substring(1);
   var vars = query.split("&");
   for (var i=0;i<vars.length;i++) {
       var pair = vars[i].split("=");
        if(pair[0] == variable){return pair[1];}
   }
   return "";
}

// returns true if we think that the system date is correct
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
        effective_single_day = settings.single_day;
    } else {
        // else put calendar into show all mode
        effective_single_day = false;
    }
    // return last known good date
    return new Date(dataStore['last_known_date']);
}

// returns true if the client/browser support html5 storage
function supports_html5_storage() {
    try {
        return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
        return false;
    }
}

// simple ajax get 
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

// resets local storage to a clean/empty state
function resetLocalStorage() {
    dataStore = new Object();
    dataStore['updated'] = null;
}

// main logic for displaying the calendar data on the page
function renderCal() {
    // remove if first load
    template.remove();

    // remove existing events
    while (schedule.firstChild) {
        schedule.removeChild(schedule.firstChild);
    }

    // show announcement if any
    if (settings.announcement_id && settings.announcement_id > 0) {
        document.getElementById("announcement").style.display = "block"; // unhide
        var announcement_text = document.getElementById("announcement-text");
        announcement_text.innerText = dataStore['announcement'];
        //console.log("settings announcement", announcement_text.innerText);
    } else {
        document.getElementById("announcement").style.display = "none"; // hide
    }
    /*if (settings.announcement) {
        document.getElementById("announcement").style.display = "block"; // unhide
        var announcement_text = document.getElementById("announcement-text");
        announcement_text.innerText = settings.announcement;
        console.log("settings announcement", announcement_text.innerText);
    } else {
        document.getElementById("announcement").style.display = "none"; // hide
    }*/

    var ntp = NTPUp();
    var now = getNow();
    if (settings.test) {
        now = settings.test;
    }

    // today
    var day_start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // midnight
    var day_end = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1); // midnight

    var events = JSON.parse(dataStore['events']);
    //console.log("number of events:", events.length);

    var displayed_events = 0;
    // add new events
    for (var i = 0; i < events.length && displayed_events < settings.max_display_events; i++) {
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
        if (!settings.display_old && now > event_end) {
            continue;
        }
        // do we show events before or after the current day today?
        if (effective_single_day && (event_end <= day_start || event_start > day_end)) {
            continue;
        }

        // check room
        if (!((!event_location) || event_location == "" || event_location == settings.room || settings.room == "")) {
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
                event_element_time.innerText = new_start.format("dddd DD");
                event_element_time.className = "day-seperator";
                var event_element_box = event_element.getElementsByClassName("event-box")[0];
                event_element_box.style.display = "none";
                schedule.appendChild(event_element);
            }
        }

        // possessing
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
        var event_element_room = event_element.getElementsByClassName("event-room")[0];
        var event_element_box = event_element.getElementsByClassName("event-box")[0];

        // set event element text
        event_element_time.innerText = event_start.format("HH:mm");
        event_element_title.innerText = title;
        event_element_details1.innerText = description;
        // if no room is given, and the event has one, show it
        if ((!settings.room || settings.room == "") && (e.room && e.room != "")) {
            event_element_room.innerText = e.room;
        }
        // if we show the next event abstract and this is the next event..
        if (settings.display_next_abstract && displayed_events == 0 && e.abstract && e.abstract.length > 5) {
            event_element_details2.innerText = e.abstract + e.abstract + e.abstract + e.abstract + e.abstract ;
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

// local storage dataStore['events'] format
// event (e) object
// e.title
// e.room
// e.room_clean
// e.start
// e.end
// e.speaker
// e.abstract
// e.id

// parse Google JSON to local storage format
// TODO needs to be updated since migrated to new event format for frab
function googleSaveData(raw_data) {
    if (raw_data) {
        // parse
        var data = JSON.parse(raw_data);
        // only update if changed
        if (dataStore['updated'] != data.updated || dataStore['events'].length != data.items.length) {
            console.log("Calendar Updated");
            // give all events the same date structure
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

// parse frab json to local storage format
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
            //console.log("Calendar Updated", days);
            for (var i = 0; i < days.length; i++) {
                for (var room in days[i].rooms) {
                    if (days[i].rooms.hasOwnProperty(room))
                        for (var j = 0; j < days[i].rooms[room].length; j++) {
                            var event = days[i].rooms[room][j];
                            var e = {};
                            e.title = event.title;
                            e.room = event.room;
                            e.room_clean = roomSanitize(e.room);
                            e.abstract = event.abstract;
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
                            e.id = event.id
                            //console.log(event);
                            if (event.id == settings.announcement_id) {
                                dataStore['announcement'] = event.abstract;
                            }
                        }
                }
            }
            //console.log(data);

            // sort
            data.sort(function(a, b) {
                return new Date(a.start).getTime() - new Date(b.start).getTime();
            });

            //save
            dataStore['events'] = JSON.stringify(data);
            dataStore['updated'] = hash;
            renderCal();
        } else {
            //console.log("frab data unchanged");
        }
    }
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

// initialize local storage
// local storage test
if (supports_html5_storage() == false) {
    console.log("WARNING, browser does not support localStorage, page may not work.");
    dataStore = new Object();
}else{
    dataStore = localStorage;
}
