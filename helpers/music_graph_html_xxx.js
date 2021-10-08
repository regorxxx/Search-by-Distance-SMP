'use strict';
//07/10/21

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