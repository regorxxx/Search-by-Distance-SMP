'use strict';
//12/03/25

/* global menu_panelProperties:readable */
include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, MK_SHIFT:readable, VK_SHIFT:readable, VK_CONTROL:readable, MF_GRAYED:readable, globQuery:readable, globTags:readable, clone:readable, MF_STRING:readable, MF_MENUBREAK:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable, _gr:readable, _scale:readable, _gdiFont:readable, ThemedButton:readable, chars:readable, round:readable */
include('..\\helpers\\helpers_xxx_input.js');
/* global Input:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable, overwriteProperties:readable */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable, isJSON:readable, _p:readable, capitalizePartial:readable, isStringWeak: readable */
include('..\\helpers\\helpers_xxx_tags.js');
/* global queryJoin:readable, getHandleListTagsTyped:readable, _b:readable, _t:readable */
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

try { window.DefineScript('Search by Distance Info Button', { author: 'regorxxx', version, features: { drag_n_drop: false } }); } catch (e) { /* May be loaded along other buttons */ } // eslint-disable-line no-unused-vars

var prefix = 'sbd'; // NOSONAR [shared on files]
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { // NOSONAR [shared on files]
	bIconMode: ['Icon-only mode', false, { func: isBoolean }, false],
	entries: ['Info entries', JSON.stringify([
		{
			name: 'By Genre',
			tf: [...new Set([globTags.genre, 'GENRE', 'ARTIST GENRE LAST.FM', 'ARTIST GENRE ALLMUSIC', 'ALBUM GENRE LAST.FM', 'ALBUM GENRE ALLMUSIC', 'ALBUM GENRE WIKIPEDIA', 'ARTIST GENRE WIKIPEDIA'])]
		},
		{
			name: 'By Style',
			tf: [...new Set([globTags.style, 'STYLE'])]
		},
	]), { func: isJSON }],
};
newButtonsProperties.entries.push(newButtonsProperties.entries[1]);
newButtonsProperties = { ...newButtonsProperties }; // Add default properties at the beginning to be sure they work
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0); // And retrieve
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Search by Distance Info': new ThemedButton({
		coordinates: { x: 0, y: 0, w: _gr.CalcTextWidth('Graph Info', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 },
		text: 'Graph Info',
		func: function (mask) {
			if (mask === MK_SHIFT) {
				const menu = settingsMenu(
					this, true, ['buttons_search_by_distance_info.js'], void (0), void (0),
					(menu) => {
						menu.newSeparator();
						_createSubMenuEditEntries(menu, void (0), {
							name: 'Graph Info',
							list: JSON.parse(this.buttonsProperties.entries[1]),
							defaults: JSON.parse(this.buttonsProperties.entries[3]),
							input: () => {
								const entry = {
									tf: Input.json('array strings', '',
										'Enter tag names:\n\n' +
										'Ex:\n' + JSON.stringify([globTags.genre, 'ALBUM GENRE WIKIPEDIA'])
										, 'Graph Info', JSON.stringify([globTags.genre, 'ALBUM GENRE WIKIPEDIA']), void (0), true
									),
								};
								if (!entry.tf) { return; }
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
		},
		description: buttonTooltipSbdCustom,
		prefix, buttonsProperties: newButtonsProperties,
		icon: chars.info,
		update: { scriptName: 'Search-by-Distance-SMP', version }
	})
});

// Helper
function buttonTooltipSbdCustom() {
	const properties = this.buttonsProperties;
	const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
	let info = 'Genre/style info by acoustic-folksonomy models:\n';
	const sel = fb.GetFocusItem();
	if (sel) {
		const entries = JSON.parse(properties.entries[1]);
		let tfo = fb.TitleFormat(
			entries.map((entry) => {
				return '$puts(info,' + entry.tf.map((tag, i) => _b((i ? '\\, ' : '') + _t(tag))).join('') + ')' +
					entry.name + ':\t$ifgreater($len($get(info)),50,$cut($get(info),50)...,$get(info))';
			}).join('$crlf()')
		);
		info += tfo.EvalWithMetadb(sel);
	} else { info += 'No track selected'; }
	info += '\n-----------------------------------------------------';
	// Modifiers
	const bShift = utils.IsKeyPressed(VK_SHIFT);
	const bControl = utils.IsKeyPressed(VK_CONTROL);
	if (bShift && !bControl || bInfo) { info += '\n(Shift + L. Click for config)'; }
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
						if (i === 0 || i !== 0 && !/TITLE|ALBUM_TRACKS/i.test(tag.type)) { tag.valSet.add(val); }
					}
				}
			});
		});
	}
	// Menu
	const menu = new _menu();
	menu.newEntry({ entryText: 'Display statistics:', flags: MF_GRAYED });
	menu.newSeparator();
	{	// Same...
		entries.forEach((entry) => {
			// Add separators
			if (menu.isSeparator(entry)) {
				menu.newSeparator();
			} else {
				// Create names for all entries
				entry.name = entry.name.length > 40 ? entry.name.substring(0, 40) + ' ...' : entry.name;
				// Entries
				const bSingle = entry.valSet.size <= 1;
				const menuName = bSingle ? menu.getMainMenuName() : menu.newMenu(entry.name);
				if (entry.valSet.size === 0) { entry.valSet.add(''); }
				[...entry.valSet].sort((a, b) => a.localeCompare(b, 'en', { 'sensitivity': 'base' })).forEach((tagVal, i) => {
					menu.newEntry({
						menuName, entryText: bSingle ? entry.name + '\t[' + (tagVal.cut(25) || (sel ? 'no tag' : 'no sel')) + ']' : tagVal.cut(25), func: () => {
							// report
							const report = [];
							const header = (title) => {
								const len = title.length;
								report.push('-'.repeat(len));
								report.push(title);
								report.push('-'.repeat(len));
							};
							header('Genre/style: ' + tagVal);
							report.push('');
							// Data from library
							const query = queryJoin(entry.tf.map((tag) => tag + ' IS ' + tagVal), 'OR');
							const libItems = fb.GetLibraryItems();
							const handleList = fb.GetQueryItems(libItems, query);
							{ // Library stats
								const trackCount = handleList.Count;
								const libCount = libItems.Count;
								header('Library stats:');
								{ // Artists
									const artists = getHandleListTagsTyped(handleList, [{ name: globTags.artistRaw, type: 'string' }]).flat(Infinity).filter((n) => isStringWeak(n));
									const uniqLibArtists = new Set(getHandleListTagsTyped(libItems, [{ name: globTags.artistRaw, type: 'string' }]).flat(Infinity).filter((n) => isStringWeak(n)));
									const uniqArtists = new Set(artists);
									const uniqArtistsCount = uniqArtists.size;
									const uniqLibArtistsCount = uniqLibArtists.size;
									const stats = calcStatistics(artists);
									report.push('Artists: ' + uniqArtistsCount + ' ' + _p(round(uniqArtistsCount / uniqLibArtistsCount * 100, 2) + '% from ' + uniqLibArtistsCount + ' total library artists'));
									report.push('');
									const totalTop5 = stats.max10Points.slice(0, 5).reduce((acc, p) => acc + p.val, 0);
									report.push('Top artists (by # tracks): ' + totalTop5 + ' ' + _p(round(totalTop5 / trackCount * 100, 2) + '% of tracks'));
									stats.max10Points.slice(0, 5).forEach((p) => {
										report.push('\t' + p.key + ' - ' + p.val + ' ' + _p(round(p.val / trackCount * 100, 2) + '% of tracks'));
									});
								}
								report.push('');
								{ // Tracks
									report.push('Tracks: ' + trackCount + ' ' + _p(round(trackCount / libCount * 100, 2) + '% from ' + libCount + ' total library tracks'));
									const subQuery = [
										{ name: 'With rating >= 3: ', query: globQuery.ratingGr2 },
										{ name: 'With rating >= 4: ', query: globQuery.ratingGr3 },
										{ name: 'With rating  = 5: ', query: globTags.rating + ' IS 5' },
										{ name: 'Loved:\t\t  ', query: globQuery.loved },
										{ name: 'Hated:\t\t  ', query: globQuery.hated }
									];
									report.push(...subQuery.map((q) => '\t' + q.name + fb.GetQueryItems(handleList, q.query).Count));
								}
								report.push('');
								{ // Dates
									const date = getHandleListTagsTyped(handleList, [{ name: globTags.date, type: 'number' }]).flat(Infinity).filter(Boolean);
									const stats = calcStatistics(date);
									report.push('Min/Max date: ' + stats.min + '/' + stats.max);
									report.push('Most frequent date: ' + Math.round(stats.mode.value) + ' ' + _p(stats.mode.frequency + ' times'));
									report.push('Average date: ' + Math.round(stats.mean));
									report.push('Median date: ' + Math.round(stats.median));
									report.push('Standard deviation: ' + Math.round(stats.sigma) + ' years');
									report.push('Range date (75%-95%): ' + stats.popRange.universal['75%'].map(Math.round).join(' - '));
								}
							}
							report.push('');
							{ // Data from descriptors
								header('Graph info:');
								const data = clone(music_graph_descriptors.nodeList.get(music_graph_descriptors.getSubstitution(tagVal)));
								const nodeSet = music_graph_descriptors.getNodeSet(false);
								for (let key in data) {
									switch (key) { // NOSONAR
										case 'region': {
											if (!data[key] || Array.isArray(data[key]) && !data[key].length) { data[key] = 'All'; }
											else { data[key] = JSON.stringify(data[key], null, '\t'); }
											break;
										}
										default: {
											if (!data[key] || Array.isArray(data[key]) && !data[key].length) { data[key] = '-'; }
											else if (Array.isArray(data[key])) {
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
							}
							// report
							fb.ShowPopupMessage(report.join('\n'), 'Graph info');
						}, flags: (tagVal ? MF_STRING : MF_GRAYED) | (!bSingle && i % 8 === 0 ? MF_MENUBREAK : MF_STRING), data: { bDynamicMenu: true }
					});
				});
			}
		});
	}
	return menu;
}