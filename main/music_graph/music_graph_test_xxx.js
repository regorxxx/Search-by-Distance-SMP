﻿'use strict';
//23/07/23

// FOR TESTING: compares genre/style A to Band computes distance (similar to the main function for individual links)
// Tip: Use html rendering to find relevant nodes to test. i.e. it's much easier to find distant nodes or possible paths.
// Uses NBA pathFinder as default.
function testGraph(mygraph) {
		const test = new FbProfiler('Test nodes');
		const pathFinder = nba(mygraph, {
			distance(fromNode, toNode, link) {
			return link.data.weight;
			}
		});
		let path = [];
		let idpath = '';
		let distanceGraph = Infinity;
		
		[ // here both keys...
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
		].forEach((o) => {
			path = pathFinder.find(o.from, o.to);
			distanceGraph = calcGraphDistance(mygraph, o.from, o.to, true);
			idpath = getNodesFromPath(path);
			console.log(idpath + '\t' + distanceGraph);
		});
		
		test.Print('', false);
}

// FOR TESTING: compares array of styles to other array and computes mean distance (similar to the main function)
// Tip: Use foobar2000 component Text Tools with this as track pattern:
// 		'[' ''$meta_sep(genre,''',' '')'', ''$meta_sep(style,''',' '')''' '']'
// It will output things like this, ready to use here:
// 		[ 'Electronic', 'Hip-Hop', 'Future Bass', 'Chill-Out Downtempo', 'Alt. Rap' ]
function testGraphV2(mygraph) {
	const test = new FbProfiler('Test node arrays');
	// EDIT HERE
	[
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
		{
			from:	[ 'World', 'African', 'Blues', 'Malian Folk', 'Desert Blues', 'Electric Blues' ],
			to:		[ 'Blues', 'Hill Country Blues', 'Electric Blues', 'Harmonica Blues' ]
		},
		{
			from:	[ 'Psychedelic Rock', 'Turkish', 'Anatolian Rock' ],
			to:		[ 'World', 'African', 'Blues', 'Folk', 'Malian Folk', 'Desert Blues' ]
		},
	].forEach((o) => {
		console.log(o.from + ' <- ' + o.to + ' = ' + calcMeanDistanceV2(mygraph, o.from, o.to));
	});
	
	test.Print('', false);
}