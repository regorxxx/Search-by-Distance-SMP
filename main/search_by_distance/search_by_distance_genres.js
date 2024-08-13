'use strict';
//09/08/24

/* exported findStyleGenresMissingGraph , getNearestGenreStyles */

/* global getHandleListTagsV2:readable, folders:readable, _isFile:readable, musicGraph:readable, calcMeanDistanceV2:readable, music_graph_descriptors:readable, _asciify:readable */
include('..\\music_graph\\music_graph_xxx.js');
/* global music_graph_descriptors_user:readable */
include('..\\search_by_distance\\ngraph_helpers_xxx.js');

// Similar genre/styles
function getNearestNodes(fromNode, maxDistance, graph = musicGraph()) {
	const nodeList = [];
	const nodeListSet = new Set([fromNode]);
	let remaining = graph.getLinks(fromNode);
	if (remaining) {
		while (remaining.length) {
			let distance = Infinity;
			let toAdd = [];
			remaining.forEach((link) => {
				const toId = nodeListSet.has(link.fromId) ? (nodeListSet.has(link.toId) ? null : link.toId) : link.fromId;
				if (toId) {
					distance = calcMeanDistanceV2(graph, [fromNode], [toId]);
					if (distance <= maxDistance) {
						nodeList.push({ toId, distance });
						nodeListSet.add(toId);
						toAdd = toAdd.concat(graph.getLinks(toId));
					}
				}
			});
			remaining = toAdd;
		}
	}
	return nodeList;
}

function getNearestGenreStyles(fromGenreStyles, maxDistance, graph = musicGraph()) {
	let genreStyles = [...fromGenreStyles]; // Include theirselves
	fromGenreStyles.forEach((node) => {
		getNearestNodes(node, maxDistance, graph).forEach((obj) => genreStyles.push(obj.toId));
	});
	genreStyles = music_graph_descriptors.replaceWithSubstitutionsReverse([...new Set(genreStyles)]);
	genreStyles = [...(new Set(genreStyles.filter((node) => !node.match(/_supercluster$|_cluster$|_supergenre$| XL$/gi))))];
	return genreStyles;
}

// Utilities
function findStyleGenresMissingGraph({ genreStyleFilter = [], genreStyleTag = ['GENRE','STYLE'], bAscii = true, bPopup = true } = {}) {
	// Skipped values at pre-filter
	const tagValuesExcluded = new Set(genreStyleFilter); // Filter holes and remove duplicates
	// Get all tags and their frequency
	const tagsToCheck = [...new Set(genreStyleTag.filter(Boolean))]; // Merge and filter
	if (!tagsToCheck.length && bPopup) {
		fb.ShowPopupMessage('There are no tags to check set.', 'Search by distance');
		return null;
	}
	// Get tags
	let tags = new Set(getHandleListTagsV2(fb.GetLibraryItems(), tagsToCheck, { bEmptyVal: true }).flat(Infinity));
	if (bAscii) { tags = new Set(Array.from(tags, (tag) => _asciify(tag))); }
	// Get node list (+ weak substitutions + substitutions + style cluster)
	const nodeList = new Set(music_graph_descriptors.style_supergenre.flat(Infinity)).union(new Set(music_graph_descriptors.style_weak_substitutions.flat(Infinity))).union(new Set(music_graph_descriptors.style_substitutions.flat(Infinity))).union(new Set(music_graph_descriptors.style_cluster.flat(Infinity)));
	// Compare (- user exclusions - graph exclusions)
	const missing = [...tags.difference(nodeList).difference(tagValuesExcluded).difference(music_graph_descriptors.map_distance_exclusions)].sort((a, b) => a.localeCompare(b));
	// Report
	const userFile = folders.userHelpers + 'music_graph_descriptors_xxx_user.js';
	const userFileNotFound = _isFile(userFile) ? '' : ' (not found)';
	const userFileEmpty = !userFileNotFound.length && Object.keys(music_graph_descriptors_user).length ? '' : ' (empty)';
	const report = 'Missing genre/styles may be added to your user\'s descriptors file, either\n' +
		'as new entries or as substitutions where required.\n\n' +
		(missing.length
			? 'In case you find a genre/style which is missing, check is not a misspelling\n' +
			'or alternate term for an existing entry (otherwise tag properly your files\n' +
			'or add the substitution to your file), and then if you think it should be\n' +
			'added to the Graph, let me know at: (but do your work first!)\n' +
			'https://github.com/regorxxx/Music-Graph/issues\n\n' +
			'An example of a good report of missing genre/style would be:\n' +
			'"Hey check this Metal style, you missed from the 90s which is not equal\n' +
			'to \'Black Metal\' or any other present style (+ YouTube link)"\n\n' +
			'An example of a bad report of missing genre/style would be:\n' +
			'"Hey, \'Folk/Rock\' is missing, but it\'s a known genre. Add it please."\n' +
			'(This is not valid because there is already a \'Folk-Rock\' entry, just use\n' +
			'substitutions since that\'s their reason of existence. Also it\'s not\n' +
			'planned to add every possible substitution to the original graph)\n\n' +
			'Graph descriptors:\n'
			: '') +
		'[scripts folder]\\main\\music_graph\\music_graph_descriptors_xxx.js\n' +
		'[profile folder]\\js_data\\helpers\\music_graph_descriptors_xxx_user.js' + (userFileNotFound || userFileEmpty) + '\n\n' +
		(missing.length > 5
			? 'If you don\'t plan to retag your files or add substitutions and there are\n' +
			'too many missing genre/styles, then it\'s recommended to use only\n' +
			'\'WEIGHT\' or \'DYNGENRE\' methods on the scripts.\n\n'
			: '') +
		'List of tags not present on the graph descriptors:\n' +
		(missing.joinEvery(', ', 6) || 'None found.');
	if (bPopup) { fb.ShowPopupMessage(report, 'Search by distance'); }
	return missing;
}