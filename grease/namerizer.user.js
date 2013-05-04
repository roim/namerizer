// ==UserScript==
// @name Namerizer Grasemonkey Script
// @namespace http://www.webmonkey.com
// @description Namerizer renames the names of your named friends.
// @include *
// @grant GM_xmlhttpRequest
// @grant GM_getValue
// @grant GM_setValue
// ==/UserScript==

//
// Constants
//

var cacheKey = "namerizerCache";
var failCode = "fail";
var baseServiceAddress = "http://namerizer.herokuapp.com";

//
// Function definitions
//

// These should be provided by GM, but they're not supported in Chrome :(
// Soo, if these are not defined, we implement them in the HTLM5 way. 
//
if (!this.GM_getValue || (this.GM_getValue.toString && this.GM_getValue.toString().indexOf("not supported")>-1)) {
  this.GM_getValue=function (key,def) {
      return localStorage[key] || def;
  };
  this.GM_setValue=function (key,value) {
      return localStorage[key]=value;
  };
  this.GM_deleteValue=function (key) {
      return delete localStorage[key];
  };
}

var nicknameList;
function updateCache (jsonContent) {
	// Memory
	updateMemoryCache(jsonContent);
	// Persistent
	GM_setValue(cacheKey, jsonContent);
}

function updateMemoryCache (jsonContent) {
	nicknameList = JSON.parse(jsonContent);
}

// TODO, lag, set the user ID
var userId = 42;

//
// Initialization
//

// Set-up the cache
//

// First, we load the persistent cache
var persistentJson = GM_getValue(cacheKey, failCode);

if (persistentJson != failCode) {
	updateMemoryCache(persistentJson);
}

GM_xmlhttpRequest({
  method: "GET",
  // If the persistent request failed, there's nothing to do before the API returns
  synchronous: (persistentJson == failCode),
  url: baseServiceAddress + "/fetch/" + userId,
  onload: function(response) {
    // TODO, roim, maybe onload means status == 200?
    if (response.status != 200) return;

    updateCache(response.responseText);
  }
});
