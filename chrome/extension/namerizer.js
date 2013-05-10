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

function replaceName(parentNode, target) {
	if(!target || $(parentNode).attr('namerized') === 'false' ||
		($(parentNode).attr('namerized') === 'true' 
			&& ($(parentNode).html().indexOf(target.name) === -1 || target.alias.indexOf(target.name) !== -1)) ) {
		return false;
	}
	var whereToReplace = findElementsDirectlyContainingText(parentNode, target.name);
	if (whereToReplace.length == 0)
		return false;
	whereToReplace.forEach(function(node) {
		if ($(node).text().indexOf(target.name) !== -1) {
			$(node).text($(node).text().replace(target.name, target.alias));
		}
	});
	if (!$(parentNode).attr('namerized')) {
		$(parentNode).attr('namerized', 'true');
		configureNodeAnimation(parentNode, whereToReplace, target.name, target.alias);
	}
	return true;
}


function switchNames(links) {
	if (!links)
		links = $('a');
	fastForEach(links, function(elm) {
		var href = elm.href;
		if (!href) {
		  return;
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