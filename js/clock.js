/* Clock */
function update_clock() {
    var clock = document.getElementById("clock");
    today = new Date();
    var dateString = today.format("dddd mmmm dd, HH:MM");
    clock.innerText=dateString;
}

