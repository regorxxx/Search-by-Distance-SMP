'use strict';
//16/03/22

include('..\\helpers\\buttons_xxx.js');
include('..\\helpers\\helpers_xxx_properties.js');

try {window.DefinePanel('Search by Distance Buttons', {author:'xxx'});} catch (e) {console.log('Search by Distance Buttons loaded.');} //May be loaded along other buttons

include('..\\main\\search_bydistance.js'); // Load after buttons_xxx.js so properties are only set once
include('..\\helpers\\helpers_xxx_properties.js');
var prefix = 'sbd';
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { //You can simply add new properties here
};
newButtonsProperties = {...SearchByDistance_properties, ...newButtonsProperties}; // Add default properties at the beginning to be sure they work 
delete newButtonsProperties.genreWeight;
delete newButtonsProperties.styleWeight;
delete newButtonsProperties.moodWeight;
delete newButtonsProperties.keyWeight;
delete newButtonsProperties.dateWeight;
delete newButtonsProperties.bpmWeight;
delete newButtonsProperties.dateRange;
delete newButtonsProperties.bpmRange;
delete newButtonsProperties.probPick;
delete newButtonsProperties.scoreFilter;
delete newButtonsProperties.sbd_max_graph_distance;
delete newButtonsProperties.dyngenreWeight;
delete newButtonsProperties.dyngenreRange;
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
{
	const properties = getPropertiesPairs(newButtonsProperties, prefix, 0);
	buttonsBar.list.push(properties);
	// Update cache with user set tags
	doOnce('Update SBD cache', debounce(updateCache, 3000))({properties});
}

/*
	Some button examples for 'search_bydistance.js'. Look at that file to see what they do. Note you must explicitly pass all arguments to make them work, since it's within buttons framework. If we were calling do_searchby_distance() outside buttons, it would work with default arguments.
*/

addButton({
    NearestTracks: new themedButton({x: 0, y: 0, w: 106, h: 22}, 'Nearest Tracks', function () {
		let t0 = Date.now();
		let t1 = 0;
		const args = {genreWeight: 15, styleWeight: 10, moodWeight: 5, keyWeight: 10, dateWeight: 25, bpmWeight: 5,  dateRange: 15, 
					bpmRange: 25, probPick: 100, scoreFilter: 70, sbd_max_graph_distance: music_graph_descriptors.intra_supergenre / 2, 
					dyngenreWeight: 25, dyngenreRange: 1,
					properties: getPropertiesPairs(this.buttonsProperties, this.prefix, 0)}; // Mix with only nearest tracks
		do_searchby_distance(args); 
		t1 = Date.now();
		console.log('Call to do_searchby_distance NearestTracks took ' + (t1 - t0) + ' milliseconds.');
	}, null, void(0), 'Random mix with only nearest tracks', prefix, newButtonsProperties, chars.wand),
	
	SimilarTracks: new themedButton({x: 0, y: 0, w: 103, h: 22}, 'Similar Tracks', function () {
		let t0 = Date.now();
		let t1 = 0;
		const args = {genreWeight: 15, styleWeight: 10, moodWeight: 5, keyWeight: 5, dateWeight: 25, bpmWeight: 5,  dateRange: 15, 
					bpmRange: 25, probPick: 100, scoreFilter: 60, sbd_max_graph_distance: music_graph_descriptors.cluster, 
					dyngenreWeight: 10, dyngenreRange: 1,
					properties: getPropertiesPairs(this.buttonsProperties, this.prefix, 0)}; // Mix a bit varied on styles/genres most from the same decade
		do_searchby_distance(args);
		t1 = Date.now();
		console.log('Call to do_searchby_distance SimilarTracks took ' + (t1 - t0) + ' milliseconds.');
	}, null, void(0), 'Random mix a bit varied on styles (but similar genre), most tracks within a decade', prefix, newButtonsProperties, chars.wand),
	
    SimilarGenres: new themedButton({x: 0, y: 0, w: 103, h: 22}, 'Similar Genres', function () {
		let t0 = Date.now();
		let t1 = 0;
		const args = {genreWeight: 0, styleWeight: 5, moodWeight: 15, keyWeight: 10, dateWeight: 25, bpmWeight: 5,  dateRange: 15, 
					bpmRange: 25, probPick: 100, scoreFilter: 60, sbd_max_graph_distance: music_graph_descriptors.intra_supergenre * 3/2, 
					dyngenreWeight: 10, dyngenreRange: 2,
					properties: getPropertiesPairs(this.buttonsProperties, this.prefix, 0)}; // Mix even more varied on styles/genres most from the same decade
		do_searchby_distance(args);
		t1 = Date.now();
		console.log('Call to do_searchby_distance SimilarGenres took ' + (t1 - t0) + ' milliseconds.');
	}, null, void(0), 'Random mix even more varied on styles/genres, most tracks within a decade', prefix, newButtonsProperties, chars.wand),
	
	SimilarMood: new themedButton({x: 0, y: 0, w: 103, h: 22}, 'Similar Mood', function () {
		let t0 = Date.now();
		let t1 = 0;
		const args = {genreWeight: 0, styleWeight: 5, moodWeight: 15, keyWeight: 10, dateWeight: 0, bpmWeight: 5, 
					bpmRange: 25, probPick: 100, scoreFilter: 50, sbd_max_graph_distance: music_graph_descriptors.intra_supergenre * 4, 
					dyngenreWeight: 5, dyngenreRange: 4,
					properties: getPropertiesPairs(this.buttonsProperties, this.prefix, 0)}; // Mix with different genres but same mood from any date
		do_searchby_distance(args);
		t1 = Date.now();
		console.log('Call to do_searchby_distance SimilarMood took ' + (t1 - t0) + ' milliseconds.');
	}, null, void(0), 'Random mix with different genres but same mood from any date', prefix, newButtonsProperties, chars.wand),
});