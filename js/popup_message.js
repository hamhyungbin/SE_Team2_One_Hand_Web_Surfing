window.onload = function(){
	var opts = chrome.extension.getURL('../pages/options_page.html');
	var link = document.getElementById('opts_link');
	link.setAttribute('href', opts);
};
