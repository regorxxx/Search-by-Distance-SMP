'use strict';
//19/02/24

/* exported scatterByTags, intercalateByTags, shuffleByTags */

include('..\\..\\helpers\\helpers_xxx.js');
/* global isEnhPlayCount:readable, isPlayCount:readable */
include('..\\..\\helpers\\helpers_xxx_basic_js.js');
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global range:readable, _p:readable, ReverseIterableMap:readable */
include('..\\..\\helpers\\helpers_xxx_tags.js');
/* global getHandleListTags:readable, getHandleListTagsV2:readable */

/*
	Scatter by tags
	-----------------------------------
	Reorders selection to avoid consecutive tracks with the same 'tagValue' on tags ('tagName').
	Can be used to scatter instrumental tracks, an specific genre, etc.
	Output is sent to active playlist or as a handle list by setting 'bSendToActivePls'.
*/

/**
 * Scatters a handleList for an specific tag value in selected tags.
 *
 * @function
 * @name scatterByTags
 * @kind function
 * @param {{ tagName?: string tagValue?: string selItems?: FbMetadbHandleList bSendToActivePls?: boolean }} { tagName, tagValue, selItems, bSendToActivePls }?
 * @returns {FbMetadbHandleList|null}
 */
function scatterByTags({
	tagName = 'GENRE,STYLE',
	tagValue = 'instrumental',
	selItems = plman.ActivePlaylist !== -1 ? plman.GetPlaylistSelectedItems(plman.ActivePlaylist) : null,
	bSendToActivePls = true
} = {}) {
	// Safety checks
	if (!tagName.length) { return null; }
	if (!tagValue.length) { return null; }
	if (!selItems || selItems.Count <= 2) { return null; }
	// Convert input
	const totalTracks = selItems.Count;
	tagName = tagName.split(/[;,]/g);
	tagValue = tagValue.toLowerCase().split(/[;,]/g);
	const tagValueSet = new Set(tagValue);
	let selItemsArray = selItems.Clone().Convert();
	// Get tag values and find tag value
	const tagValues = getHandleListTags(selItems, tagName, { bMerged: true });
	let newOrder = [];
	for (let i = 0; i < totalTracks; i++) {
		const tagValue_i = tagValues[i].filter(Boolean).map((item) => { return item.toLowerCase(); });
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
			if (j === 0 && scatterInterval > 2) { j = 1; } // Don't put first track as instrumental if possible
			selItemsArray.splice(j, 0, handle); // (at, 0, item)
		});
	} else { return selItems; }
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
				if (plsItemsBelow.Count === totalTracks) { idx = range(end, focusIdx, 1); }
			}
			if (end < 0 || !idx.lenth) {
				const plsItemsOver = new FbMetadbHandleList(plsItems.slice(focusIdx, focusIdx + totalTracks));
				plsItemsOver.Sort();
				plsItemsOver.MakeIntersection(clone);
				if (plsItemsOver.Count === totalTracks) { idx = range(focusIdx, focusIdx + totalTracks - 1, 1); }
			}
		}
		if (idx.length === totalTracks) {
			plman.SetPlaylistSelection(plman.ActivePlaylist, idx, true);
			plman.SetPlaylistFocusItem(plman.ActivePlaylist, focusIdx);
		}
		console.log('Selection scattered by tag(s) \'' + tagValue.join(', ') + '\' (' + tagName.join(', ') + ') on playlist: ' + plman.GetPlaylistName(plman.ActivePlaylist));
	}
	return selItemsArray;
}

/**
 * Scatters a handleList for any repeated value in selected tags.
 *
 * @function
 * @name intercalateByTags
 * @kind function
 * @param {{ tagName?: string selItems?: FbMetadbHandleList bSendToActivePls?: boolean }} { tagName, selItems, bSendToActivePls }?
 * @returns {FbMetadbHandleList|null}
 */
function intercalateByTags({
	tagName = 'ALBUM ARTIST',
	selItems = plman.ActivePlaylist !== -1 ? plman.GetPlaylistSelectedItems(plman.ActivePlaylist) : null,
	bSendToActivePls = true,
} = {}) {
	// Safety checks
	if (!tagName.length) { return null; }
	if (!selItems || selItems.Count <= 2) { return null; }
	// Convert input
	const totalTracks = selItems.Count;
	tagName = tagName.split(/[;,]/g);
	let selItemsArray = selItems.Convert();
	let selItemsArrayOut = [];
	// Get tag values and find tag value
	// Split elements by equal value, by reverse order
	const tagValues = getHandleListTags(selItems, tagName, { bMerged: true }).map((item) => { return item.filter(Boolean).sort().map((item) => { return item.toLowerCase(); }).join(','); });
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
			if (!value.length) { toDelete.push(key); }
		});
		toDelete.forEach((key) => { valMap.delete(key); });
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
				if (plsItemsBelow.Count === totalTracks) { idx = range(end, focusIdx, 1); }
			}
			if (end < 0 || !idx.lenth) {
				const plsItemsOver = new FbMetadbHandleList(plsItems.slice(focusIdx, focusIdx + totalTracks));
				plsItemsOver.Sort();
				plsItemsOver.MakeIntersection(clone);
				if (plsItemsOver.Count === totalTracks) { idx = range(focusIdx, focusIdx + totalTracks - 1, 1); }
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

/**
 * Applies semi-random patterns, not allowing the same artist 2 times in a row, while not falling into strict intercalation
 * Based on: https://engineering.atspotify.com/2014/02/how-to-shuffle-songs/
 * Note for some proportions there is an exact solution, and that's used instead of relying on the random method. Beware it returns null when items are <= 2. Just reuse original list in such case
 *
 * @function
 * @name shuffleByTags
 * @kind function
 * @param {{ tagName?: string[] selItems?: FbMetadbHandleList bSendToActivePls?: boolean data?: { handleArray: any[] dataArray: any[] tagsArray: any[] } bAdvancedShuffle?: boolean sortBias?: string sortDir?: number bDebug?: boolean }} { tagName, selItems, bSendToActivePls, data, bAdvancedShuffle, sortBias, sortDir, bDebug }?
 * @returns {{handleList:FbMetadbHandleList handleArray:FbMetadbHandle[] dataArray:any[] tagsArray:any[]}}
 */
function shuffleByTags({
	tagName = ['ALBUM ARTIST'],
	selItems = plman.ActivePlaylist !== -1 ? plman.GetPlaylistSelectedItems(plman.ActivePlaylist) : null,
	bSendToActivePls = true,
	data = { handleArray: [], dataArray: [], tagsArray: [] }, // Shallow copies are made
	bAdvancedShuffle = false, // Tries to scatter instrumental, live tracks, ...
	sortBias = 'random', // random | playcount | rating | popularity | lastplayed | key | TitleFormat expression || '' (none)
	sortDir = 1,
	bDebug = false
} = {}) {
	// Safety checks
	const dataHandleLen = data && data.handleArray ? data.handleArray.length : 0;
	const dataTagsLen = data && data.tagsArray ? data.tagsArray.length : 0;
	const dataLen = data && data.dataArray ? data.dataArray.length : null;
	const itemsCount = selItems ? selItems.Count : 0;
	const bEnhPlayCount = (typeof isEnhPlayCount !== 'undefined' && isEnhPlayCount)
		|| (typeof isEnhPlayCount === 'undefined' && utils.CheckComponent('foo_enhanced_playcount'));
	const bPlayCount = (typeof isPlayCount !== 'undefined' && isPlayCount)
		|| (typeof isPlayCount === 'undefined' && utils.CheckComponent('foo_enhanced_playcount'));
	sortBias = (sortBias || '').toLowerCase();
	if (dataHandleLen <= 2 && itemsCount <= 2) { console.log('shuffleByTags: not enough items. -> ' + Math.max(itemsCount, dataHandleLen)); return null; }
	if (!Array.isArray(tagName) || !tagName.length) { console.log('shuffleByTags: tagName is not an array of tags. -> ' + tagName); return null; }
	if (dataLen && dataLen !== dataHandleLen && dataLen !== itemsCount) { console.log('shuffleByTags: data length ' + _p(dataLen) + ' does not match items count ' + _p(itemsCount) + '.'); return null; }
	if (/playcount|lastplayed/.test(sortBias) && !bPlayCount) { fb.ShowPopupMessage('shuffleByTags: foo_playcount is not installed.\n\nSorting bias can not be used: ' + sortBias, 'shuffleByTags'); return; }
	if (/popularity/.test(sortBias) && !utils.GetPackageInfo('{F5E9D9EB-42AD-4A47-B8EE-C9877A8E7851}')) { fb.ShowPopupMessage('shuffleByTags: Find & Play package is not installed.\n\nSorting bias can not be used: ' + sortBias, 'shuffleByTags'); return; }
	// Convert input and shuffle
	const totalTracks = dataHandleLen || itemsCount;
	let dataArray = dataLen ? [...data.dataArray] : null;
	let tagsArray = dataTagsLen ? [...data.tagsArray] : null;
	let selItemsArray;
	let sortTF;
	switch (sortBias) {
		case 'playcount': sortTF = '$max(%PLAY_COUNT%,%LASTFM_PLAY_COUNT%,0)'; break;
		case 'rating': sortTF = '$max(%RATING%,$meta(RATING),0)'; break;
		case 'popularity': sortTF = '$max($meta(Track Statistics Last.fm,5[score]),0)'; break;
		case 'lastplayed': sortTF = bEnhPlayCount ? '%LAST_PLAYED_ENHANCED%' : '%LAST_PLAYED%'; break;
		case 'key': sortTF = '$if($stricmp(%KEY%,G#m),$puts(kTrans,1B))$if($stricmp(%KEY%,Abm),$puts(kTrans,1B))$if($stricmp(%KEY%,D#m),$puts(kTrans,2B))$if($stricmp(%KEY%,Ebm),$puts(kTrans,2B))$if($stricmp(%KEY%,A#m),$puts(kTrans,3B))$if($stricmp(%KEY%,Bbm),$puts(kTrans,3B))$if($stricmp(%KEY%,Fm),$puts(kTrans,4B))$if($stricmp(%KEY%,Cm),$puts(kTrans,5B))$if($stricmp(%KEY%,Gm),$puts(kTrans,6B))$if($stricmp(%KEY%,Dm),$puts(kTrans,7B))$if($stricmp(%KEY%,Am),$puts(kTrans,8B))$if($stricmp(%KEY%,Em),$puts(kTrans,9B))$if($stricmp(%KEY%,Bm),$puts(kTrans,10B))$if($stricmp(%KEY%,F#m),$puts(kTrans,11B))$if($stricmp(%KEY%,Gbm),$puts(kTrans,11B))$if($stricmp(%KEY%,C#m),$puts(kTrans,12B))$if($stricmp(%KEY%,Dbm),$puts(kTrans,12B))$if($stricmp(%KEY%,6m),$puts(kTrans,1B))$if($stricmp(%KEY%,7m),$puts(kTrans,2B))$if($stricmp(%KEY%,8m),$puts(kTrans,3B))$if($stricmp(%KEY%,9m),$puts(kTrans,4B))$if($stricmp(%KEY%,10m),$puts(kTrans,5B))$if($stricmp(%KEY%,11m),$puts(kTrans,6B))$if($stricmp(%KEY%,12m),$puts(kTrans,7B))$if($stricmp(%KEY%,1m),$puts(kTrans,8B))$if($stricmp(%KEY%,2m),$puts(kTrans,9B))$if($stricmp(%KEY%,3m),$puts(kTrans,10B))$if($stricmp(%KEY%,4m),$puts(kTrans,11B))$if($stricmp(%KEY%,5m),$puts(kTrans,12B))$if($stricmp(%KEY%,B),$puts(kTrans,1A))$if($stricmp(%KEY%,F#),$puts(kTrans,2A))$if($stricmp(%KEY%,Gb),$puts(kTrans,2A))$if($stricmp(%KEY%,C#),$puts(kTrans,3A))$if($stricmp(%KEY%,Db),$puts(kTrans,3A))$if($stricmp(%KEY%,G#),$puts(kTrans,4A))$if($stricmp(%KEY%,Ab),$puts(kTrans,4A))$if($stricmp(%KEY%,D#),$puts(kTrans,5A))$if($stricmp(%KEY%,Eb),$puts(kTrans,5A))$if($stricmp(%KEY%,A#),$puts(kTrans,6A))$if($stricmp(%KEY%,Bb),$puts(kTrans,6A))$if($stricmp(%KEY%,F),$puts(kTrans,7A))$if($stricmp(%KEY%,C),$puts(kTrans,8A))$if($stricmp(%KEY%,G),$puts(kTrans,9A))$if($stricmp(%KEY%,D),$puts(kTrans,10A))$if($stricmp(%KEY%,A),$puts(kTrans,11A))$if($stricmp(%KEY%,E),$puts(kTrans,12A))$if($stricmp(%KEY%,6d),$puts(kTrans,1A))$if($stricmp(%KEY%,7d),$puts(kTrans,2A))$if($stricmp(%KEY%,8d),$puts(kTrans,3A))$if($stricmp(%KEY%,9d),$puts(kTrans,4A))$if($stricmp(%KEY%,10d),$puts(kTrans,5A))$if($stricmp(%KEY%,11d),$puts(kTrans,6A))$if($stricmp(%KEY%,12d),$puts(kTrans,7A))$if($stricmp(%KEY%,1d),$puts(kTrans,8A))$if($stricmp(%KEY%,2d),$puts(kTrans,9A))$if($stricmp(%KEY%,3d),$puts(kTrans,10A))$if($stricmp(%KEY%,4d),$puts(kTrans,11A))$if($stricmp(%KEY%,5d),$puts(kTrans,12A))$if($get(kTrans),,$puts(kTrans,%key%))$get(kTrans)'; break;
		case 'key6acentered': sortTF = '$if($stricmp(%KEY%,G#m),$puts(kTrans,7B))$if($stricmp(%KEY%,Abm),$puts(kTrans,7B))$if($stricmp(%KEY%,D#m),$puts(kTrans,8B))$if($stricmp(%KEY%,Ebm),$puts(kTrans,8B))$if($stricmp(%KEY%,A#m),$puts(kTrans,9B))$if($stricmp(%KEY%,Bbm),$puts(kTrans,9B))$if($stricmp(%KEY%,Fm),$puts(kTrans,10B))$if($stricmp(%KEY%,Cm),$puts(kTrans,11B))$if($stricmp(%KEY%,Gm),$puts(kTrans,12B))$if($stricmp(%KEY%,Dm),$puts(kTrans,1B))$if($stricmp(%KEY%,Am),$puts(kTrans,2B))$if($stricmp(%KEY%,Em),$puts(kTrans,3B))$if($stricmp(%KEY%,Bm),$puts(kTrans,4B))$if($stricmp(%KEY%,F#m),$puts(kTrans,5B))$if($stricmp(%KEY%,Gbm),$puts(kTrans,5B))$if($stricmp(%KEY%,C#m),$puts(kTrans,6B))$if($stricmp(%KEY%,Dbm),$puts(kTrans,6B))$if($stricmp(%KEY%,6m),$puts(kTrans,7B))$if($stricmp(%KEY%,7m),$puts(kTrans,8B))$if($stricmp(%KEY%,8m),$puts(kTrans,9B))$if($stricmp(%KEY%,9m),$puts(kTrans,10B))$if($stricmp(%KEY%,10m),$puts(kTrans,11B))$if($stricmp(%KEY%,11m),$puts(kTrans,12B))$if($stricmp(%KEY%,12m),$puts(kTrans,1B))$if($stricmp(%KEY%,1m),$puts(kTrans,2B))$if($stricmp(%KEY%,2m),$puts(kTrans,3B))$if($stricmp(%KEY%,3m),$puts(kTrans,4B))$if($stricmp(%KEY%,4m),$puts(kTrans,5B))$if($stricmp(%KEY%,5m),$puts(kTrans,6B))$if($stricmp(%KEY%,B),$puts(kTrans,7A))$if($stricmp(%KEY%,F#),$puts(kTrans,8A))$if($stricmp(%KEY%,Gb),$puts(kTrans,8A))$if($stricmp(%KEY%,C#),$puts(kTrans,9A))$if($stricmp(%KEY%,Db),$puts(kTrans,9A))$if($stricmp(%KEY%,G#),$puts(kTrans,10A))$if($stricmp(%KEY%,Ab),$puts(kTrans,10A))$if($stricmp(%KEY%,D#),$puts(kTrans,11A))$if($stricmp(%KEY%,Eb),$puts(kTrans,11A))$if($stricmp(%KEY%,A#),$puts(kTrans,12A))$if($stricmp(%KEY%,Bb),$puts(kTrans,12A))$if($stricmp(%KEY%,F),$puts(kTrans,1A))$if($stricmp(%KEY%,C),$puts(kTrans,2A))$if($stricmp(%KEY%,G),$puts(kTrans,3A))$if($stricmp(%KEY%,D),$puts(kTrans,4A))$if($stricmp(%KEY%,A),$puts(kTrans,5A))$if($stricmp(%KEY%,E),$puts(kTrans,6A))$if($stricmp(%KEY%,6d),$puts(kTrans,7A))$if($stricmp(%KEY%,7d),$puts(kTrans,8A))$if($stricmp(%KEY%,8d),$puts(kTrans,9A))$if($stricmp(%KEY%,9d),$puts(kTrans,10A))$if($stricmp(%KEY%,10d),$puts(kTrans,11A))$if($stricmp(%KEY%,11d),$puts(kTrans,12A))$if($stricmp(%KEY%,12d),$puts(kTrans,1A))$if($stricmp(%KEY%,1d),$puts(kTrans,2A))$if($stricmp(%KEY%,2d),$puts(kTrans,3A))$if($stricmp(%KEY%,3d),$puts(kTrans,4A))$if($stricmp(%KEY%,4d),$puts(kTrans,5A))$if($stricmp(%KEY%,5d),$puts(kTrans,6A))$if($get(kTrans),,$puts(kTrans,%key%))$get(kTrans)'; break;
		case 'random': sortTF = null; break;
		default: sortTF = sortBias; // Pass a TF expression or empty (don't sort)
	}
	if (sortTF !== null) { // If tags/data are already provided, sorting must be tracked...
		selItemsArray = dataHandleLen ? [...data.handleArray] : selItems.Clone();
		if (sortTF.length) { // Picking is reversed later, so sort ascending
			const dataMap = dataLen & dataTagsLen
				? new Map(selItemsArray.map((handle, i) => [handle.RawPath + handle.SubSong, [dataArray[i], tagsArray[i]]]))
				: dataTagsLen
					? new Map(selItemsArray.map((handle, i) => [handle.RawPath + handle.SubSong, tagsArray[i]]))
					: dataLen
						? new Map(selItemsArray.map((handle, i) => [handle.RawPath + handle.SubSong, dataArray[i]]))
						: null;
			if (dataHandleLen) { selItemsArray = new FbMetadbHandleList(selItemsArray); }
			selItemsArray.OrderByFormat(fb.TitleFormat(sortTF), sortDir);
			selItemsArray = selItemsArray.Convert();
			if (dataLen & dataTagsLen) {
				[dataArray, tagsArray] = selItemsArray.map((handle) => dataMap.get(handle.RawPath + handle.SubSong));
			} else if (dataTagsLen) {
				tagsArray = selItemsArray.map((handle) => dataMap.get(handle.RawPath + handle.SubSong));
			} else if (dataLen) {
				dataArray = selItemsArray.map((handle) => dataMap.get(handle.RawPath + handle.SubSong));
			}
		} else if (!dataHandleLen) {
			selItemsArray = selItemsArray.Convert();
		}
	} else {
		selItemsArray = dataHandleLen
			? [...data.handleArray]
			: selItems.Convert();
		if (dataLen & dataTagsLen) { Array.shuffle(selItemsArray, dataArray, tagsArray); } // Shuffle all at the same time
		else if (dataLen) { Array.shuffle(selItemsArray, dataArray); }
		else if (dataTagsLen) { Array.shuffle(selItemsArray, tagsArray); }
		else { selItemsArray.shuffle(); }
	}
	// Get tag values and find tag value
	// Split elements by equal value, by reverse order
	const selItemsClone = dataTagsLen
		? null
		: new FbMetadbHandleList(selItemsArray);
	const tagValues = (selItemsClone
		? getHandleListTags(selItemsClone, tagName, { bMerged: true })
		: [...tagsArray]
	).map((item) => { return item.filter(Boolean).sort().map((item) => { return item.toLowerCase(); }).join(','); });
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
	const distMap = new ReverseIterableMap();
	let bSolved = false, solution = '';
	valMap.forEach((value, key) => {
		const total = value.length;
		if ((totalTracks - total) === (total - 1)) { bSolved = true; solution = key; } // Only 1 exact solution intercalating tracks
		if (bSolved) { return; }
		const dist = totalTracks / total;
		const offset = bSolved ? 0 : Math.random() * (totalTracks - total) / total;
		distMap.set(key, { dist, total, offset });
	});
	// Calculate timeline
	let timeLine = [];
	if (bSolved) {
		const keys = [...tagValues].filter((key) => { return key !== solution; });
		timeLine = Array(totalTracks).fill(null).map((val, i) => {
			return { pos: i, key: i % 2 === 0 ? solution : keys.splice(sortTF ? 0 : Math.floor(Math.random() * keys.length), 1)[0] };
		});
	} else {
		const timeLineMap = new ReverseIterableMap();
		distMap.forEach((value, key) => {
			const line = [];
			line.push({ pos: value.offset, key });
			for (let i = 1; i < value.total; i++) { // Apply a random shift by only a 33% of the space between consecutive artist's tracks
				line.push({ pos: value.offset + value.dist * i + (value.total > 1 ? ((Math.random() * 2 - 1) * Math.random() * (value.dist - 1) * 0.33) : 0), key });
			}
			timeLineMap.set(key, line);
		});
		timeLine = [...timeLineMap.values()].flat(Infinity).sort((a, b) => { return a.pos - b.pos; });
		// Double check there are no consecutive artist's tracks due to random shifting (mostly for value.dist ~ 3)
		for (let i = 1; i < totalTracks - 2; i++) {
			if (timeLine[i].key === timeLine[i + 1].key) { // This ensures previous values did not match
				[timeLine[i - 1], timeLine[i]] = [timeLine[i], timeLine[i - 1]];
			}
		}
	}
	let selItemsArrayOut = [];
	let tagValuesOut = [];
	let dataValuesOut = [];
	timeLine.forEach((track) => {
		const key = track.key;
		const tracks = valMap.get(key);
		const tracksNum = tracks.length;
		// Select a random track with chosen value
		const index = tracks.splice(sortTF ? 0 : Math.floor(Math.random() * tracksNum), 1)[0];
		selItemsArrayOut.push(selItemsArray[index]);
		tagValuesOut.push(tagValues[index]);
		if (dataLen) { dataValuesOut.push(dataArray[index]); }
		// Delete empty values
		if ((tracksNum - 1) === 0) {
			valMap.delete(key);
		}
	});
	// Swap items position when some specific conditions are met, applied over the previous pattern
	if (bAdvancedShuffle) {
		const selItemsList = new FbMetadbHandleList(selItemsArrayOut);
		const conditions = {
			instrumental: { tags: ['GENRE', 'STYLE', 'FOLKSONOMY', 'LANGUAGE'], val: [['instrumental'], ['instrumental'], ['instrumental'], ['zxx']], bPrev: true },
			live: { tags: ['GENRE', 'STYLE', 'FOLKSONOMY'], val: [['live'], ['live'], ['live']], bPrev: false },
			vocal: { tags: ['GENRE', 'STYLE', 'FOLKSONOMY'], val: [['female vocal'], ['female vocal'], ['female vocal']], bPrev: false },
		};
		// Retrieve tags and reuse whenever it's possible
		const types = Object.keys(conditions);
		const tags = {};
		for (let type of types) {
			conditions[type].val = conditions[type].val
				.map((tagArr) => new Set(tagArr.map((t) => t.toLowerCase())));
			const missingTags = new Set(conditions[type].tags);
			for (let tag of conditions[type].tags) {
				if (Object.hasOwn(tags, tag)) {
					missingTags.delete(tag);
				}
			}
			const newTags = missingTags.size
				? getHandleListTagsV2(selItemsList, [...missingTags])
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
						if (newIndexes.length) { indexes = newIndexes; bDone = true; }
						else { break; }
					}
				}
				// If there are matches, check conditions over nearest tracks
				if (bDone && indexes.length) {
					indexes.shuffle();
					while (indexes.length) {
						const j = indexes.pop();
						// Previous and next track must not match any of the conditions of the current track
						const currentConditions = { from: {}, to: {} };
						const nextConditions = { from: {}, to: {} };
						const prevConditions = { from: {}, to: {} };
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
							if (bDebug) { console.log(swap, i + 1, '->', j + 1); }
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
				if (plsItemsBelow.Count === totalTracks) { idx = range(end, focusIdx, 1); }
			}
			if (end < 0 || !idx.lenth) {
				const plsItemsOver = new FbMetadbHandleList(plsItems.slice(focusIdx, focusIdx + totalTracks));
				plsItemsOver.Sort();
				plsItemsOver.MakeIntersection(clone);
				if (plsItemsOver.Count === totalTracks) { idx = range(focusIdx, focusIdx + totalTracks - 1, 1); }
			}
		}
		if (idx.length === totalTracks) {
			plman.SetPlaylistSelection(plman.ActivePlaylist, idx, true);
			plman.SetPlaylistFocusItem(plman.ActivePlaylist, focusIdx);
		}
		console.log('Selection scattered by tag(s) \'' + tagName.join(',') + '\' on playlist: ' + plman.GetPlaylistName(plman.ActivePlaylist));
	}
	return { handleList: selItemsList, handleArray: selItemsArrayOut, dataArray: dataValuesOut, tagsArray: tagValuesOut };
}