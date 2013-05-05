// Constants
var currentUserId;
var cacheKeys = {
	currentUserId: 'currentUserId', 
	userNicknames: "namerizerNicknamesCache", 
	commonNicknamesForUser: "namerizerCommonNicknamesCache"
	};

// Globals
var nicknameList = {};
var commonNicknames = {};

 // for local cache
if (!this.GM_getValue || (this.GM_getValue.toString && this.GM_getValue.toString().indexOf("not supported")>-1)) {
  this.GM_getValue=function (key,def) {
      return localStorage[key] || def;
  };
  this.GM_setValue=function (key,value) {
      return localStorage[key]=value;
  };
  this.GM_deleteValue=function (key) {
      return delete localStorage[key];
  };
}

// finding current user ID
function parseCurrentUserId() {
	if ($("html").html().length < 300) {
		setTimeout(parseCurrentUserId, 100);
		return;
	}
	
	var beginOfHtml = $("html").html().substring(0, 300);
	if (beginOfHtml[7] == 'm') {
		var begin = beginOfHtml.indexOf("user") + 7;
		var end = beginOfHtml.indexOf('",');

		if (begin != -1 && end != -1) {
			var userIdString = beginOfHtml.substring(begin, end);
			currentUserId = parseInt(userIdString);
		}
	}
	if (!currentUserId) {
		currentUserId = -1;
	} else {		
		if (GM_getValue(cacheKeys.currentUserId) != currentUserId) {
			for (i in cacheKeys) {
				GM_deleteValue(cacheKeys[i]);
			}
			GM_setValue(cacheKeys.currentUserId, currentUserId);
		}
		fetchUsedNicknames();
	}
}
parseCurrentUserId();

// talking to back front end

function fetchUsedNicknames() {
	var persistentJson = GM_getValue(cacheKeys.userNicknames);
	if (persistentJson) {
		nicknameList = JSON.parse(persistentJson);
	}
	
	if (currentUserId && currentUserId != -1) {
		chrome.runtime.sendMessage({code: "userNicknames", userId: currentUserId}, function(response) {
			decodeFromHexRecursive(response);
			nicknameList = response;
			GM_setValue(cacheKeys.userNicknames, JSON.stringify(nicknameList));
		});
	}
}

function fetchCommonNicknames(data, callback) {
	var persistentJson = GM_getValue(cacheKeys.commonNicknamesForUser);
	if (persistentJson) {
		commonNicknames = JSON.parse(persistentJson);
		if (commonNicknames[data.username] && callback)
			callback(commonNicknames[data.username], 'cache');
	}
	chrome.runtime.sendMessage({code: "commonNicknames", userId: data.userId}, function(response) {
			var nicknames = commonNicknamesFromResponse(response);
			if (nicknames != '-') {
				commonNicknames[data.username] = nicknames;
				GM_setValue(cacheKeys.commonNicknamesForUser, JSON.stringify(commonNicknames));
			}
			if (callback) {
				callback(nicknames, 'server');
			}
	});
}

function decodeFromHexRecursive(obj) {
	for (var i in obj) {
		if (typeof obj[i] === "string")
			obj[i] = decodeFromHex(obj[i]);
		else
			decodeFromHexRecursive(obj[i]);
	}
}

function commonNicknamesFromResponse(response) {
	var nicknames;

	if (response.length == 0) {
		nicknames = '-';
	} else {
		nicknames = decodeFromHex(response[response.length - 1][0]);
		for (var i = response.length - 2; i >= 0; i--) {
			nicknames += ', ' + decodeFromHex(response[i][0]);
		}
	}
	return nicknames;
}

function decodeFromHex(str){
    var r="";
    var e=str.length;
    var s;
    while(e>=0){
        s=e-3;
        r=String.fromCharCode("0x"+str.substring(s,e))+r;
        e=s;
    }
    return r.replace(String.fromCharCode(0), "");
}

// Front front end

function search(list, property, value) {
	for (var i in list) {
		if (list[i][property] == value) {
			return list[i];
		}
	}
	return null;
}

function usernameFromURL(url) {
	if (url.indexOf('?') != -1) {
		return url.substring(url.indexOf('www.facebook.com/') + 17, url.indexOf('?'));
	} else {
		return url.substring(url.indexOf('www.facebook.com/') + 17);
	}
}

function fadeTextTo(node, text) {
	if (text == $(node).text())
		return;
	$(node).fadeOut(200, function() {
		$(node).text(text).fadeIn(200);
	});
}