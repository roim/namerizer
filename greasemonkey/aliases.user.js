// ==UserScript==

// @name namerizer_aliases

// @namespace http://www.muroha.lag/

// @match *://www.facebook.com/*

// ==/UserScript==

var aliasMap = {'rodrigo.roim' : 'Roim', 'valeria.soares.353' : 'Mãe'}; 

function switchNames() {
	var links = document.getElementsByTagName('a');
	for (var i in links) {
		var href = links[i].href;
		if (!href) {
		  continue;
		}
		if (href.indexOf('?') != -1) {
			username = href.substring(href.indexOf('www.facebook.com/') + 17, href.indexOf('?'));
		} else {
			username = href.substring(href.indexOf('www.facebook.com/') + 17);
		}
		if (username in aliasMap && links[i].textContent && 
				(!links[i].childNodes || links[i].childNodes.length == 1)) {
			links[i].textContent = aliasMap[username];
		}
	}
	setTimeout(switchNames, 100);
}

switchNames();
