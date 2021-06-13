include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\menu_xxx.js');
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\helpers_xxx_file.js');

const recipeMenu = new _menu();

function createRecipeMenu(parent) {
	recipeMenu.clear(true); // Reset on every call
	const files = findRecursivefile('*.json', [fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\presets\\Search by\\recipes'])
	const properties = parent.buttonsProperties;
	const data = JSON.parse(properties.data[1]);
	// Header
	recipeMenu.newEntry({entryText: 'Set recipe file:', func: null, flags: MF_GRAYED});
	recipeMenu.newEntry({entryText: 'sep'});
	recipeMenu.newEntry({entryText: 'Open recipes folder', func: () => {
		if (_isFile(properties.recipe[1])) {_explorer(properties.recipe[1]);} // Open current file
		else {_explorer(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\presets\\Search by\\recipes');} // or folder
	}});
	recipeMenu.newEntry({entryText: 'sep'});
	recipeMenu.newEntry({entryText: 'None', func: () => {
		properties.recipe[1] = '';
		parent.description = 'Search according to variables at properties.\n(Shift + L. Click to set theme)\t -> ' + data.theme + '\n(Ctrl + L. Click to set recipe)\t -> None\n(Shift + Ctrl + L. Click to set other config)';
		data.tooltip = parent.description;
		data.recipe = 'None'
		properties.data[1] = JSON.stringify(data);
		overwriteProperties(properties);
	}});
	recipeMenu.newEntry({entryText: 'sep'});
	// List
	const options = [];
	files.forEach((file) => {
		// List files, with full path or relative path (portable)
		options.push(_isFile(fb.FoobarPath + 'portable_mode_enabled') && file.indexOf(fb.ProfilePath) !== -1 ? file.replace(fb.ProfilePath,'.\\profile\\') : file);
	});
	const menus = [];
	options.forEach((file) => {
		const recipe = _jsonParseFile(file);
		if (!recipe) {console.log('Recipe file is not valid:' + file); return;}
		const name = recipe.hasOwnProperty('name') ? recipe.name : isCompatible('1.4.0') ? utils.SplitFilePath(file)[1] : utils.FileTest(file, 'split')[1];  //TODO: Deprecated
		let theme = null;
		if (recipe.hasOwnProperty('theme')) {
			if (_isFile(recipe.theme)) {theme = _jsonParseFile(recipe.theme);}
			else if (_isFile(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\presets\\Search by\\themes\\' + recipe.theme)) {theme = _jsonParseFile(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\presets\\Search by\\themes\\' + recipe.theme);}
		}
		const themeName = theme ? theme.name + ' (forced by recipe)' : data.theme; // Recipe may overwrite theme
		let i = 1;
		const entryText = menus.indexOf(name) === -1 ? name : name + ' (' + ++i + ')';
		menus.push(entryText);
		recipeMenu.newEntry({entryText, func: () => {
			properties.recipe[1] = file;
			parent.description = 'Search according to variables at properties.\n(Shift + L. Click to set theme)\t -> ' + themeName + '\n(Ctrl + L. Click to set recipe)\t -> ' + name + '\n(Shift + Ctrl + L. Click to set other config)';
			data.tooltip = parent.description;
			data.recipe = name;
			properties.data[1] = JSON.stringify(data);
			overwriteProperties(properties);
		}});
	});
	recipeMenu.newCheckMenu(recipeMenu.getMainMenuName(), 'None', menus[menus.length - 1], () => {
		const idx = options.indexOf(properties.recipe[1]);
		return idx !== -1 ? idx + 1 : 0;
	});
	return recipeMenu;
}