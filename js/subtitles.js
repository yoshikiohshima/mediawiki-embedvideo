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

var loader;  //DOM, that is currently loading image
var loadInterval;

var lastTime = 0;

var $ = jQuery;
var autoResizerTimeout = false;
var autoResizerDelta = 200;
var lastResize = -9999;

$(window).resize(function() {
    if (new Date() - lastResize > autoResizerDelta && autoResizerTimeout === false) {
        autoResizerTimeout = true;
        setTimeout(autoResizerResizeEnd, autoResizerDelta);
    }
});

function autoResizerResizeEnd() {
    autoResizerTimeout = false;
    autoResizer();
}

function autoResizer() {
    $('.autoResize').each(function(){
        var parent = $(this).parent();
        var self = $(this);
        var iframe = self.find('iframe');
        var wrap = self.find('.embedvideowrap');
	var slideview = $('#slideview');
        resizeHandler(self, iframe, parent, wrap, slideview);
    });
}

function resizeHandler(self, iframe, parent, wrap, slideview) {
    var aspect = iframe.attr("data-orig-ratio");
    if (aspect === undefined) {
	aspect = iframe.width() / iframe.height();
        iframe.attr("data-orig-ratio", aspect);
    }

    var newWidth = parent.width() * 0.55;
    var newHeight = newWidth / aspect;

    self.width(newWidth).css('width', newWidth);
    iframe.width(newWidth).css('width', newWidth).attr('width', newWidth);
    iframe.height(newHeight).css('height', newHeight).attr('height', newHeight);
    wrap.width(newWidth).css('width', newWidth).attr('width', newWidth);
    wrap.height(newHeight).css('height', newHeight).attr('height', newHeight);

    if (!slideview) {return;}
    var aspect = slideview.attr("data-orig-ratio");
    if (aspect === undefined) {
	aspect = slideview.width() / slideview.height();
        slideview.attr("data-orig-ratio", aspect);
    }

    var newWidth = parent.width() * 0.40;
    var newHeight = newWidth / aspect;

    slideview.width(newWidth).css('width', newWidth).attr('width', newWidth);
    slideview.height(newHeight).css('height', newHeight).attr('height', newHeight);

    window.onscroll();
}

function delayLoad(time, slides) {
    if (!slides || slides.length === 0) {return;}
    if (loader) {return;}

    function load(dom) {
	var parent = dom.parentNode;
	if (parent.id) {
	    if (!dom.src || dom.src === "") {
		dom.src = parent.id;
		dom.alt = parent.id;
		loader = dom;
		dom.onload = function() {
//		    console.log("loaded: " + dom.src);
		    loader = null;
		}
		dom.onerror = function() {
		    console.log("failed: " + dom.src);
		    loader = null;
		}
		return true;
	    }
	}
	return false;
    }

    var previewnote = document.getElementsByClassName("previewnote")[0];
    if (previewnote) {
	for (var i = 0; i < slides.length; i++) {
	    var dom = slides[i][0];
	    load(dom);
	}
	return;
    }
    var val = load(slides[0][0]);
    if (val) {return;}

    var ind = findEventIndex(time, slides);
    var i = ind;
    while (i < slides.length) {
	if (i >= slides.length) {return;}
	var dom = slides[i][0];
	var slideTime = slides[i][1];
	//if (slideTime > time + 20) {return;}
	if (dom) {
	    var val = load(dom);
	    if (val) {
		return;
	    }
	}
	i++;
    }
}

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

function findEventIndex(time, events) {
    if (!events) {return -1;}
    if (events.length === 0) {return -1};
    if (events.length === 1) {return 0;}

    for (var i = 0; i < events.length - 1; i++) {
        var pair = events[i];
        var next = events[i+1];
        if (pair[1] <= time && time < next[1]) {
            return i;
        }
    }
    var pair = events[events.length - 1];
    if (pair[1] < time) {
        return events.length - 1;
    }
    if (time < events[0][1]) {
	return 0;
    }
    return -1;
}
    
function findEvent(time, events) {
    var ind = findEventIndex(time, events);
    return ind >= 0 ?events[ind][0] : null;
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
	var slideItems = document.getElementsByClassName("slideimage");
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

	window.onscroll();
	autoResizer();

	function loaderFunc() {
	    delayLoad(lastTime - 10, slides);
	}
	if (!loadInterval) {
	    console.log("start delay load");
	    loadInterval = setInterval(loaderFunc, 2000);
	}
    }

    var time = !player.getCurrentTime ? 0 : player.getCurrentTime();
    if (!events) {return;}

    function callback(time) {
	var event = findEvent(time, events);
	if (event && mw.config.get("wgAction") == "view" && highlightedEvent !== event) {
	    smoothScrollTo(event.offsetTop - embedvideo.getBoundingClientRect().bottom, Date.now(), 300);
	    events.forEach(function (pair) {
		var div = pair[0];
		div.classList.remove('subtitlehighlight');
	    });
	    event.classList.add("subtitlehighlight");
	}

	delayLoad(time - 10, slides);
	var slide = findEvent(time, slides);

	if (slide && mw.config.get("wgAction") == "view") { // && highlightedSlide !== slide)
	    if (slideview) {
		var cxt = slideview.getContext('2d');
		if (slide && slide.tagName == "IMG") {
		    var ws = slideview.width / slide.naturalWidth;
		    var vs = slideview.height / slide.naturalHeight;
		    if (ws < vs) { // too wide, pad top and bottom
			var scale = ws;
			var tx = 0;
			var ty = (slideview.height / scale - slide.naturalHeight) / 2.0;
		    } else { // too high, pad left and right
			var scale = vs;
			var ty = 0;
			var tx = (slideview.width / scale -  slide.naturalWidth) / 2.0;
		    }

		    cxt.resetTransform();
		    cxt.clearRect(0, 0, slideview.width, slideview.height);
		    cxt.scale(scale, scale);
		    cxt.drawImage(slide, tx, ty);
		}
	    };
	}
    }
    if (typeof time === "string") {
	lastTime = parseFloat(time);
	callback(lastTime);
    } else if (typeof time === "number") {
	lastTime = time;
	callback(lastTime);
    } else { // must be promise for vimeo player
	time.then(function(t) {
	    lastTime = t;
	    callback(t);
	});
    }
}

if (player) {
    updateEventHighlight();
}
