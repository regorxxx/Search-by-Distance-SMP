'use strict';
//01/07/22

// FOR TESTING: compares genre/style A to Band computes distance (similar to the main function for individual links)
// Tip: Use html rendering to find relevant nodes to test. i.e. it's much easier to find distant nodes or possible paths.
// Uses NBA pathFinder as default. Edit key_one and key_two as required.
function testGraph(mygraph) {
			
		let pathFinder = nba(mygraph, {
			distance(fromNode, toNode, link) {
			return link.data.weight;
			}
		});
		
		let path = [];
		let idpath = '';
		let distanceGraph = Infinity;
		let keyOne = '';
		let keyTwo = '';
		
		keyOne = 'Baroque'; // here both keys...
		keyTwo = 'Modernist';
		path = pathFinder.find(keyOne, keyTwo);
		distanceGraph = getDistanceFromPath(mygraph, path);
		idpath = getNodesFromPath(path);
		console.log(keyOne + ' - ' + keyTwo + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calcGraphDistance(mygraph, keyOne, keyTwo, true);
		console.log(distanceGraph);
		
		keyOne = 'New Age';
		keyTwo = 'Modernist';
		path = pathFinder.find(keyOne, keyTwo);
		distanceGraph = getDistanceFromPath(mygraph, path);
		idpath = getNodesFromPath(path);
		console.log(keyOne + ' - ' + keyTwo + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calcGraphDistance(mygraph, keyOne, keyTwo, true);
		console.log(distanceGraph);
		
		keyOne = 'Hard Rock';
		keyTwo = 'Folk-Rock';
		path = pathFinder.find(keyOne, keyTwo);
		distanceGraph = getDistanceFromPath(mygraph, path);
		idpath = getNodesFromPath(path);
		console.log(keyOne + ' - ' + keyTwo + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calcGraphDistance(mygraph, keyOne, keyTwo, true);
		console.log(distanceGraph);
		
		keyOne = 'Jazz Vocal';
		keyTwo = 'Heavy Metal';
		path = pathFinder.find(keyOne, keyTwo);
		distanceGraph = getDistanceFromPath(mygraph, path);
		idpath = getNodesFromPath(path);
		console.log(keyOne + ' - ' + keyTwo + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calcGraphDistance(mygraph, keyOne, keyTwo, true);
		console.log(distanceGraph);
		
		keyOne = 'Grunge';
		keyTwo = 'House';
		path = pathFinder.find(keyOne, keyTwo);
		distanceGraph = getDistanceFromPath(mygraph, path);
		idpath = getNodesFromPath(path);
		console.log(keyOne + ' - ' + keyTwo + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calcGraphDistance(mygraph, keyOne, keyTwo, true);
		console.log(distanceGraph);
		
		keyOne = 'Electronic';
		keyTwo = 'Alt. Rock';
		path = pathFinder.find(keyOne, keyTwo);
		distanceGraph = getDistanceFromPath(mygraph, path);
		idpath = getNodesFromPath(path);
		console.log(keyOne + ' - ' + keyTwo + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calcGraphDistance(mygraph, keyOne, keyTwo, true);
		console.log(distanceGraph);
		
		keyOne = 'Electronic';
		keyTwo = 'Blues Rock';
		path = pathFinder.find(keyOne, keyTwo);
		distanceGraph = getDistanceFromPath(mygraph, path);
		idpath = getNodesFromPath(path);
		console.log(keyOne + ' - ' + keyTwo + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calcGraphDistance(mygraph, keyOne, keyTwo, true);
		console.log(distanceGraph);
		
		keyOne = 'Blues';
		keyTwo = 'Hip-Hop';
		path = pathFinder.find(keyOne, keyTwo);
		distanceGraph = getDistanceFromPath(mygraph, path);
		idpath = getNodesFromPath(path);
		console.log(keyOne + ' - ' + keyTwo + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calcGraphDistance(mygraph, keyOne, keyTwo, true);
		console.log(distanceGraph);
		
		keyOne = 'Trance';
		keyTwo = 'House';
		path = pathFinder.find(keyOne, keyTwo);
		distanceGraph = getDistanceFromPath(mygraph, path);
		idpath = getNodesFromPath(path);
		console.log(keyOne + ' - ' + keyTwo + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calcGraphDistance(mygraph, keyOne, keyTwo, true);
		console.log(distanceGraph);
		
		keyOne = 'Americana';
		keyTwo = 'Folk-Rock';
		path = pathFinder.find(keyOne, keyTwo);
		distanceGraph = getDistanceFromPath(mygraph, path);
		idpath = getNodesFromPath(path);
		console.log(keyOne + ' - ' + keyTwo + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calcGraphDistance(mygraph, keyOne, keyTwo, true);
		console.log(distanceGraph);
		
		keyOne = 'Trip Hop';
		keyTwo = 'Chill-Out Downtempo';
		path = pathFinder.find(keyOne, keyTwo);
		distanceGraph = getDistanceFromPath(mygraph, path);
		idpath = getNodesFromPath(path);
		console.log(keyOne + ' - ' + keyTwo + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calcGraphDistance(mygraph, keyOne, keyTwo, true);
		console.log(distanceGraph);
		
		keyOne = 'Shoegaze';
		keyTwo = 'Indie';
		path = pathFinder.find(keyOne, keyTwo);
		distanceGraph = getDistanceFromPath(mygraph, path);
		idpath = getNodesFromPath(path);
		console.log(keyOne + ' - ' + keyTwo + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calcGraphDistance(mygraph, keyOne, keyTwo, true);
		console.log(distanceGraph);
		
		keyOne = 'Blues Rock';
		keyTwo = 'Gangsta';
		path = pathFinder.find(keyOne, keyTwo);
		distanceGraph = getDistanceFromPath(mygraph, path);
		idpath = getNodesFromPath(path);
		console.log(keyOne + ' - ' + keyTwo + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calcGraphDistance(mygraph, keyOne, keyTwo, true);
		console.log(distanceGraph);
		
		keyOne = 'Blues Rock';
		keyTwo = 'Hip-Hop';
		path = pathFinder.find(keyOne, keyTwo);
		distanceGraph = getDistanceFromPath(mygraph, path);
		idpath = getNodesFromPath(path);
		console.log(keyOne + ' - ' + keyTwo + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calcGraphDistance(mygraph, keyOne, keyTwo, true);
		console.log(distanceGraph);
		
		keyOne = 'Blues Rock';
		keyTwo = 'Blues';
		path = pathFinder.find(keyOne, keyTwo);
		distanceGraph = getDistanceFromPath(mygraph, path);
		idpath = getNodesFromPath(path);
		console.log(keyOne + ' - ' + keyTwo + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calcGraphDistance(mygraph, keyOne, keyTwo, true);
		console.log(distanceGraph);
		
		keyOne = 'Blues';
		keyTwo = 'Blues';
		path = pathFinder.find(keyOne, keyTwo);
		distanceGraph = getDistanceFromPath(mygraph, path);
		idpath = getNodesFromPath(path);
		console.log(keyOne + ' - ' + keyTwo + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calcGraphDistance(mygraph, keyOne, keyTwo, true);
		console.log(distanceGraph);
		
		keyOne = 'Blues';
		keyTwo = 'Heavy Metal';
		path = pathFinder.find(keyOne, keyTwo);
		distanceGraph = getDistanceFromPath(mygraph, path);
		idpath = getNodesFromPath(path);
		console.log(keyOne + ' - ' + keyTwo + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calcGraphDistance(mygraph, keyOne, keyTwo, true);
		console.log(distanceGraph);
		
		keyOne = 'Blues';
		keyTwo = 'Glam Metal';
		path = pathFinder.find(keyOne, keyTwo);
		distanceGraph = getDistanceFromPath(mygraph, path);
		idpath = getNodesFromPath(path);
		console.log(keyOne + ' - ' + keyTwo + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calcGraphDistance(mygraph, keyOne, keyTwo, true);
		console.log(distanceGraph);
		
		keyOne = 'Blues';
		keyTwo = 'Pop Metal';
		path = pathFinder.find(keyOne, keyTwo);
		distanceGraph = getDistanceFromPath(mygraph, path);
		idpath = getNodesFromPath(path);
		console.log(keyOne + ' - ' + keyTwo + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calcGraphDistance(mygraph, keyOne, keyTwo, true);
		console.log(distanceGraph);
		
		keyOne = 'Blues Rock';
		keyTwo = 'Pop Metal';
		path = pathFinder.find(keyOne, keyTwo);
		distanceGraph = getDistanceFromPath(mygraph, path);
		idpath = getNodesFromPath(path);
		console.log(keyOne + ' - ' + keyTwo + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calcGraphDistance(mygraph, keyOne, keyTwo, true);
		console.log(distanceGraph);
		
		keyOne = 'Tuvan';
		keyTwo = 'Desert Blues';
		path = pathFinder.find(keyOne, keyTwo);
		distanceGraph = getDistanceFromPath(mygraph, path);
		idpath = getNodesFromPath(path);
		console.log(keyOne + ' - ' + keyTwo + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calcGraphDistance(mygraph, keyOne, keyTwo, true);
		console.log(distanceGraph);
	
		keyOne = 'Anatolian Rock';
		keyTwo = 'Desert Blues';
		path = pathFinder.find(keyOne, keyTwo);
		distanceGraph = getDistanceFromPath(mygraph, path);
		idpath = getNodesFromPath(path);
		console.log(keyOne + ' - ' + keyTwo + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calcGraphDistance(mygraph, keyOne, keyTwo, true);
		console.log(distanceGraph);
}

// FOR TESTING: compares array of styles to other array and computes mean distance (similar to the main function)
// Tip: Use Foobar component Text Tools with this as track pattern:
// 		'[' ''$meta_sep(genre,''',' '')'', ''$meta_sep(style,''',' '')''' '']'
// It will output things like this, ready to use here:
// 		[ 'Electronic', 'Hip-Hop', 'Future Bass', 'Chill-Out Downtempo', 'Alt. Rap' ]
function testGraphV2(mygraph) {

		let distanceGraph = Infinity;
		let arrayOne = [];
		let arrayTwo = [];
		
 		// EDIT HERE
		arrayOne = [ 'Electronic', 'Hip-Hop', 'Future Bass', 'Chill-Out Downtempo', 'Alt. Rap' ]; 
		arrayTwo = [ 'Hip-Hop', 'Electronic', 'Indie', 'Ambiental', 'Female Vocal', 'Trip Hop', 'Alt. Rap' ];
		distanceGraph = calcMeanDistanceV2(mygraph, arrayOne, arrayTwo);
		console.log(arrayOne + ' <- ' + arrayTwo + ' = ' + distanceGraph);
				
		arrayOne = [ 'Electronic', 'Hip-Hop', 'Future Bass', 'Chill-Out Downtempo', 'Alt. Rap' ]; 
		arrayTwo = [ 'Pop', 'Electronic', 'Electropop', 'Trap', 'Female Vocal', 'Sadcore' ];
		distanceGraph = calcMeanDistanceV2(mygraph, arrayOne, arrayTwo);
		console.log(arrayOne + ' <- ' + arrayTwo + ' = ' + distanceGraph);
		
		arrayOne = [ 'World', 'African', 'Blues', 'Folk', 'Malian Folk', 'Desert Blues' ];
		arrayTwo = [ 'Alt. Rock', 'New Wave' ];
		distanceGraph = calcMeanDistanceV2(mygraph, arrayOne, arrayTwo);
		console.log(arrayOne + ' <- ' + arrayTwo + ' = ' + distanceGraph);
		
		arrayOne = [ 'Alt. Rock', 'Indie', 'Dream Pop', '90s Rock' ];
		arrayTwo = [ 'Folk-Rock', 'Indie', 'Folk Pop', 'Contemporary Folk', 'Americana' ];
		distanceGraph = calcMeanDistanceV2(mygraph, arrayOne, arrayTwo);
		console.log(arrayOne + ' <- ' + arrayTwo + ' = ' + distanceGraph);
		
		arrayOne = [ 'Rock', 'Blues', 'Classic Rock', 'Blues Rock', 'Beat Music', 'Electric Blues' ];
		arrayTwo = [ 'Country', 'Country Boogie', 'Lo-Fi' ];
		distanceGraph = calcMeanDistanceV2(mygraph, arrayOne, arrayTwo);
		console.log(arrayOne + ' <- ' + arrayTwo + ' = ' + distanceGraph);

		arrayOne = [ 'Blues', 'Chicago Blues', 'Electric Blues' ];
		arrayTwo = [ 'Electronic', 'Pop', 'Experimental', 'Female Vocal' ];
		distanceGraph = calcMeanDistanceV2(mygraph, arrayOne, arrayTwo);
		console.log(arrayOne + ' <- ' + arrayTwo + ' = ' + distanceGraph);
		
		arrayOne = [ 'Classical', 'Romantic' ];
		arrayTwo = [ 'Alt. Rock', 'Electronic', 'Electropop', 'Baroque Pop', 'Female Vocal' ];
		distanceGraph = calcMeanDistanceV2(mygraph, arrayOne, arrayTwo);
		console.log(arrayOne + ' <- ' + arrayTwo + ' = ' + distanceGraph);
		
		arrayOne = [ 'Alt. Rock', 'Electronic', 'Electropop', 'Baroque Pop', 'Female Vocal' ];
		arrayTwo = [ 'Electronic', 'House' ];
		distanceGraph = calcMeanDistanceV2(mygraph, arrayOne, arrayTwo);
		console.log(arrayOne + ' <- ' + arrayTwo + ' = ' + distanceGraph);
		
		arrayOne = [ 'Electronic', 'Heavy Metal', 'Nu Metal' ];
		arrayTwo = [ 'World', 'African', 'Electronic', 'Jazz Vocal', 'Future Jazz' ];
		distanceGraph = calcMeanDistanceV2(mygraph, arrayOne, arrayTwo);
		console.log(arrayOne + ' <- ' + arrayTwo + ' = ' + distanceGraph);
		
		arrayOne = [ 'World', 'African', 'Electronic', 'Jazz Vocal', 'Future Jazz' ];
		arrayTwo = [ 'Rock', 'Blues', 'Classic Rock', 'Blues Rock', 'Beat Music', 'Electric Blues' ];
		distanceGraph = calcMeanDistanceV2(mygraph, arrayOne, arrayTwo);
		console.log(arrayOne + ' <- ' + arrayTwo + ' = ' + distanceGraph);
		
		arrayOne = [ 'Electronic', 'Pop', 'Electropop', 'Electro', 'Female Vocal' ];
		arrayTwo = [ 'Rock', 'Funk', 'R&B', 'Lo-Fi', 'Garage Rock', 'Funk Rock', 'Jam' ];
		distanceGraph = calcMeanDistanceV2(mygraph, arrayOne, arrayTwo);
		console.log(arrayOne + ' <- ' + arrayTwo + ' = ' + distanceGraph);
		
		arrayOne = [ 'Grunge', 'Grunge Metal', 'Classic Grunge' ];
		arrayTwo = [ 'Hard Rock', 'Heavy Metal', 'Classic Rock', 'Doom Metal', 'Proto-Metal' ];
		distanceGraph = calcMeanDistanceV2(mygraph, arrayOne, arrayTwo);
		console.log(arrayOne + ' <- ' + arrayTwo + ' = ' + distanceGraph);
		
		arrayOne = [ 'Hard Rock', 'Heavy Metal', 'Classic Rock', 'Doom Metal', 'Proto-Metal' ];
		arrayTwo = [ 'Jazz Vocal', 'Traditional Pop' ];
		distanceGraph = calcMeanDistanceV2(mygraph, arrayOne, arrayTwo);
		console.log(arrayOne + ' <- ' + arrayTwo + ' = ' + distanceGraph);

		arrayOne = [ 'Jazz Vocal', 'Traditional Pop' ];
		arrayTwo = [ 'New Age', 'Soundtrack', 'Neo-Classical New Age', 'Healing Music' ];
		distanceGraph = calcMeanDistanceV2(mygraph, arrayOne, arrayTwo);
		console.log(arrayOne + ' <- ' + arrayTwo + ' = ' + distanceGraph);
		
		arrayOne = [ 'Jazz Vocal', 'Traditional Pop' ];
		arrayTwo = [ 'Electronic', 'Pop', 'Electropop', 'Electro', 'Female Vocal' ];
		distanceGraph = calcMeanDistanceV2(mygraph, arrayOne, arrayTwo);
		console.log(arrayOne + ' <- ' + arrayTwo + ' = ' + distanceGraph);
		
		arrayOne = [ 'Jazz Vocal', 'Traditional Pop' ];
		arrayTwo = [ 'Psychedelic Rock', 'Progressive Rock', 'British Psychedelia', 'Proto-Prog' ];
		distanceGraph = calcMeanDistanceV2(mygraph, arrayOne, arrayTwo);
		console.log(arrayOne + ' <- ' + arrayTwo + ' = ' + distanceGraph);
		
		arrayOne = [ 'Hard Rock', 'Heavy Metal', 'Classic Rock', 'Doom Metal', 'Proto-Metal' ];
		arrayTwo = [ 'Psychedelic Rock', 'Progressive Rock', 'British Psychedelia', 'Proto-Prog' ];
		distanceGraph = calcMeanDistanceV2(mygraph, arrayOne, arrayTwo);
		console.log(arrayOne + ' <- ' + arrayTwo + ' = ' + distanceGraph);
		
		arrayOne = [ 'Jazz Vocal', 'Traditional Pop' ];
		arrayTwo = [ 'Reggae', 'Instrumental', 'Dub' ];
		distanceGraph = calcMeanDistanceV2(mygraph, arrayOne, arrayTwo);
		console.log(arrayOne + ' <- ' + arrayTwo + ' = ' + distanceGraph);
		
		arrayOne = [ 'Rock', 'Surf Rock' ];
		arrayTwo = [ 'Psychedelic Rock', 'Progressive Rock', 'British Psychedelia', 'Proto-Prog' ];
		distanceGraph = calcMeanDistanceV2(mygraph, arrayOne, arrayTwo);
		console.log(arrayOne + ' <- ' + arrayTwo + ' = ' + distanceGraph);

		arrayOne = [ 'Blues', 'Blues Rock', 'Modern Electric Blues', 'Electric Blues' ];
		arrayTwo = [ 'Hip-Hop', 'Gangsta', 'West Coast' ];
		distanceGraph = calcMeanDistanceV2(mygraph, arrayOne, arrayTwo);
		console.log(arrayOne + ' <- ' + arrayTwo + ' = ' + distanceGraph);

		arrayOne = [ 'Blues', 'Blues Rock', 'Modern Electric Blues', 'Electric Blues' ];
		arrayTwo = [ 'Hard Rock', 'Heavy Metal', 'Glam Metal', 'Pop Metal' ];
		distanceGraph = calcMeanDistanceV2(mygraph, arrayOne, arrayTwo);
		console.log(arrayOne + ' <- ' + arrayTwo + ' = ' + distanceGraph);

		arrayOne = [ 'World', 'African', 'Blues', 'Malian Folk', 'Desert Blues', 'Electric Blues' ];
		arrayTwo = [ 'Blues', 'Hill Country Blues', 'Electric Blues', 'Harmonica Blues' ];
		distanceGraph = calcMeanDistanceV2(mygraph, arrayOne, arrayTwo);
		console.log(arrayOne + ' <- ' + arrayTwo + ' = ' + distanceGraph);
		
		arrayOne = [ 'Psychedelic Rock', 'Turkish', 'Anatolian Rock' ];
		arrayTwo = [ 'World', 'African', 'Blues', 'Folk', 'Malian Folk', 'Desert Blues' ];
		distanceGraph = calcMeanDistanceV2(mygraph, arrayOne, arrayTwo);
		console.log(arrayOne + ' <- ' + arrayTwo + ' = ' + distanceGraph);

		arrayOne = [ 'Tuvan' ];
		arrayTwo = [ 'Desert Blues' ];
		distanceGraph = calcMeanDistanceV2(mygraph, arrayOne, arrayTwo, true);
		console.log(arrayOne + ' <- ' + arrayTwo + ' = ' + distanceGraph);

		arrayOne = [ 'Tuvan' ];
		arrayTwo = [ 'Desert Blues', 'Tishoumaren' ];
		distanceGraph = calcMeanDistanceV2(mygraph, arrayOne, arrayTwo, true);
		console.log(arrayOne + ' <- ' + arrayTwo + ' = ' + distanceGraph);

		arrayOne = [ 'Desert Blues', 'Tishoumaren' ];
		arrayTwo = [ 'Tuvan' ];
		distanceGraph = calcMeanDistanceV2(mygraph, arrayOne, arrayTwo, true);
		console.log(arrayOne + ' <- ' + arrayTwo + ' = ' + distanceGraph);
		
 		arrayOne = [ 'Blues' ];
		arrayTwo = [ 'Blues' ];
		distanceGraph = calcMeanDistanceV2(mygraph, arrayOne, arrayTwo);
		console.log(arrayOne + ' <- ' + arrayTwo + ' = ' + distanceGraph);
}