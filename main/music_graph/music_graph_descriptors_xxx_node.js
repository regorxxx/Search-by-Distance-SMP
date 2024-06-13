'use strict';
//13/06/24

/*
	Inverse mapping for the graph
*/

/* global music_graph_descriptors:readable, music_graph_descriptors_culture:readable */

/**
* @typedef {Object} musicGraphNode
* @property {[string]} superGenre
* @property {[string]} cluster
* @property {[string]} superCluster
* @property {[string]} styleCluster
* @property {[string]} primaryOrigin
* @property {[string]} secondaryOrigin
* @property {[string]} antiInfluence
* @property {[string]} weakSubstitution
* @property {[string]} substitution
* @property {[string]} region
*/

(function () { // Used internally on all inputs below
	const test = typeof FbProfiler !== 'undefined' ? new FbProfiler('Music Graph: node list') : null;
	/** @type {Map<string,musicGraphNode>} */
	const nodeList = new Map();
	const cache = {
		cluster: new Map(),
		clusterList: new Set(),
		superCluster: new Map(),
		superClusterList: new Set(),
		styleCluster: new Map(),
		styleClusterList: new Set(),
		primaryOrigin: new Map(),
		secondaryOrigin: new Map(),
		antiInfluence: new Map(),
		weakSubstitution: new Map(),
		substitution: new Map()
	};
	// Cache values
	music_graph_descriptors.style_supergenre_cluster.forEach((cl) => {
		if (cl[0] === 'SKIP') { return; }
		cache.clusterList.add(cl[0]);
		cl[1].forEach((sg) => {
			cache.cluster.set(sg, cl[0]);
		});
	});
	music_graph_descriptors.style_supergenre_supercluster.forEach((scl) => {
		cache.superClusterList.add(scl[0]);
		scl[1].forEach((cl) => {
			cache.superCluster.set(cl, scl[0]);
		});
	});
	music_graph_descriptors.style_cluster.forEach((scl) => {
		cache.styleClusterList.add(scl[0]);
		scl[1].forEach((genreStyle) => {
			if (cache.styleCluster.has(genreStyle)) {
				cache.styleCluster.get(genreStyle).push(scl[0]);
			} else {
				cache.styleCluster.set(genreStyle, [scl[0]]);
			}
		});
	});
	[
		{ name: 'primaryOrigin', descriptor: 'style_primary_origin' },
		{ name: 'secondaryOrigin', descriptor: 'style_secondary_origin' },
		{ name: 'antiInfluence', descriptor: 'style_anti_influence' },
		{ name: 'weakSubstitution', descriptor: 'style_weak_substitutions' },
		{ name: 'substitution', descriptor: 'style_substitutions' },
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
				cache[o.name].set(genreStyleFrom[0], [...genreStyleFrom[1]]);
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
				if (!node.cluster.includes(cluster)) { node.cluster.push(cluster); }
				if (!node.superCluster.includes(superCluster)) { node.superCluster.push(superCluster); }
				nodeList.set(genreStyle, node);
			} else {
				nodeList.set(genreStyle,
					{	// Can be expanded with dates, direct connections or user statistics like top rated tracks or average rating on library
						superGenre: [superGenre].filter(Boolean),
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
			}
		});
	});
	// Process substitutions (which may link to clusters) and style clusters (which may be used as a genre too)
	[music_graph_descriptors.style_substitutions, music_graph_descriptors.style_cluster].forEach((arr) => {
		arr.map((sub) => sub[0]).forEach((genreStyle, i) => {
			if (nodeList.has(genreStyle)) { return; }
			const bStyleCluster = cache.styleClusterList.has(genreStyle);
			const bCluster = !bStyleCluster && cache.clusterList.has(genreStyle);
			const bSuperCluster = !bStyleCluster && !bCluster && cache.superClusterList.has(genreStyle);
			let superGenre = new Set();
			let cluster = new Set();
			let superCluster = new Set();
			let styleCluster = new Set();
			switch (true) {
				case bStyleCluster: {
					const childs = music_graph_descriptors.style_cluster[i][1];
					childs.forEach((child) => {
						const node = nodeList.get(child);
						if (!node) {return;}
						node.superGenre.forEach((sg) => {
							cluster.add(cache.cluster.get(sg));
							superGenre.add(sg);
						});
					});
					cluster.forEach((cl) => superCluster.add(cache.superCluster.get(cl)));
					styleCluster.add(genreStyle);
					break;
				}
				case bCluster: {
					cluster.add(genreStyle);
					superCluster.add(cache.superCluster.get(cluster));
					break;
				}
				case bSuperCluster: {
					superCluster.add(genreStyle);
					break;
				}
				default: {
					cluster.add(cache.cluster.get(genreStyle));
					superCluster.add(cache.superCluster.get(genreStyle));
					(cache.styleCluster.get(genreStyle) || []).forEach((sc) => styleCluster.add(sc));
				}
			}
			nodeList.set(genreStyle,
				{
					superGenre: [...superGenre].filter(Boolean),
					cluster: [...cluster].filter(Boolean),
					superCluster: [...superCluster].filter(Boolean),
					styleCluster: [...styleCluster].filter(Boolean),
					primaryOrigin: cache.primaryOrigin.get(genreStyle) || [],
					secondaryOrigin: cache.secondaryOrigin.get(genreStyle) || [],
					antiInfluence: cache.antiInfluence.get(genreStyle) || [],
					weakSubstitution: cache.weakSubstitution.get(genreStyle) || [],
					substitution: cache.substitution.get(genreStyle) || [],
					region: music_graph_descriptors_culture.getStyleRegion(genreStyle) || []
				}
			);
		});
	});
	music_graph_descriptors.nodeList = nodeList;
	if (test) { test.Print('', false); }
})();