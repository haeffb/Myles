function DashalarmAssistant(dashInfo) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */

	if (dashInfo) {
		this.dashInfo = dashInfo;
	}
}

DashalarmAssistant.prototype.setup = function () {
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	
	/* add event handlers to listen to events from widgets */
	
	this.switchHandler = this.launchMain.bindAsEventListener(this);
	//this.controller.listen("dashalarminfo", Mojo.Event.tap, this.switchHandler);
	
	this.displayDashboard(this.dashInfo);
};

DashalarmAssistant.prototype.displayDashboard = function (dashInfo) {
	var renderedInfo, infoElement;
	renderedInfo = Mojo.View.render({object: dashInfo,
		template: "dashalarm/dashitem-info"});
	infoElement = this.controller.get("dashalarminfo");
	infoElement.innerHTML = renderedInfo;
	Mojo.Controller.getAppController().playSoundNotification("alerts", "");
	
	this.switchHandler = this.launchMain.bindAsEventListener(this);
	this.controller.listen("dashalarmmessage", Mojo.Event.tap, this.switchHandler);
	
	this.snoozeHandler = this.launchSnooze.bindAsEventListener(this);
	this.controller.listen("dashalarmicon", Mojo.Event.tap, this.snoozeHandler);
};

DashalarmAssistant.prototype.launchSnooze = function () {
	Mojo.Log.info("Tap on Snoozer!!!", this.dashInfo.timer);
	Miles.setTimer(this.dashInfo.id, this.dashInfo.timer);
	this.controller.window.close();
};

DashalarmAssistant.prototype.launchMain = function () {
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

DashalarmAssistant.prototype.activate = function (event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};


DashalarmAssistant.prototype.deactivate = function (event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

DashalarmAssistant.prototype.cleanup = function (event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	//this.controller.stopListening("dashalarminfo", Mojo.Event.tap, this.switchHandler);
	this.controller.stopListening("dashalarmmessage", Mojo.Event.tap, this.switchHandler);
	this.controller.stopListening("dashalarmicon", Mojo.Event.tap, this.snoozeHandler);
	  
	  
};
