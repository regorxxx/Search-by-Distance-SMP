'use strict';
//20/10/22

// Required since this script is loaded on browsers for drawing too!
try { // On foobar
	include('..\\helpers-external\\ngraph\\ngraph.graph.js');
	include('..\\helpers-external\\ngraph\\a-star.js');
	include('..\\helpers-external\\ngraph\\a-greedy-star.js');
	include('..\\helpers-external\\ngraph\\NBA.js');
	include('helpers_xxx_prototypes.js');
} catch (e) { // On browsers
	// Same files must be loaded on html
	// Replace helpers_xxx_prototypes.js with music_graph_html_xxx.js
	console.log('\'ngraph_helpers_xxx\' script is being used on browser. Omitting \'include\' clause.');
}

/*
	Distance calculation
*/

// Gets total weight distance for the path
// Needs valid path! i.e. if path is from NodeA to NodeA, it outputs nothing
function getDistanceFromPath(mygraph, path) {
		let distanceGraph = Infinity;
		let path_length = path.length;
		let i ;
		if (path.length === 1) {
			throw new Error('Invalid path');
		} else {
			for (i = 0; i < path_length - 1;i++) {
				let link = mygraph.getNonOrientedLink(path[i].id, path[i+1].id);
				if (distanceGraph !== Infinity) {distanceGraph += link.data.weight;}
				else {distanceGraph = link.data.weight;}
			}
		}
		return distanceGraph;
}

// Finds distance between two nodes, Path is calculated on the fly.
function calcGraphDistance(mygraph, keyOne, keyTwo, bUseInfluence = false, influenceMethod = 'adjacentNodes' /* direct, zeroNodes, adjacentNodes, fullPath */) {
		const method = 'NBA'; // Minimal speed differences found for our weighted graph...
		
		let distanceGraph = Infinity;
		let influenceDistanceGraph = 0;
		
		
		if (!keyOne || !keyTwo || !mygraph) {
			return [distanceGraph , influenceDistanceGraph];
		}
		
		let nodeOne = mygraph.getNode(keyOne);
		let nodeTwo = mygraph.getNode(keyTwo);
		if (!nodeOne || !nodeTwo) { //If node not on graph, skip calc.
			return [distanceGraph , influenceDistanceGraph];
		}
		
		if (nodeOne === nodeTwo) { //Same node, skip calc.
			distanceGraph = 0;
			return [distanceGraph , influenceDistanceGraph];
		}
		
		let pathFinder;
		if (method === 'A*greedy') {
			pathFinder = aStarBi(mygraph, {
				distance(fromNode, toNode, link) {
				return link.data.weight;
				}
		});
		} else if (method === 'A*') {
			pathFinder = aStarPathSearch(mygraph, {
				distance(fromNode, toNode, link) {
				return link.data.weight;
				}
			});
		} else {
			pathFinder = nba(mygraph, {
				distance(fromNode, toNode, link) {
				return link.data.weight;
				}
			});
		}
		
		let path = [];
		path = pathFinder.find(keyOne, keyTwo);
		distanceGraph = getDistanceFromPath(mygraph, path);
		
		if (bUseInfluence) { 
			// Checks links between pairs of nodes to find if they are (anti)influences
			// For ex: Hip-Hop <- Rap_supergenre <- Rap_cluster <- Rythm Music_supercluster <- Blue_Note_cluster <- Blues_supergenre <- Blues
			// Where {Hip-Hop <- Rap_supergenre} and {Blues_supergenre <- Blues} are zero distance links
			let last = path.length - 1; // Is always >= 1
			let bDirect = false;
			switch (influenceMethod) {
				case 'fullPath': { // Considering every consecutive link on the path {Hip-Hop <- Rap_supergenre}, {Rap_supergenre <- Rap_cluster}, ...
					if (last !== 1) { // Otherwise we are repeating first->last multiple times, considered below
						for (let i = 0; i < last; i++) { // size (<=n) (a)->{b}, (b)->{c}, (c)->{d}, ...
							const link = mygraph.getNonOrientedLink(path[i].id, path[i + 1].id);
							if (link && link.data.hasOwnProperty('absoluteWeight') && link.data.absoluteWeight) {influenceDistanceGraph += link.data.absoluteWeight;}
						}
					}
					// falls through
				}
				case 'adjacentNodes': { // Considering the adjacent nodes no matter their distance, so compare node set {Hip-Hop, Rap_supergenre} to {Blues_supergenre, Blues}
					if (last !== 1) { // Otherwise we are repeating first->last multiple times
						let adjLinkNodeFrom = new Set();
						let adjLinkNodeTo = new Set();
						adjLinkNodeFrom.add(path[0].id).add(path[1].id);
						adjLinkNodeTo.add(path[last].id).add(path[last - 1].id);
						adjLinkNodeFrom.forEach((nodeFrom) => { // size (<=4) (a)->{z}, (a)->{y}, (b)->{z}, (b)->{y}
							adjLinkNodeTo.forEach((nodeTo) => {
								const link = mygraph.getNonOrientedLink(nodeFrom, nodeTo);
								if (link && link.data.hasOwnProperty('absoluteWeight') && link.data.absoluteWeight) {influenceDistanceGraph += link.data.absoluteWeight;}
							});
						});
					} else {bDirect = true;}
					break;
				}
				case 'zeroNodes': { // Considering only the adjacent nodes at zero distance, equivalent to prev. method but only when links are substitutions
					if (last !== 1) { // Otherwise we are repeating first->last multiple times
						let zeroLinkNodeFrom = new Set();
						let zeroLinkNodeTo = new Set();
						const linkFrom = mygraph.getNonOrientedLink(path[0].id, path[1].id);
						const linkTo = mygraph.getNonOrientedLink(path[last].id, path[last - 1].id);
						if (linkFrom && linkFrom.data.weight === 0) {zeroLinkNodeFrom.add(linkFrom.fromId).add(linkFrom.toId);}
						if (linkTo && linkTo.data.weight === 0) {zeroLinkNodeTo.add(linkTo.fromId).add(linkTo.toId);}
						let bDone = false;
						zeroLinkNodeFrom.forEach((nodeFrom) => { // size (<=1) Note substitutions require their influence links to be added to the generic item, so there is only (A=a)->(Z=z)
							if (bDone) {return;}
							zeroLinkNodeTo.forEach((nodeTo) => {
								if (bDone) {return;}
								const link = mygraph.getNonOrientedLink(nodeFrom, nodeTo);
								if (link && link.data.hasOwnProperty('absoluteWeight') && link.data.absoluteWeight) {influenceDistanceGraph += link.data.absoluteWeight; bDone = true;}
							});
						});
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
				const link = mygraph.getNonOrientedLink(path[0].id, path[last].id); // Size (<=1) (a)->{z}
				if (link && link.data.hasOwnProperty('absoluteWeight') && link.data.absoluteWeight) {influenceDistanceGraph += link.data.absoluteWeight;}
			}
		}
		return [distanceGraph, influenceDistanceGraph];
}

// Finds distance between two sets of nodes
// It's recommended to cache the mean distance too when sets are repeated frequently
// and only call calcMeanDistance if needed
var cacheLink;

// Get the minimum distance of the entire set of tags (track B, i) to every style of the original track (A, j): 
// worst case is O(i*j*k*lg(n)) time, greatly reduced by caching link distances.
// where n = # nodes on map, i = # tracks retrieved by query, j & K = # number of style/genre tags
// Pre-filtering number of tracks is the best approach to reduce calc time (!)
function calcMeanDistance(mygraph, style_genre_reference, style_genre_new, influenceMethod = 'adjacentNodes') {
	if (!cacheLink) {cacheLink = new Map();}
	let mapDistance = Infinity;
	// Compare smallest set to bigger set to find the smallest path and avoid asymmetric results
	const fromDiff = style_genre_reference.difference(style_genre_new);
	const toDiff = style_genre_new.difference(style_genre_reference);
	const difference = fromDiff.size < toDiff.size ? fromDiff : toDiff;
	const toStyleGenre = fromDiff.size < toDiff.size ? style_genre_new : style_genre_reference;
	if (style_genre_reference.size === 0 || style_genre_new.size === 0) { // When no tags are available, sets are empty & tracks are not connected
		mapDistance = Infinity;
	} else { // With non-empty sets
		if (!difference.size) { // If style_genre_new is superset of style_genre_reference.
			mapDistance = 0;
		} else {
			let influenceDistance = 0;
			let countMatch = 0;
			for (let style_genre of difference) { // No need to check for those already matched. We are making an assumption here... i.e. that A genre has zero distance to only one value: A. But not to multiple ones: A, B, etc. That possibility is given by zero weight substitutions, but in that case 'calcGraphDistance' will output a zero distance too.
				let setMin = Infinity;
				for (let style_genreNew of toStyleGenre) { // But we need the entire set of new genre/styles to check lowest distance
					let jh_distance = Infinity; // We consider points are not linked by default
					let jh_influenceDistance = 0;
					let bfoundcache = false;
					const id = [style_genre, style_genreNew].sort().join('-'); // A-B and B-A are the same link
					if (cacheLink.has(id)) { //toStyleGenre changes more, so first one...
						const jh_link = cacheLink.get(id);
						jh_distance = jh_link.distance;
						jh_influenceDistance = jh_link.influenceDistance;
						bfoundcache = true;
					}
					if (!bfoundcache) { // Calc distances not found at cache. This is the heaviest part of the calc.
						[jh_distance, jh_influenceDistance] = calcGraphDistance(mygraph, style_genre, style_genreNew, true, influenceMethod); 
						//Graph is initialized at startup
						cacheLink.set([style_genre, style_genreNew].sort().join('-'), {distance: jh_distance , influenceDistance: jh_influenceDistance}); // Sorting removes the need to check A-B and B-A later...
					}
					if (jh_distance < setMin) {setMin = jh_distance;}
					if (jh_influenceDistance !== 0) {influenceDistance += jh_influenceDistance;}
				}
				if (setMin < Infinity) { //Get the minimum distance of the entire set
					if (mapDistance === Infinity) { // If points were not linked before
							mapDistance = setMin;
					} else { // else sum the next minimum
						mapDistance += setMin;
						if (mapDistance === Infinity) {break;}
					}
				}
			}
			if (mapDistance < Infinity) { // If they are linked
				mapDistance += influenceDistance; // Adds positive/negative influence distance ('negative' means nearer...)
				mapDistance /= difference.size;  // mean distance
				mapDistance = round(mapDistance,1); // And rounds the final value
				if (mapDistance < 0) {mapDistance = 0;} // Safety check, since influence may lower values below zero
			}
		}
	}
	return mapDistance;
}

// Same than V1 but also checks for exclusions and arrays
function calcMeanDistanceV2(mygraph, style_genre_reference, style_genre_new, influenceMethod = 'adjacentNodes') {
	// Convert to sets if needed
	if (Array.isArray(style_genre_reference)) {style_genre_reference = new Set(style_genre_reference);}
	if (Array.isArray(style_genre_new)) {style_genre_new = new Set(style_genre_new);}
	// Remove excluded styles
	const map_distance_exclusions = music_graph_descriptors.map_distance_exclusions;
	style_genre_reference = style_genre_reference.difference(map_distance_exclusions);
	style_genre_new = style_genre_new.difference(map_distance_exclusions);
	// And calc
	return calcMeanDistance(mygraph, style_genre_reference, style_genre_new, influenceMethod);
}

/*
	Precompute
*/

// Finds distance between all nodes on map. Returns a map with {distance, influenceDistance} and keys 'nodeA-nodeB'.
function calcCacheLinkAll(mygraph, limit = -1, influenceMethod = 'adjacentNodes') {
		let cache = new Map();
		let node_list = [];

		mygraph.forEachNode(function(node){
			node_list.push(node.id);}
		);
		
		let node_list_length = node_list.length;
		let i = 0;
		while (i < node_list_length){
			let j = i + 1;
			while (j < node_list_length){
				let [ij_distance, ij_antinfluenceDistance] = calcGraphDistance(mygraph, node_list[i], node_list[j], true, influenceMethod);
				if (limit === -1 || ij_distance <= limit) {
					cache.set(node_list[i]+ '-' + node_list[j], {distance: ij_distance, influenceDistance: ij_antinfluenceDistance});
				}
				j++;
			}
			i++;
		}
		return cache;
}

// Finds distance between all SuperGenres on map. Returns a map with {distance, influenceDistance} and keys 'nodeA-nodeB'.
function calcCacheLinkSG(mygraph, limit = -1, influenceMethod = 'adjacentNodes') {
		let cache = new Map();
		let node_list = [];
		
		node_list = [...new Set(music_graph_descriptors.style_supergenre.flat(2))]; // all values without duplicates
		
		let node_list_length = node_list.length;
		let i = 0;
		while (i < node_list_length){
			let j = i + 1;
			while (j < node_list_length){
				let [ij_distance, ij_antinfluenceDistance] = calcGraphDistance(mygraph, node_list[i], node_list[j], true, influenceMethod);
				if (limit === -1 || ij_distance <= limit) {
					cache.set(node_list[i]+ '-' + node_list[j], {distance: ij_distance, influenceDistance: ij_antinfluenceDistance});
				}
				j++;
			}
			i++;
		}
		return cache;
}

// Finds distance between all SuperGenres present on given set of style/genres. Returns a map with {distance, influenceDistance} and keys 'nodeA-nodeB'.
function calcCacheLinkSGV2(mygraph, styleGenres /*new Set (['Rock', 'Folk', ...])*/, limit = -1, influenceMethod = 'adjacentNodes') {
	let nodeList = [];
	// Filter SGs with those on library
	const descr = music_graph_descriptors;
	nodeList = new Set([...descr.style_supergenre, ...descr.style_weak_substitutions, ...descr.style_substitutions, ...descr.style_cluster].flat(Infinity)); 
	nodeList = [...nodeList.intersection(styleGenres)];
	return new Promise((resolve) => {
		let cache = new Map();
		const promises = [];
		const iter = nodeList.length - 1;
		const total = iter * (iter + 1) / 2;
		let prevProgress = -1;
		let k = 0;
		for (let i = 0; i < iter; i++) {
			for (let j = i + 1; j <= iter; j++) {
				promises.push(new Promise((resolve) => {
					setTimeout(() => {
						let [ij_distance, ij_antinfluenceDistance] = calcGraphDistance(mygraph, nodeList[i], nodeList[j], true, influenceMethod);
						if (limit === -1 || ij_distance <= limit) {
							// Sorting removes the need to check A-B and B-A later...
							cache.set([nodeList[i], nodeList[j]].sort().join('-'), {distance: ij_distance, influenceDistance: ij_antinfluenceDistance});
						}
						k++;
						const progress = Math.floor(k / total * 4) * 25;
						if (progress > prevProgress) {prevProgress = progress; console.log('Calculating graph links ' + progress + '%.');}
						resolve('done');
					}, iDelaySBDCache * k);
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

function getAntiInfluences(genreStyle) {
	const doubleIndex = music_graph_descriptors.style_anti_influence.flat().indexOf(genreStyle);
	const index = !(doubleIndex & 1) ? doubleIndex / 2 : -1; // -1 for odd indexes, halved for even values
	if (index !== -1) {
		return music_graph_descriptors.style_anti_influence[index][1];
	}
	return [];
}

function getInfluences(genreStyle) {
	const doubleIndex = music_graph_descriptors.style_primary_origin.flat().indexOf(genreStyle);
	const index = !(doubleIndex & 1) ? doubleIndex / 2 : -1; // -1 for odd indexes, halved for even values
	if (index !== -1) {
		return music_graph_descriptors.style_primary_origin[index][1];
	}
	return [];
}

//Gets array of nodes on the path
function getNodesFromPath(path) {
	if (!path.length) {return 'No Path';}
	let idpath = path[0].id;
	let path_length = path.length;
	for (let i = 1; i < path_length;i++) {
		idpath += ' <- ' + path[i].id;
	}
	return idpath;
}