﻿'use strict';
//01/07/25

/*
	These are the variables of the music graph: nodes (styles and genres), links, link weighting (aka distance) and rendering settings.
	This file can be updated independently to the other files. i.e. the node/links coding (the actual graph creating) and the descriptors are separated.

	The music structure goes like this: Superclusters -> Clusters -> Supergenres -> Style clusters -> Styles (smallest nodes)
	Obviously, the left terms are groups of the right terms.

	That means every user can set its 'own map' according to their tags. Note your files MUST be tagged according to the descriptors,
	but you can add substitutions at style_substitutions.... that's the thing most users will have to configure according to their tag usage.
	Note the graph functions don't care whether the tag is a genre a style or whatever tag name you use. 'Rock is rock', wherever it is.
	But that genre/style must be on music_graph_descriptors to be recognized.

	If you have new genres/styles not present on the graph then you probably need to add them to:
		- style_supergenre: that places the genre on a main big genre... For ex. Britpop into Contemporary Rock.
		- style_cluster: that connects your new genre with related genres. For ex. R&B and Doo Wop are both in Vocal Pop style cluster.
		- Optional:
			- style_primary_origin: connects styles which are direct derivatives or origins. Farther than in the same style cluster.
			- style_secondary_origin: connects styles which are secondary derivatives or origins. Farther than previous one.
			- style_anti_influence: greatly distances two genres. It would be the opposite to being in the same style cluster.

	Now, let's say you have a group of related styles not present on the graph. For ex. Grunge Rock, Classic Grunge, etc. They are all 'grunge',
	so you should not put them into style_supergenre matrix, where grunge already exists. We would want to add even smaller nodes than that
	main genre. For that we use style_weak_substitutions, where we would put Grunge at the left, and connect it to Grunge Rock, Classic Grunge, etc.
	Other approach would be to use style_cluster. Use whatever you prefer according to the link 'distance' you want to add. Values at bottom.

	'map_distance_exclusions' have those genre/style tags which are not related to an specific musical style.
	i.e. Acoustic could be heavy metal, rock or whatever... so we skip it (for other calcs).
	They are filtered because they have no representation on the graph, not being a real genre/style but a musical characteristic.
	So they are useful for similarity scoring purposes but not for the graph.
	This filtering stage is not needed, but it greatly speedups the calculations if you have tons of files with these tags!
	This means than any tag not included in the graph will be omitted for calcs, but you save time if you add it manually to the exclusions (otherwise the entire graph will be visited to try to find a match).

	Then we got: Primary origins, secondary origins, weak substitutions, (direct) substitutions and anti-influences.
	The first 3 are links between styles related 'in some way'. (Direct) substitutions are equivalent  nodes (A = B), with 0 distance.
	Finally, anti-influence accounts for styles which are considered too different, even being of the same group (style cluster or supergenres).

	The function 'musicGraph()' creates the graph, and the same for the HTML counterpart (it adds colors and all that to the main graph).
	Execute 'Draw Graph.html' on your browser and it should load the graph set on this file. So whatever you edit here, it gets shown on the rendered version.
	That's an easy way to see if you added nodes at a wrong place, things not linked, etc. Much easier than checking matrices and lists of strings!

	Finally, the function 'searchByDistance()' does all the calculations for similarity between tracks.

	Tests are also available with the buttons present on these scripts (customizable button and Playlist Tools).
*/

/**
 * The above code is declaring a constant variable called "music_graph_descriptors" and assigning it an object value.
 *
 * @constant
 * @name music_graph_descriptors
 * @kind variable
 * @type {{ style_supergenre_supercluster: (string | string[])[][]; style_supergenre_cluster: (string | string[])[][]; style_supergenre: (string | string[])[][]; style_cluster: (string | string[])[][]; style_primary_origin: (string | string[])[][]; style_secondary_origin: (string | string[])[][]; style_anti_influence: (string | string[])[][]; style_anti_influences_conditional: string[]; style_weak_substitutions: (string | string[])[][]; style_substitutions: (string | string[])[][]; map_distance_exclusions: Set<string>; primary_origin:number; secondary_origin:number; weak_substitutions:number; cluster:number; intra_supergenre:number; supergenre_cluster:number; supergenre_supercluster:number; inter_supergenre:number; inter_supergenre_supercluster:number; substitutions:number; anti_influence:number; primary_origin_influence:number; secondary_origin_influence:number; nodeList: Map<string,musicGraphNode>; renderMethod: string; }}
 */
const music_graph_descriptors = {
	/*
		----------------------------------------------------------------------------------------------------
											Graph nodes and links
		----------------------------------------------------------------------------------------------------
	*/
	/*
		-> Music & Supergenres clusters: Mega-Groups of related musical clusters. No need to usually touch these
	*/
	// Mega-Groups of related supergenre's groups: 4 big groups of popular music connected + the others
	style_supergenre_supercluster: [
		['Heavy Music_supercluster'				,	['Industrial_cluster','Metal_cluster','Punk Rock_supergenre','Hardcore Punk_supergenre']],
		['Pop & Rock Music_supercluster'		,	['Rock_cluster','Pop_cluster','Country_cluster']],
		['Rythm Music_supercluster'				,	['R&B_cluster','Blue_Note_cluster','Jamaican_cluster','Rap_cluster']],
		['Electronic Music_supercluster'		,	['Breakbeat Dance_cluster','Four-to-the-floor Dance_cluster','Downtempo_cluster']],
		['Folk Music_supercluster'				,	['Folk_cluster'					]],
		['Classical Music_supercluster'			,	['Classical Music_cluster'		]]
	],
	// Groups of related Supergenres
	style_supergenre_cluster: [
		['Industrial_cluster'				,	['Industrial_supergenre'			]],
		['Metal_cluster'					,	['Metal_supergenre'					]],
		['Rock_cluster'						,	['Rock & Roll_supergenre','Classic Rock_supergenre','Punk Rock_supergenre','Alternative_supergenre','Hardcore Punk_supergenre','Contemporary_supergenre']],
		['Pop_cluster'						,	['Pop_supergenre'					]],
		['Country_cluster'					,	['Country_supergenre'				]],
		['R&B_cluster'						,	['R&B_supergenre'					]],
		['Blue_Note_cluster'				,	['Blues_supergenre','Gospel_supergenre','Jazz_supergenre']],
		['Jamaican_cluster'					,	['Jamaican_supergenre'				]],
		['Rap_cluster'						,	['Rap_supergenre'					]],
		['Breakbeat Dance_cluster'			,	['Breakbeat_supergenre','Drum & Bass_supergenre','Hardcore_supergenre']],
		['Four-to-the-floor Dance_cluster'	,	['Hardcore_supergenre','Techno_supergenre','House_supergenre','Trance_supergenre']],
		['Downtempo_cluster'				,	['Downtempo_supergenre'				]],
		[									'SKIP'									], //From here to bottom standalone clusters
		['Folk_cluster'						,	['Modern Folk_supergenre','European Pre-Modern Folk_supergenre','South American Folk_supergenre','North American Folk_supergenre','Nordic Folk_supergenre','Celtic Folk_supergenre','African Folk_supergenre','Asian Folk_supergenre','European Folk_supergenre','South European Folk_supergenre']],
		['Classical Music_cluster'			,	['Classical Medieval Era_supergenre','Classical Renaissance Era_supergenre','Classical Baroque Era_supergenre','Classical Classical Era_supergenre','Classical Romantic Era_supergenre','Classical Modernist Era_supergenre','Japanese Classical_supergenre','Indian Classical_supergenre']]
	],
	/*
		-> SuperGenres: Mega-Groups of genres and styles. Users may want to edit these at the user's descriptor file
	*/
	// Here genres and styles are put into their main category. Like 'Progressive Rock' and 'Hard Rock' into 'Rock&Roll Supergenre'
	// This points to genre and styles which are considered to belong to the same parent musical genre, while not necessarily being
	// considered 'similar' in an 'listening session' sense. For ex. 'Space Rock' and 'Southern Rock' can be considered Rock but pretty
	// different when looking for Rock tracks. On the other hand, they are similar if you compare them to Jazz.
	style_supergenre: [
		['Industrial_supergenre'			,	['Deconstructed Club','Minimal Wave','Minimal Industrial','Futurepop','Electro-Industrial','Industrial Folk','Industrial Rock','Industrial Punk','Industrial Metal','Darkwave','Coldwave','Dark Ambient','Dark Industrial','Electronic Body Music','Noise Music','Gothic Rock','Death Rock','Ambient Industrial','Avant-Garde Industrial','Krautrock']],
		['Metal_supergenre'					,	['Kawaii Metal','Groove Metal','Post-Metal','Neo-Classical Metal','Stoner Doom','Stoner Sludge','Deathcore','Metalcore','Nu Metal','Rap Metal','Grunge Metal','Symphonic Metal','Gothic Metal','Black Metal','Ambient Metal','Atmospheric Black Metal','Stoner Metal','Sludge Metal','Death Metal','Grindcore','Doom Metal','Crossover Thrash','Extreme Metal','Speed Metal','Thrash Metal','British Metal','Glam Metal','Hair Metal','Pop Metal','Power Metal','Progressive Metal','Classic Metal','Proto-Metal']],
		['Rock & Roll_supergenre'			,	['Rockabilly Revival','Garage Rock','Surf Rock','Rock & Roll','Rockabilly','Skiffle']],
		['Classic Rock_supergenre'			,	['Proto-Metal','Heartland Rock','Arena Rock','Southern Rock','Glam Rock','Proto-Prog','Crossover Prog','Symphonic Rock','Heavy Prog','Eclectic Prog','Flamenco Rock','Krautrock','Math Rock','Neo-Prog','Italian Prog. Rock','Japanese Prog. Rock','Avant-Prog','Hard Rock','Detroit Rock','Blues Rock','Boogie Rock','Acid Rock','Psychedelic Rock','Space Rock','Raga Rock','Anatolian Rock','Psychedelic Pop','Funk Rock','British Psychedelia','Renaissance Rock','Folk-Rock','Canterbury Scene','Chicano Rock','Latin Rock','Candombe Beat','Beat Music','Tulsa Sound']],
		['Punk Rock_supergenre'				,	['Celtic Punk','Ska Punk','Skacore','Cowpunk','Punk Pop','Grunge Punk','Riot Grrrl','Anarcho-Punk','Psychobilly','Synth-Pop','New Wave','No Wave','Post-Punk','Punk Rock','Pub Rock','Aussie Rock','Proto-Punk']],
		['Alternative_supergenre'			,	['Electrorock','Post-Rock','Post-Grunge','Britpop','Sadcore','Alt. Rock','Geek Rock','Celtic Rock','Pop Punk','Math Rock','Rap Rock','Funk Metal','Grunge','Grunge Rock','Psychedelic Grunge','Grunge Punk','Classic Grunge','Dream Pop','Shoegaze','Noise Rock','Proto-Stoner Rock']],
		['Hardcore Punk_supergenre'			,	['Metalcore','Post-Hardcore','Math Rock','Grindcore','Crossover Thrash','Hardcore Punk','Anarcho-Punk','Stoner Rock','Stoner Sludge','Proto-Stoner Rock']],
		['Contemporary_supergenre'			,	['Indie','Freak Folk','Neo-Prog','Dance-Punk','Chillwave','Garage Punk','Garage Rock Revival','Post-Punk Revival','Emo Rock','Post-Britpop','Neo-Psychedelia','Contemporary Rock','90s Rock','Garage Pop','Retro Rock','Afro-Rock']],
		['Pop_supergenre'					,	['Hyperpop','Digicore', 'Glitchcore','Classical Crossover','Urban Breaks','Electropop','Ambient Rock','Indie','Freak Folk','Hypersoul','Chillwave','Sophisti-Pop','Electroclash','Post-Britpop','Emo Pop','K-Pop','J-Pop','Kayokyoku','Britpop','Dance-Rock','Italo Disco','Dance Pop','Dream Pop','Shoegaze','Disco Pop','Eurodisco','Europop','Synth-Pop','80s Rock','Soft Rock','Power Pop','Chanson','Sunshine Pop','Psychedelic Pop','Pop Rock','Jazz-Pop','Baroque Pop','Songwriter','Country Pop','Brill Building Sound','Skiffle','Close Harmony']],
		['Modern Folk_supergenre'			,	['Folk-Rock','Folk Pop','Folk Baroque','Folk Metal','Psychedelic Folk','Contemporary Folk','Folk-Jazz','Folktronica','Progressive Folk','Folk Punk','Hang Music','Ambient Folk']],
		['European Pre-Modern Folk_supergenre',	['Medieval','Renaissance']],
		['South American Folk_supergenre'	,	['Afro-Cuban','Son','Argentinian Folk','Venezuelan Folk','Rumba','Batucada','Candombe','Cumbia','Chilean Folk','Colombian Folk','Cantautor','Forró','Jota','Corrido','Mexican Folk','Peruvian Folk','Andean','Bolero','Mariachi','Ranchera','Tango','Samba','Nueva Gaita','Mambo','Afro-Latin Ritual-Tribal','Pre-Columbian Ritual-Tribal']],
		['North American Folk_supergenre'	,	['Folk-Rock','Freak Folk','Traditional Folk','Americana','American Primitive Guitar','Country Folk','Neo-Traditional Folk','Songwriter','Traditional American Folk','Old-Timey','Appalachian','Aboriginal Folk']],
		['Nordic Folk_supergenre'			,	['Polka','Traditional European Folk','Pagan Folk','German Folk','Joik','Nordic Folk']],
		['Celtic Folk_supergenre'			,	['Circle','Jig','Muiñeira','Alalá','Scottish','Celtic Folk','Traditional European Folk','Bal Folk','Irish','Scottish Folk','Celtic New Age']],
		['African Folk_supergenre'			,	['Malian Folk','Griot','Isicathamiya','Mauritanian Folk','Niger Folk','Nubian Folk','Sahrawi Folk','Tishoumaren','Gnawa','Classical Sufi','Semba','Kizomba','African Ritual-Tribal','Mbalax']],
		['Asian Folk_supergenre'			,	['Tuvan','Hindustani','Israeli Folk','Afghan Folk','Gaana','Asian Ritual-Tribal']],
		['European Folk_supergenre'			,	['British Folk-Rock','British Folk-Jazz','Folk Baroque','Andro','Bourree','Bresse','Chapelloise','Circle','Farelquesh','Gavotte','Hanterdro','Kost ar C\'hoad','Laridé','Mazurka','Jig','Plinn','Polka','Rond','Scottish','Tarantella','Tricot','Vals','Traditional European Folk','Bal Folk','German Folk','Irish','Scottish Folk','Romani','Georgian Folk','Branle']],
		['South European Folk_supergenre'	,	['Cantautor','Rumba Flamenca','Rumba Catalana','Rumba Fusión','Flamenco','Nuevo Flamenco','Fado','Jota','Traditional European Folk','Éntekhno','Sephardic','Branle']],
		['Country_supergenre'				,	['Country Rap','Alt. Country','Americana','Neo-Traditional Country','Contemporary Country','Outlaw Country','Country Pop','Country Rock','Nashville Sound','Bakersfield Sound','Progressive Bluegrass','Bluegrass','Honky Tonk','Old-Timey','Hillbilly','Country Boogie','Square Dance','Rodeo','Jug Band']],
		['R&B_supergenre'					,	['Funktronica','Contemporary R&B','Afrobeat','Ambient Funk','Urban Soul','Future Soul','Neo Soul','Electrofunk','Deep Funk','Disco','Soul Blues','Smooth Soul','Classic Funk','P-Funk','Funk Rock','Contemporary Funk','Psychedelic Funk','Psychedelic Soul','New Orleans R&B','Funk Blues','Deep Funk Revival','Philadelphia Soul','Motown Sound','Southern Soul','Doo Wop','R&B']],
		['Blues_supergenre'					,	['Contemporary Blues','Hill Country Blues','Soul Blues','Modern Electric Blues','Psychedelic Blues','Blues Rock','Funk Blues','British Blues','Zydeco','Chicago Blues','Detroit Blues','Memphis Blues','Jump Blues','Texas Blues','Piano Blues','Vaudeville Blues','Country Blues','Delta Blues']],
		['Gospel_supergenre'				,	['Contemporary Christian Music','Christian Rock','Modern Gospel','Ragtime','Stride','Traditional Gospel','Spirituals','Worksongs']],
		['Jazz_supergenre'					,	['Third Stream','Contemporary Jazz','Electro Swing','Nordic Jazz','Nu Jazz','Future Jazz','Acid Jazz','Smooth Jazz','Jazz-Rock','Fusion','Post-Bop','Free Jazz','Avant-Garde Jazz','Soul-Jazz','Jazz-Blues','Jazz-Funk','Hard-Bop','Cool Jazz','Bebop','New Orleans Jazz Revival','Dixieland Revival','Modal Jazz','Latin-Jazz','Fado','Bossa Nova','Swing','Mainstream Jazz','Gypsy-Jazz','Big Band','Chicago Jazz','New Orleans Jazz','Dixieland']],
		['Jamaican_supergenre'				,	['Reggaeton','Ragga Hip-Hop','Ska Revival','Reggae Fusion','Ragga','Dancehall','Dembow','UK Reggae','Dub','Roots Reggae','Rocksteady','Ska','Calypso','Mento']],
		['Rap_supergenre'					,	['Neoperreo','Corrido Tumbado','Emo Rap','Symphonic Rap','Glitch Hop','Cloud Rap','Grime','Urban Breaks','Trap','Drill','Hip-Hop Soul','Pop Rap','Country Rap','Conscious','British Hip-Hop','South Coast','Midwest','East Coast','Gangsta','Horrorcore','Reggaeton','Progressive Rap','Ragga Hip-Hop','Jazz-Rap','West Coast','Miami Bass','Bounce','Boom Bap','Golden Age','Hardcore Rap','Melodic Hardcore','Electro','Old-School','Alt. Rap','Underground Rap','Psychedelic Rap']],
		['Breakbeat_supergenre'				,	['Deconstructed Club','Jersey Club','EDM Trap','Future Bass','Bubblegum Bass','Bassline','Glitch Hop','Breakbeat Garage','Broken Beats','Nu Skool Breaks','UK Garage','Chemical Breaks','Big Beat','Trip Hop','Florida Breaks','Breakdance','Electro']],
		['Drum & Bass_supergenre'			,	['Future Bass','Post-Dubstep','Dubstep','Bassline','Breakbeat Garage','Liquid Funk','Neuro Funk','Intelligent Drum & Bass','Ambient Drum & Bass','Jazzstep','Jump Up','Hardstep','Techstep','Darkcore','Darkstep','Old School Jungle']],
		['Hardcore_supergenre'				,	['New Beat','Uptempo Hardcore','Hardcore Techno','Hardcore Rave','Breakbeat Hardcore','Darkcore','Darkstep','Happy Hardcore','Bouncy Techno','Trancecore','Acidcore','Gabber','Speedcore','Frenchcore','Terrorcore','Nu Style Gabber','Mainstream Hardcore','Hardstyle']],
		['Techno_supergenre'				,	['Melodic Techno-House','Psychedelic Techno','Ghetto House','Ghettotech','Dark Techno','Juke','Hardtechno','Acid Techno','Tech Trance','Tech House','Industrial Techno','Minimal Techno','Ambient Techno','IDM','Hardtek','Freetekno','Hardcore Techno','Hardcore Rave','New Beat','Detroit Techno','Kuduro']],
		['House_supergenre'					,	['Melodic Techno-House','Big Room House','Fidget House','Electro House','Moombahton','Microhouse','Minimal House','Ghetto House','French House','Funky House','Tech House','NRG','Hard NRG','Hard House','Progressive House','Tribal House','Deep House','Ibiza House','Ibiza Trance','Dream House','Dream Trance','Hip House','Eurodance','Acid House','Nu-Disco','Chicago House','Garage House']],
		['Trance_supergenre'				,	['Neo Trance','Epic Trance','Hardtrance','NRG','Hard NRG','Hard House','Eurotrance','Vocal Trance','Progressive Trance','Goa Trance','Psytrance','Ibiza House','Ibiza Trance','Dream House','Dream Trance','Classic Trance','Acid Trance']],
		['Downtempo_supergenre'				,	['Electronic Sufi','Darksynth','Synthwave','Vaporwave','Minimal Wave','Nu Jazz','Minimal Industrial','Digital Minimalism','Glitch','Ambient Breaks','Illbient','Chill-Out Downtempo','Ambient House','Ambient','Ambient Electronic','Ambient New Age','Nature Music','New Age','Neo-Classical New Age','Hang Music','Healing Music','New Acoustic','Dark Ambient','Dark Industrial','Bit Music','Synth','Muzak','Minimalism','Lounge','Exotica','Musique Concrete']],
		['Classical Medieval Era_supergenre',	['Ballata','Estampie','Gregorian','Chant','Madrigal','Motet','Organum','Saltarello']],
		['Classical Renaissance Era_supergenre',['Choral','Ballade','Canzona','Carol','Fantasia','Galliard','Intermedio','Lauda','Litany','Madrigal','Comedy','Madrigale Spirituale','Mass','Motet','Motet-Chanson','Opera','Pavane','Ricercar','Sequence','Tiento','Toccata']],
		['Classical Baroque Era_supergenre',	['Allemande','Canon','Cantata','Chaconne','Concerto','Courante','Fugue','Classical Gavotte','Gigue','Mass','Minuet','Opera','Oratorio','Partita','Passacaglia','Passepied','Prelude','Sarabande','Sinfonia','Sonata','Suite','Sonatina']],
		['Classical Classical Era_supergenre',	['Bagatelle','Ballade','Ballet','Caprice','Carol','Concerto','Classical Dance','Divertimento','Étude','Fantasy','Impromptu','Intermezzo','Lied','Mass','Classical Mazurka','March','Music Hall','Nocturne','Octet','Opera','Oratorio','Polonaise','Prelude','Quartet','Quintet','Requiem','Rhapsody','Rondo','Scherzo','Serenade','Sinfonia Concertante','Sonata','Symphony','Suite','Waltz']],
		['Classical Romantic Era_supergenre',	['Bagatelle','Ballade','Ballet','Barcarola','Caprice','Carol','Concerto','Classical Dance','Divertimento','Étude','Fantasy','Impromptu','Intermezzo','Lied','Mass','Classical Mazurka','March','Music Hall','Nocturne','Octet','Opera','Oratorio','Polonaise','Prelude','Quartet','Quintet','Requiem','Rhapsody','Rondo','Scherzo','Serenade','Sinfonia Concertante','Sonata','Symphony','Suite','Waltz']],
		['Classical Modernist Era_supergenre',	['Classical Crossover','Avant-Garde Classical','Contemporary Classical','Neo-Classical','Third Stream','Ambient Classical','Musical','Cabaret','Murga']],
		['Japanese Classical_supergenre',		['Kabuki']],
		['Indian Classical_supergenre',			['Hindustani']]
	],
	// Small groups of related genres and styles
	// This points to genre and styles which are usually considered pretty similar in an 'listening session' sense.
	// For ex. instead of adding sub-styles to other places, we can add them here
	style_cluster: [
		['Synth & Wave XL'					,	['Minimal Wave','Minimal Industrial','Darkwave','Coldwave','Electroclash','Synth-Pop','Futurepop','Synthwave','Vaporwave','Synth','Darksynth']],
		['Gothic XL'						,	['Darkwave','Coldwave','Darksynth','Gothic Rock','Post-Punk']],
		['Lounge XL'						,	['Lounge','Exotica','Latin-Jazz','Bossa Nova','Samba']],
		['Easy Listening'					,	['Lounge','Muzak','Bossa Nova']],
		['Progressive Rock XL'				,	['Proto-Prog','Crossover Prog','Symphonic Rock','Heavy Prog','Eclectic Prog','Krautrock','Math Rock','Neo-Prog','Italian Prog. Rock','Japanese Prog. Rock','Space Rock','Avant-Prog','Canterbury Scene','Flamenco Rock','Nuevo Flamenco']],
		['Progressive Psychedelic Fusion XL',	['Canterbury Scene','Eclectic Prog','Krautrock']],
		['Classic Rock XL'					,	['Proto-Prog','Arena Rock','Southern Rock','Hard Rock','Aussie Rock','Detroit Rock','90s Rock','Boogie Rock','Blues Rock','Acid Rock','Folk-Rock','Beat Music','Raga Rock']],
		['Psy XL & Gaze'					,	['Dream Pop','Shoegaze','Dance-Punk','Acid Rock','Space Rock','Psychedelic Rock','Psychedelic Folk','Psychedelic Rap','British Psychedelia','Psychedelic Pop','Neo-Psychedelia','Psychedelic Grunge','Psychedelic Blues','Psychedelic Funk','Psychedelic Soul','Raga Rock']],
		['Punk XL'							,	['Proto-Punk','Punk Rock','Anarcho-Punk','Psychobilly','Pop Punk','Grunge Punk','Riot Grrrl','Industrial Punk','Celtic Punk','Ska Punk','Cowpunk','Skacore']],
		['Classic Metal XL'					,	['Neo-Classical Metal','British Metal','Glam Metal','Hair Metal','Pop Metal','Classic Metal','Proto-Metal']],
		['Black Metal XL'					,	['Gothic Metal','Black Metal','Atmospheric Black Metal','Death Metal','Doom Metal']],
		['Thrash Metal XL'					,	['Groove Metal','Crossover Thrash','Thrash Metal']],
		['Alt. Metal XL'					,	['Speed Metal','Power Metal']],
		['Progressive Alt. Metal XL'		,	['Post-Metal','Symphonic Metal','Progressive Metal']],
		['Contemporary Alt. Metal XL'		,	['Nu Metal','Rap Metal','Grunge Metal']],
		['Stoner Metal XL'					,	['Stoner Doom','Stoner Sludge','Stoner Metal']],
		['Grunge XL'						,	['Grunge','Grunge Rock','Classic Grunge','Grunge Metal','Grunge Punk','Psychedelic Grunge']],
		['Stoner XL'						,	['Stoner Rock','Stoner Doom','Stoner Sludge','Proto-Stoner Rock']],
		['Doom XL'							,	['Doom Metal','Stoner Doom','Atmospheric Black Metal']],
		['Extreme Metal XL'					,	['Extreme Metal','Black Metal','Death Metal','Doom Metal','Thrash Metal','Speed Metal']],
		['British Folk-Rock XL'				,	['British Folk-Rock','British Folk-Jazz','Folk Baroque']],
		['Roots Rock'						,	['Country Pop','Country Rock','Heartland Rock','Southern Rock','Pub Rock','Folk-Rock','Celtic Rock']],
		['Mainstream Pop'					,	['Urban Soul','Electropop','Dance Pop','Disco Pop','Hypersoul','Contemporary R&B','Sophisti-Pop','J-Pop','K-Pop']],
		['Asian Pop'						,	['J-Pop','K-Pop', 'Kayokyoku']],
		['Traditional Pop'					,	['Vaudeville Blues','Doo Wop','Vocal Pop']],
		['Vocal Pop'						,	['R&B','Doo Wop','Rockabilly','Brill Building Sound','Close Harmony','Jazz-Pop']],
		['Disco XL'							,	['Funktronica','Electrofunk','Disco','Eurodisco','Disco Pop']],
		['Post-Disco XL'					,	['Dance-Rock','Dance Pop','Italo Disco']],
		['Soft Pop XL'						,	['Sunshine Pop','Soft Rock','Folk Pop','Chanson']],
		['Urban R&B XL'						,	['Urban Soul','Urban Breaks']],
		['Urban Music & Rap XL'				,	['Urban Breaks','Trap','Reggaeton','Nuevo Flamenco','Neoperreo','Conscious','Grime','Corrido Tumbado','Drill']],
		['Latin Urban Music & Rap XL'		,	['Trap','Reggaeton','Neoperreo','Corrido Tumbado','Dancehall','Dembow']],
		['Alt. Rap XL'						,	['British Hip-Hop','Progressive Rap','Jazz-Rap','Alt. Rap','Underground Rap','Psychedelic Rap','Symphonic Rap']],
		['Downtempo Rap XL'					,	['Jazz-Rap','Trip Hop','Cloud Rap']],
		['Sad Emo XL'						,	['Emo Rap','Emo Pop','Emo Rock','Sadcore','Shoegaze']],
		['Funk'								,	['Classic Funk','P-Funk','Deep Funk','Electrofunk','Funk Rock','Contemporary Funk','Funk Blues','Deep Funk Revival','Psychedelic Funk']],
		['Soul'								,	['Philadelphia Soul','Motown Sound','Southern Soul','Psychedelic Soul']],
		['Deep Soul XL'						,	['Smooth Soul','Soul Blues','Southern Soul']],
		['Contemporary Soul'				,	['Hip-Hop Soul','Neo Soul','Trip Hop','Future Soul']],
		['Modern Blues XL'					,	['Contemporary Blues','Soul Blues','Modern Electric Blues','Blues Rock','Funk Blues','British Blues','Texas Blues','Psychedelic Blues']],
		['Classic Blues XL'					,	['Detroit Blues','Memphis Blues','Texas Blues','Chicago Blues']],
		['Traditional Blues XL'				,	['Vaudeville Blues','Country Blues','Delta Blues']],
		['Traditional Country'				,	['Neo-Traditional Country','Nashville Sound','Bakersfield Sound','Bluegrass','Honky Tonk','Hillbilly','Country Boogie','Jug Band','Square Dance']],
		['Post-Jazz'						,	['Electro Swing','Nordic Jazz','Nu Jazz','Future Jazz','Acid Jazz','Smooth Jazz','Jazz-Rock','Fusion']],
		['Modern Jazz'						,	['Post-Bop','Free Jazz','Avant-Garde Jazz','Soul-Jazz','Jazz-Funk','Hard-Bop','Cool Jazz','Modal Jazz','Bebop']],
		['Classic Jazz'						,	['Gypsy-Jazz','New Orleans Jazz','Dixieland','Chicago Jazz','Mainstream Jazz','Swing','Big Band','New Orleans Jazz Revival','Dixieland Revival']],
		['Mainstream Jazz XL'				,	['Contemporary Jazz','Mainstream Jazz','Swing','Soul-Jazz','Jazz-Blues']],
		['Reggae'							,	['Reggae Fusion','Ragga','UK Reggae','Dub','Roots Reggae','Rocksteady']],
		['Electro XL'						,	['Florida Breaks','Breakdance','Electro','Miami Bass','Bounce']],
		['UK Bass'							,	['UK Garage','Breakbeat Garage','Bassline','Future Bass','Dubstep','Post-Dubstep']],
		['Loungetronica'					,	['Trip Hop','Nu Jazz','Future Jazz','Future Bass','Broken Beats','Ambient House','Chill-Out Downtempo']],
		['Gabber XL'						,	['Gabber','Speedcore','Frenchcore','Terrorcore','Nu Style Gabber','Mainstream Hardcore']],
		['Rave XL'							,	['Dark Techno','Acid Techno','Acid House','New Beat','Hardcore Techno','Hardcore Rave','Breakbeat Hardcore','Darkcore','Darkstep','Happy Hardcore','Bouncy Techno','Trancecore','Acidcore']],
		['Psy Rave XL'						,	['Dark Techno','Psytrance','Goa Trance','Psychedelic Techno']],
		['Electro House XL'					,	['Fidget House','Electro House','Moombahton']],
		['Hard Dance'						,	['Hardtrance','NRG','Hard NRG','Hard House','Hardtechno','Hardstyle']],
		['Ambient Dance'					,	['Ambient House','Ambient Breaks','Illbient','Ambient Techno','IDM','Chill-Out Downtempo']],
		['Early Progressive Electronic XL'	,	['Krautrock','New Age','Synth']],
		['Progressive Electronic XL'		,	['Progressive House','Progressive Trance','Melodic Techno-House','Deep House']],
		['Electronic Rap XL'				,	['Hip House','Ghettotech','Grime','EDM Trap','Trap','Electro','Glitch Hop']],
		['Mainstream Electronic'			,	['Melodic Techno-House','Big Room House','Electro House','Progressive House','Bubblegum Bass','Hyperpop','Digicore']],
		['New Age XL'						,	['Neo-Classical New Age','Healing Music','New Age','New Acoustic']],
		['New Age Folk XL'					,	['Hang Music','Celtic New Age','New Acoustic']],
		['Afro-Cuban XL'					,	['Son']],
		['Latin Rock XL'					,	['Candombe Beat','Latin Rock','Chicano Rock']],
		['Latin Folk XL'					,	['Afro-Cuban','Son','Argentinian Folk','Venezuelan Folk','Batucada','Candombe','Cumbia','Chilean Folk','Colombian Folk','Cantautor','Fado','Flamenco','Forró','Jota','Mexican Folk','Peruvian Folk','Traditional Folk','Rumba','Rumba Flamenca','Rumba Catalana','Rumba Fusión','Ranchera','Tango','Mariachi','Bolero','Samba','Nueva Gaita','Nuevo Flamenco','Corrido']],
		['Americana XL'						,	['Americana','American Primitive Guitar','Country Folk','Neo-Traditional Folk','Songwriter','Traditional American Folk']],
		['Traditional American Folk XL'		,	['American Primitive Guitar','Neo-Traditional Folk','Traditional American Folk','Appalachian']],
		['Asian Folk XL'					,	['Tuvan','Hindustani','Israeli Folk','Afghan Folk','Gaana']],
		['African Folk XL'					,	['Malian Folk','Griot','Isicathamiya','Mauritanian Folk','Niger Folk','Nubian Folk','Sahrawi Folk','Tishoumaren','Gnawa','Classical Sufi']],
		['Bal Folk XL'						,	['Andro','Bourree','Bresse','Chapelloise','Circle','Farelquesh','Gavotte','Hanterdro','Kost ar C\'hoad','Laridé','Mazurka','Jig','Plinn','Polka','Rond','Scottish','Tarantella','Tricot','Vals']],
		['European Folk XL'					,	['Celtic Folk','Traditional European Folk','Bal Folk','Éntekhno','Pagan Folk','German Folk','Irish','Jig','Scottish Folk','Romani','Sephardic','Muiñeira','Alalá']],
		['Galician Folk XL'					,	['Muiñeira','Alalá','Jota']],
		['Celtic-Nordic Folk XL'			,	['Celtic Folk','Folk Metal','Pagan Folk','Joik','Nordic Folk']],
		['European Pre-Modern Folk XL'		,	['Medieval','Renaissance']],
		['Modern Folk XL'					,	['Contemporary Folk','Folk Pop','Folk-Rock']],
		['Neo Folk XL'						,	['Industrial Folk','Folk Metal','Pagan Folk']],
		['Ambient XL'						,	['Ambient','Ambient Industrial','Nature Music','Ambient Rock','Ambient Folk','Ambient Electronic','Ambient Metal','Ambient New Age','Ambient Classical','Ambient Funk']],
		['Chill Folk XL'					,	['Freak Folk', 'Ambient Folk', 'Dream Pop']],
		['Arabian Folk-Rock XL'				,	['Anatolian Rock','Mauritanian Folk','Niger Folk','Sahrawi Folk','Tishoumaren','Tuvan','Classical Sufi','Afro-Rock']],
		['Chamber Music XL'					,	['Bagatelle','Divertimento','Étude','Fantasy','Fantasia','Impromptu','Intermezzo','Classical Mazurka','Nocturne','Octet','Prelude','Quartet','Quintet','Rondo','Scherzo','Sonata','Suite','Canon','Fugue','Partita','Sonatina','Ricercar','Tiento','Toccata']],
		['Orchestral Music XL'				,	['Sinfonia','Concerto','Music Hall','Requiem','Sinfonia Concertante','Symphony','Contemporary Classical']],
		['Ballroom Music XL'				,	['Waltz','Allemande','Chaconne','Courante','Classical Gavotte','Gigue','Minuet','Galliard','Passacaglia','Passepied','Pavane','Saltarello','Classical Dance','Polonaise']],
		['Poetry-Secular Music XL'			,	['Lied','Rhapsody','Serenade','Madrigal','Estampie','Ballata','Ballade','Canzona']],
		['Choral-Spiritual Music XL'		,	['Mass','Gregorian','Chant','Motet','Organum','Choral','Lauda','Litany','Madrigale Spirituale','Motet-Chanson','Sequence']],
		['Choral-Orchestral Music XL'		,	['Oratorio','Opera']],
		['Contemporary Popular Choral XL'	,	['Musical','Cabaret','Murga']]
	],
	/*
		-> Influences: Special relations between genres and styles. Like origins, derivatives or things considered 'anti-influences'.
		Users may want to edit these at the user's descriptor file
	*/
	// Primary influence. For example one style being the origin of other.
	// For ex. 'Rockabilly' and 'Rockabilly revival'.
	style_primary_origin: [
		['Rock & Roll'						,	['Rockabilly','Surf Rock','Garage Rock','Beat Music','R&B','Skiffle','Hillbilly','Country Boogie','Brill Building Sound','Psychobilly']],
		['New Orleans R&B'					,	['Rock & Roll','Ska']],
		['Folk_cluster'						,	['Folk-Rock','Rock & Roll','Skiffle']],
		['British Folk-Rock'				,	['Folk-Rock','Folk Baroque','Progressive Folk']],
		['Progressive Folk'					,	['Folk-Rock','Proto-Prog','Crossover Prog','Symphonic Rock','Italian Prog. Rock','Japanese Prog. Rock','Nuevo Flamenco']],
		['Progressive Rock XL'				,	['Space Rock']],
		['Freak Folk'						,	['Folk-Rock','British Folk-Rock','Folk Baroque','Psychedelic Folk']],
		['Garage Rock'						,	['Rock & Roll','Surf Rock','Space Rock','Psychedelic Rock','Acid Rock','Pub Rock','Proto-Punk','Garage Rock Revival','Post-Punk Revival','Garage Punk','Garage Pop']],
		['Beat Music'						,	['Rock & Roll','Folk-Rock','Psychedelic Rock','Acid Rock','Pop Rock','Power Pop','Hard Rock','R&B','Raga Rock']],
		['Psychedelic Rock'					,	['Space Rock','Proto-Prog','Heavy Prog','Eclectic Prog','Canterbury Scene','Krautrock','Italian Prog. Rock','Japanese Prog. Rock','Psychedelic Folk','Acid Rock','Glam Rock','Garage Rock','Hard Rock','P-Funk','Classic Funk','Blues Rock','British Blues','Fusion','Neo-Psychedelia','Raga Rock']],
		['Psychedelic Funk'					,	['Psychedelic Rock','Psychedelic Soul','P-Funk']],
		['Psychedelic Soul'					,	['Psychedelic Rock','Psychedelic Funk','P-Funk']],
		['Psychedelic Blues'				,	['Psychedelic Rock','Blues Rock']],
		['Hard Rock'						,	['Beat Music','Psychedelic Rock','Acid Rock','Glam Rock','Punk Rock','Blues Rock','British Blues']],
		['Glam Rock'						,	['Proto-Prog','Crossover Prog','Symphonic Rock','Psychedelic Rock','Punk Rock','Pub Rock','Proto-Punk','New Wave','Glam Metal']],
		['Southern Rock'					,	['Country Rock','Blues Rock']],
		['Heartland Rock'					,	['Folk-Rock','Soft Rock','Country Rock','Country Pop']],
		['Arena Rock'						,	['Symphonic Rock','Crossover Prog','Hard Rock','Pub Rock']],
		['Noise Rock'						,	['Math Rock','Grunge','No Wave','Noise Music']],
		['Grunge'							,	['Noise Rock','Post-Grunge','Alt. Rock','Punk Rock','Thrash Metal']],
		['Rap Rock'							,	['Funk Metal','Nu Metal','Rap Metal','Hardcore Rap','Melodic Hardcore']],
		['Dream Pop'						,	['Shoegaze','Chillwave','Indie','Psychedelic Rock','Big Beat','Chemical Breaks','Britpop','Dance-Punk']],
		['Post-Britpop'						,	['Britpop','Indie']],
		['Garage Rock Revival'				,	['Post-Punk Revival','Dance-Punk','Post-Punk','Garage Rock','Garage Punk','Garage Pop']],
		['Brill Building Sound'				,	['Pop Rock','Power Pop','Rock & Roll']],
		['Power Pop'						,	['Beat Music','Brill Building Sound','Pop Punk']],
		['Hillbilly'						,	['Rock & Roll','Rockabilly','Skiffle','Honky Tonk','Bluegrass','Progressive Bluegrass','Country Boogie']],
		['Honky Tonk'						,	['Hillbilly','Rockabilly','Skiffle','Outlaw Country','Nashville Sound','Bakersfield Sound','Neo-Traditional Country','Country Boogie']],
		['Bakersfield Sound'				,	['Outlaw Country','Honky Tonk']],
		['Country Rock'						,	['Folk-Rock','Southern Rock','Heartland Rock','Nashville Sound']],
		['Country Pop'						,	['Folk-Rock','Soft Rock','Nashville Sound']],
		['Outlaw Country'					,	['Alt. Country']],
		['Country Boogie'					,	['Rockabilly','Country Pop']],
		['R&B'								,	['Jump Blues','Doo Wop','Southern Soul','Motown Sound','Beat Music','Rock & Roll','Modern Gospel','Soul-Jazz','Ska']],
		['Doo Wop'							,	['R&B','Philadelphia Soul']],
		['Southern Soul'					,	['R&B','Traditional Gospel','Classic Funk','Soul Blues','Modern Gospel','Ska']],
		['Motown Sound'						,	['R&B','Philadelphia Soul','Modern Gospel','Neo Soul','Rocksteady']],
		['Philadelphia Soul'				,	['Doo Wop','Motown Sound','UK Reggae','Disco']],
		['Classic Funk'						,	['P-Funk','Deep Funk','Electrofunk']],
		['P-Funk'							,	['Classic Funk','Deep Funk','Electrofunk','Old-School']],
		['Bossa Nova'						,	['Latin-Jazz','Swing','Lounge','Samba']],
		['Fado'								,	['Latin-Jazz','Flamenco','Bossa Nova']],
		['Lounge'							,	['Bossa Nova','Swing','Nu Jazz','Future Jazz']],
		['Trip Hop'							,	['Chill-Out Downtempo','Golden Age','Ambient Breaks','Ambient House']],
		['Chill-Out Downtempo'				,	['Trip Hop','Ambient Breaks','Illbient','Ambient Techno','Ambient House']],
		['Future Bass'						,	['UK Garage','Bassline','Post-Dubstep']],
		['UK Garage'						,	['Broken Beats','Breakbeat Garage','Bassline','Future Bass','Old School Jungle']],
		['Folk_cluster'						,	['Country_cluster','Blue_Note_cluster']],
		['Classical Modernist Era_supergenre',	['New Age','Neo-Classical New Age']],
		['Classical Modernist Era_supergenre',	['Ragtime','Stride']],
		['Hillbilly'						,	['Country Blues','North American Folk_supergenre']],
		['Proto-Stoner Rock'				,	['Stoner Rock','Stoner Doom','Stoner Sludge']],
		['Proto-Metal'						,	['Classic Metal']],
		['Rockabilly'						,	['Rockabilly Revival']],
		['Retro Rock'						,	['Classic Rock XL']],
		['Ska'								,	['Ska Revival']],
		['Deep Funk Revival'				,	['Deep Funk','Classic Funk']],
		['Tulsa Sound'						,	['Classic Rock XL','Classic Blues XL','Rock & Roll','Country Blues','Rockabilly','Country Rock','Folk-Rock']],
		['Appalachian'						,	['Old-Timey','Bluegrass','Traditional American Folk XL','Traditional Country']],
		['Industrial Punk'					,	['Industrial Rock']],
		['Krautrock'						,	['Post-Rock','Post-Punk']],
		['Proto-Punk'						,	['Punk Rock','Pop Punk']],
		['Celtic Punk'						,	['Punk Rock']],
		['Ska Punk'							,	['Ska','Skacore']],
		['Cowpunk'							,	['Alt. Country','Roots Rock','Americana']],
		['Black Metal'						,	['Atmospheric Black Metal','Thrash Metal','Death Metal']],
		['Neo-Classical Metal'				,	['Speed Metal','Power Metal','Symphonic Metal']],
		['Post-Metal'						,	['Post-Rock','Post-Hardcore']],
		['Groove Metal'						,	['Thrash Metal','Death Metal']],
		['Speed Metal'						,	['British Metal']],
		['Pop Metal'						,	['Hair Metal','Glam Metal']],
		['Boogie Rock'						,	['Blues Rock','Hill Country Blues']],
		['Flamenco Rock'					,	['Progressive Rock XL','Flamenco']],
		['Geek Rock'						,	['Alt. Rock']],
		['Detroit Rock'						,	['Acid Rock','Hard Rock','Garage Rock']],
		['Aussie Rock'						,	['Pub Rock','Rock & Roll']],
		['Post-Disco XL'					,	['Dance-Rock','House_supergenre','Techno_supergenre']],
		['Dance-Rock'						,	['Pop Rock','Post-Punk']],
		['Ranchera'							,	['Mariachi']],
		['Afro-Cuban'						,	['Son','Bolero','Calypso']],
		['Calypso'							,	['Ska','Reggae','Mento']],
		['Candombe Beat'					,	['Candombe','Beat Music']],
		['Candombe'							,	['Tango']],
		['Classic Rock XL'					,	['Latin Rock XL','Latin Rock']],
		['Hypersoul'						,	['Urban Soul','Dance Pop']],
		['Sadcore'							,	['Alt. Rock','Indie']],
		['Tishoumaren'						,	['Hill Country Blues','Malian Folk','Anatolian Rock','Tuvan','Afro-Rock']],
		['Anatolian Rock'					,	['Hill Country Blues','African Folk XL']],
		['Tuvan'							,	['Anatolian Rock','African Folk XL']],
		['Ambient Industrial'				,	['Ambient']],
		['Emo Pop'							,	['Emo Rock']],
		['Celtic Rock'						,	['Pub Rock','Celtic Folk','Celtic Punk']],
		['Dembow'							,	['Dancehall']],
		['Renaissance Rock'					,	['British Folk-Rock','Progressive Folk','Celtic Rock']],
		['Nueva Gaita'						,	['Folktronica','Colombian Folk']],
		['Mambo'							,	['Son','Swing']],
		['Sophisti-Pop'						,	['Soul-Jazz','80s Rock','New Wave']],
		['Industrial Folk'					,	['Pagan Folk','Nordic Folk','Progressive Folk','Folk Metal']],
		['Neo Folk XL'						,	['Dark Ambient']],
		['Cool Jazz'						,	['Bebop']],
		['Hard-Bop'							,	['Bebop']],
		['Nuevo Flamenco'					,	['Latin-Jazz','Soul-Jazz','Country Blues','Rumba Flamenca']],
		['Boom Bap'							,	['Golden Age','East Coast']],
		['Chill Folk XL'					,	['New Acoustic']],
		['Nu-Disco'							,	['Electro','Disco XL','Post-Disco XL']],
		['Electrorock'						,	['Synth-Pop', 'Electroclash']],
		['Classical Sufi'					,	['Gnawa','Nubian Folk','Sahrawi Folk']],
		['Electronic Sufi'					,	['Folktronica','Progressive Trance','Psytrance']],
		['Death Rock'						,	['Gothic Rock']],
		['NRG'								,	['Hard NRG']],
		['Semba'							,	['Kizomba']],
		['Kuduro'							,	['Techno_supergenre']],
		['Afro-Latin Ritual-Tribal'			,	['African Ritual-Tribal']],
		['African Ritual-Tribal'			,	['Gnawa','Mbalax']],
		['Melodic Techno-House'				,	['Progressive House']],
		['Fantasy'							,	['Ricercar','Tiento','Fantasia']],
		['Tiento'							,	['Ricercar', 'Fantasia']],
		['Fantasia'							,	['Ricercar']],
		['Kawaii Metal'						,	['Pop Metal','J-Pop']],
		['Darksynth'						,	['Darkwave','Synthwave','Dark Techno']],
		['Dark Techno'						,	['Dark Industrial','House_supergenre']],
		['Kayokyoku'						,	['J-Pop']],
		['K-Pop'							,	['Contemporary R&B','Urban Soul','Electropop']],
		['Symphonic Rap'					,	['Contemporary Classical','Jazz-Rap']],
		['Gothic Metal'						,	['Symphonic Metal']],
		['Darkwave'							,	['Coldwave']],
		['Cloud Rap'						,	['Trap','Chillwave']],
		['Grime'							,	['UK Garage']],
		['Eurodance'						,	['Hip House']],
		['Ghettotech'						,	['Detroit Techno','Electro']],
		['Emo Rap'							,	['Trap','Sadcore','Cloud Rap']],
		['Nu-Disco'							,	['French House']],
		['Urban Breaks'						,	['Trap','Pop Rap']],
		['Corrido Tumbado'					,	['Trap','Mexican Folk','Corrido']],
		['Drill'							,	['Gangsta']],
		['Sad Emo XL'						,	['Gothic XL']],
		['Muiñeira'							,	['Jig']],
		['Goa Trance'						,	['Psytrance']],
		['Deconstructed Club'				,	['Jersey Club']],
		['Hyperpop'							,	['Bubblegum Bass','Electropop','Digicore', 'Glitchcore']],
		['Acid Techno'						,	['Acid House']],
		['Tribal House'						,	['Deep House','Progressive House']],
		['Uptempo Hardcore'					,	['Hardcore Techno', 'Speedcore', 'Gabber']]
	],
	// Secondary influence. For example one style being slightly influenced by another.
	style_secondary_origin: [
		['Trip Hop'							,	['Acid Jazz','Roots Reggae','Chemical Breaks']],
		['Future Bass'						,	['Chillwave','Trap','Ghetto House']],
		['Celtic-Nordic Folk XL'			,	['Celtic Punk']],
		['Classical Music_supercluster'		,	['Neo-Classical Metal','Symphonic Metal']],
		['Candombe Beat'					,	['Latin Rock']],
		['Tishoumaren'						,	['Tulsa Sound','Blues Rock','Malian Folk','Griot','Niger Folk','Stoner Rock']],
		['Anatolian Rock'					,	['Tulsa Sound','Blues Rock','Blues_supergenre','Stoner Rock']],
		['Dembow'							,	['Dub']],
		['Renaissance Rock'					,	['New Age','Medieval','Renaissance']],
		['Nueva Gaita'						,	['Pagan Folk','Ambient Folk']],
		['Mambo'							,	['Afro-Cuban']],
		['Sophisti-Pop'						,	['Urban Soul','Techno_supergenre']],
		['Cool Jazz'						,	['Swing']],
		['Hard-Bop'							,	['Jazz-Funk']],
		['Bossa Nova'						,	['Cool Jazz']],
		['Post-Bop'							,	['Mainstream Jazz','Free Jazz']],
		['Nuevo Flamenco'					,	['Folk-Jazz','Flamenco Rock']],
		['Freak Folk'						,	['Close Harmony','Baroque Pop','Ambient New Age','Neo-Classical New Age','Malian Folk','Tishoumaren','Acid Rock']],
		['Electrorock'						,	['Industrial Rock']],
		['Classical Sufi'					,	['Psychedelic Folk','Ambient Folk']],
		['Electronic Sufi'					,	['Classical Sufi','Chill-Out Downtempo','Ambient House']],
		['Sephardic'						,	['Flamenco','Israeli Folk','Anatolian Rock']],
		['Death Rock'						,	['Darkwave','Coldwave','Post-Punk']],
		['Gothic Rock'						,	['Darkwave','Coldwave','Post-Punk','Punk Rock']],
		['Post-Rock'						,	['Avant-Garde Jazz']],
		['Kuduro'							,	['Semba']],
		['Asian Ritual-Tribal'				,	['Tuvan']],
		['Melodic Techno-House'				,	['Deep House','Progressive Trance']],
		['Loungetronica'					,	['Deep House','Melodic Techno-House']],
		['Rodeo'							,	['Outlaw Country','Square Dance']],
		['Kayokyoku'						,	['Rock & Roll','Vocal Pop']],
		['K-Pop'							,	['Europop']],
		['Symphonic Rap'					,	['Underground Rap','Symphonic Rock']],
		['Cloud Rap'						,	['Trip Hop','Jazz-Rap']],
		['Grime'							,	['Dancehall']],
		['Philadelphia Soul'				,	['Smooth Soul']],
		['Neoperreo'						,	['Hip House']],
		['Eurodance'						,	['Progressive House']],
		['Acid House'						,	['Hip House','Trip Hop']],
		['Ghettotech'						,	['Ghetto House','Hip House']],
		['Emo Rap'							,	['Emo Pop','Nu Metal','Jazz-Rap','Horrorcore']],
		['Bubblegum Bass'					,	['UK Bass']],
		['Deconstructed Club'				,	['Neoperreo']],
		['Hill Country Blues'				,	['Niger Folk','Malian Folk','Sahrawi Folk']],
		['Traditional Blues XL'				,	['Niger Folk','Malian Folk','Sahrawi Folk']],
		['Afrobeat'							,	['Afro-Cuban','R&B','Classic Funk','Funk Rock']],
		['Acid Techno'						,	['Freetekno','Hardcore Techno','Hardcore Rave']],
		['Tribal House'						,	['Minimal Techno']],
		['Psychedelic Techno'				,	['Psytrance']],
		['Uptempo Hardcore'					,	['Frenchcore']]
	],
	// Anti-influences. Styles so different that are considered to be heavily distanced, even if the belong to the same genre parent.
	// For ex. 'Americana' and 'British Folk-Rock' are both 'Folk' styles, but they are considered to be farther away than other 'Folk' styles.
	style_anti_influence: [
		['Classical Music_supercluster'		,	['Heavy Music_supercluster','Pop & Rock Music_supercluster','Rythm Music_supercluster','Breakbeat Dance_cluster','Four-to-the-floor Dance_cluster','Industrial_supergenre','Metal_supergenre','Classic Rock XL','Rock_cluster','Punk Rock_supergenre','Pop_supergenre','Country_supergenre','Blues_supergenre','Jazz_supergenre','Rap_cluster','Hardcore Punk_supergenre','Electronic Music_supercluster','Techno_supergenre','House_supergenre','Trance_supergenre','Folk-Rock','Alt. Rock']],
		['British Folk-Rock'				,	['Americana','Country_supergenre','Country Rock','Country Folk','Heartland Rock','Sunshine Pop','Beat Music','Roots Rock']],
		['British Folk-Jazz'				,	['Americana','Country_supergenre','Country Rock','Country Folk','Heartland Rock','Sunshine Pop','Beat Music','Roots Rock']],
		['Folk Baroque'						,	['Americana','Country_supergenre','Country Rock','Country Folk','Heartland Rock','Sunshine Pop','Beat Music','Roots Rock']],
		['Grunge'							,	['Indie','Britpop','Funk Metal','Beat Music','Roots Rock','Glam Rock','Pop Metal','Glam Metal','Hair Metal','Kawaii Metal']],
		['Post-Britpop'						,	['Garage Rock Revival','Post-Punk Revival','Garage Punk']],
		['Garage Rock Revival'				,	['Dream Pop','Shoegaze']],
		['Freak Folk'						,	['Electropop','Psychedelic Rock','Celtic Folk','Pagan Folk','Medieval','Renaissance Rock','Alt. Rock','Rock_cluster','Tishoumaren','Hill Country Blues','Blues_supergenre','Country Rock','Classic Rock XL','Soft Rock','Roots Rock','Southern Rock','Afro-Rock']],
		['Chill-Out Downtempo'				,	['Progressive Trance','New Age','New Age XL','Neo-Classical New Age','Healing Music','New Acoustic']],
		['Future Jazz'						,	['Industrial_supergenre','Metal_supergenre','Classic Rock XL','Rock_cluster','Punk Rock_supergenre','Pop_supergenre','Country_supergenre','Blues_supergenre']],
		['Jazz_supergenre'					,	['Industrial_supergenre','Metal_supergenre','Classic Rock XL','Rock_cluster','Punk Rock_supergenre','Pop_supergenre','Country_supergenre','Blues_supergenre','Progressive Rock XL','Folk Music_supercluster','Alt. Rock','Psychedelic Rock']],
		['Blues_supergenre'					,	['Industrial_supergenre','Metal_supergenre','Rap_supergenre','Hardcore Punk_supergenre','Electronic Music_supercluster','Classic Metal XL','Heavy Prog','Dream Pop','Indie','Progressive Rock XL']],
		['Traditional Pop'					,	['Electropop','Electronic Music_supercluster','Electro','Psychedelic Rock','Psychedelic Folk','Progressive Rock XL']],
		['Electronic Music_supercluster'	,	['Metal_supergenre','Classic Rock XL','Punk Rock_supergenre','Country_supergenre','Blues_supergenre','Jazz_supergenre']],
		['Stoner Rock'						,	['Pop Rock','Pop_supergenre']],
		['Death Metal'						,	['Contemporary Christian Music','Christian Rock','Pop_supergenre']],
		['Thrash Metal'						,	['Glam Metal','Hair Metal','Pop Metal','Kawaii Metal']],
		['Sadcore'							,	['Dream Pop','Traditional Pop','Mainstream Pop','Vocal Pop','Britpop','Beat Music','Glam Rock']],
		['Nature Music'						,	['Ambient Industrial','Loungetronica','Easy Listening','Lounge XL','Ambient Dance']],
		['Tulsa Sound'						,	['Heavy Prog','Stoner Rock','Progressive Rock XL','Pagan Folk']],
		['Progressive Rock XL'				,	['Metal_supergenre','Grunge','Americana','Detroit Blues','Garage Rock Revival','Southern Rock','Heartland Rock']],
		['Heavy Prog'						,	['Fusion', 'Jazz-Rock','Symphonic Rock','Crossover Prog','Southern Rock','Heartland Rock','Soft Rock']],
		['Jazz-Rap'							,	['Gangsta','Hardcore Rap','Horrorcore']],
		['Tishoumaren'						,	['Modern Electric Blues','Contemporary Blues','Chicago Blues','Funk Blues','British Blues','80s Rock','Psychedelic Blues','Psychedelic Funk','Psychedelic Soul','Glam Rock','Classic Funk','Rap_supergenre','Contemporary Rock','Boogie Rock','Garage Rock Revival','Aussie Rock', '90s Rock','Progressive Rock XL','Folk Pop','Americana','Contemporary Folk','Pop Rock','Neo-Psychedelia','Southern Rock','Cantautor','Latin Folk XL','Neo-Traditional Folk','Close Harmony','Alt. Rock','Freak Folk','Country_supergenre','Country Folk','Electropop','Medieval','Roots Rock','Pagan Folk','Chanson','Hard Rock','Heartland Rock']],
		['Anatolian Rock'					,	['Modern Electric Blues','Contemporary Blues','Chicago Blues','Funk Blues','British Blues','80s Rock','Psychedelic Blues','Psychedelic Funk','Psychedelic Soul','Glam Rock','Classic Funk','Rap_supergenre','Contemporary Rock','Boogie Rock','Garage Rock Revival','Aussie Rock', '90s Rock','Progressive Rock XL','Folk Pop','Americana','Contemporary Folk','Pop Rock','Neo-Psychedelia','Southern Rock','Cantautor','Latin Folk XL','Neo-Traditional Folk','Close Harmony','Alt. Rock','Freak Folk','Country_supergenre','Country Folk','Electropop','Medieval','Roots Rock','Pagan Folk','Chanson','Heartland Rock']],
		['Sophisti-Pop'						,	['Classic Rock XL','Metal_supergenre','Post-Britpop','Europop','Dance Pop','Disco Pop']],
		['Cool Jazz'						,	['Hard-Bop']],
		['Americana'						,	['Traditional European Folk','Nordic Folk_supergenre','African Folk_supergenre']],
		['Electrorock'						,	['Neo-Traditional Folk','Classic Rock XL','Traditional Pop','Freak Folk','Garage Rock Revival','Garage Pop','Retro Rock']],
		['Classical Sufi'					,	['Folk Pop','Folk-Rock','Folktronica','Folk Punk','Contemporary Folk','Renaissance','South American Folk_supergenre','North American Folk_supergenre','European Folk_supergenre']],
		['Pre-Columbian Ritual-Tribal'		,	['Afro-Latin Ritual-Tribal']],
		['Rap_supergenre'					,	['Traditional Country','Americana XL','Roots Rock']],
		['Symphonic Rap'					,	['Hardcore Rap']],
		['Opera'							,	['Contemporary Popular Choral XL']],
		['Cloud Rap'						,	['Hardcore Rap','Gangsta','Horrorcore']],
		['Dream Pop'						,	['Emo Rap','Emo Pop','Emo Rock','Celtic Folk','Pagan Folk','Ska Punk','Rumba Flamenca']],
		['Emo Rap'							,	['Reggaeton','Nuevo Flamenco','Flamenco']],
		['Swing'							,	['Bebop','Hard-Bop','Modal Jazz','Cool Jazz']],
		['Dixieland'						,	['Bebop','Hard-Bop','Modal Jazz','Cool Jazz']],
		['Deconstructed Club'				,	['Chill-Out Downtempo','Melodic Techno-House','Big Room House','Ibiza House','Deep House']]
	],
	// These are genre/styles which should always apply the 'Anti-influences' filter in a listening session (see customizable button).
	// i.e. if  a 'Jazz' track is taken as reference, 'Jazz anti-influences' should always be filtered out, because they sound
	// really bad together on the same listening session, even if the search of similar tracks is broadened a lot.
	style_anti_influences_conditional: [
		'Classical Music_supercluster',
		'Electronic Music_supercluster',
		'Blues_supergenre',
		'Jazz_supergenre',
		'Rap_supergenre',
		'Progressive Rock XL',
		'Sadcore',
		'Emo Rap',
		'Nature Music',
		'Anatolian Rock',
		'Tishoumaren',
		'Pagan Folk'
	],
	/*
		-> Substitutions: for genres and styles considered to be almost equal or even strict substitutions.
		Users may want to edit these at the user's descriptor file, specially to add their own substitutions
		to avoid re-tagging their files.
	*/
	// Genres or styles that are pretty similar but not exactly the same. Combinations must be added as multiple entries.
	// {A->[B,C]} EQUAL TO {A->B, A->C} BUT NOT INCLUDED {B->C}
	style_weak_substitutions: [
		['Rock & Roll'						,	['Rockabilly'						]],
		['Psychedelic Rock'					,	['Psychedelic Folk','Acid Rock'		]],
		['Heartland Rock'					,	['Arena Rock'						]],
		['Hardcore Rap'						,	['Golden Age'						]],
		['Dream Pop'						,	['Shoegaze'							]],
		['Glam Metal'						,	['Hair Metal','Pop Metal'			]],
		['Hair Metal'						,	['Pop Metal'						]],
		['Garage Rock Revival'				,	['Post-Punk Revival','Garage Punk'	]],
		['Garage Punk'						,	['Post-Punk Revival'				]],
		['Jazz-Rock'						,	['Fusion'							]],
		['Free Jazz'						,	['Avant-Garde Jazz'					]],
		['Nu Jazz'							,	['Future Jazz'						]],
		['Grunge'							,	['Grunge Rock','Classic Grunge'		]],
		['Bluegrass'						,	['Progressive Bluegrass'			]],
		['Eurodisco'						,	['Europop'							]],
		['Gangsta'							,	['Horrorcore'						]],
		['Underground Rap'					,	['Alt. Rap'							]],
		['Melodic Hardcore'					,	['Hardcore Rap'						]],
		['Psychedelic Funk'					,	['P-Funk'							]],
		['Rumba Flamenca'					,	['Rumba Catalana','Rumba Fusión'	]],
		['Ska Punk'							,	['Skacore'							]],
		['Atmospheric Black Metal'			,	['Black Metal'						]],
		['Glam Metal'						,	['Hair Metal'						]],
		['British Folk-Jazz'				,	['Folk-Jazz'						]],
		['Hardtek'							,	['Freetekno'						]],
		['Darksynth'						,	['Darkwave'							]],
		['Deathcore'						,	['Metalcore'						]],
		['Neoperreo'						,	['Reggaeton'						]],
		['Flamenco'							,	['Rumba Flamenca'					]],
		['Dembow'							,	['Dancehall'						]],
		['Drill'							,	['Trap'								]],
		['Goa Trance'						,	['Psytrance'						]],
		['Hyperpop'							,	['Digicore', 'Glitchcore'			]]
	],
	// Some big groups or clusters are equal to genres or styles 'in the classic sense', so these are direct connections for them:
	// ALWAYS PUT FIRST the genre at the graph, then -at the right- the one(s) expected to be found on tags.
	// Example: we tag files as 'Golden Age Rock' and/or '60s Rock' instead of 'Classic Rock' (the value at the graph), then
	// We would add this line:
	// ['Classic Rock XL'				,	['Golden Age Rock','6os Rock'	]],
	// Alternatively we could change this line:
	// ['Classic Rock XL'				,	['Classic Rock'					]],
	// to
	// ['Classic Rock XL'				,	['Classic Rock','Golden Age Rock','6os Rock']],
	style_substitutions: [
		['Industrial_supergenre'			,	['Industrial'						]],
		['Metal_supergenre'					,	['Heavy Metal'						]],
		['Classic Rock XL'					,	['Classic Rock'						]],
		['Progressive Rock XL'				,	['Progressive Rock'					]],
		['Rock_cluster'						,	['Rock'								]],
		['Punk Rock_supergenre'				,	['Punk'								]],
		['Pop_supergenre'					,	['Pop'								]],
		['Country_supergenre'				,	['Country'							]],
		['Blues_supergenre'					,	['Blues'							]],
		['Jazz_supergenre'					,	['Jazz','Jazz Vocal'				]],
		['Rap_supergenre'					,	['Hip-Hop','Rap'					]],
		['Hardcore Rap'						,	['Hardcore'							]],
		['Electronic Music_supercluster'	,	['Electronic','Dance'				]],
		['Techno_supergenre'				,	['Techno'							]],
		['House_supergenre'					,	['House'							]],
		['Trance_supergenre'				,	['Trance'							]],
		['Folk Music_supercluster'			,	['Folk','Folk-Rock'					]],
		['Breakbeat_supergenre'				,	['Breakbeat'						]],
		['Classical Renaissance Era_supergenre',['Classical Renaissance'			]],
		['Classical Medieval Era_supergenre',	['Classical Medieval'				]],
		['Classical Baroque Era_supergenre',	['Baroque'							]],
		['Classical Classical Era_supergenre',	['Classical Period'					]],
		['Classical Romantic Era_supergenre',	['Romantic'							]],
		['Classical Modernist Era_supergenre',	['Modernist'						]],
		['Japanese Classical_supergenre'	,	['Japanese Classical'				]],
		['Indian Classical_supergenre'		,	['Indian Classical'					]],
		['Classical Music_supercluster'		,	['Classical'						]],
		['IDM'								,	['Intelligent Dance Music'			]],
		['Gospel_supergenre'				,	['Gospel'							]],
		['Traditional Gospel'				,	['Black Gospel'						]],
		['South Coast'						,	['South Rap'						]],
		['Gypsy-Jazz'						,	['Jazz Manouche','Manouche Jazz'	]],
		['Symphonic Rock'					,	['Symphonic Prog'					]],
		['Jazz-Rock'						,	['Jazz Rock'						]],
		['Jazz-Blues'						,	['Jazz Blues'						]],
		['Jazz-Funk'						,	['Jazz Funk'						]],
		['Jazz-Pop'							,	['Jazz Pop'							]],
		['Jazz-Rap'							,	['Jazz Rap','Jazz Hop','Jazz Hip-Hop']],
		['Post-Rock'						,	['Post Rock'						]],
		['Ska Punk'							,	['Ska-Punk'							]],
		['Skacore'							,	['Ska-Core'							]],
		['Cowpunk'							,	['Country Punk'						]],
		['Atmospheric Black Metal'			,	['Ambient Black Metal'				]],
		['Neo-Classical Metal'				,	['Neoclassical Metal'				]],
		['Geek Rock'						,	['Nerd Rock','Dork Rock'			]],
		['Neo-Psychedelia'					,	['Neo Psychedelia'					]],
		['Sadcore'							,	['Slowcore'							]],
		['Synth-Pop'						,	['Techno-Pop'						]],
		['Emo Pop'							,	['Emo-Pop'							]],
		['Folk-Jazz'						,	['Folk Jazz','Jazz Folk'			]],
		['Folk Punk'						,	['Folk-Punk'						]],
		['Folk Pop'							,	['Folk-Pop'							]],
		['Folk Metal'						,	['Folk-Metal'						]],
		['Folk Baroque'						,	['Folk-Baroque'						]],
		['Anatolian Rock'					,	['Anadolu Rock'						]],
		['Joik'								,	['Yoik','Luohti','Vuolle','Juoiggus']],
		['Baroque Pop'						,	['Chamber Pop'						]],
		['Pagan Folk'						,	['Dark Folk','Folk Noir'			]],
		['Hard-Bop'							,	['East Coast Jazz'					]],
		['Cool Jazz'						,	['West Coast Jazz'					]],
		['Electrorock'						,	['Electro Rock','Electro-Rock'		]],
		['Bit Music'						,	['Chiptune'							]],
		['Neo Trance'						,	['Nu Trance'						]],
		['Kuduro'							,	['Kurudu'							]],
		['Melodic Techno-House'				,	['Melodic Techno','Melodic House'	]],
		['Branle'							,	['Branle D\'Ossau','Branle De Noirmoutier']],
		['J-Pop'							,	['Japanese Pop'						]],
		['K-Pop'							,	['Korean Pop'						]],
		['Musical'							,	['Industrial Musical','Rock Musical','Music Hall','Revue','Vaudeville','Chèo']],
		['Trap'								,	['Latin Trap','Trap Latino'			]],
		['Kawaii Metal'						,	['Yurufuwa','Idol Metal','Cute Metal','Kawaiicore']],
		['Trancecore'						,	['Electronicore','Synthcore'		]],
		['Synthwave'						,	['Retrowave'						]],
		['Nu-Disco'							,	['Disco House'						]],
		['Deconstructed Club'				,	['Post-Club'						]],
		['Tishoumaren'						,	['Desert Blues','Assouf'			]],
		['Afrobeat'							,	['Afrofunk'							]],
		['Muiñeira'							,	['Muñeira'							]],
		['Jota'								,	['Xota'								]],
		['Hardtechno'						,	['Hard Techno'						]]
	],
	// Arbitrary classification of style clusters into folksonomy groups
	style_cluster_groups: [
		'Alt. Rock and Hardcore','Blues and Gospel','Classic and Orchestral','Electronic and Synth','Folk and Folk-Rock','Hip-Hop and Reggae','Jazz and Lounge','Metal and Hard Rock','Pop and Rock','Soul and Funk','Other styles'
	],
	getStyleGroup: (style_cluster) => {
		if (/(-| |^)(metal|stoner|doom)(-| |$)/i.test(style_cluster)) {
			return 'Metal and Hard Rock';
		} else if (/(-| |^)(folk|folk-rock|americana|country|afro)(-| |$)/i.test(style_cluster)) {
			return 'Folk and Folk-Rock';
		} else if (/(-| |^)(urban|rap|reggae|loungetronica|jamaican)(-| |$)/i.test(style_cluster)) {
			return 'Hip-Hop and Reggae';
		} else if (/(-| |^)(punk)(-| |$)/i.test(style_cluster)) {
			return 'Alt. Rock and Hardcore';
		} else if (/(-| |^)(electro|electronic|dance|house|rave|gabber|bass|wave|techno|trance|breakbeat|downtempo|hardcore)(-| |$)/i.test(style_cluster)) {
			return 'Electronic and Synth';
		} else if (/(-| |^)(gothic|progressive|grunge|gaze|industrial|alternative|emo)(-| |$)/i.test(style_cluster)) {
			return 'Alt. Rock and Hardcore';
		} else if (/(-| |^)(soul|funk|disco|r&b)(-| |$)/i.test(style_cluster)) {
			return 'Soul and Funk';
		} else if (/(-| |^)(choral|ballroom|orchestral|Chamber|secular|spiritual|classical)(-| |$)/i.test(style_cluster)) {
			return 'Classic and Orchestral';
		} else if (/(-| |^)(pop|rock|contemporary)(-| |$)/i.test(style_cluster)) {
			return 'Pop and Rock';
		} else if (/(-| |^)(jazz|lounge|easy)(-| |$)/i.test(style_cluster)) {
			return 'Jazz and Lounge';
		} else if (/(-| |^)(blues|gospel)(-| |$)/i.test(style_cluster)) {
			return 'Blues and Gospel';
		} else {
			return 'Other styles';
		}
	},
	/*
		-> Filtering: this is mostly a list of folksonomy tags which are explicitly filtered. Any value not present
		on 'style_supergenre' (at top) is skipped anyway for all purposes, so it's not a requisite but it makes
		the search faster. Users may want to edit these at the user's descriptor file, specially if they have a lot
		of values on style or genre tags used for classification but not directly related to a genre or style. For ex:
		'Film Score', 'Soundtrack', 'Anime Music', ...
	*/
	// For graph filtering
	map_distance_exclusions: new Set([
		'Female Vocal','Spanish Rock','Radio Program','Soundtrack','Piano Jazz',
		'Piano Blues','Instrumental Country','Instrumental Hip-Hop','Instrumental Rock',
		'Guitar Jazz','Flute Jazz','Jazz Drumming','Experimental','Argentinian Rock','Feminista',
		'Feminist','Latin','World','Instrumental','Live','Hi-Fi','Lo-Fi','Acoustic',
		'Alt. Metal','Electric Blues','Harmonica Blues',
		'Free Improvisation','Jam','Comedy','Children\'s Music','Christmas','Japanese',
		'African','Indian','Nubian','Greek','Spanish Hip-Hop','German Rock','Israeli',
		'Spoken Word','Israeli Rock','Uruguayan Rock','Mexican Rock','Italian Rock',
		'Asian Folk','Torch Songs','Dummy','Rock Opera','Tuareg Music','Tex-Mex',
		'Música Popular Brasileira','Jam Band','Spanish Jazz','Brazilian Rock','Turkish',
		'Film Score','Anime Music','Worldbeat','Spanish Folk'
	]),
	/*
		----------------------------------------------------------------------------------------------------
											Weighting, for Graph Creation
				These are the weight values for graph links between styles(S) and genres(G)
		----------------------------------------------------------------------------------------------------
	*/
	// List of keys for convenience if iterating
	distance_keys: [ 'secondary_origin', 'primary_origin', 'cluster', 'intra_supergenre', 'supergenre_cluster', 'supergenre_supercluster', 'inter_supergenre', 'inter_supergenre_supercluster'],
	substitution_keys: [ 'weak_substitutions', 'substitutions'],
	influences_keys: [ 'anti_influence', 'primary_origin_influence', 'secondary_origin_influence'],
	/*
		Direct: A -> B (weight applied x1)
		Direct connections should have bigger costs since they are not accumulative
	*/
	primary_origin: 185, //Primary origin / Derivative x1
	secondary_origin: 300, //Secondary origin / Derivative x1
	weak_substitutions: 20, //Almost equal x1
	/*
		Indirect: A ->( Clusters )-> B (weight applied x2 or more)
		Note the weight is accumulative, so bigger clusters' weights add to the previous path cost
		Ex: Style A -> Supergenre -> Supergenre Cluster -> Supergenre -> Style B
	*/
	cluster: 42, //Related style / genre: Southern Rock(S) -> Heartland Rock(S)
	intra_supergenre: 100, //Traverse between the same supergenre(SG): Southern Rock(G) -> Classic Rock(SG) -> Hard Rock(G)
	supergenre_cluster: 50, //Traverse between the same supergenre group(SG): Classic Rock(SG) -> Rock(SGG) -> Punk (SG)
	supergenre_supercluster: 75, //Traverse between the same music group(MG): Rap(SGG)->Rhythm Music(MG)->R&B(SGG)
	/*
		Special:
	*/
	inter_supergenre: 200, //Traverse between different contiguous supergenres groups(SGG): Rock(SGG) -> Pop(SGG)
	inter_supergenre_supercluster: 300, //Traverse between different contiguous supergenres groups(SGG): Rock(SGG) -> Pop(SGG)
	substitutions: 0, //Direct connections (substitutions)
	/*
		Influences:
	*/
	anti_influence: 100, //backlash / anti-influence between two nodes (added directly to the total path distance): A -> ? -> B
	primary_origin_influence: -10, //primary origin-influence between two nodes in same supergenre (added directly to the total path distance): A -> ? -> B
	secondary_origin_influence: -5, //secondary origin-influence between two nodes in same supergenre (added directly to the total path distance): A -> ? -> B
	/*
		Note on intra_supergenre:
		-------------------------
		Use that value as the 'basic' distance value for similar genre/styles: x3/2, x2, etc.
		Having in mind that the max distance between 2 points on the graph will probably be ~ x4-x5 that value.
		A lower value (cluster or 1/2) would only output the nearest or almost same genre/styles.
		-------------------------
		Note on anti_influence:
		-------------------------
		It applies to anything listed on style_anti_influence. Same logic than the rest.
		The value is added to the total distance calculated between 2 nodes. i.e. if Rock to Jazz had a distance of 300,
		if they had an anti-influence link, then the total distance would be 300 + 100 = 400. Being farther than before...
		-------------------------
		Note on primary_origin_influence (same applies to secondary_origin_influence):
		-------------------------
		It only applies to those nodes which have a primary origin link AND are in the same Supergenre (SG).
		Contrary to anti_influence which applies globally and only on nodes listed in its associated array.
		This is done to account for genres/styles which are nearer than others on the same Supergenre,
		while not using a style cluster or weak substitution approach.
		Also beware of setting too high (absolute) values, the value is directly applied to the final total path distance...
		the idea is that cluster related nodes (85) should be nearer than intra-Supergenre related nodes (100). When adding a
		primary_origin link, then it would be omitted (being greater than the other two) but the influence applies.
		The total distance would be 85 - 10 = 75 for cluster related nodes and 100 - 10 = 90 for intra-Supergenre related nodes.
		But also when considering intra-Supergenre related nodes with primary_origin links (90) against cluster related nodes
		without such link (85) the cluster related ones are still neared than the others.
	*/
	/*
		----------------------------------------------------------------------------------------------------
													For drawing
				These are the weight values for graph links between styles(S) and genres(G)
		----------------------------------------------------------------------------------------------------
	*/
	// Assigns colors to labels and nodes
	// Anything named '..._supergenre' will be added to the html color label legend automatically.
	// If more than one '...Folk..._supergenre' or '...Classical..._supergenre' is found, then it will be skipped.
	// i.e. It will list Folk and Classical only once, even if there are multiple (sub)SuperGenres.
	// As alternative, colorbrewer sequential palettes could be used
	map_colors: [
		// Supergenres
		['Industrial_supergenre'				,'#e04103'],
		['Metal_supergenre'						,'#D88417'],
		['Rock & Roll_supergenre'				,'#F3C605'],
		['Classic Rock_supergenre'				,'#F3C605'],
		['Punk Rock_supergenre'					,'#F3C605'],
		['Alternative_supergenre'				,'#F3C605'],
		['Hardcore Punk_supergenre'				,'#F3C605'],
		['Contemporary_supergenre'				,'#F3C605'],
		['Pop_supergenre'						,'#F9FF03'],
		['Modern Folk_supergenre'				,'#D4F900'],
		['European Pre-Modern Folk_supergenre'	,'#D4F900'],
		['South American Folk_supergenre'		,'#D4F900'],
		['North American Folk_supergenre'		,'#D4F900'],
		['Nordic Folk_supergenre'				,'#D4F900'],
		['Celtic Folk_supergenre'				,'#D4F900'],
		['African Folk_supergenre'				,'#D4F900'],
		['Asian Folk_supergenre'				,'#D4F900'],
		['European Folk_supergenre'				,'#D4F900'],
		['South European Folk_supergenre'		,'#D4F900'],
		['Country_supergenre'					,'#8FA800'],
		['R&B_supergenre'						,'#2E5541'],
		['Blues_supergenre'						,'#006da8'],
		['Gospel_supergenre'					,'#005da1'],
		['Jazz_supergenre'						,'#2640ab'],
		['Jamaican_supergenre'					,'#540AC8'],
		['Rap_supergenre'						,'#8000A1'],
		['Breakbeat_supergenre'					,'#950610'],
		['Drum & Bass_supergenre'				,'#950610'],
		['Hardcore_supergenre'					,'#950610'],
		['Techno_supergenre'					,'#950610'],
		['House_supergenre'						,'#950610'],
		['Trance_supergenre'					,'#950610'],
		['Downtempo_supergenre'					,'#c00000'],
		['Classical Medieval Era_supergenre'	,'#adadad'],
		['Classical Renaissance Era_supergenre'	,'#adadad'],
		['Classical Baroque Era_supergenre'		,'#adadad'],
		['Classical Classical Era_supergenre'	,'#adadad'],
		['Classical Romantic Era_supergenre'	,'#adadad'],
		['Classical Modernist Era_supergenre'	,'#adadad'],
		['Japanese Classical_supergenre'		,'#adadad'],
		['Indian Classical_supergenre'			,'#adadad'],
		// Supergenre Clusters
		['Industrial_cluster'					,'#e04103'], // From here to the bottom, will not be added to the color label legend,
		['Metal_cluster'						,'#D88417'], // because the names don't have '..._supergenre'
		['Rock_cluster'							,'#F3C605'],
		['Pop_cluster'							,'#F9FF03'],
		['Country_cluster'						,'#8FA800'],
		['Folk_cluster'							,'#D4F900'],
		['R&B_cluster'							,'#2E5541'],
		['Blue_Note_cluster'					,'#006da8'],
		['Jamaican_cluster'						,'#540AC8'],
		['Rap_cluster'							,'#8000A1'],
		['Breakbeat Dance_cluster'				,'#950610'],
		['Four-to-the-floor Dance_cluster'		,'#950610'],
		['Downtempo_cluster'					,'#c00000'],
		['Classical Music_cluster'				,'#adadad'],
		// Supergenre SuperClusters
		['Heavy Music_supercluster'				,'#D88417'],
		['Pop & Rock Music_supercluster'		,'#F9FF03'],
		['Rythm Music_supercluster'				,'#006da8'],
		['Electronic Music_supercluster'		,'#950610'],
		['Folk Music_supercluster'		 		,'#D4F900'],
		['Classical Music_supercluster'	 		,'#adadad'],
	],

	// Attributes for every node type
	nodeSize: 10,
	nodeShape: 'rect', //'circle','rect','star' or 'image'. 'Image' requires 'imageLink' data for every node on drawing function
	nodeImageLink: 'helpers-external/ngraph-html/images/Starv2.png',

	style_clusterSize: 20,
	style_clusterShape: 'star',
	style_clusterImageLink: 'helpers-external/ngraph-html/images/Star.png',

	style_supergenreSize: 15,
	style_supergenreShape: 'circle',
	style_supergenreImageLink: 'helpers-external/ngraph-html/images/Star.png',

	style_supergenre_clusterSize: 18,
	style_supergenre_clusterShape: 'circle',
	style_supergenre_clusterImageLink: 'helpers-external/ngraph-html/images/Star.png',

	style_supergenre_superclusterSize: 22,
	style_supergenre_superclusterShape: 'rect',
	style_supergenre_superclusterImageLink: 'helpers-external/ngraph-html/images/Star_color.png',

	// Other
	bPreRender: true, // (false) Renders graph on the fly on browsers or (true) pre-rendering (it may take some time while loading entire graph)

	/**
	'graph': Renders graph according to link centrality/gravity forces.
	'graphWeighted': uses the link's weight values at top to render similar distances
		to real ones, but also using link forces.
	'realDistance': uses the link's weight values at top to render real distances.
		Beware it will look really weird!
	*/
	renderMethod: 'realDistance'
};

(function () {	// Clean non ASCII values
	const asciiRegEx = [[/[\u0300-\u036f]/g, ''], [/\u0142/g, 'l']];
	const asciify = (node) => {
		let asciiNode = node.normalize('NFD');
		asciiRegEx.forEach((rgex) => {asciiNode = asciiNode.replace(rgex[0], rgex[1]);});
		return asciiNode;
	};
	['style_supergenre_supercluster', 'style_supergenre_cluster', 'style_supergenre', 'style_cluster', 'style_primary_origin', 'style_secondary_origin', 'style_weak_substitutions', 'style_substitutions'].forEach((key) => {
		music_graph_descriptors[key].forEach((pair) => {
			if (!pair || !Array.isArray(pair) || pair.length !== 2) {return;}
			const parent = pair[0];
			const asciiParent = asciify(parent);
			if (asciiParent !== parent) {pair[0] = asciiParent;}
			const nodeList = pair[1];
			nodeList.forEach((node, j) => {
				const asciiNode = asciify(node);
				if (asciiNode !== node) {nodeList[j] = asciiNode;}
			});
		});
	});

	music_graph_descriptors.map_distance_exclusions.forEach((node, i, set) => {
		const asciiNode = asciify(node);
		if (asciiNode !== node) {set.add(asciiNode);}
	});

	music_graph_descriptors.map_colors.forEach((pair) => {
		const node = pair[0];
		const asciiNode = asciify(node);
		if (asciiNode !== node) {pair[0] = asciiNode;}
	});
})();