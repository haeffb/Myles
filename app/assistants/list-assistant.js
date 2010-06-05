function ListAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
}

ListAssistant.prototype.setup = function () {
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	/* setup widgets here */
	
	this.controller.setupWidget('listing',
		{
			itemTemplate: 'list/rowTemplate',
			listTemplate: 'list/listTemplate',
			swipeToDelete: true,
			renderLimit: 50,
			dividerFunction: this.listDivider.bind(this),
			dividerTemplate: 'list/divider',
			//filterFunction: this.filterFunction.bind(this),
			reorderable: false
			//addItemLabel: $L('Add a New Trip')
		},
		this.listModel = {
			items: Miles.mileageEvents		
		}
	);
	
	// Setup scrim and spinner to indicate activity while doing stuff
	this.controller.setupWidget('Spinner', 
		this.spinnerAttributes = {
			spinnerSize: Mojo.Widget.spinnerLarge
		},
		this.spinnerModel = {
			spinning: false
		}
	);
	this.controller.get('Scrim').hide();
	
	// Setup command menu
	this.controller.setupWidget(Mojo.Menu.commandMenu, undefined,
	 	{
			items: [{
				label: $L('Add a New Trip'),
				//icon: 'add-icon-gray',
				command: 'do-listAdd'
			//width: '200'
			}, 
			{
				toggleCmd: 'sort-' + Miles.prefs.sort,
				items: [
					{label: $L("Veh"), command: 'sort-vehicle'},
					{label: $L("Cat"), command: 'sort-category'}
				] 
			}]
		}
	);

	// setup App menu
	this.controller.setupWidget(Mojo.Menu.appMenu, Miles.MenuAttr, Miles.MenuModel);

	/* add event handlers to listen to events from widgets */
	this.doListTapHandler = this.doListTap.bindAsEventListener(this);
	this.controller.listen('listing', Mojo.Event.listTap, this.doListTapHandler);
	
	this.doListAddHandler = this.doListAdd.bindAsEventListener(this);
	this.controller.listen('listing', Mojo.Event.listAdd, this.doListAddHandler);
	
	this.doListDeleteHandler = this.doListDelete.bindAsEventListener(this);
	this.controller.listen('listing', Mojo.Event.listDelete, this.doListDeleteHandler);
	
/*
	this.doIconTapHandler = this.doIconTap.bindAsEventListener(this);
	this.controller.listen('header-icon', Mojo.Event.tap, this.doIconTapHandler);

*/

	//this.getCategories();
	this.loadData();

};

ListAssistant.prototype.doIconTap = function (event) {
	this.controller.popupSubmenu({
		onChoose: this.subMenuChosen.bind(this),
		placeNear: event.target,
		items: [{label: $L('Apply'), command: 'apply-cmd'},
                       {label: $L('Applique'), command: 'applique-cmd'},
					   {label: $L('B-stuff'), items: [{label: $L('Back'), command: 'back-cmd'},
					   		{label: $L('Bovine'), command: 'bovine-cmd'}
					   ]},
                       {label: $L('Applaud'), command: 'applaud-cmd'},
                       {label: $L('Approximate'), command: 'approx-cmd'}]
	});
};

ListAssistant.prototype.subMenuChosen = function (event) {
	Mojo.Log.info("Command:", event);
};



ListAssistant.prototype.handleCommand = function (event) {
	switch (event.command) {
	case 'do-listAdd':
		this.doListAdd();
		break;
	case 'sort-vehicle':
		Mojo.Log.info("SORT BY VEHICLE");
		Miles.prefs.sort = 'vehicle';
		Miles.mileageEvents.sort(this.milesSort.bind(this));
		Miles.mileageEvents.reverse();
		this.controller.modelChanged(this.listModel);
		break;
	case 'sort-category':
		Mojo.Log.info("SORT BY CATEGORY");
		Miles.prefs.sort = 'category';
		Miles.mileageEvents.sort(this.milesSort.bind(this));
		Miles.mileageEvents.reverse();
		this.controller.modelChanged(this.listModel);
		break;
	}
};

ListAssistant.prototype.listDivider = function (itemModel) {
	//Mojo.Log.info("DIVIDER FUNCTION");
	switch (Miles.prefs.sort) {
	case 'vehicle':
		//Mojo.Log.info("Vehicle id:", itemModel.vehicle, Miles.vehiclesByIndex[itemModel.vehicle].label);
		return Miles.vehiclesByIndex[itemModel.vehicle].label + " - " +
			Miles.vehiclesByIndex[itemModel.vehicle].totalMiles;
	case 'category':
		return Miles.categoriesByIndex[parseInt(itemModel.category, 10)].label + " - " +
			Miles.categoriesByIndex[itemModel.category].totalMiles;
	}

};

ListAssistant.prototype.doListTap = function (event) {
	var id = event.originalEvent.target.id,
		className = event.originalEvent.target.className,
		drawers, curDrawer;
	Mojo.Log.info("Event Index", event.index);
	//Mojo.Log.info("Event target: %j", event.originalEvent.target.id);
	//Mojo.Log.logProperties(event.originalEvent.target, 'OrigEventTarget');
	if (id === 'icon' || className === 'mynote') {
		//Mojo.Log.info("Tapped on Icon");
		drawers = this.controller.document.getElementsByName('notesDrawer');
		curDrawer = drawers[event.index];
		curDrawer.mojo.toggleState();
	}
	else {
	// Push the data entry scene with the list index and the event ID
		this.controller.stageController.pushScene('entry', 
			event.index, Miles.mileageEvents[event.index].id);
	}
};

ListAssistant.prototype.doListAdd = function(event){

	// add a new mileage event
	var thisMiles = {}, nowDate = new Date(), index, myMiles;
	thisMiles.id = null;
	thisMiles.date = nowDate.getTime();
	//Mojo.Log.info ("Date in doListAdd", thisMiles.date);
	thisMiles.endDate = nowDate.getTime();
	thisMiles.dateformat = Mojo.Format.formatDate(nowDate, {
		date: 'medium'
	});
	thisMiles.begMiles = 0;
	thisMiles.endMiles = 0;
	if (Miles.prefs.autoFill) {
		//get index to last vehicle used
		index = Miles.prefs.lastVehicle;
		Mojo.Log.info("Autofill mileage entries for: %j", Miles.vehiclesByIndex[index], index);
		thisMiles.begMiles = Miles.vehiclesByIndex[index].lastmileage;
		myMiles = '' + Miles.vehiclesByIndex[index].lastmileage;
		Mojo.Log.info("MyMiles: ", myMiles);
		thisMiles.endMiles = (myMiles).substr(0, myMiles.length - 3) || 0;
		Mojo.Log.info(thisMiles.endMiles);
	}
	thisMiles.mileage = 0;
	thisMiles.purpose = '';
	thisMiles.destination = '';
	thisMiles.notes = '';
	// Using db key (value), NOT list index.
	thisMiles.category = Miles.prefs.lastCategory;
	thisMiles.vehicle = Miles.prefs.lastVehicle;
	
	Miles.mileageEvents.push(thisMiles);
	Mojo.Log.info("INSERTING NEW trip entry");
	//Add to database and get new id in return
	dao.createMileageEvent(thisMiles, this.returnFromEventAdd.bind(this));
};
	
ListAssistant.prototype.returnFromEventAdd = function (id) {
	// Push the data entry scene with list index and event ID of null
	// So the new entry is INSERTED into the Db.
	Miles.mileageEvents[Miles.mileageEvents.length - 1].id = id;
	this.controller.stageController.pushScene('entry', Miles.mileageEvents.length - 1, id);
};

ListAssistant.prototype.doListDelete = function (event) {
	//Mojo.Log.info("Index to delete:", event.index);
	dao.deleteMileageEvent(Miles.mileageEvents[event.index].id);
	Miles.mileageEvents.splice(event.index, 1);
	this.listModel.items = Miles.mileageEvents;
	//this.controller.modelChanged(this.listModel);
};

ListAssistant.prototype.activate = function (event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	  
	//this.getCategories();
	
	this.updateTotalMiles();
	// sort by category & date
	Miles.mileageEvents.sort(this.milesSort.bind(this));

	// reverse sort order
	Miles.mileageEvents.reverse();
	this.listModel.items = Miles.mileageEvents;
	this.controller.modelChanged(this.listModel);
	  
};

ListAssistant.prototype.loadData = function () {
	//Check if there is data in the save cookie that needs to be written to DB.
	Miles.saveCookie = new Mojo.Model.Cookie(Miles.appName + ".save");
	var args;
	args = Miles.saveCookie.get();
	if (args) {
		Mojo.Log.info("Args is %j", args);
		this.doneFlag = false;
		dao.updateVehicle(args.vehicle, this.returnFromDb.bind(this));
		dao.updateMileageEvent(args.miles, this.returnFromDb.bind(this));
	}
	else {
		this.getCategories();
	}
};

ListAssistant.prototype.returnFromDb = function () {
	Mojo.Log.info("Entering returnFromDb in Dash Db Save", this.doneFlag);
	if (this.doneFlag) {
		Mojo.Log.info("Finished db save");
		this.getCategories();
		Miles.saveCookie.remove();
	}
	this.doneFlag = true;
};

ListAssistant.prototype.updateTotalMiles = function () {
	// add timeDiff String, add mileage summaries
	var i, j;
	
	Miles.totalMiles = 0;
	for (i in Miles.vehiclesByIndex) {
		Miles.vehiclesByIndex[i].totalMiles = 0;
	}
	for (i in Miles.categoriesByIndex) {
		//Mojo.Log.info(i, Miles.categoriesByIndex[i].label);
		Miles.categoriesByIndex[i].totalMiles = 0;
	}
	for (i=0; i < Miles.mileageEvents.length; i++) {
		j = Miles.mileageEvents[i];
		// correct for poor typing in original database schema!
		j.category = parseInt(j.category, 10);
		j.vehicle = parseInt(j.vehicle, 10);
		Miles.mileageEvents[i].timeDiff = this.timeDiffString(j.date, j.endDate);
		Miles.vehiclesByIndex[j.vehicle].totalMiles += parseInt(j.mileage, 10);
		//Mojo.Log.info(j.category, Miles.categoriesbyIndex[j.category].label);
		Miles.categoriesByIndex[j.category].totalMiles += parseInt(j.mileage, 10);
		Miles.totalMiles += parseInt(j.mileage, 10);
	}
	this.controller.get('header-text').innerHTML = $L(Miles.totalMiles + " Myles");
};

ListAssistant.prototype.getCategories = function () {
	Mojo.Log.info("******* Get Categories Function *******");
	dao.retrieveCategories(this.checkCategories.bind(this));
};

ListAssistant.prototype.checkCategories = function (results) {
	//Mojo.Log.info("Category Results: %j", results);
	if (results.length > 0) {
		Mojo.Log.info("Categories are: %j", results);
		Miles.categories = results;	
		for (var i = 0; i < results.length; i++) {
			Miles.categories[i].value = parseInt(Miles.categories[i].value, 10);
			results[i].value = parseInt(results[i].value, 10);
			Miles.categoriesByIndex[results[i].value]=results[i];
		}
	}
	else {
		//first use - setup default categories
		Miles.categories = [{value: 1, label: $L("Unfiled")},
			{value: 2, label: $L("Business")},
			{value: 3, label: $L("Personal")}];
		dao.createCategory(Miles.categories[0], this.dummyResults.bind(this));
		dao.createCategory(Miles.categories[1], this.dummyResults.bind(this));
		dao.createCategory(Miles.categories[2], this.dummyResults.bind(this));
		Miles.categoriesByIndex[1] = Miles.categories[0];
		Miles.categoriesByIndex[2] = Miles.categories[1];
		Miles.categoriesByIndex[3] = Miles.categories[2];
	}
	// done with Categories, get vehicles
	dao.retrieveVehicles(this.checkVehicles.bind(this));

};

ListAssistant.prototype.checkVehicles = function (results) {
	if (results.length > 0) {
		Mojo.Log.info("Vehicles are: %j", results);
		Miles.vehicles = results;
		for (var i = 0; i < results.length; i++) {
			results[i].value = parseInt(results[i].value, 10);
			Miles.vehicles[i].value = parseInt(Miles.vehicles[i].value, 10);
			Miles.vehiclesByIndex[results[i].value]=results[i];
		}
	}
	else {
		//first use - setup default vehicle
		Miles.vehicles = [
			{value: 1, label: $L("Default Vehicle"), lastmileage: 0, rate: 0.0}
		];
		dao.createVehicle(Miles.vehicles[0], this.dummyResults.bind(this));
		Miles.vehiclesByIndex[1] = Miles.vehicles[0];
	}
	//done with Vehicles, get Mileage Events
	dao.retrieveMileageEvents(this.gotMileageEvents.bind(this));
};

ListAssistant.prototype.dummyResults = function ( ) {
	// do nothing
};


ListAssistant.prototype.gotMileageEvents= function (results) {
	var i;
	Mojo.Log.info("Entering gotMileageEvents function");
	Mojo.Log.info("Results: %j", results);
	Miles.mileageEvents = results;
	
	this.updateTotalMiles();	
	// sort by category & date
	Miles.mileageEvents.sort(this.milesSort.bind(this));

	// reverse sort order
	Miles.mileageEvents.reverse();
	this.listModel.items = Miles.mileageEvents;
	this.controller.modelChanged(this.listModel);
};

ListAssistant.prototype.deactivate = function (event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

ListAssistant.prototype.cleanup = function (event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	this.controller.stopListening('listing', Mojo.Event.listTap, this.doListTapHandler);
	this.controller.stopListening('listing',Mojo.Event.listAdd, this.doListAddHandler);
	this.controller.stopListening('listing', Mojo.Event.listDelete, this.doListDeleteHandler);
};

ListAssistant.prototype.milesSort = function (a, b) {
		//Mojo.Log.info("Sorting by ", prop);
		var aCat = a[Miles.prefs.sort]; //a.category;
		var bCat = b[Miles.prefs.sort]; //b.category;
		if (aCat > bCat) {
			return 1;
		}
		if (aCat < bCat) {
			return -1;
		}
		if (a.date > b.date) {
			return 1;
		}
		if (a.date < b.date) {
			return -1;
		}
		return 0;
};

ListAssistant.prototype.timeDiffString = function (d1, d2) {
			var diff = new Date(d2-d1);
			var timeDiff;
			timeDiff = diff.getUTCHours() + " hrs " + diff.getUTCMinutes() + " mins";
			timeDiff = (diff.getUTCDate()-1) ? diff.getUTCDate()-1 + " days " + timeDiff : timeDiff;
			if (diff < 0) {
				timeDiff = "Error: End time before Begin time";
			}
			return timeDiff;
};

