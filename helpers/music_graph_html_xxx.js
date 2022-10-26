'use strict';
//25/10/22

/* 
	These helper are used on debug function at 'music_graph_xxx.js' so we need it for the html file too
*/
Set.prototype.intersection = function(setB) {
    let intersection = new Set();
    for (let elem of setB) {
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

function capitalize(s) {
	if (!isString(s)) {return '';}
	return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function capitalizeAll(s, sep = ' ', bJoinSep = true) { // Can use RegEx as separator, when using RegEx with capture groups to also include separators on split array, bJoinSep should be false to join 'as is'
	if (typeof s !== 'string') {return '';}
	if (isArray(sep)) {
		const copy = Array.from(s.toLowerCase());
		const len = s.length;
		for (const sep_i of sep) {
			s = capitalizeAll(s, sep_i, bJoinSep);
			for (let i = 0; i < len; i++) {
				if (s[i] === s[i].toUpperCase()) {
					copy[i] = s[i];
				}
			}
		}
		return copy.join('');
	}
	return s.split(sep).map( (subS) => {return subS.charAt(0).toUpperCase() + subS.slice(1).toLowerCase();}).join(bJoinSep ? sep : ''); // Split, capitalize each subString and join
}

// Inject missing method on Graphs, not present on Viva.Graph
if (!Viva.Graph.graph().getNonOrientedLink) {
	function getNonOrientedLink(aNodeId, bNodeId) {
		// TODO: Use sorted links to speed this up
		const node = this.getNode(aNodeId);
		if (!node || !node.links) {return null;}
		for (let i = 0; i < node.links.length; ++i) {
			const link = node.links[i];
			if ((link.fromId === aNodeId && link.toId === bNodeId) || (link.fromId === bNodeId && link.toId === aNodeId)) {return link;}
		}
		return null; // no link.
	}
	Viva.Graph.graphOriented = Viva.Graph.graph;
	Viva.Graph.graph = () => {
		const graph = Viva.Graph.graphOriented();
		graph.getNonOrientedLink = getNonOrientedLink.bind(graph);
		return graph;
	};
}