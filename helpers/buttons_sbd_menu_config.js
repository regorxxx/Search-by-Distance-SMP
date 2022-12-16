'use strict';
//15/12/22

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
	const tags = JSON.parse(properties.tags[1]);
	// Recipe forced theme?
	if (properties.recipe[1].length) {
		recipe = _isFile(properties.recipe[1]) ? _jsonParseFileCheck(properties.recipe[1], 'Recipe json', 'Search by distance', utf8) || {}: _jsonParseFileCheck(recipePath + properties.recipe[1], 'Recipe json', 'Search by distance', utf8) || {};
	}
	// Process nested recipes
	if (recipe.hasOwnProperty('recipe')) {
		const toAdd = processRecipe(recipe.recipe);
		delete toAdd.recipe;
		Object.keys(toAdd).forEach((key) => {
			if (!recipe.hasOwnProperty(key)) {
				recipe[key] = toAdd[key];
			} else if (key === 'tags') {
				for (let key in toAdd.tags) {
					if (!recipe.tags.hasOwnProperty(key)) {
						recipe.tags[key] = toAdd.tags[key];
					} else {
						for (let subKey in toAdd.tags[key]) {
							if (!recipe.tags[key].hasOwnProperty(subKey)) {
								recipe.tags[key][subKey] = toAdd.tags[key][subKey];
							}
						}
					}
				}
			}
		});
	}
	// Process placeholders for tags
	if (recipe.hasOwnProperty('tags') && recipe.tags.hasOwnProperty('*')) {
		for (let key in tags) {
			if (!recipe.tags.hasOwnProperty(key)) {recipe.tags[key] = recipe.tags['*'];}
		}
	}
	// Recipe forced properties?
	const bProperties = recipe.hasOwnProperty('properties');
	// Recipe forced tags?
	const bRecipeTags = recipe.hasOwnProperty('tags');
	// Recipe-only tags?
	const recipeTags = bRecipeTags ? Object.keys(recipe.tags).filter((t) => t !== '*') : [];
	// Helpers
	const createTagMenu = (menuName, options) => {
		options.forEach((key) => {
			if (key === 'sep') {menu.newEntry({menuName, entryText: 'sep'}); return;}
			const idxEnd = properties[key][0].indexOf('(');
			const value = JSON.parse(bProperties && recipe.properties.hasOwnProperty(key) ? recipe[key] : properties[key][1]).join(',');
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
				const example = '["GENRE","GENRE2"]';
				const input = Input.json('array strings', JSON.parse(properties[key][1]), 'Enter tag(s) or TF expression(s): (JSON)\n\nFor example:\n' + example, 'Search by distance', example, void(0), true);
				if (input === null) {return;}
				properties[key][1] = JSON.stringify(input);
				overwriteProperties(properties); // Updates panel
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
			}, flags: recipe.hasOwnProperty(option) || (flag[i] !== void(0) ? flag[i] : false) ? MF_GRAYED : MF_STRING});
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
	{	// Search Methods
		const menuName = menu.newMenu('Set Search method');
		{
			createSwitchMenu(menuName, 'method', ['WEIGHT', 'GRAPH', 'DYNGENRE']);
		}
		menu.newEntry({menuName, entryText: 'sep'});
		{
			const graphDistance = recipe.hasOwnProperty('graphDistance') ? parseGraphVal(recipe.graphDistance) : parseGraphVal(properties.graphDistance[1]);
			const key = 'graphDistance';
			const bIsGraph = recipe.hasOwnProperty('method') && recipe.method  === 'GRAPH' || !recipe.hasOwnProperty('method') && properties.method[1] === 'GRAPH';
			const flags = recipe.hasOwnProperty(key) ? MF_GRAYED : (bIsGraph ? MF_STRING : MF_GRAYED);
			const idxEnd = properties[key][0].indexOf('(');
			const val = properties[key][1];
			let displayedVal = recipe.hasOwnProperty(key) ? recipe[key] : val;
			displayedVal = isNaN(displayedVal) ? displayedVal.split('.').pop() + ' --> ' + graphDistance : displayedVal;
			const entryText = properties[key][0].substring(properties[key][0].indexOf('.') + 1, idxEnd !== -1 ? idxEnd - 1 : Infinity) + '...' + (recipe.hasOwnProperty(key) ? '\t[' + displayedVal + '] (forced by recipe)' :  '\t[' + displayedVal + ']');
			menu.newEntry({menuName, entryText, func: () => {
				let input;
				try {input = utils.InputBox(window.ID, 'Enter number: (greater than 0)\n(Infinity and descriptor\'s variables are allowed)', 'Search by distance', val, true);} catch(e) {return;}
				if (!input || !input.length) {return;}
				if (parseGraphDistance(input) === null) {return;}
				if (!Number.isNaN(Number(input))) {input = Number(input);} // Force a number type if possible
				properties[key][1] = input;
				overwriteProperties(properties); // Updates panel
			}, flags});
		}
		menu.newEntry({menuName, entryText: 'sep'});
		{
			const options = ['scoreFilter', 'minScoreFilter'];
			options.forEach((key) => {
				if (key === 'sep') {menu.newEntry({menuName, entryText: 'sep', flags: MF_GRAYED}); return;}
				const flags = recipe.hasOwnProperty(key) ? MF_GRAYED : MF_STRING;
				const idxEnd = properties[key][0].indexOf('(');
				const val = properties[key][1];
				const entryText = properties[key][0].substring(properties[key][0].indexOf('.') + 1, idxEnd !== -1 ? idxEnd - 1 : Infinity) + '...' + (recipe.hasOwnProperty(key) ? '\t[' + recipe[key] + '] (forced by recipe)' :  '\t[' + val + ']');
				menu.newEntry({menuName, entryText, func: () => {
					let input;
					input = Input.number('int positive', val, 'Enter number: (between 0 and 100)', 'Search by distance', properties[key][3], [(input) => input <= 100, (input) => input <= properties.scoreFilter[1]]);
					if (input === null) {return;}
					properties[key][1] = input;
					overwriteProperties(properties); // Updates panel
				}, flags});
			});
		}
		menu.newEntry({menuName, entryText: 'sep'});
		createBoolMenu(menuName, ['bNegativeWeighting', 'bFilterWithGraph'], 
			[
				void(0), 
				recipe.hasOwnProperty('method') && recipe.method  !== 'GRAPH' || !recipe.hasOwnProperty('method') && properties.method[1] !== 'GRAPH'
			]
		);
	}
	{	// Tags and weights
		const menuName = menu.newMenu('Set Tags and weighting');
		const options = [...new Set([...Object.keys(tags), ...recipeTags])];
		const nonDeletable = ['genre', 'style', 'mood', 'key', 'bpm', 'date'];
		options.forEach((key) => {
			const subMenuName = menu.newMenu(capitalize(key), menuName);
			{	// Remap
				const bRecipe = bRecipeTags && recipe.tags.hasOwnProperty(key) && recipe.tags[key].hasOwnProperty('tf');
				const tag = bRecipe ? {...tags[key], ...recipe.tags[key]} : tags[key];
				if (!tag.type.includes('virtual')) {
					const value = tag.tf.join(',');
					const entryText = 'Remap...' + '\t[' + (
						typeof value === 'string' && value.length > 10 
							? value.slice(0,10) + '...' 
							: value
						) + ']' + (bRecipe ? ' (forced by recipe)' : '');
					menu.newEntry({menuName: subMenuName, entryText, func: () => {
						const example = '["GENRE","LASTFM_GENRE","GENRE2"]';
						const input = Input.json('array strings', tag.tf, 'Enter tag(s) or TF expression(s): (JSON)\n\nFor example:\n' + example, 'Search by distance', example, void(0), true);
						if (input === null) {return;}
						tags[key].tf = input;
						properties.tags[1] = JSON.stringify(tags);
						overwriteProperties(properties); // Updates panel
						if (tag.type.includes('graph')) {
							const answer = WshShell.Popup('Reset link cache now?\nOtherwise do it manually after all tag changes.', 0, 'Search by distance', popup.question + popup.yes_no);
							if (answer === popup.yes) {
								menu.btn_up(void(0), void(0), void(0), 'Debug and testing\\Reset link cache');
							}
						}
					}, flags: bRecipe ? MF_GRAYED : MF_STRING});
				} else {
					const entryText = 'Remap...\t[virtual]';
					menu.newEntry({menuName: subMenuName, entryText, flags: MF_GRAYED});
				}
			}
			{	// Ranges
				if ((tags[key] || recipe.tags[key]).hasOwnProperty('range')) {
					const bRecipe = bRecipeTags && recipe.tags.hasOwnProperty(key) && recipe.tags[key].hasOwnProperty('range');
					const tag = bRecipe ? {...tags[key], ...recipe.tags[key]} : tags[key];
					menu.newEntry({menuName: subMenuName, entryText: 'Range\t[' + tag.range + ']' + (bRecipe ? '(forced by recipe)' : ''), func: () => {
						const input = Input.number('int positive', tag.range, 'Range sets how numeric tags should be compared.\nA zero value forces an exact match, while greater ranges allow some interval to be compared against.\n\nEnter number: (greater or equal to 0)', 'Search by distance', 10);
						if (input === null) {return;}
						tags[key].range = input;
						properties.tags[1] = JSON.stringify(tags);
						overwriteProperties(properties);
					}, flags: bRecipe ? MF_GRAYED : MF_STRING});
				}
			}
			menu.newEntry({menuName: subMenuName, entryText: 'sep'});
			{	// Weights
				const bIsDyngenreMethodRecipe = recipe.hasOwnProperty('method') && recipe.method  !== 'DYNGENRE';
				const bIsDyngenreMethodProp = !recipe.hasOwnProperty('method') && properties.method[1] !== 'DYNGENRE';
				const bIsDyngenreRecipe = (key === 'dynGenre' && bIsDyngenreMethodRecipe);
				const bIsDyngenreProp = (key === 'dynGenre' && bIsDyngenreMethodProp);
				const bRecipe = bRecipeTags && recipe.tags.hasOwnProperty(key) && recipe.tags[key].hasOwnProperty('weight');
				const tag = bRecipe ? {...tags[key], ...recipe.tags[key]} : tags[key];
				const entryText = 'Weight' + (bRecipe || bIsDyngenreRecipe ? '\t[' + (bIsDyngenreRecipe ?  '-1' : tag.weight) + '] (forced by recipe)' : '\t[' + (bIsDyngenreProp ?  '-1' : tag.weight) + ']');
				menu.newEntry({menuName: subMenuName, entryText, func: () => {
					const input = Input.number('int positive', tag.weight, 'Weight measures the proportion of total scoring associated to this tag.\n\nEnter number: (greater or equal to 0)', 'Search by distance', 15);
					if (input === null) {return;}
					tags[key].weight = input;
					properties.tags[1] = JSON.stringify(tags);
					overwriteProperties(properties);
				}, flags: bRecipe || bIsDyngenreProp || bIsDyngenreRecipe ? MF_GRAYED : MF_STRING});
			}
			{	// Scoring
				const options = ['LINEAR', 'LOGARITHMIC', 'LOGISTIC', 'NORMAL'];
				const bRecipe = bRecipeTags && recipe.tags.hasOwnProperty(key) && recipe.tags[key].hasOwnProperty('scoringDistribution');
				const tag = bRecipe ? {...tags[key], ...recipe.tags[key]} : tags[key];
				const subMenuName2 = menu.newMenu('Scoring...', subMenuName);
				options.forEach((option, i) => {
					const entryText = option + (bRecipe && tag.scoringDistribution === option ? '\t(forced by recipe)' : '');
					menu.newEntry({menuName: subMenuName2, entryText, func: () => {
						tags[key].scoringDistribution = option;
						properties.tags[1] = JSON.stringify(tags);
						overwriteProperties(properties); // Updates panel
					}, flags: bRecipe ? MF_GRAYED : MF_STRING});
					menu.newCheckMenu(subMenuName2, entryText, void(0), () => {return (tag.scoringDistribution === option);});
				});
			}
			menu.newEntry({menuName: subMenuName, entryText: 'sep'});
			{	// Base score
				const bRecipe = bRecipeTags && recipe.tags.hasOwnProperty(key) && recipe.tags[key].hasOwnProperty('baseScore');
				const tag = bRecipe ? {...tags[key], ...recipe.tags[key]} : tags[key];
				const entryText = 'Base score' + '\t[' + tag.baseScore + ']' + (bRecipe ? ' (forced by recipe)' : '');
				menu.newEntry({menuName: subMenuName, entryText, func: () => {
					const input = Input.number('int positive', tag.baseScore, 'Base score sets the minimum score (in %) given to this tag in case the compared track is missing it (when it\'s present on the reference). In most cases this should be set to zero, but it may be changed for some tags in case the library is not fully tagged, and thus missing values for some tracks.\n\nNote this value is further transformed by the scoring distribution method. i.e. 50% equals a final score of 50% for linear method.\n\nEnter number: (from 0 to 100)', 'Search by distance', 15, [(n) => n >= 0 && n <= 100]);
					if (input === null) {return;}
					tags[key].baseScore = input;
					properties.tags[1] = JSON.stringify(tags);
					overwriteProperties(properties);
				}, flags: bRecipe ? MF_GRAYED : MF_STRING});
			}
			menu.newEntry({menuName: subMenuName, entryText: 'sep'});
			{	// Delete
				const bRecipe = bRecipeTags && recipe.tags.hasOwnProperty(key) && !tags.hasOwnProperty(key);
				const bDefTag = !bRecipe && (nonDeletable.includes(key) || tags[key].type.includes('virtual'));
				menu.newEntry({menuName: subMenuName, entryText: 'Delete tag...' + (bRecipe ? '\t(forced by recipe)' : bDefTag ? '\t(default tag)' : ''), func: () => {
					delete tags[key];
					properties.tags[1] = JSON.stringify(tags);
					overwriteProperties(properties); // Updates panel
				}, flags: bRecipe || bDefTag ? MF_GRAYED : MF_STRING});
			}
		});
		{	// New tag
			menu.newEntry({menuName, entryText: 'New tag...', func: () => {
				const nTag = {weight: 0, tf: [], scoringDistribution: 'LINEAR', type: []};
				const name = Input.string('string', '', 'Enter a name for the tag:\n\nThis is just for identification purposes, the actual tag values will be filled later.', 'Search by distance', 'myTag');
				if (name === null) {return;}
				'string', 'multiple', 'graph'
				if (WshShell.Popup('Is multi-valued?\n\nTag may make use of multiple or single values. For ex. GENRE usually have more than one value, while DATE is meant to store a single value.\nSingle-valued configured tags will skip any value past the first one.\nMulti-valued tags can only be of \'string\' type.', 0, window.Name, popup.question + popup.yes_no) === popup.yes) {nTag.type.push('multiple', 'string');}
				else {nTag.type.push('single');}
				if (nTag.type.includes('single')) {
					if (WshShell.Popup('Are tag values strings?\n\nTag values may be considered as strings or numbers. For ex. GENRE, TITLE, etc. are strings, while DATE or BPM are numbers.', 0, window.Name, popup.question + popup.yes_no) === popup.yes) {nTag.type.push('string');} 
					else {nTag.type.push('number');}
					if (nTag.type.includes('string')) {
						if (WshShell.Popup('Is a genre/style-like tag?\n\nClicking yes will use the tag for GRAPH purposes, along the default GENRE and STYLE tags.', 0, window.Name, popup.question + popup.yes_no) === popup.yes) {nTag.type.push('graph');} 
					} else if (nTag.type.includes('number')) {
						if (WshShell.Popup('Uses absolute range?\n\nSince tag values are numbers, comparison is done within a range. Absolute range will make the configurable range to be used as an absolute value, i.e. 30 equals to +-30. For ex. for dates.', 0, window.Name, popup.question + popup.yes_no) === popup.yes) {nTag.type.push('absRange'); nTag.range = 0;} 
						else if (WshShell.Popup('Uses percent range?\n\nSince tag values are numbers, comparison is done within a range. Percent range will make the configurable range to be used as a percentual value, i.e. 30 equals to +-30% of the original value. For ex. for BPM.', 0, window.Name, popup.question + popup.yes_no) === popup.yes) {nTag.type.push('percentRange');}
					}
				} else {
					if (nTag.type.includes('string')) {
						if (WshShell.Popup('Is a genre/style-like tag?\n\nClicking yes will use the tag for GRAPH purposes, along the default GENRE and STYLE tags.', 0, window.Name, popup.question + popup.yes_no) === popup.yes) {nTag.type.push('graph');}
					}
				}
				tags[name] = nTag;
				properties.tags[1] = JSON.stringify(tags);
				overwriteProperties(properties); // Updates panel
			}});
		}
		menu.newEntry({menuName, entryText: 'sep'});
		{
			const options = ['smartShuffleTag', 'sep', 'genreStyleFilterTag'];
			createTagMenu(menuName, options);
		}
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
				const options = ['tags', 'smartShuffleTag', 'genreStyleFilterTag', 'bAscii'];
				options.forEach((tagName) => {
					if (properties.hasOwnProperty(tagName) && SearchByDistance_properties.hasOwnProperty(tagName)) {
						properties[tagName][1] = SearchByDistance_properties[tagName][1];
					}
				});
				overwriteProperties(properties); // Force overwriting
				const newTags = JSON.parse(properties.tags[1]);
				const newGraphTags = Object.values(newTags).filter((t) => t.type.includes('graph') && !t.type.includes('virtual')).map((t) => t.tf).flat(Infinity);
				const oldGraphTags = Object.values(tags).filter((t) => t.type.includes('graph') && !t.type.includes('virtual')).map((t) => t.tf).flat(Infinity);
				if (!isArrayEqual(newGraphTags, oldGraphTags)) {
					const answer = WshShell.Popup('Reset link cache now?\nOtherwise do it manually after all tag changes.', 0, 'Search by distance', popup.question + popup.yes_no);
					if (answer === popup.yes) {
						menu.btn_up(void(0), void(0), void(0), 'Debug and testing\\Reset link cache');
					}
				}
			}});
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
				try {if (input.length && fb.GetQueryItems(new FbMetadbHandleList(), input).Count === 0) {throw new Error('No items');}} // Sanity check
				catch (e) {
					if (e.message === 'No items') {
						fb.ShowPopupMessage('Query returns zero items on current library. Check it and add it again:\n' + input, 'Search by distance'); 
					} else {
						fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + input, 'Search by distance'); 
					}
					return;
				}
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
				const cleanParentheses = (input, query) => {
					let cache = '';
					while (input !== cache) {
						cache = input;
						input = input.replace(new RegExp('\\(\\(' + queryRegExp(query) + '\\)\\)', 'i'), _p(query));
						input = input.replace(new RegExp('^\\(' + queryRegExp(query) + '\\)$', 'i'), query);
						input = input.replace(new RegExp('^\\(([^\\(\\)]*)\\)$', 'i'), '$1');
						input = input.replace(new RegExp('\\(\\(([^\\(\\)]*)\\)\\)', 'i'), '$1');
					}
					return input;
				};
				if (input === query) {input = '';}
				else if (input.indexOf(query) !== -1) {
					input = cleanParentheses(input, query);
					input = input.replace(new RegExp('^\\(*' + queryRegExp(query) + '\\)*$|\\(?' + queryRegExp(query) + '\\)? AND | AND \\(?' + queryRegExp(query) + '\\)?', 'i'), '');
					input = cleanParentheses(input, query);
				} else {
					input = input.length ? _p(input) + ' AND ' + _p(query) : query;
				}
				return input;
			};
			const queryRegExp = (query) => {return query.replace('(', '\\(').replace(')','\\)');}
			options.forEach((obj) => {
				if (obj.title === 'sep') {menu.newEntry({menuName: subMenuName, entryText: 'sep', flags: MF_GRAYED}); return;}
				const entryText = obj.title + (recipe.hasOwnProperty('forcedQuery') ? '\t(forced by recipe)' : '');
				let input = '';
				menu.newEntry({menuName: subMenuName, entryText, func: () => {
					input = switchQuery(properties['forcedQuery'][1], obj.query);
					try {fb.GetQueryItems(new FbMetadbHandleList(), input);} // Sanity check
					catch (e) {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + input, 'Search by distance'); return;}
					properties['forcedQuery'][1] = input;
					overwriteProperties(properties); // Updates panel
				}, flags: recipe.hasOwnProperty('forcedQuery') ? MF_GRAYED : MF_STRING});
				menu.newCheckMenu(subMenuName, entryText, void(0), () => {
					const prop = recipe.hasOwnProperty('forcedQuery') ? recipe.forcedQuery : properties['forcedQuery'][1];
					return prop.match(new RegExp(obj.query.replace('(', '\\(').replace(')','\\)'))) && !prop.match(new RegExp('NOT \\(' + obj.query + '\\)'));
				});
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
			const bIsGraph = recipe.hasOwnProperty('method') && recipe.method  === 'GRAPH' || !recipe.hasOwnProperty('method') && properties.method[1] === 'GRAPH';
			options.forEach((key) => {
				if (key === 'sep') {menu.newEntry({menuName, entryText: 'sep'}); return;}
				const bGraphCondition = !bIsGraph && (key === 'bUseAntiInfluencesFilter' || key === 'bConditionAntiInfluences' || key === 'bUseInfluencesFilter');
				const entryText = properties[key][0].substr(properties[key][0].indexOf('.') + 1) + (recipe.hasOwnProperty(key) ? '\t(forced by recipe)' : '');
				menu.newEntry({menuName, entryText, func: () => {
					if (key === 'bConditionAntiInfluences') {fb.ShowPopupMessage('This option overrides the global anti-influences filter option,\nso it will be disabled at the configuration menu.\n\nWill be enabled automatically for tracks having any of these genre/styles:\n' + music_graph_descriptors.replaceWithSubstitutionsReverse(music_graph_descriptors.style_anti_influences_conditional).joinEvery(', ', 6), 'Search by distance');}
					if (key === 'bSameArtistFilter') {fb.ShowPopupMessage('This option may overrride some aspects of the similar artist filter option.\n\nWhen no similar artists data is found, by default only the selected artist would be considered. Thus allowing only tracks by the same artist to be considered.\n\nFiltering the selected artist forces the similar artist filter to fallback to checking all the library tracks in that case, otherwise there would be zero artists to check. It\'s equivalent to have the filter disabled when no similar artist data is present for the selected track\'s artist.\n\nWhen similar artists data is available, it works as expected, skipping the selected artist and only using the others. Thus strictly showing tracks by [others] similar artists.', 'Search by distance');}
					properties[key][1] = !properties[key][1];
					overwriteProperties(properties); // Updates panel
				}, flags: (key === 'bUseAntiInfluencesFilter' && bConditionAntiInfluences || bGraphCondition ? MF_GRAYED : (recipe.hasOwnProperty(key) ? MF_GRAYED : MF_STRING))});
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
					const input = Input.string('string', properties[key][1], 'Enter TF expression for playlist name:\n\n%, $, [ and ] must be enclosed in \' chars. \'\' results in single quote.\nFor ex: %ARTIST%\'\'s Mix   ->   ACDC\'s Mix\n\nAs special tag, %SBD_THEME% is also available when using themes. When a theme is not being used, it\'s evaluated as usual.\nFor ex: $if2(%SBD_THEME%,%artist%)\'\'s Mix   ->   Test\'s Mix', 'Search by distance', '%ARTIST%\'\'s Mix', void(0), true);
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
				const tags = JSON.parse(properties.tags[1]);
				findStyleGenresMissingGraph({
					genreStyleFilter: JSON.parse(properties.genreStyleFilterTag[1]).filter(Boolean),
					genreStyleTag: Object.values(tags).filter((t) => t.type.includes('graph') && !t.type.includes('virtual')).map((t) => t.tf).flat(Infinity),
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
				const keys = Object.values(tags).filter(t => !t.type.includes('virtual')).map(t => t.tf.filter(Boolean));
				const cacheTags = keys.concat([['TITLE'], [globTags.title]])
					.map((tagName) => {return tagName.map((subTagName) => {return (subTagName.indexOf('$') === -1 ? '%' + subTagName + '%' : subTagName);});})
					.map((tagName) => {return tagName.join(', ');}).filter(Boolean)
					.filter((tagName) => {return tagsCache.cache.has(tagName);});
				tagsCache.clear(cacheTags);
				tagsCache.save();
				tagsCache.cacheTags(cacheTags, iStepsLibrary, iDelayLibrary, fb.GetLibraryItems().Convert(), true).then(() => {tagsCache.save();});
			}, flags: sbd.panelProperties.bTagsCache[1] ? MF_STRING : MF_GRAYED});
		}
		menu.newEntry({menuName: submenu, entryText: 'sep'});
		{
			menu.newEntry({menuName: submenu, entryText: 'Graph statistics', func: () => {
			if (sbd.panelProperties.bProfile[1]) {var profiler = new FbProfiler('graphStatistics');}
				parent.switchAnimation('Graph statistics', true);
				graphStatistics({properties, graph: sbd.allMusicGraph, influenceMethod: sbd.influenceMethod}).then((resolve) => {
					_save(folders.temp + 'musicGraphStatistics.txt', resolve.text);
					console.log(resolve.text);
					parent.switchAnimation('Graph statistics', false);
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
					const readme = _open(folders.xxx + 'helpers\\readme\\search_by_distance_user_descriptors.txt', utf8);
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
	{	// Reset
		menu.newEntry({entryText: 'Share configuration...', func: () => {
			const list = ['tags', 'forced query', 'gennre/style filter tag', 'pool filtering tag', 'duplicates removal tag', 'smart shuffle tag'];
			const answer = WshShell.Popup('Share current configuration with other buttons and panels?\nSettings which will be copied:\n' + capitalizePartial(list.join(', ')), 0, 'Search by distance', popup.question + popup.yes_no);
			if (answer === popup.yes) {
				const obj = clone(properties);
				obj.name = parent.name;
				window.NotifyOthers('Search by Distance: share configuration', obj);
				obj.notifyThis = true;
				window.NotifyThis('Search by Distance: share configuration', obj);
			}
		}});
	}
	menu.newEntry({entryText: 'sep'});
	{	// Readmes
		const subMenuName = menu.newMenu('Readmes...');
		menu.newEntry({menuName: subMenuName, entryText: 'Open popup with readme:', func: null, flags: MF_GRAYED});
		menu.newEntry({menuName: subMenuName, entryText: 'sep'});
		let iCount = 0;
		const readmes = {
			Main: folders.xxx + 'helpers\\readme\\search_by_distance.txt',
			sep1: 'sep',
			'Method: DYNGENRE': folders.xxx + 'helpers\\readme\\search_by_distance_dyngenre.txt',
			'Method: GRAPH': folders.xxx + 'helpers\\readme\\search_by_distance_graph.txt',
			'Method: WEIGHT': folders.xxx + 'helpers\\readme\\search_by_distance_weight.txt',
			sep2: 'sep',
			'Scoring methods': folders.xxx + 'helpers\\readme\\search_by_distance_scoring.txt',
			'Scoring methods: chart': folders.xxx + 'helpers\\readme\\search_by_distance_scoring.png',
			sep3: 'sep',
			'Recipes & Themes': folders.xxx + 'helpers\\readme\\search_by_distance_recipes_themes.txt',
			'Similar Artists': folders.xxx + 'helpers\\readme\\search_by_distance_similar_artists.txt',
			'User descriptors': folders.xxx + 'helpers\\readme\\search_by_distance_user_descriptors.txt',
			sep4: 'sep',
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
								if (value.endsWith('.png')) {
									_run(value);
								} else {
									const readme = _open(value, utf8);
									if (readme.length) {fb.ShowPopupMessage(readme, key);}
								}
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
			console.log('Error parsing graphDistance (length >= 50): ' + val);
			return;
		}
		if (val.indexOf('music_graph_descriptors') === -1 || val.indexOf('()') !== -1 || val.indexOf(',') !== -1) {
			console.log('Error parsing graphDistance (is not a valid variable or using a func): ' + val);
			return;
		}
		const validVars = Object.keys(music_graph_descriptors).map((key) => {return 'music_graph_descriptors.' + key;});
		if (val.indexOf('+') === -1 && val.indexOf('-') === -1 && val.indexOf('*') === -1 && val.indexOf('/') === -1 && validVars.indexOf(val) === -1) {
			console.log('Error parsing graphDistance (using no arithmethics or variable): ' + val);
			return;
		}
		val = Math.floor(eval(val));
	}
	return val;
}