var $editNicknamesButton;

function sendNicknameToServer(params, callback) {
	var target = nicknameMapForId[params.target];
	var unswitchedNodes;
	if (target) {
		unswitchedNodes = unswitchNames(target);
		target.alias = params.alias;
	} else {
		target = nicknameMapForId[params.target] = nicknameMapForUsername[params.username] = params;
		nicknameList.push(target);
	}
	switchNames(unswitchedNodes); // if it's undefined the function will just search on every anchor

	chrome.runtime.sendMessage(params, function(response) {
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
	var target = targetFromURL($profileName.attr('href'));
	var $clone = $profileName.clone().removeAttr('href').wrap('<div contentEditable="true"/>');
	var $editNicknameDiv = $clone.parent();
	$editNicknameDiv.keypress(function(e) {
		if (e.which === 13) {
			$editNicknameDiv.remove();
			$profileName.show();
			var alternateName = $profileName.find('.alternate_name');
			var name = target ? target.name : (
					alternateName ?
						$profileName.text().replace(alternateName.text(), '').replace(/^\s+|\s+$/g, '') : // remove alternate name then trim
						$profileName.text());
			sendNicknameToServer(new SendNicknameParameters(
				currentUserId,          // source
				findProfileOwnerId(),   // target
				$editNicknameDiv.text(),// alias
				name,                   // name
				currentProfileUsername  // username
			));
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
	if (!actionsDropdown || !actionsDropdown.length || !isProfileOwnerFriend() || 
		($editNicknamesButton && !$.contains(actionsDropdown, $editNicknamesButton[0])))
		return;

	$editNicknamesButton = $('<span class="uiButtonGroupItem buttonItem firstItem"><a class="uiButton uiButtonOverlay uiButtonLarge" role="button" data-hover="tooltip" aria-label="Edit user nickname" data-tooltip-alignh="center"><span class="uiButtonText">Nickname</span></a></span>');
	$editNicknamesButton.click(editNickname);
	$(actionsDropdown.find('.actionsContents .firstItem')).removeClass('firstItem');
	$editNicknamesButton.prependTo(actionsDropdown.find('.actionsContents'));
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