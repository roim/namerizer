function configureNodeAnimation(node, target) {
	$(node).on('mouseenter', function() {
		fadeTextTo(node, target.name);
	});
	$(node).on('mouseout', function() {
		fadeTextTo(node, target.alias);
	});
}

function replaceName(node, username) {
	var target = search(nicknameList, 'username', username);
	if (target
			&& ($(node).children().length == 0)
			&& $(node).attr('namerized') != 'true' 
			&& $(node).text() == target.name) {
		$(node).attr('namerized', 'true');
		
		$(node).text(target.alias);
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
		var addedNodes = mutations[i].addedNodes;
		if (!addedNodes) continue;
		for (var j = 0; j < addedNodes.length; j++) {
			switchNames($(addedNodes[j]).find('a'));
		}
	}
});

observer.observe(document, {
  subtree: true,
  childList: true
});