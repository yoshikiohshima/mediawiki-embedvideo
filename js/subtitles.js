var tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var events;  // [[DOM, time]]
var slides;  // [[DOM, time]]
var scroller;   // interval

var slideview; // DOM

var highlightedEvent; // DOM
var highlightedSlide; // DOM

var padding; // DOM
var embedvideo; // DOM

function parseTime(text) {
    if (text.startsWith("sub")) {
	text = text.slice(3);
    } else if (text.startsWith("slide")) {
	text = text.slice(5);
    }
    var match = /([0-9]?[0-9]):([0-9]?[0-9]):([0-9]?[0-9])$/.exec(text);
    if (match) {
	return parseInt(match[1], 10) * 3600 + parseInt(match[2], 10) * 60 + parseInt(match[3]);
    }
    match = /([0-9]?[0-9]):([0-9]?[0-9])$/.exec(text);
    if (match) {
	return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    }
    if (/[0-9]+$/.test(text)) {
	return parseInt(text, 10);
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

function process(list) {
    var result = [];
    for (var i = 0; i < list.length; i++) {
	var node = list[i];
	var val = processOne(node);
	if (val) {
	    result.push(val);
	}
    }
    return result.sort((p1, p2) => p1[1] - p2[1]);
}

function findEvent(time, events) {
    if (!events) {return null;}
    if (events.length === 0) {return null};
    if (events.length === 1) {return events[0][0];}

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
    if (slideview) {
	slideview.style.top = (headerOffset >  0 ? headerOffset : 0) + 'px';
	slideview.style.left = embedvideo.getBoundingClientRect().right + 'px';
    }
}

window.subtitleSelected = function(div) {
    if (mw.config.get("wgAction") !== "view") {return;}
    var val = null;
    if (div && div.id) {
	var text = div.id;
	val = parseTime(text);
    }
    if (val !== null && player) {
	if (player.seekTo) {//YouTube Player
	    player.seekTo(val, true);
	}
	if (player.setCurrentTime) {//Vimeo Player
	    player.setCurrentTime(val).then(function(seconds) {
		player.play();
	    });
	}
    }
}

window.updateEventHighlight = function() {
    if (!events) {
	var subtitles = document.getElementsByClassName("subtitle");
	var slideItems = document.getElementsByClassName("slideitem");
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
	slides = process(slideItems);

	slideview = document.getElementById("slideview");
    }
    if (!events) {return;}

    if (!player.getCurrentTime) {return;}

    var time = player.getCurrentTime();

    function callback(time) {
	var event = findEvent(time, events);
	if (event && mw.config.get("wgAction") == "view" && highlightedEvent !== event) {
	    smoothScrollTo(event.offsetTop - events[0][0].offsetTop, Date.now(), 300);
	    Array.from(document.getElementsByClassName('subtitlehighlight')).forEach(function (div) {
		div.classList.remove('subtitlehighlight');
	    });
	    event.classList.add("subtitlehighlight");
	}
	var slide = findEvent(time, slides);

	if (slide && mw.config.get("wgAction") == "view") { // && highlightedSlide !== slide)
	    if (slideview) {
		var cxt = slideview.getContext('2d');
		var s = slide.firstChild;
		if (s && s.tagName == "IMG") {
		    var ws = slideview.width / s.width;
		    var vs = slideview.height / s.height;
		    if (ws < vs) { // too wide, pad top and bottom
			var scale = ws;
			var tx = 0;
			var ty = (slideview.height / scale - s.height) / 2.0;
		    } else { // too high, pad left and right
			var scale = vs;
			var ty = 0;
			var tx = (slideview.width / scale -  s.width) / 2.0;
		    }

		    cxt.resetTransform();
		    cxt.clearRect(0, 0, slideview.width, slideview.height);
		    cxt.scale(scale, scale);
		    cxt.drawImage(s, tx, ty);
		}
	    };
	}
    }
    if (typeof time === "string") {
	callback(parseFloat(time));
    } else if (typeof time === "number") {
	callback(time);
    } else { // must be promise for vimeo player
	time.then(callback);
    }
}

if (player) {
    updateEventHighlight();
}
