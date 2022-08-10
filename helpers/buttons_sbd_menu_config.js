'use strict';
//01/07/22

include('menu_xxx.js');
include('helpers_xxx.js');
include('helpers_xxx_file.js');
include('helpers_xxx_prototypes.js');

function createConfigMenu(parent) {
	const menu = new _menu(); // To avoid collisions with other buttons and check menu
	const properties = parent.buttonsProperties;
	let recipe = {};
	// Recipe forced theme?
	if (properties.recipe[1].length) {
		recipe = _isFile(properties.recipe[1]) ? _jsonParseFileCheck(properties.recipe[1], 'Recipe json', 'Search by distance', utf8) || {}: _jsonParseFileCheck(recipePath + properties.recipe[1], 'Recipe json', 'Search by distance', utf8) || {};
	}
	// Process nested recipes
	if (recipe.hasOwnProperty('recipe')) {
		const toAdd = processRecipe(recipe.recipe);
		delete toAdd.recipe;
		Object.keys(toAdd).forEach((key) => {if (!recipe.hasOwnProperty(key)) {recipe[key] = toAdd[key];}});
	}
	// Recipe forced properties?
	const bProperties = recipe.hasOwnProperty('properties');
	// Header
	menu.newEntry({entryText: 'Set config (may be overwritten by recipe):', func: null, flags: MF_GRAYED});
	menu.newEntry({entryText: 'sep'});
	{	// Menu to configure methods:
		const menuName = menu.newMenu('Set method');
		{
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
		menu.newEntry({menuName, entryText: 'sep'});
		{
			const sbd_max_graph_distance = recipe.hasOwnProperty('sbd_max_graph_distance') ? parseGraphVal(recipe.sbd_max_graph_distance) : parseGraphVal(properties.sbd_max_graph_distance[1]);
			const options = ['scoreFilter', 'minScoreFilter', 'sep', 'sbd_max_graph_distance'];
			const lowerHundred = new Set(['scoreFilter', 'minScoreFilter']);
			const bIsGraph = recipe.hasOwnProperty('method') && recipe.method  === 'GRAPH' || !recipe.hasOwnProperty('method') && properties.method[1] === 'GRAPH';
			options.forEach((key) => {
				if (key === 'sep') {menu.newEntry({menuName, entryText: 'sep', flags: MF_GRAYED}); return;}
				const flags = recipe.hasOwnProperty(key) ? MF_GRAYED : ((bIsGraph && key === 'sbd_max_graph_distance' || key !== 'sbd_max_graph_distance') ? MF_STRING : MF_GRAYED);
				const idxEnd = properties[key][0].indexOf('(');
				const val = properties[key][1];
				const entryText = properties[key][0].substring(properties[key][0].indexOf('.') + 1, idxEnd !== -1 ? idxEnd - 1 : Infinity) + '...' + (recipe.hasOwnProperty(key) ? '\t[' + (key === 'sbd_max_graph_distance' && isNaN(val) ? recipe[key].split('.').pop() + ' --> ' + sbd_max_graph_distance : recipe[key]) + '] (forced by recipe)' :  '\t[' + (key === 'sbd_max_graph_distance' && isNaN(val) ? val.toString().split('.').pop() + ' --> ' + sbd_max_graph_distance : val) + ']');
				menu.newEntry({menuName, entryText, func: () => {
					let input;
					try {input = Number(utils.InputBox(window.ID, 'Enter number:', window.Name, val, true));}
					catch(e) {return;}
					if (isNaN(input)) {return;}
					if (lowerHundred.has(key) && input > 100) {return;}
					properties[key][1] = input;
					overwriteProperties(properties); // Updates panel
				}, flags});
			});
		}
	}
	{	// Menu to configure properties: weights
		const menuName = menu.newMenu('Set weights');
		const options = ['genreWeight', 'styleWeight', 'dyngenreWeight', 'moodWeight', 'dateWeight', 'keyWeight', 'bpmWeight', 'composerWeight', 'customStrWeight', 'customNumWeight'];
		const bIsDyngenreMethodRecipe = recipe.hasOwnProperty('method') && recipe.method  !== 'DYNGENRE';
		const bIsDyngenreMethodProp = !recipe.hasOwnProperty('method') && properties.method[1] !== 'DYNGENRE';
		options.forEach((weightName) => {
			const bIsDyngenreRecipe = weightName === 'dyngenreWeight' && bIsDyngenreMethodRecipe;
			const bIsDyngenreProp = weightName === 'dyngenreWeight' && bIsDyngenreMethodProp;
			const bPresent = recipe.hasOwnProperty(weightName);
			const entryText = 'Set ' + weightName.replace('Weight','') + ' weight' + (bPresent || bIsDyngenreRecipe ? '\t[' + (bIsDyngenreRecipe ?  '-1' : recipe[weightName]) + '] (forced by recipe)' : '\t[' + (bIsDyngenreProp ?  '-1' : properties[weightName][1]) + ']');
			menu.newEntry({menuName, entryText, func: () => {
				let input;
				try {input = Number(utils.InputBox(window.ID, 'Input weight value:', 'Search by distance', properties[weightName][1], true));} 
				catch(e) {return;}
				if (isNaN(input)) {return;}
				if (input === properties[weightName][1]) {return;}
				properties[weightName][1] = input;
				overwriteProperties(properties);
			}, flags: bPresent || bIsDyngenreProp || bIsDyngenreRecipe ? MF_GRAYED : MF_STRING});
		});
	}
	{	// Menu to configure properties: ranges
		const menuName = menu.newMenu('Set ranges');
		{
			const options = ['dateRange', 'keyRange', 'bpmRange','customNumRange'];
			options.forEach((rangeName) => {
				menu.newEntry({menuName, entryText: 'Set ' + rangeName.replace('Range','') + ' range' + (recipe.hasOwnProperty(rangeName) ? '\t[' + recipe[rangeName] + '] (forced by recipe)' : '\t[' + properties[rangeName][1] + ']'), func: () => {
					let input;
					try {input = Number(utils.InputBox(window.ID, 'Input range value:', 'Search by distance', properties[rangeName][1], true));} 
					catch(e) {return;}
					if (isNaN(input)) {return;}
					if (input === properties[rangeName][1]) {return;}
					properties[rangeName][1] = input;
					overwriteProperties(properties);
				}, flags: recipe.hasOwnProperty(rangeName) ? MF_GRAYED : MF_STRING});
			});
		}
		menu.newEntry({menuName, entryText: 'sep'});
		{
			const options = ['bNegativeWeighting'];
			options.forEach((key) => {
				const entryText = properties[key][0].substr(properties[key][0].indexOf('.') + 1) + (recipe.hasOwnProperty(key) ? '\t(forced by recipe)' : '');
				menu.newEntry({menuName, entryText, func: () => {
					properties[key][1] = !properties[key][1];
					overwriteProperties(properties); // Updates panel
				}, flags: recipe.hasOwnProperty(key) ? MF_GRAYED : MF_STRING});
				menu.newCheckMenu(menuName, entryText, void(0), () => {return (recipe.hasOwnProperty(key) ? recipe[key] : properties[key][1]);});
			});
		}
	}
	{	// Menu to configure pre-scoring filters:
		const menuName = menu.newMenu('Set pre-scoring filters');
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
			const file = folders.xxx + 'presets\\Search by\\filters\\custom_button_filters.json';
			const bFile = _isFile(file);
			if (bFile) {
				options = _jsonParseFileCheck(file, 'Query filters json', 'Search by distance', utf8) || [];
			} else {
				options = [
					{title: 'Female vocals',			query: 'STYLE IS Female Vocal OR STYLE IS Female OR GENRE IS Female Vocal OR GENRE IS Female OR GENDER IS Female'}, 
					{title: 'Instrumentals',			query: 'STYLE IS Instrumental OR GENRE IS Instrumental OR SPEECHINESS EQUAL 0'},
					{title: 'Acoustic tracks',			query: 'STYLE IS Acoustic OR GENRE IS Acoustic OR ACOUSTICNESS GREATER 75'},
					{title: 'Rating > 2',				query: '%RATING% GREATER 2'},
					{title: 'Rating > 3',				query: '%RATING% GREATER 3'},
					{title: 'Length < 6 min',			query: '%length_seconds% LESS 360'},
					{title: 'Only Stereo',				query: '%channels% LESS 3 AND NOT COMMENT HAS Quad'},
					{title: 'sep'},		
					{title: 'No Female vocals',			query: 'NOT (STYLE IS Female Vocal OR STYLE IS Female OR GENRE IS Female Vocal OR GENRE IS Female OR GENDER IS Female)'}, 
					{title: 'No Instrumentals', 		query: 'NOT (STYLE IS Instrumental OR GENRE IS Instrumental OR SPEECHINESS EQUAL 0)'},
					{title: 'No Acoustic tracks',		query: 'NOT (STYLE IS Acoustic OR GENRE IS Acoustic OR ACOUSTICNESS GREATER 75)' },
					{title: 'Not rated',				query: '%RATING% MISSING'},
					{title: 'Not Live (unless Hi-Fi)',	query: 'NOT (STYLE IS Live AND NOT STYLE IS Hi-Fi)'}
				];
			}
			menu.newEntry({menuName: subMenuName, entryText: 'Appended to Global Forced Query:', flags: MF_GRAYED});
			menu.newEntry({menuName: subMenuName, entryText: 'sep', flags: MF_GRAYED});
			const switchQuery = (input, query) => {
				if (input.indexOf(query) !== -1) {
					input = input.replace(query, ''); // Query
					input = input.slice(1, -1); // Remove parentheses
				} else {
					input = input.length ? _p(input) + query : query;
				}
				return input;
			};
			options.forEach((obj) => {
				if (obj.title === 'sep') {menu.newEntry({menuName: subMenuName, entryText: 'sep', flags: MF_GRAYED}); return;}
				const entryText = obj.title + (recipe.hasOwnProperty('forcedQuery') ? '\t(forced by recipe)' : '');
				const query = properties['forcedQuery'][1].length ? ' AND ' + _p(obj.query) : obj.query;
				let input = '';
				menu.newEntry({menuName: subMenuName, entryText, func: () => {
					input = switchQuery(properties['forcedQuery'][1], query);
					try {fb.GetQueryItems(new FbMetadbHandleList(), input);} // Sanity check
					catch (e) {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + input, 'Search by distance'); return;}
					properties['forcedQuery'][1] = input;
					overwriteProperties(properties); // Updates panel
				}, flags: recipe.hasOwnProperty('forcedQuery') ? MF_GRAYED : MF_STRING});
				menu.newCheckMenu(subMenuName, entryText, void(0), () => {return properties['forcedQuery'][1].indexOf(query) !== -1 || (recipe.hasOwnProperty('forcedQuery') && recipe.forcedQuery.indexOf(query) !== -1);});
			});
			menu.newEntry({menuName: subMenuName, entryText: 'sep', flags: MF_GRAYED});
			menu.newEntry({menuName: subMenuName, entryText: 'Edit entries...' + (bFile ? '' : '\t(new file)'), func: () => {
				if (!bFile) {_save(file, JSON.stringify(options, null, '\t'));}
				_explorer(file);
			}});
		}
		menu.newEntry({menuName, entryText: 'sep'});
		{ // Menu to configure properties: influences filter
			const options = ['bUseAntiInfluencesFilter', 'bConditionAntiInfluences', 'sep', 'bUseInfluencesFilter', 'sep', 'bSimilArtistsFilter', 'sep', 'bSameArtistFilter'];
			const bConditionAntiInfluences = recipe.hasOwnProperty('bConditionAntiInfluences') ? recipe['bConditionAntiInfluences'] : properties['bConditionAntiInfluences'][1];
			options.forEach((key) => {
				if (key === 'sep') {menu.newEntry({menuName, entryText: 'sep'}); return;}
				const entryText = properties[key][0].substr(properties[key][0].indexOf('.') + 1) + (recipe.hasOwnProperty(key) ? '\t(forced by recipe)' : '');
				menu.newEntry({menuName, entryText, func: () => {
					if (key === 'bConditionAntiInfluences') {fb.ShowPopupMessage('This option overrides the global anti-influences filter option, so it will be disabled at the configuration menu.\n\nThe filter will be enabled automatically for tracks having any of these genre/styles:\n' + music_graph_descriptors.replaceWithSubstitutionsReverse(music_graph_descriptors.style_anti_influences_conditional).join(', '), 'Search by distance');}
					if (key === 'bSameArtistFilter') {fb.ShowPopupMessage('This option may overrride some aspects of the similar artist filter option.\n\nWhen no similar artists data is found, by default only the selected artist would be considered. Thus allowing only tracks by the same artist to be considered.\n\nFiltering the selected artist forces the similar artist filter to fallback to checking all the library tracks in that case, otherwise there would be zero artists to check. It\'s equivalent to have the filter disabled when no similar artist data is present for the selected track\'s artist.\n\nWhen similar artists data is available, it works as expected, skipping the selected artist and only using the others. Thus strictly showing tracks by [others] similar artists.', 'Search by distance');}
					properties[key][1] = !properties[key][1];
					overwriteProperties(properties); // Updates panel
				}, flags: (key === 'bUseAntiInfluencesFilter' && bConditionAntiInfluences ? MF_GRAYED : (recipe.hasOwnProperty(key) ? MF_GRAYED : MF_STRING))});
				menu.newCheckMenu(menuName, entryText, void(0), () => {return (recipe.hasOwnProperty(key) ? recipe[key] : properties[key][1]);});
			});
		}
	}
	{	// Menu to configure post-scoring filters:
		const menuName = menu.newMenu('Set post-scoring filters');
		{ // Menu to configure properties: tags filter
			const options = ['poolFilteringTag'];
			options.forEach((key) => {
				if (key === 'sep') {menu.newEntry({menuName, entryText: 'sep'}); return;}
				const idxEnd = properties[key][0].indexOf('(');
				const entryText = properties[key][0].substring(properties[key][0].indexOf('.') + 1, idxEnd !== -1 ? idxEnd - 1 : Infinity) + '...' + (recipe.hasOwnProperty(key) ? '\t[' + recipe[key] + '] (forced by recipe)' :  '\t[' + properties[key][1] + ']');
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
		{
			const options = ['poolFilteringN'];
			const lowerHundred = new Set(['probPick']);
			options.forEach((key) => {
				const idxEnd = properties[key][0].indexOf('(');
				const entryText = properties[key][0].substring(properties[key][0].indexOf('.') + 1, idxEnd !== -1 ? idxEnd - 1 : Infinity) + '...' + (recipe.hasOwnProperty(key) ? '\t[' + recipe[key] + '] (forced by recipe)' :  '\t[' + properties[key][1] + ']');
				menu.newEntry({menuName, entryText, func: () => {
					let input;
					try {input = Number(utils.InputBox(window.ID, 'Enter number:', window.Name, properties[key][1], true));}
					catch(e) {return;}
					if (isNaN(input)) {return;}
					if (lowerHundred.has(key) && input > 100) {return;}
					properties[key][1] = input;
					overwriteProperties(properties); // Updates panel
				}, flags: recipe.hasOwnProperty(key) ? MF_GRAYED : MF_STRING});
			});
		}
	}
	{	// Menu to configure pool picking:
		const menuName = menu.newMenu('Set pool picking');
		{
			const options = ['bRandomPick'];
			options.forEach((key) => {
				const entryText = properties[key][0].substr(properties[key][0].indexOf('.') + 1) + (recipe.hasOwnProperty(key) ? '\t(forced by recipe)' : '');
				menu.newEntry({menuName, entryText, func: () => {
					properties[key][1] = !properties[key][1];
					overwriteProperties(properties); // Updates panel
				}, flags: recipe.hasOwnProperty(key) ? MF_GRAYED : MF_STRING});
				menu.newCheckMenu(menuName, entryText, void(0), () => {return (recipe.hasOwnProperty(key) ? recipe[key] : properties[key][1]);});
			});
		}
		{
			const options = ['probPick'];
			const lowerHundred = new Set(['probPick']);
			options.forEach((key) => {
				const idxEnd = properties[key][0].indexOf('(');
				const entryText = properties[key][0].substring(properties[key][0].indexOf('.') + 1, idxEnd !== -1 ? idxEnd - 1 : Infinity) + '...' + (recipe.hasOwnProperty(key) ? '\t[' + recipe[key] + '] (forced by recipe)' :  '\t[' + properties[key][1] + ']');
				menu.newEntry({menuName, entryText, func: () => {
					let input;
					try {input = Number(utils.InputBox(window.ID, 'Enter number:', window.Name, properties[key][1], true));}
					catch(e) {return;}
					if (isNaN(input)) {return;}
					if (lowerHundred.has(key) && input > 100) {return;}
					properties[key][1] = input;
					overwriteProperties(properties); // Updates panel
				}, flags: recipe.hasOwnProperty(key) ? MF_GRAYED : MF_STRING});
			});
		}
	}
	{	// Menu to configure final sorting:
		const menuName = menu.newMenu('Set final sorting');
		const options = ['bSortRandom', 'bProgressiveListOrder', 'sep', 'bScatterInstrumentals'];
		options.forEach((key) => {
			if (key === 'sep') {menu.newEntry({menuName, entryText: 'sep'}); return;}
			const entryText = properties[key][0].substr(properties[key][0].indexOf('.') + 1) + (recipe.hasOwnProperty(key) ? '\t(forced by recipe)' : '');
			menu.newEntry({menuName, entryText, func: () => {
				properties[key][1] = !properties[key][1];
				if (key === 'bSortRandom' && properties.bProgressiveListOrder[1]) {properties.bProgressiveListOrder[1] = !properties.bProgressiveListOrder[1];}
				else if (key === 'bProgressiveListOrder' && properties.bSortRandom[1]) {properties.bSortRandom[1] = !properties.bSortRandom[1];}
				overwriteProperties(properties); // Updates panel
			}, flags: recipe.hasOwnProperty(key) ? MF_GRAYED : MF_STRING});
			menu.newCheckMenu(menuName, entryText, void(0), () => {return (recipe.hasOwnProperty(key) ? recipe[key] : properties[key][1]);});
		});
	}
	{	// Menu to configure Special playlists:
		const menuName = menu.newMenu('Special playlist rules');
		{
			const options = ['bProgressiveListCreation'];
			options.forEach((key) => {
				const entryText = properties[key][0].substr(properties[key][0].indexOf('.') + 1) + (recipe.hasOwnProperty(key) ? '\t(forced by recipe)' : '');
				menu.newEntry({menuName, entryText, func: () => {
					properties[key][1] = !properties[key][1];
					overwriteProperties(properties); // Updates panel
				}, flags: recipe.hasOwnProperty(key) ? MF_GRAYED : MF_STRING});
				menu.newCheckMenu(menuName, entryText, void(0), () => {return (recipe.hasOwnProperty(key) ? recipe[key] : properties[key][1]);});
			});
		}
		{
			const options = ['progressiveListCreationN'];
			const lowerHundred = new Set(['progressiveListCreationN']);
			options.forEach((key) => {
				const idxEnd = properties[key][0].indexOf('(');
				const entryText = properties[key][0].substring(properties[key][0].indexOf('.') + 1, idxEnd !== -1 ? idxEnd - 1 : Infinity) + '...' + (recipe.hasOwnProperty(key) ? '\t[' + recipe[key] + '] (forced by recipe)' :  '\t[' + properties[key][1] + ']');
				menu.newEntry({menuName, entryText, func: () => {
					let input;
					try {input = Number(utils.InputBox(window.ID, 'Enter number:', window.Name, properties[key][1], true));}
					catch(e) {return;}
					if (isNaN(input)) {return;}
					if (lowerHundred.has(key) && input > 100) {return;}
					properties[key][1] = input;
					overwriteProperties(properties); // Updates panel
				}, flags: recipe.hasOwnProperty(key) ? MF_GRAYED : MF_STRING});
			});
		}
		menu.newEntry({menuName, entryText: 'sep'});
		{
			const options = ['bInKeyMixingPlaylist', 'bHarmonicMixDoublePass'];
			options.forEach((key) => {
				const entryText = properties[key][0].substr(properties[key][0].indexOf('.') + 1) + (recipe.hasOwnProperty(key) ? '\t(forced by recipe)' : '');
				menu.newEntry({menuName, entryText, func: () => {
					properties[key][1] = !properties[key][1];
					overwriteProperties(properties); // Updates panel
				}, flags: recipe.hasOwnProperty(key) ? MF_GRAYED : MF_STRING});
				menu.newCheckMenu(menuName, entryText, void(0), () => {return (recipe.hasOwnProperty(key) ? recipe[key] : properties[key][1]);});
			});
		}
	}
	{	// Menu to configure other playlist attributes:
		const menuName = menu.newMenu('Other playlist attributes');
		{
			const options = ['playlistName'];
			options.forEach((key) => {
				if (key === 'sep') {menu.newEntry({menuName, entryText: 'sep'}); return;}
				const idxEnd = properties[key][0].indexOf('(');
				const entryText = properties[key][0].substring(properties[key][0].indexOf('.') + 1, idxEnd !== -1 ? idxEnd - 1 : Infinity) + '...' + (recipe.hasOwnProperty(key) ? '\t[' + recipe[key] + '] (forced by recipe)' :  '\t[' + properties[key][1] + ']');
				menu.newEntry({menuName, entryText, func: () => {
					let input = '';
					try {input = utils.InputBox(window.ID, 'Enter TF expression:\n\n%, $, [ and ] must be enclosed in \' chars. \'\' results in single quote.\nFor ex: %artist%\'\'s Mix   ->   ACDC\'s Mix\n\n%sbd_theme% is available when using themes to avoid showing the raw TF expression (since there is no track to evaluate it with). When a theme is not being used, it\'s evaluated as a tag.\nFor ex: $if2(%sbd_theme%,%artist%)\'\'s Mix   ->   Test\'s Mix', 'Search by distance', properties[key][1], true);}
					catch(e) {return;}
					if (!input.length) {return;}
					if (properties[key][1] === input) {return;}
					properties[key][1] = input;
					overwriteProperties(properties); // Updates panel
				}, flags: recipe.hasOwnProperty(key) ? MF_GRAYED : MF_STRING});
			});
		}
		menu.newEntry({menuName, entryText: 'sep'});
		{
			const options = ['playlistLength'];
			options.forEach((key) => {
				const idxEnd = properties[key][0].indexOf('(');
				const entryText = properties[key][0].substring(properties[key][0].indexOf('.') + 1, idxEnd !== -1 ? idxEnd - 1 : Infinity) + '...' + (recipe.hasOwnProperty(key) ? '\t[' + recipe[key] + '] (forced by recipe)' :  '\t[' + properties[key][1] + ']');
				menu.newEntry({menuName, entryText, func: () => {
					let input;
					try {input = Number(utils.InputBox(window.ID, 'Enter number:', window.Name, properties[key][1], true));}
					catch(e) {return;}
					if (isNaN(input)) {return;}
					properties[key][1] = input;
					overwriteProperties(properties); // Updates panel
				}, flags: recipe.hasOwnProperty(key) ? MF_GRAYED : MF_STRING});
			});
		}
	}
	{	// Reset
		menu.newEntry({entryText: 'Reset to default...', func: () => {
			for (let key in SearchByDistance_properties) {
				if (properties.hasOwnProperty(key)) {properties[key][1] = SearchByDistance_properties[key][1];}
			}
			properties.theme[1] = '';
			properties.recipe[1] = '';
			properties.data[1] = JSON.stringify({forcedTheme: '', theme: 'None', recipe: 'None'});
			overwriteProperties(properties); // Force overwriting
		}});
	}
	menu.newEntry({entryText: 'sep'});
	{	// Menu to configure properties: tags
		const menuName = menu.newMenu('Remap tags');
		const options = ['genreTag', 'styleTag', 'moodTag', 'dateTag', 'keyTag', 'bpmTag', 'composerTag', 'customStrTag', 'customNumTag'];
		options.forEach((tagName) => {
			menu.newEntry({menuName, entryText: 'Set ' + tagName.replace('Tag','') + ' tag' + (bProperties && recipe.properties.hasOwnProperty(tagName) ? '\t[' + recipe.properties[tagName] + '] (forced by recipe)' : '\t[' + properties[tagName][1] + ']'), func: () => {
				let input = '';
				try {input = utils.InputBox(window.ID, 'Input tag name(s) (sep by \',\')', 'Search by distance', properties[tagName][1], true);} 
				catch(e) {return;}
				if (!input.length) {return;}
				if (input === properties[tagName][1]) {return;}
				properties[tagName][1] = input;
				overwriteProperties(properties);
			}, flags: bProperties && recipe.properties.hasOwnProperty(tagName) ? MF_GRAYED : MF_STRING});
		});
		menu.newEntry({menuName, entryText: 'sep'});
		{ // Menu to configure properties: tags filter
			const options = ['genreStyleFilter'];
			options.forEach((key) => {
				if (key === 'sep') {menu.newEntry({menuName, entryText: 'sep'}); return;}
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
	menu.newEntry({entryText: 'sep'});
	{	// Other tools
		const submenu = menu.newMenu('Other tools');
		{
			const file = folders.data + 'searchByDistance_artists.json';
			const iNum = 10;
			const tagName = 'SIMILAR ARTISTS SEARCHBYDISTANCE';
			include('..\\main\\search_bydistance_extra.js');
			menu.newEntry({menuName: submenu, entryText: 'Calculate similar artists tags', func: () => {
				const items = plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
				if (WshShell.Popup('Process [diferent] artists from currently selected items and calculate their most similar artists?\nResults are output to console and saved to JSON:\n' + file + '\n\nEstimated time: <=' + Math.round(items.Count * 30 * fb.GetLibraryItems().Count / 70000) + ' secs', 0, window.Name, popup.question + popup.yes_no) === popup.no) {return;}
				let profiler = new FbProfiler('Calculate similar artists');
				const handleList = removeDuplicatesV2({handleList: items, sortOutput: '%artist%', checkKeys: ['%artist%']});
				const newData = [];
				handleList.Convert().forEach((selHandle) => {
					const output = calculateSimilarArtists({properties, selHandle});
					if (output.val.length) {newData.push(output);}
				});
				if (!newData.length) {console.log('Nothing found.'); return;}
				if (!_isFile(file)) {
					newData.forEach((obj) => {console.log(obj.artist + ' --> ' + JSON.stringify(obj.val.slice(0, iNum)));});
					_save(file, JSON.stringify(newData, null, '\t'));
				} else {
					const data = _jsonParseFile(file, utf8);
					if (data) {
						const idxMap = new Map();
						data.forEach((obj, idx) => {idxMap.set(obj.artist, idx);});
						newData.forEach((obj) => {
							const idx = idxMap.get(obj.artist);
							if (idx >= 0) {data[idx] = obj;}
							else {data.push(obj);}
							console.log(obj.artist + ' --> ' + JSON.stringify(obj.val.slice(0, iNum)));
						});
					}
					_deleteFile(file);
					_save(file, JSON.stringify(data || newData, null, '\t'));
				}
				profiler.Print();
				if (WshShell.Popup('Write similar artist tags to all tracks by selected artists?\n(It will also rewrite previously added similar artist tags)\nOnly first ' + iNum + ' artists with highest score will be used.', 0, window.Name, popup.question + popup.yes_no) === popup.no) {return;}
				else {
					newData.forEach((obj) => {
						const artist = obj.artist.split(', ');
						const similarArtists = obj.val.map((o) => {return o.artist;}).slice(0, iNum);
						if (!similarArtists.length) {return;}
						const artistTracks = fb.GetQueryItems(fb.GetLibraryItems(), artist.map((a) => {return 'ARTIST IS ' + a;}).join(' OR ' ));
						const count = artistTracks.Count;
						if (count) {
							let arr = [];
							for (let i = 0; i < count; ++i) {
								arr.push({
									[tagName] : similarArtists
								});
							}
							artistTracks.UpdateFileInfoFromJSON(JSON.stringify(arr));
							console.log('Updating tracks by ' + artist + ': ' + count + ' tracks.');
						}
					});
				}
			}});
			menu.newEntry({menuName: submenu, entryText: 'Write similar artists tags', func: () => {
				if (WshShell.Popup('Write similar artist tags from JSON database to files?\nOnly first ' + iNum + ' artists with highest score will be used.', 0, window.Name, popup.question + popup.yes_no) === popup.no) {return;}
				if (!_isFile(file)) {return;}
				else {
					const data = _jsonParseFile(file, utf8);
					if (data) {
						const bRewrite = WshShell.Popup('Rewrite previously added similar artist tags?', 0, window.Name, popup.question + popup.yes_no) === popup.yes;
						const queryNoRw = ' AND ' + tagName + ' MISSING';
						data.forEach((obj) => {
							const artist = obj.artist.split(', ');
							const similarArtists = obj.val.map((o) => {return o.artist;}).slice(0, iNum);
							if (!similarArtists.length) {return;}
							const queryArtists = artist.map((a) => {return 'ARTIST IS ' + a;}).join(' OR ');
							const artistTracks = fb.GetQueryItems(fb.GetLibraryItems(), (bRewrite ? queryArtists : _p(queryArtists) + queryNoRw));
							const count = artistTracks.Count;
							if (count) {
								let arr = [];
								for (let i = 0; i < count; ++i) {
									arr.push({
										[tagName] : similarArtists
									});
								}
								artistTracks.UpdateFileInfoFromJSON(JSON.stringify(arr));
								console.log('Updating tracks by ' + artist + ': ' + count + ' tracks.');
							}
						});
					}
				}
			}, flags: _isFile(folders.data + 'searchByDistance_artists.json') ? MF_STRING : MF_GRAYED});
		}
		menu.newEntry({menuName: submenu, entryText: 'sep'});
		{
			menu.newEntry({menuName: submenu, entryText: 'Calculate same zone artists', func: () => {
				getArtistsSameZone({properties});
			}});
		}
	}
	{	// Debug
		const submenu = menu.newMenu('Debug and testing');
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
				const UserFileFound = _isFile(userFile) ? '' : ' (not found)';
				const UserFileEmpty = UserFileFound &&  Object.keys(music_graph_descriptors_user).length ? '' : ' (empty)';
				const report = 'Graph descriptors:\n' +
								'.\\helpers\\music_graph_descriptors_xxx.js\n' +
								'.\\helpers\\music_graph_descriptors_xxx_user.js' + UserFileFound + UserFileEmpty + '\n\n' +
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
				updateCache({bForce: true, properties}); // Creates new one and also notifies other panels to discard their cache
			}});
		}
		menu.newEntry({menuName: submenu, entryText: 'sep'});
		{
			menu.newEntry({menuName: submenu, entryText: 'Graph statistics', func: () => {
				graphStatistics({properties, graph: all_music_graph}).then((resolve) => {console.log(resolve.text);});
			}});
		}
		menu.newEntry({menuName: submenu, entryText: 'sep'});
		{ // Open descriptors
			menu.newEntry({menuName: submenu, entryText: 'Open main descriptor', func: () => {
				const file = folders.xxx + 'helpers\\music_graph_descriptors_xxx.js';
				if (_isFile(file)){_run('notepad.exe', file);}
			}});
			menu.newEntry({menuName: submenu, entryText: 'Open user descriptor', func: () => {
				const file = folders.xxx + 'helpers\\music_graph_descriptors_xxx_user.js';
				if (_isFile(file)){_run('notepad.exe', file);}
			}});
		}
		menu.newEntry({menuName: submenu, entryText: 'sep'});
		{ // Open graph html file
			menu.newEntry({menuName: submenu, entryText: 'Show Music Graph on Browser', func: () => {
				const file = folders.xxx + 'Draw Graph.html';
				if (_isFile(file)){_run(file);}
			}});
		}
	}
	menu.newEntry({entryText: 'sep'});
	{
		const subMenuName = menu.newMenu('Button config...');
		menu.newEntry({menuName: subMenuName, entryText: 'Rename button...', func: () => {
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
		menu.newEntry({menuName: subMenuName, entryText: 'Show shortcuts on tooltip', func: () => {
			properties.bTooltipInfo[1] = !properties.bTooltipInfo[1];
			overwriteProperties(properties); // Force overwriting
		}});
		menu.newCheckMenu(subMenuName, 'Show shortcuts on tooltip', void(0), () => {return properties.bTooltipInfo[1];});
	}
	menu.newEntry({entryText: 'sep'});
	{	// Readmes
		const subMenuName = menu.newMenu('Readmes...');
		menu.newEntry({menuName: subMenuName, entryText: 'Open popup with readme:', func: null, flags: MF_GRAYED});
		menu.newEntry({menuName: subMenuName, entryText: 'sep'});
		let iCount = 0;
		const readmes = {
			Full: folders.xxx + 'helpers\\readme\\search_bydistance.txt',
			sep1: 'sep',
			DYNGENRE: folders.xxx + 'helpers\\readme\\search_bydistance_dyngenre.txt',
			GRAPH: folders.xxx + 'helpers\\readme\\search_bydistance_graph.txt',
			WEIGHT: folders.xxx + 'helpers\\readme\\search_bydistance_weight.txt',
			sep2: 'sep',
			'Recipes & Themes': folders.xxx + 'helpers\\readme\\search_bydistance_recipes_themes.txt',
			sep3: 'sep',
			'Tagging requisites': folders.xxx + 'helpers\\readme\\search_bydistance_recipes_themes.txt',
			'Tags sources': folders.xxx + 'helpers\\readme\\tags_sources.txt',
			'Other tags notes': folders.xxx + 'helpers\\readme\\tags_notes.txt'
		};
		if (Object.keys(readmes).length) {
			const rgex = /sep\b|separator\b/gi;
			Object.entries(readmes).forEach(([key, value]) => { // Only show non empty files
				if (rgex.test(value)) {menu.newEntry({menuName: subMenuName, entryText: 'sep'}); return;}
				else if (_isFile(value)) {
					const readme = _open(value, utf8); // Executed on script load
					if (readme.length) {
						menu.newEntry({menuName: subMenuName, entryText: key, func: () => { // Executed on menu click
							if (_isFile(value)) {
								const readme = _open(value, utf8);
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
		const validVars = Object.keys(music_graph_descriptors).map((key) => {return 'music_graph_descriptors.' + key;});
		if (val.indexOf('+') === -1 && val.indexOf('-') === -1 && val.indexOf('*') === -1 && val.indexOf('/') === -1 && validVars.indexOf(val) === -1) {
			console.log('Error parsing sbd_max_graph_distance (using no arithmethics or variable): ' + val);
			return;
		}
		val = Math.floor(eval(val));
	}
	return val;
}