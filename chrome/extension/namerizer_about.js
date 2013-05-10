var commonNicknames = {};

function fetchCommonNicknames(data, callback) {
	var persistentJson = GM_getValue(cacheKeys.commonNicknamesForUser);
	if (persistentJson) {
		var parsedJSON = JSON.parse(persistentJson);
		if (parsedJSON[data.username] && !commonNicknames[data.username] && callback) {
			commonNicknames[data.username] = parsedJSON[data.username];
			callback(parsedJSON[data.username], 'cache');
		}
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
	for (var i = 0; i < response.length; i++) {
		nicknames.push(decodeFromHex(response[i][0]));
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

function updateCommonNicknamesSpan(nicknameList) {
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
	var $elm = $info.children().last().clone().attr('id', 'namerizer_nicknames');
	$elm.find('img').attr('src', chrome.extension.getURL("images/commonNicknamesIcon.png"));
	$elm.find('li').text('Common nicknames: ');
	$commonNicknamesSpan = $('<span/>').appendTo(
		$elm.find('li').text('Common nicknames: ')
	).text('-');
	$info.append($elm);

	if (!commonNicknames[currentProfileUsername]) {
		var target = nicknameMap[currentProfileUsername];
		if (target)
			commonNicknames[currentProfileUsername] = [target.alias];
	}
	if (commonNicknames[currentProfileUsername])
		updateCommonNicknamesSpan(commonNicknames[currentProfileUsername]);

	fetchCommonNicknames({userId: findProfileOwnerId(), username: currentProfileUsername}, function(response, origin) {
		if (origin == 'cache') {
			updateCommonNicknamesSpan(response);
		}
		else {
			animateApplyFunction($commonNicknamesSpan, function() {updateCommonNicknamesSpan(response)});
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