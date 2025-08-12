'use strict';
//12/08/25

/* exported testGraphNodes, testGraphNodeSets, testGraphNodeSetsWithPath, testGraphCulture */

/* global calcGraphDistance:readable, calcMeanDistanceV2:readable, getNodesFromPath:readable */

// FOR TESTING: compares genre/style A to Band computes distance (similar to the main function for individual links)
// Tip: Use html rendering to find relevant nodes to test. i.e. it's much easier to find distant nodes or possible paths.
// Uses NBA pathFinder as default.
function testGraphNodes(myGraph, influenceMethod = 'adjacentNodes') {
	const test = new FbProfiler('Test nodes');
	let path = [];
	let distance = Infinity;
	let influence = 0;
	const report = [ // here both keys...
		{ name: '<------------------- Arbitrary node distance tests ------------------->' },
		{ from: 'Baroque', to: 'Modernist' },
		{ from: 'New Age', to: 'Modernist' },
		{ from: 'Hard Rock', to: 'Folk-Rock' },
		{ from: 'Jazz Vocal', to: 'Heavy Metal' },
		{ from: 'Grunge', to: 'House' },
		{ from: 'Electronic', to: 'Alt. Rock' },
		{ from: 'Electronic', to: 'Blues Rock' },
		{ from: 'Blues', to: 'Hip-Hop' },
		{ from: 'Trance', to: 'House' },
		{ from: 'Americana', to: 'Folk-Rock' },
		{ from: 'Trip Hop', to: 'Chill-Out Downtempo' },
		{ from: 'Shoegaze', to: 'Indie' },
		{ from: 'Blues Rock', to: 'Gangsta' },
		{ from: 'Blues Rock', to: 'Hip-Hop' },
		{ from: 'Blues Rock', to: 'Blues' },
		{ from: 'Blues', to: 'Blues' },
		{ from: 'Blues', to: 'Heavy Metal' },
		{ from: 'Blues', to: 'Glam Metal' },
		{ from: 'Blues', to: 'Pop Metal' },
		{ from: 'Blues Rock', to: 'Pop Metal' },
		{ from: 'Tuvan', to: 'Desert Blues' },
		{ from: 'Anatolian Rock', to: 'Desert Blues' },
		{ from: 'Pagan Folk', to: 'Americana' },
		{ from: 'Pagan Folk', to: 'Tulsa Sound' },
		{ from: 'P-Funk', to: 'Psychedelic Rock' },
		{ from: 'Emo Rap', to: 'Sadcore' },
		{ from: 'Emo Rap', to: 'Emo Rock' },
		{ from: 'Sadcore', to: 'Nu Metal' },
		{ from: 'Emo Rap', to: 'Jazz-Rap' },
		{ from: 'Emo Rap', to: 'Cloud Rap' },
		{ from: 'Progressive House', to: 'Progressive Trance' },
		{ from: 'Dixieland', to: 'Modal Jazz' },
	].map((o, i) => {
		if (Object.hasOwn(o, 'name')) { return (i !== 0 ? '\n' : '') + o.name; }
		if (Object.hasOwn(o, 'from') && Object.hasOwn(o, 'to')) {
			({ distance, influence, path } = calcGraphDistance(myGraph, o.from, o.to, influenceMethod));
			return getNodesFromPath(path) + '\t' + distance + ' (' + influence + ')';
		}
	});
	fb.ShowPopupMessage(report.join('\n'), 'Music Graph: distance tests - Node'); // DEBUG
	test.Print('', false);
	return report;
}

// FOR TESTING: compares array of styles to other array and computes mean distance (similar to the main function)
// Tip: Use foobar2000 component Text Tools with this as track pattern:
// 		'[' ''$meta_sep(genre,''',' '')'', ''$meta_sep(style,''',' '')''' '']'
// It will output things like this, ready to use here:
// 		[ 'Electronic', 'Hip-Hop', 'Future Bass', 'Chill-Out Downtempo', 'Alt. Rap' ]
function testGraphNodeSets(myGraph, influenceMethod = 'adjacentNodes') {
	const test = new FbProfiler('Test node sets');
	// EDIT HERE
	const report = [
		{ name: '<------------------- Arbitrary set distance tests ------------------->' },
		{
			from: ['Electronic', 'Hip-Hop', 'Future Bass', 'Chill-Out Downtempo', 'Alt. Rap'],
			to: ['Hip-Hop', 'Electronic', 'Indie', 'Ambiental', 'Female Vocal', 'Trip Hop', 'Alt. Rap']
		},
		{
			from: ['Electronic', 'Hip-Hop', 'Future Bass', 'Chill-Out Downtempo', 'Alt. Rap'],
			to: ['Pop', 'Electronic', 'Electropop', 'Trap', 'Female Vocal', 'Sadcore']
		},
		{
			from: ['World', 'African', 'Blues', 'Folk', 'Malian Folk', 'Desert Blues'],
			to: ['Alt. Rock', 'New Wave']
		},
		{
			from: ['Alt. Rock', 'Indie', 'Dream Pop', '90s Rock'],
			to: ['Folk-Rock', 'Indie', 'Folk Pop', 'Contemporary Folk', 'Americana']
		},
		{
			from: ['Rock', 'Blues', 'Classic Rock', 'Blues Rock', 'Beat Music', 'Electric Blues'],
			to: ['Country', 'Country Boogie', 'Lo-Fi']
		},
		{
			from: ['Blues', 'Chicago Blues', 'Electric Blues'],
			to: ['Electronic', 'Pop', 'Experimental', 'Female Vocal']
		},
		{
			from: ['Classical', 'Romantic'],
			to: ['Alt. Rock', 'Electronic', 'Electropop', 'Baroque Pop', 'Female Vocal']
		},
		{
			from: ['Alt. Rock', 'Electronic', 'Electropop', 'Baroque Pop', 'Female Vocal'],
			to: ['Electronic', 'House']
		},
		{
			from: ['Electronic', 'Heavy Metal', 'Nu Metal'],
			to: ['World', 'African', 'Electronic', 'Jazz Vocal', 'Future Jazz']
		},
		{
			from: ['World', 'African', 'Electronic', 'Jazz Vocal', 'Future Jazz'],
			to: ['Rock', 'Blues', 'Classic Rock', 'Blues Rock', 'Beat Music', 'Electric Blues']
		},
		{
			from: ['Alt. Rock', 'Electronic', 'Electropop', 'Baroque Pop', 'Female Vocal'],
			to: ['Electronic', 'House']
		},
		{
			from: ['Electronic', 'Pop', 'Electropop', 'Electro', 'Female Vocal'],
			to: ['Rock', 'Funk', 'R&B', 'Lo-Fi', 'Garage Rock', 'Funk Rock', 'Jam']
		},
		{
			from: ['Grunge', 'Grunge Metal', 'Classic Grunge'],
			to: ['Hard Rock', 'Heavy Metal', 'Classic Rock', 'Doom Metal', 'Proto-Metal']
		},
		{
			from: ['Hard Rock', 'Heavy Metal', 'Classic Rock', 'Doom Metal', 'Proto-Metal'],
			to: ['Jazz Vocal', 'Traditional Pop']
		},
		{
			from: ['Jazz Vocal', 'Traditional Pop'],
			to: ['New Age', 'Soundtrack', 'Neo-Classical New Age', 'Healing Music']
		},
		{
			from: ['Jazz Vocal', 'Traditional Pop'],
			to: ['Electronic', 'Pop', 'Electropop', 'Electro', 'Female Vocal']
		},
		{
			from: ['Jazz Vocal', 'Traditional Pop'],
			to: ['Psychedelic Rock', 'Progressive Rock', 'British Psychedelia', 'Proto-Prog']
		},
		{
			from: ['Hard Rock', 'Heavy Metal', 'Classic Rock', 'Doom Metal', 'Proto-Metal'],
			to: ['Psychedelic Rock', 'Progressive Rock', 'British Psychedelia', 'Proto-Prog']
		},
		{
			from: ['Jazz Vocal', 'Traditional Pop'],
			to: ['Reggae', 'Instrumental', 'Dub']
		},
		{
			from: ['Rock', 'Surf Rock'],
			to: ['Psychedelic Rock', 'Progressive Rock', 'British Psychedelia', 'Proto-Prog']
		},
		{
			from: ['Blues', 'Blues Rock', 'Modern Electric Blues', 'Electric Blues'],
			to: ['Hip-Hop', 'Gangsta', 'West Coast']
		},
		{
			from: ['Blues', 'Blues Rock', 'Modern Electric Blues', 'Electric Blues'],
			to: ['Hard Rock', 'Heavy Metal', 'Glam Metal', 'Pop Metal']
		},
		{
			from: ['Jazz', 'Dixieland'],
			to: ['Jazz', 'Modal Jazz']
		},
		// Exchanging one genre from the Reference with one from the Target outputs different distance
		{ name: '<------------------- Exchange asymmetry ------------------->' },
		{
			from: ['Hard Rock', 'Heavy Metal', 'Classic Rock', 'Doom Metal', 'Proto-Metal'],
			to: ['Psychedelic Rock', 'Turkish', 'Anatolian Rock']
		},
		{
			from: ['Hard Rock', 'Heavy Metal', 'Classic Rock', 'Anatolian Rock', 'Proto-Metal'],
			to: ['Psychedelic Rock', 'Turkish', 'Doom Metal']
		},
		// If Reference is a superset of Target (or the opposite) distance is zero
		{ name: '<------------------- Superset symmetry ------------------->' },
		{
			from: ['Hard Rock', 'Heavy Metal', 'Classic Rock', 'Doom Metal', 'Proto-Metal'],
			to: ['Hard Rock', 'Heavy Metal', 'Classic Rock', 'Doom Metal']
		},
		{
			from: ['Hard Rock', 'Heavy Metal', 'Classic Rock', 'Doom Metal'],
			to: ['Hard Rock', 'Heavy Metal', 'Classic Rock', 'Doom Metal', 'Proto-Metal']
		},
		// If Reference is equal to Target distance is zero (i.e. specific case of superset symmetry)
		{ name: '<------------------- Identity symmetry ------------------->' },
		{
			from: ['Hard Rock', 'Heavy Metal', 'Classic Rock', 'Doom Metal', 'Proto-Metal'],
			to: ['Hard Rock', 'Heavy Metal', 'Classic Rock', 'Doom Metal', 'Proto-Metal']
		},
		// Reference -> Target outputs the same distance than Target -> Reference
		{ name: '<------------------- Inversion symmetry ------------------->' },
		{
			from: ['Psychedelic Rock', 'Turkish', 'Anatolian Rock'],
			to: ['World', 'African', 'Blues', 'Folk', 'Malian Folk', 'Desert Blues']
		},
		{
			from: ['World', 'African', 'Blues', 'Folk', 'Malian Folk', 'Desert Blues'],
			to: ['Psychedelic Rock', 'Turkish', 'Anatolian Rock']
		},
	].map((o, i) => (Object.hasOwn(o, 'name') ? (i !== 0 ? '\n' : '') + o.name : '') + (Object.hasOwn(o, 'from') && Object.hasOwn(o, 'to')
		? o.from + ' <- ' + o.to + ' = ' + calcMeanDistanceV2(myGraph, o.from, o.to, influenceMethod)
		: '')
	);
	fb.ShowPopupMessage(report.join('\n'), 'Music Graph: distance tests - Node set'); // DEBUG
	test.Print('', false);
	return report;
}

// FOR TESTING: compares array of styles to other array and computes mean distance (similar to the main function)
// Tip: Use foobar2000 component Text Tools with this as track pattern:
// 		'[' ''$meta_sep(genre,''',' '')'', ''$meta_sep(style,''',' '')''' '']'
// It will output things like this, ready to use here:
// 		[ 'Electronic', 'Hip-Hop', 'Future Bass', 'Chill-Out Downtempo', 'Alt. Rap' ]
function testGraphNodeSetsWithPath(myGraph, influenceMethod = 'adjacentNodes') {
	const test = new FbProfiler('Test node sets + paths');
	// EDIT HERE
	const report = [
		{ name: '<------------------- Arbitrary set distance tests ------------------->' },
		{
			from: ['World', 'African', 'Electronic', 'Jazz Vocal', 'Future Jazz'],
			to: ['Rock', 'Blues', 'Classic Rock', 'Blues Rock', 'Beat Music', 'Electric Blues']
		},
	].map((o, i) => {
		if (Object.hasOwn(o, 'name')) { return (i !== 0 ? '\n' : '') + o.name; }
		if (Object.hasOwn(o, 'from') && Object.hasOwn(o, 'to')) {
			let text = Object.hasOwn(o, 'from') && Object.hasOwn(o, 'to')
				? o.from + ' <- ' + o.to + ' = ' + calcMeanDistanceV2(myGraph, o.from, o.to, influenceMethod)
				: '';
			text += '\n\t' + o.from.map((nodeFrom) => {
				let min = { distance: Infinity };
				o.to.forEach((nodeTo) => {
					const { distance, influence, path } = calcGraphDistance(myGraph, nodeFrom, nodeTo, influenceMethod);
					if (distance < min.distance) { min = { distance, text: getNodesFromPath(path) + '\t' + distance + ' (' + influence + ')' }; }
				});
				return min.text;
			}).filter(Boolean).join('\n\t');
			return text;
		}
	});
	fb.ShowPopupMessage(report.join('\n'), 'Music Graph: distance tests - Node set + paths'); // DEBUG
	test.Print('', false);
	return report;
}

function testGraphCulture(cultureDescriptors) {
	const test = new FbProfiler('Test cultural nodes');
	const report = [
		'<------------------- Culture node distance tests ------------------->',
		...[
			['Deep House', 'Crossover Thrash'],	// 1
			['Deep House', 'Deep House'],		// 0
			['Tex-Mex', 'Deep House'],			// 2
			['Aussie Rock', 'New Wave'],		// 4
			['Disco', 'New Wave'],				// 1
		].map((pair) => pair.join(' <-> ') + ' = ' + cultureDescriptors.getDistance(...pair))
	];
	fb.ShowPopupMessage(report.join('\n'), 'Music Graph: distance tests - Cultural node'); // DEBUG
	test.Print('', false);
	return report;
}