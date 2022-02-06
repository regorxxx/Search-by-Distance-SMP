'use strict';
//08/01/22

 // Required since this script is loaded on browsers for drawing too!
if (typeof include !== 'undefined') {
	include('music_graph_descriptors_xxx.js');
	include('region_xxx.js');
	include('music_graph_descriptors_xxx_countries.js');
}

/*
	Cultural descriptors
*/
const music_graph_descriptors_culture =  new regionMap ({
	nodeName: 'styleGenre',
	culturalRegion: {
		'Antarctica': {
			'_ALL_': [
				
			],
			'Antarctica': [
				
			]
		},
		'Africa': {
			'_ALL_': [
				'Afro-Rock','Afrobeat','African'
			],
			'West Africa': [
				'Malian Folk'
			],
			'Maghreb': [ // North Africa
				'Desert Blues','Tuareg Music','Mauritanian Folk','Niger Folk','Sahrawi Folk','Tishoumaren','Gnawa'
			],
			'Central Africa': [
				
			],
			'East Africa': [
				'Griot','Nubian Folk','Nubian'
			],
			'South Africa': [
				'Isicathamiya'
			]
		},
		'Asia': {
			'_ALL_': [
				'Asian Folk_supergenre','Asian Folk XL','Asian Folk'
			],
			'Central Asia': [
				
			],
			'West Asia': [
				
			],
			'East Asia': [
				'Japanese Classical_supergenre','Japanese Prog. Rock','Japanese'
			],
			'South Asia': [
				'Indian Classical_supergenre','Indian'
			],
			'North Asia': [
				
			]
		},
		'Europe': {
			'_ALL_': [
				'European Pre-Modern Folk_supergenre', 'European Folk_supergenre','Classical Medieval Era_supergenre','Classical Renaissance Era_supergenre','Classical Baroque Era_supergenre','Classical Classical Era_supergenre','Classical Romantic Era_supergenre','Bal Folk XL','European Folk XL','European Pre-Modern Folk XL'
			],
			'Eastern Europe': [
				
			],
			'Southern Europe': [
				'South European Folk_supergenre','Flamenco Rock','Italian Prog. Rock','Spanish Rock','Spanish Jazz','Spanish Hip-Hop','Italian Rock','Greek'
			],
			'Central Europe': [
				'Krautrock','German Rock'
			],
			'Western Europe': [
				'Celtic Folk_supergenre','Celtic Folk XL','British Folk-Rock XL','UK Bass','British Psychedelia','Raga Rock','Canterbury Scene','Beat Music','Celtic Punk','Britpop','British Blues','British Hip-Hop'
				],
			'Northern Europe': [
				'Nordic Folk_supergenre'
			]
		},
		'Mashriq': { // West Asia
			'_ALL_': [
				
			],
			'Arabian Peninsula': [
				
			],
			'Anatolia': [
				
			],
			'Levant': [
				'Israeli','Israeli Rock'
			],
			'Mesopotamia': [
				
			],
			
		},
		'America': {
			'_ALL_': [
				
			],
			'Caribbean': [
				'Jamaican_supergenre','Reggae','Afro-Cuban XL','Afro-Cuban'
			],
			'North America': [
				'Rock & Roll_supergenre','Country_supergenre','Classic Blues XL','Traditional Blues XL','Traditional Country','Americana XL','Traditional American Folk XL','Classic Jazz','Mainstream Jazz XL','Roots Rock','Americana','American Primitive Guitar','Country Folk','Traditional American Folk','Old-Timey','Appalachian','Southern Rock','Detroit Rock','Acid Rock','Raga Rock','Tulsa Sound','Heartland Rock','Cowpunk','Hill Country Blues','Soul Blues','Zydeco','Chicago Blues','Detroit Blues','Memphis Blues','Jump Blues','Texas Blues','Vaudeville Blues','Country Blues','Delta Blues','South Coast','Midwest','East Coast','Gangsta','West Coast','Miami Bass','Instrumental Country'
			],
			'Central America': [
				'South American Folk_supergenre','Latin Rock XL','Latin Folk XL','Chicano Rock','Latin Rock','Mexican Rock','Tex-Mex'
			],
			'South America': [
				'South American Folk_supergenre','Latin Rock XL','Latin Folk XL','Argentinian Rock','Uruguayan Rock','Música Popular Brasileira'
			]
		},
		'Oceania': {
			'_ALL_': [
				
			],
			'Australasia': [
				
			],
			'Melanesia': [
				
			],
			'Micronesia': [
				
			],
			'Polynesia': [
				
			]
		}
	}
});
// Alternate method names
music_graph_descriptors_culture.regionHasStyle = music_graph_descriptors_culture.regionHasNode;
music_graph_descriptors_culture.getStyleRegion = music_graph_descriptors_culture.getNodeRegion;

// Populate with substitutions
{
	const parent = music_graph_descriptors_culture
	parent.getMainRegions().forEach((key) => {
		const region = parent.culturalRegion[key];
		const subRegions = parent.getSubRegions(key);
		subRegions.forEach((subKey) => {
			const styleGenres = region[subKey];
			if (styleGenres.length) {
				if (subKey === '_ALL_') {
					styleGenres.forEach((sg) => {
						subRegions.forEach((subKeyB) => {if (subKeyB !== subKey) {region[subKeyB].push(sg);}});
					});
				} else {
					styleGenres.forEach((sg) => {
						if (sg.toLowerCase().indexOf('_supergenre') !== -1) {
							const idx = music_graph_descriptors.style_supergenre.findIndex((sgArr) => {return sgArr[0] === sg;});
							if (idx !== -1) {music_graph_descriptors.style_supergenre[idx][1].forEach((newSg) => {region[subKey].push(newSg);});}
						} else {
							const idx = music_graph_descriptors.style_cluster.findIndex((styleArr) => {return styleArr[0] === sg;});
							if (idx !== -1) {music_graph_descriptors.style_cluster[idx][1].forEach((newSg) => {region[subKey].push(newSg);});}
						}
						const idxSub = music_graph_descriptors.style_substitutions.findIndex((sgArr) => {return sgArr[0] === sg;});
						if (idxSub !== -1) {music_graph_descriptors.style_substitutions[idxSub][1].forEach((newSg) => {region[subKey].push(newSg);});}
					});
				}
			}
		});
		// And discard duplicates
		subRegions.forEach((subKey) => {if (subKey === '_ALL_') {delete region._ALL_} else {region[subKey] = [...new Set(region[subKey])];}});
	});
}