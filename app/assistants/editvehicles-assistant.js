function EditVehiclesAssistant(sceneAssistant, index, vehicle, callBackFunc) {
	this.sceneAssistant = sceneAssistant;
	this.callBackFunc = callBackFunc;
	this.vehicle = vehicle;
	this.index = index;
	Mojo.Log.info("Vehicle is: %j", vehicle);
}

EditVehiclesAssistant.prototype.setup = function (widget) {
	this.sceneAssistant.controller.get('dialog-title').innerHTML = $L('Edit Vehicle') + "...";
	this.sceneAssistant.controller.get('vehicleGroupLabel').innerHTML = $L('Vehicle Info');
	this.sceneAssistant.controller.get('vehicleNameLabel').innerHTML = $L('Vehicle');
	this.sceneAssistant.controller.get('vehicleRateLabel').innerHTML = $L('Rate');

	this.sceneAssistant.myVar = false;
	
	this.widget = widget;
	this.sceneAssistant.controller.setupWidget('vehicleName', {
			focusMode: Mojo.Widget.focusSelectMode
		}, 
		this.vehicleNameModel = {
			value: this.vehicle.label
		}
	);
	
	this.sceneAssistant.controller.setupWidget('vehicleLastMileage', 
		{
			focusMode: Mojo.Widget.focusSelectMode,
			hintText: $L('Last odometer reading'),
			modifierState: Mojo.Widget.numLock,
			autoFocus: false,
			charsAllow: this.onlyNum.bind(this)			
		}, 
		this.vehicleLastMileageModel = {
			value: this.vehicle.lastmileage + ""
		}
	);

	this.sceneAssistant.controller.setupWidget('vehicleRate', 
		{
			focusMode: Mojo.Widget.focusSelectMode,
			hintText: $L('Rate in $'),
			modifierState: Mojo.Widget.numLock,
			autoFocus: false,
			charsAllow: this.onlyNum.bind(this)			
		}, 
		this.vehicleRateModel = {
			value: this.vehicle.rate + ""
		}
	);
	
	
	this.sceneAssistant.controller.setupWidget('updateVehicle', {}, {
		label: $L("Update Vehicle")
	});

	this.updateVehicleHandler = this.updateVehicle.bindAsEventListener(this);
	this.sceneAssistant.controller.listen('updateVehicle', Mojo.Event.tap, this.updateVehicleHandler);
	//this.useNowHandler = this.useNow.bindAsEventListener(this);
	//this.sceneAssistant.controller.listen('useNow', Mojo.Event.tap, this.useNowHandler);
};


EditVehiclesAssistant.prototype.onlyNum = function (charCode) {
	if (charCode === 46 || (charCode > 47 && charCode < 58)) {
		return true;
	}
	return false;
};

EditVehiclesAssistant.prototype.updateVehicle = function () {	
	Mojo.Log.info("The ID is:", this.vehicle.value);
	Mojo.Log.info("Mileage:", this.vehicleLastMileageModel.value);
	var vehicle, sql, args;
	vehicle = {};
	vehicle.label = this.vehicleNameModel.value;
	vehicle.lastmileage = this.vehicleLastMileageModel.value;
	vehicle.rate = this.vehicleRateModel.value;
	vehicle.value = this.vehicle.value;
	Mojo.Log.info("Vehicle is: %j", vehicle);
	if (this.vehicle.value) {
		// update existing entry in database
		Mojo.Log.info("UPDATING vehicle with %j", vehicle);
		Miles.vehiclesByIndex[vehicle.value] = vehicle;
		//Mojo.Log.info("Vehicles: %j", Miles.vehiclesByIndex);
		dao.updateVehicle(vehicle, this.dummy);
	}
	else {
		Mojo.Log.info("INSERTING NEW entry with %j", vehicle);
		dao.createVehicle(vehicle, this.returnFromCreateVehicle.bind(this));
	}
	
	Mojo.Log.info("value", this.vehicle.value);
	Miles.vehicles[this.index] = vehicle;
	this.callBackFunc(this.vehicle, this.index);
	this.widget.mojo.close();
};

EditVehiclesAssistant.prototype.dummy = function () {
	
};

EditVehiclesAssistant.prototype.returnFromCreateVehicle = function (results) {
	Mojo.Log.info("Return from Create Vehicle with results: %j", results, this.index);
	Miles.vehicles[this.index].value = results;
	Miles.vehiclesByIndex[results] = Miles.vehicles[this.index];
	Mojo.Log.info("Vehicle is: %j", Miles.vehicles[this.index]);
};

EditVehiclesAssistant.prototype.cleanup = function () {
	this.sceneAssistant.controller.stopListening('updateVehicle', Mojo.Event.tap, this.updateVehicleHandler);
};
