function DashexportAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */

	Mojo.Log.info("Entered dash export function");	
}

DashexportAssistant.prototype.setup = function () {
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	
	/* add event handlers to listen to events from widgets */
	
	this.switchHandler = this.launchMain.bindAsEventListener(this);
	this.controller.listen("dashexportinfo", Mojo.Event.tap, this.switchHandler);
	//Get categories from database - start of chain of retreive from db.
	this.getCategories();
};

DashexportAssistant.prototype.displayDashboard = function (dashInfo) {
	Mojo.Log.info("Displaying export dashboard with: %j", dashInfo);
	var renderedInfo, infoElement;
	renderedInfo = Mojo.View.render({object: dashInfo,
		template: "dashexport/dashitem-info"});
	infoElement = this.controller.get("dashexportinfo");
	infoElement.innerHTML = renderedInfo;
	//Mojo.Controller.getAppController().playSoundNotification("alerts", "");
	
};


DashexportAssistant.prototype.launchMain = function () {
	Mojo.Log.info("Tap on DashAlarm!!!");
	this.controller.serviceRequest('palm://com.palm.applicationManager', 
		{
			method: 'open',
			parameters: {
				id: Miles.appID,
				params: null
			}
		}
	);
	this.controller.window.close();
};

DashexportAssistant.prototype.activate = function (event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};

DashexportAssistant.prototype.getCategories = function () {
	dao.retrieveCategories(this.checkCategories.bind(this));
};

DashexportAssistant.prototype.checkCategories = function (results) {
	Mojo.Log.info("Got categories", results.length);
	this.categories = [];
	for (var i = 0; i < results.length; i++) {
		var val = parseInt(results[i].value, 10);
		Mojo.Log.info("val-", val);
		this.categories[val] = results[i];
		this.categories[val].value = val;
		Mojo.Log.info("Category %j", this.categories[val]);
	}
	// done with Categories, get vehicles
	dao.retrieveVehicles(this.checkVehicles.bind(this));
};

DashexportAssistant.prototype.checkVehicles = function (results) {
	Mojo.Log.info("Got vehicles", results.length);
	this.vehicles = [];
	for (var i = 0; i < results.length; i++) {
		var val = parseInt(results[i].value, 10);
		Mojo.Log.info("val-", val);
		this.vehicles[val] = results[i];
		this.vehicles[val].value = val;
		Mojo.Log.info("Vehicle %j", this.vehicles[val]);
	}
	// done with vehicles, get events
	dao.retrieveMileageEvents(this.gotMileageEvents.bind(this));
};

DashexportAssistant.prototype.gotMileageEvents = function (results) {
	Mojo.Log.info("Got mileageEvents");
	this.mileageEvents = results;
	//update totals & such
	this.updateTotalMiles();	
};

DashexportAssistant.prototype.updateTotalMiles = function () {
	Mojo.Log.info("Enterinng updateTotalMiles in DashExport.");
	var i, j;
	
	this.totalMiles = 0;
	for (i in this.vehicles) {
		this.vehicles[i].totalMiles = 0;
	}
	for (i in this.categoriesByIndex) {
		this.categories[i].totalMiles = 0;
	}
	for (i=0; i < this.mileageEvents.length; i++) {
		Mojo.Log.info("Event: ", i);
		j = this.mileageEvents[i];
		// correct for poor typing in original database schema!
		j.category = parseInt(j.category, 10);
		j.vehicle = parseInt(j.vehicle, 10);
		this.mileageEvents[i].timeDiff = this.timeDiffString(j.date, j.endDate);
		this.vehicles[j.vehicle].totalMiles += parseInt(j.mileage, 10);
		this.categories[j.category].totalMiles += parseInt(j.mileage, 10);
		this.totalMiles += parseInt(j.mileage, 10);
	}
	Mojo.Log.info("Export Type", Miles.prefs.exportType);
	if (Miles.prefs.exportType == "1") {
		this.exportByEmail();
	}
	else {
		Mojo.Log.info("Google googleAuth");
		Google.getAuthString(Miles.prefs.googleUser, Miles.prefs.googlePassword, "export", this.exportByGoogle.bind(this));
	}
};

DashexportAssistant.prototype.exportByEmail = function () {
	var text = Google.buildCSVString(this.mileageEvents, this.vehicles, this.categories, 'email');
	Mojo.Log.info("Email Text is", text);
	
	this.controller.serviceRequest(
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
	this.exportDone();
};

DashexportAssistant.prototype.exportByGoogle = function (results) {
	Mojo.Log.info("Export By Google");
	if (results.type == "success") {
		var text = Google.buildCSVString(this.mileageEvents, this.vehicles, this.categories, 'google');
		Mojo.Log.info("Google text is: ", text);
		Google.createSpreadsheet(text);
		this.exportDone();
	}
	else {
		//var window = Mojo.Controller.getAppController().getActiveStageController().activeScene().window;
		//Mojo.Controller.errorDialog("Unable to login to Google. Please check your login credentials.", window);
		this.exportFailure();
	}
};

DashexportAssistant.prototype.exportDone = function () {
	Mojo.Log.info("Dash Export Success!");
	this.dashInfo = {
		title: "Myles Alert",
		message: "Exported to Google",
		count: this.mileageEvents.length
	};
	if (Miles.prefs.exportType == "1") {
		this.dashInfo.message = "Exported by Email";
	}
	this.displayDashboard(this.dashInfo);

};

DashexportAssistant.prototype.exportFailure = function () {
	Mojo.Log.info("Dash Export Failure!");
	this.dashInfo = {
		title: "Myles Export Failed!",
		message: "Check Google login info!",
		count: 0
	};
	this.displayDashboard(this.dashInfo);

};

DashexportAssistant.prototype.deactivate = function (event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

DashexportAssistant.prototype.cleanup = function (event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	this.controller.stopListening("dashexportinfo", Mojo.Event.tap, this.switchHandler);
};

DashexportAssistant.prototype.timeDiffString = function (d1, d2) {
	var diff = new Date(d2-d1), 
		timeDiff;
	timeDiff = diff.getUTCHours() + " hrs " + diff.getUTCMinutes() + " mins";
	timeDiff = (diff.getUTCDate()-1) ? diff.getUTCDate()-1 + " days " + timeDiff : timeDiff;
	if (diff < 0) {
		timeDiff = "Error: End time before Begin time";
	}
	return timeDiff;
};
