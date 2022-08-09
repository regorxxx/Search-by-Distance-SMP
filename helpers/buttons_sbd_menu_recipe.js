'use strict';
//09/08/22

include('menu_xxx.js');
include('helpers_xxx.js');
include('helpers_xxx_file.js');

const recipeMenu = new _menu();

function createRecipeMenu(parent) {
	recipeMenu.clear(true); // Reset on every call
	const files = findRecursivefile('*.json', [folders.xxx + 'presets\\Search by\\recipes']);
	const properties = parent.buttonsProperties;
	const data = JSON.parse(properties.data[1]);
	// Hide test files first
	const testRegex = /test_.*|int_.*/i;
	files.forEach((file) => {
		if (testRegex.test(file.split('\\').pop())) {
			const attr = _parseAttrFile(file);
			if (attr && !attr.Hidden) {_runCmd('attrib +H ' + _q(file), true);}
		}
	});
	// Header
	recipeMenu.newEntry({entryText: 'Set recipe file: (Shift + Click to hide)', func: null, flags: MF_GRAYED});
	recipeMenu.newEntry({entryText: 'sep'});
	recipeMenu.newEntry({entryText: 'Create recipe file with current config', func: () => {
		const recipe = {name: ''};
		// Retrieve allowed keys
		const excludedKeys = new Set(['name', 'properties', 'panelProperties', 'theme', 'recipe', 'bPoolFiltering', 'bProfile', 'bShowQuery', 'bShowFinalSelection', 'bBasicLogging', 'bSearchDebug', 'bCreatePlaylist']);
		recipeAllowedKeys.forEach((key) => {if (!excludedKeys.has(key)) {recipe[key] = properties[key][1];}});
		// Recipe obj
		let input = '';
		try {input = utils.InputBox(window.ID, 'Enter Recipe name', 'Search by distance', 'my recipe', true).toString();}
		catch (e) {return;}
		if (!input.length) {return;}
		recipe.name = input;
		const filePath = folders.xxx + 'presets\\Search by\\recipes\\' + input + '.json';
		if (_isFile(filePath) && WshShell.Popup('Already exists a file with such name, overwrite?', 0, window.Name, popup.question + popup.yes_no) === popup.no) {return;}
		if (WshShell.Popup('Also add additional variables from properties?\n' + [...recipePropertiesAllowedKeys].join(', '), 0, window.Name, popup.question + popup.yes_no) === popup.yes) {
			recipe.properties = {};
			Object.keys(properties).forEach((rKey) => {
				if (!recipePropertiesAllowedKeys.has(rKey)) {return;}
				recipe.properties[rKey] = properties[rKey][1];
			});
		}
		const bDone = _save(filePath, JSON.stringify(recipe, null, '\t'));
		if (!bDone) {fb.ShowPopupMessage('Error saving recipe file:' + filePath, 'Search by distance'); return;}
		else {_explorer(filePath);}
	}});
	{	// Recipe tools
		const menuName = recipeMenu.newMenu('More options...');
		{	// Readme
			const readmePath = folders.xxx + 'helpers\\readme\\search_bydistance_recipes_themes.txt';
			recipeMenu.newEntry({menuName, entryText: 'Open readme...', func: () => {
				const readme = _open(readmePath, utf8); // Executed on script load
				if (readme.length) {fb.ShowPopupMessage(readme, window.Name);}
				else {console.log('Readme not found: ' + value);}
			}});
		}
		recipeMenu.newEntry({menuName, entryText: 'Open recipes folder', func: () => {
			if (_isFile(properties.recipe[1])) {_explorer(properties.recipe[1]);} // Open current file
			else {_explorer(folders.xxx + 'presets\\Search by\\recipes');} // or folder
		}});
		const hiddenFilesNum = files.reduce((total, file) => {
			if (!testRegex.test(file.split('\\').pop())) {
				const attr = _parseAttrFile(file);
				return attr && attr.Hidden ? total + 1 : total;
			} else {return total;}
		}, 0);
		recipeMenu.newEntry({menuName, entryText: 'Unhide all recipes\t' + _b(hiddenFilesNum + ' files'), func: () => {
			const hiddenFiles = files.filter((file) => {const attr = _parseAttrFile(file); return attr && attr.Hidden;});
			hiddenFiles.forEach((file) => {
				if (!testRegex.test(file.split('\\').pop())) {
					if (_runCmd('attrib -H ' + _q(file), false)) {console.log('Unhide: '+ file);}
				}
			});
		}, flags: hiddenFilesNum ? MF_STRING : MF_GRAYED});
	}
	recipeMenu.newEntry({entryText: 'sep'});
	recipeMenu.newEntry({entryText: 'None', func: () => {
		properties.recipe[1] = '';
		data.recipe = 'None';
		data.forcedTheme = '';
		properties.data[1] = JSON.stringify(data);
		overwriteProperties(properties);
	}});
	recipeMenu.newEntry({entryText: 'sep'});
	// List
	const options = [];
	files.forEach((file) => {
		// Omit hidden files
		const attr = _parseAttrFile(file);
		if (attr && attr.Hidden) {return;}
		// List files, with full path or relative path (portable)
		options.push(_isFile(fb.FoobarPath + 'portable_mode_enabled') && file.indexOf(fb.ProfilePath) !== -1 ? (fb.ProfilePath.indexOf('profile') !== -1 ? file.replace(fb.ProfilePath,'.\\profile\\') : file.replace(fb.ProfilePath,'.\\')): file);
	});
	const menus = [];
	options.forEach((file, j) => {
		const recipe = _jsonParseFileCheck(file, 'Recipe json', 'Search by distance', utf8);
		if (!recipe) {return;}
		const name = recipe.hasOwnProperty('name') ? recipe.name : utils.SplitFilePath(file)[1];
		let theme = null;
		if (recipe.hasOwnProperty('theme')) {
			if (_isFile(recipe.theme)) {theme = _jsonParseFileCheck(recipe.theme, 'Theme json', 'Search by distance', utf8);}
			else if (_isFile(folders.xxx + 'presets\\Search by\\themes\\' + recipe.theme)) {theme = _jsonParseFileCheck(folders.xxx + 'presets\\Search by\\themes\\' + recipe.theme, 'Recipe json', 'Search by distance', utf8);}
			else {console.log('Forced theme json file (by recipe) not found: ' + recipe.theme); fb.ShowPopupMessage('Forced theme json file (by recipe) not found:\n' + recipe.theme, 'Search by distance');}
		}
		const themeName = theme ? theme.name + ' (forced by recipe)' : ''; // Recipe may overwrite theme
		let i = 1;
		const entryText = menus.indexOf(name) === -1 ? name : name + ' (' + ++i + ')';
		menus.push(entryText);
		recipeMenu.newEntry({entryText, func: () => {
			if (utils.IsKeyPressed(VK_SHIFT)) {
				_runCmd('attrib +H ' + _q(file), false);
				if (properties.recipe[1] === file) { // Set to none when hiding current recipe
					properties.recipe[1] = '';
					data.recipe = 'None';
					data.forcedTheme = '';
					properties.data[1] = JSON.stringify(data);
					overwriteProperties(properties);
				}
			} else {
				properties.recipe[1] = file;
				data.recipe = name;
				data.forcedTheme = themeName;
				properties.data[1] = JSON.stringify(data);
				overwriteProperties(properties);
			}
		}});
	});
	recipeMenu.newCheckMenu(recipeMenu.getMainMenuName(), 'None', menus.length ? menus[menus.length - 1] : 'None', () => {
		const idx = options.indexOf(properties.recipe[1]);
		return idx !== -1 ? idx + 1 : 0;
	});
	return recipeMenu;
}