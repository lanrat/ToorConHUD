// this file is currently not included..
var videoTrackURL = "ws://svr-1.toorcon.local"
var portTrack1 = "8081";
var portTrack2 = "8082";
var player;

function renderVideo(){
    var enabled = getQueryVariable("v").toLowerCase();
    if(enabled != "1"){
        document.getElementById("video").style.display = ""; // unhide
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

setInterval(videoCheck, 5*1000 ); // every 5s

document.addEventListener("DOMContentLoaded", function(event) { 
  renderVideo();
});