'use strict';
//16/01/22

/*
	Helpers for the descriptors
*/
music_graph_descriptors.asciify = function asciify(value) { // Used internally on all inputs below
	return (typeof str === 'string' ? value : String(value)).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0142/g, 'l');
};

music_graph_descriptors.getSubstitution = function getSubstitution(genreStyle) { // Doesn't check if the style exists at all at the graph
	const pair = this.style_substitutions.find((pair) => {return pair[1].indexOf(this.asciify(genreStyle)) !== -1;});
	return pair ? pair[0] : genreStyle;
};

music_graph_descriptors.replaceWithSubstitutions = function replaceWithSubstitutions(genreStyleArr) { // Doesn't work in arrays with duplicate items!
	let left = genreStyleArr.length;
	if (!left) {return [];}
	const copy = [...genreStyleArr].map((tag) => {return this.asciify(tag);}); // ['House', 'Trance', 'Folk'] or ['House', 'Trance', 'Folk-Rock']
	this.style_substitutions.forEach((pair) => {
		if (!left) {return;}
		pair[1].forEach((sub) => {
			const idx = copy.indexOf(sub);
			if (idx !== -1) {copy.splice(idx, 1, pair[0]); left--;}
		});
	});
	return copy; // ['House_supergenre', 'Trance_supergenre', 'Folk Music_supercluster']
};

music_graph_descriptors.replaceWithSubstitutionsReverse = function replaceWithSubstitutionsReverse(genreStyleArr) { // Doesn't work in arrays with duplicate items!
	let left = genreStyleArr.length;
	if (!left) {return [];}
	const copy = [...genreStyleArr].map((tag) => {return this.asciify(tag);}); // ['House_supergenre', 'Trance_supergenre', 'Folk Music_supercluster']
	this.style_substitutions.forEach((pair) => {
		if (!left) {return;}
		const idx = copy.indexOf(pair[0]);
		if (idx !== -1) {copy.splice(idx, 1, ...pair[1]); left--;} // Note this doesn't give back the original array, since all alternative terms are added
	});
	return copy; // ['House', 'Trance', 'Folk', 'Folk-Rock']
};

music_graph_descriptors.getAntiInfluences = function getAntiInfluences(genreStyle) {
	const dbleIdx = this.style_anti_influence.flat().indexOf(this.getSubstitution(genreStyle));
	const idx = !(dbleIdx & 1) ? dbleIdx / 2 : -1; // -1 for odd indexes, halved for even values
	return idx !== -1 ? this.style_anti_influence[idx][1] : [];
};

music_graph_descriptors.getConditionalAntiInfluences = function getConditionalAntiInfluences(genreStyle) {
	const idx = this.style_anti_influences_conditional.indexOf(this.getSubstitution(genreStyle));
	return idx !== -1 ? this.getAntiInfluences(this.style_anti_influences_conditional[idx]) : [];
};

music_graph_descriptors.getInfluences = function getInfluences(genreStyle) {
	const dbleIdx = this.style_primary_origin.flat().indexOf(this.getSubstitution(genreStyle));
	const idx = !(dbleIdx & 1) ? dbleIdx / 2 : -1; // -1 for odd indexes, halved for even values
	return idx !== -1 ? this.style_primary_origin[idx][1] : [];
};

music_graph_descriptors.nodeList = null;
music_graph_descriptors.isOnGraph = function isOnGraph(genreStyleArr) {
	const tags = new Set(genreStyleArr.flat(Infinity).map((tag) => {return this.asciify(tag);}));
	// Get node list (+ weak substitutions + substitutions + style cluster)
	if (!this.nodeList) {
		this.nodeList = new Set(this.style_supergenre.flat(Infinity))
			.union(new Set(this.style_weak_substitutions.flat(Infinity)))
			.union(new Set(this.style_substitutions.flat(Infinity)))
			.union(new Set(this.style_cluster.flat(Infinity)));
	}
	// Compare (- user exclusions - graph exclusions)
	const missing = tags.difference(this.nodeList);
	return missing.size === 0;
};