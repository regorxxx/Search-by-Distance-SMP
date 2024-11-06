'use strict';
//06/11/24

/* exported createConfigMenu */

/* global processRecipePlaceholder:readable, parseGraphDistance:readable, sbd:readable, testBaseTags:readable, SearchByDistance_properties:readable, music_graph_descriptors:readable, updateCache:readable, graphStatistics:readable, cacheLink:writable, cacheLinkSet:writable, tagsCache:readable, calculateSimilarArtistsFromPls:readable, writeSimilarArtistsTags:readable, getArtistsSameZone:readable, findStyleGenresMissingGraph:readable, graphDebug:readable, music_graph_descriptors_culture:readable, testGraphNodes:readable, testGraphNodeSets:readable, addTracksRelation:readable, shuffleBiasTf:readable , nearGenresFilterDistribution:readable, checkMinGraphDistance:readable, searchByDistance:readable */ // eslint-disable-line no-unused-vars
include('..\\..\\helpers\\menu_xxx.js');
/* global _menu:readable */
include('..\\..\\helpers\\helpers_xxx.js');
/* global MF_STRING:readable, MF_GRAYED:readable, popup:readable, folders:readable, isPlayCount:readable, globTags:readable, globQuery:readable, clone:readable, isFoobarV2:readable , globRegExp:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global WshShell:readable, _isFile:readable, _open:readable, utf8:readable, _deleteFile:readable, _save:readable, _explorer:readable, _run:readable, _copyFile:readable , _jsonParseFileCheck:readable */
include('..\\..\\helpers\\helpers_xxx_properties.js');
/* global overwriteProperties:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global capitalize:readable, capitalizeAll:readable, capitalizePartial:readable, isString:readable, _p:readable , isArrayEqual:readable, range: readable */
include('..\\..\\helpers\\helpers_xxx_time.js');
include('..\\..\\helpers\\helpers_xxx_input.js');
/* global Input:readable */

function createConfigMenu(parent) {
	const menu = new _menu(); // To avoid collisions with other buttons and check menu
	const properties = parent.buttonsProperties;
	const tags = JSON.parse(properties.tags[1]);
	const defTags = JSON.parse(properties.tags[3]);
	// Process recipe
	let recipe = {};
	if (properties.recipe[1].length) { recipe = processRecipePlaceholder(properties.recipe[1], tags); }
	// Update tooltip
	parent.recipe = { recipe: properties.recipe[1].length ? recipe : null, name: properties.recipe[1] || '' };
	// Recipe forced properties?
	const bProperties = Object.hasOwn(recipe, 'properties');
	// Recipe forced tags?
	const bRecipeTags = Object.hasOwn(recipe, 'tags');
	// Recipe-only tags?
	const recipeTags = bRecipeTags ? Object.keys(recipe.tags).filter((t) => t !== '*') : [];
	const graphDistance = Object.hasOwn(recipe, 'graphDistance')
		? parseGraphVal(recipe.graphDistance)
		: parseGraphVal(properties.graphDistance[1]);
	const bIsGraph = Object.hasOwn(recipe, 'method') && recipe.method === 'GRAPH' || !Object.hasOwn(recipe, 'method') && properties.method[1] === 'GRAPH';
	// Helpers
	const descriptors = music_graph_descriptors;
	const createTagMenu = (menuName, options) => {
		options.forEach((key) => {
			if (key === 'sep') { menu.newEntry({ menuName, entryText: 'sep' }); return; }
			const idxEnd = properties[key][0].indexOf('(');
			const value = bProperties && Object.hasOwn(recipe.properties, key)
				? recipe.properties[key]
				: JSON.parse(properties[key][1]).join(',');
			const entryText = properties[key][0]
				.substring(properties[key][0].indexOf('.') + 1, idxEnd !== -1
					? idxEnd - 1
					: Infinity
				) + '...' + '\t[' +
				(
					typeof value === 'string' && value.length > 10
						? value.slice(0, 10) + '...'
						: value
				) + ']' +
				(
					bProperties && Object.hasOwn(recipe.properties, key)
						? ' (forced by recipe)'
						: ''
				);
			menu.newEntry({
				menuName, entryText, func: () => {
					const example = '["GENRE","GENRE2"]';
					const input = Input.json('array strings', JSON.parse(properties[key][1]), 'Enter tag(s) or TF expression(s): (JSON)\n\nFor example:\n' + example, 'Search by distance', example, void (0), true);
					if (input === null) { return; }
					properties[key][1] = JSON.stringify(input);
					overwriteProperties(properties); // Updates panel
				}, flags: bProperties && Object.hasOwn(recipe.properties, key) ? MF_GRAYED : MF_STRING
			});
		});
	};

	const createSwitchMenu = (menuName, option, values, flag = [], hook = null) => {
		values.forEach((key, i) => {
			if (key === 'sep') { menu.newEntry({ menuName, entryText: 'sep', flags: MF_GRAYED }); return; }
			const entryText = key + (Object.hasOwn(recipe, option) && recipe[option] === key ? '\t(forced by recipe)' : '');
			menu.newEntry({
				menuName, entryText, func: () => {
					properties[option][1] = key;
					if (hook) { hook(key, i); }
					overwriteProperties(properties); // Updates panel
				}, flags: Object.hasOwn(recipe, option) || (flag[i] !== void (0) ? flag[i] : false) ? MF_GRAYED : MF_STRING
			});
			menu.newCheckMenu(menuName, entryText, void (0), () => { return (Object.hasOwn(recipe, option) ? recipe[option] === key : properties[option][1] === key); });
		});
	};

	const createBoolMenu = (menuName, options, flag = [], hook = null) => {
		options.forEach((key, i) => {
			if (key === 'sep') { menu.newEntry({ menuName, entryText: 'sep', flags: MF_GRAYED }); return; }
			const props = Object.hasOwn(properties, key) ? properties : sbd.panelProperties;
			const entryText = props[key][0].substring(props[key][0].indexOf('.') + 1) + (Object.hasOwn(recipe, key) ? '\t(forced by recipe)' : '');
			menu.newEntry({
				menuName, entryText, func: () => {
					props[key][1] = !props[key][1];
					if (hook) { hook(key, i); }
					overwriteProperties(props);
				}, flags: Object.hasOwn(recipe, key) || (flag[i] !== void (0) ? flag[i] : false) ? MF_GRAYED : MF_STRING
			});
			menu.newCheckMenuLast(() => (Object.hasOwn(recipe, key) ? recipe[key] : props[key][1]));
		});
	};

	// Header
	menu.newEntry({ entryText: 'Set config (may be overwritten by recipe):', func: null, flags: MF_GRAYED });
	menu.newEntry({ entryText: 'sep' });
	{	// Search Methods
		const menuName = menu.newMenu('Set Search method');
		{
			createSwitchMenu(menuName, 'method', ['WEIGHT', 'GRAPH', 'DYNGENRE']);
		}
		menu.newEntry({ menuName, entryText: 'sep' });
		{
			const key = 'graphDistance';
			const flags = Object.hasOwn(recipe, key) ? MF_GRAYED : (bIsGraph ? MF_STRING : MF_GRAYED);
			const idxEnd = properties[key][0].indexOf('(');
			const val = properties[key][1];
			let displayedVal = Object.hasOwn(recipe, key) ? recipe[key] : val;
			displayedVal = isNaN(displayedVal) ? displayedVal.split('.').pop() + ' --> ' + graphDistance : displayedVal;
			const entryText = properties[key][0].substring(properties[key][0].indexOf('.') + 1, idxEnd !== -1 ? idxEnd - 1 : Infinity) + '...' + (Object.hasOwn(recipe, key) ? '\t[' + displayedVal + '] (forced by recipe)' : '\t[' + displayedVal + ']');
			menu.newEntry({
				menuName, entryText, func: () => {
					let input;
					try { input = utils.InputBox(window.ID, 'Enter number: (equal or greater than 0)\n(Infinity and descriptor\'s variables are allowed)', 'Search by distance', val, true); } catch (e) { return; }
					if (!input && input !== '0' || !input.length) { return; }
					if (parseGraphDistance(input) === null) { return; }
					if (!Number.isNaN(Number(input))) { input = Number(input); } // Force a number type if possible
					if (!properties[key][2].func(input)) { return; }
					const check = checkMinGraphDistance(input); // Check against min link distances
					if (check.report) { fb.ShowPopupMessage(check.report, 'Graph distance'); }
					properties[key][1] = input;
					overwriteProperties(properties); // Updates panel
				}, flags
			});
		}
		menu.newEntry({ menuName, entryText: 'sep' });
		{
			const options = ['scoreFilter', 'minScoreFilter'];
			options.forEach((key) => {
				if (key === 'sep') { menu.newEntry({ menuName, entryText: 'sep', flags: MF_GRAYED }); return; }
				const flags = Object.hasOwn(recipe, key) ? MF_GRAYED : MF_STRING;
				const idxEnd = properties[key][0].indexOf('(');
				const val = properties[key][1];
				const entryText = properties[key][0].substring(properties[key][0].indexOf('.') + 1, idxEnd !== -1 ? idxEnd - 1 : Infinity) + '...' + (Object.hasOwn(recipe, key) ? '\t[' + recipe[key] + '] (forced by recipe)' : '\t[' + val + ']');
				menu.newEntry({
					menuName, entryText, func: () => {
						const input = Input.number('int positive', val, 'Enter number: (between 0 and 100)', 'Search by distance', properties[key][3], [(input) => input <= 100, (input) => input <= properties.scoreFilter[1]]);
						if (input === null) { return; }
						properties[key][1] = input;
						overwriteProperties(properties); // Updates panel
					}, flags
				});
			});
		}
		menu.newEntry({ menuName, entryText: 'sep' });
		createBoolMenu(menuName, ['bFilterWithGraph'],
			[
				void (0),
				Object.hasOwn(recipe, 'method') && recipe.method !== 'GRAPH' || !Object.hasOwn(recipe, 'method') && properties.method[1] !== 'GRAPH'
			]
		);
	}
	{	// Tags and weights
		const menuName = menu.newMenu('Set Tags and weighting');
		const options = [...new Set([...Object.keys(tags), ...recipeTags])];
		const nonDeletable = ['genre', 'style', 'mood', 'key', 'bpm', 'date'];
		const weights = options.map((key) => {
			const bIsDyngenreMethodRecipe = Object.hasOwn(recipe, 'method') && recipe.method !== 'DYNGENRE';
			const bIsDyngenreMethodProp = !Object.hasOwn(recipe, 'method') && properties.method[1] !== 'DYNGENRE';
			const baseTag = tags[key];
			const defTag = sbd.tagSchema; // Used in case a recipe adds new tags but misses some keys...
			const obj = {
				bIsDyngenreRecipe: (key === 'dynGenre' && bIsDyngenreMethodRecipe),
				bIsDyngenreProp: (key === 'dynGenre' && bIsDyngenreMethodProp),
				bRecipe: bRecipeTags && Object.hasOwn(recipe.tags, key) && (Object.hasOwn(recipe.tags[key], 'weight') || !baseTag)
			};
			obj.tag = obj.bRecipe ? { ...defTag, ...baseTag, ...recipe.tags[key] } : baseTag;
			obj.entrySuffix = obj.bRecipe || obj.bIsDyngenreRecipe
				? '\t[' + (obj.bIsDyngenreRecipe ? '-disabled-' : obj.tag.weight) + '] (forced by recipe)'
				: '\t[' + (obj.bIsDyngenreProp ? '-disabled-' : obj.tag.weight) + ']';
			const weight = obj.tag.weight.toString().padStart(2, 0);
			obj.menuSuffix = obj.bRecipe || obj.bIsDyngenreRecipe
				? '\t[' + (obj.bIsDyngenreRecipe ? '-disabled-' : 'weight: ' + weight) + '] (forced by recipe)'
				: '\t[' + (obj.bIsDyngenreProp ? '-disabled-' : 'weight: ' + weight) + ']';
			return obj;
		});
		options.forEach((key, i) => {
			const keyFormat = new Set(['dynGenre']).has(key)
				? capitalize(key)
				: capitalizeAll(
					key
						.replace(/\B(Genre|Style)(\b|[A-Z])/g, ' $1 $2')
						.replace(/\B(Region)(?:\b|[A-Z])/g, ' $1')
						.replace(/(genre) (style)/gi, '$1/$2')
						.replace(/(style) (genre)/gi, '$1/$2')
					, [' ', '/', '\\']
				);
			const subMenuName = menu.newMenu(keyFormat + weights[i].menuSuffix, menuName);
			const baseTag = tags[key];
			const defTag = sbd.tagSchema; // Used in case a recipe add new tags but miss some keys...
			{	// Remap
				const bRecipe = bRecipeTags && Object.hasOwn(recipe.tags, key) && (Object.hasOwn(recipe.tags[key], 'tf') || !baseTag);
				const tag = bRecipe ? { ...defTag, ...baseTag, ...recipe.tags[key] } : baseTag;
				if (!tag.type.includes('virtual') || tag.type.includes('tfRemap')) {
					const value = tag.tf.join(',');
					const entryText = 'Remap...' + '\t[' + (
						typeof value === 'string' && value.length > 10
							? value.slice(0, 10) + '...'
							: value
					) + ']' + (bRecipe ? ' (forced by recipe)' : '');
					menu.newEntry({
						menuName: subMenuName, entryText, func: () => {
							const example = '["GENRE","LASTFM_GENRE","GENRE2"]';
							const input = Input.json('array strings', tag.tf, 'Enter tag(s) or TF expression(s): (JSON)\n\nFor example:\n' + example, 'Search by distance', example, void (0), true);
							if (input === null) { return; }
							baseTag.tf = input;
							properties.tags[1] = JSON.stringify(tags);
							overwriteProperties(properties); // Updates panel
							if (tag.type.includes('graph')) {
								const answer = WshShell.Popup('Reset link cache now?\nOtherwise do it manually after all tag changes.', 0, 'Search by distance', popup.question + popup.yes_no);
								if (answer === popup.yes) {
									menu.btn_up(void (0), void (0), void (0), 'Debug and testing\\Reset link cache');
								}
							}
						}, flags: bRecipe ? MF_GRAYED : MF_STRING
					});
				} else {
					menu.newEntry({ menuName: subMenuName, entryText: 'Remap...\t[virtual]', flags: MF_GRAYED });
				}
			}
			{	// Ranges
				if (Object.hasOwn(baseTag || recipe.tags[key], 'range')) {
					const bRecipe = bRecipeTags && Object.hasOwn(recipe.tags, key) && Object.hasOwn(recipe.tags[key], 'range');
					const tag = bRecipe ? { ...defTag, ...baseTag, ...recipe.tags[key] } : baseTag;
					menu.newEntry({
						menuName: subMenuName, entryText: 'Range\t[' + tag.range + ']' + (bRecipe ? '(forced by recipe)' : ''), func: () => {
							const input = Input.number('int positive', tag.range, 'Range sets how numeric tags should be compared.\nA zero value forces an exact match, while greater ranges allow some interval to be compared against.\n\nEnter number: (greater or equal to 0)', 'Search by distance', 10);
							if (input === null) { return; }
							baseTag.range = input;
							properties.tags[1] = JSON.stringify(tags);
							overwriteProperties(properties);
						}, flags: bRecipe ? MF_GRAYED : MF_STRING
					});
				}
			}
			menu.newEntry({ menuName: subMenuName, entryText: 'sep' });
			{	// Weights
				const bIsDyngenreRecipe = weights[i].bIsDyngenreRecipe;
				const bIsDyngenreProp = weights[i].bIsDyngenreProp;
				const bRecipe = weights[i].bRecipe;
				const tag = weights[i].tag;
				const bNegative = tag.type.includes('bNegative');
				const entryText = 'Weight' + weights[i].entrySuffix;
				menu.newEntry({
					menuName: subMenuName, entryText, func: () => {
						const input = Input.number(
							bNegative ? 'int' : 'int positive',
							tag.weight,
							'Weight measures the proportion of total scoring associated to this tag.\n\nEnter number: ' + (bNegative ? '(integer)' : '(greater or equal to 0)'),
							'Search by distance',
							bNegative ? -15 : 15
						);
						if (input === null) { return; }
						baseTag.weight = input;
						properties.tags[1] = JSON.stringify(tags);
						overwriteProperties(properties);
					}, flags: bRecipe || bIsDyngenreProp || bIsDyngenreRecipe ? MF_GRAYED : MF_STRING
				});
			}
			if (!['related', 'unrelated'].includes(key)) {	// Scoring
				const options = ['LINEAR', 'LOGARITHMIC', 'LOGISTIC', 'NORMAL'];
				const bRecipe = bRecipeTags && Object.hasOwn(recipe.tags, key) && (Object.hasOwn(recipe.tags[key], 'scoringDistribution') || !baseTag);
				const tag = bRecipe ? { ...defTag, ...baseTag, ...recipe.tags[key] } : baseTag;
				const subMenuName2 = menu.newMenu('Scoring...', subMenuName);
				options.forEach((option) => {
					const entryText = option + (bRecipe && tag.scoringDistribution === option ? '\t(forced by recipe)' : '');
					menu.newEntry({
						menuName: subMenuName2, entryText, func: () => {
							baseTag.scoringDistribution = option;
							properties.tags[1] = JSON.stringify(tags);
							overwriteProperties(properties); // Updates panel
						}, flags: bRecipe ? MF_GRAYED : MF_STRING
					});
				});
				menu.newCheckMenu(subMenuName2, options[0], options[options.length - 1], () => { return options.indexOf(tag.scoringDistribution); });
			}
			if (!menu.isLastEntry('sep')) { menu.newEntry({ menuName: subMenuName, entryText: 'sep' }); }
			if (!['related', 'unrelated'].includes(key)) {	// Base score
				const bRecipe = bRecipeTags && Object.hasOwn(recipe.tags, key) && (Object.hasOwn(recipe.tags[key], 'baseScore') || !baseTag);
				const tag = bRecipe ? { ...defTag, ...baseTag, ...recipe.tags[key] } : baseTag;
				const entryText = 'Base score' + '\t[' + tag.baseScore + ']' + (bRecipe ? ' (forced by recipe)' : '');
				menu.newEntry({
					menuName: subMenuName, entryText, func: () => {
						const input = Input.number('int positive', tag.baseScore, 'Base score sets the minimum score (in %) given to this tag in case the compared track is missing it (when it\'s present on the reference). In most cases this should be set to zero, but it may be changed for some tags in case the library is not fully tagged, and thus missing values for some tracks.\n\nNote this value is further transformed by the scoring distribution method. i.e. 50% equals a final score of 50% for linear method.\n\nEnter number: (from 0 to 100)', 'Search by distance', 15, [(n) => n >= 0 && n <= 100]);
						if (input === null) { return; }
						baseTag.baseScore = input;
						properties.tags[1] = JSON.stringify(tags);
						overwriteProperties(properties);
					}, flags: bRecipe ? MF_GRAYED : MF_STRING
				});
			}
			if (!menu.isLastEntry('sep')) { menu.newEntry({ menuName: subMenuName, entryText: 'sep' }); }
			{	// Edit
				const bRecipe = bRecipeTags && Object.hasOwn(recipe.tags, key) && !Object.hasOwn(tags, key);
				const tag = bRecipe ? { ...defTag, ...baseTag, ...recipe.tags[key] } : baseTag;
				menu.newEntry({
					menuName: subMenuName, entryText: 'Edit tag...' + (bRecipe ? '\t(forced by recipe)' : ''), func: () => {
						const input = Input.json('object', tag, 'Edit tag slot: (JSON)', 'Search by distance', JSON.stringify(tag));
						if (input === null) { return; }
						tags[key] = input;
						properties.tags[1] = JSON.stringify(tags);
						overwriteProperties(properties); // Updates panel
						testBaseTags(tags);
					}, flags: bRecipe ? MF_GRAYED : MF_STRING
				});
			}
			{	// Restore
				const bRecipe = bRecipeTags && Object.hasOwn(recipe.tags, key) && !Object.hasOwn(tags, key);
				const bDefTag = !bRecipe && (nonDeletable.includes(key) || tags[key].type.includes('virtual'));
				menu.newEntry({
					menuName: subMenuName, entryText: 'Restore defaults...' + (bRecipe ? '\t(forced by recipe)' : bDefTag ? '\t(default tag)' : ''), func: () => {
						if (WshShell.Popup('Restore tag\'s settings to default?', 0, window.Name, popup.question + popup.yes_no) === popup.yes) {
							tags[key] = defTags[key];
							properties.tags[1] = JSON.stringify(tags);
							overwriteProperties(properties); // Updates panel
							testBaseTags(tags);
						}
					}, flags: bRecipe ? MF_GRAYED : MF_STRING
				});
			}
			menu.newEntry({ menuName: subMenuName, entryText: 'sep' });
			{	// Clone
				const bRecipe = bRecipeTags && Object.hasOwn(recipe.tags, key) && !Object.hasOwn(tags, key);
				const tag = bRecipe ? { ...defTag, ...baseTag, ...recipe.tags[key] } : baseTag;
				const bVirtual = tag.type.includes('virtual');
				menu.newEntry({
					menuName: subMenuName, entryText: 'Clone tag...' + (bVirtual ? '\t(virtual tag)' : ''), func: () => {
						const name = Input.string('string', key, 'Enter a new name for the tag:\n(must be different to the original one)\n\nNote cloning also carries over the current recipe settings (which may override any base value set by the tag); if cloning the base tag is desired, set the recipe to \'None\' before cloning.', 'Search by distance', 'My Tag');
						if (name === null) { return; }
						tags[name] = clone(tag);
						properties.tags[1] = JSON.stringify(tags);
						overwriteProperties(properties); // Updates panel
						testBaseTags(tags);
					}, flags: bVirtual ? MF_GRAYED : MF_STRING
				});
			}
			{	// Delete
				const bRecipe = bRecipeTags && Object.hasOwn(recipe.tags, key) && !Object.hasOwn(tags, key);
				const bDefTag = !bRecipe && (nonDeletable.includes(key) || tags[key].type.includes('virtual'));
				menu.newEntry({
					menuName: subMenuName, entryText: 'Delete tag...' + (bRecipe ? '\t(forced by recipe)' : bDefTag ? '\t(default tag)' : ''), func: () => {
						delete tags[key];
						properties.tags[1] = JSON.stringify(tags);
						overwriteProperties(properties); // Updates panel
						testBaseTags(tags);
					}, flags: bRecipe || bDefTag ? MF_GRAYED : MF_STRING
				});
			}
		});
		{	// New tag
			menu.newEntry({
				menuName, entryText: 'New tag...', func: () => {
					const nTag = sbd.tagSchema;
					const name = Input.string('string', '', 'Enter a name for the tag:\n\nThis is just for identification purposes, the actual tag values have to be filled later (using \'Remap...\').', 'Search by distance', 'myTag');
					if (name === null) { return; }
					if (WshShell.Popup('Is multi-valued?\n\nTag may make use of multiple or single values. For ex. GENRE usually have more than one value, while DATE is meant to store a single value.\nSingle-valued configured tags will skip any value past the first one.\nMulti-valued tags can only be of \'string\' type.', 0, window.Name, popup.question + popup.yes_no) === popup.yes) { nTag.type.push('multiple', 'string'); }
					else { nTag.type.push('single'); }
					if (nTag.type.includes('single')) {
						if (WshShell.Popup('Are tag values strings?\n\nTag values may be considered as strings or numbers. For ex. GENRE, TITLE, etc. are strings, while DATE or BPM are numbers.', 0, window.Name, popup.question + popup.yes_no) === popup.yes) { nTag.type.push('string'); }
						else { nTag.type.push('number'); }
						if (nTag.type.includes('string')) {
							if (WshShell.Popup('Is a genre/style-like tag?\n\nClicking yes will use the tag for GRAPH purposes, along the default GENRE and STYLE tags.', 0, window.Name, popup.question + popup.yes_no) === popup.yes) { nTag.type.push('graph'); }
						} else if (nTag.type.includes('number')) {
							if (WshShell.Popup('Uses absolute range?\n\nSince tag values are numbers, comparison is done within a range. Absolute range will make the configurable range to be used as an absolute value, i.e. 30 equals to +-30. For ex. for dates.', 0, window.Name, popup.question + popup.yes_no) === popup.yes) { nTag.type.push('absRange'); nTag.range = 0; }
							else if (WshShell.Popup('Uses percent range?\n\nSince tag values are numbers, comparison is done within a range. Percent range will make the configurable range to be used as a percent value, i.e. 30 equals to +-30% of the original value. For ex. for BPM.', 0, window.Name, popup.question + popup.yes_no) === popup.yes) { nTag.type.push('percentRange'); nTag.range = 0; }
						}
					} else {
						if (nTag.type.includes('string')) {
							if (WshShell.Popup('Is a genre/style-like tag?\n\nClicking yes will use the tag for GRAPH purposes, along the default GENRE and STYLE tags.', 0, window.Name, popup.question + popup.yes_no) === popup.yes) { nTag.type.push('graph'); }
						}
					}
					tags[name] = nTag;
					properties.tags[1] = JSON.stringify(tags);
					overwriteProperties(properties); // Updates panel
					testBaseTags(tags);
				}
			});
		}
		menu.newEntry({ menuName, entryText: 'sep' });
		{
			const options = ['smartShuffleTag', 'sep', 'genreStyleFilterTag'];
			createTagMenu(menuName, options);
		}
		menu.newEntry({ menuName, entryText: 'sep' });
		{
			createBoolMenu(menuName, ['bNegativeWeighting'],
				[
					void (0),
					Object.hasOwn(recipe, 'method') && recipe.method !== 'GRAPH' || !Object.hasOwn(recipe, 'method') && properties.method[1] !== 'GRAPH'
				]
			);
		}
		{	// Cache
			const options = ['bAscii', 'bTagsCache', 'bAllMusicDescriptors'];
			options.forEach((key) => {
				if (key === 'bTagsCache') { return; }
				const panelKeys = new Set(['bTagsCache', 'bAllMusicDescriptors', 'bLastfmDescriptors']);
				const propObj = panelKeys.has(key) ? sbd.panelProperties : properties;
				const entryText = propObj[key][0].substring(propObj[key][0].indexOf('.') + 1) + (Object.hasOwn(recipe, key) ? '\t(forced by recipe)' : '') + (key === 'bTagsCache' && !isFoobarV2 ? '\t-only Fb >= 2.0-' : '');
				menu.newEntry({
					menuName, entryText, func: () => {
						propObj[key][1] = !propObj[key][1];
						overwriteProperties(propObj); // Updates panel
						let bLink = false;
						let bReload = false;
						switch (key) {
							case 'bAscii': {
								bLink = true;
								break;
							}
							case 'bTagsCache': {
								if (propObj.bTagsCache[1]) {
									fb.ShowPopupMessage(
										'This feature should only be enabled on foobar2000 versions >= 2.0 32 bit.' +
										'\n\nPrevious versions already cached tags values, thus not requiring it. Only enable it in case low memory mode is used, if better performance is desired. See:\n' +
										'https://wiki.hydrogenaud.io/index.php?title=Foobar2000:Version_2.0_Beta_Change_Log#Beta_20' +
										'\n\nWarning: it may behave badly on really big libraries (+100K tracks) or if thousands of tracks are tagged/edited at the same time.\nIf you experience crashes or RAM allocation failures, disable it.'
										, 'Tags cache'
									);
									const answer = WshShell.Popup('Reset tags cache now?\nOtherwise do it manually after all tag changes.', 0, 'Search by distance', popup.question + popup.yes_no);
									if (answer === popup.yes) {
										menu.btn_up(void (0), void (0), void (0), 'Debug and testing\\Reset tags cache');
									} else {
										tagsCache.load();
									}
								} else {
									tagsCache.unload();
								}
								break;
							}
							case 'bAllMusicDescriptors': {
								bReload = true;
								fb.ShowPopupMessage(
									'Load substitutions and remap for AllMusic genres and styles.' +
									'\n\nIn case tagging has not been done using Bio Panel or AllMusic sources, disable it.'
									, 'AllMusic'
								);
								break;
							}
							case 'bLastfmDescriptors': {
								bReload = true;
								fb.ShowPopupMessage(
									'Load substitutions and remap for Last.fm genres and styles.' +
									'\n\nIn case tagging has not been done using Bio Panel or Last.fm sources, disable it.'
									, 'Last.fm'
								);

								break;
							}
						}
						if (bLink || bReload) {
							const answer = WshShell.Popup('Reset link cache now?\nOtherwise do it manually after all tag changes.', 0, 'Search by distance', popup.question + popup.yes_no);
							if (answer === popup.yes) {
								if (bLink) {
									menu.btn_up(void (0), void (0), void (0), 'Debug and testing\\Reset link cache');
								}
								if (bReload) {
									window.Reload();
								}
							}
						}
					}, flags: Object.hasOwn(recipe, key) || (key === 'bTagsCache' && !isFoobarV2) ? MF_GRAYED : MF_STRING
				});
				menu.newCheckMenu(menuName, entryText, void (0), () => { return (Object.hasOwn(recipe, key) ? recipe[key] : propObj[key][1]); });
			});
		}
		menu.newEntry({ menuName, entryText: 'sep' });
		{	// Reset
			menu.newEntry({
				menuName, entryText: 'Restore defaults...', func: () => {
					const options = ['tags', 'smartShuffleTag', 'genreStyleFilterTag', 'bAscii'];
					options.forEach((tagName) => {
						if (Object.hasOwn(properties, tagName) && Object.hasOwn(SearchByDistance_properties, tagName)) {
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
							menu.btn_up(void (0), void (0), void (0), 'Debug and testing\\Reset link cache');
						}
					}
					testBaseTags(newTags);
				}
			});
		}
	}
	{	// Pre-scoring filters:
		const menuName = menu.newMenu('Set pre-scoring filters');
		{	// Forced Query
			const bRecipe = Object.hasOwn(recipe, 'forcedQuery');
			const prop = bRecipe ? recipe.forcedQuery : properties['forcedQuery'][1];
			menu.newEntry({
				menuName, entryText: 'Set Global Forced Query...' + menu.tip(prop.length ? '[enabled]' : '[none]', bRecipe ? '(forced by recipe)' : ''),
				func: (cache) => {
					let input = '';
					try { input = utils.InputBox(window.ID, 'Enter global query used to pre-filter library:', 'Search by distance', cache || properties['forcedQuery'][1], true); }
					catch (e) { return; }
					if ((!cache || cache !== input) && properties['forcedQuery'][1] === input) { return; }
					try { if (input.length && fb.GetQueryItems(fb.GetLibraryItems(), input).Count === 0) { throw new Error('No items'); } } // Sanity check
					catch (e) {
						if (e.message === 'No items') {
							fb.ShowPopupMessage('Query returns zero items on current library. Check it and add it again:\n' + input, 'Search by distance');
						} else {
							fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + input, 'Search by distance');
						}
						menu.retry({ pos: -1, args: input || properties['forcedQuery'][1] });
						return;
					}
					properties['forcedQuery'][1] = input;
					overwriteProperties(properties); // Updates panel
				}, flags: bRecipe ? MF_GRAYED : MF_STRING
			});
		}
		{	// Additional filters
			let options = [];
			const file = folders.xxx + 'presets\\Search by\\filters\\custom_button_filters.json';
			const bFile = _isFile(file);
			if (bFile) {
				options = _jsonParseFileCheck(file, 'Query filters json', 'Search by distance', utf8) || [];
			} else {
				options = [
					{ title: 'Female vocals', query: globQuery.female },
					{ title: 'Instrumentals', query: globQuery.instrumental },
					{ title: 'Acoustic tracks', query: globQuery.acoustic },
					{ title: 'Rating > 2', query: globQuery.ratingGr2 },
					{ title: 'Rating > 3', query: globQuery.ratingGr3 },
					{ title: 'Length < 6 min', query: globQuery.shortLength },
					{ title: 'Only Stereo', query: globQuery.stereo },
					{ title: 'sep' },
					{ title: 'No Female vocals', query: globQuery.noFemale },
					{ title: 'No Instrumentals', query: globQuery.noInstrumental },
					{ title: 'No Acoustic tracks', query: globQuery.noAcoustic },
					{ title: 'Not rated', query: globQuery.noRating },
					{ title: 'Not Live (unless Hi-Fi)', query: globQuery.noLive }
				];
			}
			const hasQuery = (obj) => {
				if (!obj.query) { return false; }
				const prop = Object.hasOwn(recipe, 'forcedQuery') ? recipe.forcedQuery : properties['forcedQuery'][1];
				return !!(prop.match(new RegExp(obj.query.replace('(', '\\(').replace(')', '\\)'))) && !prop.match(new RegExp('NOT \\(' + obj.query + '\\)')));
			};
			const filterCount = options.map(hasQuery).filter(Boolean).length;
			const subMenuName = menu.newMenu('Additional pre-defined filters' + '\t[' + (!filterCount ? 'none' : filterCount + ' filter' + (filterCount > 1 ? 's' : '')) + ']', menuName);
			menu.newEntry({ menuName: subMenuName, entryText: 'Appended to Global Forced Query:', flags: MF_GRAYED });
			menu.newEntry({ menuName: subMenuName, entryText: 'sep', flags: MF_GRAYED });
			const switchQuery = (input, query) => {
				const cleanParentheses = (input, query) => {
					let cache = '';
					while (input !== cache) {
						cache = input;
						input = input.replace(new RegExp('\\(\\(' + queryRegExp(query) + '\\)\\)', 'i'), _p(query));
						input = input.replace(new RegExp('^\\(' + queryRegExp(query) + '\\)$', 'i'), query);
						input = input.replace(/^\(([^()]*)\)$/i, '$1');
						input = input.replace(/\(\(([^()]*)\)\)/i, '$1');
					}
					return input;
				};
				if (input === query) { input = ''; }
				else if (input.indexOf(query) !== -1) {
					input = cleanParentheses(input, query);
					input = input.replace(new RegExp('^\\(*' + queryRegExp(query) + '\\)*$|\\(?' + queryRegExp(query) + '\\)? AND | AND \\(?' + queryRegExp(query) + '\\)?', 'i'), '');
					input = cleanParentheses(input, query);
				} else {
					input = input.length ? _p(input) + ' AND ' + _p(query) : query;
				}
				return input;
			};
			const queryRegExp = (query) => { return query.replace('(', '\\(').replace(')', '\\)'); };
			options.forEach((obj) => {
				if (obj.title === 'sep') { menu.newEntry({ menuName: subMenuName, entryText: 'sep', flags: MF_GRAYED }); return; }
				const entryText = obj.title + (Object.hasOwn(recipe, 'forcedQuery') ? '\t(forced by recipe)' : '');
				let input = '';
				menu.newEntry({
					menuName: subMenuName, entryText, func: () => {
						input = switchQuery(properties['forcedQuery'][1], obj.query);
						try { fb.GetQueryItems(new FbMetadbHandleList(), input); } // Sanity check
						catch (e) { fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + input, 'Search by distance'); return; }
						properties['forcedQuery'][1] = input;
						overwriteProperties(properties); // Updates panel
					}, flags: Object.hasOwn(recipe, 'forcedQuery') ? MF_GRAYED : MF_STRING
				});
				menu.newCheckMenu(subMenuName, entryText, void (0), () => hasQuery(obj));
			});
			menu.newEntry({ menuName: subMenuName, entryText: 'sep', flags: MF_GRAYED });
			menu.newEntry({
				menuName: subMenuName, entryText: 'Edit entries...' + (bFile ? '' : '\t(new file)'), func: () => {
					if (!bFile) { _save(file, JSON.stringify(options, null, '\t').replace(/\n/g, '\r\n')); }
					_explorer(file);
				}
			});
		}
		menu.newEntry({ menuName, entryText: 'sep' });
		{	// Dynamic queries
			let options = [];
			const currentPropFilters = JSON.parse(properties['dynQueries'][1]) || [];
			const currentFilters = (Object.hasOwn(recipe, 'dynQueries') ? recipe.dynQueries : currentPropFilters) || [];
			const data = JSON.parse(properties.data[1]);
			const isTheme = (data.forcedTheme.length ? data.forcedTheme : data.theme) !== 'None';
			const file = folders.xxx + 'presets\\Search by\\filters\\custom_button_dynamic_filters.json';
			const bFile = _isFile(file);
			if (bFile) {
				options = _jsonParseFileCheck(file, 'Query filters json', 'Search by distance', utf8) || [];
			} else {
				options = [ // Use tag names which are then remapped to the user selected tag, i.e. GENRE to all genre tags
					{ title: 'Same Artist', query: globTags.artist + ' IS #' + globTags.artistRaw + '#' },
					{ title: 'sep' },
					{ title: 'Different Genre', query: 'NOT GENRE IS #GENRE#' },
					{ title: 'Different Style', query: 'NOT STYLE IS #STYLE#' },
					{ title: 'sep' },
					{ title: 'Date greater (+15)', query: 'DATE GREATER #$add(%DATE%,15)#' },
					{ title: 'Date lower (-15)', query: 'DATE LESS #$sub(%DATE%,15)#' },
					{ title: 'sep' },
					{ title: 'From last 30 years', query: 'DATE GREATER #$sub(#YEAR#,30)#' },
					{ title: 'From last 20 years', query: 'DATE GREATER #$sub(#YEAR#,20)#' },
					{ title: 'From last 10 years', query: 'DATE GREATER #$sub(#YEAR#,10)#' },
					{ title: 'sep' },
					{ title: 'In 15 years range', query: '"$replace($sub(%DATE%,#DATE#),-,)" LESS 15' },
					{ title: 'In 10 years range', query: '"$replace($sub(%DATE%,#DATE#),-,)" LESS 10' },
					{ title: 'In 5 years range', query: '"$replace($sub(%DATE%,#DATE#),-,)" LESS 5' },
				];
			}
			const hasQuery = (query) => {
				if (query || !query.length) { return false; }
				return !!(query.match(new RegExp(query.replace('(', '\\(').replace(')', '\\)'))) && !query.match(new RegExp('NOT \\(' + query + '\\)')));
			};
			const filterCount = currentFilters.length;
			const filterState = currentFilters.map((query) => hasQuery(query));
			const found = filterState.reduce((acc, state) => acc + (state ? 1 : 0), 0);
			const notFound = filterCount - found;
			const subMenuName = menu.newMenu('Dynamic query filters' + '\t[' + (!filterCount ? 'none' : filterCount + ' filter' + (filterCount > 1 ? 's' : '')) + ']', menuName);
			menu.newEntry({ menuName: subMenuName, entryText: 'Evaluated with reference: ' + _p(isTheme ? 'theme' : 'selection'), flags: MF_GRAYED });
			menu.newEntry({ menuName: subMenuName, entryText: 'sep', flags: MF_GRAYED });
			options.forEach((obj) => {
				if (obj.title === 'sep') { menu.newEntry({ menuName: subMenuName, entryText: 'sep', flags: MF_GRAYED }); return; }
				const entryText = obj.title + (Object.hasOwn(recipe, 'dynQueries') ? '\t(forced by recipe)' : '');
				menu.newEntry({
					menuName: subMenuName, entryText, func: () => {
						const idx = currentPropFilters.indexOf(obj.query);
						if (idx !== -1) { currentPropFilters.splice(idx, 1); }
						else { currentPropFilters.push(obj.query); }
						properties['dynQueries'][1] = JSON.stringify(currentPropFilters);
						overwriteProperties(properties); // Updates panel
					}, flags: Object.hasOwn(recipe, 'dynQueries') ? MF_GRAYED : MF_STRING
				});
				menu.newCheckMenuLast(() => {
					const prop = Object.hasOwn(recipe, 'dynQueries') ? recipe.dynQueries : currentPropFilters;
					return prop.includes(obj.query);
				});
			});
			if (notFound) {
				menu.newEntry({ menuName: subMenuName, entryText: 'sep', flags: MF_GRAYED });
				let i = 0;
				filterState.forEach((state, idx) => {
					if (!state) {
						menu.newEntry({
							menuName: subMenuName, entryText: 'Other filter ' + _p(++i),
							func: () => {
								fb.ShowPopupMessage('Non recognized filter:\n\n' + currentFilters[idx] +'\n\nYou may add this filter as an entry by adding it to the entries file with a custom name and copying the query (using the \'Edit Entries...\' option).', 'Dynamic query filter');
							}
						});
						menu.newCheckMenuLast(() => true);
					}
				});
			}
			menu.newEntry({ menuName: subMenuName, entryText: 'sep', flags: MF_GRAYED });
			menu.newEntry({
				menuName: subMenuName, entryText: 'None', func: () => {
					currentPropFilters.length = 0;
					properties['dynQueries'][1] = JSON.stringify(currentPropFilters);
					overwriteProperties(properties); // Updates panel
				}
			});
			menu.newCheckMenuLast(() => {
				const prop = Object.hasOwn(recipe, 'dynQueries') ? recipe.dynQueries : currentPropFilters;
				return prop.length === 0;
			});
			menu.newEntry({ menuName: subMenuName, entryText: 'sep', flags: MF_GRAYED });
			menu.newEntry({
				menuName: subMenuName, entryText: 'Edit entries...' + (bFile ? '' : '\t(new file)'), func: () => {
					if (!bFile) { _save(file, JSON.stringify(options, null, '\t').replace(/\n/g, '\r\n')); }
					_explorer(file);
				}
			});
		}
		menu.newEntry({ menuName, entryText: 'sep' });
		{	// Near genres filter
			const key = 'nearGenresFilter';
			const scoreFilter = 1 - (Object.hasOwn(recipe, 'scoreFilter') ? recipe.scoreFilter : properties.scoreFilter[1]) / 100;
			const aggressiveness = Object.hasOwn(recipe, 'nearGenresFilterAggressiveness') ? recipe.nearGenresFilterAggressiveness : properties.nearGenresFilterAggressiveness[1];
			const nearScoreFilter = nearGenresFilterDistribution(0, { scoreFilter, aggressiveness });
			const keyVal = Object.hasOwn(recipe, key) ? recipe[key] : properties[key][1];
			const autoVal = bIsGraph ? nearGenresFilterDistribution(0, { graphDistance, aggressiveness }) : nearScoreFilter;
			const options = [
				{
					name: 'Automatic' + '\t[' + autoVal + ']',
					val: 0
				},
				{
					name: 'Custom' + (keyVal > 0 ? '\t[' + keyVal + ']' : ''),
					val: (keyVal > 0 ? keyVal : 1)
				},
				{ name: 'sep' },
				{ name: 'Disabled', val: -1 },
			];
			const subMenuName = menu.newMenu('Nearest genres filter' + '\t[' + (keyVal === -1 ? '-disabled-' : (keyVal || 'auto: ' + autoVal)) + ']', menuName);
			options.forEach((opt) => {
				if (opt.name === 'sep') { menu.newEntry({ menuName: subMenuName, entryText: 'sep' }); return; }
				const entryText = opt.name + (Object.hasOwn(recipe, 'key') && recipe[key] === opt.val ? '\t(forced by recipe)' : '');
				menu.newEntry({
					menuName: subMenuName, entryText, func: () => {
						let input = opt.val;
						const defVal = keyVal || autoVal;
						if (input !== -1) { fb.ShowPopupMessage('This option will filter the library using only genres/styles which are near the selected reference, greatly reducing processing time (although some corner cases which would be considered similar after calculating the mean distance may be excluded).\n\nAutomatic mode will set the threshold to 2 x max. Graph distance (' + defVal + ') in GRAPH mode, or scaled with min. similarity (' + nearScoreFilter + ') in any other mode.', 'Search by distance'); }
						if (input > 0) {
							input = Input.number('int', defVal, 'Enter number: (between -1 and Infinity)\n\nDisabled (-1),  automatic (0) or any Graph distance value (suggested 2 x max Graph distance).', 'Search by distance', defVal, [(input) => input >= -1]);
							if (input === null) {
								if (Input.isLastEqual) { input = Input.previousInput; }
								else { return; }
							}
						}
						if (input > 0) {
							const check = checkMinGraphDistance(input); // Check against min link distances
							if (check.report) { fb.ShowPopupMessage(check.report, 'Near genres filter'); }
						}
						properties[key][1] = input;
						overwriteProperties(properties); // Updates panel
					}, flags: (Object.hasOwn(recipe, key) ? MF_GRAYED : MF_STRING)
				});
			});
			menu.newCheckMenuLast(() => options.filter(menu.isNotSeparator).findIndex((opt) => opt.val === keyVal), options);
			if (keyVal === 0) {
				const key = 'nearGenresFilterAggressiveness';
				const val = properties[key][1];
				const displayedVal = Object.hasOwn(recipe, key) ? recipe[key] : val;
				const entryText = 'Automatic aggressiveness...' + (Object.hasOwn(recipe, key) ? '\t[' + displayedVal + '] (forced by recipe)' : '\t[' + displayedVal + ']');
				menu.newEntry({ menuName: subMenuName, entryText: 'sep' });
				menu.newEntry({
					menuName: subMenuName, entryText, func: () => {
						const input = Input.number('int', val, 'Enter number: (between 0 and 10)\n\nBy default is set to 5; higher values filter in a more aggressive way, and lower values, the opposite.', 'Search by distance', 5, [(input) => input >= 0 && input <= 10]);
						if (input === null) { return; }
						properties[key][1] = input;
						overwriteProperties(properties); // Updates panel
					}, flags: (Object.hasOwn(recipe, key) ? MF_GRAYED : MF_STRING)
				});
			}
		}
		menu.newEntry({ menuName, entryText: 'sep' });
		{	// Influences filter
			const options = ['bUseAntiInfluencesFilter', 'bConditionAntiInfluences', 'sep', 'bUseInfluencesFilter'];
			const bConditionAntiInfluences = Object.hasOwn(recipe, 'bConditionAntiInfluences')
				? recipe['bConditionAntiInfluences']
				: properties['bConditionAntiInfluences'][1];
			options.forEach((key) => {
				if (key === 'sep') { menu.newEntry({ menuName, entryText: 'sep' }); return; }
				const bGraphCondition = !bIsGraph && (key === 'bUseAntiInfluencesFilter' || key === 'bConditionAntiInfluences' || key === 'bUseInfluencesFilter');
				const entryText = properties[key][0].substring(properties[key][0].indexOf('.') + 1) + (Object.hasOwn(recipe, key) ? '\t(forced by recipe)' : (bGraphCondition ? '\t(Only GRAPH)' : ''));
				menu.newEntry({
					menuName, entryText, func: () => {
						if (key === 'bConditionAntiInfluences') { fb.ShowPopupMessage('This option overrides the global anti-influences filter option,\nso it will be disabled at the configuration menu.\n\nWill be enabled automatically for tracks having any of these genre/styles:\n' + descriptors.replaceWithSubstitutionsReverse(descriptors.style_anti_influences_conditional).joinEvery(', ', 6), 'Search by distance'); }
						properties[key][1] = !properties[key][1];
						overwriteProperties(properties); // Updates panel
					}, flags: (key === 'bUseAntiInfluencesFilter' && bConditionAntiInfluences || bGraphCondition ? MF_GRAYED : (Object.hasOwn(recipe, key) ? MF_GRAYED : MF_STRING))
				});
				menu.newCheckMenuLast(() => (Object.hasOwn(recipe, key) ? recipe[key] : properties[key][1]));
			});
		}
		menu.newEntry({ menuName, entryText: 'sep' });
		{	// Artist filter
			const options = ['bSimilArtistsFilter', 'bSimilArtistsExternal', 'sep', 'bSameArtistFilter'];
			const bConditionSimilArtists = Object.hasOwn(recipe, 'bSimilArtistsFilter')
				? recipe['bSimilArtistsFilter']
				: properties['bSimilArtistsFilter'][1];
			options.forEach((key) => {
				if (key === 'sep') { menu.newEntry({ menuName, entryText: 'sep' }); return; }
				const entryText = properties[key][0].substring(properties[key][0].indexOf('.') + 1) + (Object.hasOwn(recipe, key) ? '\t(forced by recipe)' : '');
				menu.newEntry({
					menuName, entryText, func: () => {
						if (key === 'bSimilArtistsFilter') {
							const readme = _open(folders.xxx + 'helpers\\readme\\search_by_distance_similar_artists_filter.txt', utf8);
							if (readme.length) { fb.ShowPopupMessage(readme, 'Similar Artists'); }
						}
						if (key === 'bSimilArtistsExternal') { fb.ShowPopupMessage('This option expands the similar artists filter with tags retrieved by ListenBrainz (https://github.com/regorxxx/ListenBrainz-SMP) or other scripts. If there is a JSON database associated, it will also be used. In any case, note the tags from JSON and files are never merged, always preferring file tags.\n\nList of tags used:\n\n' + [globTags.sbdSimilarArtist, globTags.lbSimilarArtist].join('\n'), 'Search by distance'); }
						if (key === 'bSameArtistFilter') { fb.ShowPopupMessage('This option may override some aspects of the similar artist filter option.\n\nWhen no similar artists data is found, by default only the selected artist would be considered. Thus allowing only tracks by the same artist to be considered.\n\nFiltering the selected artist forces the similar artist filter to fallback to checking all the library tracks in that case, otherwise there would be zero artists to check. It\'s equivalent to have the filter disabled when no similar artist data is present for the selected track\'s artist.\n\nWhen similar artists data is available, it works as expected, skipping the selected artist and only using the others. Thus strictly showing tracks by [others] similar artists.', 'Search by distance'); }
						properties[key][1] = !properties[key][1];
						overwriteProperties(properties); // Updates panel
					}, flags: (key === 'bSimilArtistsExternal' && !bConditionSimilArtists ? MF_GRAYED : (Object.hasOwn(recipe, key) ? MF_GRAYED : MF_STRING))
				});
				menu.newCheckMenuLast(() => (Object.hasOwn(recipe, key) ? recipe[key] : properties[key][1]));
			});
		}
		menu.newEntry({ menuName, entryText: 'sep' });
		{	// Culture filters
			const key = 'artistRegionFilter';
			const keyVal = Object.hasOwn(recipe, key) ? recipe[key] : properties[key][1];
			const options = [
				{ name: 'Same continent', val: 0 },
				{ name: 'Same region', val: 1 },
				{ name: 'Same country', val: 2 },
				{ name: 'sep' },
				{ name: 'Different continent', val: 3 },
				{ name: 'Different region', val: 4 },
				{ name: 'Different country', val: 5 },
				{ name: 'sep' },
				{ name: 'Disabled', val: -1 }
			];
			const subMenuName = menu.newMenu('Artist cultural filter' + (keyVal === -1 ? '\t[-disabled-]' : '\t[enabled]'), menuName);
			options.forEach((opt) => {
				if (opt.name === 'sep') { menu.newEntry({ menuName: subMenuName, entryText: 'sep' }); return; }
				const entryText = opt.name + (Object.hasOwn(recipe, key) && recipe[key] === opt.val ? '\t(forced by recipe)' : '');
				menu.newEntry({
					menuName: subMenuName, entryText, func: () => {
						if (opt.val !== -1) { fb.ShowPopupMessage('This filter allows only artists from the same selected cultural region.\n\nNote it\'s pretty performance intensive since it uses native foobar2000 queries with a lot of conditions, so it will probably add some seconds to the search if enabled. The bigger the library, the greater time it will require.'); }
						properties[key][1] = opt.val;
						overwriteProperties(properties); // Updates panel
					}, flags: (Object.hasOwn(recipe, key) ? MF_GRAYED : MF_STRING)
				});
			});
			menu.newCheckMenuLast(() => options.filter(menu.isNotSeparator).findIndex((opt) => opt.val === keyVal), options);
		}
		{	// Culture filters
			const key = 'genreStyleRegionFilter';
			const keyVal = Object.hasOwn(recipe, key) ? recipe[key] : properties[key][1];
			const options = [
				{ name: 'Same continent', val: 0 },
				{ name: 'Same region', val: 1 },
				{ name: 'sep' },
				{ name: 'Different continent', val: 2 },
				{ name: 'Different region', val: 3 },
				{ name: 'sep' },
				{ name: 'Disabled', val: -1 }
			];
			const subMenuName = menu.newMenu('Genre cultural filter' + (keyVal === -1 ? '\t[-disabled-]' : '\t[enabled]'), menuName);
			options.forEach((opt) => {
				if (opt.name === 'sep') { menu.newEntry({ menuName: subMenuName, entryText: 'sep' }); return; }
				const entryText = opt.name + (Object.hasOwn(recipe, key) && recipe[key] === opt.val ? '\t(forced by recipe)' : '');
				menu.newEntry({
					menuName: subMenuName, entryText, func: () => {
						if (opt.val !== -1) { fb.ShowPopupMessage('This filter allows only genre/styles from the same selected cultural region.\n\nNote it\'s pretty performance intensive since it uses native foobar2000 queries with a lot of conditions, so it will probably add some seconds to the search if enabled. The bigger the library, the greater time it will require.'); }
						properties[key][1] = opt.val;
						overwriteProperties(properties); // Updates panel
					}, flags: (Object.hasOwn(recipe, key) ? MF_GRAYED : MF_STRING)
				});
			});
			menu.newCheckMenuLast(() => options.filter(menu.isNotSeparator).findIndex((opt) => opt.val === keyVal), options);
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
				const val = Object.hasOwn(recipe, key)
					? '\t[' + (recipe[key] === -1 ? '-disabled-' : recipe[key]) + '] (forced by recipe)'
					: '\t[' + (properties[key][1] === -1 ? '-disabled-' : properties[key][1]) + ']';
				const entryText = properties[key][0].substring(properties[key][0].indexOf('.') + 1, idxEnd !== -1 ? idxEnd - 1 : Infinity) + '...' + val;
				menu.newEntry({
					menuName, entryText, func: () => {
						const input = Input.number('int', properties[key][1], 'Enter number: (greater or equal to 0)\n(-1 to disable)', 'Search by distance', properties[key][3], [(input) => input >= -1]);
						if (input === null) { return; }
						properties[key][1] = input;
						overwriteProperties(properties); // Updates panel
					}, flags: Object.hasOwn(recipe, key) ? MF_GRAYED : MF_STRING
				});
			});
		}
	}
	{	// Pool picking:
		const menuFlags = (Object.hasOwn(recipe, 'bInKeyMixingPlaylist') ? recipe.bInKeyMixingPlaylist : properties.bInKeyMixingPlaylist[1]) ? MF_GRAYED : MF_STRING;
		const menuText = 'Set pool picking' + (properties.bInKeyMixingPlaylist[1] || recipe.bInKeyMixingPlaylist ? '       -harmonic mixing-' : '');
		const menuName = menu.newMenu(menuText, void (0), menuFlags);
		{
			createBoolMenu(menuName, ['bRandomPick', 'sep', 'bInversePick'], void (0),
				(key) => {
					let toDisable = [];
					if (key === 'bRandomPick') { toDisable = ['bInversePick']; }
					else if (key === 'bInversePick') { toDisable = ['bRandomPick']; }
					toDisable.forEach((noKey) => { if (properties[noKey][1]) { properties[noKey][1] = !properties[noKey][1]; } });
				}
			);
		}
		menu.newEntry({ menuName, entryText: 'sep', flags: MF_GRAYED });
		{
			const options = ['probPick'];
			options.forEach((key) => {
				const idxEnd = properties[key][0].indexOf('(');
				const entryText = properties[key][0].substring(properties[key][0].indexOf('.') + 1, idxEnd !== -1 ? idxEnd - 1 : Infinity) + '...' + (Object.hasOwn(recipe, key) ? '\t[' + recipe[key] + '] (forced by recipe)' : '\t[' + properties[key][1] + ']');
				menu.newEntry({
					menuName, entryText, func: () => {
						const input = Input.number('int positive', properties[key][1], 'Enter number: (between 0 and 100)', 'Search by distance', properties[key][3], [(input) => input <= 100]);
						if (input === null) { return; }
						properties[key][1] = input;
						overwriteProperties(properties); // Updates panel
					}, flags: Object.hasOwn(recipe, key) ? MF_GRAYED : MF_STRING
				});
			});
		}
	}
	{	// Final sorting
		const menuFlags = (Object.hasOwn(recipe, 'bInKeyMixingPlaylist') ? recipe.bInKeyMixingPlaylist : properties.bInKeyMixingPlaylist[1]) ? MF_GRAYED : MF_STRING;
		const menuText = 'Set final sorting' + (properties.bInKeyMixingPlaylist[1] || recipe.bInKeyMixingPlaylist ? '       -harmonic mixing-' : '');
		const menuName = menu.newMenu(menuText, void (0), menuFlags);
		createBoolMenu(menuName, ['bSortRandom', 'bProgressiveListOrder', 'sep', 'bInverseListOrder', 'sep', 'bScatterInstrumentals', 'sep', 'bSmartShuffle', 'bSmartShuffleAdvc'],
			[void (0), void (0), void (0), void (0), void (0), properties.bSmartShuffle[1], void (0), void (0), !properties.bSmartShuffle[1]],
			(key) => {
				let toDisable = [];
				if (key === 'bSortRandom') { toDisable = ['bProgressiveListOrder', 'bSmartShuffle']; }
				else if (key === 'bProgressiveListOrder') { toDisable = ['bSortRandom', 'bSmartShuffle']; }
				else if (key === 'bSmartShuffle') { toDisable = ['bSortRandom', 'bProgressiveListOrder', 'bScatterInstrumentals']; }
				if (key === 'bSmartShuffleAdvc' && properties[key][1]) {
					fb.ShowPopupMessage(
						'Smart shuffle will also try to avoid consecutive tracks with these conditions:' +
						'\n\t-Instrumental tracks.' +
						'\n\t-Live tracks.' +
						'\n\t-Female/male vocals tracks.' +
						'\n\nThese rules apply in addition to the main smart shuffle, swapping tracks' +
						'\nposition whenever possible without altering the main logic.'
						, 'Search by distance'
					);
				}
				toDisable.forEach((noKey) => { if (properties[noKey][1]) { properties[noKey][1] = !properties[noKey][1]; } });
			}
		);
		{
			const subMenuName = menu.newMenu('Smart Shuffle sorting bias', menuName, properties.bSmartShuffle[1] ? MF_STRING : MF_GRAYED);
			const options = [
				{ key: 'Random', flags: MF_STRING },
				{ key: 'Play count', flags: isPlayCount ? MF_STRING : MF_GRAYED, req: 'foo_playcount' },
				{ key: 'Rating', flags: MF_STRING },
				{ key: 'Popularity', flags: utils.GetPackageInfo('{F5E9D9EB-42AD-4A47-B8EE-C9877A8E7851}') ? MF_STRING : MF_GRAYED, req: 'Find & Play' },
				{ key: 'Last played', flags: isPlayCount ? MF_STRING : MF_GRAYED, req: 'foo_playcount' },
				{ key: 'Key', flags: MF_STRING },
				{ key: 'Key 6A centered', flags: MF_STRING },
			];
			menu.newEntry({ menuName: subMenuName, entryText: 'Prioritize tracks by:', flags: MF_GRAYED });
			menu.newEntry({ menuName: subMenuName, entryText: 'sep' });
			options.forEach((opt) => {
				opt.tf = opt.key.replace(/ /g, '').toLowerCase();
				menu.newEntry({
					menuName: subMenuName, entryText: opt.key + (opt.flags ? '\t' + opt.req : ''), func: () => {
						properties.smartShuffleSortBias[1] = opt.tf;
						overwriteProperties(properties); // Updates panel
					}, flags: (Object.hasOwn(recipe, 'smartShuffleSortBias') ? MF_GRAYED : MF_STRING) | opt.flags
				});
			});
			menu.newEntry({ menuName: subMenuName, entryText: 'sep' });
			menu.newEntry({
				menuName: subMenuName, entryText: 'Custom TF...', func: () => {
					const currValue = options.find((opt) => opt.tf === properties.smartShuffleSortBias[1])
						? shuffleBiasTf(properties.smartShuffleSortBias[1])
						: properties.smartShuffleSortBias[1];
					const input = Input.string('string', currValue, 'Enter TF expression:', 'Search by distance', shuffleBiasTf('rating'));
					if (input === null) { return; }
					properties.smartShuffleSortBias[1] = input;
					overwriteProperties(properties); // Updates panel
				}, flags: Object.hasOwn(recipe, 'smartShuffleSortBias') ? MF_GRAYED : MF_STRING
			});
			menu.newCheckMenuLast(() => {
				const idx = options.findIndex((opt) => opt.key.replace(/ /g, '').toLowerCase() === properties.smartShuffleSortBias[1]);
				return idx !== -1 ? idx : options.length;
			}, options.length + 2);
		}
	}
	{	// Special playlists:
		const menuName = menu.newMenu('Special playlist rules');
		{
			createBoolMenu(menuName, ['bProgressiveListCreation']);
		}
		{
			const options = ['progressiveListCreationN'];
			options.forEach((key) => {
				const idxEnd = properties[key][0].indexOf('(');
				const entryText = properties[key][0].substring(properties[key][0].indexOf('.') + 1, idxEnd !== -1 ? idxEnd - 1 : Infinity) + '...' + (Object.hasOwn(recipe, key) ? '\t[' + recipe[key] + '] (forced by recipe)' : '\t[' + properties[key][1] + ']');
				menu.newEntry({
					menuName, entryText, func: () => {
						const input = Input.number('int positive', properties[key][1], 'Enter number: (between 2 and 100)', 'Search by distance', properties[key][3], [(input) => input >= 2 && input <= 100]);
						if (input === null) { return; }
						properties[key][1] = input;
						overwriteProperties(properties); // Updates panel
					}, flags: Object.hasOwn(recipe, key) ? MF_GRAYED : MF_STRING
				});
			});
		}
		menu.newEntry({ menuName, entryText: 'sep' });
		{
			createBoolMenu(
				menuName,
				['bInKeyMixingPlaylist', 'bHarmonicMixDoublePass'],
				[void (0), Object.hasOwn(recipe, 'bInKeyMixingPlaylist') && !recipe.bInKeyMixingPlaylist || !Object.hasOwn(recipe, 'bInKeyMixingPlaylist') && !properties.bInKeyMixingPlaylist[1]]
			);
		}
	}
	{	// Menu to configure other playlist attributes:
		const menuName = menu.newMenu('Other settings');
		{
			const options = ['playlistName'];
			options.forEach((key) => {
				if (key === 'sep') { menu.newEntry({ menuName, entryText: 'sep' }); return; }
				const idxEnd = properties[key][0].indexOf('(');
				const entryText = properties[key][0].substring(properties[key][0].indexOf('.') + 1, idxEnd !== -1 ? idxEnd - 1 : Infinity) + '...' + (Object.hasOwn(recipe, key) ? '\t[' + recipe[key] + '] (forced by recipe)' : '\t[' + properties[key][1] + ']');
				menu.newEntry({
					menuName, entryText, func: () => {
						const input = Input.string('string', properties[key][1], 'Enter TF expression for playlist name:\n\n%, $, [ and ] must be enclosed in \' chars. \'\' results in single quote.\nFor ex: ' + globTags.artist + '\'\'s Mix   ->   ACDC\'s Mix\n\nAs special tag, %SBD_THEME% is also available when using themes. When a theme is not being used, it\'s evaluated as usual.\nFor ex: $if2(%SBD_THEME%,' + globTags.artist + ')\'\'s Mix   ->   Test\'s Mix', 'Search by distance', globTags.artist + '\'\'s Mix', void (0), true);
						if (input === null) { return; }
						properties[key][1] = input;
						overwriteProperties(properties); // Updates panel
					}, flags: Object.hasOwn(recipe, key) ? MF_GRAYED : MF_STRING
				});
			});
		}
		menu.newEntry({ menuName, entryText: 'sep' });
		{
			const options = ['playlistLength'];
			options.forEach((key) => {
				const idxEnd = properties[key][0].indexOf('(');
				const entryText = properties[key][0].substring(properties[key][0].indexOf('.') + 1, idxEnd !== -1 ? idxEnd - 1 : Infinity) + '...' + (Object.hasOwn(recipe, key) ? '\t[' + recipe[key] + '] (forced by recipe)' : '\t[' + properties[key][1] + ']');
				menu.newEntry({
					menuName, entryText, func: () => {
						const input = Input.number('int positive', properties[key][1], 'Enter number: (greater than 0)\n(Infinity is allowed)', 'Search by distance', properties[key][3], [(input) => input >= 0]);
						if (input === null) { return; }
						properties[key][1] = input;
						overwriteProperties(properties); // Updates panel
					}, flags: Object.hasOwn(recipe, key) ? MF_GRAYED : MF_STRING
				});
			});
		}
		menu.newEntry({ menuName, entryText: 'sep' });
		{
			const subMenuName = menu.newMenu('Duplicates', menuName);
			{
				createTagMenu(subMenuName, ['checkDuplicatesByTag']);
			}
			{
				menu.newEntry({
					menuName: subMenuName, entryText: 'Duplicates selection bias...' + (Object.hasOwn(recipe, 'sortBias') ? '\t(forced by recipe)' : ''), func: () => {
						const input = Input.string('string', properties['sortBias'][1], 'Enter TF expression for track selection when finding duplicates:\n\nHigher valued tracks will be preferred.', 'Search by distance', globQuery.remDuplBias, void (0), false);
						if (input === null) { return; }
						properties['sortBias'][1] = input;
						overwriteProperties(properties); // Updates panel
					}, flags: Object.hasOwn(recipe, 'sortBias') ? MF_GRAYED : MF_STRING
				});
			}
			{
				createBoolMenu(
					subMenuName,
					['bAdvTitle', 'bMultiple'],
					void (0),
					(key) => {
						if (key === 'bAdvTitle' && properties.bAdvTitle[1]) { fb.ShowPopupMessage(globRegExp.title.desc, 'Search by distance'); }
						if (key === 'bMultiple') {
							fb.ShowPopupMessage(
								'When this option is enabled, multi-value tags are parsed independently and a track may be considered a duplicate if at least one of those values match (instead of requiring all to match in the same order).\n\nSo for \'[ARTIST, DATE, TITLE]\' tags, these are duplicates with this option enabled:\n' +
								'\nJimi Hendrix - 1969 - Blabla' +
								'\nJimi Hendrix experience, Jimi Hendrix - 1969 - Blabla' +
								'\nBand of Gypys, Jimi Hendrix - 1969 - Blabla' +
								'\n\nWith multi-value parsing disabled, these are considered non-duplicated tracks since not all artists match.',
								'Search by distance'
							);
						}
					}
				);
			}
		}
	}
	menu.newEntry({ entryText: 'sep' });
	{	// Other tools
		const submenu = menu.newMenu('Other tools');
		{
			menu.newEntry({
				menuName: submenu, entryText: 'Calculate similar artists tags', func: () => {
					calculateSimilarArtistsFromPls({ items: plman.GetPlaylistSelectedItems(plman.ActivePlaylist), properties });
				}
			});
			menu.newEntry({
				menuName: submenu, entryText: 'Write similar artists tags', func: () => {
					writeSimilarArtistsTags({ file: folders.data + 'searchByDistance_artists.json', tagName: globTags.sbdSimilarArtist, windowName: 'Search by Distance' });
				}, flags: _isFile(folders.data + 'searchByDistance_artists.json') ? MF_STRING : MF_GRAYED
			});
		}
		menu.newEntry({ menuName: submenu, entryText: 'sep' });
		{
			menu.newEntry({
				menuName: submenu, entryText: 'Calculate same zone artists', func: () => {
					console.log(getArtistsSameZone({ properties }));
				}
			});
		}
		menu.newEntry({ menuName: submenu, entryText: 'sep' });
		{
			{
				const flags = plman.ActivePlaylist !== -1 && plman.GetPlaylistSelectedItems(plman.ActivePlaylist).Count > 1 ? MF_STRING : MF_GRAYED;
				menu.newEntry({
					menuName: submenu, entryText: 'Relate selected tracks (by MBID/Title)', func: () => {
						addTracksRelation({ mode: 'related', tagsKeys: { related: tags.related.tf } });
					}, flags
				});
				menu.newEntry({
					menuName: submenu, entryText: 'Unrelate selected tracks (by MBID/Title)', func: () => {
						addTracksRelation({ mode: 'unrelated', tagsKeys: { unrelated: tags.unrelated.tf } });
					}, flags
				});
				menu.newEntry({ menuName: submenu, entryText: 'sep' });
				menu.newEntry({
					menuName: submenu, entryText: 'Relate selected tracks (by Artist)', func: () => {
						addTracksRelation({ mode: 'related', tagsKeys: { related: tags.related.tf }, idTags: ['ALBUM ARTIST'] });
					}, flags
				});
				menu.newEntry({
					menuName: submenu, entryText: 'Unrelate selected tracks (by Artist)', func: () => {
						addTracksRelation({ mode: 'unrelated', tagsKeys: { unrelated: tags.unrelated.tf }, idTags: ['ALBUM ARTIST'] });
					}, flags
				});
			}
			menu.newEntry({ menuName: submenu, entryText: 'sep' });
			{
				const sel = plman.ActivePlaylist !== -1
					? plman.GetPlaylistSelectedItems(plman.ActivePlaylist)
					: null;
				const flags = sel && sel.Count > 0 && sbd.lastSearch.handle && !(sel.Count === 1 && sel[0].RawPath === sbd.lastSearch.handle.RawPath)
					? MF_STRING
					: MF_GRAYED;
				menu.newEntry({
					menuName: submenu, entryText: 'Relate selected tracks to last search', func: () => {
						sel.Convert().forEach((handle) => {
							if (sbd.lastSearch.handle.RawPath === handle.RawPath) { return; }
							addTracksRelation({
								handleList: new FbMetadbHandleList([handle, sbd.lastSearch.handle]),
								mode: 'related', tagsKeys: { unrelated: tags.related.tf }
							});
						});
					}, flags
				});
				menu.newEntry({
					menuName: submenu, entryText: 'Unrelate selected tracks to last search', func: () => {
						sel.Convert().forEach((handle) => {
							if (sbd.lastSearch.handle.RawPath === handle.RawPath) { return; }
							addTracksRelation({
								handleList: new FbMetadbHandleList([handle, sbd.lastSearch.handle]),
								mode: 'unrelated', tagsKeys: { unrelated: tags.unrelated.tf }
							});
						});
					}, flags
				});
			}
		}
	}
	{	// Debug
		const submenu = menu.newMenu('Debug and testing');
		{
			const submenuTwo = menu.newMenu('Logging', submenu);
			createBoolMenu(
				submenuTwo,
				['bGraphDebug', 'sep', 'bShowQuery', 'bBasicLogging', 'bShowFinalSelection', 'bSearchDebug', 'bProfile']
			);
		}
		menu.newEntry({ menuName: submenu, entryText: 'sep' });
		{
			const submenuTwo = menu.newMenu('Descriptors', submenu);
			{
				menu.newEntry({
					menuName: submenuTwo, entryText: 'Calculate Music Graph statistics', func: () => {
						const profiler = sbd.panelProperties.bProfile[1] ? new FbProfiler('graphStatistics') : null;
						parent.switchAnimation('Graph statistics', true);
						graphStatistics({ properties, graph: sbd.allMusicGraph, influenceMethod: sbd.influenceMethod }).then((resolve) => {
							_save(folders.temp + 'musicGraphStatistics.txt', resolve.text.replace(/\n/g, '\r\n'));
							console.log(resolve.text); // DEBUG
							parent.switchAnimation('Graph statistics', false);
							if (sbd.panelProperties.bProfile[1]) { profiler.Print(); }
						});
					}
				});
			}
			menu.newEntry({ menuName: submenuTwo, entryText: 'sep' });
			{ // Open graph html file
				menu.newEntry({
					menuName: submenuTwo, entryText: 'Show Music Graph on Browser', func: () => {
						const file = folders.xxx + 'Draw Graph.html';
						if (_isFile(file)) { _run(file); }
					}
				});
			}
			menu.newEntry({ menuName: submenuTwo, entryText: 'sep' });
			{ // Open descriptors
				menu.newEntry({
					menuName: submenuTwo, entryText: 'Open main descriptor', func: () => {
						const file = folders.xxx + 'main\\music_graph\\music_graph_descriptors_xxx.js';
						if (_isFile(file)) { _explorer(file); _run('notepad.exe', file); }
					}
				});
				menu.newEntry({
					menuName: submenuTwo, entryText: 'Open user descriptor', func: () => {
						const file = folders.userHelpers + 'music_graph_descriptors_xxx_user.js';
						if (!_isFile(file)) {
							_copyFile(folders.xxx + 'main\\music_graph\\music_graph_descriptors_xxx_user.js', file);
							const readme = _open(folders.xxx + 'helpers\\readme\\search_by_distance_user_descriptors.txt', utf8);
							if (readme.length) { fb.ShowPopupMessage(readme, 'User descriptors'); }
						}
						if (_isFile(file)) { _explorer(file); _run('notepad.exe', file); }
					}
				});
			}
		}
		menu.newEntry({ menuName: submenu, entryText: 'sep' });
		{ 	// Find genre/styles not on graph
			menu.newEntry({
				menuName: submenu, entryText: 'Find genres/styles not on Graph', func: () => {
					const tags = JSON.parse(properties.tags[1]);
					findStyleGenresMissingGraph({
						genreStyleFilter: JSON.parse(properties.genreStyleFilterTag[1]).filter(Boolean),
						genreStyleTag: Object.values(tags).filter((t) => t.type.includes('graph') && !t.type.includes('virtual')).map((t) => t.tf).flat(Infinity),
						bAscii: properties.bAscii[1],
						bPopup: true
					});
				}
			});
			// Graph debug
			menu.newEntry({
				menuName: submenu, entryText: 'Debug Graph (check console)', func: () => {
					const profiler = sbd.panelProperties.bProfile[1] ? new FbProfiler('graphDebug') : null;
					graphDebug(sbd.allMusicGraph, true); // Show popup on pass
					music_graph_descriptors_culture.debug(sbd.allMusicGraph);
					if (sbd.panelProperties.bProfile[1]) { profiler.Print(); }
				}
			});
			// Graph test
			menu.newEntry({
				menuName: submenu, entryText: 'Run distance tests (check console)', func: () => {
					const profiler = sbd.panelProperties.bProfile[1] ? new FbProfiler('testGraph') : null;
					[testGraphNodes, testGraphNodeSets, music_graph_descriptors_culture.distanceDebug].forEach((f, i) => {
						console.log('-'.repeat(60) + '-> Test ' + _p(i + 1));
						f(sbd.allMusicGraph);
					});
					if (sbd.panelProperties.bProfile[1]) { profiler.Print(); }
				}
			});
			if (sbd.panelProperties.bProfile[1]) {
				menu.newEntry({
					menuName: submenu, entryText: 'Run speed tests (check console)', func: () => {
						const sel = fb.GetSelection();
						const stats = { total: 0, steps: []};
						const times = 100;
						Promise.serial(range(1, times, 1), () => {
							searchByDistance({ sel, properties: parent.buttonsProperties, theme: parent.buttonsProperties.theme[1], recipe: parent.buttonsProperties.recipe[1], parent });
							stats.total += sbd.profiler.Time;
							sbd.profiler.CheckPoints.forEach((sp) => {
								const found = stats.steps.find((s) => s && s.name === sp.name);
								if (found) {found.acc += sp.acc;} 
								else {stats.steps.push({...sp});}
							});
							return Promise.wait(1000);
						}).then(() => {
							console.log('Times executed:\t' + times);
							console.log('Average runtime:\t' + stats.total / times + ' ms');
							stats.steps.sort((a, b) => a.name.localeCompare(b.name)).forEach((s) => console.log('\t' + s.name + ':\t' + s.acc / times + ' ms'));
						});
	
					}
				});
			}
		}
		menu.newEntry({ menuName: submenu, entryText: 'sep' });
		{ 	// Graph cache reset Async
			menu.newEntry({
				menuName: submenu, entryText: 'Reset link cache' + (sbd.isCalculatingCache ? '\t -processing-' : ''), func: () => {
					if (sbd.isCalculatingCache) {
						fb.ShowPopupMessage('There is a calculation currently on process.\nTry again after it finishes. Check console (or animation).', 'Graph cache');
						return;
					}
					_deleteFile(folders.data + 'searchByDistance_cacheLink.json');
					_deleteFile(folders.data + 'searchByDistance_cacheLinkSet.json');
					cacheLink = void (0); // NOSONAR [global]
					cacheLinkSet = void (0); // NOSONAR [global]
					updateCache({ bForce: true, properties }); // Creates new one and also notifies other panels to discard their cache
				}, flags: !sbd.isCalculatingCache ? MF_STRING : MF_GRAYED
			});
		}
	}
	menu.newEntry({ entryText: 'sep' });
	{
		const subMenuName = menu.newMenu('Button config');
		menu.newEntry({
			menuName: subMenuName, entryText: 'Rename button...', func: () => {
				let input = '';
				try { input = utils.InputBox(window.ID, 'Enter button name. Then configure according to your liking using the menus or the properties panel (look for \'' + parent.prefix + '...\').', window.Name + ': Search by Distance Customizable Button', properties.customName[1], true); }
				catch (e) { return; }
				if (!input.length) { return; }
				if (properties.customName[1] !== input) {
					properties.customName[1] = input;
					overwriteProperties(properties); // Force overwriting
					parent.adjustNameWidth(input);
				}
			}
		});
		menu.newEntry({
			menuName: subMenuName, entryText: 'Show shortcuts on tooltip', func: () => {
				properties.bTooltipInfo[1] = !properties.bTooltipInfo[1];
				overwriteProperties(properties); // Force overwriting
			}
		});
		menu.newCheckMenu(subMenuName, 'Show shortcuts on tooltip', void (0), () => { return properties.bTooltipInfo[1]; });
	}
	menu.newEntry({ entryText: 'sep' });
	{	// Reset
		menu.newEntry({
			entryText: 'Restore defaults...', func: () => {
				for (let key in SearchByDistance_properties) {
					if (Object.hasOwn(properties, key)) { properties[key][1] = SearchByDistance_properties[key][1]; }
				}
				properties.theme[1] = '';
				properties.recipe[1] = '';
				properties.data[1] = JSON.stringify({ forcedTheme: '', theme: 'None', recipe: 'None' });
				overwriteProperties(properties); // Force overwriting
			}
		});
	}
	{	// Reset
		menu.newEntry({
			entryText: 'Share configuration...', func: () => {
				const list = ['tags', 'forced query', 'genre/style filter tag', 'pool filtering tag', 'duplicates removal tag', 'smart shuffle tag'];
				const answer = WshShell.Popup('Share current configuration with other buttons and panels?\nSettings which will be copied:\n' + capitalizePartial(list.join(', ')), 0, 'Search by distance', popup.question + popup.yes_no);
				if (answer === popup.yes) {
					const obj = clone(properties);
					obj.name = parent.name;
					window.NotifyOthers('Search by Distance: share configuration', obj);
					obj.notifyThis = true;
					window.NotifyThis('Search by Distance: share configuration', obj);
				}
			}
		});
	}
	menu.newEntry({ entryText: 'sep' });
	{	// Readmes
		const subMenuName = menu.newMenu('Readmes');
		menu.newEntry({ menuName: subMenuName, entryText: 'Open popup with readme:', func: null, flags: MF_GRAYED });
		menu.newEntry({ menuName: subMenuName, entryText: 'sep' });
		let iCount = 0;
		const readmes = [
			{ name: 'Main', file: folders.xxx + 'helpers\\readme\\search_by_distance.txt' },
			{ name: 'sep' },
			{ name: 'Method: DYNGENRE', file: folders.xxx + 'helpers\\readme\\search_by_distance_dyngenre.txt' },
			{ name: 'Method: GRAPH', file: folders.xxx + 'helpers\\readme\\search_by_distance_graph.txt' },
			{ name: 'Method: WEIGHT', file: folders.xxx + 'helpers\\readme\\search_by_distance_weight.txt' },
			{ name: 'sep' },
			{ name: 'Filter: cultural', file: folders.xxx + 'helpers\\readme\\search_by_distance_cultural_filter.txt' },
			{ name: 'Filter: dynamic query', file: folders.xxx + 'helpers\\readme\\search_by_distance_dynamic_query.txt' },
			{ name: 'Filter: influences', file: folders.xxx + 'helpers\\readme\\search_by_distance_influences_filter.txt' },
			{ name: 'Filter: similar artists', file: folders.xxx + 'helpers\\readme\\search_by_distance_similar_artists_filter.txt' },
			{ name: 'sep' },
			{ name: 'Tags & Weights: cultural', file: folders.xxx + 'helpers\\readme\\search_by_distance_cultural.txt' },
			{ name: 'Tags & Weights: related tracks', file: folders.xxx + 'helpers\\readme\\search_by_distance_related.txt' },
			{ name: 'Tags & Weights: similar artists', file: folders.xxx + 'helpers\\readme\\search_by_distance_similar_artists.txt' }, { name: 'sep' },
			{ name: 'Scoring methods', file: folders.xxx + 'helpers\\readme\\search_by_distance_scoring.txt' },
			{ name: 'Scoring methods: chart', file: folders.xxx + 'helpers\\readme\\search_by_distance_scoring.png' },
			{ name: 'sep' },
			{ name: 'Sorting: smart shuffle', file: folders.xxx + 'helpers\\readme\\shuffle_by_tags.txt' },
			{ name: 'Sorting: harmonic mixing', file: folders.xxx + 'helpers\\readme\\harmonic_mixing.txt' },
			{ name: 'sep' },
			{ name: 'Recipes & Themes', file: folders.xxx + 'helpers\\readme\\search_by_distance_recipes_themes.txt' },

			{ name: 'User descriptors', file: folders.xxx + 'helpers\\readme\\search_by_distance_user_descriptors.txt' },
			{ name: 'sep' },
			{ name: 'Tagging requisites', file: folders.xxx + 'helpers\\readme\\tags_structure.txt' },
			{ name: 'Tags sources', file: folders.xxx + 'helpers\\readme\\tags_sources.txt' },
			{ name: 'Other tags notes', file: folders.xxx + 'helpers\\readme\\tags_notes.txt' },
		].filter(Boolean);
		if (readmes.length) {
			readmes.forEach((entry) => { // Only show non empty files
				if (entry.name === 'sep') { menu.newEntry({ menuName: subMenuName, entryText: 'sep' }); }
				else if (_isFile(entry.file)) {
					const readme = _open(entry.file, utf8); // Executed on script load
					if (readme.length) {
						menu.newEntry({
							menuName: subMenuName, entryText: entry.name, func: () => { // Executed on menu click
								if (_isFile(entry.file)) {
									if (entry.file.endsWith('.png')) {
										_run(entry.file);
									} else {
										const readme = _open(entry.file, utf8);
										if (readme.length) { fb.ShowPopupMessage(readme, entry.name); }
									}
								} else { console.log('Readme not found: ' + entry.file); }
							}
						});
						iCount++;
					}
				} else { console.log('Readme not found: ' + entry.file); }
			});
		}
		if (!iCount) { menu.newEntry({ menuName: subMenuName, entryText: '- no files - ', func: null, flags: MF_GRAYED }); }
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
		const validVars = Object.keys(music_graph_descriptors).map((key) => { return 'music_graph_descriptors.' + key; });
		if (val.indexOf('+') === -1 && val.indexOf('-') === -1 && val.indexOf('*') === -1 && val.indexOf('/') === -1 && validVars.indexOf(val) === -1) {
			console.log('Error parsing graphDistance (using no arithmetics or variable): ' + val);
			return;
		}
		val = Math.floor(eval(val));
	}
	return val;
}