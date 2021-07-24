include('menu_xxx.js');
include('helpers_xxx.js');
include('helpers_xxx_file.js');

function createConfigMenu(parent) {
	const menu = new _menu(); // To avoid collisions with other buttons and check menu
	const properties = parent.buttonsProperties;
	const data = JSON.parse(properties.data[1]);
	let recipe = {};
	// Recipe forced theme?
	if (properties.recipe[1].length) {
		recipe = _isFile(properties.recipe[1]) ? _jsonParseFile(properties.recipe[1]) : _jsonParseFile(folders.xxx + 'presets\\Search by\\recipes\\' + properties.recipe[1]);
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
		const options = ['genreTag', 'styleTag', 'moodTag', 'dateTag', 'keyTag', 'bpmTag', 'composerTag', 'customStrTag', 'customNumTag'];
		options.forEach((tagName) => {
			menu.newEntry({menuName, entryText: 'Set ' + tagName.replace('Tag','') + ' tag' + (recipe.hasOwnProperty(tagName) ? '\t[' + recipe[tagName] + '] (forced by recipe)' : '\t[' + properties[tagName][1] + ']'), func: () => {
				let input = '';
				try {input = utils.InputBox(window.ID, 'Input tag name(s) (sep by \',\')', 'Search by distance', properties[tagName][1], true);} 
				catch(e) {return;}
				if (!input.length) {return;}
				if (input === properties[tagName][1]) {return;}
				properties[tagName][1] = input;
				overwriteProperties(properties);
			}, flags: recipe.hasOwnProperty(tagName) ? MF_GRAYED : MF_STRING});
		});
	}
	{	// Menu to configure properties: weights
		const menuName = menu.newMenu('Set weights');
		const options = ['genreWeight', 'styleWeight', 'moodWeight', 'dateWeight', 'keyWeight', 'bpmWeight', 'composerWeight', 'customStrWeight', 'customNumWeight'];
		options.forEach((weightName) => {
			menu.newEntry({menuName, entryText: 'Set ' + weightName.replace('Weight','') + ' weight' + (recipe.hasOwnProperty(weightName) ? '\t[' + recipe[weightName] + '] (forced by recipe)' : '\t[' + properties[weightName][1] + ']'), func: () => {
				let input = '';
				try {input = Number(utils.InputBox(window.ID, 'Input weight value:', 'Search by distance', properties[weightName][1], true));} 
				catch(e) {return;}
				if (!input.length) {return;}
				if (isNaN(input)) {return;}
				if (input === properties[weightName][1]) {return;}
				properties[weightName][1] = input;
				overwriteProperties(properties);
			}, flags: recipe.hasOwnProperty(weightName) ? MF_GRAYED : MF_STRING});
		});
	}
	{	// Menu to configure properties: ranges
		const menuName = menu.newMenu('Set ranges');
		const options = ['dateRange', 'keyRange', 'bpmRange','customNumRange'];
		options.forEach((rangeName) => {
			menu.newEntry({menuName, entryText: 'Set ' + rangeName.replace('Range','') + ' range' + (recipe.hasOwnProperty(rangeName) ? '\t[' + recipe[rangeName] + '] (forced by recipe)' : '\t[' + properties[rangeName][1] + ']'), func: () => {
				let input = '';
				try {input = Number(utils.InputBox(window.ID, 'Input range value:', 'Search by distance', properties[rangeName][1], true));} 
				catch(e) {return;}
				if (!input.length) {return;}
				if (isNaN(input)) {return;}
				if (input === properties[rangeName][1]) {return;}
				properties[rangeName][1] = input;
				overwriteProperties(properties);
			}, flags: recipe.hasOwnProperty(rangeName) ? MF_GRAYED : MF_STRING});
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
			}, flags: recipe.hasOwnProperty('forcedQuery') ? MF_GRAYED : MF_STRING});
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
		const sbd_max_graph_distance = recipe.hasOwnProperty('sbd_max_graph_distance') ? parseGraphVal(recipe.sbd_max_graph_distance) : '';
		const menuName = menu.newMenu('Set number config');
		const options = ['scoreFilter', 'sbd_max_graph_distance', 'poolFilteringN', 'probPick', 'playlistLength', 'progressiveListCreationN'];
		const lowerHundred = new Set(['scoreFilter', 'probPick', 'progressiveListCreationN']);
		options.forEach((key) => {
			const idxEnd = properties[key][0].indexOf('(');
			const entryText = properties[key][0].substring(properties[key][0].indexOf('.') + 1, idxEnd !== -1 ? idxEnd - 1 : Infinity) + '...' + (recipe.hasOwnProperty(key) ? '\t[' + (key === 'sbd_max_graph_distance' ? sbd_max_graph_distance : recipe[key]) + '] (forced by recipe)' :  '\t[' + properties[key][1] + ']');
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
	menu.newEntry({entryText: 'sep'});
	{	// Readmes
		const subMenuName = menu.newMenu('Readmes...');
		menu.newEntry({menuName: subMenuName, entryText: 'Open popup with readme:', func: null, flags: MF_GRAYED});
		menu.newEntry({menuName: subMenuName, entryText: 'sep'});
		let iCount = 0;
		const readmes = {
			Full: folders.xxx + 'helpers\\readme\\search_bydistance.txt',
			DYNGENRE: folders.xxx + 'helpers\\readme\\search_bydistance_dyngenre.txt',
			GRAPH: folders.xxx + 'helpers\\readme\\search_bydistance_graph.txt',
			WEIGHT: folders.xxx + 'helpers\\readme\\search_bydistance_weight.txt',
			'Recipes & Themes': folders.xxx + 'helpers\\readme\\search_bydistance_recipes_themes.txt'
		}
		if (Object.keys(readmes).length) {
			Object.entries(readmes).forEach(([key, value]) => { // Only show non empty files
				if ((isCompatible('1.4.0') ? utils.IsFile(value) : utils.FileTest(value, 'e'))) { 
					const readme = utils.ReadTextFile(value, 65001); // Executed on script load
					if (readme.length) {
						menu.newEntry({menuName: subMenuName, entryText: key, func: () => { // Executed on menu click
							if ((isCompatible('1.4.0') ? utils.IsFile(value) : utils.FileTest(value, 'e'))) {
								const readme = utils.ReadTextFile(value, 65001);
								if (readme.length) {fb.ShowPopupMessage(readme, key);}
							} else {console.log('Readme not found: ' + value);}
						}});
						iCount++;
					}
				} else {console.log('Readme not found: ' + value);}
			});
		} 
		if (!iCount) {menu.newEntry({menuName: subMenuName, entryText: '- no files - ', func: null, flags: MF_GRAYED});}
	}
	return menu;
}

function parseGraphVal(val) {
	if (isString(val)) { // Safety check
		if (val.length >= 50) {
			console.log('Error parsing sbd_max_graph_distance (length >= 50): ' + val);
			return;
		}
		if (val.indexOf('music_graph_descriptors') === -1 || val.indexOf('()') !== -1 || val.indexOf(',') !== -1) {
			console.log('Error parsing sbd_max_graph_distance (is not a valid variable or using a func): ' + val);
			return;
		}
		const validVars = Object.keys(music_graph_descriptors).map((_) => {return 'music_graph_descriptors.' + _;});
		if (val.indexOf('+') === -1 && val.indexOf('-') === -1 && val.indexOf('*') === -1 && val.indexOf('/') === -1 && validVars.indexOf(val) === -1) {
			console.log('Error parsing sbd_max_graph_distance (using no arithmethics or variable): ' + val);
			return;
		}
		val = Math.floor(eval(val));
	}
	return val;
}