// Constants
var currentUserId;
var cacheKeys = {
	currentUserId: 'currentUserId', 
	userNicknames: "namerizerNicknamesCache", 
	commonNicknamesForUser: "namerizerCommonNicknamesCache"
	};

// Globals
var nicknameMap = {};
var nicknameMapForId = {};
var nicknameList = {};

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

// cool things

function isArraylike( obj ) {
	var length = obj.length,
		type = typeof obj;

	return type === "array" || type !== "function" &&
		( length === 0 ||
		(typeof length === "number" && length > 0 && ( length - 1 ) in obj ));
}

function fastForEach(collection, callback, forThis) {
	if (isArraylike(collection)) {
		if (Array.prototype.forEach) {
			Array.prototype.forEach.call(collection, callback, forThis);
		} else {
			for (var i = collection.length - 1; i >= 0; --i) {
				if (i in collection)
					callback.call(forThis, collection[i], i, collection);
			}
		}
	} else {
		for (var i in collection) {
			callback.call(forThis, collection[i], i, collection);
		}
	}
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
		nicknameMap = nicknameMapFromList(nicknameList, 'username');
		nicknameMapForId = nicknameMapFromList(nicknameList, 'target');
		switchNames();
	}
	
	if (currentUserId && currentUserId != -1) {
		chrome.runtime.sendMessage({code: "userNicknames", userId: currentUserId}, function(response) {
			nicknameList = decodeFromHexRecursive(response);
			removeUselessNicknames(nicknameList);
			nicknameMap = nicknameMapFromList(nicknameList, 'username');
			nicknameMapForId = nicknameMapFromList(nicknameList, 'target');
			GM_setValue(cacheKeys.userNicknames, JSON.stringify(nicknameList));
			switchNames();
		});
	}
}

function removeUselessNicknames(list) {
	fastForEach(list, function(elm, i) {
		if (elm.username && elm.name == elm.alias)
			list.splice(i, 1);
	});
}

function nicknameMapFromList(list, key) {
	if (!key)
		key = 'username';
	var map = {};
	fastForEach(list, function(elm) {
		if (elm && key in elm)
			map[elm[key].toString()] = list[i];
	});
	return map;
}

function decodeFromHexRecursive(obj) {
	if (typeof obj === "string")
		return decodeFromHex(obj);
	var newObj;
	if (Object.prototype.toString.call(obj) === '[object Array]')
		newObj = [];
	else
		newObj = {};
	for (var i in obj) {
		newObj[i] = decodeFromHexRecursive(obj[i]);
	}
	for (var i in newObj) {
		return newObj;
	}
	return obj;
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

function arrayEquals(arr1, arr2) {
	if (!arr1 || !arr2)
		return arr1 === arr2;
	return !(arr1 < arr2 || arr1 > arr2);
}

// Front front end

function isProfileOwnerFriend() {
	var isFriends = $('#pagelet_timeline_profile_actions .FriendButton .FriendRequestFriends');
	return isFriends.length && !isFriends.hasClass('hidden_elem');
}

function findProfileOwnerId() {
	var columns = $('#pagelet_timeline_main_column');
	columns.each(function(node) {
		var datagt = $(node).attr('data-gt');
		if (datagt) {
			datagt = JSON.parse(datagt);
			if (datagt.profile_owner) {
				return parseInt(datagt.profile_owner);
			}
		}
	});
}

var stringReplaceUtil = "#@!N%$am!@eri#@z_er_Stri_ngRe_pLa_ceUt_il!@#"
function replaceOnStringExcluding(where, what, towhat, notWhenIn) {
	if (notWhenIn.indexOf(what) !== -1)
		return where.replace(notWhenIn, stringReplaceUtil).replace(what, towhat).replace(stringReplaceUtil, notWhenIn);
	else
		return where.replace(what, towhat);
}

function usernameFromURL(url) {
	if (url.indexOf('?') != -1) {
		return url.substring(url.indexOf('www.facebook.com/') + 17, url.indexOf('?'));
	} else {
		return url.substring(url.indexOf('www.facebook.com/') + 17);
	}
}

function userIdFromMessagesURL(url) {
	return url.substring(url.lastIndexOf('/') + 1);
}

function fadeTextTo(node, text) {
	if (text == $(node).text())
		return;
	$(node).animate({ opacity: 0 }, 'fast', function() {
		$(node).text(text).animate({ opacity: 1 }, 'fast');
	});
}

function animateApplyFunction(node, callback) {
	$(node).animate({ opacity: 0 }, 'fast', function() {
		callback();
		$(node).animate({ opacity: 1 }, 'fast');
	});
}

function fadeReplaceInText(node, what, towhat) {
	if ($(node).text().indexOf(what) === -1 && !$(node).is(':animated') )
		return;
	$(node).stop();
	$(node).animate({ opacity: 0 }, 'fast', function() {
		$(node).text(replaceOnStringExcluding($(node).text(), what, towhat, towhat)).animate({ opacity: 1 }, 'fast');
	});
}
