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

function configureNodeAnimation(parentNode, whereToReplace, name, alias) {
	$(parentNode).on('mouseenter', function(event) {
		if ($.contains(parentNode, event.fromElement)) return;
		$(parentNode).attr('namerized', 'false');
		whereToReplace.forEach(function(node) {
			fadeReplaceInText(node, alias, name);
		});
	});
	$(parentNode).on('mouseleave', function(event) {
		if ($.contains(parentNode, event.toElement)) return;
		$(parentNode).attr('namerized', 'true');
		whereToReplace.forEach(function(node) {
			fadeReplaceInText(node, name, alias);
		});
	});
}

function deconfigureNodeAnimation(parentNode) {
	$(parentNode).off('mouseenter');
	$(parentNode).off('mouseleave');
}

function unswitchNames(target) {
	var unswithedNodes = [];
	$('[namerized="true' + (target ? '"][namerizer_userId="' + target.target : '') + '"]').each(function(i, node) {
		var nodeTarget = nicknameMapForId[$(node).attr('namerizer_userid')];
		if ((!target || nodeTarget === target) && nodeTarget) {
			findElementsDirectlyContainingText(node, nodeTarget.alias).forEach(function(elm) {
				$(elm).html(replaceOnStringExcluding($(elm).html(), nodeTarget.alias, nodeTarget.name, nodeTarget.name));
			});
			$(node).removeAttr('namerized');
			$(node).removeAttr('namerizer_userid');
			deconfigureNodeAnimation(node);
			unswithedNodes.push(node);
		}
	});
	return unswithedNodes;
}

function updateNames(newNicknameMapForId) {
	$('[namerized="true"]').each(function(i, node) {
		var oldTarget = nicknameMapForId[$(node).attr('namerizer_userid')];
		if (!oldTarget)
			return;
		var newTarget = newNicknameMapForId[oldTarget.target];
		if (!newTarget) {
			findElementsDirectlyContainingText(node, oldTarget.alias).forEach(function(elm) {
				$(elm).html(replaceOnStringExcluding($(elm).html(), oldTarget.alias, oldTarget.name, oldTarget.name));
			});
			$(node).removeAttr('namerized');
			deconfigureNodeAnimation(node);
		} else if (oldTarget.alias != newTarget.alias) {
			findElementsDirectlyContainingText(node, oldTarget.alias).forEach(function(elm) {
				$(elm).html(replaceOnStringExcluding($(elm).html(), oldTarget.alias, newTarget.alias, newTarget.alias));
			});
		}
	});
	return newNicknameMapForId; // just see where this function is used to see why we return the argument (fetchUsedNicknames)
}

function replaceName(parentNode, target) {
	if(!target || $(parentNode).attr('namerized') === 'false' || target.alias == target.name ||
		($(parentNode).attr('namerized') === 'true' 
			&& ($(parentNode).html().indexOf(target.name) === -1 || target.alias.indexOf(target.name) !== -1)) ) {
		return false;
	}
	var whereToReplace = findElementsDirectlyContainingText(parentNode, target.name);
	if (whereToReplace.length == 0)
		return false;
	whereToReplace.forEach(function(node) {
		$(node).html(replaceOnStringExcluding($(node).html(), target.name, target.alias, target.alias));
	});
	if (!$(parentNode).attr('namerized')) {
		$(parentNode).attr('namerized', 'true');
		$(parentNode).attr('namerizer_userid', target.target);
		configureNodeAnimation(parentNode, whereToReplace, target.name, target.alias);
	}
	return true;
}

function switchNames(links) {
	if (!links)
		links = $('a');
	fastForEach(links, function(elm) {
		var href = $(elm).attr('href');
		if (!href) {
		  return;
		}

		if ($(elm).hasClass('titlebarText')) {
			var collapsedChatTab = $(elm).parents('.fbNub').find('.fbNubButton');
			if (collapsedChatTab.length) {
				replaceName(collapsedChatTab[0], targetFromURL(href));
			}
		}
		replaceName(elm, targetFromURL(href));
	});
}

MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

var observer = new MutationObserver(function(mutations) {
	fastForEach(mutations, function(mutation) {
		if (mutation.type == 'childList' && mutation.addedNodes) {
			fastForEach(mutation.addedNodes, function(node) {
				switchNames($(node).find('a'));
				if ($(node).prop('tagName') === 'A') {
					switchNames([node]);
				}
			});
			// this checks the node that has been modified, we will only try to switch names on it if its already namerized or we don't care :)
			// also, when the user hovers we change the text as well, but we change the namerized attribute to false so we won't try to swith it back either
			if ($(mutation.target).prop('tagName') === 'A') {
				switchNames([mutation.target]);
			}
		}
	});
});

observer.observe(document, {
  subtree: true,
  childList: true
});