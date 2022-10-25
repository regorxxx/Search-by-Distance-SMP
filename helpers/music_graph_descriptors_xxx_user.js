'use strict';
//25/10/22

/*
	This is a sample file to show how to replace/add/delete genre and styles
	at music_graph_descriptors without touching the original file.
	Just copy properties from the original file 'helpers\music_graph_descriptors_xxx.js'
	to this one and edit whatever you want. Full documentation is also present there.
	
	The replacement follow this logic (according to Data Type):
		-Always replaced: Strings , numbers, booleans
		-Adds new values: new elements on arrays and sets.
		-Replaces old values with new ones: elements present on both arrays
		-Deletes old values: elements present on both sets
	Note properties need a ',' after the values:
		propertyA: value,
		propertyB: 'valueB',
		propertyC: [valueC, [subValuesC]],
		...
*/

const music_graph_descriptors_user = {
	/* 	
		----------------------------------------------------------------------------------------------------
														Arrays												
		----------------------------------------------------------------------------------------------------
		// Array values can either be replaced, delete or added to the original one.
		// This example would replace the original value with a new one.
		// Replacing 'Classical Modernist Era_supergenre' parent with only a single genre or style .
		style_supergenre: [
			['Classical Modernist Era_supergenre',	['Third Stream']]
		],
		
		// Usually that's not the intended result. Adding/removing a new genre or style involves copying the original list too.
		// On this example 'Contemporary Classical' and 'Neo-Classical' have been removed and a new style added.
		style_supergenre: [
			['Classical Modernist Era_supergenre',	['Avant-Garde Classical','Third Stream','Ambient Classical','My own style']],
		],
		
		// This example would simply delete the old value (= replacing it with empty values)
		// Note all links, like influences, substitutions, etc. must also be deleted, otherwise warnings will appear on testing
		// about errors (due to links pointing to non-existing nodes).
		style_supergenre: [
			['Classical Modernist Era_supergenre',	[]]
		],
		
		// This example would add a new parent SuperGenre, with 2 new genre/styles.
		style_supergenre: [
			['My Own_supergenre',	['My Own Style/Genre A', 'My Own Style/Genre B']]
		],
		
		// Don't forget to add the color legend for the HTML drawing :)
		map_colors: [
			['My Own_supergenre', '#adadad'],
		],
	*/

	/*
		----------------------------------------------------------------------------------------------------
														Sets												
		----------------------------------------------------------------------------------------------------
		// Set values can either be deleted or added  to the original one.
		// Deletes 'Female Vocal' (since it was already present) and adds a new one 'My New Set Value'.
		map_distance_exclusions: new Set([
			'Female Vocal','My New Set Value'
		]), 
	*/
	
	/*
		----------------------------------------------------------------------------------------------------
											Numbers, strings, booleans										
		----------------------------------------------------------------------------------------------------
		// Numbers can also be directly edited
		primary_origin: 200,
		
		// strings
		nodeShape: 'circle',
		
		// and boolean properties
		bPreRender: false,
	*/
};

// Don't edit past this line...
if (Object.keys(music_graph_descriptors_user).length) {
	if (typeof include === 'undefined') { // On browser
		console.log('User\'s music_graph_descriptors - File loaded: music_graph_descriptors_xxx_user.js');
	}
	const oldDesc = music_graph_descriptors;
	const newDesc = music_graph_descriptors_user;
	Object.keys(newDesc).forEach((key) => { // We have only: arrays, sets, strings, numbers and booleans properties
			if (Array.isArray(oldDesc[key]) && Array.isArray(newDesc[key])) { // Concatenate arrays and replace elements on both
				newDesc[key].forEach((nodeArray, i) => {
						// [ [A,[values]], ..., [[X,[values]], ... ] index of X within main array? Using flat() length gets doubled.
						const doubleIndex = oldDesc[key].flat().indexOf(nodeArray[0]);
						const index =  !(doubleIndex & 1) ? doubleIndex / 2 : -1; // -1 for odd indexes, halved for even values
						if (index !== -1) { // If present on both files, replace with new value
							oldDesc[key][index] = newDesc[key][i]; // Note replacing [A,[B,C]] with [A,[]] is the same than deleting the line, since no link will be created. And only links are added to the graph (not individual nodes).
						} else { // Concat
							oldDesc[key].push(newDesc[key][i]);
						}
					}
				);
			} else if (oldDesc[key].constructor === Set && newDesc[key].constructor === Set) { // Merge sets and delete elements on both
				const toDelete = oldDesc[key].intersection(newDesc[key]); 
				oldDesc[key] = oldDesc[key].union(newDesc[key]);
				oldDesc[key] = oldDesc[key].difference(toDelete);
			} else { // Replace numbers, strings and booleans
				oldDesc[key] = newDesc[key];
			}
	});
} else {
	if (typeof include === 'undefined') { // On browser
		console.log('User\'s music_graph_descriptors has been loaded but it contains no changes... using only default one.');
	}
}