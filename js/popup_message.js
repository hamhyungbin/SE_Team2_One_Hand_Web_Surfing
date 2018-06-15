// If user click the chrome extension icon, this pop up page will appear
// Then two link will be ready to be clicked
// 1. Go to option page
// 2. Go to gesture guidlines
window.onload = function(){
	var opts = chrome.extension.getURL('../pages/options_page.html');
	var link = document.getElementById('opts_link');
	link.setAttribute('href', opts);
};
