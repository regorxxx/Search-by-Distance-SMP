'use strict';
//04/08/24

/* exported writeSimilarArtistsTags, updateSimilarDataFile */

include('helpers_xxx_tags.js');
/* global globTags:readable, folders:readable, WshShell:readable, popup:readable, _jsonParseFile:readable,_jsonParseFileCheck:readable, _isFile:readable, _p:readable, utf8:readable, queryJoin:readable, _save:readable, _deleteFile:readable */

function writeSimilarArtistsTags({ file = folders.data + 'listenbrainz_artists.json', iNum = 10, tagName = 'SIMILAR ARTISTS LISTENBRAINZ', windowName = window.name } = {}) {
	if (WshShell.Popup('Write similar artist tags from JSON database to files?\nOnly first ' + iNum + ' artists with highest score will be used.', 0, windowName, popup.question + popup.yes_no) === popup.no) { return false; }
	if (!_isFile(file)) { return false; }
	else {
		const data = _jsonParseFile(file, utf8);
		if (data) { return updateTrackSimilarTags({ data, tagName, iNum, windowName }); }
	}
	return false;
}

function updateTrackSimilarTags({ data, iNum = 10, tagName = 'SIMILAR ARTISTS LISTENBRAINZ', windowName = window.name, bPopup = true } = {}) {
	if (!data || !data.length) { return false; }
	const bRewrite = bPopup
		? WshShell.Popup('Rewrite previously added similar artist tags?', 0, windowName, popup.question + popup.yes_no) === popup.yes
		: true;
	const queryNoRw = ' AND ' + tagName + ' MISSING';
	data.forEach((obj) => {
		const artist = obj.artist.split(', ');
		const similarArtists = obj.val.map((o) => { return o.artist; }).slice(0, iNum);
		if (!similarArtists.length) { return; }
		const artistTracks = fb.GetQueryItems(
			fb.GetLibraryItems(),
			_p(queryJoin(
				[
					artist.map((a) => { return globTags.artist + ' IS ' + a; }).join(' OR '),
					obj.mbid ? 'MUSICBRAINZ_ALBUMARTISTID IS ' + obj.mbid : ''
				],
				'OR'
			)) + (bRewrite ? '' : queryNoRw)
		);
		const count = artistTracks.Count;
		if (count) {
			let arr = [];
			for (let i = 0; i < count; ++i) {
				arr.push({
					[tagName]: similarArtists
				});
			}
			artistTracks.UpdateFileInfoFromJSON(JSON.stringify(arr));
			console.log('Updating tracks by ' + artist + ': ' + count + ' tracks.');
		}
	});
	return true;
}

function updateSimilarDataFile(file, newData, iNum = Infinity) {
	if (!_isFile(file)) {
		newData.forEach((obj) => { console.log(obj.artist + ' --> ' + JSON.stringify(obj.val.slice(0, iNum))); }); // DEBUG
		_save(file, JSON.stringify(newData, null, '\t'));
	} else {
		const data = getSimilarDataFromFile(file, newData, iNum);
		_deleteFile(file);
		_save(file, JSON.stringify(data, null, '\t'));
	}
}

function getSimilarDataFromFile(file, newData = null, iNum = Infinity) {
	const data = _jsonParseFileCheck(file, 'Tags json', window.Name, utf8);
	if (data) {
		if (newData) {
			const idxMap = new Map();
			data.forEach((obj, idx) => idxMap.set(obj.artist, idx));
			newData.forEach((obj) => {
				const idx = idxMap.get(obj.artist);
				if (idx >= 0) { data[idx] = obj; }
				else { data.push(obj); }
				console.log(obj.artist + ' --> ' + JSON.stringify(obj.val.slice(0, iNum))); // DEBUG
			});
		}
		data.forEach((obj) => {
			obj.val.forEach((val) => {
				if (Object.hasOwn(val, 'scoreW')) { val.score = val.scoreW; delete val.scoreW; }
			});
			obj.val.sort((a, b) => { return b.score - a.score; });
		});

	}
	return data || newData;
}