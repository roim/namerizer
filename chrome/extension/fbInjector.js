function injectFacebookScript() { // this could be done faster with the livequery() plugin for jquery
	console.log('creating!!');
	if ($('body').children().length == 0) {
		setTimeout(injectFacebookScript, 100);
		return;
	}
	var body = $('body');
	console.log('ok!');
	body.append('<iframe id="facebook_load_frame" src = "https://namerizer.herokuapp.com/iframe.html"/>');
	console.log(body);
}
injectFacebookScript();


// Message passing API from David Walsh at http://davidwalsh.name/window-iframe
// Create IE + others compatible event handler
var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
var eventer = window[eventMethod];
var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
// Listen to message from child window
eventer(messageEvent, function(e) {
	//This is the data from the Facebook SDK
	console.log(e.data);
	chrome.runtime.sendMessage(e.data, function(response) {return "You're welcome :)";});
},false);