var $editNicknamesButton;

function sendNicknameToServer(data, callback) {
	var target = nicknameMap[data.username];
	if (target) {
		$('a[namerized="true"]').each(function(i, node) {
			var href = $(node).attr('href');
			if (usernameFromURL(href) === target.username || userIdFromMessagesURL(href) == target.target) {
				$(node).html(replaceOnStringExcluding($(node).html(), target.alias, target.name, target.name));
				$(node).removeAttr('namerized');
			}

		});
		target.alias = data.alias;
		GM_setValue(cacheKeys.userNicknames, JSON.stringify(nicknameList));
		switchNames();
	} else {
		target = nicknameMap[data.username] = data;
		nicknameList.push(target);
		GM_setValue(cacheKeys.userNicknames, JSON.stringify(nicknameList));
		switchNames();
	}

	data.code = "sendNickname";
	chrome.runtime.sendMessage(data, function(response) {
		if (callback)
			callback(response);
		fetchUsedNicknames();
	});
}

function selectText(element) {
    var doc = document, range, selection;

    if (doc.body.createTextRange) { //ms
        range = doc.body.createTextRange();
        range.moveToElementText(element);
        range.select();
    } else if (window.getSelection) { //all others
        selection = window.getSelection();        
        range = doc.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

function editNickname() {
	var $profileName = $('#fbProfileCover .cover div a');
	var target = nicknameMap[usernameFromURL($profileName.attr('href'))];
	var $clone = $profileName.clone().removeAttr('href').wrap('<div contentEditable="true"/>');
	var $editNicknameDiv = $clone.parent();
	$editNicknameDiv.keypress(function(e) {
		if (e.which === 13) {
			$editNicknameDiv.remove();
			$profileName.show();
			sendNicknameToServer({
				source: currentUserId, 
				target: findProfileOwnerId(), 
				alias: $editNicknameDiv.text(),
				name: target ? target.name : $profileName.text(),
				username: currentProfileUsername
			});
			return false;
		}
	});
	$editNicknameDiv.focusout(function() {
		$editNicknameDiv.remove();
		$profileName.show();
	});

	$profileName.hide();
	$profileName.after($editNicknameDiv);

	selectText($clone[0]);
}

function createEditNicknames() {
	var actionsDropdown = $('#pagelet_timeline_profile_actions');
	var isFriends = actionsDropdown.find('.FriendButton .FriendRequestFriends');
	if (!actionsDropdown || !actionsDropdown.length || !isFriends.length || isFriends.hasClass('hidden_elem') || 
		($editNicknamesButton && !$.contains(actionsDropdown, $editNicknamesButton[0])))
		return;

	$editNicknamesButton = $('<span class="uiButtonGroup uiButtonGroupOverlay" id="u_0_g_namerizer"><span class="uiButtonGroupItem buttonItem firstItem lastItem"><a class="uiButton uiButtonOverlay uiButtonLarge" role="button"><span class="uiButtonText">Edit Nickname</span></a></span></span>');
	$editNicknamesButton.click(editNickname);
	$editNicknamesButton.prependTo(actionsDropdown);
}

MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
var observer = new MutationObserver(function(mutations) {
	var newProfileUsername = usernameFromURL(window.location.href);
	if (currentProfileUsername != newProfileUsername || ($editNicknamesButton && !$.contains(document.documentElement, $editNicknamesButton[0]))) {
		currentProfileUsername = newProfileUsername;
		$editNicknamesButton = null;
	}
		
	if (!$editNicknamesButton)
		createEditNicknames();
});

observer.observe(document, {
  subtree: true,
  childList: true
});