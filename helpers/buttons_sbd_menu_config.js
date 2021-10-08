'use strict'
//07/10/21

include('menu_xxx.js');
include('helpers_xxx.js');
include('helpers_xxx_file.js');

function createConfigMenu(parent) {
	const menu = new _menu(); // To avoid collisions with other buttons and check menu
	const properties = parent.buttonsProperties;
	const data = JSON.parse(properties.data[1]);
	const utf8 = convertCharsetToCodepage('UTF-8');
	let recipe = {};
	// Recipe forced theme?
	if (properties.recipe[1].length) {
		recipe = _isFile(properties.recipe[1]) ? _jsonParseFile(properties.recipe[1], utf8) : _jsonParseFile(folders.xxx + 'presets\\Search by\\recipes\\' + properties.recipe[1], utf8);
		if (!recipe) {recipe = {}; console.log('Recipe file is not valid or not found:' + properties.recipe[1]);}
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
				try {input = utils.InputBox(window.ID, 'Enter global query used to pre-filter library:', 'Search by distance', properties['forcedQuery'][1], true);}
				catch(e) {return;}
				if (properties['forcedQuery'][1] === input) {return;}
				try {fb.GetQueryItems(new FbMetadbHandleList(), input);} // Sanity check
				catch (e) {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + input, 'Search by distance'); return;}
				properties['forcedQuery'][1] = input;
				overwriteProperties(properties); // Updates panel
			}, flags: recipe.hasOwnProperty('forcedQuery') ? MF_GRAYED : MF_STRING});
		}
		{ // Menu to configure properties: additional filters
			const subMenuName = menu.newMenu('Additional pre-defined filters...', menuName);
			let options = [];
			if (_isFile(folders.xxx + 'presets\\Search by\\filters\\custom_button_filters.json')) {
				options = _jsonParseFile(folders.xxx + 'presets\\Search by\\filters\\custom_button_filters.json', utf8);
			} else {
				options = [
					{title: 'Female vocals', query: 'STYLE IS Female Vocal OR STYLE IS Female OR GENRE IS Female Vocal OR GENRE IS Female OR GENDER IS Female'}, 
					{title: 'Instrumentals', query: 'STYLE IS Instrumental OR GENRE IS Instrumental OR SPEECHINESS EQUAL 0'},
					{title: 'Acoustic tracks', query: 'STYLE IS Acoustic OR GENRE IS Acoustic OR ACOUSTICNESS GREATER 75'}
				];
			}
			menu.newEntry({menuName: subMenuName, entryText: 'Appended to Global Forced Query:', flags: MF_GRAYED});
			menu.newEntry({menuName: subMenuName, entryText: 'sep', flags: MF_GRAYED});
			options.forEach((obj) => {
				if (obj.title === 'sep') {menu.newEntry({menuName: subMenuName, entryText: 'sep', flags: MF_GRAYED}); return;}
				const entryText = obj.title + (recipe.hasOwnProperty('forcedQuery') ? '\t(forced by recipe)' : '');
				let input = properties['forcedQuery'][1].length ? ') AND (' + obj.query + ')' : obj.query;
				menu.newEntry({menuName: subMenuName, entryText, func: () => {
					if (properties['forcedQuery'][1].indexOf(input) !== -1) {
						input = properties['forcedQuery'][1].slice(1).replace(input, '');
					} else {
						input = properties['forcedQuery'][1].length ? '(' + properties['forcedQuery'][1] + input : input;
					}
					try {fb.GetQueryItems(new FbMetadbHandleList(), input);} // Sanity check
					catch (e) {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + input, 'Search by distance'); return;}
					properties['forcedQuery'][1] = input;
				}, flags: recipe.hasOwnProperty('forcedQuery') ? MF_GRAYED : MF_STRING});
				menu.newCheckMenu(subMenuName, entryText, void(0), () => {return properties['forcedQuery'][1].indexOf(input) !== -1 || (recipe.hasOwnProperty('forcedQuery') && recipe.forcedQuery.indexOf(input) !== -1);});
			});
		}
		{ // Menu to configure properties: tags filter
			const options = ['genreStyleFilter', 'poolFilteringTag'];
			options.forEach((key) => {
				const idxEnd = properties[key][0].indexOf('(');
				const entryText = properties[key][0].substring(properties[key][0].indexOf('.') + 1, idxEnd !== -1 ? idxEnd - 1 : Infinity) + '...' + (recipe.hasOwnProperty(key) ? '\t(forced by recipe)' : '');
				menu.newEntry({menuName, entryText, func: () => {
					let input = '';
					try {input = utils.InputBox(window.ID, 'Enter tags sep by comma:', 'Search by distance', properties[key][1], true);}
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
		const sbd_max_graph_distance = recipe.hasOwnProperty('sbd_max_graph_distance') ? parseGraphVal(recipe.sbd_max_graph_distance) : parseGraphVal(properties.sbd_max_graph_distance[1]);
		const menuName = menu.newMenu('Set number config');
		const options = ['scoreFilter', 'sbd_max_graph_distance', 'poolFilteringN', 'probPick', 'playlistLength', 'progressiveListCreationN'];
		const lowerHundred = new Set(['scoreFilter', 'probPick', 'progressiveListCreationN']);
		options.forEach((key) => {
			const idxEnd = properties[key][0].indexOf('(');
			const entryText = properties[key][0].substring(properties[key][0].indexOf('.') + 1, idxEnd !== -1 ? idxEnd - 1 : Infinity) + '...' + (recipe.hasOwnProperty(key) ? '\t[' + (key === 'sbd_max_graph_distance' ? recipe[key].split('.').pop() + ' --> ' + sbd_max_graph_distance : recipe[key]) + '] (forced by recipe)' :  '\t[' + (key === 'sbd_max_graph_distance' ? properties[key][1].toString().split('.').pop() + ' --> ' + sbd_max_graph_distance : properties[key][1]) + ']');
			menu.newEntry({menuName, entryText, func: () => {
				let input = '';
				try {input = Number(utils.InputBox(window.ID, 'Enter number:', window.Name, properties[key][1], true));}
				catch(e) {return;}
				if (isNaN(input)) {return;}
				if (lowerHundred.has(key) && input > 100) {return;}
				overwriteProperties(properties); // Updates panel
			}, flags: recipe.hasOwnProperty(key) ? MF_GRAYED : MF_STRING});
		});
	}
	menu.newEntry({entryText: 'sep'});
	{
		menu.newEntry({entryText: 'Rename button...', func: () => {
			let input = '';
			try {input =  utils.InputBox(window.ID, 'Enter button name. Then configure according to your liking using the menus or the properties panel (look for \'' + parent.prefix + '...\').', window.Name + ': Search by Distance Customizable Button', properties.customName[1], true);}
			catch(e) {return;}
			if (!input.length) {return;}
			if (properties.customName[1] !== input) {
				properties.customName[1] = input;
				overwriteProperties(properties); // Force overwriting
				parent.text = input;
			}
		}});
	}
	menu.newEntry({entryText: 'sep'});
	{
		const submenu = menu.newMenu('Other tools');
		{ 	// Find genre/styles not on graph
			menu.newEntry({menuName: submenu, entryText: 'Find genres/styles not on Graph', func: () => {
				// Skipped values at pre-filter
				const tagValuesExcluded = new Set(properties['genreStyleFilter'][1].split(',').filter(Boolean)); // Filter holes and remove duplicates
				// Get all tags and their frequency
				const tagsToCheck = [...new Set(properties['genreTag'][1].concat(',', properties['styleTag'][1]).split(',').filter(Boolean))]; // Merge and filter
				if (!tagsToCheck.length) {
					fb.ShowPopupMessage('There are no tags to check set at properties panel:\n' + properties['genreTag'][0], 'Search by distance');
					return;
				}
				// Get tags
				const tags = new Set(getTagsValuesV4(fb.GetLibraryItems(), tagsToCheck, false, true).flat(Infinity));
				// Get node list (+ weak substitutions + substitutions + style cluster)
				const nodeList = new Set(music_graph_descriptors.style_supergenre.flat(Infinity)).union(new Set(music_graph_descriptors.style_weak_substitutions.flat(Infinity))).union(new Set(music_graph_descriptors.style_substitutions.flat(Infinity))).union(new Set(music_graph_descriptors.style_cluster.flat(Infinity)));
				// Compare (- user exclusions - graph exclusions)
				const missing = tags.difference(nodeList).difference(tagValuesExcluded).difference(music_graph_descriptors.map_distance_exclusions);
				// Report
				const userFile = folders.xxx + 'helpers\\music_graph_descriptors_xxx_user.js';
				const UserFileFound = (isCompatible('1.4.0') ? utils.IsFile(userFile) : utils.FileTest(userFile, 'e')) ? '' : ' (not found)';
				const UserFileEmpty = UserFileFound &&  Object.keys(music_graph_descriptors_user).length ? '' : ' (empty)';
				const report = 'Graph descriptors:\n' +
								'.\helpers\music_graph_descriptors_xxx.js\n' +
								'.\helpers\music_graph_descriptors_xxx_user.js' + UserFileFound + UserFileEmpty + '\n\n' +
								'List of tags not present on the graph descriptors:\n' +
								[...missing].sort().join(', ');
				fb.ShowPopupMessage(report, 'Search by distance');
			}});
			// Graph debug
			menu.newEntry({menuName: submenu, entryText: 'Debug Graph (check console)', func: () => {
				if (panelProperties.bProfile[1]) {var profiler = new FbProfiler('graphDebug');}
				graphDebug(all_music_graph, true); // Show popup on pass
				if (panelProperties.bProfile[1]) {profiler.Print();}
			}});
			// Graph test
			menu.newEntry({menuName: submenu, entryText: 'Run distance tests (check console)', func: () => {
				if (panelProperties.bProfile[1]) {var profiler = new FbProfiler('testGraph');}
				testGraph(all_music_graph);
				testGraphV2(all_music_graph);
				if (panelProperties.bProfile[1]) {profiler.Print();}
			}});
			// Graph cache reset Async
			menu.newEntry({menuName: submenu, entryText: 'Reset link cache', func: () => {
				_deleteFile(folders.data + 'searchByDistance_cacheLink.json');
				_deleteFile(folders.data + 'searchByDistance_cacheLinkSet.json');
				cacheLink = void(0);
				cacheLinkSet = void(0);
				updateCache({bForce: true}); // Creates new one and also notifies other panels to discard their cache
			}});
		}
		menu.newEntry({menuName: submenu, entryText: 'sep'});
		{ // Open descriptors
			menu.newEntry({menuName: submenu, entryText: 'Open main descriptor', func: () => {
				const file = folders.xxx + 'helpers\\music_graph_descriptors_xxx.js';
				if (isCompatible('1.4.0') ? utils.IsFile(file) : utils.FileTest(file, 'e')){_run('notepad.exe', file);}
			}});
			menu.newEntry({menuName: submenu, entryText: 'Open user descriptor', func: () => {
				const file = folders.xxx + 'helpers\\music_graph_descriptors_xxx_user.js';
				if (isCompatible('1.4.0') ? utils.IsFile(file) : utils.FileTest(file, 'e')){_run('notepad.exe', file);}
			}});
		}
		menu.newEntry({menuName: submenu, entryText: 'sep'});
		{ // Open graph html file
			menu.newEntry({menuName: submenu, entryText: 'Show Music Graph on Browser', func: () => {
				const file = folders.xxx + 'Draw Graph.html';
				if (isCompatible('1.4.0') ? utils.IsFile(file) : utils.FileTest(file, 'e')){_run(file);}
			}});
		}
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
		};
		if (Object.keys(readmes).length) {
			Object.entries(readmes).forEach(([key, value]) => { // Only show non empty files
				if ((isCompatible('1.4.0') ? utils.IsFile(value) : utils.FileTest(value, 'e'))) { 
					const readme = utils.ReadTextFile(value, convertCharsetToCodepage('UTF-8')); // Executed on script load
					if (readme.length) {
						menu.newEntry({menuName: subMenuName, entryText: key, func: () => { // Executed on menu click
							if ((isCompatible('1.4.0') ? utils.IsFile(value) : utils.FileTest(value, 'e'))) {
								const readme = utils.ReadTextFile(value, convertCharsetToCodepage('UTF-8'));
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