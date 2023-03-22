'use strict';
//21/03/23

include('..\\..\\helpers\\helpers_xxx_basic_js.js');
include('..\\..\\helpers\\helpers_xxx_prototypes.js');

/*	
	Scatter by tags
	-----------------------------------
	Reorders selection to avoid consecutive tracks with the same 'tagValue' on tags ('tagName').
	Can be used to scatter instrumental tracks, an specific genre, etc.
	Output is sent to active playlist or as a handle list by setting 'bSendToActivePls'.
*/ 

// For an specific value (tagValue) for a given tag (tagName)
function scatterByTags({
							tagName = 'GENRE,STYLE',
							tagValue = 'instrumental',
							selItems = plman.ActivePlaylist !== -1 ? plman.GetPlaylistSelectedItems(plman.ActivePlaylist) : null,
							bSendToActivePls = true
							} = {}) {
	// Safety checks
	if (!tagName.length) {return;}
	if (!tagValue.length) {return;}
	if (!selItems || selItems.Count <= 2) {return;}
	// Convert input
	const totalTracks = selItems.Count;
	tagName = tagName.split(/;|,/g);
	tagValue = tagValue.toLowerCase().split(/;|,/g);
	const tagValueSet = new Set(tagValue);
	let selItemsArray = selItems.Clone().Convert();
	// Get tag values and find tag value
	const tagValues = getTagsValuesV3(selItems, tagName, true);
	let newOrder = [];
	for (let i = 0; i < totalTracks; i++) {
		const tagValue_i = tagValues[i].filter(Boolean).map((item) => {return item.toLowerCase();});
		const tagSet_i = new Set(tagValue_i);
		if (tagSet_i.intersectionSize(tagValueSet)) { // Any match, then add to reorder list
			newOrder.push(i);
		}
	}
	// Reorder
	const toMoveTracks = newOrder.length;
	let scatterInterval = toMoveTracks ? totalTracks / toMoveTracks : 0;
	if (scatterInterval >= 2) { // Lower value means we can not uniformly scatter instrumental tracks, better left it 'as is'
		scatterInterval = Math.round(totalTracks / toMoveTracks);
		let removed = [];
		[...newOrder].reverse().forEach((index) => {
			removed.push(...selItemsArray.splice(index, 1));
		});
		removed.reverse();
		removed.forEach((handle, index) => {
			const i_scatterInterval = index * scatterInterval;
			let j = Math.floor(Math.random() * (scatterInterval - 1)) + i_scatterInterval;
			if (j === 0 && scatterInterval > 2) {j = 1;} // Don't put first track as instrumental if possible
			selItemsArray.splice(j, 0, handle); // (at, 0, item)
		});
	} else {return selItems;}
	// And output
	selItemsArray = new FbMetadbHandleList(selItemsArray);
	if (bSendToActivePls) {
		// 'Hack' Inserts on focus (may be at any place of selection), but then removes the original selection, 
		// so inserted tracks get sent to the right position. Only works for contiguous selections!
		const focusIdx = plman.GetPlaylistFocusItemIndex(plman.ActivePlaylist);
		plman.UndoBackup(plman.ActivePlaylist);
		plman.InsertPlaylistItems(plman.ActivePlaylist, plman.GetPlaylistFocusItemIndex(plman.ActivePlaylist), selItemsArray);
		plman.RemovePlaylistSelection(plman.ActivePlaylist); 
		// Try to restore prev. selection
		let idx = [];
		if (focusIdx === 0) {
			idx = range(0, totalTracks - 1, 1);
		} else {
			const clone = selItemsArray.Clone();
			clone.Sort();
			const plsItems = plman.GetPlaylistItems(plman.ActivePlaylist).Convert();
			const end = focusIdx - totalTracks + 1;
			if (end >= 0) {
				const plsItemsBelow = new FbMetadbHandleList(plsItems.slice(end, end + totalTracks));
				plsItemsBelow.Sort();
				plsItemsBelow.MakeIntersection(clone);
				if	(plsItemsBelow.Count === totalTracks) {idx = range(end, focusIdx, 1);}
			}
			if (end < 0 || !idx.lenth) {
				const plsItemsOver = new FbMetadbHandleList(plsItems.slice(focusIdx, focusIdx + totalTracks));
				plsItemsOver.Sort();
				plsItemsOver.MakeIntersection(clone);
				if	(plsItemsOver.Count === totalTracks) {idx = range(focusIdx, focusIdx + totalTracks - 1, 1);}
			}
		}
		if (idx.length === totalTracks) {
			plman.SetPlaylistSelection(plman.ActivePlaylist, idx, true);
			plman.SetPlaylistFocusItem(plman.ActivePlaylist, focusIdx);
		}
		console.log('Selection scattered by tag(s) \'' + tagValue.join(',') + '\' (' + tagName.join(', ') + ') on playlist: ' + plman.GetPlaylistName(plman.ActivePlaylist));
	}
	return selItemsArray;
}

// Does the same but for any value for a given tag
function intercalateByTags({
							tagName = 'ARTIST',
							selItems = plman.ActivePlaylist !== -1 ? plman.GetPlaylistSelectedItems(plman.ActivePlaylist) : null,
							bSendToActivePls = true,
							} = {}) {
	// Safety checks
	if (!tagName.length) {return;}
	if (!selItems || selItems.Count <= 2) {return;}
	// Convert input
	const totalTracks = selItems.Count;
	tagName = tagName.split(/;|,/g);
	let selItemsArray = selItems.Convert();
	let selItemsArrayOut = [];
	// Get tag values and find tag value
	// Split elements by equal value, by reverse order
	const tagValues = getTagsValuesV3(selItems, tagName, true).map((item) => {return item.filter(Boolean).sort().map((item) => {return item.toLowerCase();}).join(',');});
	let valMap = new ReverseIterableMap();
	for (let i = totalTracks - 1; i >= 0; i--) {
		const val = tagValues[i];
		if (valMap.has(val)) {
			valMap.get(val).push(i);
		} else {
			valMap.set(val, [i]);
		}
	}
	// Intercalate them by reverse order again
	while (valMap.size) {
		let toDelete = [];
		valMap.forEachReverse((value, key) => {
			selItemsArrayOut.push(selItemsArray[value.pop()]);
			if (!value.length) {toDelete.push(key);}
		});
		toDelete.forEach((key) => {valMap.delete(key);});
	}
	// And output
	selItemsArray = new FbMetadbHandleList(selItemsArrayOut);
	if (bSendToActivePls) {
		// 'Hack' Inserts on focus (may be at any place of selection), but then removes the original selection, 
		// so inserted tracks get sent to the right position. Only works for contiguous selections!
		const focusIdx = plman.GetPlaylistFocusItemIndex(plman.ActivePlaylist);
		plman.UndoBackup(plman.ActivePlaylist);
		plman.InsertPlaylistItems(plman.ActivePlaylist, plman.GetPlaylistFocusItemIndex(plman.ActivePlaylist), selItemsArray);
		plman.RemovePlaylistSelection(plman.ActivePlaylist); 
		// Try to restore prev. selection
		let idx = [];
		if (focusIdx === 0) {
			idx = range(0, totalTracks - 1, 1);
		} else {
			const clone = selItemsArray.Clone();
			clone.Sort();
			const plsItems = plman.GetPlaylistItems(plman.ActivePlaylist).Convert();
			const end = focusIdx - totalTracks + 1;
			if (end >= 0) {
				const plsItemsBelow = new FbMetadbHandleList(plsItems.slice(end, end + totalTracks));
				plsItemsBelow.Sort();
				plsItemsBelow.MakeIntersection(clone);
				if	(plsItemsBelow.Count === totalTracks) {idx = range(end, focusIdx, 1);}
			}
			if (end < 0 || !idx.lenth) {
				const plsItemsOver = new FbMetadbHandleList(plsItems.slice(focusIdx, focusIdx + totalTracks));
				plsItemsOver.Sort();
				plsItemsOver.MakeIntersection(clone);
				if	(plsItemsOver.Count === totalTracks) {idx = range(focusIdx, focusIdx + totalTracks - 1, 1);}
			}
		}
		if (idx.length === totalTracks) {
			plman.SetPlaylistSelection(plman.ActivePlaylist, idx, true);
			plman.SetPlaylistFocusItem(plman.ActivePlaylist, focusIdx);
		}
		console.log('Selection scattered by tag(s) \'' + tagName.join(',') + '\' on playlist: ' + plman.GetPlaylistName(plman.ActivePlaylist));
	}
	return selItemsArray;
}

// Applies semi-random patterns, not allowing the same artist 2 times in a row, while not falling into strict intercalation
// Based on: https://engineering.atspotify.com/2014/02/how-to-shuffle-songs/
// Note for some proportions there is an exact solution, and that's used instead of relying on the random method
// Beware it returns null when items are <= 2. Just reuse original list in such case
function shuffleByTags({
		tagName = ['ARTIST'],
		selItems = plman.ActivePlaylist !== -1 ? plman.GetPlaylistSelectedItems(plman.ActivePlaylist) : null,
		bSendToActivePls = true,
		data = {handleArray: [], dataArray: [], tagsArray: []}, // Shallow copies are made
		bAdvancedShuffle = true, // Tries to scatter instrumental, live tracks, ...
		bDebug = false
	} = {}) {
	// Safety checks
	const dataHandleLen = data && data.handleArray ? data.handleArray.length : 0;
	const dataTagsLen = data && data.tagsArray ? data.tagsArray.length : 0;
	const dataLen = data && data.dataArray ? data.dataArray.length : null;
	const itemsCount = selItems ? selItems.Count : 0;
	if (dataHandleLen <= 2 && itemsCount <= 2) {console.log('shuffleByTags: not enough items.'); return null;}
	if (!Array.isArray(tagName) || !tagName.length || (dataTagsLen !== dataHandleLen && dataTagsLen !== itemsCount)) {console.log('shuffleByTags: wrong arguments.'); return null;}
	if (dataLen && dataLen !== dataHandleLen && dataLen !== itemsCount) {console.log('shuffleByTags: data length does not match items count.'); return null;}
	// Convert input and shuffle
	const totalTracks = dataHandleLen || itemsCount;
	let dataArray = dataLen ? [...data.dataArray] : null;
	let selItemsArray = dataHandleLen 
			? [...data.handleArray]
			: selItems.Convert();
	if (dataArray) {Array.shuffle(selItemsArray, dataArray);} // Shuffle both at the same time
	else {selItemsArray.shuffle();}
	let selItemsClone = dataTagsLen 
		? null 
		: new FbMetadbHandleList(selItemsArray);
	let selItemsArrayOut = [];
	let tagValuesOut = [];
	let dataValuesOut = [];
	// Get tag values and find tag value
	// Split elements by equal value, by reverse order
	const tagValues = (selItemsClone 
			? getTagsValuesV3(selItemsClone, tagName, true)
			: [...data.tagsArray]
		).map((item) => {return item.filter(Boolean).sort().map((item) => {return item.toLowerCase();}).join(',');});
	let valMap = new ReverseIterableMap();
	for (let i = totalTracks - 1; i >= 0; i--) {
		const val = tagValues[i];
		if (valMap.has(val)) {
			valMap.get(val).push(i);
		} else {
			valMap.set(val, [i]);
		}
	}
	// Calculate distribution
	const size = valMap.size;
	const distMap = new ReverseIterableMap();
	let bSolved = false, solution = '';
	valMap.forEach((value, key) => {
		const total = value.length;
		if ((totalTracks - total) === (total - 1)) {bSolved = true; solution = key;} // Only 1 exact solution intercalating tracks
		if (bSolved) {return;}
		const dist = totalTracks / total;
		const offset = bSolved ? 0: Math.random() * (totalTracks - total) / total;
		distMap.set(key, {dist, total, offset});
	})
	// Calculate timeline
	let timeLine = [];
	if (bSolved) {
		const keys = [...tagValues].filter((key) => {return key !== solution;});
		timeLine = Array(totalTracks).fill(null).map((val, i) => {
			return {pos: i, key: i % 2 === 0 ? solution : keys.splice(Math.floor(Math.random() * keys.length), 1)[0]};
		});
	} else {
		const timeLineMap = new ReverseIterableMap();
		distMap.forEach((value, key) => {
			const line = [];
			line.push({pos: value.offset, key});
			for (let i = 1; i < value.total; i++) { // Apply a random shift by only a 33% of the space between consecutive artist's tracks
				line.push({pos: value.offset + value.dist * i + (value.total > 1 ? ((Math.random() * 2 - 1) * Math.random() * (value.dist - 1) * 0.33) : 0), key});
			}
			timeLineMap.set(key, line);
		})
		timeLine = [...timeLineMap.values()].flat(Infinity).sort((a,b) => {return a.pos - b.pos;});
		// Double check there are no consecutive artist's tracks due to random shifting (mostly for value.dist ~ 3)
		for (let i = 1; i < totalTracks - 2; i++) {
			if (timeLine[i].key === timeLine[i + 1].key) { // This ensures previous values did not match
				[timeLine[i - 1], timeLine[i]] = [timeLine[i], timeLine[i - 1]];
			}
		}
	}
	timeLine.forEach((track) => {
		const key = track.key;
		const tracks = valMap.get(key);
		const tracksNum = tracks.length;
		// Select a random track with chosen value
		const n = Math.floor(Math.random() * tracksNum);
		const index = tracks.splice(n, 1)[0];
		selItemsArrayOut.push(selItemsArray[index]);
		tagValuesOut.push(tagValues[index]);
		if (dataArray) {dataValuesOut.push(dataArray[index]);}
		// Delete empty values
		if ((tracksNum - 1) === 0) {
			valMap.delete(key); 
		}
	});
	// Swap items position when some specific conditions are met, applied over the previous pattern
	if (bAdvancedShuffle) {
		const selItemsList = new FbMetadbHandleList(selItemsArrayOut)
		const conditions = {
			instrumental: {tags: ['GENRE', 'STYLE', 'FOLKSONOMY', 'LANGUAGE'], val: [['instrumental'], ['instrumental'], ['instrumental'], ['zxx']], bPrev: true},
			live: {tags: ['GENRE', 'STYLE', 'FOLKSONOMY'], val: [['live'], ['live'], ['live']], bPrev: false},
			vocal: {tags: ['GENRE', 'STYLE', 'FOLKSONOMY'], val: [['female vocal'], ['female vocal'], ['female vocal']], bPrev: false},
		};
		// Retrieve tags and reuse whenever it's possible
		const types = Object.keys(conditions);
		const tags = {};
		for (let type of types) {
			conditions[type].val = conditions[type].val
				.map((tagArr) => new Set(tagArr.map((t) => t.toLowerCase())));
			const missingTags = new Set(conditions[type].tags);
			for (let tag of conditions[type].tags) {
				if (tags.hasOwnProperty(tag)) {
					missingTags.delete(tag);
				}
			}
			const newTags = missingTags.size 
				? getTagsValuesV4(selItemsList, [...missingTags])
					.map((tagArr) => tagArr.map(
						(tagVal) => new Set(tagVal.filter(Boolean).map((t) => t.toLowerCase()))
					))
					.reverse()
				: null;
			conditions[type].handleVal = [];
			for (let tag of conditions[type].tags) {
				if (missingTags.has(tag)) {
					const newTag = newTags.pop();
					conditions[type].handleVal.push(newTag);
					tags[tag] = newTag;
				} else {
					conditions[type].handleVal.push(tags[tag]);
				}
			}
		}
		for (let i = 0; i < totalTracks; i++) {
			const swap = Object.fromEntries(types.map((t) => [t, false]));
			// Find which conditions require track swapping
			for (let type of types) {
				const condition = conditions[type];
				const bIsTrue = condition.handleVal.some((tag, k) => tag[i].intersectionSize(condition.val[k]) !== 0);
				if (condition.bPrev && bIsTrue) {
					swap[type] = true;
				} else {
					swap[type] = false;
					condition.bPrev = bIsTrue;
				}
			}
			// Apply by priority
			if (types.some((type) => swap[type])) {
				let indexes = range(i + 1, totalTracks - 1, 1);
				let bDone = false;
				for (let type of types) {
					const condition = conditions[type];
					const bSwap = swap[type];
					if (bSwap) {
						const currKey = tagValuesOut[i];
						const newIndexes = indexes.filter((j) => {
							const newKey = tagValuesOut[j];
							if (currKey === newKey || distMap.get(newKey).total === 1) { // Swap with tracks whose keys appear once or matching current one
								if (condition.handleVal.every((tag, k) => tag[j].intersectionSize(condition.val[k]) === 0)) {
									return true;
								}
							}
							return false;
						});
						if (newIndexes.length) {indexes = newIndexes; bDone = true;}
						else {break;}
					}
				}
				// If there are matches, check conditions over nearest tracks
				if (bDone && indexes.length) {
					indexes.shuffle();
					while (indexes.length) {
						const j = indexes.pop();
						// Previous and next track must not match any of the conditions of the current track
						const currentConditions = {from: {}, to: {}};
						const nextConditions = {from: {}, to: {}};
						const prevConditions = {from: {}, to: {}};
						for (let type of types) {
							const condition = conditions[type];
							currentConditions.from[type] = conditions[type].bPrev;
							if (currentConditions.from[type]) {
								nextConditions.to[type] = condition.handleVal.every((tag, k) => tag[j - 1].intersectionSize(condition.val[k]) === 0);
								prevConditions.to[type] = j + 1 < totalTracks ? condition.handleVal.every((tag, k) => tag[j + 1].intersectionSize(condition.val[k]) === 0) : true;
							}
							currentConditions.to[type] = condition.handleVal.some((tag, k) => tag[j].intersectionSize(condition.val[k]) !== 0);
							if (currentConditions.to[type]) {
								nextConditions.from[type] = (i - 1) > 0 ? condition.handleVal.every((tag, k) => tag[i - 1].intersectionSize(condition.val[k]) === 0) : true;
								prevConditions.from[type] = (i + 1) < j ? condition.handleVal.every((tag, k) => tag[i + 1].intersectionSize(condition.val[k]) === 0) : currentConditions.to[type];
							}
						}
						const prevFrom = Object.values(prevConditions.from).every(Boolean);
						const nextFrom = Object.values(nextConditions.from).every(Boolean);
						const prevTo = Object.values(prevConditions.to).every(Boolean);
						const nextTo = Object.values(nextConditions.to).every(Boolean);
						if (prevFrom && nextFrom && prevTo && nextTo) {
							[tagValuesOut[i], tagValuesOut[j]] = [tagValuesOut[j], tagValuesOut[i]];
							[dataValuesOut[i], dataValuesOut[j]] = [dataValuesOut[j], dataValuesOut[i]];
							[selItemsArrayOut[i], selItemsArrayOut[j]] = [selItemsArrayOut[j], selItemsArrayOut[i]];
							for (let type of types) {
								const condition = conditions[type];
								condition.handleVal.forEach((tag) => [tag[i], tag[j]] = [tag[j], tag[i]]);
								condition.bPrev = currentConditions.to[type];
							}
							if (bDebug) {console.log(swap, i + 1, '->', j + 1);}
							break;
						}
					}
				}
			}
		}
	}
	// And output
	const selItemsList = new FbMetadbHandleList(selItemsArrayOut);
	if (bSendToActivePls) {
		// 'Hack' Inserts on focus (may be at any place of selection), but then removes the original selection, 
		// so inserted tracks get sent to the right position. Only works for contiguous selections!
		const focusIdx = plman.GetPlaylistFocusItemIndex(plman.ActivePlaylist);
		plman.UndoBackup(plman.ActivePlaylist);
		plman.InsertPlaylistItems(plman.ActivePlaylist, plman.GetPlaylistFocusItemIndex(plman.ActivePlaylist), selItemsList);
		plman.RemovePlaylistSelection(plman.ActivePlaylist);
		// Try to restore prev. selection
		let idx = [];
		if (focusIdx === 0) {
			idx = range(0, totalTracks - 1, 1);
		} else {
			const clone = selItemsList.Clone();
			clone.Sort();
			const plsItems = plman.GetPlaylistItems(plman.ActivePlaylist).Convert();
			const end = focusIdx - totalTracks + 1;
			if (end >= 0) {
				const plsItemsBelow = new FbMetadbHandleList(plsItems.slice(end, end + totalTracks));
				plsItemsBelow.Sort();
				plsItemsBelow.MakeIntersection(clone);
				if	(plsItemsBelow.Count === totalTracks) {idx = range(end, focusIdx, 1);}
			}
			if (end < 0 || !idx.lenth) {
				const plsItemsOver = new FbMetadbHandleList(plsItems.slice(focusIdx, focusIdx + totalTracks));
				plsItemsOver.Sort();
				plsItemsOver.MakeIntersection(clone);
				if	(plsItemsOver.Count === totalTracks) {idx = range(focusIdx, focusIdx + totalTracks - 1, 1);}
			}
		}
		if (idx.length === totalTracks) {
			plman.SetPlaylistSelection(plman.ActivePlaylist, idx, true);
			plman.SetPlaylistFocusItem(plman.ActivePlaylist, focusIdx);
		}
		console.log('Selection scattered by tag(s) \'' + tagName.join(',') + '\' on playlist: ' + plman.GetPlaylistName(plman.ActivePlaylist));
	}
	return {handleList: selItemsList, handleArray: selItemsArrayOut, dataArray: dataValuesOut, tagsArray: tagValuesOut};
}