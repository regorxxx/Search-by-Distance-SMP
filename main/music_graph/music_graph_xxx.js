'use strict';
//07/08/24

/* exported musicGraphForDrawing, graphDebug, graphStatistics */

// Required since this script is loaded on browsers for drawing too!

if (typeof include !== 'undefined') { // On foobar2000
	include('..\\..\\helpers-external\\ngraph\\ngraph.graph.js');
	/* global createGraph:readable */
	include('music_graph_descriptors_xxx.js');
	/* global music_graph_descriptors:readable */
	include('music_graph_descriptors_xxx_helper.js');
	include('..\\..\\helpers\\helpers_xxx.js');
	/* global folders:readable, globTags:readable */
	include('..\\..\\helpers\\helpers_xxx_prototypes.js');
	/* global _t:readable */
	include('..\\..\\helpers\\helpers_xxx_statistics.js');
	/* global zScoreToProbability:readable */
	let userDescriptor = folders.userHelpers + 'music_graph_descriptors_xxx_user.js';
	if (utils.IsFile(userDescriptor)) {
		try {
			include(userDescriptor);
			console.log('User\'s music_graph_descriptors - File loaded: ' + userDescriptor);
		} catch (e) {
			console.log('Error loading user\'s music_graph_descriptors. Using default file instead.');
		}
	}
	/* global sbd:readable, calcGraphDistance:readable, getNodesFromPath:readable, calcCacheLinkSGV2:readable */
} else { // On browsers
	// vivagraph.min.js must be loaded within HTML
	// music_graph_descriptors_xxx (and the user set file) too!
	console.log('\'music_graph_xxx\' script is being used on browser. Omitting \'include\' clause.');
	/* global Viva:readable */
}


/*
	Creates Music Map links for foobar2000
*/
function musicGraph(descriptor = music_graph_descriptors, bHtml = false) {
	// Maps
	const style_supergenre_supercluster = descriptor.style_supergenre_supercluster;
	const style_supergenre_cluster = descriptor.style_supergenre_cluster;
	const style_supergenre = descriptor.style_supergenre;
	const style_cluster = descriptor.style_cluster;
	const style_primary_origin = descriptor.style_primary_origin;
	const style_secondary_origin = descriptor.style_secondary_origin;
	const style_anti_influence = descriptor.style_anti_influence;
	const style_weak_substitutions = descriptor.style_weak_substitutions;
	const style_substitutions =  descriptor.style_substitutions;
	// Weights
	const primary_origin = descriptor.primary_origin;
	const secondary_origin = descriptor.secondary_origin;
	const weak_substitutions = descriptor.weak_substitutions;
	const cluster = descriptor.cluster;
	const intra_supergenre = descriptor.intra_supergenre;
	const supergenre_cluster = descriptor.supergenre_cluster;
	const supergenre_supercluster = descriptor.supergenre_supercluster;
	const inter_supergenre = descriptor.inter_supergenre;
	const inter_supergenre_supercluster = descriptor.inter_supergenre_supercluster;
	const substitutions = descriptor.substitutions;
	const anti_influence = descriptor.anti_influence;
	const primary_origin_influence = descriptor.primary_origin_influence;
	const secondary_origin_influence = descriptor.secondary_origin_influence;

	//Create and fill graph with links (and nodes)
	let mygraph;
	try { // Safety check
		mygraph = createGraph();
	} catch (e) {
		mygraph = Viva.Graph.graph();
		if (!bHtml) {
			console.log('Warning: musicGraph() used within html. You should use musicGraphForDrawing() instead! (Unless this is a call from graphDebug())');
		}
	}
	let i, j, h;
	let superGenreSets = [];

	const style_primary_origin_length = style_primary_origin.length;
	for (i = 0; i < style_primary_origin_length; i++) {
		let sub_lenght = style_primary_origin[i][1].length;
		for (j = 0; j < sub_lenght; j++) {
			mygraph.addLink(style_primary_origin[i][0], style_primary_origin[i][1][j], {weight: primary_origin, absoluteWeight: 0});
		}
	}

	const style_secondary_origin_length = style_secondary_origin.length;
	for (i = 0; i < style_secondary_origin_length; i++) {
		let sub_lenght = style_secondary_origin[i][1].length;
		for (j = 0; j < sub_lenght; j++) {
			mygraph.addLink(style_secondary_origin[i][0], style_secondary_origin[i][1][j], {weight: secondary_origin, absoluteWeight: 0});
		}
	}

	const style_weak_substitutions_length = style_weak_substitutions.length;
	for (i = 0; i < style_weak_substitutions_length; i++) {
		let sub_lenght = style_weak_substitutions[i][1].length;
		for (j = 0; j < sub_lenght; j++) {
			mygraph.addLink(style_weak_substitutions[i][0], style_weak_substitutions[i][1][j], {weight: weak_substitutions, absoluteWeight: 0});
		}
	}

	const style_cluster_length = style_cluster.length;
	for (i = 0; i < style_cluster_length; i++) {
		let sub_lenght = style_cluster[i][1].length;
		for (j = 0; j < sub_lenght; j++) {
			mygraph.addLink(style_cluster[i][0], style_cluster[i][1][j], {weight: cluster, absoluteWeight: 0});
		}
	}

	const style_supergenre_length = style_supergenre.length;
	for (i = 0; i < style_supergenre_length; i++) {
		superGenreSets[i] = new Set(style_supergenre[i][1]); // For later use
		let sub_lenght = style_supergenre[i][1].length;
		for (j = 0; j < sub_lenght; j++) {
			mygraph.addLink(style_supergenre[i][0], style_supergenre[i][1][j], {weight: intra_supergenre, absoluteWeight: 0});
		}
	}

	const style_supergenre_cluster_length = style_supergenre_cluster.length;
	let style_supergenre_cluster_break = style_supergenre_cluster_length;
	for (i = 0; i < style_supergenre_cluster_length; i++) {
		if(style_supergenre_cluster[i][0] === 'SKIP' ) {
			style_supergenre_cluster_break = i; //Save for later
			continue;
		}
		let sub_lenght = style_supergenre_cluster[i][1].length;
		for (j = 0; j < sub_lenght; j++) {
			mygraph.addLink(style_supergenre_cluster[i][0], style_supergenre_cluster[i][1][j], {weight: supergenre_cluster, absoluteWeight: 0});
		}
	}

	const style_supergenre_supercluster_length = style_supergenre_supercluster.length;
	for (i = 0; i < style_supergenre_supercluster_length; i++) {
		let sub_lenght = style_supergenre_supercluster[i][1].length;
		for (j = 0; j < sub_lenght; j++) {
			mygraph.addLink(style_supergenre_supercluster[i][0], style_supergenre_supercluster[i][1][j], {weight: supergenre_supercluster, absoluteWeight: 0});
		}
	}

	for (i = 0, j = 1; i < style_supergenre_cluster_break; i++, j++) { //We skip anything past the break point saved before
		//Join supergenres clusters in circle: last one is next to first one
		if (j === style_supergenre_cluster_break) {j = 0;} // NOSONAR [intended]
		mygraph.addLink(style_supergenre_cluster[i][0], style_supergenre_cluster[j][0], {weight: inter_supergenre, absoluteWeight: 0});
	}

	//Join music groups in circle: last one (4th) is next to first one (1th). We omit anything past that point!
	mygraph.addLink(style_supergenre_supercluster[0][0], style_supergenre_supercluster[1][0], {weight: inter_supergenre_supercluster, absoluteWeight: 0});
	mygraph.addLink(style_supergenre_supercluster[1][0], style_supergenre_supercluster[2][0], {weight: inter_supergenre_supercluster, absoluteWeight: 0});
	mygraph.addLink(style_supergenre_supercluster[2][0], style_supergenre_supercluster[3][0], {weight: inter_supergenre_supercluster, absoluteWeight: 0});
	mygraph.addLink(style_supergenre_supercluster[3][0], style_supergenre_supercluster[0][0], {weight: inter_supergenre_supercluster, absoluteWeight: 0});

	const style_substitutions_length = style_substitutions.length;
	for (i = 0; i < style_substitutions_length; i++) {
		let sub_lenght = style_substitutions[i][1].length;
		for (j = 0; j < sub_lenght; j++) {
			mygraph.addLink(style_substitutions[i][0], style_substitutions[i][1][j], {weight: substitutions, absoluteWeight: 0});
		}
	}

	// Anti-influences
	// We put an arbitrary high weight so this path is never taken for considering distance. Only the absoluteWeight will be considered after finding the shortest path!
	const style_anti_influence_length = style_anti_influence.length;
	for (i = 0; i < style_anti_influence_length; i++) {
		let sub_lenght = style_anti_influence[i][1].length;
		for (j = 0; j < sub_lenght; j++) {
			mygraph.addLink(style_anti_influence[i][0], style_anti_influence[i][1][j], {weight: Infinity, absoluteWeight: anti_influence});
		}
	}

	// Primary-Origin influences
	// Same than Anti-influences but applied only to style_primary_origin links and both nodes must be on the same SuperGenre set...
	if (primary_origin_influence) {
		for (i = 0; i < style_primary_origin_length; i++) {
			let sub_lenght = style_primary_origin[i][1].length;
			for (j = 0; j < sub_lenght; j++) {
				for (h = 0; h < style_supergenre_length; h++) {
					if (superGenreSets[h].has(style_primary_origin[i][0]) && superGenreSets[h].has(style_primary_origin[i][1][j])) {
						mygraph.addLink(style_primary_origin[i][0], style_primary_origin[i][1][j], {weight: Infinity, absoluteWeight: primary_origin_influence});
					}
				}
			}
		}
	}

	// Secondary-Origin influences
	// Same than Primary-Origin influences for style_secondary origin links
	if (secondary_origin_influence) {
		for (i = 0; i < style_secondary_origin_length; i++) {
			let sub_lenght = style_secondary_origin[i][1].length;
			for (j = 0; j < sub_lenght; j++) {
				for (h = 0; h < style_supergenre_length; h++) {
					if (superGenreSets[h].has(style_secondary_origin[i][0]) && superGenreSets[h].has(style_secondary_origin[i][1][j])) {
						mygraph.addLink(style_secondary_origin[i][0], style_secondary_origin[i][1][j], {weight: Infinity, absoluteWeight: secondary_origin_influence});
					}
				}
			}
		}
	}

	return mygraph;
}

/*
	Creates Music Map. This one skips absoluteWeight related links and substitutions! Used along VivaGraph on browsers
*/
function musicGraphForDrawing(descriptor = music_graph_descriptors) {
	// Maps
	const style_supergenre_supercluster = descriptor.style_supergenre_supercluster;
	const style_supergenre_cluster = descriptor.style_supergenre_cluster;
	const style_supergenre = descriptor.style_supergenre;
	const style_cluster = descriptor.style_cluster;
	const style_primary_origin = descriptor.style_primary_origin;
	const style_secondary_origin = descriptor.style_secondary_origin;
	const style_weak_substitutions = descriptor.style_weak_substitutions;
	// Not used on drawing: descriptor.style_substitutions
	// Weights
	const primary_origin = descriptor.primary_origin;
	const secondary_origin = descriptor.secondary_origin;
	const weak_substitutions = descriptor.weak_substitutions;
	const cluster = descriptor.cluster;
	const intra_supergenre = descriptor.intra_supergenre;
	const supergenre_cluster = descriptor.supergenre_cluster;
	const supergenre_supercluster = descriptor.supergenre_supercluster;
	const inter_supergenre = descriptor.inter_supergenre;
	const inter_supergenre_supercluster = descriptor.inter_supergenre_supercluster;
	// Not used on drawing: descriptor.substitutions
	// Drawing
	const nodeSize = descriptor.nodeSize;
	const nodeShape = descriptor.nodeShape;
	const nodeImageLink = descriptor.nodeImageLink;

	const style_clusterSize = descriptor.style_clusterSize;
	const style_clusterShape = descriptor.style_clusterShape;
	const style_clusterImageLink = descriptor.style_clusterImageLink;

	const style_supergenreSize = descriptor.style_supergenreSize;
	const style_supergenreShape = descriptor.style_supergenreShape;
	const style_supergenreImageLink = descriptor.style_supergenreImageLink;

	const style_supergenre_clusterSize = descriptor.style_supergenre_clusterSize;
	const style_supergenre_clusterShape = descriptor.style_supergenre_clusterShape;
	const style_supergenre_clusterImageLink = descriptor.style_supergenre_clusterImageLink;

	const style_supergenre_superclusterSize = descriptor.style_supergenre_superclusterSize;
	const style_supergenre_superclusterShape = descriptor.style_supergenre_superclusterShape;
	const style_supergenre_superclusterImageLink = descriptor.style_supergenre_superclusterImageLink;

	const map_colors = new Map(music_graph_descriptors.map_colors);

	let mygraph;

	try { // Safety check
		mygraph = Viva.Graph.graph();
	} catch (e) {
		mygraph = createGraph();
		console.log('Warning: musicGraphForDrawing() used within foobar2000. You should use musicGraph() instead!');
	}

	//Create and fill graph with links (and nodes)
	let i , j;

	const style_supergenre_length = style_supergenre.length;
	for (i = 0; i < style_supergenre_length; i++) { //nodes
		let sub_lenght = style_supergenre[i][1].length;
		for (j = 0; j < sub_lenght; j++) {
			mygraph.addLink(style_supergenre[i][0], style_supergenre[i][1][j], {weight: intra_supergenre, absoluteWeight: 0, lineshape: [], linecolor: ['stroke', map_colors.get(style_supergenre[i][0])]});
			mygraph.addNode(style_supergenre[i][1][j], {shape: nodeShape, size: nodeSize, imageLink: nodeImageLink, color: map_colors.get(style_supergenre[i][0])});
		}
	}

	const style_supergenre_cluster_length = style_supergenre_cluster.length;
	let style_supergenre_cluster_break = style_supergenre_cluster_length;
	for (i = 0; i < style_supergenre_cluster_length; i++) { //Supergenre Cluster
		if(style_supergenre_cluster[i][0] === 'SKIP' ) {
			style_supergenre_cluster_break = i; //Save for later
			continue;
		}
		let sub_lenght = style_supergenre_cluster[i][1].length;
		for (j = 0; j < sub_lenght; j++) {
			mygraph.addLink(style_supergenre_cluster[i][0], style_supergenre_cluster[i][1][j], {weight: supergenre_cluster, absoluteWeight: 0, lineshape: [], linecolor: ['stroke', map_colors.get(style_supergenre_cluster[i][1][j])]});
			mygraph.addNode(style_supergenre_cluster[i][1][j], {shape: style_supergenreShape, size: style_supergenreSize, imageLink: style_supergenreImageLink, color: map_colors.get(style_supergenre_cluster[i][1][j])});
		}
		//Adds cluster size and color
		mygraph.addNode(style_supergenre_cluster[i][0], {shape: style_supergenre_clusterShape, size: style_supergenre_clusterSize, imageLink: style_supergenre_clusterImageLink, color: map_colors.get(style_supergenre_cluster[i][0])});
	}

	const style_cluster_length = style_cluster.length;
	for (i = 0; i < style_cluster_length; i++) { //Style cluster
		let sub_lenght = style_cluster[i][1].length;
		let color = 'white';
		for (j = 0; j < sub_lenght; j++) {
			if (typeof mygraph.getNode(style_cluster[i][1][j]) !== 'undefined' && typeof mygraph.getNode(style_cluster[i][1][j]).data !== 'undefined' && typeof mygraph.getNode(style_cluster[i][1][j]).data.color !== 'undefined') {color = mygraph.getNode(style_cluster[i][1][j]).data.color;}
			mygraph.addLink(style_cluster[i][0], style_cluster[i][1][j], {weight: cluster, absoluteWeight: 0, lineshape: [], linecolor: ['stroke', color]});
		}
		mygraph.addNode(style_cluster[i][0], {shape: style_clusterShape, size: style_clusterSize, imageLink: style_clusterImageLink, color});
	}

	const style_weak_substitutions_length = style_weak_substitutions.length;
	for (i = 0; i < style_weak_substitutions_length; i++) { //Weak Substitutions
		let sub_lenght = style_weak_substitutions[i][1].length;
		let color = 'white';
		for (j = 0; j < sub_lenght; j++) {
			if (typeof mygraph.getNode(style_weak_substitutions[i][1][j]) !== 'undefined' && typeof mygraph.getNode(style_weak_substitutions[i][1][j]).data !== 'undefined' && typeof mygraph.getNode(style_weak_substitutions[i][1][j]).data.color !== 'undefined') {color = mygraph.getNode(style_weak_substitutions[i][1][j]).data.color;}
			mygraph.addLink(style_weak_substitutions[i][0], style_weak_substitutions[i][1][j], {weight: weak_substitutions, absoluteWeight: 0, lineshape: [], linecolor: ['stroke', color]});
		}
	}

	const style_primary_origin_length = style_primary_origin.length;
	for (i = 0; i < style_primary_origin_length; i++) { //Primary origin
		let sub_lenght = style_primary_origin[i][1].length;
		let color = 'white';
		for (j = 0; j < sub_lenght; j++) {
			if (typeof mygraph.getNode(style_primary_origin[i][1][j]) !== 'undefined' && typeof mygraph.getNode(style_primary_origin[i][1][j]).data !== 'undefined' && typeof mygraph.getNode(style_primary_origin[i][1][j]).data.color !== 'undefined') {color = mygraph.getNode(style_primary_origin[i][1][j]).data.color;}
			mygraph.addLink(style_primary_origin[i][0], style_primary_origin[i][1][j], {weight: primary_origin, absoluteWeight: 0, lineshape: ['stroke-dasharray', '3, 3'], linecolor: ['stroke', color]});
		}
	}

	const style_secondary_origin_length = style_secondary_origin.length;
	for (i = 0; i < style_secondary_origin_length; i++) { //Secondary origin
		let sub_lenght = style_secondary_origin[i][1].length;
		let color = 'white';
		for (j = 0; j < sub_lenght; j++) {
			if (typeof mygraph.getNode(style_secondary_origin[i][1][j]) !== 'undefined' && typeof mygraph.getNode(style_secondary_origin[i][1][j]).data !== 'undefined' && typeof mygraph.getNode(style_secondary_origin[i][1][j]).data.color !== 'undefined') {color = mygraph.getNode(style_secondary_origin[i][1][j]).data.color;}
			mygraph.addLink(style_secondary_origin[i][0], style_secondary_origin[i][1][j], {weight: secondary_origin, absoluteWeight: 0, lineshape: ['stroke-dasharray', '4, 4'], linecolor: ['stroke', color]});
		}
	}

	const style_supergenre_supercluster_length = style_supergenre_supercluster.length;
	for (i = 0; i < style_supergenre_supercluster_length; i++) { //Music clusters
		let sub_lenght = style_supergenre_supercluster[i][1].length;
		for (j = 0; j < sub_lenght; j++) {
			mygraph.addLink(style_supergenre_supercluster[i][0], style_supergenre_supercluster[i][1][j], {weight: supergenre_supercluster, absoluteWeight: 0, lineshape: ['stroke-dasharray', '7, 7'], linecolor: ['stroke', map_colors.get(style_supergenre_supercluster[i][1][j])]});
		}
		//Adds cluster size and color
		mygraph.addNode(style_supergenre_supercluster[i][0], {shape: style_supergenre_superclusterShape, size: style_supergenre_superclusterSize, imageLink: style_supergenre_superclusterImageLink, color: map_colors.get(style_supergenre_supercluster[i][0])});
	}

	for (i = 0, j = 1; i < style_supergenre_cluster_break; i++, j++) { //We skip anything past the break point saved before
		//Join supergenres clusters in circle: last one is next to first one
		if (j === style_supergenre_cluster_break) {j = 0;} // NOSONAR [intended]
		mygraph.addLink(style_supergenre_cluster[i][0], style_supergenre_cluster[j][0], {weight: inter_supergenre, absoluteWeight: 0, lineshape: ['stroke-dasharray', '5, 5'], linecolor: ['stroke', map_colors.get(style_supergenre_cluster[0][0])]});
	}

	// Join music groups in circle: last one (4th) is next to first one (1th). We omit anything past that point!
	mygraph.addLink(style_supergenre_supercluster[0][0], style_supergenre_supercluster[1][0], {weight: inter_supergenre_supercluster, absoluteWeight: 0, lineshape: ['stroke-dasharray', '10, 10'], linecolor: ['stroke', map_colors.get(style_supergenre_supercluster[0][0])]});
	mygraph.addLink(style_supergenre_supercluster[1][0], style_supergenre_supercluster[2][0], {weight: inter_supergenre_supercluster, absoluteWeight: 0, lineshape: ['stroke-dasharray', '10, 10'], linecolor: ['stroke', map_colors.get(style_supergenre_supercluster[1][0])]});
	mygraph.addLink(style_supergenre_supercluster[2][0], style_supergenre_supercluster[3][0], {weight: inter_supergenre_supercluster, absoluteWeight: 0, lineshape: ['stroke-dasharray', '10, 10'], linecolor: ['stroke', map_colors.get(style_supergenre_supercluster[2][0])]});
	mygraph.addLink(style_supergenre_supercluster[3][0], style_supergenre_supercluster[0][0], {weight: inter_supergenre_supercluster, absoluteWeight: 0, lineshape: ['stroke-dasharray', '10, 10'], linecolor: ['stroke', map_colors.get(style_supergenre_supercluster[3][0])]});
	// Join Folk with Pop/rock Music
	mygraph.addLink(style_supergenre_supercluster[1][0], style_supergenre_supercluster[4][0], {weight: inter_supergenre_supercluster, absoluteWeight: 0, lineshape: ['stroke-dasharray', '10, 10'], linecolor: ['stroke', map_colors.get(style_supergenre_supercluster[4][0])]});
	// Join Classical with Electronic Music
	mygraph.addLink(style_supergenre_supercluster[3][0], style_supergenre_supercluster[5][0], {weight: inter_supergenre_supercluster, absoluteWeight: 0, lineshape: ['stroke-dasharray', '10, 10'], linecolor: ['stroke', map_colors.get(style_supergenre_supercluster[5][0])]});

	return mygraph;
}

/*
	Extensive graph checking for debugging. Use this along the html rendering to check there are no duplicates, wrong links set, not connected nodes, typos, etc.
	Unoptimized code on multiple loops since this should be run only on demand for testing once on a while...
*/
function graphDebug(graph = musicGraph(), bShowPopupOnPass = false, bHtml = false) {
	console.log('music_graph_descriptors_xxx: Basic debug enabled');
	let bWarning = false;
	const descr = music_graph_descriptors;

	graph.forEachNode(function(node){
		if (typeof node.links === 'undefined' || node.links === null) {  // Check for not connected nodes
			console.log('music_graph_descriptors_xxx Warning: ' + node.id + ' is not connected to any other node');
			bWarning = true;
		}
	});

	let influenceLinks = new Set();
	let zeroLinks = new Set();
	graph.forEachLink(function(link){
		if (link.fromId === link.toId) { // Check for nodes connected to their-selves
			console.log('music_graph_descriptors_xxx Warning: ' + link.fromId + ' has a link to ' + link.fromId + ' with distance equal to ' + link.data.weight + ' and influence modifier equal to ' + link.data.absoluteWeight);
			bWarning = true;
		}
		if (link.data.absoluteWeight !== 0) { // Stores links with influence values
			influenceLinks.add(link.fromId + '-' + link.toId);
		}
		if (link.data.weight === 0) { // Stores links with zero distance
			zeroLinks.add(link.fromId + '-' + link.toId);
		}
	});
	// Check keys
	const checkKeys = ['distance_keys', 'substitution_keys', 'influences_keys'].map((group) => {
		return {group, pass: descr[group].every((key) => Object.hasOwn(descr, key))};
	});
	if (!checkKeys.every((o) => o.pass)) {
		console.log('music_graph_descriptors_xxx Warning: \'' + checkKeys.filter((o) => !o.pass).map((o) => o.group) + '\' has keys not found on the descriptor. Check \'Weighting, for Graph Creation\' section');
		bWarning = true;
	}
	if (!['weak_substitutions', 'substitutions'].every((k) => descr.substitution_keys.includes(k))) {
		console.log('music_graph_descriptors_xxx Warning: \'substitution_keys\' is missing special \'weak_substitutions\' or \'substitutions\' keys. Check \'Weighting, for Graph Creation\' section');
		bWarning = true;
	}
	if (!['weak_substitutions', 'substitutions'].every((k) => Object.hasOwn(descr, k))) {
		console.log('music_graph_descriptors_xxx Warning: descriptors are missing special \'weak_substitutions\' or \'substitutions\' keys. Check \'Weighting, for Graph Creation\' section');
		bWarning = true;
	}
	// Check for links with zero distance but non zero influence values
	// Usually fires if you add A as substitution to B but also add A as primary/secondary origin to B. Or as anti-influence.
	const wrongLinks = influenceLinks.intersection(zeroLinks); // This one requires music_graph_html_xxx.js when loaded within html!
	if (wrongLinks.size !== 0) {
		console.log('music_graph_descriptors_xxx Warning: there are some links with distance equal to 0 but a non zero influence distance modifier.\n' + '	' + [...wrongLinks].join(', '));
		bWarning = true;
	}
	// Standard keys >= 0
	const keysToCheck = [...descr.distance_keys, 'weak_substitutions']
		.filter((k) => Object.hasOwn(descr, k));
	let sumDistances = 0;
	for (let key of keysToCheck){
		if (!descr[key]) { // Check for zero valued keys
			console.log('music_graph_descriptors_xxx Warning: ' + key + ' has a value of zero. Check \'Weighting, for Foobar2000\' section');
			bWarning = true;
		} else if (!Number.isFinite(descr[key])) { // Check for infinity valued keys
			console.log('music_graph_descriptors_xxx Warning: ' + key + 'has a value of Infinite. Check \'Weighting, for Foobar2000\' section');
			bWarning = true;
		} else if (descr[key] < 0) { // Check for less than zero valued keys
			console.log('music_graph_descriptors_xxx Warning: ' + key + 'has a value less than zero wich breacks distance calculation. Check \'Weighting, for Foobar2000\' section');
			bWarning = true;
		}
		sumDistances += descr[key];
	}
	if (!Number.isFinite(sumDistances)) { // Check the sum of the keys
		console.log('music_graph_descriptors_xxx Warning: ' + keysToCheck.join(', ') + ' sum zero or Infinite. Check \'Weighting, for Foobar2000\' section');
		bWarning = true;
	}
	// Special keys
	const otherKeysToCheck = [...descr.influences_keys, 'substitutions']
		.filter((k) => Object.hasOwn(descr, k));
	for (let key of otherKeysToCheck){
		if (!descr[key] && key !== 'substitutions') { // Check for zero valued keys
			console.log('music_graph_descriptors_xxx Warning: ' + key + ' has a value of zero. Check \'Weighting, for Foobar2000\' section');
			bWarning = true;
		} else if (!Number.isFinite(descr[key])) { // Check for infinity valued keys
			console.log('music_graph_descriptors_xxx Warning: ' + key + 'has a value of Infinite. Check \'Weighting, for Foobar2000\' section');
			bWarning = true;
		}
	}
	if (descr['substitutions'] < 0) { // Check substitutions >= 0
		console.log('music_graph_descriptors_xxx Warning: \'substitutions\' has a value lower than zero, which may break the graph functionality. Check \'Weighting, for Foobar2000\' section');
		bWarning = true;
	} else if (descr['substitutions'] > 0) { // Check substitutions = 0
		console.log('music_graph_descriptors_xxx Warning: \'substitutions\' has a value greater than zero, use \'weak_substitutions\' for that. Check \'Weighting, for Foobar2000\' section');
		bWarning = true;
	}
	if (descr['anti_influence'] < 0) { // Check anti_influence >= 0
		console.log('music_graph_descriptors_xxx Warning: \'anti_influence\' has a value lower than zero, which may break the graph functionality. Check \'Weighting, for Foobar2000\' section');
		bWarning = true;
	}
	if (descr['primary_origin_influence'] > 0 || descr['secondary_origin_influence'] > 0) { // Check influences <= 0
		console.log('music_graph_descriptors_xxx Warning: \'primary_origin_influence\' or \'secondary_origin_influence\' has a value greater than zero, use \'anti_influence\' for that. Check \'Weighting, for Foobar2000\' section');
		bWarning = true;
	}
	if (descr['cluster'] > descr['intra_supergenre'] || descr['intra_supergenre'] < descr['supergenre_cluster'] || descr['supergenre_cluster'] > descr['supergenre_supercluster'] ||  descr['intra_supergenre'] > descr['inter_supergenre'] || descr['inter_supergenre_supercluster'] < descr['inter_supergenre']) { // Check weight values follow some logic
		console.log('music_graph_descriptors_xxx Warning: Check distance values, they don\'t follow expected logic. Check \'Weighting, for Foobar2000\' section\n'
		+ '	' + 'cluster < intra_supergenre & inter_supergenre> intra_supergenre > supergenre_supercluster > supergenre_cluster\n'
		+ '	' + 'Not true: ' + descr['cluster'] + '<' + descr['intra_supergenre'] + ' & ' + descr['inter_supergenre'] + '<' + descr['intra_supergenre'] + '<' + descr['supergenre_supercluster'] + '<' + descr['supergenre_cluster']);
		bWarning = true;
	}
	// Check that all weak substitutions terms are also on any superGenre (otherwise we are creating another layer of nodes)
	let bFound;
	const superGenreNumbers = descr.style_supergenre.length;
	descr.style_weak_substitutions.forEach((nodePair) => {
		{
			let node = nodePair[0];
			bFound = false;
			for (let i = superGenreNumbers; i--;) {
				if (descr.style_supergenre[i].flat(Infinity).indexOf(node) !== -1) {bFound = true;}
				if (bFound) {break;}
			}
			if (!bFound) {
				console.log('music_graph_descriptors_xxx Warning: \'style_weak_substitutions\' has nodes not found on \'style_supergenre\'. Check \'Graph nodes and links\' section\n' + '	' +  node);
				bWarning = true;
			}
		}
		const nodeNumbers = nodePair[1].length;
		for (let i = nodeNumbers; i--;) {
			let node = nodePair[1][i];
			bFound = false;
			for (let j = superGenreNumbers; j--;) {
				if (descr.style_supergenre[j].flat(Infinity).indexOf(node) !== -1) {bFound = true;}
				if (bFound) {break;}
			}
			if (!bFound) {
				console.log('music_graph_descriptors_xxx Warning: \'style_weak_substitutions\' has nodes not found on \'style_supergenre\'. Check \'Graph nodes and links\' section\n' + '	' +  node);
				bWarning = true;
			}
		}
	});
	// Check that all substitutions terms are also on any superGenre (otherwise we are creating a false node)
	const styleClusterNumbers = descr.style_cluster.length;
	const superGenreClusterNumbers = descr.style_supergenre_cluster.length;
	const superGenreSuperClusterNumbers = descr.style_supergenre_supercluster.length;
	descr.style_substitutions.forEach((nodePair) => {
		let node = nodePair[0];
		bFound = false;
		for (let i = superGenreNumbers; i--;) {
			if (bFound) {break;}
			if (descr.style_supergenre[i].flat(Infinity).indexOf(node) !== -1) {bFound = true;}
		}
		for (let i = styleClusterNumbers; i--;) {
			if (bFound) {break;}
			if (descr.style_cluster[i].flat(Infinity).indexOf(node) !== -1) {bFound = true;}
		}
		for (let i = superGenreClusterNumbers; i--;) {
			if (bFound) {break;}
			if (descr.style_supergenre_cluster[i].flat(Infinity).indexOf(node) !== -1) {bFound = true;}
		}
		for (let i = superGenreSuperClusterNumbers; i--;) {
			if (bFound) {break;}
			if (descr.style_supergenre_supercluster[i].flat(Infinity).indexOf(node) !== -1) {bFound = true;}
		}
		if (!bFound) {
			console.log('music_graph_descriptors_xxx Warning: \'style_substitutions\' has nodes not found on \'style_supergenre\'. Check \'Graph nodes and links\' section\n' + '	' +  node);
			bWarning = true;
		}
	});
	// Check that all nodes on style clusters are also on any superGenre (otherwise we are creating another layer of nodes)
	descr.style_cluster.forEach((nodePair) => {
		const nodeNumbers = nodePair[1].length;
		for (let i = nodeNumbers; i--;) {
			let node = nodePair[1][i];
			bFound = false;
			for (let j = superGenreNumbers; j--;) {
				if (descr.style_supergenre[j].flat(Infinity).indexOf(node) !== -1) {bFound = true;}
				if (bFound) {break;}
			}
			if (!bFound) { // May be a cluster linked to another cluster
				for (let i = styleClusterNumbers; i--;) {
					if (descr.style_cluster[i][0] === node) {bFound = true;}
					if (bFound) {break;}
				}
			}
			if (!bFound) {
				console.log('music_graph_descriptors_xxx Warning: \'style_cluster\' has nodes not found on \'style_supergenre\'. Check \'Graph nodes and links\' section\n' + '	' +  node);
				bWarning = true;
			}
		}
	});
	// Check that all nodes on influences are present in other descriptors
	descr.style_anti_influence.concat(descr.style_secondary_origin, descr.style_primary_origin).forEach( (nodePair) => {
		[...nodePair[1], nodePair[0]].forEach((node) => {
			bFound = false;
			for (let j = superGenreNumbers; j--;) {
				if (descr.style_supergenre[j].flat(Infinity).indexOf(node) !== -1) {bFound = true;}
				if (bFound) {break;}
			}
			if (!bFound) { // May be a style cluster
				for (let i = styleClusterNumbers; i--;) {
					if (descr.style_cluster[i][0] === node) {bFound = true;}
					if (bFound) {break;}
				}
			}
			if (!bFound) { // May be a superGenre
				for (let i = superGenreNumbers; i--;) {
					if (descr.style_supergenre[i][0] === node) {bFound = true;}
					if (bFound) {break;}
				}
			}
			if (!bFound) { // May be a superGenre Cluster
				for (let i = superGenreClusterNumbers; i--;) {
					if (descr.style_supergenre_cluster[i][0] === node) {bFound = true;}
					if (bFound) {break;}
				}
			}
			if (!bFound) { // May be a superGenre Cluster
				for (let i = superGenreSuperClusterNumbers; i--;) {
					if (descr.style_supergenre_supercluster[i][0] === node) {bFound = true;}
					if (bFound) {break;}
				}
			}
			if (!bFound) {
				console.log('music_graph_descriptors_xxx Warning: \'style_anti_influence\' or \'style_secondary_origin\' or \'style_primary_origin\' has nodes not found on any other descriptor. Check \'Graph nodes and links\' section\n' + '	' +  node);
				bWarning = true;
			}
		});
	});
	// Check that all superGenres are present in other descriptors
	descr.style_supergenre.forEach( (nodePair) => {
		let node = nodePair[0];
		bFound = false;
		for (let j = superGenreClusterNumbers; j--;) {
			if (descr.style_supergenre_cluster[j].flat(Infinity).indexOf(node) !== -1) {bFound = true;}
			if (bFound) {break;}
		}
		if (!bFound) { // May be a superGenre super Cluster
			for (let i = superGenreSuperClusterNumbers; i--;) {
				if (descr.style_supergenre_supercluster[i][0] === node) {bFound = true;}
				if (bFound) {break;}
			}
		}
		if (!bFound) {
			console.log('music_graph_descriptors_xxx Warning: \'style_supergenre\' has nodes not found on any other descriptor. Check \'Graph nodes and links\' section\n' + '	' +  node);
			bWarning = true;
		}
	});
	// Check that all superGenre Clusters are present in other descriptors
	descr.style_supergenre_cluster.forEach((nodePair) => {
		let node = nodePair[0];
		if (node === 'SKIP') {return;}
		bFound = false;
		for (let j = superGenreSuperClusterNumbers; j--;) {
			if (descr.style_supergenre_supercluster[j].flat(Infinity).indexOf(node) !== -1) {bFound = true;}
			if (bFound) {break;}
		}
		if (!bFound) {
			console.log('music_graph_descriptors_xxx Warning: \'style_supergenre_cluster\' has nodes not found on any other descriptor. Check \'Graph nodes and links\' section\n' + '	' +  node);
			bWarning = true;
		}
	});
	const _ALL_ = ['style_supergenre_supercluster', 'style_supergenre_cluster', 'style_supergenre', 'style_cluster', 'style_primary_origin', 'style_secondary_origin', 'style_anti_influence', 'style_weak_substitutions', 'style_substitutions'];
	{ // Check letter case
		const sep = /([ \-&/()]|'n'|\bD')/g; // Added parentheses so they are also included on the split array
		const otherRegEx = [[/\bXL\b/gi, 'XL'], [/\bEDM\b/gi, 'EDM'], [/\bNRG\b/gi, 'NRG'], [/\bUK\b/gi, 'UK'], [/\bIDM\b/gi, 'IDM'], [/\bar\b/gi, 'ar'], [/\bAM\b/gi, 'AM'], [/\bL\.A\. /gi, 'L.A. ']];
		const ommit = [/_cluster$/i];
		const allmusic = new Set(['New Wave of British Heavy Alternative Metal']);
		_ALL_.forEach((key) => {
			descr[key].forEach((nodePair) => {
				if (!nodePair || !Array.isArray(nodePair) || nodePair.length !== 2) {return;}
				const nodeList = nodePair[1];
				nodeList.forEach((node) => {
					let capNode = node.split(sep).map((subS) => {return subS.charAt(0).toUpperCase() + subS.slice(1).toLowerCase();}).join('');
					otherRegEx.forEach((rgex) => {capNode = capNode.replace(rgex[0], rgex[1]);});
					if (capNode !== node) {
						if (ommit.some((r) => r.test(node)) || allmusic.has(node)) {return;}
						console.log('music_graph_descriptors_xxx Warning: \'' + key + '\' has nodes not following standard letter case. Check \'Graph nodes and links\' section\n' + '	' +  nodePair[0] + ' -> ' + node);
						bWarning = true;
					}
				});
			});
		});
	}
	{ // Check ASCII compatibility
		const allmusic = new Set(['Nü Alternative Metal']);
		const asciiRegEx = [[/[\u0300-\u036f]/g, ''], [/\u0142/g, 'l']];
		_ALL_.forEach((key) => {
			descr[key].forEach((nodePair) => {
				if (!nodePair || !Array.isArray(nodePair) || nodePair.length !== 2) {return;}
				const nodeList = nodePair[1];
				nodeList.forEach((node) => {
					let asciiNode = node.normalize('NFD');
					asciiRegEx.forEach((rgex) => {asciiNode = asciiNode.replace(rgex[0], rgex[1]);});
					if (asciiNode !== node) {
						if (allmusic.has(node)) {return;}
						console.log('music_graph_descriptors_xxx Warning: \'' + key + '\' has nodes not compatible with ASCII. Check \'Graph nodes and links\' section\n' + '	' +  nodePair[0] + ' -> ' + node);
						bWarning = true;
					}
				});
			});
		});
	}
	{ // Check accents instead of single quotes
		const regEx = /[`´]/g;
		_ALL_.forEach((key) => {
			descr[key].forEach((nodePair) => {
				if (!nodePair || !Array.isArray(nodePair) || nodePair.length !== 2) {return;}
				const nodeList = nodePair[1];
				nodeList.forEach((node) => {
					if (node.search(regEx) !== -1) {
						console.log('music_graph_descriptors_xxx Warning: \'' + key + '\' has nodes not following single quote usage (\'). Check \'Graph nodes and links\' section\n' + '	' +  nodePair[0] + ' -> ' + node);
						bWarning = true;
					}
				});
			});
		});
	}
	// Check there are no duplicates
	_ALL_.forEach((key) => {
		descr[key].forEach((nodePair) => {
			if (!nodePair || !Array.isArray(nodePair) || nodePair.length !== 2) {return;}
			if (new Set(nodePair[1]).size !== nodePair[1].length) {
				console.log('music_graph_descriptors_xxx Warning: \'' + key + '\' has duplicated nodes. Check \'Graph nodes and links\' section\n' + '	' +  nodePair[0]);
				bWarning = true;
			}
		});
	});
	// Test basic paths using the graph.
	// Try to load the already existing graph, otherwise uses a new one. If debug is called without the required dependencies then this is skipped.
	let bGraphDeclared = true;
	try {sbd && sbd.allMusicGraph;} // NOSONAR
	catch(e) {
		if (e.name === 'ReferenceError') {
			bGraphDeclared = false;
		}
	}
	let bIncludesDeclared = true;
	try {nba();} // eslint-disable-line no-undef
	catch(e) {
		if(e.name === 'ReferenceError') {
			bIncludesDeclared = false;
		}
	}
	if (bIncludesDeclared) {
		console.log('music_graph_descriptors_xxx: Advanced debug enabled');
		const mygraph = bGraphDeclared ? sbd.allMusicGraph : musicGraph(void(0), bHtml); // foobar2000 graph, or HTML graph or a new one
		let distance = Infinity;
		let keyOne = '';
		let keyTwo = '';
		let nextIndex = 1;
		let path = [];
		const superGenreNumbers = descr.style_supergenre.length; // SuperGenres
		for (let i = 0; i < superGenreNumbers; i++, nextIndex++) {
			if (i + 1 === superGenreNumbers) {nextIndex = 0;} // NOSONAR [intended]
			keyOne = descr.style_supergenre[i][0];
			keyTwo = descr.style_supergenre[nextIndex][0];
			({distance, path} = calcGraphDistance(mygraph, keyOne, keyTwo, true));
			if (!Number.isFinite(distance) || !distance) {
				console.log('music_graph_descriptors_xxx Warning: Path from ' + keyOne + ' to ' + keyTwo + ' has a zero or infinite distance. Check \'Weighting, for Foobar2000\' section');
				console.log('Path: ' + getNodesFromPath(path));
				bWarning = true;
			} else if (distance < descr.intra_supergenre) {
				console.log('music_graph_descriptors_xxx Warning: Path from ' + keyOne + ' to ' + keyTwo + ' has distance (' + distance + ') lower than \'intra_supergenre\' (' + descr.intra_supergenre + '). Check \'Weighting, for Foobar2000\' section');
				console.log('Path: ' + getNodesFromPath(path));
				bWarning = true;
			}
		}
		const style_supergenre_clusterNumbers = descr.style_supergenre_cluster.length; // style_supergenre_clusters
		for (let i = 0; i < style_supergenre_clusterNumbers; i++, nextIndex++) {
			if (i + 1 === style_supergenre_clusterNumbers) {nextIndex = 0;} // NOSONAR [intended]
			if(descr.style_supergenre_cluster[i][0] !== 'SKIP' && descr.style_supergenre_cluster[nextIndex][0] !== 'SKIP' ) {
				keyOne = descr.style_supergenre_cluster[i][0];
				keyTwo = descr.style_supergenre_cluster[nextIndex][0];
				({distance, path} = calcGraphDistance(mygraph, keyOne, keyTwo, true));
				if (!Number.isFinite(distance) || !distance) {
					console.log('music_graph_descriptors_xxx Warning: Path from ' + keyOne + ' to ' + keyTwo + ' has a zero or infinite distance. Check \'Weighting, for Foobar2000\' section');
					console.log('Path: ' + getNodesFromPath(path));
					bWarning = true;
				} else if (distance < descr.intra_supergenre) {
					console.log('music_graph_descriptors_xxx Warning: Path from ' + keyOne + ' to ' + keyTwo + ' has distance (' + distance + ') lower than \'intra_supergenre\' (' + descr.intra_supergenre + '). Check \'Weighting, for Foobar2000\' section');
					console.log('Path: ' + getNodesFromPath(path));
					bWarning = true;
				}
			}
		}
		const style_supergenre_superclusterNumbers = descr.style_supergenre_supercluster.length; // style_supergenre_superclusters
		for (let i = 0; i < style_supergenre_superclusterNumbers; i++, nextIndex++) {
			if (i + 1 === style_supergenre_superclusterNumbers) {nextIndex = 0;} // NOSONAR [intended]
			keyOne = descr.style_supergenre_supercluster[i][0];
			keyTwo = descr.style_supergenre_supercluster[nextIndex][0];
			({distance, path} = calcGraphDistance(mygraph, keyOne, keyTwo, true));
			if (!Number.isFinite(distance) || !distance) {
				console.log('music_graph_descriptors_xxx Warning: Path from ' + keyOne + ' to ' + keyTwo + ' has a zero or infinite distance. Check \'Weighting, for Foobar2000\' section');
				console.log('Path: ' + getNodesFromPath(path));
				bWarning = true;
			} else if (distance < descr.inter_supergenre) {
				console.log('music_graph_descriptors_xxx Warning: Path from ' + keyOne + ' to ' + keyTwo + ' has distance (' + distance + ') lower than \'inter_supergenre\' (' + descr.inter_supergenre + '). Check \'Weighting, for Foobar2000\' section');
				console.log('Path: ' + getNodesFromPath(path));
				bWarning = true;
			}
		}
	}

	const files = [
		'music_graph_descriptors_xxx.js',
		typeof music_graph_descriptors_user !== 'undefined' ? 'music_graph_descriptors_xxx_user.js' : '',
		typeof music_graph_descriptors_allmusic !== 'undefined' ? 'music_graph_descriptors_xxx_allmusic.js' : ''
	].filter(Boolean);
	if (bWarning) {
		const message = 'There are some errors on:\n\n' + files.map((s) => '\'' + s + '\'').join('\n');
		try {fb.ShowPopupMessage('Check console. ' + message, 'music_graph_descriptors_xxx');} // On foobar2000
		catch (e) {alert('Check console \'Ctrl + Shift + K\'. ' + message);} // On browsers
	} else {
		if (bShowPopupOnPass) {
			const message = 'All tests passed.\nChecked:\n\n' + files.map((s) => '\'' + s + '\'').join('\n');
			try {fb.ShowPopupMessage(message, 'music_graph_descriptors_xxx');} // On foobar2000
			catch (e) {alert(message);} // On browsers
		}
		console.log('music_graph_descriptors_xxx: All tests passed');
	}
}

/*
	Statistics for the graph
*/
function histogram(data, size) {
	let min = Infinity;
	let max = -Infinity;
	for (const item of data) {
		if (item < min) {min = item;}
		if (item > max) {max = item;}
	}
	if (min === Infinity) {min = 0;}
	if (max === -Infinity) {max = 0;}
	let bins = Math.ceil((max - min + 1) / size);
	const histogram = new Array(bins).fill(0);
	for (const item of data) {
		histogram[Math.floor((item - min) / size)]++;
	}
	return histogram;
}

async function graphStatistics({
	descriptor = music_graph_descriptors,
	bHtml = false,
	bFoobar = false,
	properties = null,
	graph = musicGraph(descriptor, bHtml),
	statusCallback = null,
	influenceMethod, // Must be provided
} = {}) {
	let styleGenres;
	if (bFoobar) { // using tags from the current library
		const genreTag = properties && properties.hasOwnProperty('genreTag') // eslint-disable-line no-prototype-builtins
			? JSON.parse(properties.genreTag[1]).map((tag) => {return tag.indexOf('$') === -1 ? _t(tag): tag;}).join('|')
			: _t(globTags.genre);
		const styleTag = properties && properties.hasOwnProperty('styleTag') // eslint-disable-line no-prototype-builtins
			? JSON.parse(properties.genreTag[1]).map((tag) => {return tag.indexOf('$') === -1 ? _t(tag): tag;}).join('|')
			: _t(globTags.style);
		const tags = [genreTag, styleTag].filter(Boolean).join('|');
		const tfo = fb.TitleFormat(tags);
		styleGenres = new Set(tfo.EvalWithMetadbs(fb.GetLibraryItems()).join('|').split(/\| *|, */g)); // All styles/genres from library without duplicates
	} else { // or the entire graph
		styleGenres = new Set([...descriptor.style_supergenre, ...descriptor.style_weak_substitutions, ...descriptor.style_substitutions, ...descriptor.style_cluster].flat(Infinity));
	}
	const cacheLink = await calcCacheLinkSGV2(graph, styleGenres, void(0), influenceMethod, statusCallback);
	// Calc basic statistics
	const statistics = {maxDistance: -1, maxCount: 0, minNonZeroDistance: Infinity, minNonZeroCount: 0, minDistance: Infinity, minCount: 0, mean: -1, median: -1, mode: -1, sigma: -1, totalSize: -1};
	const distances = [];
	const total = cacheLink.size;
	cacheLink.forEach((value) => {
		const distance = value[0] + value[1];
		distances.push(distance);
		if (distance > statistics.maxDistance) {statistics.maxDistance = distance;}
		else if (distance && distance < statistics.minNonZeroDistance) {statistics.minNonZeroDistance = distance;}
		else if (distance < statistics.minDistance) {statistics.minDistance = distance;}
		statistics.mean += distance;
	});
	if (statistics.minDistance > statistics.minNonZeroDistance) {statistics.minDistance = statistics.minNonZeroDistance;}
	statistics.totalSize = statistics.maxDistance - statistics.minDistance;
	statistics.mean = Math.round(statistics.mean / total);
	distances.forEach((val) => {
		if (val === statistics.maxDistance) {statistics.maxCount++;}
		else if (val === statistics.minDistance) {statistics.minCount++;}
		else if (val === statistics.minNonZeroDistance) {statistics.minNonZeroCount++;}
		statistics.sigma += (val - statistics.mean) ** 2;
	});
	statistics.sigma = Math.round((statistics.sigma / total) ** (1/2));
	// Histogram, median, mode
	const hist = {};
	const binSize = statistics.minNonZeroDistance * 2;
	histogram(distances, binSize).forEach((val, i) => {hist[(i * binSize).toString()] = val;});
	const masxFreq = Math.max(...Object.values(hist));
	const histEntries = Object.entries(hist);
	statistics.mode = histEntries.find((pair) => {return pair[1] === masxFreq;});
	let i = 0, acumFreq = total / 2;
	while (true) {
		acumFreq -= histEntries[i][1];
		if (acumFreq <= 0) {break;} else {i++;}
	}
	statistics.median = i > 0 ? (Number(histEntries[i - 1][0]) + Number(histEntries[i][0])) / 2 : Number(histEntries[i][0]);
	// Usually follows a normal distribution, so that may give us some key parameters for graph filtering 'graphDistance'
	// In real world usage it is not A -> B but {A,B,C} -> {C,D} or similar... i.e. sets of styles/genres
	// Anyway since the total distance is divided by the num of tags, the results are still applicable
	const offset = zScoreToProbability(-3);
	const ranges = [1/4, 1/2, 3/4, 1, 3/2, 2, 3].map((val) => {
		const prob = zScoreToProbability(-3 + val) - offset;
		const roundProb = zScoreToProbability > 0.01 ? Math.round(prob * 100) : Math.round(prob * 10000) / 100;
		return 'To retrieve <' + roundProb + '% nodes: ' + val * statistics.sigma + ' (' + val.toString() + ' x Sigma)';
	});
	// Find sigma in terms of graph variables
	const sigmaConv = ['cluster', 'intra_supergenre'].map((key) => {
		let val;
		let coeff = null;
		for (let i = 1; i < 10; i++) {
			val = descriptor[key] * i;
			if (Math.abs(val - statistics.sigma) <= 10) {coeff = i; break;}
			val = descriptor[key] / i;
			if (Math.abs(val - statistics.sigma) <= 10) {coeff = 1 / i; break;}
		}
		return coeff ? coeff + ' x ' + key + ': ' + val : null;
	}).filter(Boolean);
	// Report
	let text = 'Histogram (distance:frequency):\n' + JSON.stringify(hist);
	text += '\n------------------\n';
	text += 'General statistics:\n' + Object.entries(statistics).map((pair) => {return pair[0] + '\t' + pair[1];}).join('\n');
	text += '\n------------------\n';
	text += 'Suggested distance ranges:\n' + ranges.join('\n');
	text += '\n------------------\n';
	if (sigmaConv.length) {
		text += 'Sigma using graph variables:\n' + sigmaConv.join('\n');
		text += '\n------------------\n';
	}
	text += 'Descriptor variables:\n' + ['weak_substitutions', 'cluster', 'intra_supergenre'].map((key) => {return key + '\t' + descriptor[key];}).join('\n');
	text += '\n------------------\n';
	return {data: {histogram: hist, statistics}, text};
}