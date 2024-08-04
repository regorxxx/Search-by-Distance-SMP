'use strict';
//02/08/24

include('..\\..\\helpers\\menu_xxx.js');
include('..\\..\\helpers\\helpers_xxx.js');
include('..\\..\\helpers\\helpers_xxx_file.js');

/* exported createRecipeMenu */

/* global recipePath:readable, processRecipePlaceholder:readable, parseGraphDistance:readable, sbd:readable, testBaseTags:readable, SearchByDistance_properties:readable, music_graph_descriptors:readable, updateCache:readable, graphStatistics:readable, cacheLink:writable, cacheLinkSet:writable, tagsCache:readable, calculateSimilarArtistsFromPls:readable, findStyleGenresMissingGraph:readable, graphDebug:readable, music_graph_descriptors_culture:readable, testGraphNodes:readable, testGraphNodeSets:readable, getCountryISO:readable, getLocaleFromId:readable, recipeAllowedKeys:readable, recipePropertiesAllowedKeys:readable, testRecipe:readable */ // eslint-disable-line no-unused-vars
include('..\\..\\helpers\\menu_xxx.js');
/* global _menu:readable */
include('..\\..\\helpers\\helpers_xxx.js');
/* global MF_STRING:readable, MF_GRAYED:readable, popup:readable, folders:readable, VK_CONTROL:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global WshShell:readable, _isFile:readable, _open:readable, utf8:readable, _save:readable, _explorer:readable, _jsonParseFileCheck:readable, _parseAttrFile:readable, _runCmd:readable, findRecursivefile:readable */
include('..\\..\\helpers\\helpers_xxx_properties.js');
/* global overwriteProperties:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global _b:readable, _q:readable, _p:readable, isJSON:readable */

const recipeMenu = new _menu();

function createRecipeMenu(parent) {
	recipeMenu.clear(true); // Reset on every call
	const files = findRecursivefile('*.json', [folders.xxx + 'presets\\Search by\\recipes']);
	const properties = parent.buttonsProperties;
	const data = JSON.parse(properties.data[1]);
	const tags = JSON.parse(properties.tags[1]);
	const currRecipeFile = properties.recipe[1];
	// Hide test files first
	const testRegex = /test_.*|int_.*/i;
	files.forEach((file) => {
		if (testRegex.test(file.split('\\').pop())) {
			const attr = _parseAttrFile(file);
			if (attr && !attr.Hidden) { _runCmd('attrib +H ' + _q(file), true); }
		}
	});
	// Header
	recipeMenu.newEntry({ entryText: 'Set recipe file: (Ctrl + Click to hide)', func: null, flags: MF_GRAYED });
	recipeMenu.newEntry({ entryText: 'sep' });
	recipeMenu.newEntry({
		entryText: 'Create recipe file with current config', func: () => {
			const recipe = { name: '' };
			// Retrieve allowed keys
			const excludedKeys = new Set(['name', 'properties', 'panelProperties', 'theme', 'recipe', 'bPoolFiltering', 'bProfile', 'bShowQuery', 'bShowFinalSelection', 'bBasicLogging', 'bStartLogging', 'bSearchDebug', 'bCreatePlaylist']);
			recipeAllowedKeys.forEach((key) => {
				if (!excludedKeys.has(key)) {
					const check = properties[key][2];
					if (check && typeof check === 'object' && Object.hasOwn(check, 'func') && check.func === isJSON) {
						recipe[key] = JSON.parse(properties[key][1]);
					} else {
						recipe[key] = properties[key][1];
					}
				}
			});
			// Recipe obj
			let input = '';
			try { input = utils.InputBox(window.ID, 'Enter Recipe name', 'Search by distance', 'my recipe', true).toString(); }
			catch (e) { return; }
			if (!input.length) { return; }
			recipe.name = input;
			const filePath = folders.xxx + 'presets\\Search by\\recipes\\' + input + '.json';
			if (_isFile(filePath) && WshShell.Popup('Already exists a file with such name, overwrite?', 0, window.Name, popup.question + popup.yes_no) === popup.no) { return; }
			if (WshShell.Popup('Include tag remapping?', 0, window.Name, popup.question + popup.yes_no) === popup.no) {
				for (let key in recipe.tags) {
					delete recipe.tags[key].tf;
					delete recipe.tags[key].type;
				}
			}
			if (WshShell.Popup('Also add additional variables?\n' + [...recipePropertiesAllowedKeys].joinEvery(', ', 4), 0, window.Name, popup.question + popup.yes_no) === popup.yes) {
				recipe.properties = {};
				Object.keys(properties).forEach((rKey) => {
					if (!recipePropertiesAllowedKeys.has(rKey)) { return; }
					const check = properties[rKey][2];
					if (check && typeof check === 'object' && Object.hasOwn(check, 'func') && check.func === isJSON) {
						recipe.properties[rKey] = JSON.parse(properties[rKey][1]);
					} else {
						recipe.properties[rKey] = properties[rKey][1];
					}
				});
			}
			const bDone = _save(filePath, JSON.stringify(recipe, null, '\t').replace(/\n/g, '\r\n'));
			if (!bDone) { fb.ShowPopupMessage('Error saving recipe file:' + filePath, 'Search by distance'); }
			else { _explorer(filePath); }
		}
	});
	{	// Recipe tools
		const menuName = recipeMenu.newMenu('More options...');
		{	// Readme
			const readmePath = folders.xxx + 'helpers\\readme\\search_by_distance_recipes_themes.txt';
			recipeMenu.newEntry({
				menuName, entryText: 'Open readme...', func: () => {
					const readme = _open(readmePath, utf8); // Executed on script load
					if (readme.length) { fb.ShowPopupMessage(readme, window.Name); }
					else { console.log('Readme not found: ' + readmePath); }
				}
			});
		}
		recipeMenu.newEntry({
			menuName, entryText: 'Open recipes folder', func: () => {
				if (_isFile(properties.recipe[1])) { _explorer(properties.recipe[1]); } // Open current file
				else { _explorer(folders.xxx + 'presets\\Search by\\recipes'); } // or folder
			}
		});
		const hiddenFilesNum = files.reduce((total, file) => {
			if (!testRegex.test(file.split('\\').pop())) {
				const attr = _parseAttrFile(file);
				return attr && attr.Hidden ? total + 1 : total;
			} else { return total; }
		}, 0);
		recipeMenu.newEntry({
			menuName, entryText: 'Unhide all recipes\t' + _b(hiddenFilesNum + ' files'), func: () => {
				const hiddenFiles = files.filter((file) => { const attr = _parseAttrFile(file); return attr && attr.Hidden; });
				hiddenFiles.forEach((file) => {
					if (!testRegex.test(file.split('\\').pop())) {
						if (_runCmd('attrib -H ' + _q(file), false)) { console.log('Unhide: ' + file); }
					}
				});
			}, flags: hiddenFilesNum ? MF_STRING : MF_GRAYED
		});
	}
	recipeMenu.newEntry({ entryText: 'sep' });
	recipeMenu.newEntry({
		entryText: 'None' + (currRecipeFile && !_isFile(currRecipeFile) && !_isFile(recipePath + currRecipeFile)
			? '\t(recipe not found)'
			: ''),
		func: () => {
			properties.recipe[1] = '';
			data.recipe = 'None';
			data.forcedTheme = '';
			properties.data[1] = JSON.stringify(data);
			overwriteProperties(properties);
		}
	});
	recipeMenu.newEntry({ entryText: 'sep' });
	// List
	const options = [];
	files.forEach((file) => {
		// Omit hidden files
		const attr = _parseAttrFile(file);
		if (attr && attr.Hidden) { return; }
		// List files, with full path or relative path (portable)
		options.push(_isFile(fb.FoobarPath + 'portable_mode_enabled') && file.indexOf(fb.ProfilePath) !== -1 ? (fb.ProfilePath.indexOf('profile') !== -1 ? file.replace(fb.ProfilePath, '.\\profile\\') : file.replace(fb.ProfilePath, '.\\')) : file);
	});
	const menus = [];
	const names = {};
	options.forEach((file) => {
		const recipe = _jsonParseFileCheck(file, 'Recipe json', 'Search by distance', utf8);
		if (!recipe) { return; }
		const name = Object.hasOwn(recipe, 'name') ? recipe.name : utils.SplitFilePath(file)[1];
		let theme = null;
		if (Object.hasOwn(recipe, 'theme')) {
			if (_isFile(recipe.theme)) { theme = _jsonParseFileCheck(recipe.theme, 'Theme json', 'Search by distance', utf8); }
			else if (_isFile(folders.xxx + 'presets\\Search by\\themes\\' + recipe.theme)) { theme = _jsonParseFileCheck(folders.xxx + 'presets\\Search by\\themes\\' + recipe.theme, 'Recipe json', 'Search by distance', utf8); }
			else { console.log('Forced theme json file (by recipe) not found: ' + recipe.theme); fb.ShowPopupMessage('Forced theme json file (by recipe) not found:\n' + recipe.theme, 'Search by distance'); }
		}
		const themeName = theme ? theme.name + ' (forced by recipe)' : ''; // Recipe may overwrite theme
		if (Object.hasOwn(names, name)) { names[name]++; }
		else { names[name] = 1; }
		const result = testRecipe({ json: recipe, baseTags: tags });
		const entryText = (names[name] === 1 ? name : name + ' ' + _p(names[name])) + (!result.valid ? '\t(error)' : '');
		menus.push(entryText);
		recipeMenu.newEntry({
			entryText, func: () => {
				if (utils.IsKeyPressed(VK_CONTROL)) {
					_runCmd('attrib +H ' + _q(file), false);
					if (properties.recipe[1] === file) { // Set to none when hiding current recipe
						properties.recipe[1] = '';
						data.recipe = 'None';
						data.forcedTheme = '';
						properties.data[1] = JSON.stringify(data);
						overwriteProperties(properties);
						parent.recipe = { recipe: null, name: '' }; // Update tooltip
					}
				} else if (!result.valid) { // Don't allow to use a recipe with errors, show report instead
					console.popup(result.report.join('\n\t- '), 'Recipe error');
				} else {
					properties.recipe[1] = file;
					data.recipe = name;
					data.forcedTheme = themeName;
					properties.data[1] = JSON.stringify(data);
					overwriteProperties(properties);
					parent.recipe = { recipe: processRecipePlaceholder(file, tags), name: file }; // Update tooltip
				}
			}
		});
	});
	recipeMenu.newCheckMenuLast(() => {
		const idx = options.indexOf(currRecipeFile);
		return idx !== -1 ? idx + 1 : 0;
	}, menus.length + 2);
	return recipeMenu;
}