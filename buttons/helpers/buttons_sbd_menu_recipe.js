'use strict';
//25/09/25

include('..\\..\\helpers\\menu_xxx.js');
include('..\\..\\helpers\\helpers_xxx.js');
include('..\\..\\helpers\\helpers_xxx_file.js');

/* exported createRecipeMenu, chooseRecipeMenu */

/* global processRecipePlaceholder:readable, recipeAllowedKeys:readable, recipePropertiesAllowedKeys:readable, testRecipe:readable, searchByDistance:readable, sbd:readable */

include('..\\..\\helpers\\menu_xxx.js');
/* global _menu:readable */
include('..\\..\\helpers\\menu_xxx_extras.js');
/* global _createSubMenuEditEntries:readable */
include('..\\..\\helpers\\helpers_xxx.js');
/* global MF_STRING:readable, MF_GRAYED:readable, popup:readable, VK_CONTROL:readable */
include('..\\..\\helpers\\buttons_xxx.js');
/* global showButtonReadme:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global WshShell:readable, _isFile:readable,utf8:readable, _save:readable, _explorer:readable, _jsonParseFileCheck:readable, _parseAttrFile:readable, _runCmd:readable, findRecursiveFile:readable, _resolvePath:readable, _recycleFile:readable, sanitizePath:readable, sanitize:readable, _deleteFile:readable, _copyFile:readable */
include('..\\..\\helpers\\helpers_xxx_properties.js');
/* global overwriteProperties:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global _b:readable, _q:readable, _p:readable, isJSON:readable, forEachNested:readable, _ps:readable */

const recipeMenu = new _menu();

function createRecipeMenu(parent) {
	recipeMenu.clear(true); // Reset on every call
	const files = findRecursiveFile('*.json', [sbd.recipesPath]);
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
	// Helpers
	const newRecipe = (name = '') => {
		const recipe = { name };
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
		if (!recipe.name.length) {
			try { recipe.name = utils.InputBox(window.ID, 'Enter Recipe name:', sbd.name, 'my recipe', true).toString(); }
			catch (e) { return; } // eslint-disable-line no-unused-vars
			if (!recipe.name.length) { return; }
		}
		const filePath = sbd.recipesPath + recipe.name + '.json';
		if (_isFile(filePath) && WshShell.Popup('Already exists a file with such name, overwrite?', 0, window.Name + _ps(window.ScriptInfo.Name), popup.question + popup.yes_no) === popup.no) { return; }
		if (WshShell.Popup('Include tag remapping?', 0, window.Name + _ps(window.ScriptInfo.Name), popup.question + popup.yes_no) === popup.no) {
			for (let key in recipe.tags) {
				delete recipe.tags[key].tf;
				delete recipe.tags[key].type;
			}
		}
		if (WshShell.Popup('Also add additional variables?\n' + [...recipePropertiesAllowedKeys].joinEvery(', ', 4), 0, window.Name + _ps(window.ScriptInfo.Name), popup.question + popup.yes_no) === popup.yes) {
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
		if (!bDone) { fb.ShowPopupMessage('Error saving recipe file:' + filePath, sbd.name); }
		else { _explorer(filePath); }
	};
	const unsetRecipe = (file) => {
		if (_resolvePath(properties.recipe[1]) === _resolvePath(file)) { // Set to none when hiding current recipe
			properties.recipe[1] = '';
			data.recipe = 'None';
			data.forcedTheme = '';
			properties.data[1] = JSON.stringify(data);
			overwriteProperties(properties);
			parent.recipe = { recipe: null, name: '' }; // Update tooltip
		}
	};
	// Header
	recipeMenu.newEntry({ entryText: 'Set recipe file: (Ctrl + Click to hide)', func: null, flags: MF_GRAYED });
	recipeMenu.newSeparator();
	recipeMenu.newEntry({ entryText: 'New recipe (current settings)', func: newRecipe });
	recipeMenu.newSeparator();
	recipeMenu.newEntry({
		entryText: 'None' + (currRecipeFile && !_isFile(currRecipeFile) && !_isFile(sbd.recipesPath + currRecipeFile)
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
	recipeMenu.newSeparator();
	// List
	const options = [];
	files.forEach((file) => {
		// Omit hidden files
		const attr = _parseAttrFile(file);
		if (attr && attr.Hidden) { return; }
		// List files with relative path
		options.push(file.replace(fb.ProfilePath, '.\\profile\\'));
	});
	const menus = [];
	const recipes = [];
	const names = {};
	if (options.length) {
		options.forEach((file) => {
			const recipe = _jsonParseFileCheck(file, 'Recipe json', sbd.name, utf8);
			if (!recipe) { return; }
			const name = Object.hasOwn(recipe, 'name') ? recipe.name : utils.SplitFilePath(file)[1];
			const key = name + '\t' + _p(recipe.method);
			recipes.push({ name, path: file, ...recipe });
			let theme = null;
			if (Object.hasOwn(recipe, 'theme')) {
				if (_isFile(recipe.theme)) { theme = _jsonParseFileCheck(recipe.theme, 'Theme json', sbd.name, utf8); }
				else if (_isFile(sbd.themesPath + recipe.theme)) { theme = _jsonParseFileCheck(sbd.themesPath + recipe.theme, 'Recipe json', sbd.name, utf8); }
				else { console.log(sbd.name + ': Forced theme json file (by recipe) not found\n\t ' + recipe.theme); fb.ShowPopupMessage('Forced theme json file (by recipe) not found:\n' + recipe.theme, sbd.name); }
			}
			const themeName = theme ? theme.name + ' (forced by recipe)' : ''; // Recipe may overwrite theme
			if (Object.hasOwn(names, key)) { names[key]++; }
			else { names[key] = 1; }
			const result = testRecipe({ json: recipe, baseTags: tags });
			const entryText = (names[key] === 1 ? name : name + ' ' + _p(names[key])) + (!result.valid ? '\t(error)' : '\t' + _p(recipe.method));
			menus.push(entryText);
			recipeMenu.newEntry({
				entryText, func: () => {
					if (utils.IsKeyPressed(VK_CONTROL)) {
						_runCmd('attrib +H ' + _q(_resolvePath(file)), false);
						unsetRecipe(file); // Set to none when hiding current recipe
					} else if (!result.valid) { // Don't allow to use a recipe with errors, show report instead
						console.popup(result.report.join('\n\t- '), 'Recipe error');
					} else {
						properties.recipe[1] = file;
						data.recipe = name;
						data.forcedTheme = themeName;
						properties.data[1] = JSON.stringify(data);
						overwriteProperties(properties);
						parent.recipe = { recipe: processRecipePlaceholder(file, tags), name: file }; // Update tooltip
						forEachNested(recipe, (value, key, obj) => {
							if (value === null) { obj[key] = Infinity; }
						});
					}
				}
			});
		});
	} else {
		menus.push('- No recipe files found -');
		recipeMenu.newEntry({ entryText: '- No recipe files found -', func: null, flags: MF_GRAYED });
	}
	recipeMenu.newCheckMenuLast(() => {
		const idx = options.indexOf(currRecipeFile);
		return idx !== -1 ? idx + 1 : 0;
	}, menus.length + 2);
	{	// Edit entries
		const menuName = 'Edit recipes';
		recipeMenu.newSeparator();
		_createSubMenuEditEntries(recipeMenu, void (0), {
			name: 'Recipes',
			subMenuName: menuName,
			list: recipes,
			defaults: findRecursiveFile(
				'*.json',
				[sbd.defaultRecipesPath]
			).map((path) => {
				const recipe = recipes.find((recipe) => recipe.path === path.replace(sbd.defaultRecipesPath, sbd.recipesPath).replace(fb.ProfilePath, '.\\profile\\'));
				return recipe ? { ...recipe, path } : null;
			}).filter(Boolean).concat({ name: 'dummy' }),
			input: newRecipe,
			bMove: false,
			bNumbered: true,
			onBtnUp: (entries, modified, event) => {
				if (event === 'delete' && _isFile(modified.path)) {
					_recycleFile(modified.path);
					unsetRecipe(modified.path); // Set to none when deleting current recipe
				} else if (event === 'edit' && _isFile(modified.path)) {
					const bDone = _save(
						sanitizePath(modified.path),
						JSON.stringify(modified, (key, value) => key === 'path' ? void (0) : value, '\t').replace(/\n/g, '\r\n')
					);
					if (!bDone) { fb.ShowPopupMessage('Error saving recipe file:' + modified.path, sbd.name); }
				} else if (event === 'clone') {
					modified.path = utils.SplitFilePath(modified.path)[0] + sanitize(modified.name) + '.json';
					const bDone = _save(
						modified.path,
						JSON.stringify(modified, (key, value) => key === 'path' ? void (0) : value, '\t').replace(/\n/g, '\r\n')
					);
					if (!bDone) { fb.ShowPopupMessage('Error saving recipe file:' + modified.path, sbd.name); }
				} else if (event === 'defaults') {
					const defaultFiles = findRecursiveFile(
						'*.json',
						[sbd.defaultRecipesPath]
					).map((from) => {
						return { from, to: from.replace(sbd.defaultRecipesPath, sbd.recipesPath) };
					});
					const answer = WshShell.Popup('Delete user created recipes?\n(They will be sent to recycle bin)', 0, sbd.name, popup.question + popup.yes_no);
					if (answer === popup.yes) {
						const defaultFilePaths = new Set(defaultFiles.map((file) => file.to));
						findRecursiveFile(
							'*.json',
							[sbd.recipesPath]
						).forEach((path) => !defaultFilePaths.has(path) && _recycleFile(path));
					}
					defaultFiles.forEach((file) => {
						if (_isFile(file.to)) { _deleteFile(file.to); }
						_copyFile(file.from, file.to, true);
					});
				} else if (event === 'reset') {
					if (modified.path) {
						_deleteFile(modified.path.replace(sbd.defaultRecipesPath, sbd.recipesPath));
						_copyFile(modified.path, modified.path.replace(sbd.defaultRecipesPath, sbd.recipesPath), true);
					}
				}
			}
		});
		recipeMenu.newSeparator(menuName);
		const subMenuName = recipeMenu.newMenu('Hide recipes by', menuName);
		[
			{ name: 'Search method', bSep: true },
			{ name: 'GRAPH', key: 'method', match: 'GRAPH' }, { name: 'DYNGENRE', key: 'method', match: 'DYNGENRE' }, { name: 'WEIGHT', key: 'method', match: 'WEIGHT' },
			{ name: 'Theme', bSep: true },
			{ name: 'With Theme', key: 'theme', bPresent: true }, { name: 'No Theme', key: 'theme', bPresent: false },
			{ name: 'Query', bSep: true },
			{ name: 'With Query', key: 'forcedQuery', bPresent: true }, { name: 'No Query', key: 'forcedQuery', bPresent: false }
		]
			.forEach((opt) => {
				if (opt.bSep) {
					if (!recipeMenu.isLastEntry(subMenuName, 'menu')) { recipeMenu.newSeparator(subMenuName); }
					recipeMenu.newEntry({ menuName: subMenuName, entryText: opt.name, flags: MF_GRAYED });
					recipeMenu.newSeparator(subMenuName);
					return;
				}
				const bPresent = Object.hasOwn(opt, 'bPresent');
				const fileNum = bPresent
					? recipes.reduce((acc, recipe) => opt.bPresent === Object.hasOwn(recipe, opt.key) ? ++acc : acc, 0)
					: recipes.reduce((acc, recipe) => opt.match === recipe[opt.key] ? ++acc : acc, 0);
				recipeMenu.newEntry({
					menuName: subMenuName, entryText: opt.name + '\t' + _b(fileNum + ' files'), func: () => {
						recipes.forEach((recipe) => {
							if (bPresent && opt.bPresent === Object.hasOwn(recipe, opt.key) || !bPresent && opt.match === recipe[opt.key]) {
								_runCmd('attrib +H ' + _q(_resolvePath(recipe.path)), false);
								unsetRecipe(recipe.path); // Set to none when hiding current recipe
							}
						});
					}, flags: fileNum ? MF_STRING : MF_GRAYED
				});
			});
		const hiddenFilesNum = files.reduce((total, file) => {
			if (!testRegex.test(file.split('\\').pop())) {
				const attr = _parseAttrFile(file);
				return attr && attr.Hidden ? total + 1 : total;
			} else { return total; }
		}, 0);
		recipeMenu.newEntry({
			menuName, entryText: 'Show hidden recipes\t' + _b(hiddenFilesNum + ' files'), func: () => {
				const hiddenFiles = files.filter((file) => { const attr = _parseAttrFile(file); return attr && attr.Hidden; });
				hiddenFiles.forEach((file) => {
					if (!testRegex.test(file.split('\\').pop())) {
						if (_runCmd('attrib -H ' + _q(file), false)) { console.log(sbd.name + ': Show recipe\n\t ' + file); }
					}
				});
			}, flags: hiddenFilesNum ? MF_STRING : MF_GRAYED
		});
		recipeMenu.newSeparator(menuName);
		recipeMenu.newEntry({
			menuName, entryText: 'Open recipes folder...', func: () => {
				if (_isFile(properties.recipe[1])) { _explorer(properties.recipe[1]); } // Open current file
				else { _explorer(sbd.recipesPath); } // or folder
			}
		});
	}
	recipeMenu.newSeparator();
	recipeMenu.newEntry({ entryText: 'Readme...', func: () => showButtonReadme(sbd.readmes.recipes) });
	return recipeMenu;
}

function chooseRecipeMenu(parent) {
	recipeMenu.clear(true); // Reset on every call
	const properties = parent.buttonsProperties;
	const recipes = findRecursiveFile('*.json', [sbd.recipesPath])
		.map((path) => {
			// Omit hidden files
			const attr = _parseAttrFile(path);
			if (attr && attr.Hidden) { return null; }
			path = path.replace(fb.ProfilePath, '.\\profile\\');
			const recipe = _jsonParseFileCheck(path, 'Recipe json', sbd.name, utf8);
			if (!recipe) { return null; }
			if (!testRecipe({ json: recipe, baseTags: JSON.parse(properties.tags[1]) }).valid) { return null; }
			const name = Object.hasOwn(recipe, 'name')
				? recipe.name
				: utils.SplitFilePath(path)[1];
			return { name, path, ...recipe };
		}).filter(Boolean);
	const currRecipeFile = properties.recipe[1];
	recipeMenu.newEntry({ entryText: 'Select settings for search:', flags: MF_GRAYED });
	recipeMenu.newSeparator();
	recipeMenu.newEntry({
		entryText: 'Current settings', func: () => {
			searchByDistance({ properties: properties, theme: properties.theme[1], recipe: properties.recipe[1], parent }); // All set according to properties panel!
		}
	});
	if (currRecipeFile) {
		recipeMenu.newSeparator();
		recipeMenu.newEntry({
			entryText: 'Current settings (discard recipe)', func: () => {
				searchByDistance({ properties: properties, theme: properties.theme[1], recipe: '', parent }); // All set according to properties panel!
			}
		});
	}
	recipeMenu.newSeparator();
	recipes.forEach((recipe) => {
		const entryText = recipe.name + '\t' + _p(recipe.method);
		recipeMenu.newEntry({
			entryText, func: () => {
				searchByDistance({ properties, theme: properties.theme[1], recipe: recipe.path, parent });
			}
		});
	});
	if (currRecipeFile) {
		recipeMenu.newCheckMenuLast(() => recipes.findIndex((recipe) => recipe.path === currRecipeFile), recipes);
	}
	return recipeMenu;
}