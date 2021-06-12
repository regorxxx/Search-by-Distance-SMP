include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\menu_xxx.js');
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\helpers_xxx_file.js');

const themeMenu = new _menu();

function createThemeMenu(parent) {
	themeMenu.clear(true); // Reset on every call
	const files = findRecursivefile('*.json', [fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\presets\\Search by\\themes'])
	const properties = parent.buttonsProperties;
	const data = JSON.parse(properties.data[1]);
	// Recipe forced theme?
	let forcedTheme = null;
	if (properties.recipe[1].length) {
		const recipe = _isFile(properties.recipe[1]) ? _jsonParseFile(properties.recipe[1]) : _jsonParseFile(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\presets\\Search by\\recipes\\' + properties.recipe[1]);
		if (recipe && recipe.hasOwnProperty('theme')) {
			if (_isFile(recipe.theme)) {forcedTheme = _jsonParseFile(recipe.theme);}
			else if (_isFile(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\presets\\Search by\\themes\\' + recipe.theme)) {forcedTheme = _jsonParseFile(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\presets\\Search by\\themes\\' + recipe.theme);}
		}
	}
	// Header
	themeMenu.newEntry({entryText: 'Set theme file:', func: null, flags: MF_GRAYED});
	themeMenu.newEntry({entryText: 'sep'});
	themeMenu.newEntry({entryText: 'None', func: () => {
		properties.theme[1] = '';
		const themeName = forcedTheme ? forcedTheme.name + ' (forced by recipe)' : 'None'; // Recipe may overwrite theme
		parent.description = 'Search according to variables at properties.\n(Shift + L. Click to set theme)\t -> ' + themeName + '\n(Ctrl + L. Click to set recipe)\t -> ' + data.recipe;
		data.tooltip = parent.description;
		data.theme = 'None'; // Recipe may overwrite theme
		properties.data[1] = JSON.stringify(data);
		overwriteProperties(properties);
	}});
	themeMenu.newEntry({entryText: 'sep'});
	// All entries
	const tagsToCheck = ['genre', 'style', 'mood', 'key', 'date', 'bpm', 'composer', 'customStr', 'customNum'];
	// List
	const options = [];
	files.forEach((file) => {
		const theme = _jsonParseFile(file);
		if (!theme) {console.log('Recipe file is not valid:' + file); return;}
		// Check
		const tagCheck = theme.hasOwnProperty('tags') ? theme.tags.findIndex((tagArr) => {isArrayEqual(Object.keys(tagArr), tagsToCheck)}) : 0;
		const bCheck = theme.hasOwnProperty('name') && tagCheck === -1;;
		if (!bCheck) {
			console.log('File is not a valid theme: ' + (theme.hasOwnProperty('tags') && tagCheck !== -1 ? [...new Set(tagsToCheck).difference(new Set(Object.keys(theme.tags[tagCheck])))] : file));
			return;
		}
		// List
		options.push(file);
	});
	const menus = [];
	options.forEach((file) => {
		const theme = _jsonParseFile(file);
		const name = forcedTheme ? forcedTheme.name + ' (forced by recipe)' : theme.name; // Recipe may overwrite theme
		let i = 1;
		const entryText = menus.indexOf(theme.name) === -1 ? theme.name : theme.name + ' (' + ++i + ')';
		menus.push(entryText);
		themeMenu.newEntry({entryText, func: () => {
			properties.theme[1] = file;
			parent.description = 'Search according to variables at properties.\n(Shift + L. Click to set theme)\t -> ' + name + '\n(Ctrl + L. Click to set recipe)\t -> ' + data.recipe;
			data.tooltip = parent.description;
			data.theme = theme.name;
			properties.data[1] = JSON.stringify(data);
			overwriteProperties(properties);
		}});
	});
	themeMenu.newCheckMenu(themeMenu.getMainMenuName(), 'None', menus[menus.length - 1], () => {
		const idx = options.indexOf(properties.theme[1]);
		return idx !== -1 ? idx + 1 : 0;
	});
	// themeMenu.newCheckMenu(themeMenu.getMainMenuName(), 'None', options[options.length - 1], () => {
		// const idx = options.indexOf((file) => {return file === properties.theme[1];});
		// return (idx !== -1 ? 1 + idx : 0);
	// });
	return themeMenu;
}