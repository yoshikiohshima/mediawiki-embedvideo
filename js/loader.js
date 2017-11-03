var tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

console.log(Date.now());

window.updateEventHighlight = function() {
    var time = parseFloat(player.getCurrentTime());
    document.getElementById("ia-caption").innerHTML = "time: " + time;
}

