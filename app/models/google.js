// ---------------------------------------------------------
//
//  Google Docs auth/import/export functions
//
// ---------------------------------------------------------

Google = ({
	
	getAuthString: function(user, pass, dataDirection, callBackFunc){
		Mojo.Log.info("***** Entering Google getAuthString ******");		
		this.callBackFunc = callBackFunc;
		//var service = "wise";
		var service = "writely",
			source = Mojo.appInfo.id + "-" + Mojo.appInfo.title;
		this.dataDirection = dataDirection;
		Mojo.Log.info("Data Direction:" + this.dataDirection);
		var authString = "https://www.google.com/accounts/ClientLogin?Email=" + user + "&Passwd=" + pass +
		"&accountType=HOSTED_OR_GOOGLE" +
		"&source=" + source +
		"&service=" + service;
		Mojo.Log.info("Authstring: " + authString);
		var authRequest = new Ajax.Request(authString, {
			method: 'get',
			evalJSON: 'false',
			onSuccess: this.parseAuthString.bind(this),
			onFailure: this.ajaxFailure.bind(this)
		});
	},
	
	parseAuthString: function (results) {
		Mojo.Log.info("***** Entering Google parseAuthString ******");
	    this.version = "3.0";
		var event = {};
	    try {
			Mojo.Log.info("results: %j", results);
/*
			for (key in results) {
				Mojo.Log.info("Key %j", results[key], key);
			} 

*/			var tempKeyArr = results.responseText.split("\n");
			Mojo.Log.info("Response:", results.responseText);
			//Mojo.Log.info("Total number of splits", tempKeyArr.length)
			for (var i = 0; i < tempKeyArr.length; i++) {
				//Mojo.Log.info(tempKeyArr[i])
				if (tempKeyArr[i].toLowerCase().indexOf("auth=") != -1) {
					this.authKey = "GoogleLogin auth=" + tempKeyArr[i].replace(/Auth=/i, "");
					Mojo.Log.info(this.authKey);
					event.type = "success";
					event.authKey = this.authKey;
					Miles.prefs.googleAuthKey = this.authKey;
					this.callBackFunc(event);
					
				}
			}
		} 
		catch (err) {
			Mojo.Log.error("Error: %j", err);
		}
		
	},
	
	ajaxFailure: function (event) {
		Mojo.Log.info("Unable to login to Google - AJAX FAILURE!!!!");
		Mojo.Log.info("Event info: %j", event);
		var results = {};
		results.type = "failure";
		results.error = "Unable to login to Google";
		this.callBackFunc(results);
		//var window = Mojo.Controller.getAppController().getActiveStageController().activeScene().window;
		//Mojo.Controller.errorDialog("Unable to login to Google", window);
	},
	
	createSpreadsheet:function(csvFile){
		Mojo.Log.info("<------Entered createSpreadsheet");
		Mojo.Log.info("AuthKey = ", Miles.prefs.googleAuthKey);
 
		var documentTitle = Mojo.appInfo.title + " " + new Date().toDateString();
		var atomFeed = "<?xml version='1.0' encoding='UTF-8'?>" +
			'<entry xmlns="http://www.w3.org/2005/Atom">' +
			'<category scheme="http://schemas.google.com/g/2005#kind"' +
			' term="http://schemas.google.com/docs/2007#spreadsheet"/>' +
			'<title>' +
			documentTitle +
			'</title>' +
			'</entry>';
    
		var postBody = '--END_OF_PART\r\n' +
			'Content-Type: application/atom+xml;\r\n\r\n' +
			atomFeed +
			'\r\n' +
			'--END_OF_PART\r\n' +
			'Content-Type: text/csv' +
			'\r\n\r\n' +
			csvFile +
			'\r\n' +
			'--END_OF_PART--\r\n';
    
		var sheetsRequest = new Ajax.Request("http://docs.google.com/feeds/default/private/full", {
				method: 'post',
				contentType: 'multipart/related; boundary=END_OF_PART',
				postBody: postBody,
				Slug: documentTitle,
				requestHeaders: {
				'GData-Version': "3.0",
				"Authorization": Miles.prefs.googleAuthKey
			},
			onSuccess: function(response){
				Mojo.Log.info("Finished Creating Document");
				//var window = Mojo.Controller.getAppController().getActiveStageController().activeScene().window;
				//Mojo.Controller.errorDialog("Exported to Google!", window);
				Mojo.Controller.getAppController().showBanner("Exported to Google!", {});
				//this.controller.get('exportInformation').innerHTML = "Complete!"
				//setTimeout(this.finished.bind(this), 1000);
				//this.finished()
			}.bind(this),
			onFailure: this.ajaxFailure.bind(this)
		});
		
		Mojo.Log.info("<------Exited createSpreadsheet");
	},
	
	buildCSVString: function (object, vehicles, categories, type) {
		Mojo.Log.info("Doing Build CSV StringExport!");
		var thisObject = object,
			text = '',
			tmptext = '',
			txtReturn = '<br />',
			name,
			row,
			i, temp,
			myRate, myTotal, myController;
			
		switch (type) {
		case 'google':
			txtReturn = '\n';
			break;
		case 'email':
			break;
		}
		Mojo.Log.info("Type:", type, txtReturn);
	
		//Convert object to CSV string
		row = thisObject[0];
		for (name in row) {
			switch (name) {
			case 'id':
			case 'open':
			case 'dateformat':
				break;
			case 'purpose':
				text += '"Purpose",';
				break;
			case 'destination':
				text += '"Destination",';
				break;
			case 'category':
				text += '"Category",';
				break;
			case 'vehicle':
				text += '"Vehicle",';
				tmptext = 'Vehicle';
				break;
			case 'date':
				text += '"Begin Date",';
				tmptext = "Begin Date";
				break;
			case 'endDate': 
				text += '"End Date",';
				tmptext = "End Date";
				break;
			case 'begMiles':
				text += '"Begin Miles",';
				tmptext = "Begin Miles";
				break;
			case 'endMiles':
				text += '"End Miles",';
				tmptext = "End Miles";
				break;
			case 'mileage':
				text += '"Mileage",';
				tmptext = "Mileage";
				break;
			case 'notes':
				text += '"Notes",';
				tmptext = "Notes";
				break;
			case 'timeDiff':
				text += '"Total Time",';
				tmptext = "Total Time";
				break;
			default:
				
			}
		}
		text += '"Rate","Total"';
		text += txtReturn;
		for (i = 0; i < thisObject.length; i++) {
			row = thisObject[i];
			//Mojo.Log.info("Row" + i + " is: %j", row);
			for (name in row) {
				switch (name) {
				case 'category':
					// get the category label from index
					temp = parseInt(row[name], 10);
					tmptext = categories[temp].label;
					text += '"' + categories[temp].label + '",';
					break;
				case 'vehicle':
					// get the vehicle label from index
					temp = parseInt(row[name], 10);
					text += '"' + vehicles[temp].label + '",';
					break;
				case 'date':
				case 'endDate':
				    // format date fields
					text += '"' + Mojo.Format.formatDate(new Date(row[name]), 'long') + '",';
					break;
				case 'id':
				case 'dateformat':
				case 'open':
					break;
				default:
					tmptext = row[name];
					if (typeof(tmptext) === 'string') {
						tmptext = tmptext.replace(/\"/g, "\"\"");
					}
					text += '"' + tmptext + '",';
					break;			
				}
			}	
			myRate = vehicles[row.vehicle].rate;
			myTotal = '$' + Mojo.Format.formatNumber(myRate * row.mileage, 2);
			text += '"' + myRate  + '","' + myTotal + '"';
			text += txtReturn;
		}
		Mojo.Log.info("Text is", text);
		return text;
	}
});
