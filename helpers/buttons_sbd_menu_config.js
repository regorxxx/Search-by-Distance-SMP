'use strict';
//08/11/22

include('menu_xxx.js');
include('helpers_xxx.js');
include('helpers_xxx_file.js');
include('helpers_xxx_prototypes.js');
include('helpers_xxx_time.js');
include('helpers_xxx_input.js');

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
	// Helpers
	const createTagMenu = (menuName, options) => {
		options.forEach((key) => {
			if (key === 'sep') {menu.newEntry({menuName, entryText: 'sep'}); return;}
			const idxEnd = properties[key][0].indexOf('(');
			const value = JSON.parse(bProperties && recipe.properties.hasOwnProperty(key) ? _recipe[key] : properties[key][1]).join(',');
			const entryText = properties[key][0].substring(
				properties[key][0].indexOf('.') + 1, idxEnd !== -1 
					? idxEnd - 1 
					: Infinity
				) + '...' + '\t[' + (
					typeof value === 'string' && value.length > 10 
					? value.slice(0,10) + '...' 
					: value
				) + ']' + (
					bProperties && recipe.properties.hasOwnProperty(key) 
						? ' (forced by recipe)' 
						: ''
				);
			menu.newEntry({menuName, entryText, func: () => {
				const example = '["GENRE","$replace(%DISCOGS_GENRE%,\', &&\',\',\')","GENRE2"]';
				const input = Input.json('array strings', JSON.parse(properties[key][1]), 'Enter tag(s) or TF expression(s): (JSON)\n\nFor example:\n' + example, 'Search by distance', example, void(0), true);
				if (input === null) {return;}
				properties[key][1] = JSON.stringify(input);
				overwriteProperties(properties); // Updates panel
				if (key === 'genreTag' || key === 'styleTag') {
					const answer = WshShell.Popup('Reset link cache now?\nOtherwise do it manually after all tag changes.', 0, 'Search by distance', popup.question + popup.yes_no);
					if (answer === popup.yes) {
						menu.btn_up(void(0), void(0), void(0), 'Debug and testing\\Reset link cache');
					}
				}
			}, flags: bProperties && recipe.properties.hasOwnProperty(key) ? MF_GRAYED : MF_STRING});
		});
	};
	
	const createSwitchMenu = (menuName, option, values, flag = [], hook = null) => {
		values.forEach((key, i) => {
			if (key === 'sep') {menu.newEntry({menuName, entryText: 'sep', flags: MF_GRAYED}); return;}
			const entryText = key + (recipe.hasOwnProperty(option) && recipe[option] === key ? '\t(forced by recipe)' : '');
			menu.newEntry({menuName, entryText, func: () => {
				properties[option][1] = key;
				if (hook) {hook(key, i);}
				overwriteProperties(properties); // Updates panel
			}, flags: recipe.hasOwnProperty(key) || (flag[i] !== void(0) ? flag[i] : false) ? MF_GRAYED : MF_STRING});
			menu.newCheckMenu(menuName, entryText, void(0), () => {return (recipe.hasOwnProperty(option) ? recipe[option] === key : properties[option][1] === key);});
		});
	};
	
	const createBoolMenu = (menuName, options, flag = [], hook = null) => {
		options.forEach((key, i) => {
			if (key === 'sep') {menu.newEntry({menuName, entryText: 'sep', flags: MF_GRAYED}); return;}
			const entryText = properties[key][0].substr(properties[key][0].indexOf('.') + 1) + (recipe.hasOwnProperty(key) ? '\t(forced by recipe)' : '');
			menu.newEntry({menuName, entryText, func: () => {
				properties[key][1] = !properties[key][1];
				if (hook) {hook(key, i);}
				overwriteProperties(properties); // Updates panel
			}, flags: recipe.hasOwnProperty(key) || (flag[i] !== void(0) ? flag[i] : false) ? MF_GRAYED : MF_STRING});
			menu.newCheckMenu(menuName, entryText, void(0), () => {return (recipe.hasOwnProperty(key) ? recipe[key] : properties[key][1]);});
		});
	};
	
	// Header
	menu.newEntry({entryText: 'Set config (may be overwritten by recipe):', func: null, flags: MF_GRAYED});
	menu.newEntry({entryText: 'sep'});
	{	// Methods
		const menuName = menu.newMenu('Set method');
		{
			createSwitchMenu(menuName, 'method', ['WEIGHT', 'GRAPH', 'DYNGENRE']);
		}
		menu.newEntry({menuName, entryText: 'sep'});
		{
			const sbd_max_graph_distance = recipe.hasOwnProperty('sbd_max_graph_distance') ? parseGraphVal(recipe.sbd_max_graph_distance) : parseGraphVal(properties.sbd_max_graph_distance[1]);
			const options = ['scoreFilter', 'minScoreFilter', 'sep', 'sbd_max_graph_distance'];
			const bIsGraph = recipe.hasOwnProperty('method') && recipe.method  === 'GRAPH' || !recipe.hasOwnProperty('method') && properties.method[1] === 'GRAPH';
			options.forEach((key) => {
				if (key === 'sep') {menu.newEntry({menuName, entryText: 'sep', flags: MF_GRAYED}); return;}
				const flags = recipe.hasOwnProperty(key) ? MF_GRAYED : ((bIsGraph && key === 'sbd_max_graph_distance' || key !== 'sbd_max_graph_distance') ? MF_STRING : MF_GRAYED);
				const idxEnd = properties[key][0].indexOf('(');
				const val = properties[key][1];
				const entryText = properties[key][0].substring(properties[key][0].indexOf('.') + 1, idxEnd !== -1 ? idxEnd - 1 : Infinity) + '...' + (recipe.hasOwnProperty(key) ? '\t[' + (key === 'sbd_max_graph_distance' && isNaN(val) ? recipe[key].split('.').pop() + ' --> ' + sbd_max_graph_distance : recipe[key]) + '] (forced by recipe)' :  '\t[' + (key === 'sbd_max_graph_distance' && isNaN(val) ? val.toString().split('.').pop() + ' --> ' + sbd_max_graph_distance : val) + ']');
				menu.newEntry({menuName, entryText, func: () => {
					let input;
					if (key !== 'sbd_max_graph_distance') {
						input = Input.number('int positive', val, 'Enter number: (between 0 and 100)', 'Search by distance', properties[key][3], [(input) => input <= 100, (input) => input <= properties.scoreFilter[1]]);
						if (input === null) {return;}
					} else {
						try {input = utils.InputBox(window.ID, 'Enter number: (greater than 0)\n(Infinity and descriptor\'s variables are allowed)', 'Search by distance', val, true);} catch(e) {return;}
						if (!input || !input.length) {return;}
						if (parseGraphDistance(input) === null) {return;}
						if (!Number.isNaN(Number(input))) {input = Number(input);} // Force a number type if possible
					}
					properties[key][1] = input;
					overwriteProperties(properties); // Updates panel
				}, flags});
			});
		}
	}
	{	// Weights
		const menuName = menu.newMenu('Set weights');
		const options = ['genreWeight', 'styleWeight', 'dyngenreWeight', 'moodWeight', 'dateWeight', 'keyWeight', 'bpmWeight', 'composerWeight', 'customStrWeight', 'customNumWeight'];
		const bIsDyngenreMethodRecipe = recipe.hasOwnProperty('method') && recipe.method  !== 'DYNGENRE';
		const bIsDyngenreMethodProp = !recipe.hasOwnProperty('method') && properties.method[1] !== 'DYNGENRE';
		options.forEach((key) => {
			const bIsDyngenreRecipe = key === 'dyngenreWeight' && bIsDyngenreMethodRecipe;
			const bIsDyngenreProp = key === 'dyngenreWeight' && bIsDyngenreMethodProp;
			const bPresent = recipe.hasOwnProperty(key);
			const entryText = 'Set ' + key.replace('Weight','') + ' weight' + (bPresent || bIsDyngenreRecipe ? '\t[' + (bIsDyngenreRecipe ?  '-1' : recipe[key]) + '] (forced by recipe)' : '\t[' + (bIsDyngenreProp ?  '-1' : properties[key][1]) + ']');
			menu.newEntry({menuName, entryText, func: () => {
				const input = Input.number('int positive', properties[key][1], 'Enter number: (greater or equal to 0)', 'Search by distance', properties[key][3]);
				if (input === null) {return;}
				properties[key][1] = input;
				overwriteProperties(properties);
			}, flags: bPresent || bIsDyngenreProp || bIsDyngenreRecipe ? MF_GRAYED : MF_STRING});
		});
	}
	{	// Ranges
		const menuName = menu.newMenu('Set ranges');
		{
			const options = ['dateRange', 'keyRange', 'bpmRange','customNumRange'];
			options.forEach((key) => {
				menu.newEntry({menuName, entryText: 'Set ' + key.replace('Range','') + ' range' + (recipe.hasOwnProperty(key) ? '\t[' + recipe[key] + '] (forced by recipe)' : '\t[' + properties[key][1] + ']'), func: () => {
					const input = Input.number('int positive', properties[key][1], 'Enter number: (greater or equal to 0)', 'Search by distance', properties[key][3]);
					if (input === null) {return;}
					properties[key][1] = input;
					overwriteProperties(properties);
				}, flags: recipe.hasOwnProperty(key) ? MF_GRAYED : MF_STRING});
			});
		}
		menu.newEntry({menuName, entryText: 'sep'});
		{
			createBoolMenu(menuName, ['bNegativeWeighting']);
		}
	}
	{	// Pre-scoring filters:
		const menuName = menu.newMenu('Set pre-scoring filters');
		{	// Forced Query
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
		{	// Additional filters
			const subMenuName = menu.newMenu('Additional pre-defined filters...', menuName);
			let options = [];
			const file = folders.xxx + 'presets\\Search by\\filters\\custom_button_filters.json';
			const bFile = _isFile(file);
			if (bFile) {
				options = _jsonParseFileCheck(file, 'Query filters json', 'Search by distance', utf8) || [];
			} else {
				options = [
					{title: 'Female vocals',			query: globQuery.female}, 
					{title: 'Instrumentals',			query: globQuery.instrumental},
					{title: 'Acoustic tracks',			query: globQuery.acoustic},
					{title: 'Rating > 2',				query: globQuery.ratingGr2},
					{title: 'Rating > 3',				query: globQuery.ratingGr3},
					{title: 'Length < 6 min',			query: globQuery.shortLength},
					{title: 'Only Stereo',				query: globQuery.stereo},
					{title: 'sep'},		
					{title: 'No Female vocals',			query: globQuery.noFemale}, 
					{title: 'No Instrumentals', 		query: globQuery.noInstrumental},
					{title: 'No Acoustic tracks',		query: globQuery.noAcoustic},
					{title: 'Not rated',				query: globQuery.noRating},
					{title: 'Not Live (unless Hi-Fi)',	query: globQuery.noLive}
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
		{	// Influences filter
			const options = ['bUseAntiInfluencesFilter', 'bConditionAntiInfluences', 'sep', 'bUseInfluencesFilter', 'sep', 'bSimilArtistsFilter', 'sep', 'bSameArtistFilter'];
			const bConditionAntiInfluences = recipe.hasOwnProperty('bConditionAntiInfluences') ? recipe['bConditionAntiInfluences'] : properties['bConditionAntiInfluences'][1];
			options.forEach((key) => {
				if (key === 'sep') {menu.newEntry({menuName, entryText: 'sep'}); return;}
				const entryText = properties[key][0].substr(properties[key][0].indexOf('.') + 1) + (recipe.hasOwnProperty(key) ? '\t(forced by recipe)' : '');
				menu.newEntry({menuName, entryText, func: () => {
					if (key === 'bConditionAntiInfluences') {fb.ShowPopupMessage('This option overrides the global anti-influences filter option,\nso it will be disabled at the configuration menu.\n\nWill be enabled automatically for tracks having any of these genre/styles:\n' + music_graph_descriptors.replaceWithSubstitutionsReverse(music_graph_descriptors.style_anti_influences_conditional).joinEvery(', ', 6), 'Search by distance');}
					if (key === 'bSameArtistFilter') {fb.ShowPopupMessage('This option may overrride some aspects of the similar artist filter option.\n\nWhen no similar artists data is found, by default only the selected artist would be considered. Thus allowing only tracks by the same artist to be considered.\n\nFiltering the selected artist forces the similar artist filter to fallback to checking all the library tracks in that case, otherwise there would be zero artists to check. It\'s equivalent to have the filter disabled when no similar artist data is present for the selected track\'s artist.\n\nWhen similar artists data is available, it works as expected, skipping the selected artist and only using the others. Thus strictly showing tracks by [others] similar artists.', 'Search by distance');}
					properties[key][1] = !properties[key][1];
					overwriteProperties(properties); // Updates panel
				}, flags: (key === 'bUseAntiInfluencesFilter' && bConditionAntiInfluences ? MF_GRAYED : (recipe.hasOwnProperty(key) ? MF_GRAYED : MF_STRING))});
				menu.newCheckMenu(menuName, entryText, void(0), () => {return (recipe.hasOwnProperty(key) ? recipe[key] : properties[key][1]);});
			});
		}
	}
	{	// Post-scoring filters:
		const menuName = menu.newMenu('Set post-scoring filters');
		{ // Tags filter
			createTagMenu(menuName, ['poolFilteringTag']);
		}
		{
			const options = ['poolFilteringN'];
			options.forEach((key) => {
				const idxEnd = properties[key][0].indexOf('(');
				const entryText = properties[key][0].substring(properties[key][0].indexOf('.') + 1, idxEnd !== -1 ? idxEnd - 1 : Infinity) + '...' + (recipe.hasOwnProperty(key) ? '\t[' + recipe[key] + '] (forced by recipe)' :  '\t[' + properties[key][1] + ']');
				menu.newEntry({menuName, entryText, func: () => {
					const input = Input.number('int', properties[key][1], 'Enter number: (greater or equal to 0)\n(-1 to disable)', 'Search by distance', properties[key][3], [(input) => input >= -1]);
					if (input === null) {return;}
					properties[key][1] = input;
					overwriteProperties(properties); // Updates panel
				}, flags: recipe.hasOwnProperty(key) ? MF_GRAYED : MF_STRING});
			});
		}
	}
	{	// Pool picking:
		const menuName = menu.newMenu('Set pool picking');
		{
			createBoolMenu(menuName, ['bRandomPick']);
		}
		{
			const options = ['probPick'];
			options.forEach((key) => {
				const idxEnd = properties[key][0].indexOf('(');
				const entryText = properties[key][0].substring(properties[key][0].indexOf('.') + 1, idxEnd !== -1 ? idxEnd - 1 : Infinity) + '...' + (recipe.hasOwnProperty(key) ? '\t[' + recipe[key] + '] (forced by recipe)' :  '\t[' + properties[key][1] + ']');
				menu.newEntry({menuName, entryText, func: () => {
					const input = Input.number('int positive', properties[key][1], 'Enter number: (between 0 and 100)', 'Search by distance', properties[key][3], [(input) => input <= 100]);
					if (input === null) {return;}
					properties[key][1] = input;
					overwriteProperties(properties); // Updates panel
				}, flags: recipe.hasOwnProperty(key) ? MF_GRAYED : MF_STRING});
			});
		}
	}
	{	// Final sorting
		const menuFlags = (recipe.hasOwnProperty('bInKeyMixingPlaylist') ? recipe.bInKeyMixingPlaylist : properties.bInKeyMixingPlaylist[1]) ? MF_GRAYED : MF_STRING;
		const menuText = 'Set final sorting' + (properties.bInKeyMixingPlaylist[1] || recipe.bInKeyMixingPlaylist ? '       -harmonic mixing-' : '')
		const menuName = menu.newMenu(menuText, void(0), menuFlags);
		createBoolMenu(menuName, ['bSortRandom', 'bProgressiveListOrder', 'sep', 'bScatterInstrumentals', 'sep', 'bSmartShuffle'], void(0), (key) => {
			let toDisable = [];
			if (key === 'bSortRandom') {toDisable = ['bProgressiveListOrder', 'bSmartShuffle'];}
			else if (key === 'bProgressiveListOrder') {toDisable = ['bSortRandom', 'bSmartShuffle'];}
			else if (key === 'bSmartShuffle') {toDisable = ['bSortRandom', 'bProgressiveListOrder'];}
			toDisable.forEach((noKey) => {if (properties[noKey][1]) {properties[noKey][1] = !properties[noKey][1];}});
		});
	}
	{	// Special playlists:
		const menuName = menu.newMenu('Special playlist rules');
		{
			createBoolMenu(menuName, ['bProgressiveListCreation']);
		}
		{
			const options = ['progressiveListCreationN'];
			const lowerHundred = new Set(['progressiveListCreationN']);
			options.forEach((key) => {
				const idxEnd = properties[key][0].indexOf('(');
				const entryText = properties[key][0].substring(properties[key][0].indexOf('.') + 1, idxEnd !== -1 ? idxEnd - 1 : Infinity) + '...' + (recipe.hasOwnProperty(key) ? '\t[' + recipe[key] + '] (forced by recipe)' :  '\t[' + properties[key][1] + ']');
				menu.newEntry({menuName, entryText, func: () => {
					const input = Input.number('int positive', properties[key][1], 'Enter number: (between 2 and 100)', 'Search by distance', properties[key][3], [(input) => input >= 2 && input <= 100]);
					if (input === null) {return;}
					properties[key][1] = input;
					overwriteProperties(properties); // Updates panel
				}, flags: recipe.hasOwnProperty(key) ? MF_GRAYED : MF_STRING});
			});
		}
		menu.newEntry({menuName, entryText: 'sep'});
		{
			createBoolMenu(
				menuName, 
				['bInKeyMixingPlaylist', 'bHarmonicMixDoublePass'], 
				[void(0), recipe.hasOwnProperty('bInKeyMixingPlaylist') && !recipe.bInKeyMixingPlaylist || !recipe.hasOwnProperty('bInKeyMixingPlaylist') && !properties.bInKeyMixingPlaylist[1]]
			);
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
					const input = Input.string('string', properties[key][1], 'Enter TF expression:\n\n%, $, [ and ] must be enclosed in \' chars. \'\' results in single quote.\nFor ex: %artist%\'\'s Mix   ->   ACDC\'s Mix\n\n%sbd_theme% is available when using themes to avoid showing the raw TF expression (since there is no track to evaluate it with). When a theme is not being used, it\'s evaluated as a tag.\nFor ex: $if2(%sbd_theme%,%artist%)\'\'s Mix   ->   Test\'s Mix', 'Search by distance', '%artist%\'\'s Mix', void(0), true);
					if (input === null) {return;}
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
					const input = Input.number('int positive', properties[key][1], 'Enter number: (greater than 0)\n(Infinity is allowed)', 'Search by distance', properties[key][3], [(input) => input >= 0]);
					if (input === null) {return;}
					properties[key][1] = input;
					overwriteProperties(properties); // Updates panel
				}, flags: recipe.hasOwnProperty(key) ? MF_GRAYED : MF_STRING});
			});
		}
		menu.newEntry({menuName, entryText: 'sep'});
		{
			{
				createTagMenu(menuName, ['checkDuplicatesByTag']);
			}
			{
				createBoolMenu(
					menuName, 
					['bAdvTitle'], 
					void(0),
					(key) => {if (key === 'bAdvTitle' && properties.bAdvTitle[1]) {fb.ShowPopupMessage(globRegExp.title.desc, 'Search by distance');}}
				);
			}
		}
	}
	menu.newEntry({entryText: 'sep'});
	{	// Menu to configure properties: tags
		const menuName = menu.newMenu('Remap tags');
		const options = ['genreTag', 'styleTag', 'moodTag', 'dateTag', 'keyTag', 'bpmTag', 'composerTag', 'customStrTag', 'customNumTag','sep', 'smartShuffleTag', 'sep', 'genreStyleFilterTag'];
		createTagMenu(menuName, options);
		menu.newEntry({menuName, entryText: 'sep'});
		{	// Cache
			const options = ['bAscii', 'bTagsCache'];
			options.forEach((key, i) => {
				const propObj = key === 'bTagsCache' ? sbd.panelProperties : properties;
				const entryText = propObj[key][0].substr(propObj[key][0].indexOf('.') + 1) + (recipe.hasOwnProperty(key) ? '\t(forced by recipe)' : '') + (key === 'bTagsCache' && !isFoobarV2 ? '\t-only Fb >= 2.0-' : '');
				menu.newEntry({menuName, entryText, func: () => {
					propObj[key][1] = !propObj[key][1];
					overwriteProperties(propObj); // Updates panel
					if (key === 'bAscii') {
						const answer = WshShell.Popup('Reset link cache now?\nOtherwise do it manually after all tag changes.', 0, 'Search by distance', popup.question + popup.yes_no);
						if (answer === popup.yes) {
							menu.btn_up(void(0), void(0), void(0), 'Debug and testing\\Reset link cache');
						}
					} else if (key === 'bTagsCache') {
						if (propObj.bTagsCache[1]) {
							fb.ShowPopupMessage('This feature should only be enabled on Foobar2000 versions >= 2.0.\nPrevious versions already cached tags values, thus not requiring it.', 'Tags cache');
							const answer = WshShell.Popup('Reset tags cache now?\nOtherwise do it manually after all tag changes.', 0, 'Search by distance', popup.question + popup.yes_no);
							if (answer === popup.yes) {
								menu.btn_up(void(0), void(0), void(0), 'Debug and testing\\Reset tags cache');
							} else {
								tagsCache.load();
							}
						} else {
							tagsCache.unload();
						}
					}
				}, flags: recipe.hasOwnProperty(key) || (key === 'bTagsCache' && !isFoobarV2) ? MF_GRAYED : MF_STRING});
				menu.newCheckMenu(menuName, entryText, void(0), () => {return (recipe.hasOwnProperty(key) ? recipe[key] : propObj[key][1]);});
			});
		}
		menu.newEntry({menuName, entryText: 'sep'});
		{	// Reset
			menu.newEntry({menuName, entryText: 'Restore defaults...', func: () => {
				options.forEach((tagName) => {
					if (properties.hasOwnProperty(tagName) && SearchByDistance_properties.hasOwnProperty(tagName)) {
						properties[tagName][1] = SearchByDistance_properties[tagName][1];
					}
				});
				overwriteProperties(properties); // Force overwriting
				const answer = WshShell.Popup('Reset link cache now?\nOtherwise do it manually after all tag changes.', 0, 'Search by distance', popup.question + popup.yes_no);
				if (answer === popup.yes) {
					menu.btn_up(void(0), void(0), void(0), 'Debug and testing\\Reset link cache');
				}
			}});
		}
	}
	menu.newEntry({entryText: 'sep'});
	{	// Other tools
		const submenu = menu.newMenu('Other tools');
		{
			menu.newEntry({menuName: submenu, entryText: 'Calculate similar artists tags', func: () => {
				calculateSimilarArtistsFromPls({items: plman.GetPlaylistSelectedItems(plman.ActivePlaylist), properties});
			}});
			menu.newEntry({menuName: submenu, entryText: 'Write similar artists tags', func: () => {
				writeSimilarArtistsTags();
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
				findStyleGenresMissingGraph({
					genreStyleFilter: JSON.parse(properties.genreStyleFilterTag[1]).filter(Boolean),
					genretag: JSON.parse(properties.genreTag[1]),
					styleTag: JSON.parse(properties.styleTag[1]),
					bAscii: properties.bAscii[1],
					bPopup: true
				});
			}});
			// Graph debug
			menu.newEntry({menuName: submenu, entryText: 'Debug Graph (check console)', func: () => {
				if (sbd.panelProperties.bProfile[1]) {var profiler = new FbProfiler('graphDebug');}
				graphDebug(sbd.allMusicGraph, true); // Show popup on pass
				if (sbd.panelProperties.bProfile[1]) {profiler.Print();}
			}});
			// Graph test
			menu.newEntry({menuName: submenu, entryText: 'Run distance tests (check console)', func: () => {
				if (sbd.panelProperties.bProfile[1]) {var profiler = new FbProfiler('testGraph');}
				testGraph(sbd.allMusicGraph);
				testGraphV2(sbd.allMusicGraph);
				if (sbd.panelProperties.bProfile[1]) {profiler.Print();}
			}});
		}
		menu.newEntry({menuName: submenu, entryText: 'sep'});
		{ 	// Graph cache reset Async
			menu.newEntry({menuName: submenu, entryText: 'Reset link cache' + (sbd.isCalculatingCache ? '\t -processing-' : ''), func: () => {
				if (sbd.isCalculatingCache) {
					fb.ShowPopupMessage('There is a calculation currently on process.\nTry again after it finishes. Check console (or animation).', 'Graph cache');
 					return;
				}
				_deleteFile(folders.data + 'searchByDistance_cacheLink.json');
				_deleteFile(folders.data + 'searchByDistance_cacheLinkSet.json');
				cacheLink = void(0);
				cacheLinkSet = void(0);
				updateCache({bForce: true, properties}); // Creates new one and also notifies other panels to discard their cache
			}, flags: !sbd.isCalculatingCache ? MF_STRING : MF_GRAYED});
			// Tags cache reset Async
			menu.newEntry({menuName: submenu, entryText: 'Reset tags cache' + (!isFoobarV2 ? '\t-only Fb >= 2.0-' : (sbd.panelProperties.bTagsCache[1] ?  '' : '\t -disabled-')), func: () => {
				const keys = ['genreTag', 'styleTag', 'moodTag', 'dateTag', 'keyTag', 'bpmTag', 'composerTag', 'customStrTag', 'customNumTag'].map((key) => {return JSON.parse(properties[key][1]).filter(Boolean);});
				const tags = keys.concat([['TITLE'], [globTags.title]])
					.map((tagName) => {return tagName.map((subTagName) => {return (subTagName.indexOf('$') === -1 ? '%' + subTagName + '%' : subTagName);});})
					.map((tagName) => {return tagName.join(', ');}).filter(Boolean)
					.filter((tagName) => {return tagsCache.cache.has(tagName);});
				tagsCache.clear(tags);
				tagsCache.save();
				tagsCache.cacheTags(tags, iStepsLibrary, iDelayLibrary, fb.GetLibraryItems().Convert(), true).then(() => {tagsCache.save();});
			}, flags: sbd.panelProperties.bTagsCache[1] ? MF_STRING : MF_GRAYED});
		}
		menu.newEntry({menuName: submenu, entryText: 'sep'});
		{
			menu.newEntry({menuName: submenu, entryText: 'Graph statistics', func: () => {
			if (sbd.panelProperties.bProfile[1]) {var profiler = new FbProfiler('graphStatistics');}
				parent.switchAnimation('graphStatistics', true);
				graphStatistics({properties, graph: sbd.allMusicGraph, influenceMethod: sbd.influenceMethod}).then((resolve) => {
					_save(folders.temp + 'musicGraphStatistics.txt', resolve.text);
					console.log(resolve.text);
					parent.switchAnimation('graphStatistics', false);
					if (sbd.panelProperties.bProfile[1]) {profiler.Print();}
				});
			}});
		}
		menu.newEntry({menuName: submenu, entryText: 'sep'});
		{ // Open descriptors
			menu.newEntry({menuName: submenu, entryText: 'Open main descriptor', func: () => {
				const file = folders.xxx + 'helpers\\music_graph_descriptors_xxx.js';
				if (_isFile(file)){_explorer(file); _run('notepad.exe', file);}
			}});
			menu.newEntry({menuName: submenu, entryText: 'Open user descriptor', func: () => {
				const file = folders.userHelpers + 'music_graph_descriptors_xxx_user.js';
				if (!_isFile(file)){
					_copyFile(folders.xxx + 'helpers\\music_graph_descriptors_xxx_user.js', file);
					const readme = _open(folders.xxx + 'helpers\\readme\\search_bydistance_user_descriptors.txt', utf8);
					if (readme.length) {fb.ShowPopupMessage(readme, 'User descriptors');}
				}
				if (_isFile(file)){_explorer(file); _run('notepad.exe', file);}
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
				parent.w = _gr.CalcTextWidth(input, _gdiFont('Segoe UI', 12 * buttonsBar.config.scale)) + 30;
				parent.w *= buttonsBar.config.scale;
				parent.changeScale(buttonsBar.config.scale);
				window.Repaint();
			}
		}});
		menu.newEntry({menuName: subMenuName, entryText: 'Show shortcuts on tooltip', func: () => {
			properties.bTooltipInfo[1] = !properties.bTooltipInfo[1];
			overwriteProperties(properties); // Force overwriting
		}});
		menu.newCheckMenu(subMenuName, 'Show shortcuts on tooltip', void(0), () => {return properties.bTooltipInfo[1];});
	}
	menu.newEntry({entryText: 'sep'});
	{	// Reset
		menu.newEntry({entryText: 'Restore defaults...', func: () => {
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
	{	// Readmes
		const subMenuName = menu.newMenu('Readmes...');
		menu.newEntry({menuName: subMenuName, entryText: 'Open popup with readme:', func: null, flags: MF_GRAYED});
		menu.newEntry({menuName: subMenuName, entryText: 'sep'});
		let iCount = 0;
		const readmes = {
			Main: folders.xxx + 'helpers\\readme\\search_bydistance.txt',
			sep1: 'sep',
			'Method: DYNGENRE': folders.xxx + 'helpers\\readme\\search_bydistance_dyngenre.txt',
			'Method: GRAPH': folders.xxx + 'helpers\\readme\\search_bydistance_graph.txt',
			'Method: WEIGHT': folders.xxx + 'helpers\\readme\\search_bydistance_weight.txt',
			sep2: 'sep',
			'Recipes & Themes': folders.xxx + 'helpers\\readme\\search_bydistance_recipes_themes.txt',
			'Similar Artists': folders.xxx + 'helpers\\readme\\search_bydistance_similar_artists.txt',
			'User descriptors': folders.xxx + 'helpers\\readme\\search_bydistance_user_descriptors.txt',
			sep3: 'sep',
			'Tagging requisites': folders.xxx + 'helpers\\readme\\tags_structure.txt',
			'Tags sources': folders.xxx + 'helpers\\readme\\tags_sources.txt',
			'Other tags notes': folders.xxx + 'helpers\\readme\\tags_notes.txt'
		};
		if (Object.keys(readmes).length) {
			const rgex = /^sep$|^separator$/i;
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