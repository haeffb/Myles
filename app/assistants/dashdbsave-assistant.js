function DashdbsaveAssistant(miles, vehicle) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */

	Mojo.Log.info("Entering Dashboard Database Save");
	if (miles) {
		this.miles = miles;
	}
	if (vehicle) {
		this.vehicle = vehicle;
	}
}

DashdbsaveAssistant.prototype.setup = function () {
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	
	/* add event handlers to listen to events from widgets */
	
	this.doneFlag = false;
	Mojo.Log.info( " Updating Vehicle: %j", this.vehicle);
	dao.updateVehicle(this.vehicle, this.returnFromDb.bind(this));


	// Save info to database
	// update existing entry in database
	Mojo.Log.info("UPDATING entry with %j", this.miles);
	dao.updateMileageEvent(this.miles, this.returnFromDb.bind(this));

};

DashdbsaveAssistant.prototype.returnFromDb = function () {
	Mojo.Log.info("Entering returnFromDb in Dash Db Save", this.doneFlag);
	if (this.doneFlag) {
		Mojo.Log.info("Closing db save dash");
		var appController = Mojo.Controller.getAppController();
		appController.closeStage("dashdbsavestage");
	}
	this.doneFlag = true;
};

DashdbsaveAssistant.prototype.activate = function (event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};


DashdbsaveAssistant.prototype.deactivate = function (event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

DashdbsaveAssistant.prototype.cleanup = function (event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	  
	  
};
