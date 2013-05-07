//
// Constants
//

var baseServiceAddress = "http://localhost:8080";

//
// Classes
//

function AddNicknameContract (authorId, targetId, alias, name, username) {
	this.AuthorId = parseFloat(authorId);
	this.TargetId = parseFloat(targetId);
	this.Alias    = alias;
	this.Name     = name;
	this.Username = username;
}

//
// Functions
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
		$.get(baseServiceAddress + "/getNicknamesForUser/" + request.userId, sendResponse);
		return true;
	} else if (request.code === 'commonNicknames') {
		$.get(baseServiceAddress + "/getSuggestions/" + request.userId, sendResponse);
		return true;
	} else if (request.code === 'sendNickname') {
		requestBody = new AddNicknameContract(
			request.source,
			request.target, 
			encodeToHex(request.alias), 
			encodeToHex(request.name), 
			encodeToHex(request.username));
		$.post(baseServiceAddress + "/addNewNickname", JSON.stringify(requestBody));
		return true;
	}
	return false;
}

chrome.runtime.onMessage.addListener(processMessage);