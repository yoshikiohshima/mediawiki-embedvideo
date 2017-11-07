var tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var events;  // [[<the next node> ,time]]
var scroller;   // interval

var maybeLeft = 0;
var padding; // DOM

function processOne(dom) {
    if (dom.nodeType != 1) {
	return null;
    }
    var text = dom.id;
    var val;
    var match;
    if (/[0-9]+$/.test(text)) {
	val = parseInt(text, 10);
    } else if ((match = /([0-9]?[0-9]):([0-9]?[0-9])$/.exec(text))) {
	val = match[1] * 60 + match[2];
    } else if ((match = /([0-9]?[0-9]):([0-9]?[0-9]):([0-9]?[0-9])$/.exec(text))) {
	val = match[1] * 3600 + match[2] * 60 + match[3];
    }

    if (!val) {return null;}
    return [dom, val];
}

function process(subtitles) {
    var result = [];
    for (var i = 0; i < subtitles.length; i++) {
	var node = subtitles[i];
	var val = processOne(node);
	if (val) {
	    result.push(val);
	}
    }
    return result.sort((p1, p2) => p1[1] - p2[1]);
}

function findEvent(time, events) {
    if (events.length == 1) {return events[0][0];}

    for (var i = 0; i < events.length - 1; i++) {
        var pair = events[i];
        var next = events[i+1];
        if (pair[1] <= time && time < next[1]) {
            return pair[0];
        }
    }
    var pair = events[events.length - 1];
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

window.onscroll = function() {
    var scrollPosition, headerOffset, isScrolling;
    var rect = document.getElementById("firstHeading").getBoundingClientRect();
    headerOffset = rect.top + rect.height;
    isScrolling = headerOffset < 0;
    var div = document.getElementsByClassName('embedvideo')[0];
    if (!div) {return;}
    if (!padding) {return;}
    if (isScrolling) {
	div.classList.add("ia_out");
	div.style.left = maybeLeft + 'px'; //??? adjust border
	padding.style.height = div.getBoundingClientRect().height + "px";
    } else {
	maybeLeft = div.firstElementChild.getBoundingClientRect().x;
	div.classList.remove('ia_out');
	padding.style.height = '0px';
    }
}

window.subtitleSelected = function(div) {
    if (div && div.id) {
	var text = div.id;
    }
    
    if (/[0-9]+$/.test(text)) {
	val = parseInt(text, 10);
    } else if ((match = /([0-9]?[0-9]):([0-9]?[0-9])$/.exec(text))) {
	val = match[1] * 60 + match[2];
    } else if ((match = /([0-9]?[0-9]):([0-9]?[0-9]):([0-9]?[0-9])$/.exec(text))) {
	val = match[1] * 3600 + match[2] * 60 + match[3];
    }

    if (val) {
	player.seekTo(val, true);
    }
}


window.updateEventHighlight = function() {
    if (!events) {
	var subtitles = document.getElementsByClassName("subtitle");
	var embedvideo = document.getElementsByClassName("embedvideo")[0];
	padding = document.createElement("div");
	padding.style.height = 0;
	embedvideo.parentNode.insertBefore(padding, embedvideo.nextElementSibling);
        events = process(subtitles);
    }
    if (!events) {return;}

    Array.from(document.getElementsByClassName('subtitlehighlight')).forEach(function (div) {
        div.classList.remove('subtitlehighlight');
    });
    
    var time = parseFloat(player.getCurrentTime());
    var event = findEvent(time, events);
    if (!event) {return;}
    smoothScrollTo(event.offsetTop - events[0][0].offsetTop, Date.now(), 300);
    event.classList.add("subtitlehighlight");
}
