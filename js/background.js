// This page it to use the chrome api in the manifest page we gave permission for 'tabs' and 'storage'
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse)
	{
		// All of the current status of tab
		if (request.tab_status == 'current')
		{
			sendResponse({
				id: sender.tab.id,
				active: sender.tab.active,
				title: sender.tab.title,
				url: sender.tab.url
			});
		}
		// The action if connection was lost
		else if(request.connection == 'lost')
		{
			chrome.browserAction.setBadgeText({text: "OFF"});

			sendResponse({ connection: 'lost' });
		}
		// The action if connection was established
		else if(request.connection == 'connected')
		{
			chrome.browserAction.setBadgeText({text: "ON"});
			
			sendResponse({ connection: 'connected' });
		}
		// For the switch tab right
		else if(request.tab_status == 'switchtabRight'){
			chrome.tabs.query({
				currentWindow: true,
				active: true
			}, function(active) {
				if (active.length > 0) {
					var forward = true;
					var next = active[0].index + (forward ? 1 : -1);
					chrome.tabs.query({
						currentWindow: true
					}, function(all) {
						if (all.length == 1) return;
						if (next >= all.length) chrome.tabs.update(all[0].id, {
							active: true
						});
						else if (next < 0) chrome.tabs.update(all[all.length - 1].id, {
							active: true
						});
						else chrome.tabs.update(all[next].id, {
							active: true
						});
					});
				}
			});
			sendResponse({ connection: 'switchtabRight' });
		}
		// For the switch tab left
		else if(request.tab_status == 'switchtabLeft'){
			chrome.tabs.query({
				currentWindow: true,
				active: true
			}, function(active) {
				if (active.length > 0) {
					var forward = false;
					var next = active[0].index + (forward ? 1 : -1);
					chrome.tabs.query({
						currentWindow: true
					}, function(all) {
						if (all.length == 1) return;
						if (next >= all.length) chrome.tabs.update(all[0].id, {
							active: true
						});
						else if (next < 0) chrome.tabs.update(all[all.length - 1].id, {
							active: true
						});
						else chrome.tabs.update(all[next].id, {
							active: true
						});
					});
				}
			});
			sendResponse({ connection: 'switchtabLeft' });
		}
	}
);
