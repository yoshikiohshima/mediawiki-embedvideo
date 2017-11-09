var tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var events;  // [[<the next node> ,time]]
var scroller;   // interval

var maybeLeft = 0;
var padding; // DOM
var embedvideo; // DOM

function parseTime(text) {
    if (/[0-9]+$/.test(text)) {
	return parseInt(text, 10);
    } else if ((match = /([0-9]?[0-9]):([0-9]?[0-9])$/.exec(text))) {
	return match[1] * 60 + match[2];
    } else if ((match = /([0-9]?[0-9]):([0-9]?[0-9]):([0-9]?[0-9])$/.exec(text))) {
	return match[1] * 3600 + match[2] * 60 + match[3];
    }
    return null;
}

function processOne(dom) {
    if (dom.nodeType != 1) {
	return null;
    }
    var text = dom.id;
    var val = parseTime(text);

    if (val === null) {return null;}
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
    if (!embedvideo) {return;}
    if (!padding) {return;}

    var scrollPosition, headerOffset, isScrolling;
    var previewnote = document.getElementsByClassName("previewnote")[0];
    if (previewnote) {
	headerOffset = previewnote.getBoundingClientRect().bottom +
	    parseFloat(window.getComputedStyle(previewnote)["margin-bottom"]);
    } else {
	var heading = document.getElementById("firstHeading");
	var rect = heading.getBoundingClientRect();
	headerOffset = rect.top + rect.height + parseFloat(window.getComputedStyle(heading)["margin-bottom"]);
    }
    embedvideo.style.top = (headerOffset >  0 ? headerOffset : 0) + 'px';
}

window.subtitleSelected = function(div) {
    if (mw.config.get("wgAction") !== "view") {return;}
    var val = null;
    if (div && div.id) {
	var text = div.id;
	val = parseTime(text);
    }
    if (val !== null) {
	player.seekTo(val, true);
    }
}

window.updateEventHighlight = function() {
    if (!events) {
	var subtitles = document.getElementsByClassName("subtitle");
	embedvideo = document.getElementsByClassName("embedvideo")[0];

	var previewnote = document.getElementsByClassName("previewnote")[0];
	if (previewnote) {
	    var top = previewnote.getBoundingClientRect().bottom +
		parseFloat(window.getComputedStyle(previewnote)["margin-bottom"]);
	} else {
	    var top = document.getElementById("bodyContent").getBoundingClientRect().top;
	}
	embedvideo.style.top = top + 'px';
	padding = document.createElement("div");
	padding.style.height = embedvideo.getBoundingClientRect().height + "px";
	embedvideo.parentNode.insertBefore(padding, embedvideo.nextElementSibling);
        events = process(subtitles);
    }
    if (!events) {return;}

    Array.from(document.getElementsByClassName('subtitlehighlight')).forEach(function (div) {
        div.classList.remove('subtitlehighlight');
    });

    if (!player.getCurrentTime) {return;}
    
    var time = parseFloat(player.getCurrentTime());
    var event = findEvent(time, events);
    if (!event) {return;}
    if (mw.config.get("wgAction") !== "view") {return;}
    smoothScrollTo(event.offsetTop - events[0][0].offsetTop, Date.now(), 300);
    event.classList.add("subtitlehighlight");
}

