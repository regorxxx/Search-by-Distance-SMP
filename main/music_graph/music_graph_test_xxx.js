'use strict';
//12/06/24

/* exported testGraphNodes, testGraphNodeSets */

/* global calcGraphDistance:readable, calcMeanDistanceV2:readable, getNodesFromPath:readable */

// FOR TESTING: compares genre/style A to Band computes distance (similar to the main function for individual links)
// Tip: Use html rendering to find relevant nodes to test. i.e. it's much easier to find distant nodes or possible paths.
// Uses NBA pathFinder as default.
function testGraphNodes(mygraph) {
	const test = new FbProfiler('Test nodes');
	let path = [];
	let idpath = '';
	let distance = Infinity;
	let influence = 0;
	[ // here both keys...
		{name: '<------------------- Arbitrary node distance tests ------------------->'},
		{from: 'Baroque',		to: 'Modernist'},
		{from: 'New Age',		to: 'Modernist'},
		{from: 'Hard Rock',		to: 'Folk-Rock'},
		{from: 'Jazz Vocal',	to: 'Heavy Metal'},
		{from: 'Grunge',		to: 'House'},
		{from: 'Electronic',	to: 'Alt. Rock'},
		{from: 'Electronic',	to: 'Blues Rock'},
		{from: 'Blues',			to: 'Hip-Hop'},
		{from: 'Trance',		to: 'House'},
		{from: 'Americana',		to: 'Folk-Rock'},
		{from: 'Trip Hop',		to: 'Chill-Out Downtempo'},
		{from: 'Shoegaze',		to: 'Indie'},
		{from: 'Blues Rock',	to: 'Gangsta'},
		{from: 'Blues Rock',	to: 'Hip-Hop'},
		{from: 'Blues Rock',	to: 'Blues'},
		{from: 'Blues',			to: 'Blues'},
		{from: 'Blues',			to: 'Heavy Metal'},
		{from: 'Blues',			to: 'Glam Metal'},
		{from: 'Blues',			to: 'Pop Metal'},
		{from: 'Blues Rock',	to: 'Pop Metal'},
		{from: 'Tuvan',			to: 'Desert Blues'},
		{from: 'Anatolian Rock',to: 'Desert Blues'},
		{from: 'Pagan Folk',	to: 'Americana'},
		{from: 'Pagan Folk',	to: 'Tulsa Sound'},
		{from: 'P-Funk',		to: 'Psychedelic Rock'},
		{from: 'Emo Rap',		to: 'Sadcore'},
		{from: 'Emo Rap',		to: 'Emo Rock'},
		{from: 'Sadcore',		to: 'Nu Metal'},
		{from: 'Emo Rap',		to: 'Jazz-Rap'},
		{from: 'Emo Rap',		to: 'Cloud Rap'},
	].forEach((o) => {
		if (Object.hasOwn(o, 'name')) {console.log(o.name);}
		if (Object.hasOwn(o, 'from') && Object.hasOwn(o, 'to')) {
			({distance, influence, path} = calcGraphDistance(mygraph, o.from, o.to, true));
			idpath = getNodesFromPath(path);
			console.log(idpath + '\t' + distance + ' (' + influence + ')'); // DEBUG
		}
	});
	test.Print('', false);
}

// FOR TESTING: compares array of styles to other array and computes mean distance (similar to the main function)
// Tip: Use foobar2000 component Text Tools with this as track pattern:
// 		'[' ''$meta_sep(genre,''',' '')'', ''$meta_sep(style,''',' '')''' '']'
// It will output things like this, ready to use here:
// 		[ 'Electronic', 'Hip-Hop', 'Future Bass', 'Chill-Out Downtempo', 'Alt. Rap' ]
function testGraphNodeSets(mygraph) {
	const test = new FbProfiler('Test node sets');
	// EDIT HERE
	[
		{	name: '<------------------- Arbitrary set distance tests ------------------->'},
		{
			from:	[ 'Electronic', 'Hip-Hop', 'Future Bass', 'Chill-Out Downtempo', 'Alt. Rap' ],
			to:		[ 'Hip-Hop', 'Electronic', 'Indie', 'Ambiental', 'Female Vocal', 'Trip Hop', 'Alt. Rap' ]
		},
		{
			from:	[ 'Electronic', 'Hip-Hop', 'Future Bass', 'Chill-Out Downtempo', 'Alt. Rap' ],
			to:		[ 'Pop', 'Electronic', 'Electropop', 'Trap', 'Female Vocal', 'Sadcore' ]
		},
		{
			from:	[ 'World', 'African', 'Blues', 'Folk', 'Malian Folk', 'Desert Blues' ],
			to:		[ 'Alt. Rock', 'New Wave' ]
		},
		{
			from:	[ 'Alt. Rock', 'Indie', 'Dream Pop', '90s Rock' ],
			to:		[ 'Folk-Rock', 'Indie', 'Folk Pop', 'Contemporary Folk', 'Americana' ]
		},
		{
			from:	[ 'Rock', 'Blues', 'Classic Rock', 'Blues Rock', 'Beat Music', 'Electric Blues' ],
			to:		[ 'Country', 'Country Boogie', 'Lo-Fi' ]
		},
		{
			from:	[ 'Blues', 'Chicago Blues', 'Electric Blues' ],
			to:		[ 'Electronic', 'Pop', 'Experimental', 'Female Vocal' ]
		},
		{
			from:	[ 'Classical', 'Romantic' ],
			to:		[ 'Alt. Rock', 'Electronic', 'Electropop', 'Baroque Pop', 'Female Vocal' ]
		},
		{
			from:	[ 'Alt. Rock', 'Electronic', 'Electropop', 'Baroque Pop', 'Female Vocal' ],
			to:		[ 'Electronic', 'House' ]
		},
		{
			from:	[ 'Electronic', 'Heavy Metal', 'Nu Metal' ],
			to:		[ 'World', 'African', 'Electronic', 'Jazz Vocal', 'Future Jazz' ]
		},
		{
			from:	[ 'World', 'African', 'Electronic', 'Jazz Vocal', 'Future Jazz' ],
			to:		[ 'Rock', 'Blues', 'Classic Rock', 'Blues Rock', 'Beat Music', 'Electric Blues' ]
		},
		{
			from:	[ 'Alt. Rock', 'Electronic', 'Electropop', 'Baroque Pop', 'Female Vocal' ],
			to:		[ 'Electronic', 'House' ]
		},
		{
			from:	[ 'Electronic', 'Pop', 'Electropop', 'Electro', 'Female Vocal' ],
			to:		[ 'Rock', 'Funk', 'R&B', 'Lo-Fi', 'Garage Rock', 'Funk Rock', 'Jam' ]
		},
		{
			from:	[ 'Grunge', 'Grunge Metal', 'Classic Grunge' ],
			to:		[ 'Hard Rock', 'Heavy Metal', 'Classic Rock', 'Doom Metal', 'Proto-Metal' ]
		},
		{
			from:	[ 'Hard Rock', 'Heavy Metal', 'Classic Rock', 'Doom Metal', 'Proto-Metal' ],
			to:		[ 'Jazz Vocal', 'Traditional Pop' ]
		},
		{
			from:	[ 'Jazz Vocal', 'Traditional Pop' ],
			to:		[ 'New Age', 'Soundtrack', 'Neo-Classical New Age', 'Healing Music' ]
		},
		{
			from:	[ 'Jazz Vocal', 'Traditional Pop' ],
			to:		[ 'Electronic', 'Pop', 'Electropop', 'Electro', 'Female Vocal' ]
		},
		{
			from:	[ 'Jazz Vocal', 'Traditional Pop' ],
			to:		[ 'Psychedelic Rock', 'Progressive Rock', 'British Psychedelia', 'Proto-Prog' ]
		},
		{
			from:	[ 'Hard Rock', 'Heavy Metal', 'Classic Rock', 'Doom Metal', 'Proto-Metal' ],
			to:		[ 'Psychedelic Rock', 'Progressive Rock', 'British Psychedelia', 'Proto-Prog' ]
		},
		{
			from:	[ 'Jazz Vocal', 'Traditional Pop' ],
			to:		[ 'Reggae', 'Instrumental', 'Dub' ]
		},
		{
			from:	[ 'Rock', 'Surf Rock' ],
			to:		[ 'Psychedelic Rock', 'Progressive Rock', 'British Psychedelia', 'Proto-Prog' ]
		},
		{
			from:	[ 'Blues', 'Blues Rock', 'Modern Electric Blues', 'Electric Blues' ],
			to:		[ 'Hip-Hop', 'Gangsta', 'West Coast' ]
		},
		{
			from:	[ 'Blues', 'Blues Rock', 'Modern Electric Blues', 'Electric Blues' ],
			to:		[ 'Hard Rock', 'Heavy Metal', 'Glam Metal', 'Pop Metal' ]
		},
		// Exchanging one genre from the Reference with one from the Target outputs different distance
		{	name: '<------------------- Exchange asymmetry ------------------->'},
		{
			from:	[ 'Hard Rock', 'Heavy Metal', 'Classic Rock', 'Doom Metal', 'Proto-Metal' ],
			to:		[ 'Psychedelic Rock', 'Turkish', 'Anatolian Rock']
		},
		{
			from:	[ 'Hard Rock', 'Heavy Metal', 'Classic Rock', 'Anatolian Rock', 'Proto-Metal' ],
			to:		[ 'Psychedelic Rock', 'Turkish', 'Doom Metal']
		},
		// If Reference is a superset of Target (or the opposite) distance is zero
		{	name: '<------------------- Superset symmetry ------------------->'},
		{
			from:	[ 'Hard Rock', 'Heavy Metal', 'Classic Rock', 'Doom Metal', 'Proto-Metal' ],
			to:		[ 'Hard Rock', 'Heavy Metal', 'Classic Rock', 'Doom Metal' ]
		},
		{
			from:	[ 'Hard Rock', 'Heavy Metal', 'Classic Rock', 'Doom Metal' ],
			to:		[ 'Hard Rock', 'Heavy Metal', 'Classic Rock', 'Doom Metal', 'Proto-Metal' ]
		},
		// If Reference is equal to Target distance is zero (i.e. specific case of superset symmetry)
		{	name: '<------------------- Identity symmetry ------------------->'},
		{
			from:	[ 'Hard Rock', 'Heavy Metal', 'Classic Rock', 'Doom Metal', 'Proto-Metal' ],
			to:		[ 'Hard Rock', 'Heavy Metal', 'Classic Rock', 'Doom Metal', 'Proto-Metal'  ]
		},
		// Reference -> Target outputs the same distance than Target -> Reference
		{	name: '<------------------- Inversion symmetry ------------------->'},
		{
			from:	[ 'Psychedelic Rock', 'Turkish', 'Anatolian Rock' ],
			to:		[ 'World', 'African', 'Blues', 'Folk', 'Malian Folk', 'Desert Blues' ]
		},
		{
			from:	[ 'World', 'African', 'Blues', 'Folk', 'Malian Folk', 'Desert Blues' ],
			to:		[ 'Psychedelic Rock', 'Turkish', 'Anatolian Rock' ]
		},
	].forEach((o) => {
		if (Object.hasOwn(o, 'name')) {console.log(o.name);}
		if (Object.hasOwn(o, 'from') && Object.hasOwn(o, 'to')) {
			console.log(o.from + ' <- ' + o.to + ' = ' + calcMeanDistanceV2(mygraph, o.from, o.to)); // DEBUG
		}
	});

	test.Print('', false);
}