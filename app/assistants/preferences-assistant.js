function PreferencesAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
}

PreferencesAssistant.prototype.setup = function () {
	/* this function is for setup tasks that have to happen when the scene is first created */
	
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	this.controller.get('milesPrefsTitle').innerHTML = $L('Myles Preferences');
	this.controller.get('optionsLabel').innerHTML = $L('Data Entry Options');
	this.controller.get('exportInfoLabel').innerHTML = $L('Export Data Options');
	this.controller.get('autoExportLabel').innerHTML = $L('Auto Export');
	this.controller.get('autoFillLabel').innerHTML = $L('AutoFill mileage');
	this.controller.get('autoTimeLabel').innerHTML = $L('AutoFill ending time');
	this.controller.get('categoryListLabel').innerHTML = $L('Categories');
	this.controller.get('vehiclesListLabel').innerHTML = $L('Vehicles');
	
/*
	if (Miles.prefs.exportType === 1) {
		this.controller.get('googleRow').hide();
		this.controller.get('emailRow').show();
	}
	else{
		this.controller.get('emailRow').hide();
		this.controller.get('googleRow').show();
	}

*/	
	//this.myVar = true;
	this.toggleAttribs = {
		trueLabel: $L('Yes'),
		falseLabel: $L('No')
	};
	this.controller.setupWidget('autoFillToggle', this.toggleAttribs, this.autoFillModel = {
		value: Miles.prefs.autoFill
	});
	this.controller.setupWidget('autoTimeToggle', this.toggleAttribs, this.autoTimeModel = {
		value: Miles.prefs.autoTime
	});
	
	this.controller.setupWidget('autoExportToggle', this.toggleAttribs, this.autoExportModel = {
		value: Miles.prefs.autoExport,
		disabled: false
	});

	this.controller.setupWidget('googleAccountButton', {label: $L('Enter Google Account Info')});


	this.controller.setupWidget('exportFrequencySelector', {
		label: $L('Frequency'),
		choices: [
			{value: 0, label: $L('Daily')},
			{value: 1, label: $L('Weekly')},
			{value: 2, label: $L('Bi-Weekly')},
			{value: 3, label: $L('Monthly')}
		]},
		this.exportFrequencySelectorModel = {
			value: Miles.prefs.exportFrequency,
			disabled: false
		}
	);
	
	this.controller.setupWidget('exportTypeSelector', {
		label: $L('Export Type'),
		choices: [
			{value: 0, label: $L('Google Docs')},
			{value: 1, label: $L('Email')}
		]},
		this.exportTypeSelectorModel = {
			value: Miles.prefs.exportType,
			disabled: false
		}
	);
	
	this.controller.setupWidget('reminderTime',
		{
			autoFocus: false,
			label: $L('Reminder Time')
		},
		this.reminderTimeModel = {
			value: Miles.prefs.reminderTime,
			choices: [
				{label: $L("None"), value: 0},
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
	
	this.controller.setupWidget('emailText', 
		{
			hintText: $L("Enter address for email export"),
            multiline: false,
            enterSubmits: false,
			textCase: Mojo.Widget.steModeLowerCase,
			focusMode: Mojo.Widget.focusSelectMode,
			limitResize: true
		},
		this.emailTextModel = {
			value: Miles.prefs.defaultEmail
		}
	);
	
	this.controller.setupWidget('vehicleList', {
		itemTemplate: 'preferences/vehiclesRowTemplate',
		listTemplate: 'preferences/prefsListTemplate',
		swipeToDelete: true,
		renderLimit: 20,
		reorderable: false,
		addItemLabel: $L('Add a vehicle')
	}, this.vehicleModel = {
		items: Miles.vehicles
	});
	this.controller.setupWidget('categoryList', {
		itemTemplate: 'preferences/categoryRowTemplate',
		listTemplate: 'preferences/prefsListTemplate',
		swipeToDelete: true,
		renderLimit: 20,
		reorderable: false,
		addItemLabel: $L('Add a category')
	}, this.categoryModel = {
		items: Miles.categories
	});
	
	// setup App menu
	this.MenuModel = {
		visible: true,
		items: [
			Mojo.Menu.editItem,
			{label: $L('Export Data...'), disabled: false,
				items: [
					{label: $L('Export to Google...'), command: 'doGoogle', disabled: false},
					{label: $L('Export by Email...'), command: 'doExport', disabled: false}
				]
			},	
			{label: $L('Purge Data...'), command: 'doPurge', disabled: false},
			{label: $L('Preferences...'), command: 'doPrefs', disabled: true},
			Mojo.Menu.helpItem
		]
	};
	this.controller.setupWidget(Mojo.Menu.appMenu, Miles.MenuAttr, this.MenuModel);

	
	/* add event handlers to listen to events from widgets */
	this.doListAddHandler = this.doListAdd.bindAsEventListener(this);
	this.controller.listen('categoryList', Mojo.Event.listAdd, this.doListAddHandler);
	this.controller.listen('vehicleList', Mojo.Event.listAdd, this.doListAddHandler);
	this.controller.listen('categoryList', Mojo.Event.listTap, this.doListAddHandler);
	this.controller.listen('vehicleList', Mojo.Event.listTap, this.doListAddHandler);
	
	this.doListDeleteHandler = this.doListDelete.bindAsEventListener(this);
	this.controller.listen('categoryList', Mojo.Event.listDelete, this.doListDeleteHandler);
	this.controller.listen('vehicleList', Mojo.Event.listDelete, this.doListDeleteHandler);
	
	this.googleAccountHandler = this.googleAccount.bind(this);
	this.controller.listen('googleAccountButton', Mojo.Event.tap, this.googleAccountHandler);

	this.setAutoExportHandler = this.setAutoExport.bind(this);
	this.controller.listen('exportFrequencySelector', Mojo.Event.propertyChange, this.setAutoExportHandler);
	this.controller.listen('autoExportToggle', Mojo.Event.propertyChange, this.setAutoExportHandler);
	
	this.controller.setInitialFocusedElement(null);
};

PreferencesAssistant.prototype.googleAccount = function (event) {
	this.controller.stageController.pushScene('account-login');
};

PreferencesAssistant.prototype.doListDelete = function (event) {
	
	Mojo.Log.info("Target", event.target.id, event.index);
	var sql, value;
	switch (event.target.id) {
	case 'vehicleList':
		if (Miles.vehicles[event.index].value === 1) {
			Mojo.Log.info("Can't delete default vehicle!");
			sql = '';
			event.preventDefault();
			event.stopPropagation();
			Mojo.Controller.errorDialog($L("This is the Default Vehicle: Can not delete default vehicle"));
		}
		else {
			value = Miles.vehicles[event.index].value;
			Mojo.Log.info("Database Delete Vehicle", value);
			dao.deleteVehicle(value);
			Miles.vehicles.splice(event.index, 1);
			this.updateEvents('vehicle', value);
			if (Miles.prefs.lastVehicle == value) {
				Miles.prefs.lastVehicle = 1;
			}
		}
		break;
	case 'categoryList':
		if (Miles.categories[event.index].value === 1) {
			Mojo.Log.info("Can't delete default category!");
			event.preventDefault();
			event.stopPropagation();
			Mojo.Controller.errorDialog($L("This is the Default Category: Can not delete default category"));
		}
		else {
			value = Miles.categories[event.index].value;
			dao.deleteCategory(value);
			dao.updateEventsWithCategory(value);
			Miles.categories.splice(event.index, 1);
			this.updateEvents('category', value);
			if (Miles.prefs.lastCategory == value) {
				Miles.prefs.lastCategory = 1;
			}
		}
		break;
	}
};

PreferencesAssistant.prototype.updateEvents = function (type, index) {
	var i;
	switch (type) {
	case 'vehicle':
		for (i = 0; i < Miles.mileageEvents.length; i++) {
			Mojo.Log.info("Looking for vehicles", i, Miles.mileageEvents[i].vehicle, index);
			if (Miles.mileageEvents[i].vehicle == index) {
				Mojo.Log.info("Got One!");
				Miles.mileageEvents[i].vehicle = 1;
				dao.updateMileageEvent(Miles.mileageEvents[i],
					function () {
						Mojo.Log.info("Did one!");
				});

			}			
		}
		break;
	case 'category':
		for (i = 0; i < Miles.mileageEvents.length; i++) {
			Mojo.Log.info("Looking for categories", i, Miles.mileageEvents[i].category, index);
			if (Miles.mileageEvents[i].category == index) {
				Miles.mileageEvents[i].category = 1;
				dao.updateMileageEvent(Miles.mileageEvents[i], 
					function () {
						Mojo.Log.info("Did one!");
				});
			}			
		}
		break;
	}
};

PreferencesAssistant.prototype.dbErrorHandler = function (transaction, error) {
	Mojo.Log.info("**********Error deleting record: ", error.message);
};

PreferencesAssistant.prototype.doListAdd = function (event) {
	Mojo.Log.info("Target", event.target.id, event.index);
	var category, vehicle, index;
	switch (event.target.id) {
	case 'categoryList':
		category = {};
		index = event.index;
		if (!Miles.categories[index]) {
			// Adding a new category	
			category.label = '';
			category.value = null;
			Miles.categories.push(category);
			index = Miles.categories.length - 1;
		}
		else {
			// Editing an existing category
			category = Miles.categories[index];
		}
		Mojo.Log.info("Category is: %j", category);
		this.controller.showDialog({
			template: 'preferences/editcategory',
			assistant: new EditCategoryAssistant(this, index, category, this.updateCategory.bind(this))
		});
		break;
		
		
	case 'vehicleList':
		vehicle = {};
		index = event.index;
		if (!Miles.vehicles[index]) {
		//adding a new vehicle
			vehicle.label = '';
			vehicle.rate = 0;
			vehicle.lastmileage = 0;
			vehicle.value = null;
			Miles.vehicles.push(vehicle);
			index = Miles.vehicles.length - 1;
		}
		else {
		// editing an existing vehicle
			vehicle = Miles.vehicles[index];
		}
		Mojo.Log.info("Vehicle is: %j", vehicle);
		this.controller.showDialog({
			template: 'preferences/editvehicles',
			assistant: new EditVehiclesAssistant(this, index, vehicle, this.updateVehicle.bind(this))
		});
		break;
	}
};

PreferencesAssistant.prototype.updateVehicle = function (vehicle, index) {
	Mojo.Log.info("Updating list model");
	this.controller.modelChanged(this.vehicleModel);
	Mojo.Log.info("MyVar is", this.myVar);
};

PreferencesAssistant.prototype.updateCategory = function (category, index) {
	this.controller.modelChanged(this.categoryModel);
};

PreferencesAssistant.prototype.activate = function (event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};

PreferencesAssistant.prototype.setAutoExport = function (event) {
	Miles.prefs.autoExport = this.autoExportModel.value;
	Miles.prefs.exportType = this.exportTypeSelectorModel.value;
	Miles.prefs.exportFrequency = this.exportFrequencySelectorModel.value;
	var args = Miles.prefs;
	Miles.prefsCookie.put(args);
	if (this.autoExportModel.value) {
		//Setup Auto Export
		Miles.appAssistant.setupAutoExport();
		
		//these don't work!!!
		//Mojo.Controller.getAppController().setupAutoExport();
		//this.controller.AppController.setupAutoExport();
		//AppAssistant.setupAutoExport();	
	}
	else {
		Mojo.Log.info("Auto Export turned off!");
		if (Miles.prefs.exportTimerId) {
			Mojo.Log.info("Clearing export timer");
			var request = new Mojo.Service.Request("palm://com.palm.power/timeout", {
				method: 'clear',
				parameters: {
					key: 'Export'
				},
				onSuccess: function () {
					Mojo.Log.info("Success in clearing export timer!!!");
				}.bind(this)
			});
		}
	}
};

PreferencesAssistant.prototype.deactivate = function (event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	Miles.prefs.autoFill = this.autoFillModel.value;
	Miles.prefs.reminderTime = this.reminderTimeModel.value;
	// ADD MINIMAL ERROR CHECKING FOR EMAIL ADDRESS "x@y.something"
	Miles.prefs.defaultEmail = this.emailTextModel.value;
	Miles.prefs.autoTime = this.autoTimeModel.value;
	Miles.prefs.autoExport = this.autoExportModel.value;
	Miles.prefs.exportType = this.exportTypeSelectorModel.value;
	Miles.prefs.exportFrequency = this.exportFrequencySelectorModel.value;
	Mojo.Log.info("Prefs: %j", Miles.prefs);
	var args = Miles.prefs;
	Miles.prefsCookie.put(args);
	
};

PreferencesAssistant.prototype.cleanup = function (event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	
	this.controller.stopListening('categoryList', Mojo.Event.listAdd, this.doListAddHandler);
	this.controller.stopListening('vehicleList', Mojo.Event.listAdd, this.doListAddHandler);
	this.controller.stopListening('categoryList', Mojo.Event.listTap, this.doListAddHandler);
	this.controller.stopListening('vehicleList', Mojo.Event.listTap, this.doListAddHandler);
	
	this.controller.stopListening('categoryList', Mojo.Event.listDelete, this.doListDeleteHandler);
	this.controller.stopListening('vehicleList', Mojo.Event.listDelete, this.doListDeleteHandler);
  
	this.controller.stopListening('googleAccountButton', Mojo.Event.tap, this.googleAccountHandler);
	this.controller.stopListening('exportFrequencySelector', Mojo.Event.propertyChange, this.setAutoExportHandler);
	this.controller.stopListening('autoExportToggle', Mojo.Event.propertyChange, this.setAutoExportHandler);
};
