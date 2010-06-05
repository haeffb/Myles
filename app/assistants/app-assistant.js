/* 	AppAssistant - Myles
 * 	Copyright 2009, 2010 Brian A Haeffner. All rights reserved.
 * 	Responsible for app launch, setup Global namespace
 */

// **********************************************
// GLOBALS
// **********************************************

// Miles namespace
Miles = {};

// Constants

// Global Data Structures
Miles.Db = '';
Miles.mileageEvents = [];
Miles.appID = Mojo.appInfo.id; //'com.tigers.app.myles';
Miles.appName = Mojo.appInfo.title; //'Myles';
Miles.appSlogan = 'Your trip assistant!';
Mojo.Log.info("App Info %j", Mojo.appInfo);

// 		Preferences
Miles.prefs = {
	autoFill: false,
	lastVehicle: 1,
	lastCategory: 1,
	reminderTime: 30,
	defaultEmail: "",
	autoTime: false,
	sort: 'category',
	autoExport: false,
	exportType: 0, // 0-Google, 1-email
	exportFrequency: 1, // 0-Daily, 1-Weekly, 2-Bi-Weekly, 3-Monthly
	exportTimerId: "",
	googleAuthKey: "",
	googleUser: "",
	googlePassword: ""
};
Miles.vehicles = [];
Miles.vehiclesByIndex = [];
Miles.categories = [];
Miles.categoriesByIndex = [];
Miles.alarmId = '';
Miles.timer = 0;

// Setup App Menu for all scenes
Miles.MenuAttr = {omitDefaultItems: true};
Miles.MenuModel = {
	visible: true,
	items: [
		Mojo.Menu.editItem,
		{label: $L('Export Data...'), disabled: false,
			items: [
				{label: $L('Export to Google'), command: 'doGoogle', disabled: false},
				{label: $L('Export by Email...'), command: 'doExport', disabled: false}
			]
		},	
		{label: $L('Purge Data...'), command: 'doPurge', disabled: false},
		{label: $L('Preferences...'), command: 'doPrefs', disabled: false},
		Mojo.Menu.helpItem
	]
};

// **********************************************
// Global function to set a timer alarm
// **********************************************
Miles.setTimer = function (id, timer) {

	// Save timer value to use in Snooze function

	var d, date, mo, yr, hrs, mins, secs,
		myDateString, dStr,
		dashInfo,
		timeString, bannerParams;
	if (timer === 0) {
		return;
	}
	
	Mojo.Log.info("SET TIMER for RECORD", id, timer);
	dashInfo = {
		title: "Myles Alert!", 
		message: "Enter ending mileage!", 
		count: 1,
		id: id,
		timer: timer
	};
	
	d = new Date();
	d.setTime(d.getTime() + timer * 60 * 1000);
	
	myDateString = Miles.timerDateString (d);
	
	Mojo.Log.info("Date String", myDateString);
	
	dStr = Mojo.Format.formatDate(d, 'medium');
	//Mojo.Log.info("Time is", dStr);
	Miles.AlarmId = new Mojo.Service.Request("palm://com.palm.power/timeout", {
		method: 'set',
		parameters: {
			key: 'reminderTimer',
			//'in': 	'00:05:00',
			at: myDateString,
			wakeup: true,
			uri: 'palm://com.palm.applicationManager/open',
			params: {
				'id': Miles.appID,
				'params': {
					action: 'dashAlarm',
					dashInfo: dashInfo
				}
			}
		},
		onSuccess: function () {
			Mojo.Log.info("Success in Set Reminder Alarm!!! in " + timer + " mins");
			timeString = (timer > 60) ? timer / 60 + " hrs" : timer + " mins"; 
			if (timer === 60) {
				timeString = "1 hr";
			}
			bannerParams = {messageText: Miles.appName + " Reminder set for " + timeString};
			Mojo.Controller.getAppController().showBanner(bannerParams, {});
		}.bind(this)
	});
};

Miles.timerDateString = function (d) {
	Mojo.Log.info("In timerDateString my Date is ", d);
	var myDateString, mo, date, yr, hrs, mins, secs;
	mo = d.getUTCMonth() + 1;
	if (mo < 10) {
		mo = '0' + mo;
	}
	date = d.getUTCDate();
	if (date < 10) {
		date = '0' + date;
	}
	yr = d.getUTCFullYear();
	//get hours according to GMT
	hrs = d.getUTCHours();
	if (hrs < 10) {
		hrs = '0' + hrs;
	}
	mins = d.getUTCMinutes();
	if (mins < 10) {
		mins = '0' + mins;
	}
	secs = d.getUTCSeconds();
	if (secs < 10) {
		secs = '0' + secs;
	}
	myDateString = mo + "/" + date + "/" + yr + " " + hrs + ":" + mins + ":" + secs;
	return myDateString;
};

//Create an instance of the DAO object
//dao = new DAO();

// **********************************************
//	App Assistant function
// **********************************************

function AppAssistant(appController) {
	//save global reference to App Assistant
	Miles.appAssistant = this;
	this.appController = appController;
}

AppAssistant.prototype.setup = function () {

	Mojo.Log.info ("******* Calling db init ********");
	dao.init();
	this.getCookie();

};

// -------------------------------------------------------------------
//
// handleLaunch
//	- 
// 
// -------------------------------------------------------------------

AppAssistant.prototype.handleLaunch = function (launchParams) {
	Mojo.Log.info(" ********** App Launch ***********");
	
	var cardStageController, pushMainScene, stageArgs,
		dashboardStage, pushDashboard;
	cardStageController = this.controller.getStageController('milesStage');
	Mojo.Log.info("controller is: " + cardStageController);
	if (!launchParams) {
		//FIRST LAUNCH or TAP on Icon when minimized
		// Update icon and set wakeup alarm to update at midnight
		if (cardStageController) {
			// Application already running
			Mojo.Log.info("Relaunch!");
			cardStageController.activate();
		}
		else {
			Mojo.Log.info("Launch new list stage!");
			pushMainScene = function (stageController) {
				stageController.pushScene('list');
			};
			stageArgs = {
				name: 'milesStage',
				lightweight: true
			};
			this.controller.createStageWithCallback(stageArgs, pushMainScene.bind(this), 'card');
		}
	}
	else {
		Mojo.Log.info(" Launch Parameters: %j", launchParams);
		switch (launchParams.action) {
		case 'dashAlarm':
			//var appController = Mojo.Controller.getAppController();
			//this.dashboardcount = this.dashboardcount+1;
			//var count = this.dashboardcount;
			dashboardStage = this.controller.getStageController("dashalarm");
			if (dashboardStage) {
				Mojo.Log.info("DELEGATING TO SCENE ASST");
				dashboardStage.delegateToSceneAssistant("displayDashboard", launchParams.dashInfo);
			} else {
				Mojo.Log.info("No dashboardStage found.");
				//this.dashboardcount=1;
				//count = this.dashboardcount;
				pushDashboard = function (stageController) {
					stageController.pushScene('dashalarm', launchParams.dashInfo);
				};
				this.controller.createStageWithCallback({name: "dashalarm", lightweight: true},
					pushDashboard, 'dashboard');
			}	
			break;
		case 'export':
			dashboardStage = this.controller.getStageController("dashexport");
			if (dashboardStage) {
				Mojo.Log.info("DELEGATING TO DASH EXPORT ASST");
				dashboardStage.delegateToSceneAssistant("getCategories");
			}
			else {
				Mojo.Log.info("No export dashboardStage found.");
				//this.dashboardcount=1;
				//count = this.dashboardcount;
				pushDashboard = function (stageController) {
					stageController.pushScene('dashexport');
				};
				this.controller.createStageWithCallback({name: "dashexport", lightweight: true},
					pushDashboard, 'dashboard');
			}
			this.setupAutoExport(); // setup timer for next export
			break;
		default:
			break;
		}
	}
};

AppAssistant.prototype.handleCommand = function (event) {
	if (event.type === Mojo.Event.commandEnable) {
		switch (event.command) {
		case Mojo.Menu.helpCmd:
			event.stopPropagation();
			break;
		}
	}
	if (event.type === Mojo.Event.command) {
		switch (event.command) {
		case 'doGoogle':
			//this.exportByGoogle(Miles.mileageEvents);
			this.googleAuth();
			break;
		case 'doExport':
			this.exportByEmail(Miles.mileageEvents);
			break;
		case 'doPrefs':
			this.controller.getActiveStageController().pushScene('preferences');
			break;
		case 'doPurge':
			this.controller.getActiveStageController().pushScene('purge');
			break;
		case Mojo.Menu.helpCmd:
			this.controller.getActiveStageController().pushScene('support');
			break;
		}
	}
};

AppAssistant.prototype.buildCSVString = function (object, type) {
	//Mojo.Log.info("Doing Export!");
	var thisObject = object,
		text = '',
		tmptext = '',
		txtReturn = '<br />',
		name,
		row,
		i, temp,
		myRate, myTotal, myController;
		
	switch (type) {
	case 'google':
		txtReturn = '\n';
		break;
	case 'email':
		break;
	}
	Mojo.Log.info("Type:", type, txtReturn);

	//Convert object to CSV string
	row = thisObject[0];
	for (name in row) {
		switch (name) {
		case 'id':
		case 'open':
		case 'dateformat':
			break;
		case 'purpose':
			text += '"Purpose",';
			break;
		case 'destination':
			text += '"Destination",';
			break;
		case 'category':
			text += '"Category",';
			break;
		case 'vehicle':
			text += '"Vehicle",';
			tmptext = 'Vehicle';
			break;
		case 'date':
			text += '"Begin Date",';
			tmptext = "Begin Date";
			break;
		case 'endDate': 
			text += '"End Date",';
			tmptext = "End Date";
			break;
		case 'begMiles':
			text += '"Begin Miles",';
			tmptext = "Begin Miles";
			break;
		case 'endMiles':
			text += '"End Miles",';
			tmptext = "End Miles";
			break;
		case 'mileage':
			text += '"Mileage",';
			tmptext = "Mileage";
			break;
		case 'notes':
			text += '"Notes",';
			tmptext = "Notes";
			break;
		case 'timeDiff':
			text += '"Total Time",';
			tmptext = "Total Time";
			break;
		default:
			
		}
	}
	text += '"Rate","Total"';
	text += txtReturn;
	for (i = 0; i < thisObject.length; i++) {
		row = thisObject[i];
		//Mojo.Log.info("Row" + i + " is: %j", row);
		for (name in row) {
			switch (name) {
			case 'category':
				// get the category label from index
				temp = parseInt(row[name], 10);
				tmptext = Miles.categoriesByIndex[temp].label;
				text += '"' + Miles.categoriesByIndex[temp].label + '",';
				break;
			case 'vehicle':
				// get the vehicle label from index
				temp = parseInt(row[name], 10);
				text += '"' + Miles.vehiclesByIndex[temp].label + '",';
				break;
			case 'date':
			case 'endDate':
			    // format date fields
				text += '"' + Mojo.Format.formatDate(new Date(row[name]), 'long') + '",';
				break;
			case 'id':
			case 'dateformat':
			case 'open':
				break;
			default:
				tmptext = row[name];
				if (typeof(tmptext) === 'string') {
					tmptext = tmptext.replace(/\"/g, "\"\"");
				}
				text += '"' + tmptext + '",';
				break;			
			}
		}	
		myRate = Miles.vehiclesByIndex[row.vehicle].rate;
		myTotal = '$' + Mojo.Format.formatNumber(myRate * row.mileage, 2);
		text += '"' + myRate  + '","' + myTotal + '"';
		text += txtReturn;
	}
	Mojo.Log.info("Text is", text);
	return text;
};

AppAssistant.prototype.exportByGoogle = function (results) {
	Mojo.Log.info("Export By Google");
	if (results.type == "success") {
		var text = this.buildCSVString(Miles.mileageEvents, 'google');
		Google.createSpreadsheet(text);
	}
	else {
		//var window = Mojo.Controller.getAppController().getActiveStageController().activeScene().window;
		//Mojo.Controller.errorDialog("Unable to login to Google. Please check your login credentials.", window);
		Mojo.Controller.getAppController().getActiveStageController().activeScene().showAlertDialog({
		     onChoose: function(value){
			 	switch (value) {
				case "ok":
					this.controller.getActiveStageController().pushScene('account-login', 'export', text);
					break;
				case "cancel":
					break;
				}	
			 }.bind(this),
		     title: $L("Error!"),
		     message: $L("You are not authorized for Google Export! Please check your login credentals and then try the Export again."),
		     choices:[
		          {label:$L('Ok'), value:"ok", type: 'affirmative'},
				  {label: $L('Cancel'), value: "cancel", type: 'negative'}
		     ]
		});
	}
};

AppAssistant.prototype.googleAuth = function () {
	Mojo.Log.info("Google googleAuth");
	Google.getAuthString(Miles.prefs.googleUser, Miles.prefs.googlePassword, "export", this.exportByGoogle.bind(this));
};


AppAssistant.prototype.exportByEmail = function (object) {
	var text = this.buildCSVString(object, 'email');
	//Mojo.Log.info("Text is", text);
	
	myController = this.controller.getActiveStageController().activeScene();
	myController.serviceRequest(
		'palm://com.palm.applicationManager', {
			method: 'open',
			parameters: {
				id: 'com.palm.app.email',
				params: {
					summary: Miles.appName + ' Export',
					recipients: [ {
						value: Miles.prefs.defaultEmail
						//contactDisplay:'myname'
					}],
					text: text
				}
			}
		}
	);
};


// **********************************************
// Export functions
// **********************************************

AppAssistant.prototype.setupAutoExport = function () {
	Mojo.Log.info("Entered App Assistant setupAutoExport function");
	
	// determine date for next alarm
	var diff, myDate;
	myDate = new Date();
	myDate.setDate(myDate.getDate() + 1); // set date to next day
	myDate.setHours(1, 0, 0, 0); // set to 1 am local time
	// use for testing:
	//myDate.setMinutes(myDate.getMinutes() + 2);
	Mojo.Log.info ("MyDate is", myDate);
	
	Mojo.Log.info("Frequency", Miles.prefs.exportFrequency);
	
	switch ("" + Miles.prefs.exportFrequency) {
	case "0": // daily
		break;
	case "1": // weekly
		//set to next Sunday
		diff = 7 - myDate.getDay(); // days from Sunday
		if (diff < 7) {
			myDate.setDate(myDate.getDate() + diff);
		}
		break;
	case "2": // bi-weekly
		diff = 7 - myDate.getDay(); // days from Sunday
		if (diff < 7) {
			myDate.setDate(myDate.getDate() + diff + 7);
		}
		break;
	case "3": // monthly
		myDate.setMonth(myDate.getMonth() + 1);
		myDate.setDate(1);
		break;
	}
	
	Mojo.Log.info("Now my Date is", myDate);
	
	myDateString = Miles.timerDateString(myDate);
	Mojo.Log.info("Date String for Export is", myDateString);
	
		Miles.prefs.exportTimerId = new Mojo.Service.Request("palm://com.palm.power/timeout", {
			method: 'set',
			parameters: {
				key: 'Export',
				//'in': '00:05:00',
				at: myDateString,
				wakeup: true,
				uri: 'palm://com.palm.applicationManager/open',
				params: {
					'id': Miles.appID,
					'params': {
						action: 'export'
					}
				}
			},
			onSuccess: function () {
				Mojo.Log.info("Success in setup export!!!");
				bannerParams = {messageText: "Export set for " + myDateString + "GMT"};
				Mojo.Controller.getAppController().showBanner(bannerParams, {});
				
			}.bind(this)
		});
		Miles.prefsCookie.put(Miles.prefs);
};

// **********************************************
// Cookie functions
// **********************************************
AppAssistant.prototype.getCookie = function () {
	Mojo.Log.info("Get Cookie!");
	Miles.prefsCookie = new Mojo.Model.Cookie(Miles.appName);
	var args = Miles.prefsCookie.get();
	if (args) {
		//Miles.prefs = args;
		for (value in args) {
			Miles.prefs[value] = args[value];
			//Mojo.Log.info("Pref: ", value, args[value], Miles.prefs[value]);
		}
	}
	Mojo.Log.info("Preferences: %j", Miles.prefs);
};

AppAssistant.prototype.putCookie = function () {
	Mojo.Log.info("Put Cookie!");
	var args = Miles.prefs;
	Miles.prefsCookie.put(args);
};
