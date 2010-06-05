function PurgeAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */

	this.beginDate = new Date();
	this.endDate = new Date();
}

PurgeAssistant.prototype.setup = function () {
	/* this function is for setup tasks that have to happen when the scene is first created */
	this.controller.get('PurgeWarningMessage').innerHTML = $L({
		"value": "Warning: Purge Data will delete from your device all data within the date range selected above. This process cannot be undone. Please be sure to use Export Data prior to purging any important data.",
		"key": "purgeWarning"
	});
	this.controller.get('beginPurgeDateLabel').innerHTML = $L("Starting Date");
	this.controller.get('endPurgeDateLabel').innerHTML = $L("Ending Date");
	this.controller.get('milesPurgeTitle').innerHTML = $L("Purge Data");
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	this.controller.setupWidget('beginPurgeDate', {
			label: " "
		}, this.beginPurgeDateModel = {
			date: this.beginDate
		}
	);
	this.controller.setupWidget('endPurgeDate', {
			label: " "
		}, this.endPurgeDateModel = {
			date: this.endDate
		}
	);
	
	this.controller.setupWidget('purgeButton',
		{}, 
		this.purgeButtonModel = {
			buttonLabel : $L('Purge Data'),        
			buttonClass : 'negative',        
			disabled : false        
		});
	
	/* add event handlers to listen to events from widgets */
	this.purgeButtonHandler = this.purgeButton.bindAsEventListener(this);
	this.controller.listen('purgeButton', Mojo.Event.tap, this.purgeButtonHandler);
};

PurgeAssistant.prototype.purgeButton = function (event) {
	var i;
	this.beginDate.setHours(0);
	this.beginDate.setMinutes(0);
	this.beginDate.setSeconds(0);
	this.beginDate.setMilliseconds(0);
	this.endDate.setHours(23);
	this.endDate.setMinutes(59);
	this.endDate.setSeconds(59);
	this.endDate.setMilliseconds(999);

	if (this.beginDate < this.endDate) {
		if (this.controller.get('PurgeDateError').getStyle('display') !== 'none') {
			this.controller.get('PurgeDateError').setStyle({visibility: 'hidden'});
		} else {
			this.controller.get('PurgeDateError').hide();
			this.controller.get('PurgeDateError').setStyle({display: 'none'});
			this.controller.get('PurgeDateError').setStyle({visibility: 'hidden'});
		}
		Mojo.Log.info("Purging Data from", this.beginDate, "to", this.endDate);
		
		// Delete data from MileageEvents table
		dao.purgeMileageEvents(this.beginDate.getTime(), this.endDate.getTime());

		// Delete data from Miles.mileageEvents object
		for (i in Miles.mileageEvents) {
			if (Miles.mileageEvents[i].date > this.beginDate && 
				Miles.mileageEvents[i].date < this.endDate) {
					Miles.mileageEvents[i] = null;
				}
		}
		Miles.mileageEvents = Miles.mileageEvents.compact();
		Mojo.Log.info("Events are %j", Miles.mileageEvents);
		this.controller.stageController.popScene();
		
	}
	else {
		this.controller.get('PurgeDateError').show();
		this.controller.get('PurgeDateError').setStyle({visibility: 'visible'});
		this.controller.get('PurgeDateErrorMessage').innerHTML = $L("Ending Date must be greater than Starting Date");
	}

};

PurgeAssistant.prototype.activate = function (event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */

	//Get earliest date from mileageEvents table to set as beginning date
	dao.getEarliestDate(this.gotDate.bind(this));
};

PurgeAssistant.prototype.gotDate = function (results) {
	this.beginDate = new Date(results);
	Mojo.Log.info(this.beginDate);
	this.beginPurgeDateModel.date = this.beginDate;
	this.controller.modelChanged(this.beginPurgeDateModel);
	
};

PurgeAssistant.prototype.deactivate = function (event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

PurgeAssistant.prototype.cleanup = function (event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */

	this.controller.stopListening('purgeButton', Mojo.Event.tap, this.purgeButtonHandler);
};
