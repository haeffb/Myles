function EditDateAssistant(sceneAssistant, date, target, callBackFunc) {
	this.sceneAssistant = sceneAssistant;
	this.callBackFunc = callBackFunc;
	this.date = new Date(date);
	this.target = target;
}

EditDateAssistant.prototype.setup = function (widget) {
	//this.sceneAssistant.controller.get('dialog-title').innerHTML = $L('Edit Date & Time') + "...";
	
	//Mojo.log.info("Widget", widget);
	this.widget = widget;
		
	this.sceneAssistant.controller.setupWidget('editdate-picker', {
		label: $L('Date')
	}, this.editDatePickerModel = {
		date: this.date
	});
	
	this.sceneAssistant.controller.setupWidget('edittime-picker', {
		label: $L('Time')
	}, this.editTimePickerModel = {
		time: this.date
	});
	
	this.sceneAssistant.controller.setupWidget('useDateTime', {}, {
		label: $L("Use this Date & Time")
	});
	this.sceneAssistant.controller.setupWidget('useNow', {}, {
		label: $L("Use Now")
	});

	this.useDateTimeHandler = this.useDateTime.bindAsEventListener(this);
	this.sceneAssistant.controller.listen('useDateTime', Mojo.Event.tap, this.useDateTimeHandler);
	this.useNowHandler = this.useNow.bindAsEventListener(this);
	this.sceneAssistant.controller.listen('useNow', Mojo.Event.tap, this.useNowHandler);
};

EditDateAssistant.prototype.useDateTime = function () {
	// this.date automagically updated since it's the model of the Date & Time pickers
	this.callBackFunc(this.date, this.target);
	this.widget.mojo.close();
};

EditDateAssistant.prototype.useNow = function () {
	this.callBackFunc(new Date(), this.target);
	this.widget.mojo.close();
};

EditDateAssistant.prototype.cleanup = function () {
	this.sceneAssistant.controller.stopListening('useDateTime', Mojo.Event.tap, this.useDateTimeHandler);
	this.sceneAssistant.controller.stopListening('useNow', Mojo.Event.tap, this.useNowHandler);
};
