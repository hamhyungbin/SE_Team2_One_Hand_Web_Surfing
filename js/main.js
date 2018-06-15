// This javascript code are responsible to get the user gesture data.
// Then, translate the geture meaning (represent as strings).
// Based on gesture meaning (strings), invoke the events on chrome such as:
// Click, Scroll Page, Navigate History, Open or Close Tab, Switching Tabs, and Zoom Page.

// Whether Current Tab Has Focus
var tab_has_focus = false;

// Leap Motion Settings
var last_frame;
var scene;
var action = null;
var last_action = null;
var start_action = 0;
var intent = false;
var delay_between_actions = 0.5;
var timeout = null;

// Track Leap Motion Connection
var now, last_poll = new Date().getTime() / 1000;

// Settings for Gesture Events
var width = document.documentElement.clientWidth;
var height = document.documentElement.clientHeight;
var scroll_speed = 20;
var scroll_smoothing = 4;
var isRunning = false;

// Size for Finger Rendering in Pixels
var finger_size = 20;

// Colors for Fingers
var rainbow = new Array('#F80C12', '#FF3311', '#FF6644', '#FEAE2D', '#D0C310', '#69D025', '#12BDB9', '#4444DD', '#3B0CBD', '#442299');
var leap = '#9AC847';
var dark = '#000000';
var light = '#FFFFFF';
var blue = '#0000FF';

// Setup Default Settings for Leap Motion
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

// Update Settings from Browser Extension
update_settings();

// Start the leap motion connection
controller.connect();

// Called when a tab is updated (like changed away from, or refreshed, or loaded)
chrome.storage.onChanged.addListener(update_settings);

// Once Settings are Updates, Initialize Extension
function init()
{
	if(leap_motion_settings.fingers === 'yes')
	{
		add_fingers();
	}

	setInterval(check_focus, 1000);
}

// Check if Current Tab has Focus, and only run this extension on the active tab
function check_focus()
{
	try {
		chrome.runtime.sendMessage({ tab_status: 'current' }, function(response) {
			if(response.active && window.location.href == response.url && document.hasFocus())
			{
				tab_has_focus = true;
			}
			else
			{
				tab_has_focus = false;
			}
		});
	}
	catch(error) {
		// If you clicked to reload this extension, you will get this error, which a refresh fixes
		if(error.message.indexOf('Error connecting to extension') !== -1)
		{
			document.location.reload(true);
		}
		// Else if other error occur
		else
		{
			console.error(error.message);
		}
	}
}

// Function to get extended finger on array - [0,1,1,0,0], where 1 is for extended finger
function getExtendedFingers(frame){
	var extendedFingers = new Array();
	
	if(frame.valid){
		if(frame.fingers.length > 0)
		{
			for(var j=0; j < 5; j++)
			{
				var finger = frame.fingers[j];
				// Put 1 to array if an extended finger present
				if(finger.extended) extendedFingers[j] = 1;
				else{ extendedFingers[j] = 0; }
			}
		}
	}
	return extendedFingers;
}

// Get the total count of extended fingers
function getExtendedFingersCount(extendedFingers){
	var extendedFingersCount = 0;
	for(var j=0; j < extendedFingers.length; j++)
	{
		var finger = extendedFingers[j];
		if(finger === 1) extendedFingersCount++;
	}
	return extendedFingersCount;
}

// Add DOM Elements to Page to Render Fingers
function add_fingers()
{
	// Only allow one hand, thus loop until 5 only
	for(var i=0; i<5; i++)
	{
		$('body').append('<div class="finger" id="finger'+ (i+1) +'"><\/div>');

		// Only add the finger according to user preferences
		switch(leap_motion_settings.color)
		{
			case 'rainbow':
				$('#finger'+ (i+1) +'').css({
					'background-color': rainbow[i],
					'-webkit-box-shadow': 'inset 0px 0px 1px 1px rgba(0, 0, 0, 0.25)',
					'box-shadow': 'inset 0px 0px 1px 1px rgba(0, 0, 0, 0.25)'
				});
				break;

			case 'leap':
				$('#finger'+ (i+1) +'').css({
					'background-color': leap,
					'-webkit-box-shadow': 'inset 0 0 5px #000',
					'box-shadow': 'inner 0 0 5px #000'
				});
				break;

			case 'dark':
				$('#finger'+ (i+1) +'').css({
					'background-color': dark,
					'-webkit-box-shadow': 'inset 0px 0px 1px 1px rgba(255, 255, 255, 0.5)',
					'box-shadow': 'inset 0px 0px 1px 1px rgba(255, 255, 255, 0.5)'
				});
				break;

			case 'light':
				$('#finger'+ (i+1) +'').css({
					'background-color': light,
					'-webkit-box-shadow': 'inset 0px 0px 1px 1px rgba(0, 0, 0, 0.25)',
					'box-shadow': 'inset 0px 0px 1px 1px rgba(0, 0, 0, 0.25)'
				});
				break;
		}
	}

	$('.finger').css({
		'width': finger_size + 'px',
		'height': finger_size + 'px',
		'opacity': '0',
		'position': 'absolute',
		'-webkit-border-radius': Math.ceil(finger_size/2) + 'px',
		'border-radius': Math.ceil(finger_size/2) + 'px',
		'z-index': '10000',
		'-webkit-transition': 'opacity 0.15s ease',
		'transition': 'opacity 0.15s ease',
		'-webkit-box-sizing': 'border-box',
		'box-sizing': 'border-box',
		'transform': 'translate3d(0,0,0)'
	});
}

// Track Finger Movement and Update in Real Time
function update_fingers(frame)
{
	$('.finger').css({ 'opacity': '0' });

	if(!tab_has_focus)
	{
		return;
	}

	// Make sure frame is valid and to normalize the finger
	// So that the finger object will mapped accordingly to the chrome window
	if(frame.valid){
		var iBox = frame.interactionBox; // Get the virtual space
		if(frame.fingers.length > 0)
		{
			var extended = getExtendedFingers(frame);
			// Only allow one hand, thus loop until 5 only
			for(var j=0; j < 5; j++)
			{
				// Also only update the extended fingers
				if(extended[j] === 1){
					var pointable = frame.pointables[j]; // Get the fingers
					var leapPoint = pointable.stabilizedTipPosition; // Stabalize the tip position
					var normalizedPoint = iBox.normalizePoint(leapPoint, true); // Normalize them [0 to 1]
					var left = normalizedPoint[0] * width; // Get the x axis
    					var top = (1 - normalizedPoint[1]) * height; // Get the y axis

					// Perfom css, and translate the finger according to the axis, exclude z-axis because of 2d implementation
					$('#finger' + (j+1)).css({
						'top': 0,
						'left': 0,
						'position': 'fixed',
						'transform': 'translate3d('+left.toFixed(2)+'px, '+top.toFixed(2)+'px, 0)',
						'opacity': '0.75'
					});
				}
			}
		}
	}
}

// Move Index Finger towards Front for Click Event
function click(frame){
	if (!tab_has_focus ||  leap_motion_settings.click === 'disabled')
	{
		return;
	}

	if(frame.valid)
	{
		// Get the finger, take the stabalized tip position, and normalize it
		var iBox = frame.interactionBox; // Get the virtual space

		var pointable = frame.pointables[1]; // Get index finger
		var leapPoint = pointable.stabilizedTipPosition; // Stabalize it
		var normalizedPoint = iBox.normalizePoint(leapPoint, true); // Normalize it
		var left = normalizedPoint[0] * width; // Calculate the x-axis times the scale of chrome window width
		var top = (1 - normalizedPoint[1]) * height; // Calculate the y-axis times the scale of chrome window height
		
		// Debugging purpose
		//console.log('xbar:' + scrollBarX);
		//console.log('ybar:' + scrollBarY);
		//console.log('x:' + left.toFixed(2));
		//console.log('y:' + top.toFixed(2));

		// Get the element position of the HTML page according to user finger point
		var elem = document.elementFromPoint(left, top);
		// If element is present, and finger is on the 'touching zone' (refer leap motion docs), then proceed
		if(elem !== null && pointable.touchZone === 'touching')
		{
			// When it passed a certain distance, then proceed to click the element
			if(pointable.touchDistance < -0.35){
				// Change the index finger color to blue
				$('#finger' + 2).css({
					'background-color': blue,
					'opacity': '0.75'
				});
				var done = elem.click();
				//console.log('item is clicked');
			}
		}
		else{
			$('#finger' + 2).css({
				'background-color': rainbow[1],
				'opacity': '0.75'
			});
		}
	}
}

// Move Index, Middle, Ring, and Pinky Finger Upwards and Downwards for Scroll Event
function scroll_page(pointables)
{
	if (!tab_has_focus || pointables === undefined || pointables.length === 0 || last_frame === undefined || last_frame.pointables.length === 0 || leap_motion_settings.scrolling === 'disabled')
	{
		return;
	}

	// Just check the index finger translation, do not need to check all
	var finger = pointables[0]; // Get index finger
	var last_finger = last_frame.pointables[0]; // Get index finger from last frame
	
	// Stabalize them
	var fingerStabilizedPosition = finger.stabilizedTipPosition;
	var last_fingerStabilizedPosition = last_finger.stabilizedTipPosition;
	
	// Calculate horizontal translation
	var horizontal_translation = 0;
	var horizontal_delta = fingerStabilizedPosition[0] - last_fingerStabilizedPosition[0];
	
	// Calculate vertical translation
	var vertical_translation = 0;
	var vertical_delta = fingerStabilizedPosition[1] - last_fingerStabilizedPosition[1];
	
	// Based on translation the speed of scroll will be affected
	if (horizontal_delta > 10)
	{
		horizontal_translation = scroll_speed;
	}
	else if (horizontal_delta < 10)
	{
		horizontal_translation = -scroll_speed;
	}

	if (vertical_delta > scroll_smoothing)
	{
		vertical_translation = scroll_speed;
	}
	else if (vertical_delta < -scroll_smoothing)
	{
		vertical_translation = -scroll_speed;
	}
	// Call scroll function from the web api based on our translation
	window.scrollBy(horizontal_translation, vertical_translation);
}

// Swipe Both Index and Middle Finger toward Leftwards to Go Back, and Rightwards to Go Forward
function navigate_history(pointables)
{
	if (!tab_has_focus || pointables === undefined || pointables.length === 0 || last_frame === undefined || last_frame.pointables.length === 0)
	{
		return;
	}

	// Just check the index finger translation, do not need to check all
	var indexFinger = pointables[0]; // Get the index finger 
	var last_indexFinger = last_frame.pointables[0]; // Get index finger

	// Get the tip position
	var indexFingertipPosition = indexFinger.tipPosition;  // Get index finger
	var last_indexFingertipPosition = last_indexFinger.tipPosition; // Get index finger from last frame

	// Calculate the horizontal translation
	var indexFinger_horizontal_translation = indexFingertipPosition[0] - last_indexFingertipPosition[0];

	// Innvoke, Go foward if the translation more than 42
	if (indexFinger_horizontal_translation > 42 && leap_motion_settings.history === 'enabled')
	{
		history.go(-1);
		console.log('Next Page');
		return;
	}
	// Innvoke, Go backward if the translation less than -42
	else if (indexFinger_horizontal_translation < -42 && leap_motion_settings.history === 'enabled')
	{
		history.go(1);
		return;
	}
}

// Swipe Index, Middle, and Ring Finger Upwards to Open Tab or Downwards to Close Tab
// Swipe Index, Middle, and Ring Finger Leftwards for Left Tab or Rightwards for Right Tab
function open_or_close_or_switching_tab(pointables)
{
	if (!tab_has_focus || pointables === undefined || pointables.length === 0 || last_frame === undefined || last_frame.pointables.length === 0)
	{
		return;
	}

	// Get index finger data
	var indexFinger = pointables[0];
	var last_indexFinger = last_frame.pointables[0];

	// Get the tip position
	var indexFingertipPosition = indexFinger.tipPosition;
	var last_indexFingertipPosition = last_indexFinger.tipPosition;

	// Calculate the horizontal translation
	var indexFinger_horizontal_translation = indexFingertipPosition[0] - last_indexFingertipPosition[0];
	// Calculate the vertical translation
	var indexFinger_vertical_translation = indexFingertipPosition[1] - last_indexFingertipPosition[1];

	// Debugging purpose
	//console.log(indexFinger_horizontal_translation);
	//console.log(indexFinger_vertical_translation);

	// If vertical than invoke either open or close tab
	// close tab
	if (indexFinger_vertical_translation > 30 && leap_motion_settings.open_or_close_tab === 'enabled')
	{
		window.close();
		return;
	}
	// open new tab
	else if (indexFinger_vertical_translation < -40 && leap_motion_settings.open_or_close_tab === 'enabled')
	{
		window.open("http://www.google.com");
		return;
	}
	// If horizontal than invoke either switch left or right tab
	// switch to left tab
	if (indexFinger_horizontal_translation > 42 && leap_motion_settings.switch_tab === 'enabled')
	{
		chrome.runtime.sendMessage({ tab_status: 'switchtabLeft' }, function(response) {
		});
		return;
	}
	// switch to right tab
	else if (indexFinger_horizontal_translation < -42 && leap_motion_settings.switch_tab === 'enabled')
	{
		chrome.runtime.sendMessage({ tab_status: 'switchtabRight' }, function(response) {
		});
		return;
	}
}

// Open Hand and Pinch/Zoom with All Fingers
function zoom_page(hands)
{
	if (!tab_has_focus || hands === undefined || hands.length === 0 || leap_motion_settings.zoom === 'disabled')
	{
		return;
	}

	// Get hand data, left or right according to user preference
	var hand = hands[0];
	// Calculate the hand scale value with that to the previous frame
	var scale = hand.scaleFactor(last_frame); // Function is from the leap motion library

	// Zoom and scale the page according to the  hand scale value
	if(leap_motion_settings.zoom === 'enabled')
	{
		$('html').css({
			'transform': 'scale(' + scale + ') translateZ(0)',
			'-webkit-transform': 'scale(' + scale + ') translateZ(0)',
			'transformation-origin': 'center center'
		});
	}
}

// Fetch Settings from Local Storage
function update_settings()
{
	// Fetch Leap Motion Settings for User Prefered Hand
	chrome.storage.local.get('leap_motion_user_prefer_hand', function(fetchedData) {
		if(typeof fetchedData.leap_motion_user_prefer_hand !== 'undefined')
		{
			leap_motion_settings.user_prefer_hand = fetchedData.leap_motion_user_prefer_hand;
		}
	});

	// Fetch Leap Motion Settings for Fingers
	chrome.storage.local.get('leap_motion_fingers', function(fetchedData) {
		if(typeof fetchedData.leap_motion_fingers !== 'undefined')
		{
			leap_motion_settings.fingers = fetchedData.leap_motion_fingers;
		}
	});
	
	// Fetch Leap Motion Settings for Color
	chrome.storage.local.get('leap_motion_color', function(fetchedData) {
		if(typeof fetchedData.leap_motion_color !== 'undefined')
		{
			leap_motion_settings.color = fetchedData.leap_motion_color;
		}
	});

	// Fetch Leap Motion Settings for Click
	chrome.storage.local.get('leap_motion_click', function(fetchedData) {
		if(typeof fetchedData.leap_motion_click !== 'undefined')
		{
			leap_motion_settings.click = fetchedData.leap_motion_click;
		}
	});

	// Fetch Leap Motion Settings for Scrolling
	chrome.storage.local.get('leap_motion_scrolling', function(fetchedData) {
		if(typeof fetchedData.leap_motion_scrolling !== 'undefined')
		{
			leap_motion_settings.scrolling = fetchedData.leap_motion_scrolling;
		}
	});

	// Fetch Leap Motion Settings for History
	chrome.storage.local.get('leap_motion_history', function(fetchedData) {
		if(typeof fetchedData.leap_motion_history !== 'undefined')
		{
			leap_motion_settings.history = fetchedData.leap_motion_history;
		}
	});

	// Fetch Leap Motion Settings for Open or Closing Tab
	chrome.storage.local.get('leap_motion_open_or_close_tab', function(fetchedData) {
		if(typeof fetchedData.leap_motion_open_or_close_tab !== 'undefined')
		{
			leap_motion_settings.open_or_close_tab = fetchedData.leap_motion_open_or_close_tab;
		}
	});

	// Fetch Leap Motion Settings for Switch Tab
	chrome.storage.local.get('leap_motion_switch_tab', function(fetchedData) {
		if(typeof fetchedData.leap_motion_switch_tab !== 'undefined')
		{
			leap_motion_settings.switch_tab = fetchedData.leap_motion_switch_tab;
		}
	});

	// Fetch Leap Motion Settings for Zoom
	chrome.storage.local.get('leap_motion_zoom', function(fetchedData) {
		if(typeof fetchedData.leap_motion_zoom !== 'undefined')
		{
			leap_motion_settings.zoom = fetchedData.leap_motion_zoom;
		}

		// Run initialization after last setting pulled from local storage
		init();
	});
}

// Connect to Leap Motion via Web Socket and Manage Actions
var controller = new Leap.Controller({enableGestures: true});

controller.on('connect', function() {
	// Put 'ON' label to extension icon
	chrome.runtime.sendMessage({ connection: 'connected' }, function(response) {
		console.log("leapmotion:sucessful connection");
	});
	$('.leap_motion_connection').fadeOut();
});

controller.on('deviceConnected', function() {
	// Put 'ON' label to extension icon
	chrome.runtime.sendMessage({ connection: 'connected' }, function(response) {
		console.error('Leap device has been connected.');
	});
	$('.leap_motion_connection').fadeOut();
});

controller.on('deviceDisconnected', function() {
	// Put 'OFF' label to extension icon
	chrome.runtime.sendMessage({ connection: 'lost' }, function(response) {
		console.error('Leap device has been disconnected. Restart leap motion and refresh page.');

		$('body').append('<div class="leap_motion_connection" style="display: none;"><\/div>');
		$('.leap_mostion_connection').html('<b>ATTENTION:<\/b> Connection to Leap Motion Lost. Restart Leap Motion and Refresh Page.').css({
			'position': 'fixed',
			'top': '0',
			'left': '0',
			'width': '100%',
			'color': '#222',
			'text-align': 'center',
			'height': '30px',
			'z-index': '1000',
			'line-height': '30px',
			'background-color': '#9AC847'
		}).fadeIn('slow');

		$('.leap_motion_connection').click(function(){ $(this).fadeOut('slow'); });
	});
});

// Core part to recognize gesture and based on gesture invoke events
controller.on('frame', function(frame){	
	// last time of frame being run
	last_poll = new Date().getTime() / 1000;
	
	// Check the user hand [left or right]
	if(frame.hands.length > 0){
		// Store on a variable about the hand type
		var type = frame.hands[0].type;
		
		// Debugging purpose 
		/*
		if(type == "left"){
			console.log("Left hand.");
		} else {
			console.log("Right hand.")
		}
		*/
	}

	// Update Finger Position, if user allowed it
	if(leap_motion_settings.fingers === 'yes')
	{
		// If type of hand is the same as user prefere hand type than update the finger css
		if(type === leap_motion_settings.user_prefer_hand){
			update_fingers(frame); //update the pointable cursor
		}
		else
		{
			$('.finger').css({ 'opacity': '0' });
			return;
			
		}
	}
	else
	{
		$('.finger').css({ 'opacity': '0' });
	}

	// Try to detect User Intent to reduce firing events not intended ( less jumpy page is good )
	var now = new Date().getTime() / 1000;

	if(start_action === 0)
	{
		start_action = new Date().getTime() / 1000;
	}

	var offset = now - start_action;

	// If nothing is happening, reset interaction
	if (frame.pointables === undefined)
	{
		action = null;
		clearTimeout(timeout);
		return;
	}

	// Array of indicates extended fingers
	var extendedFingerAt = getExtendedFingers(frame);
	
	// Total count of extended fingers
	var extendedFingercount = getExtendedFingersCount(extendedFingerAt);
	
	// Debugging purpose
	//console.log(extendedFingerAt);
	//console.log(extendedFingercount);
	
	// Look for Click Gesture [0,1,0,0,0]
	if (extendedFingerAt[0] === 0  && extendedFingerAt[1] === 1 && extendedFingerAt[2] === 0 && extendedFingerAt[3] === 0 && extendedFingerAt[4] === 0)
	{
		action = 'click';
	}
	// Look for Page History Navigation Gesture [0,1,1,0,0]
	else if (extendedFingerAt[0] === 0  && extendedFingerAt[1] === 1 && extendedFingerAt[2] === 1 && extendedFingerAt[3] === 0 && extendedFingerAt[4] === 0)
	{
		action = 'navigate_history';
	}
	// Look for Page Scroll Gesture [0,1,1,1,1]
	else if (extendedFingerAt[0] === 0 && extendedFingerAt[1] === 1 && extendedFingerAt[2] === 1 && extendedFingerAt[3] === 1 && extendedFingerAt[4] === 1)
	{
		action = 'scroll';
	}

	// Look for Open, Close, or Switching Tab Gesture [0,1,1,1,0]
	else if(extendedFingerAt[0] === 0 && extendedFingerAt[1] === 1 && extendedFingerAt[2] === 1 && extendedFingerAt[3] === 1 && extendedFingerAt[4] === 0)
	{
		action = 'open_or_close_or_switching_tab';
	}
	// Look for Page Zoom Gesture [1,1,1,1,1]
	else if (extendedFingercount === 5)
	{
		action = 'zoom';
	}
	// Nothing is happening, reset actions
	else
	{
		action = null;
		clearTimeout(timeout);
	}

	// If the action is the same then allow the respective event to be executed
	if(action === last_action && offset >= delay_between_actions)
	{
		intent = true;
	}
	// Else prevent it
	else if(action !== last_action && offset >= delay_between_actions)
	{
		intent = false;
		start_action = 0;
		clearTimeout(timeout);
		$('#finger' + 2).css({
			'background-color': rainbow[1],
			'opacity': '0.75'
		});
	}

	if(intent)
	{
		switch(action)
		{
			case 'click':
				timeout = setTimeout(function(){ click(frame); }, 200);
				break;

			case 'scroll':
				timeout = setTimeout(function(){ scroll_page(frame.pointables); }, 250);
				break;

			case 'navigate_history':
				timeout = setTimeout(function(){ navigate_history(frame.pointables); }, 15);	
				break;
			
			case 'open_or_close_or_switching_tab':
				timeout = setTimeout(function(){ open_or_close_or_switching_tab(frame.pointables); }, 15);
				break;					
			
			case 'zoom':
				timeout = setTimeout(function(){ zoom_page(frame.hands); }, 300);
				break;
		}
	}

	// Reset all things if frame is not avalid
	if (frame !== undefined && frame.pointables !== undefined && frame.pointables.length > 0)
	{
		last_frame = frame;
		last_action = action;
	}
});
