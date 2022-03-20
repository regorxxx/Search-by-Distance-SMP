'use strict';
//20/03/22

/* 
	These helper are used on debug function at 'music_graph_xxx.js' so we need it for the html file too
*/

Set.prototype.intersection = function(setB) {
    var intersection = new Set();
    for (var elem of setB) {
        if (this.has(elem)) {
            intersection.add(elem);
        }
    }
    return intersection;
};

Set.prototype.union = function(setB) {
    let union = new Set(this);
    for (let elem of setB) {
        union.add(elem);
    }
    return union;
};

Set.prototype.difference = function(setB) {
    let difference = new Set(this);
    for (let elem of setB) {
        difference.delete(elem);
    }
    return difference;
};

// Finds distance between all SuperGenres present on foobar library. Returns a map with {distance, influenceDistance} and keys 'nodeA-nodeB'.
function calcCacheLinkSGV2(mygraph, styleGenres, limit = -1) {
	let nodeList = [];
	const iDelaySBDCache = 10;
	const influenceMethod = 'adjacentNodes';
	// Filter SGs with those on library
	const descr = music_graph_descriptors;
	nodeList = new Set([...descr.style_supergenre, ...descr.style_weak_substitutions, ...descr.style_substitutions, ...descr.style_cluster].flat(Infinity)); 
	nodeList = [...nodeList.intersection(styleGenres)];
	return new Promise((resolve) => {
		let cache = new Map();
		const promises = [];
		const total = nodeList.length - 1;
		let prevProgress = -1;
		for (let i = 0; i < total; i++) {
			for (let j = i + 1; j <= total; j++) {
				promises.push(new Promise((resolve) => {
					setTimeout(() => {
						let [ij_distance, ij_antinfluenceDistance] = calc_map_distance(mygraph, nodeList[i], nodeList[j], true, influenceMethod);
						if (limit === -1 || ij_distance <= limit) {
							// Sorting removes the need to check A-B and B-A later...
							cache.set([nodeList[i], nodeList[j]].sort().join('-'), {distance: ij_distance, influenceDistance: ij_antinfluenceDistance});
						}
						const progress = Math.round(i * j / (total * total) * 4) * 25;
						if (progress > prevProgress) {prevProgress = progress; console.log('Calculating graph links ' + progress + '%.');}
						resolve('done');
					}, iDelaySBDCache * j);
				}));
			}
		}
		Promise.all(promises).then((done) => {
			resolve(cache);
		});
	});
}