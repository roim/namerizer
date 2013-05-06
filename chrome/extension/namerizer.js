
function findElementsDirectlyContainingText(ancestor, text) {
	var childrenContaining = $(ancestor).find(":contains(" + text + ")");
	if (childrenContaining.length === 0) {
		return [ancestor];
	}
	var array = [];
	childrenContaining.each(function(i, child) {
		array = array.concat(findElementsDirectlyContainingText(child, text));
	});
	return array;
}

function configureNodeAnimation(parentNode, whereToReplace, target) {
	$(parentNode).on('mouseenter', function(event) {
		if (event.target != parentNode) return;
		for (var i in whereToReplace) {
			node = whereToReplace[i];
			fadeReplaceInHtml(node, target.alias, target.name);
		}
	});
	$(parentNode).on('mouseleave', function(event) {
		if (event.target != parentNode) return;
		for (var i in whereToReplace) {
			node = whereToReplace[i];
			fadeReplaceInHtml(node, target.name, target.alias);
		}
	});
}

function replaceName(parentNode, target) {
	if(!target || $(parentNode).attr('namerized')) {
		return false;
	}
	var whereToReplace = findElementsDirectlyContainingText(parentNode, target.name);
	if (whereToReplace.length == 0)
		return false;
	for (var i in whereToReplace) {
		node = whereToReplace[i];
		if ($(node).html().indexOf(target.name) !== -1) {
			$(node).html($(node).html().replace(target.name, target.alias));
		}
	}
	$(parentNode).attr('namerized', 'true');
	configureNodeAnimation(parentNode, whereToReplace, target);
	return false;
}


function switchNames(links) {
	if (!links)
		links = $('a');
	for (var i = 0; i < links.length; i++) {
		var href = links[i].href;
		if (!href) {
		  continue;
		}

		if (!replaceName(links[i], nicknameMap[usernameFromURL(href)])) {
			replaceName(links[i], nicknameMapForId[usernameFromMessagesURL(href)]);
		}
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