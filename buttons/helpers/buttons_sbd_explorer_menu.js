'use strict';
//29/09/25

/* exported graphInfoMenu */

/* global VK_SHIFT:readable, VK_CONTROL:readable, MF_GRAYED:readable, globQuery:readable, globTags:readable, clone:readable, MF_STRING:readable, MF_MENUBREAK:readable, MK_SHIFT:readable */
include('..\\..\\helpers\\buttons_xxx.js');
/* global showButtonReadme:readable  */
include('..\\..\\helpers\\helpers_xxx_input.js');
/* global Input:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global _p:readable, capitalize:readable, capitalizeAll:readable, isStringWeak: readable, round:readable  */
include('..\\..\\helpers\\helpers_xxx_playlists.js');
/* global sendToPlaylist: readable */
include('..\\..\\helpers\\helpers_xxx_tags.js');
/* global queryJoin:readable, getHandleListTagsTyped:readable, queryCombinations:readable */
include('..\\..\\helpers\\buttons_xxx_menu.js');
/* global _menu:readable */
include('..\\..\\helpers\\helpers_xxx_statistics.js');
/* global calcStatistics:readable */
include('..\\..\\main\\search_by_distance\\search_by_distance.js'); // Load after buttons_xxx.js so properties are only set once
/* global sbd:readable, music_graph_descriptors:readable */
include('..\\..\\main\\search_by_distance\\search_by_distance_extra.js');
include('..\\..\\main\\search_by_distance\\search_by_distance_genres.js');
/* global getNearestGenreStylesV2:readable, calcMeanDistanceV2:readable */
include('..\\..\\main\\search_by_distance\\search_by_distance_culture.js');
/* global getZoneGraphFilter:readable */

function graphInfoMenu() {
	// Menu
	const menu = new _menu();
	// Get current selection and metadata
	const sel = this.sel || plman.ActivePlaylist !== -1 ? fb.GetFocusItem(true) : null;
	const info = sel ? sel.GetFileInfo() : null;
	const entries = JSON.parse(this.buttonsProperties.entries[1]);
	entries.push({ name: 'sep' });
	entries.push({ name: 'By value...', tf: entries.map((tag) => tag.tf || []).flat(Infinity).filter(Boolean), bInput: true });
	entries.forEach((tag) => {
		if (menu.isNotSeparator(tag)) {
			tag.val = [];
			tag.valSet = new Set();
		}
	});
	if (info) {
		entries.forEach((tag) => {
			if (menu.isNotSeparator(tag) && !tag.bInput) {
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
			}
		});
	}
	// Helper
	const inputEntry = () => {
		let input = Input.string('string', '', 'Input a genre/style:\n\nInput will be capitalized before processing (respecting upper case chars). For ex: NRG -> NRG | alt. rock -> Alt. Rock', 'Genre explorer', 'Rock');
		if (input === null) { return null; }
		const asciiRegEx = [[/[\u0300-\u036f]/g, ''], [/\u0142/g, 'l']];
		const asciify = (node) => {
			let asciiNode = node.normalize('NFD');
			asciiRegEx.forEach((rgex) => { asciiNode = asciiNode.replace(rgex[0], rgex[1]); });
			return asciiNode;
		};
		return capitalizeAll(asciify(input), /([\s-])/gi, false, true)
			.replace(/\b(NRG|IDM|EDM|UK|XL|AM|L\.A\. )\b/gi, (s) => s.toUpperCase()) // Replace special values
			.replace(/\b(ar)\b/gi, (s) => s.toLowerCase());
	};
	// Menu
	{ // Stats
		const menuName = menu.newMenu('Library statistics');
		menu.newEntry({ menuName, entryText: 'Library and Graph stats:', flags: MF_GRAYED });
		menu.newSeparator(menuName);
		entries.forEach((entry) => {
			// Add separators
			if (menu.isSeparator(entry)) {
				menu.newSeparator(menuName);
			} else {
				// Create names for all entries
				entry.name = entry.name.length > 40 ? entry.name.substring(0, 40) + ' ...' : entry.name;
				// Entries
				const bSingle = entry.valSet.size <= 1;
				const subMenuName = bSingle ? menuName : menu.newMenu(entry.name, menuName);
				if (entry.valSet.size === 0) { entry.valSet.add(''); }
				[...entry.valSet].sort((a, b) => a.localeCompare(b, void (0), { sensitivity: 'base' })).forEach((tagVal, i) => {
					menu.newEntry({
						menuName: subMenuName,
						entryText: bSingle
							? entry.name + (entry.bInput ? '' : '\t[' + (tagVal.cut(25) || (sel ? 'no tag' : 'no sel')) + ']')
							: tagVal.cut(25),
						func: () => {
							if (entry.bInput) {
								tagVal = inputEntry();
								if (tagVal === null) { return; }
							}
							// report
							const report = [];
							const header = (title) => {
								const len = title.length;
								report.push('-'.repeat(len));
								report.push(title);
								report.push('-'.repeat(len));
							};
							header('-------------------------------- ' + tagVal + ' --------------------------------');
							report.push('');
							// Data from library
							const query = queryJoin(entry.tf.map((tag) => tag + ' IS ' + tagVal.toLowerCase()), 'OR');
							const libItems = fb.GetLibraryItems();
							const handleList = fb.GetQueryItems(libItems, query);
							const node = music_graph_descriptors.getSubstitution(tagVal);
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
									if (!trackCount) { stats.max10Points = []; } // Add missing stats for wrong input
									report.push('Artists: ' + uniqArtistsCount + ' ' + _p(round(uniqArtistsCount / uniqLibArtistsCount * 100, 2) + '% from ' + uniqLibArtistsCount + ' total library artists'));
									report.push('');
									const totalTop5 = stats.max10Points.slice(0, 5).reduce((acc, p) => acc + p.val, 0);
									report.push('Top artists (by # tracks): ' + totalTop5 + ' ' + _p(round(totalTop5 / trackCount * 100, 2) || 0 + '% of tracks'));
									stats.max10Points.slice(0, 5).forEach((p) => {
										const artistTracks = fb.GetQueryItems(
											libItems,
											queryJoin(queryCombinations([p.key], [...new Set([globTags.artistRaw, 'ARTIST', '%ALBUM ARTIST%'])], 'AND'), 'OR')
										);
										report.push('\t' + p.key + ' - ' + p.val + ' ' + _p(round(p.val / trackCount * 100, 2) || 0 + '% of tracks | ' + round(p.val / artistTracks.Count * 100, 2) + '% of artist\'s tracks'));
									});
								}
								report.push('');
								{ // Tracks
									report.push('Tracks: ' + trackCount + ' ' + _p(round(trackCount / libCount * 100, 2) + '% from ' + libCount + ' total library tracks'));
									const subQuery = [
										{ name: 'Rated ≥3: ', query: globQuery.ratingGr2 },
										{ name: 'Rated ≥4: ', query: globQuery.ratingGr3 },
										{ name: 'Rated =5: ', query: globTags.rating + ' IS 5' },
										{ name: 'Loved:\t  ', query: globQuery.loved },
										{ name: 'Hated:\t  ', query: globQuery.hated }
									];
									report.push(...subQuery.map((q) => '\t' + q.name + fb.GetQueryItems(handleList, q.query).Count));
								}
								report.push('');
								{ // Dates
									const date = getHandleListTagsTyped(handleList, [{ name: globTags.date, type: 'number' }]).flat(Infinity).filter(Boolean);
									const stats = calcStatistics(date);
									report.push('Min/Max date: ' + (trackCount ? stats.min + '/' + stats.max : '-/-'));
									report.push('Most frequent date: ' + (trackCount ? Math.round(stats.mode.value) + ' ' + _p(stats.mode.frequency + ' times') : '-'));
									report.push('Average date: ' + (trackCount ? Math.round(stats.mean) : '-'));
									report.push('Median date: ' + (trackCount ? Math.round(stats.median) : '-'));
									report.push('Standard deviation: ' + (trackCount ? Math.round(stats.sigma) + ' years' : ''));
									report.push('Range date (75%-95%): ' + (trackCount ? stats.popRange.universal['75%'].map(Math.round).join(' - ') : '-'));
								}
							}
							report.push('');
							let bFoundGraph = false;
							{ // Data from descriptors
								header('Genre explorer:');
								const data = clone(music_graph_descriptors.nodeList.get(node));
								if (data) {
									const nodeSet = music_graph_descriptors.getNodeSet(false);
									bFoundGraph = true;
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
										return capitalize(pair[0], true).split(/(?=[A-Z])/).join(' ') + ': ' + (Array.isArray(pair[1]) ? pair[1].join(', ') : pair[1]);
									}));
								} else {
									report.push('Genre/style not found on graph.');
								}
							}
							report.push('');
							{ // Near nodes
								header('Most similar genres:');
								if (bFoundGraph) {
									const similar = new Set(
										getNearestGenreStylesV2([node], music_graph_descriptors.cluster * 5, 5, sbd.allMusicGraph)
									).difference(
										new Set(music_graph_descriptors.replaceWithAlternativeTerms([node], true, true))
									);
									report.push([...similar].join(', '));
								} else {
									report.push('Genre/style not found on graph.');
								}
							}
							report.push('');
							{ // Genres from same regions
								header('Similar genres from region(s):');
								if (bFoundGraph) {
									const regionGenres = getZoneGraphFilter([node], 'region');
									const similarRegionGenres = [];
									regionGenres.forEach((g) => {
										if (calcMeanDistanceV2(sbd.allMusicGraph, [node], [g]) <= music_graph_descriptors.cluster * 5) {
											similarRegionGenres.push(g);
										};
									});
									report.push([...similarRegionGenres].join(', '));
								} else {
									report.push('Genre/style not found on graph.');
								}
							}
							// report
							fb.ShowPopupMessage(report.join('\n'), entry.name + ': ' + tagVal);
						}, flags: (tagVal || entry.bInput ? MF_STRING : MF_GRAYED) | (!bSingle && i % 8 === 0 && i ? MF_MENUBREAK : MF_STRING), data: { bDynamicMenu: true }
					});
				});
			}
		});
	}
	{ // Similar genres
		const menuName = menu.newMenu('Similar genres/styles');
		menu.newEntry({ menuName, entryText: 'Similar genres/styles:', flags: MF_GRAYED });
		menu.newSeparator(menuName);
		entries.forEach((entry) => {
			// Add separators
			if (menu.isSeparator(entry)) {
				menu.newSeparator(menuName);
			} else {
				// Create names for all entries
				entry.name = entry.name.length > 40 ? entry.name.substring(0, 40) + ' ...' : entry.name;
				// Entries
				const bSingle = entry.valSet.size <= 1;
				const subMenuName = bSingle ? menuName : menu.newMenu(entry.name, menuName);
				if (!bSingle) {
					menu.newEntry({ menuName: subMenuName, entryText: 'Search (Shift) / AutoPlaylist (Ctrl):', flags: MF_GRAYED });
					menu.newSeparator(subMenuName);
				}
				if (entry.valSet.size === 0) { entry.valSet.add(''); }
				[...entry.valSet].sort((a, b) => a.localeCompare(b, void (0), { sensitivity: 'base' })).forEach((tagVal, i) => {
					menu.newEntry({
						menuName: subMenuName,
						entryText: bSingle
							? entry.name + (entry.bInput ? '' : '\t[' + (tagVal.cut(25) || (sel ? 'no tag' : 'no sel')) + ']')
							: tagVal.cut(25),
						func: () => {
							if (entry.bInput) {
								tagVal = inputEntry();
								if (tagVal === null) { return; }
							}
							// Data from library
							const node = music_graph_descriptors.getSubstitution(tagVal);
							const playlistName = 'Near genres: ' + tagVal;
							const similar = new Set(
								getNearestGenreStylesV2([node], music_graph_descriptors.cluster * 5, 5, sbd.allMusicGraph)
							).difference(
								new Set(music_graph_descriptors.replaceWithAlternativeTerms([node], true, true))
							);
							if (!similar.size) { fb.ShowPopupMessage('No results found.\n\nThis may happen if the selected genre/style is so specific/narraw that there is nothing similar to it.', playlistName); return; }
							const query = queryJoin(queryCombinations([...similar], entries.map((e) => e.tf || []).flat(Infinity).filter(Boolean), 'OR'), 'OR') || '';
							const bShift = utils.IsKeyPressed(VK_SHIFT);
							const bCtrl = utils.IsKeyPressed(VK_CONTROL);
							if (bShift || bCtrl) {
								if (bShift && !bCtrl) { fb.ShowLibrarySearchUI(query); }
								else { plman.ActivePlaylist = plman.CreateAutoPlaylist(plman.PlaylistCount, playlistName, query); }
							} else {
								console.log('Query: ' + query);
								sendToPlaylist(fb.GetQueryItems(fb.GetLibraryItems(), query), playlistName);
							}
						}, flags: (tagVal || entry.bInput ? MF_STRING : MF_GRAYED) | (!bSingle && i % 8 === 0 && i ? MF_MENUBREAK : MF_STRING), data: { bDynamicMenu: true }
					});
				});
			}
		});
	}
	{ // Same region
		const menuName = menu.newMenu('Similar from region(s)');
		menu.newEntry({ menuName, entryText: 'Similar regional genre/styles:', flags: MF_GRAYED });
		menu.newSeparator(menuName);
		entries.forEach((entry) => {
			// Add separators
			if (menu.isSeparator(entry)) {
				menu.newSeparator(menuName);
			} else {
				// Create names for all entries
				entry.name = entry.name.length > 40 ? entry.name.substring(0, 40) + ' ...' : entry.name;
				// Entries
				const bSingle = entry.valSet.size <= 1;
				const subMenuName = bSingle ? menuName : menu.newMenu(entry.name, menuName);
				if (!bSingle) {
					menu.newEntry({ menuName: subMenuName, entryText: 'Search (Shift) / AutoPlaylist (Ctrl):', flags: MF_GRAYED });
					menu.newSeparator(subMenuName);
				}
				if (entry.valSet.size === 0) { entry.valSet.add(''); }
				[...entry.valSet].sort((a, b) => a.localeCompare(b, void (0), { sensitivity: 'base' })).forEach((tagVal, i) => {
					menu.newEntry({
						menuName: subMenuName,
						entryText: bSingle
							? entry.name + (entry.bInput ? '' : '\t[' + (tagVal.cut(25) || (sel ? 'no tag' : 'no sel')) + ']')
							: tagVal.cut(25),
						func: () => {
							if (entry.bInput) {
								tagVal = inputEntry();
								if (tagVal === null) { return; }
							}
							// Data from library
							const node = music_graph_descriptors.getSubstitution(tagVal);
							const playlistName = 'Similar genres from region: ' + tagVal;
							const regionGenres = getZoneGraphFilter([node], 'region');
							const similarRegionGenres = [];
							regionGenres.forEach((g) => {
								if (calcMeanDistanceV2(sbd.allMusicGraph, [node], [g]) <= music_graph_descriptors.cluster * 5) {
									similarRegionGenres.push(g);
								};
							});
							if (!similarRegionGenres.length) { fb.ShowPopupMessage('No results found.\n\nThis may happen if the selected genre/style is not associated to any specific region but has worldwide spread.', playlistName); return; }
							const query = queryJoin(queryCombinations(similarRegionGenres, entries.map((e) => e.tf || []).flat(Infinity).filter(Boolean), 'OR'), 'OR') || '';
							const bShift = utils.IsKeyPressed(VK_SHIFT);
							const bCtrl = utils.IsKeyPressed(VK_CONTROL);
							if (bShift || bCtrl) {
								if (bShift && !bCtrl) { fb.ShowLibrarySearchUI(query); }
								else { plman.ActivePlaylist = plman.CreateAutoPlaylist(plman.PlaylistCount, playlistName, query); }
							} else {
								console.log('Query: ' + query);
								sendToPlaylist(fb.GetQueryItems(fb.GetLibraryItems(), query), playlistName);
							}
						}, flags: (tagVal || entry.bInput ? MF_STRING : MF_GRAYED) | (!bSingle && i % 8 === 0 && i ? MF_MENUBREAK : MF_STRING), data: { bDynamicMenu: true }
					});
				});
			}
		});
	}
	{ // Influences
		const menuName = menu.newMenu('Genre/style influences');
		menu.newEntry({ menuName, entryText: 'Related genre/styles:', flags: MF_GRAYED });
		menu.newSeparator(menuName);
		entries.forEach((entry) => {
			// Add separators
			if (menu.isSeparator(entry)) {
				menu.newSeparator(menuName);
			} else {
				// Create names for all entries
				entry.name = entry.name.length > 40 ? entry.name.substring(0, 40) + ' ...' : entry.name;
				// Entries
				const bSingle = entry.valSet.size <= 1;
				const subMenuName = bSingle ? menuName : menu.newMenu(entry.name, menuName);
				if (!bSingle) {
					menu.newEntry({ menuName: subMenuName, entryText: 'Search (Shift) / AutoPlaylist (Ctrl):', flags: MF_GRAYED });
					menu.newSeparator(subMenuName);
				}
				if (entry.valSet.size === 0) { entry.valSet.add(''); }
				[...entry.valSet].sort((a, b) => a.localeCompare(b, void (0), { sensitivity: 'base' })).forEach((tagVal, i) => {
					menu.newEntry({
						menuName: subMenuName,
						entryText: bSingle
							? entry.name + (entry.bInput ? '' : '\t[' + (tagVal.cut(25) || (sel ? 'no tag' : 'no sel')) + ']')
							: tagVal.cut(25),
						func: () => {
							if (entry.bInput) {
								tagVal = inputEntry();
								if (tagVal === null) { return; }
							}
							// Data from library
							const node = music_graph_descriptors.getSubstitution(tagVal);
							const playlistName = 'Related genres: ' + tagVal;
							const data = music_graph_descriptors.nodeList.get(node);
							if (data) {
								const nodeSet = music_graph_descriptors.getNodeSet(false);
								const influences = [...(data.primaryOrigin || []), ...(data.secondaryOrigin || []), ...(data.weakSubstitution || [])];
								influences.forEach((sg) => nodeSet.has(sg) ? sg : music_graph_descriptors.replaceWithSubstitutionsReverse([sg])[0]);
								if (!influences.length) { fb.ShowPopupMessage('No results found.\n\nThis may happen if the selected genre/style doesn\'t have any specific originary or derivative form.', playlistName); return; }
								const query = queryJoin(queryCombinations(influences, entries.map((e) => e.tf || []).flat(Infinity).filter(Boolean), 'OR'), 'OR') || '';
								const bShift = utils.IsKeyPressed(VK_SHIFT);
								const bCtrl = utils.IsKeyPressed(VK_CONTROL);
								if (bShift || bCtrl) {
									if (bShift && !bCtrl) { fb.ShowLibrarySearchUI(query); }
									else { plman.ActivePlaylist = plman.CreateAutoPlaylist(plman.PlaylistCount, playlistName, query); }
								} else {
									console.log('Query: ' + query);
									sendToPlaylist(fb.GetQueryItems(fb.GetLibraryItems(), query), playlistName);
								}
							} else { fb.ShowPopupMessage('Genre/style not found on graph.', 'Genre explorer'); }
						}, flags: (tagVal || entry.bInput ? MF_STRING : MF_GRAYED) | (!bSingle && i % 8 === 0 && i ? MF_MENUBREAK : MF_STRING), data: { bDynamicMenu: true }
					});
				});
			}
		});
	}
	{ // Anti-Influences
		const menuName = menu.newMenu('Genre/style anti-influences');
		menu.newEntry({ menuName, entryText: 'Opposed genre/styles:', flags: MF_GRAYED });
		menu.newSeparator(menuName);
		entries.forEach((entry) => {
			// Add separators
			if (menu.isSeparator(entry)) {
				menu.newSeparator(menuName);
			} else {
				// Create names for all entries
				entry.name = entry.name.length > 40 ? entry.name.substring(0, 40) + ' ...' : entry.name;
				// Entries
				const bSingle = entry.valSet.size <= 1;
				const subMenuName = bSingle ? menuName : menu.newMenu(entry.name, menuName);
				if (!bSingle) {
					menu.newEntry({ menuName: subMenuName, entryText: 'Search (Shift) / AutoPlaylist (Ctrl):', flags: MF_GRAYED });
					menu.newSeparator(subMenuName);
				}
				if (entry.valSet.size === 0) { entry.valSet.add(''); }
				[...entry.valSet].sort((a, b) => a.localeCompare(b, void (0), { sensitivity: 'base' })).forEach((tagVal, i) => {
					menu.newEntry({
						menuName: subMenuName,
						entryText: bSingle
							? entry.name + (entry.bInput ? '' : '\t[' + (tagVal.cut(25) || (sel ? 'no tag' : 'no sel')) + ']')
							: tagVal.cut(25),
						func: () => {
							if (entry.bInput) {
								tagVal = inputEntry();
								if (tagVal === null) { return; }
							}
							// Data from library
							const node = music_graph_descriptors.getSubstitution(tagVal);
							const playlistName = 'Opposed genres: ' + tagVal;
							const data = music_graph_descriptors.nodeList.get(node);
							if (data) {
								const nodeSet = music_graph_descriptors.getNodeSet(false);
								const influences = [...(data.antiInfluence || [])];
								influences.forEach((sg) => nodeSet.has(sg) ? sg : music_graph_descriptors.replaceWithSubstitutionsReverse([sg])[0]);
								if (!influences.length) { fb.ShowPopupMessage('No results found.\n\nThis may happen if the selected genre/style doesn\'t have any specific anti-derivative form.', playlistName); return; }
								const query = queryJoin(queryCombinations(influences, entries.map((e) => e.tf || []).flat(Infinity).filter(Boolean), 'OR'), 'OR') || '';
								const bShift = utils.IsKeyPressed(VK_SHIFT);
								const bCtrl = utils.IsKeyPressed(VK_CONTROL);
								if (bShift || bCtrl) {
									if (bShift && !bCtrl) { fb.ShowLibrarySearchUI(query); }
									else { plman.ActivePlaylist = plman.CreateAutoPlaylist(plman.PlaylistCount, playlistName, query); }
								} else {
									console.log('Query: ' + query);
									sendToPlaylist(fb.GetQueryItems(fb.GetLibraryItems(), query), playlistName);
								}
							} else { fb.ShowPopupMessage('Genre/style not found on graph.', 'Genre explorer');}
						}, flags: (tagVal || entry.bInput ? MF_STRING : MF_GRAYED) | (!bSingle && i % 8 === 0 && i ? MF_MENUBREAK : MF_STRING), data: { bDynamicMenu: true }
					});
				});
			}
		});
	}
	menu.newSeparator();
	menu.newEntry({ entryText: 'Settings...', func: () => this.onClick(MK_SHIFT) });
	menu.newSeparator();
	menu.newEntry({ entryText: 'Open readme...', func: () => showButtonReadme('buttons_search_by_distance_genre_explorer.js') });
	return menu;
}