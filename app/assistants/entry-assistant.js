function EntryAssistant(index, id) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	this.index = index;
	this.id = id;
	this.miles = Miles.mileageEvents[index];
	//this.vehicleIndex = this.miles.vehicle;
	//this.categoryIndex = this.miles.category;
	if (!this.id) {
		this.checkReminder = true;
	}
	
	//Mojo.Log.info ("Mileage Entry %j", this.miles);
}

EntryAssistant.prototype.setup = function () {
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	this.controller.get('mileageGroupLabel').innerHTML = $L('Mileage Info');
	//this.controller.get('beginLabel').innerHTML = $L('Begin');
	//this.controller.get('endLabel').innerHTML = $L('End');
	this.controller.get('purposeGroupLabel').innerHTML = $L('Purpose & Destination');

	this.controller.get('purposeLabel').innerHTML = $L('Purpose');
	this.controller.get('destinationLabel').innerHTML = $L('Destination');
	this.controller.get('notesLabel').innerHTML = $L('Notes');
	//this.controller.get('vehicleLabel').innerHTML = $L('Vehicle');
	//this.controller.get('categoryLabel').innerHTML = $L('Category');
	
	
	//Mojo.Log.info("Date is:", this.miles.date);
	var aDate = new Date(this.miles.date), bDate = new Date(this.miles.endDate);
	
	this.controller.get('begDateID').innerHTML = Mojo.Format.formatDate(aDate, {date: 'medium'}) + "<br />" +
		Mojo.Format.formatDate(aDate, {time: 'medium'});
	this.controller.get('endDateID').innerHTML = Mojo.Format.formatDate(bDate, {date: 'medium'}) + "<br />" +
		Mojo.Format.formatDate(bDate, {time: 'medium'});

	this.controller.setupWidget('begMiles', 
		{
			hintText: $L('Beginning mileage'),
			modifierState: Mojo.Widget.numLock,
			autoFocus: true,
			charsAllow: this.onlyNum.bind(this),
			changeOnKeyPress: true
		}, 
		this.begMilesModel = {
			value: parseInt(this.miles.begMiles, 10)
		}
	);
	this.controller.setupWidget('endMiles', 
		{
			hintText: $L('Ending mileage'),
			modifierState: Mojo.Widget.numLock,
			autoFocus: false,
			charsAllow: this.onlyNum.bind(this),
			changeOnKeyPress: true
		}, 
		this.endMilesModel = {
			value: parseInt(this.miles.endMiles, 10)
		}
	);
	this.controller.setupWidget('purpose', 
		{
			hintText: $L('Enter trip purpose'),
			autoFocus: false,
			changeOnKeyPress: true
		}, 
		this.purposeModel = {
			value: this.miles.purpose
		}
	);
	this.controller.setupWidget('destination', 
		{
			hintText: $L('Enter destination'),
			autoFocus: false,
			changeOnKeyPress: true

		}, 
		this.destinationModel = {
			value: this.miles.destination		}
	);
	this.controller.setupWidget('notes',
		{
			autoFocus: false,
			multiline: true
		},
		this.notesModel = {
			value: this.miles.notes,
			changeOnKeyPress: true
		}
	);
	this.controller.setupWidget('category',
		{
			autoFocus: false,
			label: $L('Category')
		},
		this.categoryModel = {
			value: this.miles.category,
			choices: Miles.categories
		}
	);

	this.controller.setupWidget('vehicle', 
		{
			autoFocus: false,
			label: $L('Vehicle')
		},
		this.vehicleModel = {
			value: this.miles.vehicle, 
			choices: Miles.vehicles
		}
	);
	
	this.controller.setupWidget('reminderTimeSelector',
		{
			autoFocus: false,
			label: $L('Reminder')
		},
		this.reminderTimeModel = {
			value: Miles.prefs.reminderTime,
			choices: [
				{label: $L("None"), value: 0},
			//	{label: $L("30 sec"), value: 0.5},
				{label: $L("5 min"), value: 5},
				{label: $L("10 min"), value: 10},
				{label: $L("30 min"), value: 30},
				{label: $L("1 hour"), value: 60},
				{label: $L("5 hours"), value: 300},
				{label: $L("8 hours"), value: 480},
				{label: $L("10 hours"), value: 600}
			]
		}

	);
	this.controller.setupWidget('reminderTimeCheck', {}, 
		this.reminderTimeCheckModel = {
			value: this.checkReminder
		}
	);
	
	// setup App menu
	this.controller.setupWidget(Mojo.Menu.appMenu, Miles.MenuAttr, Miles.MenuModel);
	
	/* add event handlers to listen to events from widgets */
	this.doListTapHandler = this.doListTap.bindAsEventListener(this);
/*
	this.controller.listen('begDateID', Mojo.Event.tap, this.doListTapHandler);
	this.controller.listen('endDateID', Mojo.Event.tap, this.doListTapHandler);
	this.controller.listen('begicon', Mojo.Event.tap, this.doListTapHandler);
	this.controller.listen('endicon', Mojo.Event.tap, this.doListTapHandler);

*/
	this.controller.listen(this.controller.document, Mojo.Event.tap, this.doListTapHandler);
	
	this.doVehicleListSelectorHandler = this.doVehicleListSelector.bindAsEventListener(this);
	this.controller.listen('vehicle', Mojo.Event.propertyChange, this.doVehicleListSelectorHandler);
	this.doCategoryListSelectorHandler = this.doCategoryListSelector.bindAsEventListener(this);
	this.controller.listen('category', Mojo.Event.propertyChange, this.doCategoryListSelectorHandler);
	
	this.endMilesChangedHandler = this.endMilesChanged.bindAsEventListener(this);
	this.controller.listen('endMiles', Mojo.Event.propertyChange, this.endMilesChangedHandler);

};

EntryAssistant.prototype.endMilesChanged = function (event) {
	//check for new entry
	Mojo.Log.info("***PropertyChanged in End Miles");
	if (true) { //(!this.id) {
		Mojo.Log.info("changing reminder check value");
		if (this.reminderTimeCheckModel.value) {
			this.reminderTimeCheckModel.value = false;
		}
		this.controller.modelChanged(this.reminderTimeCheckModel);
		if (Miles.prefs.autoTime) {
			var nowDate = new Date();
			this.miles.endDate = nowDate.getTime();
			this.controller.get('endDateID').innerHTML =
				Mojo.Format.formatDate(nowDate, {date: 'medium'}) + "<br />" +
				Mojo.Format.formatDate(nowDate, {time: 'medium'});
		}
	}
};

EntryAssistant.prototype.doVehicleListSelector = function (event) {
	Mojo.Log.info("Vehicle change event, %j", event.value);
	//this.vehicleIndex = event.value;
	//Miles.mileageEvents[this.index].vehicle = this.vehicleIndex;
	if (Miles.prefs.autoFill) {
		var index, myMiles;
		index = event.value;
		this.miles.begMiles = Miles.vehiclesByIndex[index].lastmileage;
		myMiles = '' + Miles.vehiclesByIndex[index].lastmileage;
		this.miles.endMiles = (myMiles).substr(0, myMiles.length - 3) || 0;
		
		// NOTE added +'' to the new value to resolve issue with
		// hinttext showing behind the updated value.
		this.begMilesModel.value = parseInt(this.miles.begMiles, 10) + '';
		this.controller.modelChanged(this.begMilesModel, this);
		this.endMilesModel.value = parseInt(this.miles.endMiles, 10) + '';
		this.controller.modelChanged(this.endMilesModel, this);
		
	}
};

EntryAssistant.prototype.doCategoryListSelector = function (event) {
	Mojo.Log.info("Category change event, %j", event.value);
	//Miles.mileageEvents[event.index].category = event.value;
	if (event.value === 9999) {
		this.controller.stageController.pushScene('preferences');
	}
	else {
		this.categoryIndex = event.value;
	}	
	

};

EntryAssistant.prototype.doListTap = function (event) {
	Mojo.Log.info("List Tap", event.target.id);
	var aDate, bDate;
	switch (event.target.id) {
	case 'begDateID':
		this.editDate(this.miles.date, event.target.id);
		break;
	case 'endDateID':
		this.editDate(this.miles.endDate, event.target.id);
		break;
	case 'begicon':
		aDate = new Date();
		this.miles.date = aDate.getTime();
		this.controller.get('begDateID').innerHTML = Mojo.Format.formatDate(aDate, {date: 'medium'}) + "<br />" +
			Mojo.Format.formatDate(aDate, {time: 'medium'});
		break;
	case 'endicon':
		bDate = new Date();
		this.miles.endDate = bDate.getTime();
		this.controller.get('endDateID').innerHTML = Mojo.Format.formatDate(bDate, {date: 'medium'}) + "<br />" +
			Mojo.Format.formatDate(bDate, {time: 'medium'});
		break;
	}

};

EntryAssistant.prototype.editDate = function (date, target) {
	Mojo.Log.info("going to date dialog");
	var text;
	switch (target) {
	case 'begDateID':
		text = $L('Edit Begin Date & Time');
		break;
	case 'endDateID':
		text = $L('Edit End Date & Time');
		break;
	}
	this.controller.showDialog({
		template: 'entry/editdate',
		assistant: new EditDateAssistant(this, date, target, this.updateDate.bind(this)),
		text: text
	});
};

EntryAssistant.prototype.updateDate = function (date, target) {
	//Mojo.Log.info("Date", date, "Target", target);
	switch (target) {
	case 'begDateID':
		this.miles.date = date.getTime();
		break;
	case 'endDateID':
		this.miles.endDate = date.getTime();
		break;
	}
	this.controller.get(target).innerHTML = Mojo.Format.formatDate(date, {date: 'medium'}) + "<br />" +
		Mojo.Format.formatDate(date, {time: 'medium'});
	var scroller = this.controller.getSceneScroller();
	//call the widget method for scrolling to the top
	scroller.mojo.revealTop(0);
};

EntryAssistant.prototype.onlyNum = function (charCode) {
	if (charCode > 47 && charCode < 58) {
		return true;
	}
	return false;
};

EntryAssistant.prototype.activate = function (event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};

EntryAssistant.prototype.saveToDb = function (miles, vehicle) {

	// Save data to a cookie in the event the user closes app
	Miles.saveCookie = new Mojo.Model.Cookie(Miles.appName + ".save");
	var args = {};
	args.vehicle = vehicle;
	args.miles = miles;
	Miles.saveCookie.put(args);	
	Mojo.Log.info("Args was %j", args);


	// Save info to database
	// update existing entry in database
	Mojo.Log.info( " Updating Vehicle: %j", vehicle);
	this.doneFlag = false;
	dao.updateVehicle(vehicle, this.returnFromDb.bind(this));

	Mojo.Log.info("UPDATING entry with %j", this.miles);
	dao.updateMileageEvent(this.miles, this.returnFromDb.bind(this));
};

EntryAssistant.prototype.returnFromDb = function () {
	Mojo.Log.info("Entering returnFromDb in EntryAssistant", this.doneFlag);
	if (this.doneFlag) {
		Mojo.Log.info("Finished db save");
		Miles.saveCookie.remove();
	}
	this.doneFlag = true;
};


EntryAssistant.prototype.deactivate = function (event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */

	// Grab data from widgets
	this.miles.dateformat = Mojo.Format.formatDate(new Date(this.miles.date), {date: 'medium'});
	this.miles.begMiles = this.begMilesModel.value;
	this.miles.endMiles = this.endMilesModel.value;
	this.miles.mileage = parseInt(this.endMilesModel.value - this.begMilesModel.value, 10);
	if (!this.miles.mileage || this.miles.mileage < 0) {
		this.miles.mileage = 0;
	}
	this.miles.purpose = this.purposeModel.value;
	this.miles.destination = this.destinationModel.value;
	this.miles.notes = this.notesModel.value;

	this.miles.category = this.categoryModel.value;
	this.miles.vehicle = this.vehicleModel.value;

	vehicle = {};
	vehicle.value = this.miles.vehicle;
	vehicle.label = Miles.vehiclesByIndex[vehicle.value].label;
	vehicle.rate = Miles.vehiclesByIndex[vehicle.value].rate;
	
	vehicle.lastmileage = Math.max(this.miles.begMiles, Miles.vehiclesByIndex[vehicle.value].lastmileage);
	vehicle.lastmileage = Math.max(this.miles.endMiles, Miles.vehiclesByIndex[vehicle.value].lastmileage);
	//Mojo.Log.info("Final:", vehicle.lastmileage);

	Miles.prefs.lastVehicle = this.miles.vehicle;
	Miles.prefs.lastCategory = this.miles.category;
	args = Miles.prefs;
	Miles.prefsCookie.put(args);
	Miles.mileageEvents[this.index] = this.miles;
	Miles.vehiclesByIndex[this.miles.vehicle] = vehicle;
	
	this.saveToDb(this.miles, vehicle);
	if (this.reminderTimeCheckModel.value) {
		Miles.setTimer(this.id, this.reminderTimeModel.value);
	}
};

EntryAssistant.prototype.setTimer = function (id, timer) {
	var dashInfo, d, mo, yr,
		hrs, mins, secs,
		myDateString, dStr,
		bannerParams,
		date;
	if (this.reminderTimeCheckModel.value) {
		this.miles.reminderTime = this.reminderTimeModel.value;
		if (this.miles.reminderTime === 0) {
			return;
		}
		
		Mojo.Log.info("SET TIMER for RECORD", id, this.reminderTimeCheckModel.value, this.reminderTimeModel.value);
		dashInfo = {
			title: "Myles Alert!", 
			message: "Enter ending mileage!", 
			count: 1,
			id: id,
			timer: timer
		};
		
		d = new Date();
		d.setTime(d.getTime() + this.miles.reminderTime * 60 * 1000);
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
		Mojo.Log.info("Date String", myDateString);
		
		dStr = Mojo.Format.formatDate(d, 'medium');
		Mojo.Log.info("Time is", dStr);
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
				Mojo.Log.info("Success in Set Reminder Alarm!!! in " + this.miles.reminderTime + " mins");
				var timeString = (this.miles.reminderTime > 60) ? this.miles.reminderTime / 60 + " hrs" : this.miles.reminderTime + " mins"; 
				if (this.miles.reminderTime === 60) {
					timeString = "1 hr";
				}
				bannerParams = {messageText: Miles.appName + " Reminder set for " + timeString};
				Mojo.Controller.getAppController().showBanner(bannerParams, {});
			}.bind(this)
		});
	}	

};

EntryAssistant.prototype.cleanup = function (event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */

	this.controller.stopListening(this.controller.document, Mojo.Event.tap, this.doListTapHandler);
	
	this.controller.stopListening('vehicle', Mojo.Event.propertyChange, this.doVehicleListSelectorHandler);
	this.controller.stopListening('category', Mojo.Event.propertyChange, this.doCategoryListSelectorHandler);
	
	this.controller.stopListening('endMiles', Mojo.Event.propertyChange, this.endMilesChangedHandler);

};

EntryAssistant.prototype.escapeQuotes = function (string) {
	return string.replace(/'|"/g, "\'");
	
};
