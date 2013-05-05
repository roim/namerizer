function findProfileOwnerId() {
	var columns = $('#pagelet_timeline_main_column');
	for (var i = 0; i < columns.length; i++) {
		var datagt = $(columns[i]).attr('data-gt');
		if (datagt) {
			datagt = JSON.parse(datagt);
			if (datagt['profile_owner']) {
				return datagt['profile_owner'];
			}
		}
	}
}

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
	var $elm = $('<li id="namerizer_nicknames" class="_4_uf"/>').appendTo($('<div class="clearfix" />').appendTo($info));
	$elm.append('<img class="_s0 _51iw _29h _29i _54rv img" width="16" height="16" alt="" src="https://fbstatic-a.akamaihd.net/rsrc.php/v2/yd/r/kz0_p5XcuSq.png"/>');
	$commonNicknamesAnchor = $('<a target="_blank" class="profileLink" href="http://namerizer.herokuapp.com/" />').appendTo(
		$('<li class="_4_ug"/>').appendTo($('<ul class="uiList _4_vp _29j _29k _513w _4kg"/>').appendTo($elm)).text('Common nicknames: ')
	).text('-');
	
	if (commonNicknames[currentProfileUsername]) {
		$commonNicknamesAnchor.text(commonNicknames[currentProfileUsername]);
	} else {
		var target = search(nicknameList, 'username', currentProfileUsername);
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
	if (currentProfileUsername != newProfileUsername) {
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