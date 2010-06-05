function EditCategoryAssistant(sceneAssistant, index, category, callBackFunc) {
	this.sceneAssistant = sceneAssistant;
	this.callBackFunc = callBackFunc;
	this.category = category;
	this.index = index;
	Mojo.Log.info("Category is: %j", category);
}

EditCategoryAssistant.prototype.setup = function (widget) {
	this.sceneAssistant.controller.get('dialog-title').innerHTML = $L('Edit Category') + "...";
	this.sceneAssistant.controller.get('categoryGroupLabel').innerHTML = $L('Category Info');
	this.sceneAssistant.controller.get('categoryNameLabel').innerHTML = $L('Category');
	
	this.widget = widget;
	this.sceneAssistant.controller.setupWidget('categoryName', 
		{
			focusMode: Mojo.Widget.focusSelectMode
		}, 
		this.categoryNameModel = {
			value: this.category.label
		}
	);
		
	
	this.sceneAssistant.controller.setupWidget('updateCategory', {}, {
		label: $L("Update Category")
	});

	this.updateCategoryHandler = this.updateCategory.bindAsEventListener(this);
	this.sceneAssistant.controller.listen('updateCategory', Mojo.Event.tap, this.updateCategoryHandler);	
};	

EditCategoryAssistant.prototype.updateCategory = function () {	
	Mojo.Log.info("The ID is:", this.category.value);
	Mojo.Log.info("label is:", this.categoryNameModel.value);
	var category = {}, sql, args;
	category.label = this.categoryNameModel.value;
	category.value = this.category.value;
	Mojo.Log.info("Category is: %j", category);
	if (this.category.value) {
		// update existing entry in database
		Mojo.Log.info("UPDATING category with %j", category);
		dao.updateCategory(category);
		Miles.categoriesByIndex[category.value] = category;
	}
	else {
		Mojo.Log.info("INSERTING NEW entry with %j", category);
		dao.createCategory(category, this.returnFromCreateCategory.bind(this));
	}
	
	Miles.categories[this.index] = category;
	this.callBackFunc(category, this.index);
	this.widget.mojo.close();
};

EditCategoryAssistant.prototype.returnFromCreateCategory = function (results) {
	Mojo.Log.info("Return from Create Category with results: %j", results);
	Miles.categories[this.index].value = results;
	Miles.categoriesByIndex[results] = Miles.categories[this.index];
	Mojo.Log.info("Category is %j", Miles.categories[this.index]);
};

EditCategoryAssistant.prototype.cleanup = function () {
	this.sceneAssistant.controller.stopListening('updateCategory', Mojo.Event.tap, this.updateCategoryHandler);
};
