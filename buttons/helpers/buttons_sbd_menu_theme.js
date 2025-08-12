'use strict';
//11/08/25

/* exported createThemeMenu */

/* global processRecipePlaceholder:readable, getCountryISO:readable, getLocaleFromId:readable, sbd:readable */

include('..\\..\\helpers\\menu_xxx.js');
/* global _menu:readable */
include('..\\..\\helpers\\helpers_xxx.js');
/* global MF_STRING:readable, MF_GRAYED:readable, popup:readable, globTags:readable , VK_SHIFT:readable */
include('..\\..\\helpers\\buttons_xxx.js');
/* global showButtonReadme:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global WshShell:readable, _isFile:readable, utf8:readable, _save:readable, _explorer:readable, _jsonParseFileCheck:readable, _parseAttrFile:readable, _runCmd:readable, findRecursiveFile:readable, _resolvePath:readable */
include('..\\..\\helpers\\helpers_xxx_properties.js');
/* global overwriteProperties:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global _b:readable, _q:readable */
include('..\\..\\helpers\\helpers_xxx_tags.js');
/* global getHandleListTags:readable */

const themeMenu = new _menu();

function createThemeMenu(parent) {
	themeMenu.clear(true); // Reset on every call
	const files = findRecursiveFile('*.json', [sbd.themesPath]);
	const properties = parent.buttonsProperties;
	const tags = JSON.parse(properties.tags[1]);
	const data = JSON.parse(properties.data[1]);
	const filePaths = JSON.parse(properties.filePaths[1]);
	const testRegex = /test_.*|int_.*/i;
	// Recipe forced theme?
	let bHasForcedTheme = false;
	let forcedTheme = null;
	let forcedThemePath = '';
	if (properties.recipe[1].length) {
		const recipe = processRecipePlaceholder(properties.recipe[1], tags);
		bHasForcedTheme = recipe && Object.hasOwn(recipe, 'theme');
		if (bHasForcedTheme) {
			if (_isFile(recipe.theme)) { forcedTheme = _jsonParseFileCheck(recipe.theme, 'Theme json', sbd.name, utf8); forcedThemePath = recipe.theme; }
			else if (_isFile(sbd.themesPath + recipe.theme)) {
				forcedThemePath = sbd.themesPath + recipe.theme;
				forcedTheme = _jsonParseFileCheck(forcedThemePath, 'Theme json', sbd.name, utf8);
			} else {
				console.popup(sbd.name + ': Forced theme json file (by recipe) not found\n\t ' + recipe.theme, sbd.name);
			}
		}
		if (forcedThemePath !== data.forcedTheme) {
			data.forcedTheme = recipe.theme;
			properties.data[1] = JSON.stringify(data);
			overwriteProperties(properties);
		}
	}
	// Header
	themeMenu.newEntry({ entryText: 'Set theme file: (Shift + Click to hide)', func: null, flags: MF_GRAYED });
	themeMenu.newSeparator();
	// Create theme
	themeMenu.newEntry({
		entryText: 'Create theme file with selected track', func: () => {
			// Tag names
			const themeTagsKeys = Object.keys(tags).filter((k) => !tags[k].type.includes('virtual') || tags[k].type.includes('tfRemap'));
			const themeTagsTf = themeTagsKeys.map((k) => tags[k].tf.filter(Boolean));
			// Retrieve values
			const selHandleList = new FbMetadbHandleList(fb.GetFocusItem(true));
			const themeTagsValues = themeTagsTf.map((tf) => getHandleListTags(selHandleList, tf, { bMerged: true }).flat().filter(Boolean));
			// Force data type
			themeTagsKeys.forEach((key, i) => {
				if (tags[key].type.includes('number')) {
					themeTagsValues[i] = themeTagsValues[i].map((val) => Number(val));
				}
			});
			// Tags obj
			const themeTags = {};
			themeTagsKeys.forEach((key, i) => { themeTags[key] = themeTagsValues[i]; });
			// artistRegion Iso
			const localeTags = getHandleListTags(selHandleList, [globTags.locale]).flat().map((tag) => tag.filter(Boolean).pop());
			const worldMapData = _jsonParseFileCheck(filePaths.worldMapArtists, 'Tags json', window.Name, utf8);
			localeTags.forEach((localeTag) => {
				if (localeTag) { themeTags.artistRegion.push(getCountryISO(localeTag)); }
				else if (worldMapData) {
					const artists = getHandleListTags(selHandleList, [globTags.artist], { bMerged: true }).flat(Infinity);
					if (artists && artists.length) {
						const data = getLocaleFromId([...new Set(artists)], worldMapData);
						data.forEach((obj) => {
							if (obj.iso.length) { themeTags.artistRegion.push(obj.iso); }
						});
					}
				}
			});
			// Theme obj
			let input = '';
			try { input = utils.InputBox(window.ID, 'Enter theme name', sbd.name, 'my theme', true); }
			catch (e) { return; } // eslint-disable-line no-unused-vars
			if (!input.length) { return; }
			const theme = { name: input, tags: [] };
			theme.tags.push(themeTags);
			const filePath = sbd.themesPath + input + '.json';
			if (_isFile(filePath) && WshShell.Popup('Already exists a file with such name, overwrite?', 0, window.Name, popup.question + popup.yes_no) === popup.no) { return; }
			const bDone = _save(filePath, JSON.stringify(theme, null, '\t').replace(/\n/g, '\r\n'));
			if (!bDone) { fb.ShowPopupMessage('Error saving theme file:' + filePath, sbd.name); }
			else { _explorer(filePath); }
		}, flags: fb.GetFocusItem(true) ? MF_STRING : MF_GRAYED
	});
	{	// Theme tools
		const menuName = themeMenu.newMenu('More options...');
		themeMenu.newEntry({ menuName, entryText: 'Readme...', func: () => showButtonReadme(sbd.readmes.recipes) });
		themeMenu.newEntry({
			menuName, entryText: 'Themes folder...', func: () => {
				if (_isFile(properties.theme[1])) { _explorer(properties.theme[1]); } // Open current file
				else { _explorer(sbd.themesPath); } // or folder
			}
		});
		const hiddenFilesNum = files.reduce((total, file) => { const attr = _parseAttrFile(file); return attr && attr.Hidden ? total + 1 : total; }, 0);
		themeMenu.newEntry({
			menuName, entryText: 'Unhide all themes\t' + _b(hiddenFilesNum + ' files'), func: () => {
				const hiddenFiles = files.filter((file) => { const attr = _parseAttrFile(file); return attr && attr.Hidden; });
				hiddenFiles.forEach((file) => {
					if (!testRegex.test(file.split('\\').pop())) {
						if (_runCmd('attrib -H ' + _q(file), false)) { console.log(sbd.name + ': Unhidden theme\n\t ' + file); }
					}
				});
			}, flags: hiddenFilesNum ? MF_STRING : MF_GRAYED
		});
	}
	themeMenu.newSeparator();
	themeMenu.newEntry({
		entryText: 'None', func: () => {
			properties.theme[1] = '';
			data.theme = 'None';
			properties.data[1] = JSON.stringify(data);
			overwriteProperties(properties);
		}, flags: !bHasForcedTheme ? MF_STRING : MF_GRAYED
	});
	themeMenu.newSeparator();
	// All entries
	const tagsToCheck = Object.keys(tags).filter((k) => !tags[k].type.includes('virtual') || tags[k].type.includes('tfRemap'));
	// List
	const options = [];
	files.forEach((file) => {
		// Omit hidden files
		const attr = _parseAttrFile(file);
		if (attr && attr.Hidden) { return; }
		const theme = _jsonParseFileCheck(file, 'Theme json', sbd.name, utf8);
		if (!theme) { return; }
		// Check
		// Theme tags must contain at least all the user tags
		const tagCheck = Object.hasOwn(theme, 'tags')
			? theme.tags.findIndex((tagArr) => !new Set(Object.keys(tagArr)).isSuperset(new Set(tagsToCheck)))
			: 0;
		const bCheck = Object.hasOwn(theme, 'name') && tagCheck === -1;
		if (!bCheck) {
			console.log(
				sbd.name + ': Theme is missing some keys\n\t' +
				'Theme: ' + theme.name + (file ? ' (' + file + ')' : '') + '\n\t ' +
				'Keys: ' + (Object.hasOwn(theme, 'tags') && tagCheck !== -1
					? [...new Set(tagsToCheck).difference(new Set(Object.keys(theme.tags[tagCheck])))]
					: 'name')
			);
			return;
		}
		// List files, with full path or relative path (portable)
		options.push(file.replace(fb.ProfilePath, '.\\profile\\'));
	});
	const menus = [];
	if (options.length) {
		options.forEach((file) => {
			const theme = _jsonParseFileCheck(file, 'Theme json', sbd.name, utf8);
			if (!theme) { return; }
			const bIsForcedTheme = forcedTheme && forcedThemePath === file;
			const name = theme.name + (bIsForcedTheme ? ' (forced by recipe)' : ''); // Recipe may overwrite theme
			let i = 1;
			const duplIdx = menus.indexOf(theme.name);
			const entryText = name + (duplIdx === -1 ? '' : ' (' + ++i + ')');
			menus.push(entryText);
			themeMenu.newEntry({
				entryText, func: () => {
					if (utils.IsKeyPressed(VK_SHIFT)) {
						_runCmd('attrib +H ' + _q(_resolvePath(file)), false);
						if (_resolvePath(properties.theme[1]) === _resolvePath(file)) { // Set to none when hiding current recipe
							properties.theme[1] = '';
							data.theme = 'None';
							properties.data[1] = JSON.stringify(data);
							overwriteProperties(properties);
						}
					} else {
						properties.theme[1] = file;
						data.theme = theme.name;
						properties.data[1] = JSON.stringify(data);
						overwriteProperties(properties);
					}
				}, flags: !bHasForcedTheme ? MF_STRING : MF_GRAYED
			});
		});
	} else {
		menus.push('- No theme files found -');
		themeMenu.newEntry({ entryText: '- No theme files found -', func: null, flags: MF_GRAYED });
	}
	themeMenu.newCheckMenuLast(() => {
		const idx = options.indexOf(forcedTheme ? forcedThemePath : properties.theme[1]);
		return idx !== -1 ? idx + 1 : 0;
	}, menus.length + 2);
	return themeMenu;
}