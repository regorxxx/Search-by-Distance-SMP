include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\menu_xxx.js');
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\helpers_xxx_file.js');

function createConfigMenu(parent) {
	const menu = new _menu(); // To avoid collisions with other buttons and check menu
	const properties = parent.buttonsProperties;
	const data = JSON.parse(properties.data[1]);
	let recipe = {};
	// Recipe forced theme?
	if (properties.recipe[1].length) {
		recipe = _isFile(properties.recipe[1]) ? _jsonParseFile(properties.recipe[1]) : _jsonParseFile(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\presets\\Search by\\recipes\\' + properties.recipe[1]);
		if (!recipe) {recipe = {};}
	}
	// Header
	menu.newEntry({entryText: 'Set config (may be overwritten by recipe):', func: null, flags: MF_GRAYED});
	menu.newEntry({entryText: 'sep'});
	{	// Menu to configure methods:
		const menuName = menu.newMenu('Set method');
		const options = ['WEIGHT', 'GRAPH', 'DYNGENRE'];
		options.forEach((key) => {
			const entryText = key + (recipe.hasOwnProperty('method') && recipe.method  === key ? '\t(forced by recipe)' : '');
			menu.newEntry({menuName, entryText, func: () => {
				properties.method[1] = key;
				overwriteProperties(properties); // Updates panel
			}, flags: recipe.hasOwnProperty('method') ? MF_GRAYED : MF_STRING});
			menu.newCheckMenu(menuName, entryText, void(0), () => {return (recipe.hasOwnProperty('method') ? recipe.method === key : properties.method[1] === key);});
		});
	}
	{	// Menu to configure properties: tags
		const menuName = menu.newMenu('Remap tags');
		const options = ['genreTag', 'styleTag', 'moodTag', 'dateTag', 'composerTag', 'customStrTag', 'customNumTag'];
		options.forEach((tagName) => {
			menu.newEntry({menuName, entryText: 'Set ' + tagName.replace('Tag','') + ' tag', func: () => {
				let input = '';
				try {input = utils.InputBox(window.ID, 'Input tag name(s) (sep by \',\')', 'Search by distance', properties[tagName][1], true);} 
				catch(e) {return;}
				if (!input.length) {return;}
				if (input === properties[tagName][1]) {return;}
				properties[tagName][1] = input;
				overwriteProperties(properties);
			}});
		});
	}
	{	// Menu to configure filters:
		const menuName = menu.newMenu('Set filters');
		{	// Menu to configure properties: forcedQuery
			menu.newEntry({menuName, entryText: 'Set Global Forced Query...' + (recipe.hasOwnProperty('forcedQuery') ? '\t(forced by recipe)' : ''), func: () => {
				let input = '';
				try {input = utils.InputBox(window.ID, 'Enter global query used to pre-filter library:', 'Search by distance', properties['forcedQuery'][1]);}
				catch(e) {return;}
				if (properties['forcedQuery'][1] === input) {return;}
				try {fb.GetQueryItems(new FbMetadbHandleList(), input);} // Sanity check
				catch (e) {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + input, 'Search by distance'); return;}
				properties['forcedQuery'][1] = input;
				overwriteProperties(properties); // Updates panel
			}});
		}
		{ // Menu to configure properties: tags filter
			const options = ['genreStyleFilter', 'poolFilteringTag'];
			options.forEach((key) => {
				const idxEnd = properties[key][0].indexOf('(');
				const entryText = properties[key][0].substring(properties[key][0].indexOf('.') + 1, idxEnd !== -1 ? idxEnd - 1 : Infinity) + '...' + (recipe.hasOwnProperty(key) ? '\t(forced by recipe)' : '');
				menu.newEntry({menuName, entryText, func: () => {
					let input = '';
					try {input = utils.InputBox(window.ID, 'Enter tags sep by comma:', 'Search by distance', properties[key][1]);}
					catch(e) {return;}
					if (properties[key][1] === input) {return;}
					properties[key][1] = input;
					overwriteProperties(properties); // Updates panel
				}, flags: recipe.hasOwnProperty(key) ? MF_GRAYED : MF_STRING});
			});
		}
	}
	{	// Menu to configure boolean properties:
		const menuName = menu.newMenu('Set boolean config');
		const options = ['bUseAntiInfluencesFilter', 'bUseInfluencesFilter', 'bNegativeWeighting', 'bRandomPick', 'bSortRandom', 'bScatterInstrumentals', 'bProgressiveListOrder', 'bInKeyMixingPlaylist', 'bProgressiveListCreation'];
		options.forEach((key) => {
			const entryText = properties[key][0].substr(properties[key][0].indexOf('.') + 1) + (recipe.hasOwnProperty(key) ? '\t(forced by recipe)' : '');
			menu.newEntry({menuName, entryText, func: () => {
				properties[key][1] = !properties[key][1];
				overwriteProperties(properties); // Updates panel
			}, flags: recipe.hasOwnProperty(key) ? MF_GRAYED : MF_STRING});
			menu.newCheckMenu(menuName, entryText, void(0), () => {return (recipe.hasOwnProperty(key) ? recipe[key] : properties[key][1]);});
		});
	}
	{	// Menu to configure number properties:
		const menuName = menu.newMenu('Set number config');
		const options = ['scoreFilter', 'sbd_max_graph_distance', 'poolFilteringN', 'probPick', 'playlistLength', 'progressiveListCreationN'];
		const lowerHundred = new Set(['scoreFilter', 'probPick', 'progressiveListCreationN']);
		options.forEach((key) => {
			const idxEnd = properties[key][0].indexOf('(');
			const entryText = properties[key][0].substring(properties[key][0].indexOf('.') + 1, idxEnd !== -1 ? idxEnd - 1 : Infinity) + '...' + (recipe.hasOwnProperty(key) ? '\t(forced by recipe)' : '');
			menu.newEntry({menuName, entryText, func: () => {
				let input = '';
				try {input = Number(utils.InputBox(window.ID, 'Enter number:', window.Name, properties[key][1]));}
				catch(e) {return;}
				if (isNaN(input)) {return;}
				if (lowerHundred.has(key) && input > 100) {return;}
				overwriteProperties(properties); // Updates panel
			}, flags: recipe.hasOwnProperty(key) ? MF_GRAYED : MF_STRING});
		});
	}
	return menu;
}