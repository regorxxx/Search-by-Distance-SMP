'use strict';
//06/08/24

/* exported calcMeanDistanceV2, calcCacheLinkSG, calcCacheLinkSGV2 , getAntiInfluences, getInfluences, getNodesFromPath */

// Required since this script is loaded on browsers for drawing too!
try { // On foobar2000
	include('..\\..\\helpers-external\\ngraph\\ngraph.graph.js');
	include('..\\..\\helpers-external\\ngraph\\a-star.js');
	/* global aStarPathSearch:readable */
	include('..\\..\\helpers-external\\ngraph\\a-greedy-star.js');
	/* global aStarBi:readable */
	include('..\\..\\helpers-external\\ngraph\\NBA.js');
	/* global nba:readable */
	include('..\\..\\helpers\\helpers_xxx_prototypes.js');
	/* global round:readable */
	/* global music_graph_descriptors:readable */
} catch (e) { // eslint-disable-line no-unused-vars
	// On browsers
	// Same files must be loaded on html
	// Replace helpers_xxx_prototypes.js with music_graph_html_xxx.js
	console.log('\'ngraph_helpers_xxx\' script is being used on browser. Omitting \'include\' clause.');
}

/*
	Distance calculation
*/

// Gets total weight distance for the path
// Needs valid path! i.e. if path is from NodeA to NodeA, it outputs nothing
// O(0.55 * ln(n))
function getDistanceFromPath(myGraph, path, bJointGraph = true) {
	let distanceGraph = Infinity;
	const pathLength = path ? path.length : 0;
	if (!pathLength) {
		if (bJointGraph) { throw new Error('No path provided'); }
		else { return distanceGraph; }
	}
	const links = pathLength - 1;
	if (links === 0) { throw new Error('Invalid path:\n' + JSON.stringify(path.map((n) => n.id))); } // Paths should always have at least a link between 2 nodes
	else {
		const weights = [];
		for (let i = 0; i < links; i++) {
			const link = myGraph.getNonOrientedLink(path[i].id, path[i + 1].id, (link) => link.data.weight);
			weights.push(link.data.weight);
			if (link.data.weight === Infinity) { break; }
		}
		distanceGraph = weights.reduce((a, c) => a + c, 0);
	}
	return distanceGraph;
}

// Finds distance between two nodes, Path is calculated on the fly.
// O(0.55 * ln(n))
function calcGraphDistance(myGraph, keyOne, keyTwo, bUseInfluence = false, influenceMethod = 'adjacentNodes' /* direct, zeroNodes, adjacentNodes, fullPath */, bJointGraph = true) {
	const method = 'NBA'; // Minimal speed differences found for our weighted graph...
	let distance = Infinity;
	let influence = 0;

	if (!keyOne || !keyTwo || !myGraph) {
		return { distance, influence, path: [] };
	}
	let nodeOne = myGraph.getNode(keyOne);
	let nodeTwo = myGraph.getNode(keyTwo);
	if (!nodeOne || !nodeTwo) { //If node not on graph, skip calc.
		return { distance, influence, path: [] };
	}
	if (nodeOne === nodeTwo) { //Same node, skip calc.
		return { distance: 0, influence, path: [nodeOne, nodeOne] };
	}

	let pathFinder;
	if (method === 'A*greedy') {
		pathFinder = aStarBi(myGraph, {
			distance(fromNode, toNode, link) {
				return link.data.weight;
			}
		});
	} else if (method === 'A*') {
		pathFinder = aStarPathSearch(myGraph, {
			distance(fromNode, toNode, link) {
				return link.data.weight;
			}
		});
	} else {
		pathFinder = nba(myGraph, {
			distance(fromNode, toNode, link) {
				return link.data.weight;
			}
		});
	}

	let path = [];
	path = pathFinder.find(keyOne, keyTwo);
	if (!path || !path.length) {
		if (bJointGraph) {
			throw new Error('calcGraphDistance: no path found for keys ' + keyOne + ' ' + keyTwo + '\tExecute graph debugging to find the error');
		}
		distance = Infinity;
	} else {
		// TODO: move this into pathfinder. Zeronodes and Direct can be calculated afterwards since it is irrelevant for path finding. fullpath case is trivial since it requires checking every link. adjacentNodes may be calculated on the first and last step of pathfinder. In any case all links between nodes must be checked.
		distance = getDistanceFromPath(myGraph, path, bJointGraph);
		if (bUseInfluence) {
			// Checks links between pairs of nodes to find if they are (anti)influences
			// For ex: Hip-Hop <- Rap_supergenre <- Rap_cluster <- Rhythm Music_supercluster <- Blue_Note_cluster <- Blues_supergenre <- Blues
			// Where {Hip-Hop <- Rap_supergenre} and {Blues_supergenre <- Blues} are zero distance links
			let last = path.length - 1; // Is always >= 1
			let firstNode, lastNode;
			let bDirect = false;
			switch (influenceMethod) {
				case 'fullPath': { // NOSONAR [fallthrough] Considering every consecutive link on the path {Hip-Hop <- Rap_supergenre}, {Rap_supergenre <- Rap_cluster}, ...
					if (last !== 1) { // Otherwise we are repeating first->last multiple times, considered below
						for (let i = 0; i < last; i++) { // size (<=n) (a)->{b}, (b)->{c}, (c)->{d}, ...
							const link = myGraph.getNonOrientedLink(path[i].id, path[i + 1].id);
							if (link && Object.hasOwn(link.data, 'absoluteWeight') && link.data.absoluteWeight) { influence += link.data.absoluteWeight; }
						}
					}
					// falls through
				}
				case 'adjacentNodes': { // Considering the adjacent nodes no matter their distance, so compare node set {Hip-Hop, Rap_supergenre} to {Blues_supergenre, Blues}
					if (last !== 1) { // Otherwise we are repeating first->last multiple times
						let adjLinkNodeFrom = new Set();
						let adjLinkNodeTo = new Set();
						firstNode = path[0].id; lastNode = path[last].id;
						adjLinkNodeFrom.add(firstNode).add(path[1].id);
						adjLinkNodeTo.add(lastNode).add(path[last - 1].id);
						const ids = new Set();
						adjLinkNodeFrom.forEach((nodeFrom) => { // size (<=4) (a)->{z}, (a)->{y}, (b)->{z}, (b)->{y}
							adjLinkNodeTo.forEach((nodeTo) => {
								ids.add(nodeFrom).add(nodeTo);
								myGraph.getLinks(nodeFrom).forEach((link) => {
									if (ids.has(link.fromId) && ids.has(link.toId)) {
										if (Object.hasOwn(link.data, 'absoluteWeight') && link.data.absoluteWeight) {
											influence += link.data.absoluteWeight;
										}
									}
								});
								ids.clear();
							});
						});
					} else { bDirect = true; }
					break;
				}
				case 'zeroNodes': { // NOSONAR [fallthrough] Considering only the adjacent nodes at zero distance, equivalent to prev. method but only when links are substitutions
					if (last !== 1) { // Otherwise we are repeating first->last multiple times
						let zeroLinkNodeFrom = new Set();
						let zeroLinkNodeTo = new Set();
						firstNode = path[0].id; lastNode = path[last].id;
						const linkFrom = myGraph.getNonOrientedLink(firstNode, path[1].id);
						const linkTo = myGraph.getNonOrientedLink(lastNode, path[last - 1].id);
						if (linkFrom && linkFrom.data.weight === 0) { zeroLinkNodeFrom.add(linkFrom.fromId).add(linkFrom.toId); }
						if (linkTo && linkTo.data.weight === 0) { zeroLinkNodeTo.add(linkTo.fromId).add(linkTo.toId); }
						let bDone = false;
						const ids = new Set();
						for (const nodeFrom of zeroLinkNodeFrom) { // size (<=1) Note substitutions require their influence links to be added to the generic item, so there is only (A=a)->(Z=z)
							if (bDone) { break; }
							for (const nodeTo of zeroLinkNodeTo) {
								if (bDone) { break; }
								ids.add(nodeFrom).add(nodeTo);
								myGraph.getLinks(nodeFrom).forEach((link) => {
									if (ids.has(link.fromId) && ids.has(link.toId)) {
										if (Object.hasOwn(link.data, 'absoluteWeight') && link.data.absoluteWeight) {
											influence += link.data.absoluteWeight;
											bDone = true;
										}
									}
								});
								ids.clear();
							}
						}
					}
					// falls through
				}
				case 'direct': { // zero nodes method also includes any direct link between the last and first node even when the distance is not zero. Built-in in adjacent nodes
					bDirect = true;
					break;
				}
				default: {
					console.log('calcGraphDistance: influence method not recognized \'' + influenceMethod + '\'.');
					break;
				}
			}
			if (bDirect) { // Always applies when there is only 2 nodes no matter the method or using direct
				if (!firstNode && !lastNode) { firstNode = path[0].id; lastNode = path[last].id; }
				const ids = new Set([firstNode, lastNode]);
				myGraph.getLinks(firstNode).forEach((link) => { // Size (<=1) (a)->{z}
					if (ids.has(link.fromId) && ids.has(link.toId)) {
						if (Object.hasOwn(link.data, 'absoluteWeight') && link.data.absoluteWeight) {
							influence += link.data.absoluteWeight;
						}
					}
				});
			}
		}
	}
	return { distance, influence, path };
}

// Finds distance between two sets of nodes
// It's recommended to cache the mean distance between sets of genres
// when these are repeated frequently instead of calling calcMeanDistance
// This cache is optimized to have minimum size on JSON
// map -> [nodeA-nodeB: [distance, influence], ...]
var cacheLink; // NOSONAR [shared on files]

// Get the minimum distance of the entire set of tags (track B, i) to every style of the original track (A, j):
// worst case is O(i*j*k*lg(n)) time, greatly reduced by caching link distances.
// where n = # nodes on map, i = # tracks retrieved by query, j & K = # number of style/genre tags
// Pre-filtering number of tracks is the best approach to reduce calc time (!)
function calcMeanDistance(myGraph, style_genre_reference, style_genre_new, influenceMethod = 'adjacentNodes') {
	if (!cacheLink) { cacheLink = new Map(); }
	let mapDistance = Infinity;
	// Compare smallest set to bigger set to find the smallest path and avoid asymmetric results
	const fromDiff = style_genre_reference.difference(style_genre_new);
	const toDiff = style_genre_new.difference(style_genre_reference);
	const difference = fromDiff.size < toDiff.size ? fromDiff : toDiff;
	const toStyleGenre = fromDiff.size < toDiff.size ? style_genre_new : style_genre_reference;
	if (style_genre_reference.size === 0 || style_genre_new.size === 0) { // When no tags are available, sets are empty & tracks are not connected
		mapDistance = Infinity;
	} else { // With non-empty sets
		if (!difference.size) { // NOSONAR [If style_genre_new is superset of style_genre_reference]
			mapDistance = 0;
		} else {
			let influenceDistance = 0;
			for (let style_genre of difference) { // No need to check for those already matched. We are making an assumption here... i.e. that A genre has zero distance to only one value: A. But not to multiple ones: A, B, etc. That possibility is given by zero weight substitutions, but in that case 'calcGraphDistance' will output a zero distance too.
				let setMin = Infinity;
				for (let style_genreNew of toStyleGenre) { // But we need the entire set of new genre/styles to check lowest distance
					let jh_distance = Infinity; // We consider points are not linked by default
					let jh_influenceDistance = 0;
					const id = [style_genre, style_genreNew].sort((a, b) => a.localeCompare(b)).join('-'); // A-B and B-A are the same link
					const jh_link = cacheLink.get(id);
					if (jh_link) { //toStyleGenre changes more, so first one...
						jh_distance = jh_link[0];
						jh_influenceDistance = jh_link[1];
					} else { // Calc distances not found at cache. This is the heaviest part of the calc.
						({ distance: jh_distance, influence: jh_influenceDistance } = calcGraphDistance(myGraph, style_genre, style_genreNew, true, influenceMethod));
						//Graph is initialized at startup
						cacheLink.set(id, [jh_distance, jh_influenceDistance]);
					}
					if (jh_distance < setMin) { setMin = jh_distance; }
					if (jh_influenceDistance !== 0) { influenceDistance += jh_influenceDistance; }
				}
				if (setMin < Infinity) { //Get the minimum distance of the entire set
					if (mapDistance === Infinity) { // If points were not linked before
						mapDistance = setMin;
					} else { // else sum the next minimum
						mapDistance += setMin;
						if (mapDistance === Infinity) { break; }
					}
				}
			}
			if (mapDistance < Infinity) { // If they are linked
				mapDistance += influenceDistance; // Adds positive/negative influence distance ('negative' means nearer...)
				mapDistance /= difference.size;  // mean distance
				mapDistance = round(mapDistance, 1); // And rounds the final value
				if (mapDistance < 0) { mapDistance = 0; } // Safety check, since influence may lower values below zero
			}
		}
	}
	return mapDistance;
}

// Same than V1 but also checks for exclusions and arrays
function calcMeanDistanceV2(myGraph, style_genre_reference, style_genre_new, influenceMethod = 'adjacentNodes') {
	// Convert to sets if needed
	if (Array.isArray(style_genre_reference)) { style_genre_reference = new Set(style_genre_reference); }
	if (Array.isArray(style_genre_new)) { style_genre_new = new Set(style_genre_new); }
	// Remove excluded styles
	const map_distance_exclusions = music_graph_descriptors.map_distance_exclusions;
	style_genre_reference = style_genre_reference.difference(map_distance_exclusions);
	style_genre_new = style_genre_new.difference(map_distance_exclusions);
	// And calc
	return calcMeanDistance(myGraph, style_genre_reference, style_genre_new, influenceMethod);
}

/*
	Precompute
*/

// Finds distance between all SuperGenres on map. Returns a map with {distance, influenceDistance} and keys 'nodeA-nodeB'.
function calcCacheLinkSG(myGraph, nodeList = [...new Set(music_graph_descriptors.style_supergenre.flat(2))], limit = -1, influenceMethod = 'adjacentNodes') {
	let cache = new Map();
	let nodeListLen = nodeList.length;
	let i = 0;
	while (i < nodeListLen) {
		let j = i + 1;
		while (j < nodeListLen) {
			let { distance: ij_distance, influence: ij_antinfluenceDistance } = calcGraphDistance(myGraph, nodeList[i], nodeList[j], true, influenceMethod);
			if (limit === -1 || ij_distance <= limit) {
				cache.set(nodeList[i] + '-' + nodeList[j], [ij_distance, ij_antinfluenceDistance]);
			}
			j++;
		}
		i++;
	}
	return cache;
}

// Finds distance between all SuperGenres present on given set of style/genres. Returns a map with {distance, influenceDistance} and keys 'nodeA-nodeB'.
function calcCacheLinkSGV2(myGraph, styleGenres /*new Set (['Rock', 'Folk', ...])*/, limit = -1, influenceMethod = 'adjacentNodes', statusCallback = null) {
	// Filter SGs with those on library
	const descr = music_graph_descriptors;
	const nodeList = [
		...new Set(
			[...descr.style_supergenre, ...descr.style_weak_substitutions, ...descr.style_substitutions, ...descr.style_cluster].flat(Infinity)
		).intersection(styleGenres)
	];
	return new Promise((resolve) => {
		let cache = new Map();
		const promises = [];
		const iter = nodeList.length - 1;
		const total = iter * (iter + 1) / 2;
		const initDelay = Math.round(0.015 * total);
		const iterDelay = Math.round(5.5 * Math.log(total)) / 100; // O(0.55 * ln(n)), on n > 250K, processing > 60 ms and UI becomes sluggish
		let prevProgress = -1;
		let k = 0, h = 0;
		for (let i = 0; i < iter; i++) {
			for (let j = i + 1; j <= iter; j++) {
				h++;
				promises.push(new Promise((resolve) => {
					setTimeout(() => {
						let { distance: ij_distance, influence: ij_antinfluenceDistance } = calcGraphDistance(myGraph, nodeList[i], nodeList[j], true, influenceMethod);
						if (limit === -1 || ij_distance <= limit) {
							// Sorting removes the need to check A-B and B-A later...
							cache.set([nodeList[i], nodeList[j]].sort((a, b) => a.localeCompare(b)).join('-'), [ij_distance, ij_antinfluenceDistance]);
						}
						k++;
						const progress = Math.floor(k / total * 4) * 25;
						if (progress > prevProgress) {
							console.log('Calculating graph links ' + progress + '%.');
							if (statusCallback) { statusCallback(progress, prevProgress); }
							prevProgress = progress;
						}
						resolve('done');
					}, initDelay + iterDelay * h);
				}));
			}
		}
		Promise.all(promises).then(() => {
			resolve(cache);
		});
	});
}

/*
	Path info
*/

function getAntiInfluences(genreStyle) { // NOSONAR [it's same type...]
	const doubleIndex = music_graph_descriptors.style_anti_influence.flat().indexOf(genreStyle);
	const index = !(doubleIndex & 1) ? doubleIndex / 2 : -1; // -1 for odd indexes, halved for even values
	if (index !== -1) {
		return music_graph_descriptors.style_anti_influence[index][1];
	}
	return [];
}

function getInfluences(genreStyle) { // NOSONAR [it's same type...]
	const doubleIndex = music_graph_descriptors.style_primary_origin.flat().indexOf(genreStyle);
	const index = !(doubleIndex & 1) ? doubleIndex / 2 : -1; // -1 for odd indexes, halved for even values
	if (index !== -1) {
		return music_graph_descriptors.style_primary_origin[index][1];
	}
	return [];
}

//Gets array of nodes on the path
function getNodesFromPath(path) {
	if (!path.length) { return 'No Path'; }
	let idPath = path[0].id;
	let path_length = path.length;
	for (let i = 1; i < path_length; i++) {
		idPath += ' <- ' + path[i].id;
	}
	return idPath;
}