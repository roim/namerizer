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

function processMessage(request, sender, sendResponse) {
	if (request.code == 'userNicknames') {
		$.get(baseServiceAddress + "/fetch/" + request.userId, sendResponse);
		return true;
	} else if (request.code == 'commonNicknames') {
		$.get(baseServiceAddress + "/fetch/suggestions/" + request.userId + '/3', sendResponse);
		return true;
	}
	return false;
}

chrome.runtime.onMessage.addListener(processMessage);