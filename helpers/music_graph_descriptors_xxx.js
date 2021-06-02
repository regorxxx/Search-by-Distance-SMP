'use strict';

/*
	These are the variables of the music graph: nodes (styles and genres), links, link weighting (aka distance) and rendering settings.
	This file can be updated independently to the other files. i.e. the node/links coding (the actual graph creating) and the descriptors are separated.
	
	The music structure goes like this: Superclusters -> Clusters -> Supergenres -> Style clusters -> Styles (smallest nodes)
	Obviously, the left terms are groups of the right terms.
	
	That means every user can set its "own map" according to their tags. Note your files MUST be tagged according to the descriptors,
	but you can add substitutions at style_substitutions.... that's the thing most users will have to configure according to their tag usage.
	Note the graph functions don't care whether the tag is a genre a style or whatever tag name you use. "Rock is rock", wherever it is. 
	But that genre/style must be on music_graph_descriptors to be recognized.
	
	If you have new genres/styles not present on the graph then you probably need to add them to: 
		- style_supergenre: that places the genre on a main big genre... For ex. Britpop into Contemporary Rock.
		- style_cluster: that connects your new genre with related genres. For ex. R&B and Doo Wop are both in Vocal Pop style cluster.
		- Optional:
			- style_primary_origin: connects styles which are direct derivatives or origins. Farther than in the same style cluster.
			- style_secondary_origin: connects styles which are secondary derivatives or origins. Farther than previous one.
			- style_anti_influence: greatly distances two genres. It would be the opposite to bein in the same style cluster.
	
	Now, let's say you have a group of related styles not present on the graph. For ex. Grunge Rock, Classic Grunge, etc. They are all "grunge",
	so you should not put them into style_supergenre matrix, where grunge already exists. We would want to add even smaller nodes than that
	main genre. For that we use style_weak_substitutions, where we would put Grunge at the left, and connect it to Grunge Rock, Classic Grunge, etc.
	Other approach would be to use style_cluster. Use whatever you prefer according to the link "distance" you want to add. Values at bottom.
		
	"map_distance_exclusions" have those genre/style tags which are not related to an specific musical style. 
	i.e. Acoustic could be heavy metal, rock or whatever... so we skip it (for other calcs).
	They are filtered because they have no representation on the graph, not being a real genre/style but a musical characteristic.
	So they are useful for similarity scoring purposes but not for the graph. 
	This filtering stage is not needed, but it greatly speedups the calculations if you have tons of files with these tags!
	This means than any tag not included in the graph will be omitted for calcs, but you save time if you add it manually to the exclusions (otherwise the entire graph will be visited to try to find a match).

	Then we got: Primary origins, secondary origins, weak substitutions, (direct) substitutions and anti-influences.
	The first 3 are links between styles related "in some way". (Direct) substitutions are equivalent  nodes (A = B), with 0 distance.
	Finally, anti-influence accounts for styles which are considered too different, even being of the same group (style cluster or supergenres).
	
	The function "music_graph()" creates the graph, and the same for the HTML counterpart (it adds colors and all that to the main graph).
	Execute "Draw Graph.html" on your browser and it should load the graph set on this file. So whatever you edit here, it gets shown on the rendered version. 
	That's an easy way to see if you added nodes at a wrong place, things not linked, etc. Much easier than checking matrices and lists of strings!
	
	Finally, the function "do_searchby_distance()" does all the calculations for similarity between tracks.
*/
const music_graph_descriptors = {
		
		/*
			-------------------------
			Graph nodes and links
			-------------------------
		*/
		
		// Music clusters, Supergenres, Genres, Styles:
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
		['Classical Music_cluster'			,	['Classical Medieval Era_supergenre','Classical Renaissance Era_supergenre','Classical Baroque Era_supergenre','Classical Classical Era_supergenre','Classical Romantic Era_supergenre','Classical Modernist Era_supergenre','Japanese Classical_supergenre']]
		],
		
		// Mega-Groups of genres and styles
		// Here you put genres and styles into their main category. Like Progressive Rock and Hard Rock into Rock&Roll Supergenre.
		style_supergenre: [
		['Industrial_supergenre'			,	['Minimal Wave','Minimal Industrial','Futurepop','Electro-Industrial','Industrial Rock','Industrial Metal','Darkwave','Coldwave','Dark Ambient','Dark Industrial','Electronic Body Music','Noise Music','Gothic Rock','Death Rock','Avant-Garde Industrial','Krautrock']],
		['Metal_supergenre'					,	['Atmospheric Black Metal','Stoner Doom','Stoner Sludge','Metalcore','Nu Metal','Rap Metal','Grunge Metal','Symphonic Metal','Gothic Metal','Black Metal','Stoner Metal','Sludge Metal','Death Metal','Grindcore','Doom Metal','Crossover Thrash','Extreme Metal','Speed Metal','Thrash Metal','British Metal','Glam Metal','Hair Metal','Pop Metal','Power Metal','Progressive Metal','Classic Metal','Proto-Metal']],
		['Rock & Roll_supergenre'			,	['Rockabilly Revival','Garage Rock','Surf Rock','Rock & Roll','Rockabilly','Skiffle']],
		['Classic Rock_supergenre'			,	['Proto-Metal','Heartland Rock','Arena Rock','Southern Rock','Glam Rock','Proto-Prog','Progressive Rock','Proto-Prog','Crossover Prog','Symphonic Rock','Heavy Prog','Eclectic Prog','Krautrock','Math Rock','Neo-Prog','Italian Prog. Rock','Japanese Prog. Rock','Space Rock','Avant-Prog','Hard Rock','Acid Rock','Psychedelic Rock','Space Rock','Raga Rock','Psychedelic Pop','Funk Rock','British Psychedelia','Folk-Rock','Canterbury Scene','Beat Music','Tulsa Sound']],
		['Punk Rock_supergenre'				,	['Punk Pop','Grunge Punk','Riot Grrrl','Anarcho-Punk','Psychobilly','Synth-Pop','New Wave','No Wave','Post-Punk','Punk Rock','Pub Rock','Proto-Punk']],
		['Alternative_supergenre'			,	['Post-Rock','Post-Grunge','Britpop','Alt. Rock','Pop Punk','Math Rock','Rap Rock','Funk Metal','Grunge','Grunge Rock','Psychedelic Grunge','Grunge Punk','Classic Grunge','Dream Pop','Shoegaze','Noise Rock','Proto-Stoner Rock']],
		['Hardcore Punk_supergenre'			,	['Metalcore','Post-Hardcore','Math Rock','Grindcore','Crossover Thrash','Hardcore Punk','Anarcho-Punk','Stoner Rock','Stoner Sludge','Proto-Stoner Rock']],
		['Contemporary_supergenre'			,	['Indie','Freak Folk','Neo-Prog','Dance-Punk','Chillwave','Garage Punk','Garage Rock Revival','Post-Punk Revival','Emo Rock','Post-Britpop','Neo-Psychedelia','Contemporary Rock','90s Rock','Garage Pop','Retro Rock']],
		['Pop_supergenre'					,	['Electropop','Indie','Freak Folk','Chillwave','Electroclash','Post-Britpop','Britpop','Dance Pop','Dream Pop','Shoegaze','Disco Pop','Eurodisco','Europop','Synth-Pop','80s Rock','Soft Rock','Power Pop','Chanson','Sunshine Pop','Psychedelic Pop','Pop Rock','Baroque Pop','Songwriter','Country Pop','Brill Building Sound','Skiffle','Close Harmony']],
		['Modern Folk_supergenre'			,	['Folk-Rock','Folk Pop','Folk Baroque','Folk Metal','Psychedelic Folk','Contemporary Folk','Folktronica','Progressive Folk','Folk Punk','Hang Music']],
		['European Pre-Modern Folk_supergenre',	['Medieval','Renaissance']],
		['South American Folk_supergenre'	,	['Afro-Cuban','Son','Argentinian Folk','Venezuelan Folk','Batucada','Candombe','Cumbia','Chilean Folk','Colombian Folk','Cantautor','Forró','Jota','Mexican Folk','Peruvian Folk','Andean']],
		['North American Folk_supergenre'	,	['Folk-Rock','Freak Folk','Traditional Folk','Americana','American Primitive Guitar','Country Folk','Neo-Traditional Folk','Songwriter','Traditional American Folk','Old-Timey','Appalachian']],
		['Nordic Folk_supergenre'			,	['Polka','Traditional European Folk','Pagan Folk','German Folk']],
		['Celtic Folk_supergenre'			,	['Circle','Jig','Scottish','Celtic','Traditional European Folk','Bal Folk','Irish','Scottish Folk','Celtic New Age']],
		['African Folk_supergenre'			,	['Desert Blues','Malian Folk','Griot','Isicathamiya','Mauritanian Folk','Niger Folk','Nubian Folk','Sahrawi Folk','Tishoumaren','Gnawa']],
		['Asian Folk_supergenre'			,	['Tuvan','Hindustani','Israeli Folk','Afghan Folk']],
		['European Folk_supergenre'			,	['British Folk-Rock','British Folk-Jazz','Folk Baroque','Andro','Bourree','Bresse','Chapelloise','Circle','Farelquesh','Gavotte','Hanterdro','Kost ar c`hoad','Laridé','Mazurka','Jig','Plinn','Polka','Rond','Scottish','Tarantella','Tricot','Vals','Traditional European Folk','Bal Folk','German Folk','Irish','Scottish Folk','Romani']],
		['South European Folk_supergenre'	,	['Cantautor','Rumba','Flamenco','Jota','Spanish Folk','Traditional European Folk','Éntekhno']],
		['Country_supergenre'				,	['Alt. Country','Americana','Neo-Traditional Country','Contemporary Country','Outlaw Country','Country Pop','Country Rock','Nashville Sound','Bakersfield Sound','Progressive Bluegrass','Bluegrass','Honky Tonk','Old-Timey','Hillbilly','Country Boogie']],
		['R&B_supergenre'					,	['Funktronica','Urban Soul','Neo Soul','Electrofunk','Deep Funk','Disco','Soul Blues','Smooth Soul','Disco','Classic Funk','P-Funk','Funk Rock','Contemporary Funk','Psychedelic Funk','Psychedelic Soul','New Orleans R&B','Funk Blues','Deep Funk Revival','Philadelphia Soul','Motown Sound','Southern Soul','Doo Wop','R&B']],
		['Blues_supergenre'					,	['Contemporary Blues','Hill Country Blues','Soul Blues','Modern Electric Blues','Psychedelic Blues','Blues Rock','Funk Blues','British Blues','Zydeco','Chicago Blues','Detroit Blues','Memphis Blues','Jump Blues','Texas Blues','Piano Blues','Vaudeville Blues','Country Blues','Delta Blues']],
		['Gospel_supergenre'				,	['Contemporary Christian Music','Christian Rock','Modern Gospel','Ragtime','Stride','Traditional Gospel','Spirituals','Worksongs']],
		['Jazz_supergenre'					,	['Third Stream','Contemporary Jazz','Electro Swing','Nordic Jazz','Nu Jazz','Future Jazz','Acid Jazz','Smooth Jazz','Jazz-Rock','Fusion','Post-Bop','Free Jazz','Avant-Garde Jazz','Soul-Jazz','Jazz-Funk','Hard-Bop','Cool Jazz','Bebop','New Orleans Jazz Revival','Dixieland Revival','Modal Jazz','Latin-Jazz','Bossa Nova','Swing','Mainstream Jazz','Gypsy-Jazz','Big Band','Chicago Jazz','New Orleans Jazz','Dixieland']],
		['Jamaican_supergenre'				,	['Reggaeton','Ragga Hip-Hop','Ska Revival','Reggae Fusion','Ragga','Dancehall','Ska revival','UK Reggae','Dub','Roots Reggae','Rocksteady','Ska','Mento']],
		['Rap_supergenre'					,	['Glitch Hop','Urban Breaks','Trap','Hip-Hop Soul','Pop Rap','Conscious','British Hip-Hop','South Coast','Midwest','East Coast','Gangsta','Horrorcore','Reggaeton','Progressive Rap','Ragga Hip-Hop','Jazz-Rap','West Coast','Miami Bass','Bounce','Golden Age','Hardcore Rap','Melodic Hardcore','Electro','Old-School','Alt. Rap','Underground Rap','Psychedelic Rap']],
		['Breakbeat_supergenre'				,	['EDM Trap','Future Bass','Bassline','Glitch Hop','Breakbeat Garage','Broken Beats','Nu Skool Breaks','UK Garage','Chemical Breaks','Big Beat','Trip Hop','Florida Breaks','Breakdance','Electro']],
		['Drum & Bass_supergenre'			,	['Future Bass','Post-Dubstep','Dubstep','Bassline','Breakbeat Garage','Liquid Funk','Neuro Funk','Intelligent Drum & Bass','Ambient Drum & Bass','Jazzstep','Jump up','Hardstep','Techstep','Darkcore','Darkstep','Old School Jungle']],
		['Hardcore_supergenre'				,	['New Beat','Hardcore Techno','Hardcore Rave','Breakbeat Hardcore','Darkcore','Darkstep','Happy Hardcore','Bouncy Techno','Trancecore','Acidcore','Gabber','Speedcore','Frenchcore','Terrorcore','Nu Style Gabber','Mainstream Hardcore','Hardstyle']],
		['Techno_supergenre'				,	['Ghetto House','Ghettotech','Juke','Hardtechno','Tech Trance','Tech House','Industrial Techno','Minimal Techno','Ambient Techno','IDM','Hardtek','(Free)Tekno','Hardcore Techno','Hardcore Rave','New Beat','Detroit Techno']],
		['House_supergenre'					,	['Fidget House','Electro House','Moombahton','Microhouse','Minimal House','Ghetto House','French House','Funky House','Tech House','NRG','Hard NRG','Hard House','Progressive House','Deep House','Ibiza House','Ibiza Trance','Dream House','Dream Trance','Hip House','Eurodance','Acid House','Chicago House','Garage House']],
		['Trance_supergenre'				,	['Neo Trance','Epic Trance','Hardtrance','NRG','Hard NRG','Hard House','Eurotrance','Vocal Trance','Progressive Trance','Goa Trance','Psytrance','Ibiza House','Ibiza Trance','Dream House','Dream Trance','Classic Trance','Acid Trance']],
		['Downtempo_supergenre'				,	['Synthwave','Vaporwave','Minimal Wave','Nu Jazz','Minimal Industrial','Digital Minimalism','Glitch','Ambient Breaks','Illbient','Chill-Out Downtempo','Ambient House','New Age','Neo-Classical New Age','Hang Music','Healing Music','New Age','New Acoustic','Dark Ambient','Dark Industrial','Bit Music','Synth','Muzak','Minimalism','Lounge','Exotica','Musique Concrete']],//'Ambient'
		['Classical Medieval Era_supergenre',	['Ballata','Estampie','Gregorian','Chant','Madrigal','Motet','Organum','Saltarero']],
		['Classical Renaissance Era_supergenre',['Choral','Ballade','Canzona','Carol','Fantasia','Galliard','Intermedio','Lauda','Litany','Madrigal','Madrigal','comedy','Madrigale','spirituale','Mass','Motet','Motet-chanson','Opera','Pavane','Ricercar','Sequence','Tiento','Toccata']],
		['Classical Baroque Era_supergenre',	['Allemande','Canon','Cantata','Chaconne','Concerto','Courante','Fugue','Classical Gavotte','Gigue','Mass','Minuet','Opera','Opera','Oratorio','Partita','Passacaglia','Passepied','Prelude','Sarabande','Sinfonia','Sonata','Suite','Sonatina']],
		['Classical Classical Era_supergenre',	['Bagatelle','Ballade','Ballet','Caprice','Carol','Concerto','Dance','Divertimento','Étude','Fantasy','Impromptu','Intermezzo','Lied','Mass','Classical Mazurka','March','Music','hall','Nocturne','Octet','Opera','Oratorio','Polonaise','Prelude','Quartet','Quintet','Requiem','Rhapsody','Rondo','Scherzo','Serenade','Sinfonia','concertante','Sonata','Symphony','Suite','Waltz']],
		['Classical Romantic Era_supergenre',	['Bagatelle','Ballade','Ballet','Caprice','Carol','Concerto','Dance','Divertimento','Étude','Fantasy','Impromptu','Intermezzo','Lied','Mass','Classical Mazurka','March','Music','hall','Nocturne','Octet','Opera','Oratorio','Polonaise','Prelude','Quartet','Quintet','Requiem','Rhapsody','Rondo','Scherzo','Serenade','Sinfonia','concertante','Sonata','Symphony','Suite','Waltz']],
		['Classical Modernist Era_supergenre',	['Avant-Garde Classical','Contemporary Classical','Neo-Classical','Third Stream']],
		['Japanese Classical_supergenre',		['Kabuki']]
		],
		
		// Small groups of related genres and styles
		// For ex. instead of adding sub-styles to other places,we can add them here:
		style_cluster: [
		['Synth & Wave XL'					,	['Minimal Wave','Minimal Industrial','Darkwave','Coldwave','Electroclash','Synth-Pop','Futurepop','Synthwave','Vaporwave','Synth']],
		['Lounge XL'						,	['Lounge','Exotica','Latin-Jazz','Bossa Nova']],
		['Easy Listening'					,	['Lounge','Muzak','Bossa Nova']],
		['Progressive Rock XL'				,	['Proto-Prog','Crossover Prog','Symphonic Rock','Heavy Prog','Eclectic Prog','Krautrock','Math Rock','Neo-Prog','Italian Prog. Rock','Japanese Prog. Rock','Space Rock','Avant-Prog','Canterbury Scene']],
		['Classic Rock XL'					,	['Proto-Prog','Arena Rock','Southern Rock','Hard Rock','90s Rock','Blues Rock','Acid Rock','Folk-Rock','Beat Music','Raga Rock']],
		['Psy XL & Gaze'					,	['Dream Pop','Shoegaze','Dance-Punk','Acid Rock','Space Rock','Psychedelic Rock','Psychedelic Folk','Psychedelic Rap','British Psychedelia','Psychedelic Pop','Neo-Psychedelia','Psychedelic Grunge','Psychedelic Blues','Psychedelic Funk','Psychedelic Soul','Raga Rock']],
		['Punk XL'							,	['Proto-Punk','Punk Rock','Anarcho-Punk','Psychobilly','Pop Punk','Grunge Punk','Riot Grrrl']],
		['Grunge XL'						,	['Grunge','Grunge Rock','Classic Grunge','Grunge Rock','Grunge Metal','Grunge Punk','Psychedelic Grunge']],
		['Stoner XL'						,	['Stoner Rock','Stoner Doom','Stoner Sludge','Proto-Stoner Rock']],
		['Doom XL'							,	['Doom Metal','Stoner Doom','Atmospheric Black Metal']],
		['British Folk-Rock XL'				,	['British Folk-Rock','British Folk-Jazz','Folk Baroque']],
		['Roots Rock'						,	['Country Pop','Country Rock','Heartland Rock','Southern Rock','Pub Rock','Folk-Rock']],
		['Mainstream Pop'					,	['Urban Soul','Electropop','Dance Pop','Disco Pop']],
		['Traditional Pop'					,	['Vaudeville Blues','Doo Wop','Vocal Pop']],
		['Vocal Pop'						,	['R&B','Doo Wop','Rockabilly','Brill Building Sound','Close Harmony']],
		['Disco XL'							,	['Funktronica','Electrofunk','Disco','Eurodisco','Disco Pop']],
		['Soft Pop XL'						,	['Sunshine Pop','Soft Rock','Folk Pop','Chanson']],
		['Urban'							,	['Urban Soul','Urban Breaks']],
		['Alt. Rap XL'						,	['British Hip-Hop','Progressive Rap','Jazz-Rap','Alt. Rap','Underground Rap','Psychedelic Rap']],
		['Downtempo Rap XL'					,	['Jazz-Rap','Trip Hop']],
		['Funk'								,	['Classic Funk','P-Funk','Deep Funk','Electrofunk','Funk Rock','Contemporary Funk','Funk Blues','Deep Funk Revival','Psychedelic Funk']],
		['Soul'								,	['Philadelphia Soul','Motown Sound','Southern Soul','Psychedelic Soul']],
		['Deep Soul XL'						,	['Smooth Soul','Soul Blues','Southern Soul']],
		['Contemporary Soul'				,	['Hip-Hop Soul','Neo Soul','Trip Hop']],
		['Modern Blues XL'					,	['Contemporary Blues','Soul Blues','Modern Electric Blues','Blues Rock','Funk Blues','British Blues','Texas Blues','Psychedelic Blues']],
		['Classic Blues XL'					,	['Detroit Blues','Memphis Blues','Texas Blues','Chicago Blues']],
		['Traditional Blues XL'				,	['Vaudeville Blues','Country Blues','Delta Blues']],
		['Traditional Country'				,	['Neo-Traditional Country','Nashville Sound','Bakersfield Sound','Bluegrass','Honky Tonk','Hillbilly','Country Boogie']],
		['Post-Jazz'						,	['Electro Swing','Nordic Jazz','Nu Jazz','Future Jazz','Acid Jazz','Smooth Jazz','Jazz-Rock','Fusion']],
		['Modern Jazz'						,	['Post-Bop','Free Jazz','Avant-Garde Jazz','Soul-Jazz','Jazz-Funk','Hard-Bop','Cool Jazz','Bebop']],
		['Classic Jazz'						,	['Gypsy-Jazz','New Orleans Jazz','Dixieland','Chicago Jazz','Mainstream Jazz','Swing','Big Band','New Orleans Jazz Revival','Dixieland Revival']],
		['Mainstream Jazz XL'				,	['Contemporary Jazz','Mainstream Jazz','Swing','Soul-Jazz']],
		['Reggae'							,	['Reggae Fusion','Ragga','UK Reggae','Dub','Roots Reggae','Rocksteady']],
		['Electro XL'						,	['Florida Breaks','Breakdance','Electro','Miami Bass','Bounce']],
		['UK Bass'							,	['UK Garage','Breakbeat Garage','Bassline','Future Bass','Dubstep','Post-Dubstep']],
		['Loungetronica'					,	['Trip Hop','Nu Jazz','Future Jazz','Future Bass','Broken Beats','Ambient House','Chill-Out Downtempo']],
		['Gabber XL'						,	['Gabber','Speedcore','Frenchcore','Terrorcore','Nu Style Gabber','Mainstream Hardcore']],
		['Rave XL'							,	['Acid House','New Beat','Hardcore Techno','Hardcore Rave','Breakbeat Hardcore','Darkcore','Darkstep','Happy Hardcore','Bouncy Techno','Trancecore','Acidcore']],
		['Electro House XL'					,	['Fidget House','Electro House','Moombahton']],
		['Hard Dance'						,	['Hardtrance','NRG','Hard NRG','Hard House','Hardtechno','Hardstyle']],
		['Ambient Dance'					,	['Ambient House','Ambient Breaks','Illbient','Ambient Techno','IDM','Chill-Out Downtempo']],
		['Progressive Electronic'			,	['Krautrock','New Age','Synth']],
		['New Age XL'						,	['Neo-Classical New Age','Healing Music','New Age','New Acoustic']],
		['New Age Folk XL'					,	['Hang Music','Celtic New Age','New Acoustic']],
		['Afro-Cuban XL'					,	['Son']],
		['Latin Folk XL'					,	['Afro-Cuban','Son','Argentinian Folk','Venezuelan Folk','Batucada','Candombe','Cumbia','Chilean Folk','Colombian Folk','Cantautor','Flamenco','Forró','Jota','Mexican Folk','Peruvian Folk','Spanish Folk','Traditional Folk','Rumba']],
		['Americana XL'						,	['Americana','American Primitive Guitar','Country Folk','Neo-Traditional Folk','Songwriter','Traditional American Folk']],
		['Traditional American Folk XL'		,	['American Primitive Guitar','Neo-Traditional Folk','Traditional American Folk','Appalachian']],
		['Asian Folk XL'					,	['Tuvan','Hindustani','Israeli Folk','Afghan Folk']],
		['African Folk XL'					,	['Desert Blues','Malian Folk','Griot','Isicathamiya','Mauritanian Folk','Niger Folk','Nubian Folk','Sahrawi Folk','Tishoumaren','Gnawa']],
		['Bal Folk XL'						,	['Andro','Bourree','Bresse','Chapelloise','Circle','Farelquesh','Gavotte','Hanterdro','Jig','Kost ar c`hoad','Laridé','Mazurka','Jig','Plinn','Polka','Rond','Scottish','Tarantella','Tricot','Vals']],
		['European Folk XL'					,	['Celtic','Traditional European Folk','Bal Folk','Éntekhno','Folk Metal','Pagan Folk','German Folk','Irish','Jig','Scottish Folk','Romani']],
		['Celtic Folk XL'					,	['Celtic','Folk Metal','Pagan Folk']],
		['European Pre-Modern Folk XL'		,	['Medieval','Renaissance']],
		['Modern Folk XL'					,	['Contemporary Folk','Folk Pop','Folk-Rock']]
		],
		
		// Weighted connections between related styles or genres. Origins or derivatives.
		// TODO: add more
		style_primary_origin: [
		['Rock & Roll'						,	['Rockabilly','Surf Rock','Garage Rock','Beat Music','R&B','Skiffle','Hillbilly','Country Boogie','Brill Building Sound','Psychobilly']],
		['New Orleans R&B'					,	['Rock & Roll','Ska']],
		['Folk_cluster'						,	['Folk-Rock','Rock & Roll','Skiffle']],
		['British Folk-Rock'				,	['Folk-Rock','Folk Baroque','Progressive Folk']],
		['Progressive Folk'					,	['Folk-Rock','Progressive Rock']],
		['Progressive Rock XL'				,	['Space Rock']],
		['Freak Folk'						,	['Folk-Rock','British Folk-Rock']],
		['Garage Rock'						,	['Rock & Roll','Surf Rock','Space Rock','Psychedelic Rock','Acid Rock','Pub Rock','Proto-Punk','Garage Rock Revival','Post-Punk Revival','Garage Punk','Garage Pop']],
		['Beat Music'						,	['Rock & Roll','Folk-Rock','Psychedelic Rock','Acid Rock','Pop Rock','Power Pop','Hard Rock','R&B','Raga Rock']],
		['Psychedelic Rock'					,	['Space Rock','Progressive Rock','Psychedelic Folk','Acid Rock','Glam Rock','Garage Rock','Hard Rock','P-Funk','Classic Funk','Blues Rock','British Blues','Fusion','Neo-Psychedelia','Raga Rock']],
		['Psychedelic Rock'					,	['Psychedelic Blues','Psychedelic Funk','Psychedelic Soul']],
		['Hard Rock'						,	['Beat Music','Psychedelic Rock','Acid Rock','Glam Rock','Punk Rock','Blues Rock','British Blues']],
		['Glam Rock'						,	['Progressive Rock','Psychedelic Rock','Punk Rock','Pub Rock','Proto-Punk','New Wave','Glam Metal']],
		['Southern Rock'					,	['Country Rock','Blues Rock']],
		['Heartland Rock'					,	['Folk-Rock','Soft Rock','Country Rock','Country Pop']],
		['Arena Rock'						,	['Progressive Rock']],
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
		['Outlaw Country'					,	['Bakersfield Sound','Alt. Country']],
		['R&B'								,	['Jump Blues','Doo Wop','Southern Soul','Motown Sound','Beat Music','Rock & Roll','Modern Gospel','Soul-Jazz','Ska']],
		['Doo Wop'							,	['R&B','Philadelphia Soul']],
		['Southern Soul'					,	['R&B','Traditional Gospel','Classic Funk','Soul Blues','Modern Gospel','Ska']],
		['Motown Sound'						,	['R&B','Philadelphia Soul','Modern Gospel','Philadelphia Soul','Neo Soul','Rocksteady']],
		['Philadelphia Soul'				,	['Doo Wop','Motown Sound','UK Reggae']],
		['Classic Funk'						,	['P-Funk','Deep Funk','Electrofunk']],
		['P-Funk'							,	['Classic Funk','Deep Funk','Electrofunk','Psychedelic Rock','Old-School']],
		['Bossa Nova'						,	['Latin-Jazz','Swing','Lounge']],
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
		['Classic Rock XL'					,	['Retro Rock']],
		['Ska'								,	['Ska Revival']],
		['Deep Funk Revival'				,	['Deep Funk','Classic Funk']],
		['Tulsa Sound'						,	['Classic Rock XL','Classic Blues XL','Rock & Roll','Country Blues','Rockabilly','Country Rock','Folk-Rock']],
		['Appalachian'						,	['Old-Timey','Bluegrass','Traditional American Folk XL','Traditional Country']]
		],
		
		// TODO: add
		style_secondary_origin: [
		['Trip Hop'							,	['Acid Jazz','Roots Reggae','Chemical Breaks']],
		['Future Bass'						,	['Chillwave','Trap','Ghetto House'	]]
		],
		
		// TODO: add
		style_anti_influence: [
		['Classical Music_supercluster'		,	['Heavy Music_supercluster','Pop & Rock Music_supercluster','Rythm Music_supercluster','Electronic Music_supercluster','Breakbeat Dance_cluster','Four-to-the-floor Dance_cluster']],
		['Classical'						,	['Industrial_supergenre','Metal_supergenre','Classic Rock XL','Rock_cluster','Punk Rock_supergenre','Pop_supergenre','Country_supergenre','Blues_supergenre','Jazz_supergenre','Rap_cluster','Hardcore Punk_supergenre','Electronic Music_supercluster','Techno_supergenre','House_supergenre','Trance_supergenre','Folk-Rock','Alt. Rock']],
		['British Folk-Rock'				,	['Americana','Country_supergenre','Country_supergenre','Country Rock','Country Folk','Heartland Rock','Sunshine Pop','Beat Music','Roots Rock']],
		['British Folk-Jazz'				,	['Americana','Country_supergenre','Country_supergenre','Country Rock','Country Folk','Heartland Rock','Sunshine Pop','Beat Music','Roots Rock']],
		['Folk Baroque'						,	['Americana','Country_supergenre','Country_supergenre','Country Rock','Country Folk','Heartland Rock','Sunshine Pop','Beat Music','Roots Rock']],
		['Grunge'							,	['Indie','Britpop','Funk Metal','Beat Music','Roots Rock','Glam Rock','Pop Metal','Glam Metal','Hair Metal']],
		['Post-Britpop'						,	['Garage Rock Revival','Post-Punk Revival','Garage Punk']],
		['Garage Rock Revival'					,	['Dream Pop','Shoegaze']],
		['Freak Folk'						,	['Electropop','Psychedelic Rock','Acid Rock']],
		['Chill-Out Downtempo'				,	['Progressive Trance','New Age','New Age XL','Neo-Classical New Age','Healing Music','New Acoustic']],
		['Future Jazz'						,	['Industrial_supergenre','Metal_supergenre','Classic Rock XL','Rock_cluster','Punk Rock_supergenre','Pop_supergenre','Country_supergenre','Blues_supergenre']],
		['Jazz_supergenre'						,	['Industrial_supergenre','Metal_supergenre','Classic Rock XL','Rock_cluster','Punk Rock_supergenre','Pop_supergenre','Country_supergenre','Blues_supergenre']],
		['Traditional Pop'					,	['Electropop','Electronic Music_supercluster','Electro','Psychedelic Rock','Psychedelic Folk','Progressive Rock']],
		['Electronic Music_supercluster'	,	['Metal_supergenre','Classic Rock XL','Punk Rock_supergenre','Country_supergenre','Blues_supergenre','Jazz_supergenre']],
		['Stoner Rock'						,	['Pop Rock','Pop_supergenre']]
		],
		
		// Genres or styles that are pretty similar but not exactly the same. Combinations must be added as multiple entries.
		// {A->[B,C]} EQUAL TO {A->B, A->C} BUT NOT INCLUDED {B->C}
		// For ex. instead of adding sub-styles to other places, we can add them here:
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
		['Melodic Hardcore'					,	['Hardcore Rap'						]]
		],
		
		// Some big groups or clusters are equal to genres or styles "in the classic sense", so these are direct connections for them:
		// ALWAYS PUT FIRST the genre at the graph, then -at the right- the one(s) expected to be found on tags.
		// Example: we tag files as 'Golden Age Rock' and/or '60s Rock' instead of 'Classic Rock' (the value at the graph), then
		// We would add this line:
		// ['Classic Rock XL'				,	['Golden Age Rock','6os Rock'	]],
		// Alternatively we could change this line:
		// ['Classic Rock XL'				,	['Classic Rock'					]],
		// to
		// ['Classic Rock XL'				,	['Classic Rock','Golden Age Rock','6os Rock']],
		//TODO: SOUL? Gospel?
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
		['Rap_cluster'						,	['Hip-Hop'							]],
		['Hardcore Rap'						,	['Hardcore'							]],
		['Electronic Music_supercluster'	,	['Electronic'						]],
		['Techno_supergenre'				,	['Techno'							]],
		['House_supergenre'					,	['House'							]],
		['Trance_supergenre'				,	['Trance'							]],
		['Folk Music_supercluster'			,	['Folk','Folk-Rock'					]],
		['Classical Renaissance Era_supergenre',['Classical Renaissance'			]],
		['Classical Medieval Era_supergenre',	['Classical Medieval'				]],
		['Classical Baroque Era_supergenre',	['Baroque'							]],
		['Classical Classical Era_supergenre',	['Classical Period'					]],
		['Classical Romantic Era_supergenre',	['Romantic'							]],
		['Classical Modernist Era_supergenre',	['Modernist'						]],
		['Japanese Classical_supergenre'	,	['Japanese Classical'				]],
		['Classical Music_supercluster'		,	['Classical'						]],
		['IDM'								,	['Intelligent Dance Music'			]],
		['Gospel_supergenre'				,	['Gospel'							]],
		['Traditional Gospel'				,	['Black Gospel'						]],
		['South Coast'						,	['South Rap'						]],
		['Gypsy-Jazz'						,	['Jazz Manouche','Manouche Jazz'	]],
		['Symphonic Rock'					,	['Symphonic Prog'					]],
		['Jazz-Rock'						,	['Jazz Rock'						]],
		['Post-Rock'						,	['Post Rock'						]]
		],
		
		// For graph filtering
		// TODO: add cultural links (?)
		map_distance_exclusions: new Set([
		'Female Vocal','Spanish Rock','Radio Program','Soundtrack','Piano Jazz',
		'Piano Blues','Instrumental Country','Instrumental Hip-Hop','Instrumental Rock',
		'Guitar Jazz','Jazz Drumming','Experimental','Argentinian Rock','Feminista',
		'Latin','World','Instrumental','Live','Hi-Fi','Lo-Fi','Acoustic','Afrobeat',
		'Afro-Cuban','Afro-Rock','Alt. Metal','Electric Blues','Harmonica Blues',
		'Free Improvisation','Jam','Comedy','Children\'s Music','Christmas','Japanese', 
		'African','Indian','Nubian','Greek','Spanish Hip-Hop','German Rock','Israeli',
		'Spoken Word','Israeli Rock','Uruguayan Rock','Mexican Rock','Italian Rock',
		'Asian Folk','Torch Songs','Dummy'
		]),
		/*
			-------------------------
			Weighting, for Foobar2000
			-------------------------
		*/
		
		// These are the weight values for graph links between styles(S) and genres(G):
		// Direct: A -> B (weight applied x1)
		// Direct connections should have bigger costs since they are not accumulative
		primary_origin: 185, //Primary origin / Derivative x1
		secondary_origin: 300, //Secondary origin / Derivative x1
		// const derivatives = 300; //Various influences / Derivatives x1
		weak_substitutions: 20, //Almost equal x1
		
		// Indirect: A ->( Clusters )-> B (weight applied x2 or more)
		// Note the weight is accumulative, so bigger clusters' weights add to the previous path cost
		// Ej: Style A -> Supergenre -> Supergenre Cluster -> Supergenre -> Style B
		cluster: 85, //Related style / genre: Southern Rock(S) -> Heartland Rock(S)
		intra_supergenre: 100, //Traverse between the same supergenre(SG): Southern Rock(G) -> Classic Rock(SG) -> Hard Rock(G)
		supergenre_cluster: 50, //Traverse between the same supergenre group(SG): Classic Rock(SG) -> Rock(SGG) -> Punk (SG)
		supergenre_supercluster: 75, //Traverse between the same music group(MG): Rap(SGG)->Rhythm Music(MG)->R&B(SGG)
		
		// Special:
		inter_supergenre: 200, //Traverse between different contiguous supergenres groups(SGG): Rock(SGG) -> Pop(SGG)
		inter_supergenre_supercluster: 300, //Traverse between different contiguous supergenres groups(SGG): Rock(SGG) -> Pop(SGG)
		substitutions: 0, //Direct connections (substitutions)
		
		// Influences:
		anti_influence: 100, //backlash / anti-influence between two nodes (added directly to the total path distance): A -> ? -> B
		primary_origin_influence: -10, //primary origin-influence between two nodes (added directly to the total path distance): A -> ? -> B
		secondary_origin_influence: -5, //secondary origin-influence between two nodes (added directly to the total path distance): A -> ? -> B
		
		/*	Note on intra_supergenre:
			Use that value as the 'basic' distance value for similar genre/styles: x3/2, x2, etc.
			Having in mind that the max distance between 2 points on the graph will probably be ~ x4-x5 that value.
			A lower value (cluster or 1/2) would only output the nearest or almost same genre/styles.
		*/
		
		/*	Note on anti_influence:
			It applies to anything listed on style_anti_influence. Same logic than the rest.
			The value is added to the total distance calculated between 2 nodes. i.e. if Rock to Jazz had a distance of 300,
			if they had an anti-influence link, then the total distance would be 300 + 100 = 400. Being farther than before...
		*/
		
		/*	Note on primary_origin_influence (same applies to secondary_origin_influence):
			It only applies to those nodes which have a primary origin link AND are in the same Supergenre (SG).
			Contrary to anti_influence which applies globally and only on nodes listed in its associated array.
			This is done to account for genres/styles which are nearer than others on the same Supergenre, 
			while not using a style cluster or weak substitution approach.
			Also beware of setting to high (absolute) values, the value is directly applied to the final total path distance...
			the idea is that cluster related nodes (85) should be nearer than intra-Supergenre related nodes (100). When adding a
			primary_origin link, then it would be omitted (being greater than the other two) but the influence applies.
			The total distance would be 85 - 10 = 75 for cluster related nodes and 100 - 10 = 90 for intra-Supergenre related nodes.
			But also when considering intra-Supergenre related nodes with primary_origin links (90) against cluster related nodes
			without such link (85) the cluster related ones are still neared than the others.
		*/
		
		/* 
			-------------------------
			For drawing 
			-------------------------
		*/
		
		// Assigns colors to labels and nodes
		// Anything named "..._supergenre" will be added to the html color label legend automatically.
		// If more than one "...Folk..._supergenre" or "...Classical..._supergenre" is found, then it will be skipped.
		// i.e. It will list Folk and Classical only once, even if there are multiple (sub)SuperGenres.
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
		// Supergenre Clusters
		['Industrial_cluster'					,'#e04103'], // From here to the bottom, will not be added to the color label legend,
		['Metal_cluster'						,'#D88417'], // because the names don't have "..._supergenre"
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
		
		// Attributtes for every node type
		nodeSize: 10,
		nodeShape: 'rect', //'circle','rect','star' or 'image'. 'Image' requires 'imageLink' data for every node on drawing function
		nodeImageLink: 'helpers-external/ngraph/html/images/Starv2.png',
		
		style_clusterSize: 20,
		style_clusterShape: 'star',
		style_clusterImageLink: 'helpers-external/ngraph/html/images/Star.png',
		
		style_supergenreSize: 15,
		style_supergenreShape: 'circle',
		style_supergenreImageLink: 'helpers-external/ngraph/html/images/Star.png',
		
		style_supergenre_clusterSize: 18,
		style_supergenre_clusterShape: 'circle',
		style_supergenre_clusterImageLink: 'helpers-external/ngraph/html/images/Star.png',
		
		style_supergenre_superclusterSize: 22,
		style_supergenre_superclusterShape: 'rect',
		style_supergenre_superclusterImageLink: 'helpers-external/ngraph/html/images/Star_color.png',
		
		// Other
		bPreRender: true, // (false) Renders graph on the fly on browsers or (true) pre-rendering (it may take some time while loading entire graph)
		renderMethod: 'realDistance'	// ('graph') Renders graph according to link centrality/gravity forces.
										// ('graphWeighted') uses the link's weight values at top to render similar distances to real ones, but also using link forces.
										// ('realDistance') uses the link's weight values at top to render real distances. Beware it will look really weird!
};