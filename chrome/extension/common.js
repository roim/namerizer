// Constants
var currentUserId;
var cacheKeys = {
	currentUserId: 'currentUserId', 
	userNicknames: "namerizerNicknamesCache", 
	commonNicknamesForUser: "namerizerCommonNicknamesCache"
	};

// Globals
var nicknameMapForUsername = {};
var nicknameMapForId = {};
var nicknameList = [];

 // for local cache
if (!this.GM_getValue || (this.GM_getValue.toString && this.GM_getValue.toString().indexOf("not supported")>-1)) {
  this.GM_getValue=function (key,def) {
      return localStorage[key] || def;
  };
  this.GM_setValue=function (key,value) {
  		if ( typeof value === "undefined" ) return;
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
	var match = /"user"\s*:\s*"([0-9]+)"/.exec(document.head ? document.head.innerHTML : null);
	if (match)
		currentUserId = match[1];
	if (!currentUserId) {
		setTimeout(parseCurrentUserId, 100);
		return;
	}
	if (GM_getValue(cacheKeys.currentUserId) != currentUserId) {
		for (i in cacheKeys)
			GM_deleteValue(cacheKeys[i]);
		GM_setValue(cacheKeys.currentUserId, currentUserId);
	}
	fetchUsedNicknames();
}
parseCurrentUserId();

// talking to back front end

function fetchUsedNicknames() {
	if (!Object.keys(nicknameList).length) {
		var persistentJson = GM_getValue(cacheKeys.userNicknames);
		if (persistentJson) {
			nicknameList = JSON.parse(persistentJson);
			nicknameMapForId = nickNameMapFromList(nicknameList, 'target');
			nicknameMapForUsername = nickNameMapFromList(nicknameList, 'username');
			switchNames();
		}
	}
	
	if (currentUserId && currentUserId != -1) {
		chrome.runtime.sendMessage(new UserNicknamesParameters(currentUserId), function(response) {
			var preNicknameList = JSON.parse(response);
			var prenicknameMapForId = nickNameMapFromList(preNicknameList, 'target');
			var uids = [];
			fastForEach(preNicknameList, function(elm) {
				uids.push(elm.target);
			});
			fetchFacebookDataFromIds(new FacebookDataParameters(uids), function(fbResponse) {
				if(fbResponse.data)
					fastForEach(fbResponse.data, function(elm) {
						prenicknameMapForId[elm.uid].username = elm.username;
						prenicknameMapForId[elm.uid].name = elm.name;
					});
				nicknameList = removeUselessNicknames(preNicknameList);
				nicknameMapForId = updateNames(nickNameMapFromList(nicknameList, 'target')); // function returns the argument itself, did this not to have to create a temp variable
				nicknameMapForUsername = nickNameMapFromList(nicknameList, 'username');
				GM_setValue(cacheKeys.userNicknames, JSON.stringify(nicknameList));
				switchNames();
			});
		});
	}

	if (!(nicknameList instanceof Array)) nicknameList = [];
}

function fetchFacebookDataFromIds(request, callback) {
	chrome.runtime.sendMessage(request, callback);
}

function removeUselessNicknames(list) {
	var retArr = [];
	fastForEach(list, function(elm) {
		if (elm.target && elm.name != elm.alias)
			retArr.push(elm);
	});
	return retArr;
}

function nickNameMapFromList(list, key) {
	var map = {};
	fastForEach(list, function(elm) {
		if (elm && key in elm)
			map[elm[key].toString()] = elm;
	});
	return map;
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
	var userId;
	fastForEach(columns, function(node) {
		var datagt = $(node).attr('data-gt');
		if (datagt) {
			datagt = JSON.parse(datagt);
			if (datagt.profile_owner) {
				userId = datagt.profile_owner;
			}
		}
	});
	return userId;
}

var stringReplaceUtil = "#@!N%$am!@eri#@z_er_Stri_ngRe_pLa_ceUt_il!@#"
function replaceOnStringExcluding(where, what, towhat, notWhenIn) {
	if (notWhenIn.indexOf(what) !== -1)
		return where.replace(notWhenIn, stringReplaceUtil).replace(what, towhat).replace(stringReplaceUtil, notWhenIn);
	else
		return where.replace(what, towhat);
}

function targetFromURL(url) {
	if (target = nicknameMapForUsername[usernameFromURL(url)])
		return target;
	if (target = nicknameMapForId[userIdFromMessagesURL(url)])
		return target;
	if (target = nicknameMapForUsername[usernameFromMessagesURL(url)])
		return target;
	if (target = nicknameMapForId[userIdFromURL(url)])
		return target;
}

function usernameFromURL(url) {
	var match = /[^\/]\/{1}([A-z0-9\.]{5,})/.exec(url);
	if (match)
		return match[1] != "profile.php" ? match[1] : userIdFromURL(url);
}

function userIdFromURL(url) {
	var match = /id=([0-9]+)/.exec(url);
	if (match)
		return match[1];
}

function usernameFromMessagesURL(url) {
	var match = /\/?[Mm]essages\/([A-z0-9\.]{5,})/.exec(url);
	if (match)
		return match[1];
}

function userIdFromMessagesURL(url) {
	var match = /\/?[Mm]essages\/([0-9]+)/.exec(url);
	if (match)
		return match[1];
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
