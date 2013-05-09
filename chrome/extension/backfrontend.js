//
// Constants
//

var baseServiceAddress = "http://namerizer.herokuapp.com";
var fbAccessTokenUrl = "https://www.facebook.com/dialog/oauth?client_id=270360863061196&response_type=token&scope=email&redirect_uri=https://www.facebook.com/connect/login_success.html";
var fbSuccessURL= "www.facebook.com/connect/login_success.html"
var graphBaseServiceAddress = "http://graph.facebook.com";

//
// Function definitions
//

// These should be provided by GM, but they're not supported in Chrome :(
// Soo, if these are not defined, we implement them in the HTLM5 way. 
//

function encodeToHex(str){
    var r="";
    var e=str.length;
    var c=0;
    var h;
    while(c<e){
        h=str.charCodeAt(c++).toString(16);
        while(h.length<3) h="0"+h;
        r+=h;
    }
    return r;
}

//facebook

var authTab;
function onChromeTabUpdate(updatedTabId, changeInfo, tab) {
	if (updatedTabId === authTab.id && changeInfo.url && changeInfo.url.indexOf(fbSuccessURL) !== -1) {
		var argsMap = getArgsFromUrl(changeInfo.url);
		if (argsMap['access_token']) {
			chrome.tabs.remove(authTab.id);
			chrome.tabs.onUpdated.removeListener(onChromeTabUpdate);
		}
		else;
	}
}

chrome.browserAction.onClicked.addListener(function(activeTab)
{
    var newURL = "http://www.youtube.com/watch?v=oHg5SJYRHA0";
    chrome.tabs.create({ url: fbAccessTokenUrl, active: false}, function(newTab) {
    	authTab = newTab;
		chrome.tabs.onUpdated.addListener(onChromeTabUpdate);
    });
});


function getArgsFromUrl(url) {
    var params = url.substring(url.indexOf('#') + 1);
    var args = params.split('&');
    var map = {};
    for (var i in args) {
        var pair = args[i].split('=');
        map[pair[0]] = pair[1];
    }
    return map;
}

// communication with tabs

function processMessage(request, sender, sendResponse) {
	if (request.code === 'userNicknames') {
		$.get(baseServiceAddress + "/fetch/" + request.userId, sendResponse);
		return true;
	} else if (request.code === 'commonNicknames') {
		$.get(baseServiceAddress + "/fetch/suggestions/" + request.userId + '/3', sendResponse);
		return true;
	} else if (request.code === 'sendNickname') {
		$.get(baseServiceAddress + "/fetch/create/" + 
			request.source + '/' + 
			request.target + '/' + 
			encodeToHex(request.alias) + '/' + 
			encodeToHex(request.name) + '/' + 
			encodeToHex(request.username), sendResponse);
		return true;
	} else if (request.code === 'facebookData') {
		var uids = "";
		if (request.userIds)
			for (var i = 0; i < request.userIds.length; i++)
				uids += ",+" + request.userIds[i];
		uids = uids.substring(2);
		$.get(graphBaseServiceAddress + "/fql?q=SELECT+name,+username,+uid+FROM+user+WHERE+uid+IN+(" + uids + ")", sendResponse);
		return true;
	}
	return false;
}

chrome.runtime.onMessage.addListener(processMessage);