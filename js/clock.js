/* Clock */
var clock = document.getElementById("clock");
function update_clock() {
    today = new Date();
    var dateString = today.format("dddd mmmm dd, HH:MM");
    clock.innerText=dateString;
}
update_clock();
setInterval(update_clock, 5000); // every 5 secconds