// ==UserScript==
// @name Namerizer Grasemonkey Script
// @namespace http://www.webmonkey.com
// @description Namerizer renames the names of your named friends.
// @include *
// @grant GM_xmlhttpRequest
// @grant GM_getValue
// @grant GM_setValue
// ==/UserScript==

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

// Cache (Stub)
//

GM_setValue( "namerizerCache", JSON.stringify("rOimS2Lag") );

alert( JSON.parse(GM_getValue("namerizerCache", "{}")) );

// Retrieve preferred nicknames from our APIs
//

GM_xmlhttpRequest({
  method: "GET",
  url: "http://www.xboxfusion.com/",
  onload: function(response) {
    alert(response.responseText);
  }
});