﻿'use strict';

// Required since this script is loaded on browsers for drawing too!
try { // On foobar
	include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\ngraph\\ngraph.graph.js');
	include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\ngraph\\a-star.js');
	include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\ngraph\\a-greedy-star.js');
	include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\ngraph\\NBA.js');
} catch (e) { // On browsers
	// same files must be loaded on html
	console.log('\'ngraph_helpers_xxx\' script is being used on browser. Omitting \'include\' clause.');
}

/*
	Distance calculation
*/

// Gets total weight distance for the path
// Needs valid path! i.e. if path is from NodeA to NodeA, it outputs nothing
function get_distanche_from_path(graph, path) {
		let distanceGraph = Infinity;
		let path_length = path.length;
		let i ;
		if (path.length === 1) {
			throw new Error('Invalid path');
		} else {
			for (i = 0; i < path_length - 1;i++) {
				let link = graph.getLink(path[i].id, path[i+1].id) !== null ? graph.getLink(path[i].id, path[i+1].id) : graph.getLink(path[i+1].id, path[i].id);
				if (distanceGraph !== Infinity) {distanceGraph += link.data.weight;}
				else {distanceGraph = link.data.weight;}
			}
		}
		return distanceGraph;
}

// Finds distance between two nodes, Path is calculated on the fly.
function calc_map_distance(mygraph, key_one, key_two, bUseInfluence = false) {
		const method = "NBA"; // Minimal speed differences found for our weighted graph...
		
		let distanceGraph = Infinity;
		let influenceDistanceGraph = 0;
		
		
		if (!key_one || !key_two || !mygraph) {
			return [distanceGraph , influenceDistanceGraph];
		}
		
		let nodeOne = mygraph.getNode(key_one);
		let nodeTwo = mygraph.getNode(key_two);
		if (!nodeOne || !nodeTwo) { //If node not on graph, skip calc.
			return [distanceGraph , influenceDistanceGraph];
		}
		
		if (nodeOne === nodeTwo) { //Same node, skip calc.
			distanceGraph = 0;
			return [distanceGraph , influenceDistanceGraph];
		}
		
		let pathFinder;
		if (method === "A*greedy") {
			pathFinder = aStarBi(mygraph, {
				distance(fromNode, toNode, link) {
				return link.data.weight;
				}
		});
		} else if (method === "A*") {
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
		path = pathFinder.find(key_one, key_two);
		distanceGraph = get_distanche_from_path(mygraph, path);
		
		if (bUseInfluence) {
			let links = [];
			mygraph.forEachLinkedNode(key_one, function(linkedNode, link){
				if (link.fromId === key_one && link.toId === key_two || link.fromId === key_two && link.toId === key_one) {
					links.push(link);
				}
			});
			let i = links.length;
			while (i--){
				let ilink = links[i];
				if (ilink.data.absoluteWeight) {
					influenceDistanceGraph += ilink.data.absoluteWeight; // Called absolute because it's added to the total distance!
					// console.log(key_one +" -> " + key_two + " - " + influenceDistanceGraph);
				}
			}
		}
		return [distanceGraph, influenceDistanceGraph];
}

// Finds distance between two sets of nodes
// It's recommended to cache the mean distance too when sets are repeated frequently
// and only call calcMeanDistance if needed
if (typeof calcMeanDistance === 'undefined') {
	if (typeof cacheLink === 'undefined') {
		var cacheLink = new Map();
	}
	var calcMeanDistance = function calcMeanDistance(mygraph, style_genre_reference, style_genre_new) {
		let map_distance = Infinity;
		const difference = style_genre_reference.difference(style_genre_new);
		if (style_genre_reference.size === 0 || style_genre_new.size === 0) { // When no tags are available, sets are empty & tracks are not connected
			map_distance = Infinity;
		} else { // With non-empty sets
			if (!difference.size) { // If style_genre_new is superset of style_genre_reference.
				map_distance = 0;
			} else {
				let influenceDistance = 0;
				for (let style_genre of difference) { // No need to check for those already matched. We are making an assumption here... i.e. that A genre has zero distance to only one value: A. But not to multiple ones: A, B, etc. That possibility is given by zero weight substitutions, but in that case 'calc_map_distance' will output a zero distance too.
					let setMin = Infinity;
					for (let style_genreNew of style_genre_new) { // But we need the entire set of new genre/styles to check lowest distance
						let jh_distance = Infinity; // We consider points are not linked by default
						let jh_influenceDistance = 0;
						let bfoundcache = false;
						const id = [style_genre, style_genreNew].sort().join('-'); // A-B and B-A are the same link
						if (cacheLink.has(id)) { //style_genre_new changes more, so first one...
							const jh_link = cacheLink.get(id);
							jh_distance = jh_link.distance;
							jh_influenceDistance = jh_link.influenceDistance;
							bfoundcache = true;
						} 
						if (!bfoundcache) { // Calc distances not found at cache. This is the heaviest part of the calc.
							[jh_distance, jh_influenceDistance] = calc_map_distance(mygraph, style_genre, style_genreNew, true); 
							//Graph is initialized at startup
							cacheLink.set([style_genre, style_genreNew].sort().join('-'), {distance: jh_distance , influenceDistance: jh_influenceDistance}); // Sorting removes the need to check A-B and B-A later...
						}
						if (jh_distance < setMin) {setMin = jh_distance;}
						if (jh_influenceDistance !== 0) {influenceDistance += jh_influenceDistance;}
					}
					if (setMin < Infinity) { //Get the minimum distance of the entire set
						if (map_distance === Infinity) { // If points were not linked before
								map_distance = setMin;
						} else { // else sum the next minimum
							map_distance += setMin;
							if (map_distance === Infinity) {break;}
						}
					}
				}
				if (map_distance < Infinity) { // If they are linked
					map_distance += influenceDistance; // Adds positive/negative influence distance ("negative" means nearer...)
					map_distance /= style_genre_new.size;  // mean distance
					map_distance = round(map_distance,1); // And rounds the final value
					if (map_distance < 0) {map_distance = 0;} // Safety check, since influence may lower values below zero
				}
			}
		}
		return map_distance;
	};
	
	// Same than V1 but also checks for exclusions and arrays
	var calcMeanDistanceV2 = function calcMeanDistanceV2(mygraph, style_genre_reference, style_genre_new) {
		// Convert to sets if needed
		if (Array.isArray(style_genre_reference)) {style_genre_reference = new Set(style_genre_reference);}
		if (Array.isArray(style_genre_new)) {style_genre_new = new Set(style_genre_new);}
		// Remove excluded styles
		const map_distance_exclusions = music_graph_descriptors.map_distance_exclusions;
		style_genre_reference = style_genre_reference.difference(map_distance_exclusions);
		style_genre_new = style_genre_new.difference(map_distance_exclusions);
		// And calc
		return calcMeanDistance(mygraph, style_genre_reference, style_genre_new);
	};
}

/*
	Precompute
*/

// Finds distance between all nodes on map. Returns a map with {distance, influenceDistance} and keys 'nodeA-nodeB'.
function calcCacheLinkAll(mygraph, limit = -1) {
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
				let [ij_distance, ij_antinfluenceDistance] = calc_map_distance(mygraph, node_list[i], node_list[j], true);
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
function calcCacheLinkSG(mygraph, limit = -1) {
		let cache = new Map();
		let node_list = [];
		
		node_list = [...new Set(music_graph_descriptors.style_supergenre.flat(2))]; // all values without duplicates

		let node_list_length = node_list.length;
		let i = 0;
		while (i < node_list_length){
			let j = i + 1;
			while (j < node_list_length){
				let [ij_distance, ij_antinfluenceDistance] = calc_map_distance(mygraph, node_list[i], node_list[j], true);
				if (limit === -1 || ij_distance <= limit) {
					cache.set(node_list[i]+ '-' + node_list[j], {distance: ij_distance, influenceDistance: ij_antinfluenceDistance});
				}
				j++;
			}
			i++;
		}
		return cache;
}

/*
	Path info
*/

function getAntiInfluences(genreStyle) {
	const doubleIndex = music_graph_descriptors.style_anti_influence.flat().indexOf(genreStyle);
	const index = !(doubleIndex & 1) ? doubleIndex / 2 : -1; // -1 for odd indexes, halved for even values
	if (index != -1) {
		return music_graph_descriptors.style_anti_influence[index][1];
	}
	return [];
}

function getInfluences(genreStyle) {
	const doubleIndex = music_graph_descriptors.style_primary_origin.flat().indexOf(genreStyle);
	const index = !(doubleIndex & 1) ? doubleIndex / 2 : -1; // -1 for odd indexes, halved for even values
	if (index != -1) {
		return music_graph_descriptors.style_primary_origin[index][1];
	}
	return [];
}

//Gets array of nodes on the path
function get_nodes_from_path(graph, path) {
		if (!path.length) {return 'No Path';}
		let idpath = path[0].id;
		let path_length = path.length;
		let i;
		for (i = 1; i < path_length;i++) {
			idpath += " <- " + path[i].id;
		}
		return idpath;
}

/*
	Other helpers
*/

// To capitalize nodes if using standard descriptors
function capitalize(s) {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function capitalizeAll(s, sep = ' ') {
  if (typeof s !== 'string') return '';
  return s.split(sep).map( (subS) => {return subS.charAt(0).toUpperCase() + subS.slice(1);}).join(sep); // Split, capitalize each subString and join
}