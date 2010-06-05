function AccountLoginAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
}

AccountLoginAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	
	/* add event handlers to listen to events from widgets */
	
	this.controller.get('GoogleInfo').innerHTML = $L({
		value: "In order to backup your data, you must have an account with Google. If you do not have an account, you can sign up for one here: ", 
		key: "GoogleInfo"});
	this.controller.get("GoogleLink").innerHTML = $L("Google Account Creation");
	this.controller.get("GoogleUserLabel").innerHTML = $L("User");
	this.controller.get("GooglePasswordLabel").innerHTML = $L("Password");
	this.controller.get('scrimContainer').hide();
	
	this.controller.setupWidget("login",
        this.attributes = {
            },
        this.model = {
            label : $L("Login"),
            disabled: false,
			buttonClass: "affirmative"
        });
		
		
	this.controller.setupWidget("username",
         this.attributes = {
             hintText: $L('Google Username'),
             multiline: false,
             enterSubmits: true,
             focus: true,
	     textCase: Mojo.Widget.steModeLowerCase
         },
         this.userModel = {
             value: Miles.prefs.googleUser,
             disabled: false
    });	
	
	this.controller.setupWidget("accountSpinner",
         this.attributes = {
             spinnerSize: 'large',
			 frameHeight : 'large'
         },
         this.model = {
             spinning: false 
         });
	
   this.controller.setupWidget("password",
         this.attributes = {
             hintText: $L('Type Password')
         },
         this.passwordModel = {
             value: Miles.prefs.googlePassword
    });

	this.handleUpdateHandler = this.handleUpdate.bindAsEventListener(this);		
	this.controller.listen("login",Mojo.Event.tap, this.handleUpdateHandler);


};

AccountLoginAssistant.prototype.handleUpdate = function (event) {
	//this.controller.get('importInformation').innerHTML=$L("Verifying Google Account");
	this.controller.get('scrimContainer').show();
	this.controller.get('accountSpinner').mojo.start();
	Google.getAuthString(this.userModel.value, this.passwordModel.value, 
		"export", this.returnFromGoogleAuth.bind(this));
	
};

AccountLoginAssistant.prototype.returnFromGoogleAuth = function (event) {
	//Mojo.Log.info("Returned from Google! with %j", event);
	
	this.controller.get('scrimContainer').hide();
	this.controller.get('accountSpinner').mojo.stop();
	
	switch (event.type) {
	case "success":
		//Mojo.Controller.errorDialog("Success: You are authorized for Google export!", this.controller.window);
		this.controller.showAlertDialog({
		     onChoose: this.saveGoogleAccount.bind(this),
		     title: $L("Success!"),
		     message: $L("You are authorized for Google Export!"),
		     choices:[
		          {label:$L('Ok'), value:"ok", type:'affirmative'} 
		     ]
		});
		break;
	case "failure":
		Mojo.Controller.errorDialog($L("Failure: ") + event.error, this.controller.window);
		break;
	}
};

AccountLoginAssistant.prototype.saveGoogleAccount = function () {
	Mojo.Log.info("Saving Google Account Info.");
	Miles.prefs.googleAuthKey = event.authKey;
	Miles.prefs.googleUser = this.userModel.value;
	Miles.prefs.googlePassword = this.passwordModel.value;
	var args = Miles.prefs;
	Miles.prefsCookie.put(args);
	this.controller.stageController.popScene();

};

AccountLoginAssistant.prototype.activate = function (event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};

AccountLoginAssistant.prototype.deactivate = function (event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

AccountLoginAssistant.prototype.cleanup = function (event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	this.controller.stopListening("login", Mojo.Event.tap, this.handleUpdateHandler);

};
