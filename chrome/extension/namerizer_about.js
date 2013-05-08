var commonNicknames = {};

function fetchCommonNicknames(data, callback) {
	var persistentJson = GM_getValue(cacheKeys.commonNicknamesForUser, undefined);
	if (persistentJson) {
		var parsedJSON = JSON.parse(persistentJson);
		if (!arrayEquals(commonNicknames[data.username], parsedJSON[data.username]) && callback)
			callback(parsedJSON[data.username], 'cache');
		if (!arrayEquals(commonNicknames, parsedJSON))
			commonNicknames = parsedJSON;
	}
	chrome.runtime.sendMessage({code: "commonNicknames", userId: data.userId}, function(response) {
			var nicknames = commonNicknamesFromResponse(response);
			if (!arrayEquals(commonNicknames[data.username], nicknames)) {
				commonNicknames[data.username] = nicknames;
				GM_setValue(cacheKeys.commonNicknamesForUser, JSON.stringify(commonNicknames));
				if (callback) {
					callback(nicknames, 'server');
				}
			}
	});
}

function commonNicknamesFromResponse(response) {
	var nicknames = [];
	if (typeof response === "undefined") return nicknames;
	for (var i = 0; i < response.length; i++) {
		nicknames.push(response[i][0]);
	}
	return nicknames;
}

// Front front end

function anchorFromAlias(alias) {
	if (!isProfileOwnerFriend())
		return $('<a target="_blank" href="http://namerizer.herokuapp.com/" class="profileLink" data-hover="tooltip" aria-label="From Namerizer app" data-tooltip-alignh="center"/>').text(alias);

	return $('<a class="profileLink" data-hover="tooltip" aria-label="Use this nickname" data-tooltip-alignh="center"/>').text(alias).click(function() {
		var $profileName = $('#fbProfileCover .cover div a');
		var alternateName = $profileName.find('.alternate_name');
		var target = nicknameMap[usernameFromURL($profileName.attr('href'))];
		sendNicknameToServer({
			source: currentUserId, 
			target: findProfileOwnerId(), 
			alias: alias,
			name: 
				target ? target.name : (
					alternateName ? 
						$profileName.text().replace(alternateName.text(), '').replace(/^\s+|\s+$/g, '') : 
						$profileName.text()),
			username: currentProfileUsername
		});
	});
}

function updatecommonNicknamesSpan(nicknameList) {
	if (!nicknameList.length) {
		$commonNicknamesSpan.text('-');
		return;
	}
	$commonNicknamesSpan.text('');
	$commonNicknamesSpan.append(anchorFromAlias(nicknameList[0]));
	for (var i = 1; i < nicknameList.length; i++) {
		$commonNicknamesSpan.append(', ');
		$commonNicknamesSpan.append(anchorFromAlias(nicknameList[i]));
	}
}

var currentProfileUsername;
var $commonNicknamesSpan;

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
	$commonNicknamesSpan = $('<span/>').appendTo(
		$('<li class="_4_ug"/>').appendTo($('<ul class="uiList _4_vp _29j _29k _513w _4kg"/>').appendTo($elm)).text('Common nicknames: ')
	).text('-');
		
	if (commonNicknames[currentProfileUsername]) {
		updatecommonNicknamesSpan(commonNicknames[currentProfileUsername]);
	} else {
		var target = nicknameMap[currentProfileUsername];
		if (target) {
			updatecommonNicknamesSpan([target.alias]);
		}
	}

	fetchCommonNicknames({userId: findProfileOwnerId(), username: currentProfileUsername}, function(response, origin) {
		if (origin == 'cache') {
			updatecommonNicknamesSpan(response);
		}
		else {
			animateApplyFunction($commonNicknamesSpan, function() {updatecommonNicknamesSpan(response)});
		}
	});
}

currentProfileUsername = usernameFromURL(window.location.href);

MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
var observer = new MutationObserver(function(mutations) {
	var newProfileUsername = usernameFromURL(window.location.href);
	if (currentProfileUsername != newProfileUsername ||  ($commonNicknamesSpan && !$.contains(document.documentElement, $commonNicknamesSpan[0]))) {
		currentProfileUsername = newProfileUsername;
		$commonNicknamesSpan = null;
	}
		
	if (!$commonNicknamesSpan)
		createCommonNicknames();
});

observer.observe(document, {
  subtree: true,
  childList: true
});