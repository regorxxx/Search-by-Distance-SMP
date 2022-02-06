﻿'use strict'
//04/02/22

include('menu_xxx.js');
include('helpers_xxx.js');
include('helpers_xxx_file.js');

const recipeMenu = new _menu();

function createRecipeMenu(parent) {
	recipeMenu.clear(true); // Reset on every call
	const files = findRecursivefile('*.json', [folders.xxx + 'presets\\Search by\\recipes']);
	const properties = parent.buttonsProperties;
	const data = JSON.parse(properties.data[1]);
	const utf8 = convertCharsetToCodepage('UTF-8');
	// Header
	recipeMenu.newEntry({entryText: 'Set recipe file:', func: null, flags: MF_GRAYED});
	recipeMenu.newEntry({entryText: 'sep'});
	{	// Readme
		const readmePath = folders.xxx + 'helpers\\readme\\search_bydistance_recipes_themes.txt';
		recipeMenu.newEntry({entryText: 'Open readme...', func: () => {
			if (_isFile(readmePath)) { 
				const readme = utils.ReadTextFile(readmePath, convertCharsetToCodepage('UTF-8')); // Executed on script load
				if (readme.length) {fb.ShowPopupMessage(readme, window.Name);}
				else {console.log('Readme not found: ' + value);}
			}
		}});
	}
	recipeMenu.newEntry({entryText: 'Open recipes folder', func: () => {
		if (_isFile(properties.recipe[1])) {_explorer(properties.recipe[1]);} // Open current file
		else {_explorer(folders.xxx + 'presets\\Search by\\recipes');} // or folder
	}});
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
		// List files, with full path or relative path (portable)
		options.push(_isFile(fb.FoobarPath + 'portable_mode_enabled') && file.indexOf(fb.ProfilePath) !== -1 ? (fb.ProfilePath.indexOf('profile') !== -1 ? file.replace(fb.ProfilePath,'.\\profile\\') : file.replace(fb.ProfilePath,'.\\')): file);
	});
	const menus = [];
	options.forEach((file) => {
		const recipe = _jsonParseFileCheck(file, 'Recipe json', 'Search by distance', utf8);
		if (!recipe) {return;}
		const name = recipe.hasOwnProperty('name') ? recipe.name : utils.SplitFilePath(file)[1];
		let theme = null;
		if (recipe.hasOwnProperty('theme')) {
			if (_isFile(recipe.theme)) {theme = _jsonParseFileCheck(recipe.theme, 'Theme json', 'Search by distance', utf8);}
			else if (_isFile(folders.xxx + 'presets\\Search by\\themes\\' + recipe.theme)) {theme = _jsonParseFileCheck(folders.xxx + 'presets\\Search by\\themes\\' + recipe.theme, 'Recipe json', 'Search by distance', utf8);}
			else {console.log('Theme file not found:' + recipe.theme);}
		}
		const themeName = theme ? theme.name + ' (forced by recipe)' : ''; // Recipe may overwrite theme
		let i = 1;
		const entryText = menus.indexOf(name) === -1 ? name : name + ' (' + ++i + ')';
		menus.push(entryText);
		recipeMenu.newEntry({entryText, func: () => {
			properties.recipe[1] = file;
			data.recipe = name;
			data.forcedTheme = themeName;
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