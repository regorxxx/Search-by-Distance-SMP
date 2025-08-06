'use strict';
//06/08/25

/* global music_graph_descriptors:readable */

/*
	Helpers for the descriptors
*/
music_graph_descriptors.asciify = function asciify(value) { // Used internally on all inputs below
	return (typeof str === 'string' ? value : String(value)).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0142/g, 'l');
};

music_graph_descriptors.getSubstitutionCache = new Map();
music_graph_descriptors.getSubstitution = function getSubstitution(genreStyle, bOmitNonNode = false) { // Doesn't check if the style exists at all at the graph
	let substitution = music_graph_descriptors.getSubstitutionCache.get(genreStyle);
	if (!substitution) {
		const pair = this.style_substitutions.find((pair) => pair[1].includes(this.asciify(genreStyle)));
		substitution = pair ? pair[0] : genreStyle;
		music_graph_descriptors.getSubstitutionCache.set(genreStyle, substitution);
	}
	if (bOmitNonNode && /(_supercluster|_supergenre|_cluster|_cluster| XL)$/i.test(substitution)) {
		substitution = genreStyle;
	}
	return substitution;
};

music_graph_descriptors.replaceWithSubstitutions = function replaceWithSubstitutions(genreStyleArr, bOmitNonNode = false) {
	// Doesn't work in arrays with duplicate items!
	let left = genreStyleArr.length;
	if (!left) { return []; }
	const nodeRegEx = /(_supercluster|_supergenre|_cluster|_cluster| XL)$/i;
	const copy = Array.from(genreStyleArr, (tag) => this.asciify(tag)); // ['House', 'Trance', 'Folk'] or ['House', 'Trance', 'Folk-Rock']
	for (const pair of this.style_substitutions) {
		if (!left) { break; }
		pair[1].forEach((sub) => {
			const idx = copy.indexOf(sub);
			if (idx !== -1 && (!bOmitNonNode || !nodeRegEx.test(pair[0]))) {
				copy.splice(idx, 1, pair[0]); left--;
			}
		});
	}
	return copy; // ['House_supergenre', 'Trance_supergenre', 'Folk Music_supercluster']
};

music_graph_descriptors.replaceWithSubstitutionsReverse = function replaceWithSubstitutionsReverse(genreStyleArr) { // Doesn't work in arrays with duplicate items!
	let left = genreStyleArr.length;
	if (!left) { return []; }
	const copy = Array.from(genreStyleArr, (tag) => this.asciify(tag)); // ['House_supergenre', 'Trance_supergenre', 'Folk Music_supercluster']
	this.style_substitutions.forEach((pair) => {
		if (!left) { return; }
		const idx = copy.indexOf(pair[0]);
		if (idx !== -1) { copy.splice(idx, 1, ...pair[1]); left--; } // Note this doesn't give back the original array, since all alternative terms are added
	});
	return copy; // ['House', 'Trance', 'Folk', 'Folk-Rock']
};

music_graph_descriptors.replaceWithAlternativeTerms = function replaceWithAlternativeTerms(genreStyleArr, bOmitNonNode = false, bFlat = true) {
	// ['House', 'Trance', 'Folk', 'Folk-Rock']
	const nodeRegEx = /(_supercluster|_supergenre|_cluster|_cluster| XL)$/i;
	const copy = Array.from(genreStyleArr, (tag) => this.asciify(tag))
		.map((tag) => {
			const pair = this.style_substitutions.find((pair) => pair[1].includes(tag) || pair[0] === tag);
			return !pair
				? [tag]
				: bOmitNonNode
					? [...new Set([tag, pair[0], ...pair[1]])].filter((tag) => !nodeRegEx.test(tag))
					: [...new Set([tag, pair[0], ...pair[1]])];
		});
	return bFlat
		? [...new Set(copy.flat(Infinity))] // ['House', 'House_supergenre', 'Folk', 'Folk-Rock', 'Folk Music_supercluster',]
		: copy; // [['House', 'House_supergenre'], ['Folk', 'Folk Music_supercluster', 'Folk-Rock'], ['Folk-Rock', 'Folk Music_supercluster', 'Folk']]
};

music_graph_descriptors.filterDuplicatedSubstitutions = function filterDuplicatedSubstitutions(genreStyleArr) { // Doesn't work in arrays with duplicate items!
	if (!genreStyleArr.length) { return []; }
	const copy = new Set(genreStyleArr.map((tag) => this.asciify(tag))); // ['Tishoumaren', 'Desert Blues', 'Assouf']
	this.style_substitutions.forEach((pair) => {
		if (copy.has(pair[0])) {
			pair[1].forEach((g) => copy.delete(g));
		} else if (pair[1].some((g) => copy.has(g))) {
			for (let genre of pair[1]) {
				if (copy.has(genre)) {
					pair[1].forEach((g) => genre !== g && copy.delete(g));
				}
			}
		}
	});
	return [...copy]; // ['Tishoumaren']
};

music_graph_descriptors.getAntiInfluences = function getAntiInfluences(genreStyle) {
	const doubleIdx = this.style_anti_influence.flat().indexOf(this.getSubstitution(genreStyle));
	const idx = !(doubleIdx & 1) ? doubleIdx / 2 : -1; // -1 for odd indexes, halved for even values
	return idx !== -1 ? [...this.style_anti_influence[idx][1]] : [];
};

music_graph_descriptors.getConditionalAntiInfluences = function getConditionalAntiInfluences(genreStyle) {
	const idx = this.style_anti_influences_conditional.indexOf(this.getSubstitution(genreStyle));
	return idx !== -1 ? this.getAntiInfluences(this.style_anti_influences_conditional[idx]) : [];
};

music_graph_descriptors.getInfluences = function getInfluences(genreStyle) {
	const doubleIdx = this.style_primary_origin.flat().indexOf(this.getSubstitution(genreStyle));
	const idx = !(doubleIdx & 1) ? doubleIdx / 2 : -1; // -1 for odd indexes, halved for even values
	return idx !== -1 ? [...this.style_primary_origin[idx][1]] : [];
};

music_graph_descriptors.nodeSet = null;
music_graph_descriptors.getNodeSet = function getNodeSet(bExtensive = true) {
	// Get node list (+ weak substitutions + substitutions + style cluster)
	if (bExtensive) {
		if (!this.nodeSet) {
			this.nodeSet = new Set(this.style_supergenre.flat(Infinity))
				.union(new Set(this.style_weak_substitutions.flat(Infinity)))
				.union(new Set(this.style_substitutions.flat(Infinity)))
				.union(new Set(this.style_cluster.flat(Infinity)));
		}
	} else {
		return new Set(this.style_supergenre.flat(Infinity).filter((sg) => !sg.endsWith('_supergenre')));
	}
	return this.nodeSet;
};

music_graph_descriptors.isOnGraph = function isOnGraph(genreStyleArr) {
	const tags = new Set(genreStyleArr.flat(Infinity).map((tag) => { return this.asciify(tag); }));
	// Compare (- user exclusions - graph exclusions)
	const missing = tags.difference(this.getNodeSet());
	return missing.size === 0;
};

music_graph_descriptors.filterArrWithGraph = function filterWithGraph(genreStyleArr) {
	const tags = new Set(genreStyleArr.flat(Infinity).map((tag) => { return this.asciify(tag); }));
	const present = tags.intersection(this.getNodeSet());
	return [...present];
};

// Skips set conversion and asciify
music_graph_descriptors.filterSetWithGraph = function filterWithGraph(genreStyleSet) {
	return genreStyleSet.intersection(this.getNodeSet());
};