//
// Constants
//

var baseServiceAddress = "http://namerizer.herokuapp.com";

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
	}
	return false;
}

chrome.runtime.onMessage.addListener(processMessage);