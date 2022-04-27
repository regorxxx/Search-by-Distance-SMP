'use strict';
//11/04/22

function regionMap({nodeName = 'node', culturalRegion} = {}) {
	this.culturalRegion = culturalRegion || {
		'Antarctica': {'Antarctica': []},
		'Africa': {'West Africa': [],'Maghreb': [],'Central Africa': [],'East Africa': [],'South Africa': []},
		'Asia': {'Central Asia': [],'East Asia': [],'West Asia': [],'South Asia': [],'North Asia': []},
		'Europe': {'Eastern Europe': [],'Southern Europe': [],'Central Europe': [],'Western Europe': [],'Northern Europe': []},
		'Mashriq': {'Arabian Peninsula': [],'Anatolia': [],'Levant': [],'Mesopotamia': []},
		'America': {'Caribbean': [],'North America': [],'Central America': [],'South America': []},
		'Oceania': {'Australasia': [],'Melanesia': [],'Micronesia': [],'Polynesia': []}
	};
	this.nodeName = nodeName;
	this.regionList = {};
	this.updateRegionList = function regionList() {
		const mainRegions = Object.keys(this.culturalRegion);
		const regions = {};
		const regionsMap = new Map();
		mainRegions.forEach((key) => {regionsMap.set(key, key);});
		mainRegions.forEach((key) => {
			regions[key] = [];
			Object.keys(this.culturalRegion[key]).forEach((subKey) => {
				if (subKey !== '_ALL_') {regions[key].push(subKey); regionsMap.set(subKey, key);}
			});
		});
		const regionsList = [...regionsMap.keys()];
		this.regionList = {mainRegions, regions, regionsMap, regionsList};
	};
	this.updateRegionList();
}

regionMap.prototype.capitalize = function capitalize(string) {
	return string.split(' ').map((_) => {return _[0].toUpperCase() + _.slice(1).toLowerCase();}).join(' ');
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
		const findNode = (subKey) => {return this.culturalRegion[key][subKey].findIndex((nodeNormNew) => {return nodeNormNew.toUpperCase() === nodeNorm;})};
		if (subKey) { // Look only at given subregion
			bFound = findNode(subKey) !== -1;
		} else { // Look within all subregions
			bFound = this.getSubRegions(key).some((subKey) => {return findNode(subKey) !== -1;});
		}
	}
	return bFound;
};

regionMap.prototype.getNodeRegion = function getNodeRegion(node) {
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
	return regionObj;
};

regionMap.prototype.getFirstNodeRegion = function getFirstNodeRegion(node) {
	return (Object.values(this.getNodeRegion(node))[0] || [''])[0];  // If nodes are unique per pair {key, subKey}, then there is only one value needed
};

regionMap.prototype.isSameRegionNodes = function isSameRegionNodes(nodeA, nodeB, bMain = false) {
	const regionA = Object.entries(this.getNodeRegion(nodeA));
	return regionA.some((pair) => {return this.regionHasNode(bMain ? pair[0] : pair[1], nodeB);});
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