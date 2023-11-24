'use strict';
//20/11/23

/*
	Inverse mapping for the graph
*/

(function () { // Used internally on all inputs below
	const test = typeof FbProfiler !== 'undefined' ? new FbProfiler('Music Graph: node list') : null;
	const nodeList = new Map();
	const cache = {
		cluster: new Map(),
		superCluster: new Map(),
		styleCluster: new Map(),
		primaryOrigin: new Map(),
		secondaryOrigin: new Map(),
		antiInfluence: new Map(),
		weakSubstitution: new Map(),
		substitution: new Map()
	};
	// Cache values
	music_graph_descriptors.style_supergenre_cluster.forEach((cl) => {
		if (cl[0] === 'SKIP') {return;}
		cl[1].forEach((sg) => {
			cache.cluster.set(sg, cl[0]);
		});
	});
	music_graph_descriptors.style_supergenre_supercluster.forEach((scl) => {
		scl[1].forEach((cl) => {
			cache.superCluster.set(cl, scl[0]);
		});
	});
	music_graph_descriptors.style_cluster.forEach((scl) => {
		scl[1].forEach((genreStyle) => {
			if (cache.styleCluster.has(genreStyle)) {
				cache.styleCluster.get(genreStyle).push(scl[0]);
			} else {
				cache.styleCluster.set(genreStyle, [scl[0]]);
			}
		});
	});
	[
		{name: 'primaryOrigin', descriptor: 'style_primary_origin'},
		{name: 'secondaryOrigin', descriptor: 'style_secondary_origin'},
		{name: 'antiInfluence', descriptor: 'style_anti_influence'},
		{name: 'weakSubstitution', descriptor: 'style_weak_substitutions'},
		{name: 'substitution', descriptor: 'style_substitutions'},
	].forEach((o) => {
		music_graph_descriptors[o.descriptor].forEach((genreStyleFrom) => {
			genreStyleFrom[1].forEach((genreStyle) => {
				if (cache[o.name].has(genreStyle)) {
					cache[o.name].get(genreStyle).push(genreStyleFrom[0]);
				} else {
					cache[o.name].set(genreStyle, [genreStyleFrom[0]]);
				}
			});
			if (cache[o.name].has(genreStyleFrom[0])) { // It must be linked in both directions
				const node = cache[o.name].get(genreStyleFrom[0]);
				genreStyleFrom[1].forEach((genreStyle) => {
					node.push(genreStyle);
				});
			} else {
				cache[o.name].set(genreStyleFrom[0], [genreStyleFrom[0]]);
			}
		});
	});
	// Retrieve list
	music_graph_descriptors.style_supergenre.forEach((sg) => {
		sg[1].forEach((genreStyle) => {
			const superGenre = sg[0];
			const cluster = cache.cluster.get(superGenre);
			const superCluster = cache.superCluster.get(cluster);
			if (nodeList.has(genreStyle)) {
				const node = nodeList.get(genreStyle);
				node.superGenre.push(superGenre); // Duplicates are not allowed by definition
				if (!node.cluster.includes(cluster)) {node.cluster.push(cluster);}
				if (!node.superCluster.includes(superCluster)) {node.superCluster.push(superCluster);}
				nodeList.set(genreStyle, node);
			} else {
				nodeList.set(genreStyle, 
					{	// This can be expanded with dates, direct connections or user statistics like top rated tracks or average rating on library
						superGenre: [superGenre].filter(Boolean),
						cluster: [cluster].filter(Boolean),
						superCluster: [superCluster].filter(Boolean),
						styleCluster: cache.styleCluster.get(genreStyle) || [],
						primaryOrigin: cache.primaryOrigin.get(genreStyle) || [],
						secondaryOrigin: cache.secondaryOrigin.get(genreStyle) || [],
						antiInfluence: cache.antiInfluence.get(genreStyle) || [],
						weakSubstitution: cache.weakSubstitution.get(genreStyle) || [],
						substitution: cache.substitution.get(genreStyle) || [],
						region: music_graph_descriptors_culture.getStyleRegion(genreStyle)  || [] // With caching takes 120 ms for the entire graph, with inverse lookup table just 30 ms
					}
				);
			}
		});
	});
	[music_graph_descriptors.style_substitutions, music_graph_descriptors.style_cluster].forEach((arr) => {
		arr.map((sub) => sub[0]).forEach((genreStyle) => {
			if (nodeList.has(genreStyle)) {return;}
			const cluster = cache.cluster.get(genreStyle);
			const superCluster = cache.superCluster.get(genreStyle);
			nodeList.set(genreStyle, 
				{	// This can be expanded with dates, direct connections or user statistics like top rated tracks or average rating on library
					superGenre: [],
					cluster: [cluster].filter(Boolean),
					superCluster: [superCluster].filter(Boolean),
					styleCluster: cache.styleCluster.get(genreStyle) || [],
					primaryOrigin: cache.primaryOrigin.get(genreStyle) || [],
					secondaryOrigin: cache.secondaryOrigin.get(genreStyle) || [],
					antiInfluence: cache.antiInfluence.get(genreStyle) || [],
					weakSubstitution: cache.weakSubstitution.get(genreStyle) || [],
					substitution: cache.substitution.get(genreStyle) || [],
					region: music_graph_descriptors_culture.getStyleRegion(genreStyle) || [] // With caching takes 120 ms for the entire graph, with inverse lookup table just 30 ms
				}
			);
		});
	});
	music_graph_descriptors.nodeList = nodeList;
	if (test) {test.Print('', false)}
}) ();