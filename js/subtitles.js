var tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var subtitles;
var events;
var scroller;
var content;

function processOne(event) {
    return [event, parseInt(event.id, 10)];
}

function process(subtitles) {
    var result = [];
    var c = subtitles.firstChild;
    while (c) {
	if (c.nodeType == 1) {
	    result.push(processOne(c));
	}
	c = c.nextSibling;
    }
    return result;
}

function findEvent(time, events) {
    for (var i = 0; i < events.length - 1; i++) {
        var pair = events[i];
        var next = events[i+1];
        if (pair[1] <= time && time < next[1]) {
            return pair[0];
        }
    }
    var pair = events[events.length -1];
    if (pair[1] < time) {
        return pair[0];
    }
}

function smoothScrollTo(top, start, duration) {
    cancelAnimationFrame(scroller);
    var current = window.pageYOffset;
    if (current !== top) {
        var t = Date.now() - start;
        if (t >= duration) {
            window.scrollTo(0, top);
        } else {
            window.scrollTo(0, current + t / duration * (top - current));
            scroller = requestAnimationFrame(function() {smoothScrollTo(top, start, duration)});
        }
    }
}

window.updateEventHighlight = function() {
    if (!subtitles) {
	subtitles = document.getElementById("subtitles");
	content = document.getElementById("content");
	if (subtitles) {
	    events = process(subtitles);
	}
    }
    if (!subtitles) {return;}

    Array.from(document.getElementsByClassName('subtitlehighlight')).forEach(function (div) {
        div.classList.remove('subtitlehighlight');
    });
    
    var time = parseFloat(player.getCurrentTime());
    var event = findEvent(time, events);
    if (!event) {return;}
    smoothScrollTo(event.offsetTop - events[0][0].offsetTop, Date.now(), 300);
    event.classList.add("subtitlehighlight");
}
