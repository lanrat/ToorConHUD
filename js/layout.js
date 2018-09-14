
var nextWall = 0;

function updateWallpaper() {
    if (settings.wallpaper) {
        var wall_bottom = document.getElementById("wallpaper_bottom");
        var wall_top = document.getElementById("wallpaper_top");
        
        wall_bottom.src = settings.wallpaper[nextWall];
        wall_top.classList.toggle("transparent");


        setTimeout(function(){
            wall_top.src = settings.wallpaper[nextWall];
            wall_top.classList.toggle("transparent");
            nextWall = (nextWall + 1) % settings.wallpaper.length;
        }, 3000);
    }
}
