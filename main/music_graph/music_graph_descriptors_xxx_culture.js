'use strict';
//18/09/23

 // Required since this script is loaded on browsers for drawing too!
if (typeof include !== 'undefined') {
	include('music_graph_descriptors_xxx.js');
	include('..\\map\\region_xxx.js');
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
				'Afro-Rock','Afrobeat','African','African Folk XL','African Folk_supergenre'
			],
			'West Africa': [
				'Malian Folk'
			],
			'Maghreb': [ // North Africa
				'Desert Blues','Tuareg Music','Mauritanian Folk','Niger Folk','Sahrawi Folk','Tishoumaren','Gnawa','Electronic Sufi'
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
				'Japanese Classical_supergenre','Japanese Prog. Rock','Japanese','Minimal Wave','New Age','Nu Jazz','Future Jazz','Ambient House','Glam Metal','Hair Metal','Pop Metal','Eclectic Prog','Math Rock'
			],
			'South Asia': [
				'Indian Classical_supergenre','Indian'
			],
			'North Asia': [
				
			]
		},
		'Europe': {
			'_ALL_': [
				'European Pre-Modern Folk_supergenre','European Folk_supergenre','Classical Medieval Era_supergenre','Classical Renaissance Era_supergenre','Classical Baroque Era_supergenre','Classical Classical Era_supergenre','Classical Romantic Era_supergenre','Bal Folk XL','European Folk XL','European Pre-Modern Folk XL','Eurodisco','Europop','Contemporary Christian Music','Christian Rock','Deep House','Microhouse','Minimal House','Folk-Metal','Ambient Black Metal','Third Stream','Extreme Metal','Speed Metal','Power Metal','Renaissance Rock','Glitch Hop','Post-Bop'
			],
			'Eastern Europe': [
				'Darkwave','Coldwave','Pagan Folk'
			],
			'Southern Europe': [
				'South European Folk_supergenre','Flamenco Rock','Italian Prog. Rock','Spanish Rock','Spanish Jazz','Spanish Hip-Hop','Italian Rock','Greek','Italian Prog. Rock','Nuevo Flamenco','Ibiza House','Italo Disco','Dream House','Tech House','Gypsy-Jazz','Symphonic Rock','Trap','Alt. Rap','Underground Rap'
			],
			'Central Europe': [
				'Krautrock','German Rock','Futurepop','Darkwave','Coldwave','Electronic Body Music','Nu Jazz','Future Jazz','Pagan Folk','Black Metal','Progressive Metal'
			],
			'Western Europe': [
				'Celtic Folk_supergenre','Celtic Folk XL','British Folk-Rock XL','UK Bass','British Psychedelia','Raga Rock','Canterbury Scene','Beat Music','Celtic Punk','Britpop','British Blues','British Hip-Hop','Celtic-Nordic Folk XL','Hard Dance','Gabber XL','Nu Style Gabber','Gabber','Hardcore Rave','Rave XL','Minimal Wave','Futurepop','Darkwave','Coldwave','Gothic Rock','Electronic Body Music','Metalcore','Space Rock','Doom Metal','British Metal','Chanson','Post-Britpop','Nu Jazz','Future Jazz','Dream Pop','Shoegaze','Grunge Punk','Acid House','French House','Hard House','Progressive House','Ambient House','Pagan Folk','Folk-Baroque','Folk-Punk','Jazz-Rap','Gypsy-Jazz','IDM','Musique Concrete','Gothic Metal','Atmospheric Black Metal','Black Metal','Grindcore','Thrash Metal','Glam Metal','Hair Metal','Pop Metal','Progressive Metal','Classic Metal','Proto-Metal','Glam Rock','Proto-Prog','Symphonic Rock','Eclectic Prog','Heavy Prog','Ska Punk','Skacore','Punk Pop','Alt. Rap','Underground Rap','Ambient Drum & Bass','Jazzstep','Jump Up','Hardstep','Techstep','Neo-Classical Metal','Anarcho-Punk','New Wave','Post-Punk','Proto-Punk'
				],
			'Northern Europe': [
				'Nordic Folk_supergenre','Yoik','Luohti','Vuolle','Juoiggus','Celtic-Nordic Folk XL','Nordic Jazz','Pagan Folk','Symphonic Metal','Atmospheric Black Metal','Black Metal','Glam Metal','Hair Metal','Pop Metal','Progressive Metal'
			]
		},
		'Mashriq': { // West Asia
			'_ALL_': [
				'Arabian Folk-Rock XL','Electronic Sufi'
			],
			'Arabian Peninsula': [
				'Deep House',
			],
			'Anatolia': [
				'Anadolu Rock'
			],
			'Levant': [
				'Israeli','Israeli Rock'
			],
			'Mesopotamia': [
				
			],
			
		},
		'America': {
			'_ALL_': [
				'Contemporary Christian Music','Christian Rock'
			],
			'Caribbean': [
				'Jamaican_supergenre','Reggae','Afro-Cuban XL','Afro-Cuban','Ska','Latin-Jazz','Trap'
			],
			'North America': [
				'Rock & Roll_supergenre','Country_supergenre','Classic Blues XL','Traditional Blues XL','Traditional Country','Americana XL','Traditional American Folk XL','Classic Jazz','Mainstream Jazz XL','Roots Rock','Americana','American Primitive Guitar','Country Folk','Traditional American Folk','Old-Timey','Appalachian','Southern Rock','Detroit Rock','Acid Rock','Raga Rock','Tulsa Sound','Heartland Rock','Cowpunk','Hill Country Blues','Soul Blues','Zydeco','Chicago Blues','Detroit Blues','Memphis Blues','Jump Blues','Texas Blues','Vaudeville Blues','Country Blues','Delta Blues','South Coast','Midwest','East Coast','Gangsta','West Coast','Miami Bass','Instrumental Country','Skiffle','Hillbilly','Country Boogie','East Coast Jazz','West Coast Jazz','Moombahton','Florida Breaks','Philadelphia Soul','Motown Sound','Southern Soul','Doo Wop','R&B','New Orleans R&B','North American Folk_supergenre','Brill Building Sound','Close Harmony','Minimal Wave','Futurepop','Darkwave','Coldwave','Death Rock','Groove Metal','Stoner Doom','Stoner Sludge','Metalcore','Boogie Rock','Doom Metal','Stoner Rock','Blues','Jazz','Jazz Vocal','New Age','Electro Swing','Nu Jazz','Future Jazz','Grunge','Grunge Rock','Psychedelic Grunge','Classic Grunge','Grunge Punk','Grunge Metal','Psychedelic Funk','Post-Grunge','Acid House','Deep House','Chicago House','Fidget House','Electro House','Funky House','Garage House','Hip House','Tech House','Easy Listening','Folk-Punk','Jazz-Rap','Hard-Bop','Cool Jazz','Bebop','Modal Jazz','Acid Jazz','Smooth Jazz','Jazz-Pop','Jazz-Rock','Fusion','Free Jazz','Avant-Garde Jazz','Jazz-Funk','Jazz-Blues','New Acoustic','Digital Minimalism','Minimalism','Lounge','Exotica','Muzak','Modern Gospel','Gospel','Ragtime','Stride','Traditional Gospel','Third Stream','Nu Metal','Rap Metal','Stoner Metal','Sludge Metal','Death Metal','Thrash Metal','Crossover Thrash','Extreme Metal','Speed Metal','Glam Metal','Hair Metal','Pop Metal','Power Metal','Progressive Metal','Classic Metal','Proto-Metal','Arena Rock','Proto-Prog','Symphonic Rock','Eclectic Prog','Heavy Prog','Punk Pop','Math Rock','Glitch Hop','Post-Bop','Trap','Urban Breaks','Hip-Hop Soul','Pop Rap','Conscious','Horrorcore','Progressive Rap','Bounce','Boom Bap','Golden Age','Hardcore Rap','Melodic Hardcore','Electro','Old-School','Alt. Rap','Underground Rap','EDM Trap','Neo-Classical Metal','Geek Rock','Psychobilly','Riot Grrrl','New Wave','Punk Rock',
			],
			'Central America': [
				'South American Folk_supergenre','Latin Rock XL','Latin Folk XL','Chicano Rock','Latin Rock','Mexican Rock','Tex-Mex','Latin-Jazz','Nu Jazz','Future Jazz'
			],
			'South America': [
				'South American Folk_supergenre','Latin Rock XL','Latin Folk XL','Argentinian Rock','Uruguayan Rock','Música Popular Brasileira','Latin-Jazz','Bossa Nova','Nu Jazz','Future Jazz','Deep House','Thrash Metal','Power Metal','Alt. Rap','Underground Rap'
			]
		},
		'Oceania': {
			'_ALL_': [
				
			],
			'Australasia': [
				'Aussie Rock','Deep House','Crossover Thrash','Power Metal','Progressive Metal'
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
// Alternate method using substitutions
music_graph_descriptors_culture.regionHasStyle = function (style) {
	return [style, music_graph_descriptors.getSubstitution(style)].some(this.regionHasNode);
};
music_graph_descriptors_culture.getStyleRegion = function (style) {
	return [style, music_graph_descriptors.getSubstitution(style)].some(this.getNodeRegion);
};

// Populate with substitutions
{
	const ommit = ['Industrial_supergenre','Blues_supergenre','Metal_supergenre','Classic Rock_supergenre','Pop_supergenre','Contemporary_supergenre','Classical Modernist Era_supergenre','Modern Folk_supergenre','Punk Rock_supergenre','Alternative_supergenre','Hardcore Punk_supergenre','R&B_supergenre','Gospel_supergenre','Jazz_supergenre','Rap_supergenre','Breakbeat_supergenre','Drum & Bass_supergenre','Hardcore_supergenre','House_supergenre','Techno_supergenre','Trance_supergenre','Downtempo_supergenre','Punk XL','Classic Metal XL','Black Metal XL','Thrash Metal XL','Alt. Metal XL','Progressive Alt. Metal XL','Contemporary Alt. Metal XL','Stoner Metal XL','Grunge XL','Stoner XL','Doom XL','Extreme Metal XL','Mainstream Pop','Traditional Pop','Vocal Pop','Disco XL','Post-Disco XL','Soft Pop XL','Urban','Alt. Rap XL','Downtempo Rap XL','Funk','Soul','Deep Soul XL','Modern Blues XL','Synth & Wave XL','Lounge XL','Psy XL & Gaze','Chill Folk XL','New Age XL','New Age Folk XL','Modern Folk XL','Neo Folk XL','Ambient XL','Electro House XL','Electro XL','Progressive Rock XL','Classic Rock XL','Progressive Psychedelic Fusion XL','Classical Music_supercluster','Folk Music_supercluster','Electronic Music_supercluster','Progressive Electronic','Modern Jazz','Loungetronica','House'];
	const _ALL_ = ['Minimal Industrial','Electro-Industrial','Industrial Folk','Industrial Rock','Industrial Punk','Industrial Metal','Ambient Industrial','Avant-Garde Industrial','Dark Ambient','Dark Industrial','Noise Music','Post-Metal','Psychedelic Rock','Psychedelic Pop','Avant-Prog','Hard Rock','Blues Rock','Neo-Psychedelia','Contemporary Rock','90s Rock','Garage Pop','Retro Rock',,'Electropop','Indie','Contemporary R&B','Electronic','Folk','Industrial','Heavy Metal','Classic Rock','Progressive Rock','Rock_cluster','Rock','Avant-Garde Classical','Contemporary Classical','Pop Rock','Folk Pop','Contemporary Folk','Folk-Jazz','Folktronica','Pop','Ambient Classical','Contemporary Soul','Post-Jazz','Neo-Classical New Age','Modern Electric Blues','Psychedelic Blues','Psychedelic Soul','Psychedelic Folk','Electrorock','Baroque Pop','Folk-Pop','Chill-Out Downtempo','Neo Psychedelia','Nature Music','Ambient New Age','Healing Music','Spirituals','Worksongs','Ambient Metal','Crossover Prog','Piano Blues','Contemporary Blues','Contemporary Funk']
	.concat(
		[,'Neo-Prog','Funk Rock','Synth-Pop','No Wave','Post-Rock','Sadcore','Alt. Rock','Pop Punk','Rap Rock','Funk Metal','Noise Rock','Proto-Stoner Rock','Post-Hardcore','Hardcore Punk','Dance-Punk','Chillwave','Garage Punk','Garage Rock Revival','Post-Punk Revival','Emo Rock','Ambient Rock','Hypersoul','Sophisti-Pop','Electroclash','Emo Pop','Dance-Rock','Dance Pop','Disco Pop','80s Rock','Soft Rock','Power Pop','Sunshine Pop','Progressive Folk','Folk Punk','Hang Music','Ambient Folk','Funktronica','Ambient Funk','Urban Soul','Future Soul','Neo Soul','Electrofunk','Deep Funk','Disco','Smooth Soul','Classic Funk','P-Funk','Funk Blues','Deep Funk Revival','Psychedelic Rap','Broken Beats','Nu Skool Breaks','Chemical Breaks','Big Beat','Trip Hop','Breakdance','Liquid Funk','Neuro Funk','Intelligent Drum & Bass','Darkcore','Darkstep','Old School Jungle','New Beat','Hardcore Techno','','Breakbeat Hardcore','Happy Hardcore','Bouncy Techno','Trancecore','Acidcore','Speedcore','Frenchcore','Terrorcore','Mainstream Hardcore','Hardstyle','Ghetto House','Ghettotech','Juke','Hardtechno','Tech Trance','Industrial Techno','Minimal Techno','Ambient Techno','Hardtek','Freetekno','Detroit Techno',,'NRG','Hard NRG','Ibiza Trance','Dream Trance','Eurodance','Nu-Disco','Neo Trance','Epic Trance','Hardtrance','Eurotrance','Vocal Trance','Progressive Trance','Goa Trance','Psytrance','Classic Trance','Acid Trance','Synthwave','Vaporwave','Glitch','Ambient Breaks','Illbient','Ambient','Ambient Electronic','Bit Music','Synth','Neo-Classical','Punk','Hip-Hop','Hardcore','Dance','Techno','Trance','Breakbeat','Modernist','Classical','Techno-Pop','Emo-Pop']
	);
	const parent = music_graph_descriptors_culture;
	_ALL_.forEach((sg) => {
		parent.getMainRegions().forEach((key) => {
			const region = parent.culturalRegion[key];
			region._ALL_.push(sg);
		});
	});
	parent.getMainRegions().forEach((key) => {
		const region = parent.culturalRegion[key];
		const subRegions = Object.keys(region);
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
		subRegions.forEach((subKey) => {if (subKey === '_ALL_') {delete region._ALL_;} else {region[subKey] = [...new Set(region[subKey])];}});
	});
}

// Debug
music_graph_descriptors_culture.debug = function debug(graph = musicGraph()) {
	const notFound = new Set();
	music_graph_descriptors.getNodeList(false).forEach((node) => {
		if (!this.getFirstNodeRegion(node)) {notFound.add(node);}
	});
	console.log([...notFound]);
	console.log(notFound.size);
	// console.log(this.getNodeRegion('Ambient Classical'));
	// console.log(music_graph_descriptors_culture.culturalRegion.Oceania.Micronesia);
};

console.log('Deep House','Crossover Thrash', music_graph_descriptors_culture.getDistance('Deep House','Crossover Thrash')); // 0.3
console.log('Deep House','Deep House', music_graph_descriptors_culture.getDistance('Deep House','Deep House')); // 0
console.log('Tex-Mex','Deep House', music_graph_descriptors_culture.getDistance('Tex-Mex','Deep House')); // 0.6
console.log('Aussie Rock','New Wave', music_graph_descriptors_culture.getDistance('Aussie Rock','New Wave')); // 1
console.log('Disco','New Wave', music_graph_descriptors_culture.getDistance('Disco','New Wave')); // 0.3