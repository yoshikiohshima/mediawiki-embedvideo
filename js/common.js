/* this is to be stored in MediaWiki:Common.js, and will be loaded on to all pages */

(function ( mw, $ ) {
	if (mw.config.get("wgAction") !== "edit") {return;}
	var id = mw.config.get("wgArticleId");
	if (!id) /* > 0? */ {return;}
	
	var url = 'api.php?action=query&prop=revisions&rvprop=content&format=json&pageids=' + id;


	var str = document.getElementById("wpTextbox1").textContent;
	if (!str) {return;}
	var exp = /#evt:\nservice=youtubeIA\n\|id=([^ \n\t]+)/m;
	var match = exp.exec(str);
	if (str && match) {
		var dom = document.createElement("div");
		dom.id = "ia-video";
		var body = document.getElementById("bodyContent");
		if (body) {
	     		body.parentNode.insertBefore(dom, body);
		}
		window.player = null;
		window.onYouTubeIframeAPIReady = function() {
			player = new YT.Player("ia-video",
				{height: 360, width: 640, videoId: match[1],
				events: {},
				playerVars: {rel: 0, showinfo: 0},});
			};
		var tag = document.createElement('script');
		tag.src = 'https://www.youtube.com/iframe_api';
		var firstScriptTag = document.getElementsByTagName('script')[0];
		firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
	}

	// select the video element from Chrome inspector, and then assign the $0 value into a variable
	// called video (i.e., evaluate "var video = $0" from console)
 	// Then run initExtractor() from console to accumulate the text into extractResult

	var video;
	var extractResult = [""];  // always trimmed
	var extractInterval;
 	var last200 = "";
	function extractStep() {
		function findCaption(video) {
		    var parent = video.parentNode.parentNode;
		    for (var i = 0; i < parent.children.length; i++) {
			node = parent.children[i];
			if (node.classList.contains("caption-window")) {
			    return node.textContent;
			}
		    }
		    return null;
		}

		var box;

		var newText = findCaption(window.video); //document.getElementsByClassName("captions-text")[0];
		if (typeof newText !== "string") {console.log("no caption");return;}

		newText = newText.trim();

		var oldText = last200;
	    	var matches = [];

		for (var i = oldText.length - 1; i >= 0; i--) {
			var oSub = oldText.slice(i, oldText.length);
			if (newText.startsWith(oSub)) {
				matches.push(i);
			}
		}
		if (matches.length == 0) {
			var matched = newText;
		} else {
			var matchLen = oldText.length - matches[matches.length - 1];
			var matched = newText.slice(matchLen);
		}
	        last200 = (oldText + matched);
	        var ind = last200.length - 200;
	        last200 = last200.slice(ind > 0 ? ind : 0);
	        console.log(last200);
	        if (window.player && window.player.firstChild &&
		    window.player.firstChild.getCurrentTime) {
		    var time = window.player.firstChild.getCurrentTime();
		    var h = Math.floor(time / (60 * 60));
		    var m = Math.floor((time - (h * 60 * 60)) / 60);
		    var s = Math.floor(time % 60);
		    var subtitle = '<subtitle id=';
		    subtitle += '"' + h + ':' + m + ':' + s + '">';
		    subtitle += matched;
		    subtitle += '</subtitle>\n';
		    extractResult.push(subtitle);
		    console.log(subtitle);
		   // window.document.getElementById("wpTextbox1").value += subtitle;
		    if (box) {
			box.value += subtitle;
		    }
		}
	}

	var initExtractor = function() {
		extractInterval = setInterval(extractStep, 3000);
	}

	var clearExtractor = function() {
		clearInterval(extractInterval);
		extractInterval = null;
	}
} )( mediaWiki, jQuery );
