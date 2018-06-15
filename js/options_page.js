// Saves options to localStorage.
function save_options()
{
	chrome.storage.local.set({
		'leap_motion_user_prefer_hand': jQuery('#user_prefer_hand').val(),
		'leap_motion_fingers': jQuery('#fingers').val(),
		'leap_motion_color': jQuery('#color').val(),
		'leap_motion_click': jQuery('#click').val(),
		'leap_motion_scrolling': jQuery('#scrolling').val(),
		'leap_motion_history': jQuery('#history').val(),
		'leap_motion_open_or_close_tab': jQuery('#open_or_close_tab').val(),
		'leap_motion_switch_tab': jQuery('#switch_tab').val(),
		'leap_motion_zoom': jQuery('#zoom').val()
	});

	// Update status to let user know options were saved.
	$('#status').html('Options Saved').fadeIn();

	setTimeout(function(){ $('#status').fadeOut(); }, 3000);
}

// Reset options to default in localStorage.
function reset_options()
{
	chrome.storage.local.set({
		'leap_motion_user_prefer_hand': 'right',
		'leap_motion_fingers': 'yes',
		'leap_motion_color': 'rainbow',
		'leap_motion_click': 'enabled',
		'leap_motion_scrolling': 'enabled',
		'leap_motion_history': 'enabled',
		'leap_motion_open_or_close_tab': 'enabled',
		'leap_motion_switch_tab': 'enabled',		
		'leap_motion_zoom': 'disabled'
	});

	jQuery('#user_prefer_hand').val('right');
	jQuery('#fingers').val('yes');
	jQuery('#color').val('rainbow');
	jQuery('#click').val('enabled');
	jQuery('#scrolling').val('enabled');
	jQuery('#history').val('enabled');
	jQuery('#open_or_close_tab').val('enabled');
	jQuery('#switch_tab').val('enabled');
	jQuery('#zoom').val('disabled');

	// Update status to let user know options were saved.
	$('#status').html('Options Reset').fadeIn();

	setTimeout(function(){ $('#status').fadeOut(); }, 3000);
}

// Restores select box state to saved value from localStorage.
function restore_options()
{
	// Setup Defaults and check for chosen settings
	var leap_motion_settings = {
		'user_prefer_hand': 'right',
		'fingers': 'yes',
		'color': 'rainbow',
		'click': 'enabled',
		'scrolling': 'enabled',
		'history': 'enabled',
		'open_or_close_tab': 'enabled',
		'switch_tab': 'enabled',
		'zoom': 'disabled'
	};

	// Fetch Leap Motion Settings for User Prefered Hand
	chrome.storage.local.get('leap_motion_user_prefer_hand', function(fetchedData) {
		if(typeof fetchedData.leap_motion_user_prefer_hand !== 'undefined')
		{
			leap_motion_settings.user_prefer_hand = fetchedData.leap_motion_user_prefer_hand;
		}

		jQuery('#user_prefer_hand').val(leap_motion_settings.user_prefer_hand);
	});
	
	// Fetch Leap Motion Settings for Fingers
	chrome.storage.local.get('leap_motion_fingers', function(fetchedData) {
		if(typeof fetchedData.leap_motion_fingers !== 'undefined')
		{
			leap_motion_settings.fingers = fetchedData.leap_motion_fingers;
		}

		jQuery('#fingers').val(leap_motion_settings.fingers);
	});

	// Fetch Leap Motion Settings for Color
	chrome.storage.local.get('leap_motion_color', function(fetchedData) {
		if(typeof fetchedData.leap_motion_color !== 'undefined')
		{
			leap_motion_settings.color = fetchedData.leap_motion_color;
		}

		jQuery('#color').val(leap_motion_settings.color);
	});

	// Fetch Leap Motion Settings for Clicking
	chrome.storage.local.get('leap_motion_click', function(fetchedData) {
		if(typeof fetchedData.leap_motion_click !== 'undefined')
		{
			leap_motion_settings.click = fetchedData.leap_motion_click;
		}

		jQuery('#click').val(leap_motion_settings.click);
	});

	// Fetch Leap Motion Settings for Scrolling
	chrome.storage.local.get('leap_motion_scrolling', function(fetchedData) {
		if(typeof fetchedData.leap_motion_scrolling !== 'undefined')
		{
			leap_motion_settings.scrolling = fetchedData.leap_motion_scrolling;
		}

		jQuery('#scrolling').val(leap_motion_settings.scrolling);
	});

	// Fetch Leap Motion Settings for Navigating History
	chrome.storage.local.get('leap_motion_history', function(fetchedData) {
		if(typeof fetchedData.leap_motion_history !== 'undefined')
		{
			leap_motion_settings.history = fetchedData.leap_motion_history;
		}

		jQuery('#history').val(leap_motion_settings.history);
	});

	// Fetch Leap Motion Settings for Open or Closing Tab
	chrome.storage.local.get('leap_motion_open_or_close_tab', function(fetchedData) {
		if(typeof fetchedData.leap_motion_open_or_close_tab !== 'undefined')
		{
			leap_motion_settings.open_or_close_tab = fetchedData.leap_motion_open_or_close_tab;
		}

		jQuery('#open_or_close_tab').val(leap_motion_settings.open_or_close_tab);
	});

	// Fetch Leap Motion Settings for Switching Tab
	chrome.storage.local.get('leap_motion_switch_tab', function(fetchedData) {
		if(typeof fetchedData.leap_motion_switch_tab !== 'undefined')
		{
			leap_motion_settings.switch_tab = fetchedData.leap_motion_switch_tab;
		}

		jQuery('#switch_tab').val(leap_motion_settings.switch_tab);
	});

	// Fetch Leap Motion Settings for Zooming
	chrome.storage.local.get('leap_motion_zoom', function(fetchedData) {
		if(typeof fetchedData.leap_motion_zoom !== 'undefined')
		{
			leap_motion_settings.zoom = fetchedData.leap_motion_zoom;
		}

		jQuery('#zoom').val(leap_motion_settings.zoom);
	});
}

// Load the previous settings, below function are asynchronous meaning will instantly loaded
// when user clicked the options page
document.addEventListener('DOMContentLoaded', restore_options);
// Link the save_options function with the save button
document.querySelector('#save').addEventListener('click', save_options);
// Link the reset_options function with the reset button
document.querySelector('#reset').addEventListener('click', reset_options);
