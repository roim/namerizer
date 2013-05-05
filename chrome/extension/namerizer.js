

function configureNodeAnimation(node, target) {
	$(node).on('mouseenter', function() {
		fadeReplaceInHtml(node, target.alias, target.name);
	});
	$(node).on('mouseout', function() {
		fadeReplaceInHtml(node, target.name, target.alias);
	});
}

function replaceName(node, username) {
	var target = nicknameMap[username];

	if (target
			&& $(node).html().indexOf(target.name) !== -1
			&& !$(node).attr('namerized')) {
		$(node).attr('namerized', 'true');

		$(node).html($(node).html().replace(target.name, target.alias));
		configureNodeAnimation(node, target);
	}
}


function switchNames(links) {
	if (!links)
		links = $('a');
	for (var i = 0; i < links.length; i++) {
		var href = links[i].href;
		if (!href) {
		  continue;
		}
		replaceName(links[i], usernameFromURL(href));
	}
}

MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

var observer = new MutationObserver(function(mutations) {
	for (var i in mutations) {
		if (mutations[i].type == 'childList' && mutations[i].addedNodes) {
			var addedNodes = mutations[i].addedNodes;
			for (var j = 0; j < addedNodes.length; j++) {
				switchNames($(addedNodes[j]).find('a'));
			}
		}
	}
});

observer.observe(document, {
  subtree: true,
  childList: true
});