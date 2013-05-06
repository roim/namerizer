var commonNicknames = {};

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

function commonNicknamesFromResponse(response) {
	var nicknames;

	if (response.length == 0) {
		nicknames = '-';
	} else {
		nicknames = decodeFromHex(response[0][0]);
		for (var i = 1; i < response.length; i++) {
			nicknames += ', ' + decodeFromHex(response[i][0]);
		}
	}
	return nicknames;
}

// Front front end

var currentProfileUsername;

var $commonNicknamesAnchor;

function createCommonNicknames() {
	var aboutContent;
	var contents = $('.timelineReportContent .timelineUnitContainer');
	for (i = 0; i < contents.length; i++) {
		var datagt = $(contents[i]).attr('data-gt');
		if (datagt) {
			datagt = JSON.parse(datagt);
			if (datagt['timeline_unit_type'] == 'TimelineAboutUnit') {
				aboutContent = contents[i];
				break;
			}
		}
	}
	if (!aboutContent || $(aboutContent).attr('namerized')) {
		return;
	}
	
	$(aboutContent).attr('namerized', 'true');
	var $info = $($(aboutContent).find('ul')[0]);
	var imgUrl = chrome.extension.getURL("commonNicknamesIcon.png");
	var $elm = $('<div class="clearfix" />').appendTo($('<li class="_4_uf" id="namerizer_nicknames"/>').appendTo($info));
	$elm.append('<img class="_s0 _51iw _29h _29i _54rv img" width="16" height="16" alt="" src="' + imgUrl + '"/>');
	$commonNicknamesAnchor = $('<a target="_blank" class="profileLink" href="http://namerizer.herokuapp.com/" data-hover="tooltip" aria-label="From Namerizer app" data-tooltip-alignh="center"/>').appendTo(
		$('<li class="_4_ug"/>').appendTo($('<ul class="uiList _4_vp _29j _29k _513w _4kg"/>').appendTo($elm)).text('Common nicknames: ')
	).text('-');
	
	if (commonNicknames[currentProfileUsername]) {
		$commonNicknamesAnchor.text(commonNicknames[currentProfileUsername]);
	} else {
		var target = nicknameMap[currentProfileUsername];
		if (target) {
			$commonNicknamesAnchor.text(target.alias);
		}
	}

	fetchCommonNicknames({userId: findProfileOwnerId(), username: currentProfileUsername}, function(response, origin) {
		if (origin == 'cache') {
			$commonNicknamesAnchor.text(response);
		}
		else {
			fadeTextTo($commonNicknamesAnchor, response);
		}
	});
}

currentProfileUsername = usernameFromURL(window.location.href);

MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
var observer = new MutationObserver(function(mutations) {
	var newProfileUsername = usernameFromURL(window.location.href);
	if (currentProfileUsername != newProfileUsername ||  ($commonNicknamesAnchor && !$.contains(document.documentElement, $commonNicknamesAnchor[0]))) {
		currentProfileUsername = newProfileUsername;
		$commonNicknamesAnchor = null;
	}
		
	if (!$commonNicknamesAnchor)
		createCommonNicknames();
});

observer.observe(document, {
  subtree: true,
  childList: true
});