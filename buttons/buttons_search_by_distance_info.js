'use strict';
//21/12/23

/* global globFonts:readable, MK_SHIFT:readable, VK_SHIFT:readable, VK_CONTROL:readable, MF_GRAYED:readable, globQuery:readable, globTags:readable, clone:readable, MF_STRING:readable , MF_MENUBREAK:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getUniquePrefix:readable, buttonsBar:readable, addButton:readable, themedButton:readable, _gr:readable, _scale:readable, _gdiFont:readable, themedButton:readable, chars:readable, round:readable */
include('..\\helpers\\helpers_xxx_input.js');
/* global Input:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable, overwriteProperties:readable */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable, isJSON:readable, _p:readable , capitalizePartial:readable */
include('..\\helpers\\helpers_xxx_tags.js');
/* global query_join:readable, getTagsValuesV5:readable */
include('..\\helpers\\buttons_xxx_menu.js');
/* global _menu:readable, settingsMenu:readable */
include('..\\helpers\\menu_xxx_extras.js');
/* global _createSubMenuEditEntries:readable */
include('..\\helpers\\helpers_xxx_statistics.js');
/* global calcStatistics:readable */
include('..\\main\\search_by_distance\\search_by_distance.js'); // Load after buttons_xxx.js so properties are only set once
/* global sbd:readable, music_graph_descriptors:readable */
include('..\\main\\search_by_distance\\search_by_distance_extra.js'); // Load after buttons_xxx.js so properties are only set once
var version = sbd.version; // NOSONAR [shared on files]

try {window.DefineScript('Search by Distance Info Button', {author:'regorxxx', version, features: {drag_n_drop: false}});} catch (e) {/* console.log('Search by Distance Info Button loaded.'); */} //May be loaded along other buttons


var prefix = 'sbd'; // NOSONAR [shared on files]
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { // NOSONAR [shared on files]
	bTooltipInfo:	['Show shortcuts on tooltip', true, {func: isBoolean}, true],
	bIconMode:		['Icon-only mode?', false, {func: isBoolean}, false],
	entries:		['Info entries', JSON.stringify([
		{name: 'By Genre',
			tf: ['GENRE', 'ARTIST GENRE LAST.FM', 'ARTIST GENRE ALLMUSIC', 'ALBUM GENRE LAST.FM', 'ALBUM GENRE ALLMUSIC', 'ALBUM GENRE WIKIPEDIA', 'ARTIST GENRE WIKIPEDIA']},
		{name: 'By Style',
			tf: ['STYLE']},
	]), {func: isJSON}],
};
newButtonsProperties.entries.push(newButtonsProperties.entries[1]);
newButtonsProperties = {...newButtonsProperties}; // Add default properties at the beginning to be sure they work
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0); // And retrieve
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Search by Distance Info': new themedButton({x: 0, y: 0, w: _gr.CalcTextWidth('Graph Info', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) /_scale(buttonsBar.config.scale), h: 22}, 'Graph Info', function (mask) {
		if (mask === MK_SHIFT) {
			const menu = settingsMenu(
				this, true, ['buttons_search_by_distance_info.js'], void(0), void(0),
				(menu) => {
					menu.newEntry({entryText: 'sep'});
					_createSubMenuEditEntries(menu, void(0), {
						name: 'Graph Info',
						list: JSON.parse(this.buttonsProperties.entries[1]),
						defaults: JSON.parse(this.buttonsProperties.entries[3]),
						input : () => {
							const entry = {
								tf: Input.json('array strings', '',
									'Enter tag names:\n\n' +
									'Ex:\n' + JSON.stringify(['GENRE', 'ALBUM GENRE WIKIPEDIA'])
									, 'Graph Info', JSON.stringify(['GENRE', 'ALBUM GENRE WIKIPEDIA']), void(0), true
								),
							};
							if (!entry.tf) {return;}
							return entry;
						},
						bNumbered: true,
						onBtnUp: (entries) => {
							this.buttonsProperties.entries[1] = JSON.stringify(entries);
							overwriteProperties(this.buttonsProperties);
						}
					});
				}
			);
			menu.btn_up(this.currX, this.currY + this.currH);
		} else {
			graphInfoMenu.bind(this)().btn_up(this.currX, this.currY + this.currH);
		}
	}, null, void(0), buttonTooltipSbdCustom, prefix, newButtonsProperties, chars.info, void(0), void(0), void(0),void(0),
	{scriptName: 'Search-by-Distance-SMP', version})
});

// Helper
function buttonTooltipSbdCustom(parent) {
	const properties = parent.buttonsProperties;
	const bTooltipInfo = properties.bTooltipInfo[1];
	let info = 'Genre/style info by acoustic-folksonomy models:';
	info += '\n-----------------------------------------------------';
	// Modifiers
	const bShift = utils.IsKeyPressed(VK_SHIFT);
	const bControl = utils.IsKeyPressed(VK_CONTROL);
	if (bShift && !bControl || bTooltipInfo) {info += '\n(Shift + L. Click for config)';}
	return info;
}

function graphInfoMenu() {
	// Get current selection and metadata
	const sel = this.sel || plman.ActivePlaylist !== -1 ? fb.GetFocusItem(true) : null;
	const info = sel ? sel.GetFileInfo() : null;
	const entries = JSON.parse(this.buttonsProperties.entries[1]);
	entries.forEach((tag) => {
		tag.val = [];
		tag.valSet = new Set();
	});
	if (info) {
		entries.forEach((tag) => {
			tag.tf.forEach((tf, i) => {
				const idx = info.MetaFind(tf);
				tag.val.push([]);
				// File tags
				if (idx !== -1) {
					let count = info.MetaValueCount(idx);
					while (count--) {
						const val = info.MetaValue(idx, count).trim();
						tag.val[i].push(val);
						if (i === 0 || i !== 0 && !/TITLE|ALBUM_TRACKS/i.test(tag.type)) {tag.valSet.add(val);}
					}
				}
			});
		});
	}
	// Menu
	const menu = new _menu();
	menu.newEntry({entryText: 'Display statistics:', flags: MF_GRAYED});
	menu.newEntry({entryText: 'sep'});
	{	// Same...
		entries.forEach((entry) => {
			// Add separators
			if (Object.hasOwn(entry, 'name') && entry.name === 'sep') {
				menu.newEntry({entryText: 'sep'});
			} else {
				// Create names for all entries
				entry.name = entry.name.length > 40 ? entry.name.substring(0,40) + ' ...' : entry.name;
				// Entries
				const bSingle = entry.valSet.size <= 1;
				const menuName = bSingle ? menu.getMainMenuName() : menu.newMenu(entry.name);
				if (entry.valSet.size === 0) {entry.valSet.add('');}
				[...entry.valSet].sort((a, b) => a.localeCompare(b, 'en', {'sensitivity': 'base'})).forEach((tagVal, i) => {
					menu.newEntry({menuName, entryText:  bSingle ? entry.name + '\t[' + (tagVal.cut(25) || (sel ? 'no tag' : 'no sel')) + ']' : tagVal.cut(25), func: () => {
						// report
						const report = [];
						report.push('Genre/style: ' + tagVal);
						report.push('-'.repeat(40));
						report.push('');
						// Data from library
						const query = query_join(entry.tf.map((tag) => tag + ' IS ' + tagVal), 'OR');
						const libItems = fb.GetLibraryItems();
						const handleList = fb.GetQueryItems(libItems, query);
						report.push('Tracks: ' + handleList.Count + ' ' + _p(round(handleList.Count/libItems.Count * 100, 1) + '% from ' + libItems.Count + ' total items'));
						const subQuery = [
							{name: 'With rating >= 3: ',	query: globQuery.ratingGr2},
							{name: 'With rating >= 4: ',	query: globQuery.ratingGr3},
							{name: 'With rating  = 5: ',	query: globTags.rating + ' IS 5'},
							{name: 'Loved:\t\t  ',			query: '%FEEDBACK% IS 1'}
						];
						report.push(...subQuery.map((q) => '\t' + q.name + fb.GetQueryItems(handleList, q.query).Count));
						const date = getTagsValuesV5(handleList, [{name: globTags.date, type: 'number'}], true).flat(Infinity).filter(Boolean);
						const stats = calcStatistics(date);
						report.push('Min/Max date: ' + stats.min + '/' + stats.max);
						report.push('Most frequent date: ' + Math.round(stats.mode.value) + ' ' + _p(stats.mode.frequency + ' times'));
						report.push('Average date: ' + Math.round(stats.mean));
						report.push('Median date: ' + Math.round(stats.median));
						report.push('Standard deviation: ' + Math.round(stats.sigma) + ' years');
						report.push('Range date (75%-95%): ' + stats.popRange.universal['75%'].map(Math.round).join(' - '));
						report.push('-'.repeat(40));
						report.push('');
						// Data from descriptors
						const data = clone(music_graph_descriptors.nodeList.get(music_graph_descriptors.getSubstitution(tagVal)));
						const nodeSet = music_graph_descriptors.getNodeSet(false);
						for (let key in data) {
							switch (key) { // NOSONAR
								case 'region': {
									if (!data[key] || Array.isArray(data[key]) && !data[key].length) {data[key] = 'All';}
									else {data[key] = JSON.stringify(data[key], null, '\t');}
									break;
								}
								default: {
									if (!data[key] || Array.isArray(data[key]) && !data[key].length) {data[key] = '-';}
									else if (Array.isArray(data[key])){
										data[key] = data[key].map((sg) => {
											return nodeSet.has(sg) ? sg : music_graph_descriptors.replaceWithSubstitutionsReverse([sg])[0];
										});
									}
								}
							}
						}
						report.push(...Object.entries(data).map((pair) => {
							return capitalizePartial(pair[0]).split(/(?=[A-Z])/).join(' ') + ': ' + (Array.isArray(pair[1]) ? pair[1].join(', ') : pair[1]);
						}));
						// report
						fb.ShowPopupMessage(report.join('\n'), 'Graph info');
					}, flags: (tagVal ? MF_STRING : MF_GRAYED) | (!bSingle && i % 8 === 0 ? MF_MENUBREAK : MF_STRING), data: {bDynamicMenu: true}});
				});
			}
		});
	}
	return menu;
}