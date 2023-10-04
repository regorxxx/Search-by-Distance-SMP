'use strict';
//04/10/22

function regionMap({nodeName = 'node', intraSubRegionDist = 1, interSubRegionDist = 2, interRegionDist = 4, culturalRegion} = {}) {
	this.culturalRegion = culturalRegion || {
		'Antarctica': {'Antarctica': []},
		'Africa': {'West Africa': [],'Maghreb': [],'Central Africa': [],'East Africa': [],'South Africa': []},
		'Asia': {'Central Asia': [],'East Asia': [],'West Asia': [],'South Asia': [],'North Asia': []},
		'Europe': {'Eastern Europe': [],'Southern Europe': [],'Central Europe': [],'Western Europe': [],'Northern Europe': []},
		'Mashriq': {'Arabian Peninsula': [],'Anatolia': [],'Levant': [],'Mesopotamia': []},
		'America': {'Caribbean': [],'North America': [],'Central America': [],'South America': []},
		'Oceania': {'Australasia': [],'Melanesia': [],'Micronesia': [],'Polynesia': []}
	};
	[this.intraSubRegionDist, this.interSubRegionDist, this.interRegionDist] = [intraSubRegionDist, interSubRegionDist, interRegionDist];
	this.cache = {getDistance: new Map(), regionsNorm: {}};
	this.nodeName = nodeName;
	this.regionList = {};
	this.nodeList = new Map();
	this.updateRegionList = function updateRegionList({bNodeList = false} = {}) {
		const mainRegions = Object.keys(this.culturalRegion);
		const regions = {};
		const regionsMap = new Map();
		this.nodeList.clear();
		mainRegions.forEach((key) => {regionsMap.set(key, key);});
		mainRegions.forEach((key) => {
			regions[key] = [];
			Object.keys(this.culturalRegion[key]).forEach((subKey) => {
				if (subKey !== '_ALL_') {
					regions[key].push(subKey); 
					regionsMap.set(subKey, key);
					this.cache.regionsNorm[subKey] = new Set(this.culturalRegion[key][subKey].map(n => n.toUpperCase()));
					if (bNodeList) {
						this.culturalRegion[key][subKey].forEach((node) => {
							const regionObj = this.nodeList.has(node) ? this.nodeList.get(node) : {};
							if (key === subKey) {regionObj[key] = [];}
							else if (regionObj[key]) {regionObj[key].push(subKey);}
							else {regionObj[key] = [];}
							Object.keys(regionObj).forEach((key) => { // Fix for main region equal to subregion
								if (regionObj[key].length === 0) {regionObj[key].push(key);}
							});
							this.nodeList.set(node, regionObj);
						});
					}
				}
			});
		});
		const regionsList = [...regionsMap.keys()];
		this.regionList = {mainRegions, regions, regionsMap, regionsList};
	};
	this.updateRegionList();
}

regionMap.prototype.capitalize = function capitalize(string) {
	return string.split(' ').map((ss) => {return ss[0].toUpperCase() + ss.slice(1).toLowerCase();}).join(' ');
};

regionMap.prototype.has = function has(region) {
	const {regionsMap} =  this.regionList;
	return region && region.length && regionsMap.has(this.capitalize(region));
};

regionMap.prototype.get = function get(region) {
	const {regionsMap} =  this.regionList;
	return region && region.length && regionsMap.get(this.capitalize(region));
};

regionMap.prototype.getSubRegions = function getSubRegions(region) {
	const {regions} =  this.regionList;
	return (this.has(region) ? regions[this.capitalize(region)] : []);
};

regionMap.prototype.getMainRegions = function getMainRegions() {
	const {mainRegions} =  this.regionList;
	return [...mainRegions];
};

regionMap.prototype.getRegionNames = function getRegionNames() {
	const {regionsList} =  this.regionList;
	return [...regionsList];
};

regionMap.prototype.getNodes = function getNodes() {
	const nodeList = new Set();
	this.getMainRegions().forEach((mainRegion) => {
		this.getSubRegions(mainRegion).forEach((subRegion) => {
			this.culturalRegion[mainRegion][subRegion].forEach((node) => nodeList.add(node));
		});
	});
	return [...nodeList];
};

regionMap.prototype.isMainRegion = function isMainRegion(region) {
	return (this.has(region) && this.getMainRegions().indexOf(this.capitalize(region)) !== - 1);
};

regionMap.prototype.regionContains = function regionContains(region, subRegion) {
	return (this.has(region) && this.has(subRegion) && this.get(subRegion) === this.capitalize(region));
};

regionMap.prototype.getMainRegion = function getMainRegion(subRegion) {
	return (this.has(subRegion) ? this.get(subRegion) : '');
};

regionMap.prototype.regionHasNode = function regionHasNode(region, node) {
	let bFound = false;
	if (!node || !node.length) {console.log('regionHasNode: Node has not been set'); return bFound;}
	if (this.has(region)) {
		const key = this.get(region);
		const subKey = this.capitalize(region) !== key ? this.capitalize(region) : null;
		const nodeNorm = node.toUpperCase();
		const findNode = (subKey) => {return this.cache.regionsNorm[subKey].has(nodeNorm);};
		if (subKey) { // Look only at given subregion
			bFound = findNode(subKey);
		} else { // Look within all subregions
			bFound = this.getSubRegions(key).some((subKey) => {return findNode(subKey);});
		}
	}
	return bFound;
};

regionMap.prototype.getNodeRegion = function getNodeRegion(node) { // A cached version may be retrieved at this.nodeList map
	const regions = new Set();
	if (!node || !node.length) {console.log('getNodeRegion: Node has not been set'); return {};}
	this.getRegionNames().forEach((region) => {if (this.regionHasNode(region, node)) {regions.add(region); regions.add(this.getMainRegion(region));}});
	const regionObj = {};
	regions.forEach((key) => {
		const mainKey = this.get(key);
		if (mainKey === key) {regionObj[mainKey] = [];}
		else if (regionObj[mainKey]) {regionObj[mainKey].push(key);}
		else {regionObj[mainKey] = [];}
	});
	Object.keys(regionObj).forEach((key) => { // Fix for main region equal to subregion
		if (regionObj[key].length === 0) {regionObj[key].push(key);}
	});
	return regionObj;
};

regionMap.prototype.getFirstNodeRegion = function getFirstNodeRegion(node) {
	return (Object.values(this.getNodeRegion(node))[0] || [''])[0];  // If nodes are unique per pair {key, subKey}, then there is only one value needed
};

regionMap.prototype.isSameRegionNodes = function isSameRegionNodes(nodeA, nodeB, bMain = false) { // Be aware subregions being equal to the main region are excluded unless bMain is set to true
	const regionA = Object.entries(this.getNodeRegion(nodeA));
	return regionA.some((pair) => {
		const mainRegion = pair[0];
		return bMain 
			? this.regionHasNode(mainRegion, nodeB)
			: pair[1].filter((subRegion) => subRegion !== mainRegion).some((subRegion) => this.regionHasNode(subRegion, nodeB));
	});
};

regionMap.prototype.getNodesFromRegion = function getNodesFromRegion(region) {
	const nodes = [];
	if (this.has(region)) {
		if (this.isMainRegion(region)) {
			Object.values(this.culturalRegion[region]).forEach((node) => {nodes.push(node);});
		} else {
			this.culturalRegion[this.getMainRegion(region)][region].forEach((node) => {nodes.push(node);});
		}
	}
	return [...new Set(nodes)];
};

// Distance functions
regionMap.prototype.getDistance = function getDistance(nodeA, nodeB) {
	let distance;
	const id = [nodeA, nodeB].sort().join('-');
	if (this.cache.getDistance.has(id)) {distance = this.cache.getDistance.get(id);}
	else {
		distance = this.capitalize(nodeA) === this.capitalize(nodeB)
			? 0
			: this.isSameRegionNodes(nodeA, nodeB)
				? this.intraSubRegionDist
				: this.isSameRegionNodes(nodeA, nodeB, true)
					? this.interSubRegionDist
					: this.interRegionDist;
		this.cache.getDistance.set(id, distance);
	}
	return distance;
};