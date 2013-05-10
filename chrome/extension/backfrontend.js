//
// ConstantsGM
//

var baseServiceAddress = "http://fbnamerizer.appspot.com";
var graphBaseServiceAddress = "http://graph.facebook.com";

//
// Classes
//

function AddNicknameContract (authorId, targetId, alias, name, username) {
	this.source   = authorId + '';
	this.target   = targetId + '';
	this.alias    = alias;
	this.name     = name;
	this.username = username;
}

//
// Functions
//

function processMessage(request, sender, sendResponse) {
	if (request.code === 'userNicknames') {
		$.get(baseServiceAddress + "/getNicknamesForUser/" + request.userId, sendResponse);
		return true;
	} else if (request.code === 'commonNicknames') {
		$.get(baseServiceAddress + "/getSuggestions/" + request.userId, sendResponse);
		return true;
	} else if (request.code === 'sendNickname') {
		requestBody = new AddNicknameContract(
			request.source,
			request.target, 
			request.alias, 
			request.name, 
			request.username);
		$.post(baseServiceAddress + "/addNewNickname", JSON.stringify(requestBody), sendResponse);
		return true;
	} else if (request.code === 'facebookData') {
		var uids = "";
		if (request.userIds)
			for (var i = 0; i < request.userIds.length; i++)
				uids += ",+" + request.userIds[i];
		uids = uids.substring(2);
		$.get(graphBaseServiceAddress + "/fql?q=SELECT+name,username,uid+FROM+user+WHERE+uid+IN+(" + uids + ")", sendResponse);
		return true;
	}
	return false;
}

chrome.runtime.onMessage.addListener(processMessage);