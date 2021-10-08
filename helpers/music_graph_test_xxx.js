'use strict';
//08/10/21

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
		let key_one = '';
		let key_two = '';
		
		key_one = 'Baroque'; // here both keys...
		key_two = 'Modernist';
		path = pathFinder.find(key_one, key_two);
		distanceGraph = get_distanche_from_path(mygraph, path);
		idpath = get_nodes_from_path(mygraph, path);
		console.log(key_one + ' - ' + key_two + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calc_map_distance(mygraph, key_one, key_two, true);
		console.log(distanceGraph);
		
		key_one = 'New Age';
		key_two = 'Modernist';
		path = pathFinder.find(key_one, key_two);
		distanceGraph = get_distanche_from_path(mygraph, path);
		idpath = get_nodes_from_path(mygraph, path);
		console.log(key_one + ' - ' + key_two + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calc_map_distance(mygraph, key_one, key_two, true);
		console.log(distanceGraph);
		
		key_one = 'Hard Rock';
		key_two = 'Folk-Rock';
		path = pathFinder.find(key_one, key_two);
		distanceGraph = get_distanche_from_path(mygraph, path);
		idpath = get_nodes_from_path(mygraph, path);
		console.log(key_one + ' - ' + key_two + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calc_map_distance(mygraph, key_one, key_two, true);
		console.log(distanceGraph);
		
		key_one = 'Jazz Vocal';
		key_two = 'Heavy Metal';
		path = pathFinder.find(key_one, key_two);
		distanceGraph = get_distanche_from_path(mygraph, path);
		idpath = get_nodes_from_path(mygraph, path);
		console.log(key_one + ' - ' + key_two + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calc_map_distance(mygraph, key_one, key_two, true);
		console.log(distanceGraph);
		
		key_one = 'Grunge';
		key_two = 'House';
		path = pathFinder.find(key_one, key_two);
		distanceGraph = get_distanche_from_path(mygraph, path);
		idpath = get_nodes_from_path(mygraph, path);
		console.log(key_one + ' - ' + key_two + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calc_map_distance(mygraph, key_one, key_two, true);
		console.log(distanceGraph);
		
		key_one = 'Electronic';
		key_two = 'Alt. Rock';
		path = pathFinder.find(key_one, key_two);
		distanceGraph = get_distanche_from_path(mygraph, path);
		idpath = get_nodes_from_path(mygraph, path);
		console.log(key_one + ' - ' + key_two + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calc_map_distance(mygraph, key_one, key_two, true);
		console.log(distanceGraph);
		
		key_one = 'Electronic';
		key_two = 'Blues Rock';
		path = pathFinder.find(key_one, key_two);
		distanceGraph = get_distanche_from_path(mygraph, path);
		idpath = get_nodes_from_path(mygraph, path);
		console.log(key_one + ' - ' + key_two + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calc_map_distance(mygraph, key_one, key_two, true);
		console.log(distanceGraph);
		
		key_one = 'Blues';
		key_two = 'Hip-Hop';
		path = pathFinder.find(key_one, key_two);
		distanceGraph = get_distanche_from_path(mygraph, path);
		idpath = get_nodes_from_path(mygraph, path);
		console.log(key_one + ' - ' + key_two + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calc_map_distance(mygraph, key_one, key_two, true);
		console.log(distanceGraph);
		
		key_one = 'Trance';
		key_two = 'House';
		path = pathFinder.find(key_one, key_two);
		distanceGraph = get_distanche_from_path(mygraph, path);
		idpath = get_nodes_from_path(mygraph, path);
		console.log(key_one + ' - ' + key_two + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calc_map_distance(mygraph, key_one, key_two, true);
		console.log(distanceGraph);
		
		key_one = 'Americana';
		key_two = 'Folk-Rock';
		path = pathFinder.find(key_one, key_two);
		distanceGraph = get_distanche_from_path(mygraph, path);
		idpath = get_nodes_from_path(mygraph, path);
		console.log(key_one + ' - ' + key_two + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calc_map_distance(mygraph, key_one, key_two, true);
		console.log(distanceGraph);
		
		key_one = 'Trip Hop';
		key_two = 'Chill-Out Downtempo';
		path = pathFinder.find(key_one, key_two);
		distanceGraph = get_distanche_from_path(mygraph, path);
		idpath = get_nodes_from_path(mygraph, path);
		console.log(key_one + ' - ' + key_two + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calc_map_distance(mygraph, key_one, key_two, true);
		console.log(distanceGraph);
		
		key_one = 'Shoegaze';
		key_two = 'Indie';
		path = pathFinder.find(key_one, key_two);
		distanceGraph = get_distanche_from_path(mygraph, path);
		idpath = get_nodes_from_path(mygraph, path);
		console.log(key_one + ' - ' + key_two + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calc_map_distance(mygraph, key_one, key_two, true);
		console.log(distanceGraph);
		
		key_one = 'Blues Rock';
		key_two = 'Gangsta';
		path = pathFinder.find(key_one, key_two);
		distanceGraph = get_distanche_from_path(mygraph, path);
		idpath = get_nodes_from_path(mygraph, path);
		console.log(key_one + ' - ' + key_two + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calc_map_distance(mygraph, key_one, key_two, true);
		console.log(distanceGraph);
		
		key_one = 'Blues Rock';
		key_two = 'Hip-Hop';
		path = pathFinder.find(key_one, key_two);
		distanceGraph = get_distanche_from_path(mygraph, path);
		idpath = get_nodes_from_path(mygraph, path);
		console.log(key_one + ' - ' + key_two + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calc_map_distance(mygraph, key_one, key_two, true);
		console.log(distanceGraph);
		
		key_one = 'Blues Rock';
		key_two = 'Blues';
		path = pathFinder.find(key_one, key_two);
		distanceGraph = get_distanche_from_path(mygraph, path);
		idpath = get_nodes_from_path(mygraph, path);
		console.log(key_one + ' - ' + key_two + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calc_map_distance(mygraph, key_one, key_two, true);
		console.log(distanceGraph);
		
		key_one = 'Blues';
		key_two = 'Blues';
		path = pathFinder.find(key_one, key_two);
		distanceGraph = get_distanche_from_path(mygraph, path);
		idpath = get_nodes_from_path(mygraph, path);
		console.log(key_one + ' - ' + key_two + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calc_map_distance(mygraph, key_one, key_two, true);
		console.log(distanceGraph);
		
		key_one = 'Blues';
		key_two = 'Heavy Metal';
		path = pathFinder.find(key_one, key_two);
		distanceGraph = get_distanche_from_path(mygraph, path);
		idpath = get_nodes_from_path(mygraph, path);
		console.log(key_one + ' - ' + key_two + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calc_map_distance(mygraph, key_one, key_two, true);
		console.log(distanceGraph);
		
		key_one = 'Blues';
		key_two = 'Glam Metal';
		path = pathFinder.find(key_one, key_two);
		distanceGraph = get_distanche_from_path(mygraph, path);
		idpath = get_nodes_from_path(mygraph, path);
		console.log(key_one + ' - ' + key_two + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calc_map_distance(mygraph, key_one, key_two, true);
		console.log(distanceGraph);
		
		key_one = 'Blues';
		key_two = 'Pop Metal';
		path = pathFinder.find(key_one, key_two);
		distanceGraph = get_distanche_from_path(mygraph, path);
		idpath = get_nodes_from_path(mygraph, path);
		console.log(key_one + ' - ' + key_two + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calc_map_distance(mygraph, key_one, key_two, true);
		console.log(distanceGraph);
		
		key_one = 'Blues Rock';
		key_two = 'Pop Metal';
		path = pathFinder.find(key_one, key_two);
		distanceGraph = get_distanche_from_path(mygraph, path);
		idpath = get_nodes_from_path(mygraph, path);
		console.log(key_one + ' - ' + key_two + ': ' + distanceGraph);
		console.log(idpath);
		distanceGraph = calc_map_distance(mygraph, key_one, key_two, true);
		console.log(distanceGraph);
}

// FOR TESTING: compares array of styles to other array and computes mean distance (similar to the main function)
// Tip: Use Foobar component Text Tools with this as track pattern:
// 		'[' ''$meta_sep(genre,''',' '')'', ''$meta_sep(style,''',' '')''' '']'
// It will output things like this, ready to use here:
// 		[ 'Electronic', 'Hip-Hop', 'Future Bass', 'Chill-Out Downtempo', 'Alt. Rap' ]
function testGraphV2(mygraph) {

		let distanceGraph = Infinity;
		let array_one = [];
		let array_two = [];
		
		// EDIT HERE
		array_one = [ 'Electronic', 'Hip-Hop', 'Future Bass', 'Chill-Out Downtempo', 'Alt. Rap' ]; 
		array_two = [ 'Hip-Hop', 'Electronic', 'Indie', 'Ambiental', 'Female Vocal', 'Trip Hop', 'Alt. Rap' ];
		distanceGraph = calcMeanDistanceV2(mygraph, array_one, array_two);
		console.log(array_one + ' <- ' + array_two + ' = ' + distanceGraph);
				
		array_one = [ 'Electronic', 'Hip-Hop', 'Future Bass', 'Chill-Out Downtempo', 'Alt. Rap' ]; 
		array_two = [ 'Pop', 'Electronic', 'Electropop', 'Trap', 'Female Vocal', 'Sadcore' ];
		distanceGraph = calcMeanDistanceV2(mygraph, array_one, array_two);
		console.log(array_one + ' <- ' + array_two + ' = ' + distanceGraph);
		
		array_one = [ 'World', 'African', 'Blues', 'Folk', 'Malian Folk', 'Desert Blues' ];
		array_two = [ 'Alt. Rock', 'New Wave' ];
		distanceGraph = calcMeanDistanceV2(mygraph, array_one, array_two);
		console.log(array_one + ' <- ' + array_two + ' = ' + distanceGraph);
		
		array_one = [ 'Alt. Rock', 'Indie', 'Dream Pop', '90s Rock' ];
		array_two = [ 'Folk-Rock', 'Indie', 'Folk Pop', 'Contemporary Folk', 'Americana' ];
		distanceGraph = calcMeanDistanceV2(mygraph, array_one, array_two);
		console.log(array_one + ' <- ' + array_two + ' = ' + distanceGraph);
		
		array_one = [ 'Rock', 'Blues', 'Classic Rock', 'Blues Rock', 'Beat Music', 'Electric Blues' ];
		array_two = [ 'Country', 'Country Boogie', 'Lo-Fi' ];
		distanceGraph = calcMeanDistanceV2(mygraph, array_one, array_two);
		console.log(array_one + ' <- ' + array_two + ' = ' + distanceGraph);

		array_one = [ 'Blues', 'Chicago Blues', 'Electric Blues' ];
		array_two = [ 'Electronic', 'Pop', 'Experimental', 'Female Vocal' ];
		distanceGraph = calcMeanDistanceV2(mygraph, array_one, array_two);
		console.log(array_one + ' <- ' + array_two + ' = ' + distanceGraph);
		
		array_one = [ 'Classical', 'Romantic' ];
		array_two = [ 'Alt. Rock', 'Electronic', 'Electropop', 'Baroque Pop', 'Female Vocal' ];
		distanceGraph = calcMeanDistanceV2(mygraph, array_one, array_two);
		console.log(array_one + ' <- ' + array_two + ' = ' + distanceGraph);
		
		array_one = [ 'Alt. Rock', 'Electronic', 'Electropop', 'Baroque Pop', 'Female Vocal' ];
		array_two = [ 'Electronic', 'House' ];
		distanceGraph = calcMeanDistanceV2(mygraph, array_one, array_two);
		console.log(array_one + ' <- ' + array_two + ' = ' + distanceGraph);
		
		array_one = [ 'Electronic', 'Heavy Metal', 'Nu Metal' ];
		array_two = [ 'World', 'African', 'Electronic', 'Jazz Vocal', 'Future Jazz' ];
		distanceGraph = calcMeanDistanceV2(mygraph, array_one, array_two);
		console.log(array_one + ' <- ' + array_two + ' = ' + distanceGraph);
		
		array_one = [ 'World', 'African', 'Electronic', 'Jazz Vocal', 'Future Jazz' ];
		array_two = [ 'Rock', 'Blues', 'Classic Rock', 'Blues Rock', 'Beat Music', 'Electric Blues' ];
		distanceGraph = calcMeanDistanceV2(mygraph, array_one, array_two);
		console.log(array_one + ' <- ' + array_two + ' = ' + distanceGraph);
		
		array_one = [ 'Electronic', 'Pop', 'Electropop', 'Electro', 'Female Vocal' ];
		array_two = [ 'Rock', 'Funk', 'R&B', 'Lo-Fi', 'Garage Rock', 'Funk Rock', 'Jam' ];
		distanceGraph = calcMeanDistanceV2(mygraph, array_one, array_two);
		console.log(array_one + ' <- ' + array_two + ' = ' + distanceGraph);
		
		array_one = [ 'Grunge', 'Grunge Metal', 'Classic Grunge' ];
		array_two = [ 'Hard Rock', 'Heavy Metal', 'Classic Rock', 'Doom Metal', 'Proto-Metal' ];
		distanceGraph = calcMeanDistanceV2(mygraph, array_one, array_two);
		console.log(array_one + ' <- ' + array_two + ' = ' + distanceGraph);
		
		array_one = [ 'Hard Rock', 'Heavy Metal', 'Classic Rock', 'Doom Metal', 'Proto-Metal' ];
		array_two = [ 'Jazz Vocal', 'Traditional Pop' ];
		distanceGraph = calcMeanDistanceV2(mygraph, array_one, array_two);
		console.log(array_one + ' <- ' + array_two + ' = ' + distanceGraph);

		array_one = [ 'Jazz Vocal', 'Traditional Pop' ];
		array_two = [ 'New Age', 'Soundtrack', 'Neo-Classical New Age', 'Healing Music' ];
		distanceGraph = calcMeanDistanceV2(mygraph, array_one, array_two);
		console.log(array_one + ' <- ' + array_two + ' = ' + distanceGraph);
		
		array_one = [ 'Jazz Vocal', 'Traditional Pop' ];
		array_two = [ 'Electronic', 'Pop', 'Electropop', 'Electro', 'Female Vocal' ];
		distanceGraph = calcMeanDistanceV2(mygraph, array_one, array_two);
		console.log(array_one + ' <- ' + array_two + ' = ' + distanceGraph);
		
		array_one = [ 'Jazz Vocal', 'Traditional Pop' ];
		array_two = [ 'Psychedelic Rock', 'Progressive Rock', 'British Psychedelia', 'Proto-Prog' ];
		distanceGraph = calcMeanDistanceV2(mygraph, array_one, array_two);
		console.log(array_one + ' <- ' + array_two + ' = ' + distanceGraph);
		
		array_one = [ 'Hard Rock', 'Heavy Metal', 'Classic Rock', 'Doom Metal', 'Proto-Metal' ];
		array_two = [ 'Psychedelic Rock', 'Progressive Rock', 'British Psychedelia', 'Proto-Prog' ];
		distanceGraph = calcMeanDistanceV2(mygraph, array_one, array_two);
		console.log(array_one + ' <- ' + array_two + ' = ' + distanceGraph);
		
		array_one = [ 'Jazz Vocal', 'Traditional Pop' ];
		array_two = [ 'Reggae', 'Instrumental', 'Dub' ];
		distanceGraph = calcMeanDistanceV2(mygraph, array_one, array_two);
		console.log(array_one + ' <- ' + array_two + ' = ' + distanceGraph);
		
		array_one = [ 'Rock', 'Surf Rock' ];
		array_two = [ 'Psychedelic Rock', 'Progressive Rock', 'British Psychedelia', 'Proto-Prog' ];
		distanceGraph = calcMeanDistanceV2(mygraph, array_one, array_two);
		console.log(array_one + ' <- ' + array_two + ' = ' + distanceGraph);

		array_one = [ 'Blues', 'Blues Rock', 'Modern Electric Blues', 'Electric Blues' ];
		array_two = [ 'Hip-Hop', 'Gangsta', 'West Coast' ];
		distanceGraph = calcMeanDistanceV2(mygraph, array_one, array_two);
		console.log(array_one + ' <- ' + array_two + ' = ' + distanceGraph);

		array_one = [ 'Blues', 'Blues Rock', 'Modern Electric Blues', 'Electric Blues' ];
		array_two = [ 'Hard Rock', 'Heavy Metal', 'Glam Metal', 'Pop Metal' ];
		distanceGraph = calcMeanDistanceV2(mygraph, array_one, array_two);
		console.log(array_one + ' <- ' + array_two + ' = ' + distanceGraph);
}