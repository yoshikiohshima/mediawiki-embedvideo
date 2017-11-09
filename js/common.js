/* this is to be stored in MediaWiki:Common.js, and will be loaded on to all pages */

(function ( mw, $ ) {
	if (mw.config.get("wgAction") !== "edit") {return;}
	var id = mw.config.get("wgArticleId");
	if (!id) /* > 0? */ {return;}
	
	var url = 'api.php?action=query&prop=revisions&rvprop=content&format=json&pageids=' + id;


	var str = document.getElementById("wpTextbox1").textContent;
	if (!str) {return;}
	var exp = /#evt:\nservice=youtubeIA\n\|id=([^ \n\t]+)/m;
	var match;
	if (str && (match = exp.exec(str))) {
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
} )( mediaWiki, jQuery );
