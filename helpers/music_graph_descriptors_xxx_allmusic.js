'use strict';
//09/03/22

/*
	All Music genre/styles replacer
	* Already included items on the graph
	- Items which don't have an alternative term
	0 Items which are meant to be filtered
	
Classical subgenres and styles

        Avant-Garde Music
        Ballet
        Band Music
        Chamber Music
        Choral
        Classical Crossover
        Concerto
        Electronic/Computer Music
        Fight Songs
        Film Score
        Keyboard
        Marches
        Military
        Miscellaneous (Classical)
        Opera
        Orchestral
        Show/Musical
        Symphony
        Vocal Music

Country subgenres and styles [-]


        Alternative Country
            Alt-Country
            Americana

        Contemporary Country
            Bro-Country
            Contemporary Bluegrass
            Contemporary Country
            Country Rap
            Neo-Traditionalist Country
            New Traditionalist
            Red Dirt

        Country-Pop
            Country-Pop
            Nashville Sound / Countrypolitan
            Urban Cowboy

        Honky Tonk
            Bakersfield Sound
            Honky Tonk
            Truck Driving Country

        Progressive Country
            Country-Folk
            Outlaw Country
            Progressive Bluegrass
            Progressive Country
            Rodeo

        Traditional Country
            Bluegrass
            Bluegrass-Gospel
            Close Harmony
            Country Boogie
            Country Gospel
            Cowboy
            Early Country
            Instrumental Country
            Jug Band
            Old-Timey
            Square Dance
            String Bands
            Traditional Bluegrass
            Traditional Country
            Yodeling

        Western Swing
            Western Swing
            Western Swing Revival

Electronic subgenres and styles [-]


        Downtempo
            Ambient Dub
            Dark Ambient
            Downbeat
            Experimental Ambient
            Illbient
            Synthwave
            Trip-Hop
            Vaporware

        Electronica
            Baile Funk
            Big Beat
            Breakcore
            Clubjazz
            EDM
            Electronica
            Funky Breaks
            Hi-NRG
            Newbeat
            Nu Breaks
            Trap (EDM)

        Experimental Electronic
            Baseline
            Chiptunes
            Electro-Acoustic
            Experimental Club
            Experimental Dub
            Glitch
            IDM
            Microsound

        House
            Acid House
            Ambient House
            Chicago House
            Deep House
            French House
            Garage
            Gqom
            Jazz-House
            Juke / Footwork
            Left-Field House
            Microhouse
            Progressive House
            Tech-House
            Tribal House
            UK Garage

        Jungle / Drum'n'Bass
            Acid Jazz
            Ambient Breakbeat
            Broken Beat
            Drill'n'bass
            Dubstep
            Experimental Jungle
            Industrial Drum'n'Bass

        Techno
            Acid Techno
            Ambient Techno
            Detroit Techno
            Electro
            Electro-Jazz
            Electro-Techno
            Experimental Electro
            Experimental Techno
            Gabba
            Happy Hardcore
            Hardcore Techno
            Minimal Techno
            Neo-Electro
            Rave
            Techno Bass
            Techno-Dub

        Trance
            Goa Trance
            Progressive Trance
            Psytrance


Folk subgenres and styles [-]


        Contemporary Folk
            Alternative Folk
            Anti-Folk
            Contemporary Folk
            Folk Jazz
            Folk-Pop
            Neo-Traditional Folk
            New Acoustic
            Political Folk
            Progressive Folk
            Urban Folk

        Traditional Folk
            Appalachian
            British Folk
            Field Recordings
            Folk Revival
            Folksongs
            Irish Folk
            Minstrel
            Protest Songs
            Sea Shanties
            Traditional Folk
            Work Song

// [0									,	['Big Band / Swing'					]],
// [0									,	['    Ballroom Dance'					]],
// [0									,	['    Big Band'					]],
// [0									,	['    British Dance Bands'					]],
// [0									,	['    Continental Jazz'					]],
// [0									,	['    Dance Bands'					]],
// [0									,	['    Experimental Big Band'					]],
// [0									,	['    Jive'					]],
// [0									,	['    Modern Big Band'					]],
// [0									,	['    Orchestral Jazz'					]],
// [0									,	['    Progressive Big Band'					]],
// [0									,	['    Progressive Jazz'					]],
// [0									,	['    Society Dance Band'					]],
// [0									,	['    Sweet Bands'					]],
// [0									,	['    Swing'					]],
// [0									,	[''					]],
// [0									,	['Bop'					]],
// [0									,	['    Bop'					]],
// [0									,	['    Bop Vocals'					]],
// [0									,	[''					]],
// [0									,	['Contemporary Jazz'					]],
// [0									,	['    Contemporary Jazz'					]],
// [0									,	[''					]],
// [0									,	['Cool'					]],
// [0									,	['    Chamber Jazz'					]],
// [0									,	['    Cool'					]],
// [0									,	['    West Coast Jazz'					]],
// [0									,	[''					]],
// [0									,	['Free Jazz'					]],
// [0									,	['    Avant-Garde Jazz'					]],
// [0									,	['    Early Creative'					]],
// [0									,	['    Free Jazz'					]],
// [0									,	['    M-Base'					]],
// [0									,	['    Modern Creative'					]],
// [0									,	['    Modern Free'					]],
// [0									,	['    Third Stream'					]],
// [0									,	[''					]],
// [0									,	['Fusion'					]],
// [0									,	['    Crossover Jazz'					]],
// [0									,	['    Electric Jazz'					]],
// [0									,	['    Free Funk'					]],
// [0									,	['    Fusion'					]],
// [0									,	['    Jazz-Pop'					]],
// [0									,	['    Jazz-Rock'					]],
// [0									,	['    Modern Jazz'					]],
// [0									,	['    Smooth Jazz'					]],
// [0									,	['    Straight-Ahead Jazz'					]],
// [0									,	[''					]],
// [0									,	['Global Jazz'					]],
// [0									,	['    African Jazz'					]],
// [0									,	['    Afro-Cuban Jazz'					]],
// [0									,	['    Brazilian Jazz'					]],
// [0									,	['    Cuban Jazz'					]],
// [0									,	['    Israeli Jazz'					]],
// [0									,	['    Latin Jazz'					]],
// [0									,	[''					]],
// [0									,	['Hard Bop'					]],
// [0									,	['    Hard Bop'					]],
// [0									,	['    Modal Music'					]],
// [0									,	['    Neo-Bop'					]],
// [0									,	['    Post-Bop'					]],
// [0									,	[''					]],
// [0									,	['Jazz Instrument'					]],
// [0									,	['    Guitar Jazz'					]],
// [0									,	['    Piano Jazz'					]],
// [0									,	['    Saxophone Jazz'					]],
// [0									,	['    Trombone Jazz'					]],
// [0									,	['    Trumpet Jazz'					]],
// [0									,	['    Vibraphone / Marimba Jazz'					]],
// [0									,	[''					]],
// [0									,	['New Orleans / Classic Jazz'					]],
// [0									,	['    Boogie-Woogie'					]],
// [0									,	['    Chicago Jazz'					]],
// [0									,	['    Dixieland'					]],
// [0									,	['    Early Jazz'					]],
// [0									,	['    Hot Jazz'					]],
// [0									,	['    Mainstream Jazz'					]],
// [0									,	['    New Orleans Brass Bands'					]],
// [0									,	['    New Orleans Jazz'					]],
// [0									,	['    New Orleans Jazz Revival'					]],
// [0									,	['    Novelty Ragtime'					]],
// [0									,	['    Ragtime'					]],
// [0									,	['    Stride'					]],
// [0									,	['    Trad Jazz'					]],
// [0									,	[''					]],
// [0									,	['Soul Jazz / Groove'					]],
// [0									,	['    Jazz-Funk'					]],
// [0									,	['    Jump Blues'					]],
// [0									,	['    Soul Jazz'					]],
// [0									,	['    Spiritual Jazz'					]],
'					]],
Latin subgenres and styles [-]'					]],
'					]],
'					]],
// [0									,	['Cuban Traditions'					]],
// [0									,	['    Afro-Cuban'					]],
// [0									,	['    Changui'					]],
// [0									,	['    Charanga'					]],
// [0									,	['    Danzon'					]],
// [0									,	['    Grupero'					]],
// [0									,	['    Guaguancó'					]],
// [0									,	['    Mambo'					]],
// [0									,	['    Modern Son'					]],
// [0									,	['    Nueva Trova'					]],
// [0									,	['    Rumba'					]],
// [0									,	['    Son'					]],
// [0									,	['    Timba'					]],
// [0									,	[''					]],
// [0									,	['Latin America'					]],
// [0									,	['    Afro-Colombian'					]],
// [0									,	['    Alternative Latin'					]],
// [0									,	['    Bolero'					]],
// [0									,	['    Boogaloo'					]],
// [0									,	['    Cha-Cha'					]],
// [0									,	['    Choro'					]],
// [0									,	['    Colombian'					]],
// [0									,	['    Cuatro'					]],
// [0									,	['    Latin Big Band'					]],
// [0									,	['    Latin Dance'					]],
// [0									,	['    Latin Folk'					]],
// [0									,	['    Latin Pop'					]],
// [0									,	['    Latin Soul'					]],
// [0									,	['    New York Salsa'					]],
// [0									,	['    Nueva Cancion'					]],
// [0									,	['    Pachanga'					]],
// [0									,	['    Plena'					]],
// [0									,	['    Puerto Rican Traditions'					]],
// [0									,	['    Trova'					]],
// [0									,	[''					]],
// [0									,	['Mexican Traditions'					]],
// [0									,	['    Alterna Movimiento'					]],
// [0									,	['    Alternative Corridos'					]],
// [0									,	['    Banda'					]],
// [0									,	['    Bomba'					]],
// [0									,	['    Conjunto'					]],
// [0									,	['    Corrido'					]],
// [0									,	['    Cumbia'					]],
// [0									,	['    Duranguense'					]],
// [0									,	['    Electro-Cumbia'					]],
// [0									,	['    Mariachi'					]],
// [0									,	['    Mexican-Cumbia'					]],
// [0									,	['    Narcocorridos'					]],
// [0									,	['    New Mexcio'					]],
// [0									,	['    Norteno'					]],
// [0									,	['    Onda Grupera'					]],
// [0									,	['    Ranchera'					]],
// [0									,	['    Sonidero'					]],
// [0									,	['    Tejano'					]],
// [0									,	[''					]],
// [0									,	['Tropical'					]],
// [0									,	['    Bachata'					]],
// [0									,	['    Beguine'					]],
// [0									,	['    Beguine Moderne'					]],
// [0									,	['    Beguine Vide'					]],
// [0									,	['    Compas'					]],
// [0									,	['    Cuban Pop'					]],
// [0									,	['    Dominican Traditions'					]],
// [0									,	['    Lambada'					]],
// [0									,	['    Merengue'					]],
// [0									,	['    Merenhouse'					]],
// [0									,	['    Mini Jazz'					]],
// [0									,	['    Salsa'					]],
// [0									,	['    Sonero'					]],
// [0									,	['    Tropical'					]],
'					]],
'					]],
New Age subgenres and styles'					]],
'					]],
// [0									,	['Adult Alternative'					]],
// [0									,	['Ambient'					]],
// [0									,	['Contemporary Instrumental'					]],
// [0									,	['Environmental'					]],
// [0									,	['Ethnic Fusion'					]],
// [0									,	['Flute/New Age'					]],
// [0									,	['Guitar/New Age'					]],
// [0									,	['Harp/New Age'					]],
// [0									,	['Healing'					]],
// [0									,	['Keyboard/Synthesizer/New Age'					]],
// [0									,	['Meditation/Relaxation'					]],
// [0									,	['Mystical Minimalism'					]],
// [0									,	['Nature'					]],
// [0									,	['Neo-Classical'					]],
// [0									,	['New Age Tone Poems'					]],
// [0									,	['Piano/New Age'					]],
// [0									,	['Progressive Alternative'					]],
// [0									,	['Progressive Electronic'					]],
// [0									,	['Relaxation'					]],
// [0									,	['Self-Help & Development'					]],
// [0									,	['Solo Instrumental'					]],
// [0									,	['Space'					]],
// [0									,	['Spiritual'					]],
// [0									,	['Techno-Tribal'					]],
'					]],
*/

const music_graph_descriptors_allmusic = {
	style_substitutions: [
	/* Rap */
			['Hip-Hop'							,	['Rap'								]],
		/* Alternative Rap */
			['Alt. Rap'						,	['Alternative Rap'					]],
			// [0									,	['Afroswing'						]],
			// [0									,	['Cloud Rap'						]],
			// [0									,	['Grime'							]],
			// [0									,	['Instrumental Hip-Hop'				]],
			// [*									,	['Jazz-Rap'							]],
			// [-									,	['Left-Field Rap'					]],
			['Conscious'						,	['Political Rap'					]],
			// [0									,	['Turntablism'						]],
			// [*									,	['Underground Rap'					]],
		/* Hip-Hop/Urban */
			// [0									,	['Hip-Hop/Urban'					]],
			// [-									,	['Dirty Rap'						]],
			['East Coast'					,	['East Coast Rap'					]],
			// [*									,	['Golden Age'						]],
			['Hardcore'							,	['Hardcore Rap'						]],
			['Midwest'							,	['Midwest Rap'						]],
			['Old-School'						,	['Old-School Rap'					]],
			['West Coast'						,	['West Coast Rap'					]],
		/* International Rap */
			// [0									,	['International Rap'				]],
			// [0									,	['African Rap'						]],
			// [0									,	['Asian Rap'						]],
			['British Hip-Hop'					,	['British Rap'						]],
			// [0									,	['Chinese Rap'						]],
			// [0									,	['European Rap'						]],
			// [0									,	['French Rap'						]],
			// [0									,	['German Rap'						]],
			// [0									,	['Italian Rap'						]],
			// [0									,	['Japanese Rap'						]],
			// [0									,	['Korean Rap'						]],
			// [0									,	['UK Drill'							]],
		/* Pop-Rap */
			['Pop Rap'							,	['Pop-Rap'							]],
			['Miami Bass'						,	['Bass Music'						]],
			// [0									,	['Bay Area Rap'						]],
			// [0									,	['Contemporary Rap'					]],
			// ['Dirty Rap'							,	['Dirty South'						]],
			// [-									,	['Drill'							]],
			['Psychedelic Rap'					,	['G-Funk'							]],
			['Gangsta'							,	['Gangsta Rap'						]],
			// [0									,	['Horror Rap'						]],
			// [0									,	['Party Rap'						]],
			['South Coast'						,	['Southern Rap'						]],
			// [0									,	['Texas Rap'						]],
			['Trap'								,	['Trap (Rap)'						]],
		/* Reggaeton/Latin Rap */
			// [0									,	['Reggaeton/Latin Rap'				]],
			// [-									,	['Latin Rap'						]],
			// [*									,	['Reggaeton'						]],
			['Trap'								,	['Trap (Latin)'						]],
			// [0									,	['Urbano'							]],
	/* International */
	/* 
		Most of these are omitted since they point to music classified by cultural groups, not to genres
		with similar characteristics.
	*/
			// [0									,	['International'					]],
		/* African Traditions */
			// [0									,	['African Traditions'				]],
			['African Folk_supergenre'			,	['African Folk'						]],
			// [0									,	['Afro-beat'						]],
			// [0									,	['Afro-Pop'							]],
			// [*									,	['Desert Blues'						]],
		/* Asian Traditions */
			// [0									,	['Asian Traditions'					]],
			['Asian Folk_supergenre'			,	['Asian Folk'						]],
			// [0									,	['Throat Singing'					]],
		/* Brazilian Traditions */
			// [0									,	['Brazilian Traditions'				]],
			// [0									,	['Afoxe'							]],
			// [0									,	['Afro-Brazilian'					]],
			// [0									,	['Axe'								]],
			// [0									,	['Bossa Nova'						]],
			// [0									,	['Brazilian Folk'					]],
			// [0									,	['Brazilian Pop'					]],
			// [0									,	['Carnival'							]],
			// [0									,	['Forro'							]],
			// [0									,	['MPB'								]],
			// [0									,	['Samba'							]],
			// [0									,	['Tropicalia'						]],
		/* Caribbean Traditions */
			// [0									,	['Caribbean Traditions'				]],
			// [0									,	['Bahamian'							]],
			// [0									,	['Belair'							]],
			// [0									,	['Cadence'							]],
			// [*									,	['Calypso'							]],
			// [0									,	['Chouval Bwa'						]],
			// [0									,	['French Antilles'					]],
			// [0									,	['Guadeloupe'						]],
			// [0									,	['Gwo Ka'							]],
			// [0									,	['Haitian'							]],
			// [0									,	['Jamaican'							]],
			// [0									,	['Junkanoo'							]],
			// [0									,	['Martinique'						]],
			// [0									,	['Mento'							]],
			// [0									,	['Party Soca'						]],
			// [0									,	['Rapso'							]],
			// [0									,	['Soca'								]],
			// [0									,	['Spouge'							]],
			// [0									,	['Steel Band'						]],
			// [0									,	['Trinidadian'						]],
			// [0									,	['Vaudou'							]],
			// [0									,	['Zouk'								]],
		/* Celtic/British Isles */
			['Celtic Folk_supergenre'			,	['Celtic/British Isles'			]],
			// [0									,	['Breton'							]],
			// [0									,	['British'							]],
			// [*									,	['Celtic'							]],
			// [0									,	['Celtic Folk'						]],
			// [0									,	['Celtic Fusion'					]],
			// [0									,	['Celtic Gospel'					]],
			// [*									,	['Celtic New Age'					]],
			// [0									,	['Celtic Pop'						]],
			// [0									,	['Celtic Rock'						]],
			// [0									,	['Contemporary Celtic'				]],
			['Irish'							,	['Country & Irish'					]],
			// [0									,	['Drinking Songs'					]],
			// [0									,	['Pibroch'							]],
			// [0									,	['Pipe Bands'						]],
			// [0									,	['Scottish Country Dance'			]],
			// [*									,	['Scottish Folk'					]],
			// [0									,	['Traditional Celtic'				]],
			// [0									,	['Traditional Irish Folk'			]],
			// [0									,	['Traditional Scottish Folk'		]],
			// [0									,	['Welsh'							]],
		/* Central African */
			// [0									,	['Central African'					]],
			// [0									,	['Burundi'							]],
			// [0									,	['Congolese'						]],
			// [0									,	['Kalindula'						]],
			// [0									,	['Mbuti Choral'						]],
			// [0									,	['Ndombolo'							]],
			// [0									,	['Pygmy'							]],
			// [0									,	['Soukous'							]],
			// [0									,	['Zairean'							]],
		/* Central American Traditions */
			// [0									,	['Central American Traditions'		]],
			// [0									,	['Guatemalan'						]],
			// [0									,	['Honduran'							]],
			// [0									,	['Nicaraguan'						]],
			// [0									,	['Panamanian'						]],
			// [0									,	['Salvadoran'						]],
		/* Central European Traditions */
			['Nordic Folk_supergenre'			,	['Central European Traditions'		]],
			// [0									,	['Alpine'							]],
			// [0									,	['Austrian'							]],
			// [0									,	['Bava'								]],
			// [0									,	['Bavarian'							]],
			// [0									,	['Czech'							]],
			// [0									,	['German'							]],
			// [0									,	['Hungarian Folk'					]],
			// [0									,	['Moravian'							]],
			// [0									,	['Polish'							]],
			// [0									,	['Slovakian'						]],
			// [0									,	['Volksmusik'						]],
		/* Central/West Asian Traditions */
			// [0									,	['Central/West Asian Traditions'	]],
			// [0									,	['Azerbaijani'						]],
			// [0									,	['Dagestani'						]],
			// [0									,	['Georgian'							]],
			// [0									,	['Georgian Choir'					]],
			// [0									,	['Kazakhstani'						]],
			// [0									,	['Tajik'							]],
			// [0									,	['Tibetan'							]],
			// [0									,	['Tuvan'							]],
			// [0									,	['Uzbekistani'						]],
		/* Chinese Traditions */
			// [0									,	['Chinese Traditions'				]],
			// [0									,	['Chinese Classical'				]],
			// [-									,	['Traditional Chinese'				]],
		/* East African */
			// [0									,	['East African'						]],
			// [0									,	['Benga'							]],
			// [0									,	['Bongo Flava'						]],
			// [0									,	['Ethiopian Pop'					]],
			// [0									,	['Kenyan'							]],
			// [0									,	['Mozambiquan'						]],
			// [0									,	['Omutibo'							]],
			// [0									,	['Somalian'							]],
			// [0									,	['Sudanese'							]],
			// [0									,	['Swahili'							]],
			// [0									,	['Taarab'							]],
			// [0									,	['Tanzanian'						]],
			// [0									,	['Ugandan'							]],
		/* Indian Subcontinent Traditions */
			// [0									,	['Indian Subcontinent Traditions'	]],
			// [0									,	['Bangladeshi'						]],
			// [0									,	['Bengali'							]],
			// [0									,	['Bhangra'							]],
			// [0									,	['Bollywood'						]],
			// [0									,	['Carnatic'							]],
			// [0									,	['Dhrupad'							]],
			// [0									,	['Giddha'							]],
			// [0									,	['Indian'							]],
			// [*									,	['Indian Classical'					]],
			// [-									,	['Indian Pop'						]],
			// [0									,	['Nepalese'							]],
			// [0									,	['Pakistani'						]],
			// [0									,	['Qawwali'							]],
			// [0									,	['Raga'								]],
		/* Indonesian Traditions */
			// [0									,	['Indonesian Traditions'			]],
			// [0									,	['Balinese'							]],
			// [0									,	['Gamelan'							]],
			// [0									,	['Jaipongan'						]],
			// [0									,	['Javanese'							]],
			// [0									,	['Kecak'							]],
			// [0									,	['Macapat Poetry'					]],
			// [0									,	['Sumatran'							]],
		/* Japanese Traditions */
			// [0									,	['Japanese Traditions'				]],
			// [-									,	['Enka'								]],
			// [0									,	['Japanese Orchestral'				]],
			// [*									,	['Kabuki'							]],
			// [-									,	['Noh'								]],
			// [0									,	['Okinawan Traditional'				]],
			// [-									,	['Rakugo'							]],
			// [-									,	['Shinto'							]],
			// [0									,	['Traditional Japanese'				]],
		/* Jewish Music */
			// [0									,	['Jewish Music'						]],
			// [0									,	['American Jewish Pop'				]],
			// [0									,	['Chassidic'						]],
			// [0									,	['Hebrew'							]],
			// [0									,	['Jewish Folk'						]],
			// [0									,	['Klezmer'							]],
		/* Mediterranean Traditions */
			// [0									,	['Mediterranean Traditions'			]],
			// [0									,	['Cretan'							]],
			// [0									,	['Dimotiko'							]],
			// [0									,	['Greek'							]],
			// [0									,	['Greek Folk'						]],
			// [0									,	['Greek-Pop'						]],
			// [0									,	['Laika'							]],
			// [0									,	['Nisiotika'						]],
			// [0									,	['Rembetika'						]],
			// [0									,	['Sardinian'						]],
		/* Middle Eastern Traditions */
			// [0									,	['Middle Eastern Traditions'		]],
			// [0									,	['Afghanistan'						]],
			// [0									,	['Al-Jil'							]],
			// [0									,	['Apala'							]],
			// [0									,	['Arabic'							]],
			// [0									,	['Armenian'							]],
			// [0									,	['Armenian Folk'					]],
			// [0									,	['Belly Dancing'					]],
			// [0									,	['Egyptian'							]],
			// [0									,	['Iran-Classical'					]],
			// [0									,	['Iranian'							]],
			// [0									,	['Iraqi'							]],
			// [0									,	['Islamic'							]],
			// [0									,	['Israeli'							]],
			// [0									,	['Kurdish'							]],
			// [0									,	['Kuwaiti'							]],
			// [0									,	['Lebanese'							]],
			// [0									,	['Middle Eastern Pop'				]],
			// [0									,	['Palestinian'						]],
			// [0									,	['Persian'							]],
			// [0									,	['Saudi Arabian'					]],
			// [0									,	['Sha'abi'							]],
			// [0									,	['Syrian'							]],
			// [0									,	['Traditional Middle Eastern Folk'	]],
			// [0									,	['Turkish'							]],
			// [0									,	['Yemenite'							]],
		/* Nordic Traditions */
			// [0									,	['Nordic Traditions'				]],
			// [0									,	['Danish'							]],
			// [0									,	['Finnish Folk'						]],
			// [0									,	['Icelandic'						]],
			// [0									,	['Joik'								]],
			// [0									,	['Norwegian'						]],
			// [0									,	['Norwegian Folk'					]],
			// [0									,	['Sami'								]],
			// [0									,	['Scandinavian'						]],
			// [0									,	['Swedish Folk'						]],
			// [0									,	['Yodel'							]],
		/* North African */
			// [0									,	['North African'					]],
			// [0									,	['Algerian'							]],
			// [0									,	['Berber'							]],
			// [0									,	['Mauritanian'						]],
			// [0									,	['Moroccan'							]],
			// [0									,	['Rai'								]],
		/* North American Traditions */
			['North American Folk_supergenre'	,	['North American Traditions'		]],
			// [0									,	['Acadian'							]],
			// [0									,	['Cajun'							]],
			// [0									,	['Canadian'							]],
			// [0									,	['Contemporary Native American'		]],
			// [0									,	['Creole'							]],
			// [0									,	['Inuit'							]],
			// [0									,	['Native American'					]],
			// [0									,	['Quebecois'						]],
			// [0									,	['Traditional Native American'		]],
			// [*									,	['Zydeco'							]],
		/* North/East Asian Traditions */
			// [0									,	['North/East Asian Traditions'	]],
			// [0									,	['Korean'							]],
			// [0									,	['Mongolian'						]],
			// [0									,	['Siberian'							]],
			// [0									,	['Traditional Korean'				]],
			// [0									,	['Trot'								]],
		/* Oceanic Traditions */
			// [0									,	['Oceanic Traditions'				]],
			// [0									,	['Australasian'						]],
			// [0									,	['Australian'						]],
			// [0									,	['Hawaiian'							]],
			// [0									,	['Hawaiian Pop'						]],
			// [0									,	['Melanesian'						]],
			// [0									,	['Micronesian'						]],
			// [0									,	['New Zealand'						]],
			// [0									,	['Pacific Islands'					]],
			// [0									,	['Polynesian'						]],
			// [0									,	['Samoan'							]],
			// [0									,	['Slack-Key Guitar'					]],
			// [0									,	['Solomon Islands'					]],
			// [0									,	['Tahitian'							]],
			// [0									,	['Tongan'							]],
		/* Russian Traditions */
			// [0									,	['Russian Traditions'				]],
			// [0									,	['Russian Folk'						]],
		/* South American Traditions */
			['South American Folk_supergenre'	,	['South American Traditions'		]],
			// [0									,	['Afro-Peruvian'					]],
			// [0									,	['Andean Folk'						]],
			// [0									,	['Argentinian Folk'					]],
			// [0									,	['Bolivian'							]],
			// [0									,	['Chilean'							]],
			// [0									,	['Ecuadorian'						]],
			// [0									,	['Frevo'							]],
			// [0									,	['Incan'							]],
			// [0									,	['Jibaro'							]],
			// [0									,	['Native South American'			]],
			// [0									,	['Paraguayan'						]],
			// [0									,	['Peruvian'							]],
			// [0									,	['Peruvian Folk'					]],
			// [0									,	['Quechua'							]],
			// [0									,	['Tango'							]],
			// [0									,	['Uruguayan'						]],
			// [0									,	['Vallenato'						]],
			// [0									,	['Venezuelan'						]],
		/* South/Eastern European Traditions */
			['South European Folk_supergenre'	,	['South/Eastern European Traditions']],
			// [0									,	['Albanian'							]],
			// [0									,	['Balkan'							]],
			// [0									,	['Baltic'							]],
			// [0									,	['Belarusian'						]],
			// [0									,	['Bosnian'							]],
			// [0									,	['Bulgarian'						]],
			// [0									,	['Bulgarian Folk'					]],
			// [0									,	['Croatian'							]],
			// [0									,	['Estonian'							]],
			['European Folk XL'					,	['European Folk'					]],
			// [0									,	['Gypsy'							]],
			// [0									,	['Latvian'							]],
			// [0									,	['Macedonian'						]],
			// [0									,	['Moldavian'						]],
			// [0									,	['Mugam'							]],
			// [0									,	['Romanian'							]],
			// [0									,	['Serbian'							]],
			// [0									,	['Sharki'							]],
			// [0									,	['Slovenian'						]],
			// [*									,	['Traditional European Folk'		]],
			// [0									,	['Transylvanian'					]],
			// [0									,	['Ukrainian'						]],
			// [0									,	['Yugoslavian'						]],
		/* Southeast Asian Traditions */
			// [0									,	['Southeast Asian Traditions'		]],
			// [0									,	['Bornean'							]],
			// [0									,	['Cambodian'						]],
			// [0									,	['Khmer Dance'						]],
			// [0									,	['Kulintang'						]],
			// [0									,	['Laotian'							]],
			// [0									,	['Malaysian'						]],
			// [0									,	['Myanmarian'						]],
			// [0									,	['Papua New Guinea'					]],
			// [0									,	['Philippine'						]],
			// [0									,	['Siamese'							]],
			// [0									,	['Thai'								]],
			// [0									,	['Vietnamese'						]],
		/* Southern African */	
			// [0									,	['Southern African'					]],
			// [0									,	['Angolan'							]],
			// [0									,	['Chimurenga'						]],
			// [0									,	['Jit'								]],
			// [0									,	['Madagascan'						]],
			// [0									,	['Malawian'							]],
			// [0									,	['Marabi'							]],
			// [0									,	['Mbaqanga'							]],
			// [0									,	['Mbira'							]],
			// [0									,	['Mbube'							]],
			// [0									,	['Namibian'							]],
			// [0									,	['Séga'								]],
			// [0									,	['South African Folk'				]],
			// [0									,	['South African Pop'				]],
			// [0									,	['Township Jazz'					]],
			// [0									,	['Township Jive'					]],
			// [0									,	['Zambian'							]],
			// [0									,	['Zimbabwean'						]],
			// [0									,	['Zulu'								]],
		/* West African */
			// [0									,	['West African'						]],
			// [0									,	['Bambara'							]],
			// [0									,	['Bikutsi'							]],
			// [0									,	['Cameroonian'						]],
			// [0									,	['Cape Verdean'						]],
			// [0									,	['Coupé-Décalé'						]],
			// [0									,	['Djabdong'							]],
			// [0									,	['French Guianese'					]],
			// [0									,	['Fuji'								]],
			// [0									,	['Gabonese'							]],
			// [0									,	['Gambian'							]],
			// [0									,	['Ghanaian'							]],
			// [0									,	['Guinea-Bissau'					]],
			// [0									,	['Guinean'							]],
			// [0									,	['Highlife'							]],
			// [0									,	['Ivorian'							]],
			// [0									,	['Juju'								]],
			// [0									,	['Kora'								]],
			// [0									,	['Makossa'							]],
			// [0									,	['Malian Music'						]],
			// [0									,	['Mbalax'							]],
			// [0									,	['Morna'							]],
			// [0									,	['Nigerian'							]],
			// [0									,	['Palm-Wine'						]],
			// [0									,	['Senegalese Music'					]],
			// [0									,	['Sierra Leonian'					]],
			// [0									,	['Yoruban'							]],
		/* Western European Traditions */
			// [0									,	['Western European Traditions'		]],
			// [0									,	['Andalus Classical'				]],
			// [0									,	['Azorean'							]],
			// [0									,	['Basque'							]],
			// [0									,	['Belgian'							]],
			// [0									,	['Contemporary Flamenco'			]],
			// [0									,	['Dutch'							]],
			// [*									,	['Fado'								]],
			// [*									,	['Flamenco'							]],
			// [0									,	['French'							]],
			// [0									,	['French Chanson'					]],
			// [0									,	['French Folk'						]],
			// [0									,	['Italian Folk'						]],
			// [0									,	['Italian Music'					]],
			// [0									,	['Musette'							]],
			// [0									,	['Portuguese'						]],
			// [0									,	['Punta'							]],
			// [0									,	['Quadrille'						]],
			// [0									,	['Spanish Folk'						]],
			// [0									,	['Swiss Folk'						]],
			// [-									,	['Tyrolean'							]],
		/* Worldbeat */
			// [0									,	['Worldbeat'						]],
			// [0									,	['Folk Dance'						]],
			// [0									,	['Folklore'							]],
			// [0									,	['International Folk'				]],
			// [0									,	['International Fusion'				]],
			// [0									,	['Neo-Traditional'					]],
			// [0									,	['Pan-Global'						]],
	/* R&B */
		/* Contemporary R&B */
			// [*									,	['Contemporary R&B'					]],
			// [0									,	['Adult Contemporary R&B'			]],
			// [0									,	['Alternative R&B'					]],
			// [*									,	['Deep Funk Revival'				]],
			// [*									,	['Disco'							]],
			['Disco'							,	['Euro-Disco'						]],
			// [-									,	['Freestyle'						]],
			['Disco'								,	['Italo Disco'						]],
			['Neo Soul'							,	['Neo-Soul'							]],
			// [-									,	['New Jack Swing'					]],
			['Disco'								,	['Post-Disco'						]],
			// [-									,	['Quiet Storm'						]],
			// [-									,	['Retro-Soul'						]],
			// ['Urban Soul'						,	['Urban'							]],
		/* Early R&B */
			// [-									,	['Early R&B'						]],
			// [*									,	['Doo Wop'							]],
			['Motown Sound'						,	['Motown'							]],
			// [*									,	['New Orleans R&B'					]],
			// [0									,	['R&B Instrumental'					]],
		/* Soul */
			// [*									,	['Soul'								]],
			// [-									,	['Beach'							]],
			// [0									,	['Blue-Eyed Soul'					]],
			// [0									,	['Brown-Eyed Soul'					]],
			// [-									,	['Chicago Soul'						]],
			// [-									,	['Country Soul'						]],
			// [*									,	['Deep Funk'						]],
			// [-									,	['Deep Soul'						]],
			// [*									,	['Funk'								]],
			// [-									,	['Go-Go'							]],
			// [-									,	['Memphis Soul'						]],
			// [-									,	['Northern Soul'					]],
			['Philadelphia Soul'					,	['Philly Soul'						]],
			// [-									,	['Pop-Soul'							]],
			// [*									,	['Psychedelic Soul'					]],
			// [*									,	['Smooth Soul'						]],
			// [*									,	['Southern Soul'					]],
			// [-									,	['Uptown Soul'						]],
	/* Reggae */
			// [*									,	['Reggae'							]],
			// [-									,	['Bluebeat'							]],
			// [-									,	['Contemporary Reggae'				]],
			// [*									,	['Dancehall'						]],
			// [-									,	['DJ/Toasting'						]],
			// [*									,	['Dub'								]],
			['Dub'								,	['Dub Poetry'						]],
			// [-									,	['Lovers Rock'						]],
			// [-									,	['Nyahbinghi'						]],
			// [0									,	['Political Reggae'					]],
			['Ragga Hip-Hop'						,	['Ragga'							]],
			// [-									,	['Reggae-Pop'						]],
			// [*									,	['Rocksteady'						]],
			// [*									,	['Roots Reggae'						]],
			// [*									,	['Ska'								]],
			// [-									,	['Smooth Reggae'					]],
			// [-									,	['Sound System'						]],
	/* Stage & Screen */
		/* Cast Recordings */
			// [0									,	['Cast Recordings'					]],
			// [0									,	['Musical Theater'					]],
			// [-									,	['Musicals'							]],
			// [0									,	['Show Tunes'						]],
		/* Film Music */
			// [-									,	['Anime Music'						]],
			// [0									,	['Blaxploitation'					]],
			// [-									,	['Film Music'						]],
			// [0									,	['Movie Themes'						]],
			// [0									,	['Original Score'					]],
			// [-									,	['Soundtracks'						]],
			// [0									,	['Spy Music'						]],
		/* Sound Effects */
			// [-									,	['Sound Effects'					]],
			// [0									,	['Bird Calls'						]],
			// [0									,	['Occasion-Based Effects'			]],
		/* Television Music */
			// [-									,	['Television Music'					]],
			// [0									,	['Cartoon Music'					]],
			// [0									,	['Library Music'					]],
			// [0									,	['Sports Anthems'					]],
			// [0									,	['TV Music'							]],
			// [0									,	['TV Soundtracks'					]],
			// [-									,	['Video Game Music'					]],
	/* Blues */
		/* Chicago Blues */
			// [0									,	['Acoustic Chicago Blues'			]],
			// [*									,	['Chicago Blues'					]],
			// [0									,	['Electric Chicago Blues'			]],
			// [0									,	['Modern Electric Chicago Blues'	]],
			/* Country Blues */
			// [-									,	['Blues Gospel'						]],
			// [0									,	['Blues Revival'					]],
			// [*									,	['Country Blues'					]],
			// [-									,	['Folk-Blues'						]],
			// [-									,	['Memphis Blues'					]],
			// [-									,	['Pre-War Country Blues'			]],
			// [-									,	['Pre-War Gospel Blues'				]],
			// [-									,	['Songster'							]],
			// [*			'						,	['Vaudeville Blues'					]],
			['Worksongs'						,	['Work Songs'						]],
		/* Delta Blues */
			// [*									,	['Delta Blues'						]],
			// [0									,	['Electric Delta Blues'				]],
			// [0									,	['Finger-Picked Guitar'				]],
			// [0									,	['Modern Delta Blues'				]],
		/* Early Acoustic Blues */	
			// [0									,	['Early Acoustic Blues'				]],
			// [0									,	['Acoustic Blues'					]],
			// [0									,	['Acoustic Memphis Blues'			]],
			// [0									,	['Classic Blues Vocals'				]],
			// [0									,	['Classic Female Blues'				]],
			// [-									,	['Dirty Blues'						]],	
			// [0									,	['Early American Blues'				]],
			// [-									,	['Piedmont Blues'					]],
			// [-									,	['Pre-War Blues'					]],
			// [0									,	['Regional Blues'					]],
			// [0									,	['Traditional Blues'				]],
		/* East Coast Blues */
			// [-									,	['East Coast Blues'					]],
			// [-									,	['New York Blues'					]],
		/* Electric Blues */		
			// [*									,	['Detroit Blues'					]],
			// [*									,	['Electric Blues'					]],
			// [0									,	['Electric Country Blues'			]],
			// [0									,	['Electric Harmonica Blues'			]],
			// [0									,	['Electric Memphis Blues'			]],
			// [-									,	['Juke Joint Blues'					]],
			// [-									,	['Slide Guitar Blues'				]],
			['Soul Blues'						,	['Soul-Blues'						]],
			// [-									,	['Swamp Blues'						]],
			// [-									,	['Urban Blues'						]],
		/* Harmonica Blues */
			// [*									,	['Harmonica Blues'					]],
		/* Jump Blues/Piano Blues */
			// [0									,	['Jump Blues/Piano Blues'			]],
			// [-									,	['Jazz Blues'						]],
			// [*									,	['Piano Blues'						]],
			// [-									,	['St. Louis Blues'					]],
			// [-									,	['West Coast Blues'					]],
		/* Louisiana Blues */
			// [0									,	['Acoustic Louisiana Blues'			]],
			// [0									,	['Acoustic New Orleans Blues'		]],
			// [-									,	['Louisiana Blues'					]],
			// [-									,	['New Orleans Blues'				]],
		/* Modern Acoustic Blues */
			['Contemporary Blues'				,	['Modern Acoustic Blues'			]],
		/* Modern Electric Blues */
			// [0									,	['Contemporary Blues'				]],
			['Modern Electric Blues'			,	['Modern Blues'						]],
			// [*									,	['Modern Electric Blues'			]],
		/* Texas Blues */
			['Texas Blues'						,	['Acoustic Texas Blues'				]],
			['Texas Blues'						,	['Electric Texas Blues'				]],
			['Texas Blues'						,	['Modern Electric Texas Blues'		]],
			// [*									,	['Texas Blues'						]],
	/* Pop/Rock */
			/* Alternative/Indie Rock */
			['Alt. Rock'						,	['Alternative/Indie Rock'			]],
			['Alt. Rock'						,	['Adult Alternative Pop/Rock'		]],
			['Alt. Country'						,	['Alternative Country-Rock'			]],
			// [-									,	['Alternative Dance'				]],
			['Alt. Rock'						,	['Alternative Pop/Rock'				]],
			// [-									,	['Ambient Pop'						]],
			// [-									,	['American Underground'				]],
			// [-									,	['Bedroom Pop'						]],
			// [0									,	['British Trad Rock'				]],
			// [*									,	['Britpop'							]],
			// [-									,	['C-86'								]],
			// [-									,	['Chamber Pop'						]],
			// [*									,	['Chillwave'						]],
			// [-									,	['Cocktail'							]],
			// [-									,	['Cold Wave'						]],
			// [-									,	['College Rock'						]],
			// [*									,	['Cowpunk'							]],
			// [*									,	['Darkwave'							]],
			// [*									,	['Dream Pop'						]],
			// [*									,	['Electro-Industrial'				]],
			['Emo Rock'							,	['Emo'								]],
			['Emo Rock'							,	['Emo-Pop'							]],
			// [-									,	['Free Folk'						]],
			// [*									,	['Garage Punk'						]],
			// [*									,	['Garage Rock Revival'				]],
			['Gothic Rock'						,	['Goth Rock'						]],
			// [*									,	['Grunge'							]],
			// [0									,	['Grunge Revival'					]],
			['Indie'							,	['Indie Electronic'					]],
			['Indie'							,	['Indie Folk'						]],
			['Indie'							,	['Indie Pop'						]],
			['Indie'							,	['Indie Rock'						]],
			// [*									,	['Industrial'						]],
			// [-									,	['Industrial Dance'					]],
			// [-									,	['Jangle Pop'						]],
			// [-									,	['Left-Field Pop'					]],
			// [0									,	['Lo-Fi'							]],
			// [-									,	['Madchester'						]],
			// [*									,	['Math Rock'						]],
			// [-									,	['Neo-Disco'						]],
			// [-									,	['Neo-Glam'							]],
			// [*									,	['Neo-Psychedelia'					]],
			['Post-Punk Revival'					,	['New Wave/Post-Punk Revival'		]],
			// [-									,	['New Zealand Rock'					]],
			['Noise Rock'						,	['Noise Pop'						]],
			// [-									,	['Paisley Underground'				]],
			// [*									,	['Pop Punk'							]],
			// [*									,	['Post-Grunge'						]],
			// [*									,	['Post-Hardcore'					]],
			// [*									,	['Post-Rock'						]],
			// [*									,	['Psychobilly'						]],
			// [-									,	['Punk Blues'						]],
			['Post-Punk Revival'				,	['Punk Revival'						]],
			// [-									,	['Queercore'						]],
			// [-									,	['Retro Swing'						]],
			// [*									,	['Riot Grrrl'						]],
			// [*									,	['Sadcore'							]],
			// [-									,	['Screamo'							]],
			// [-									,	['Shibuya-Kei'						]],
			// [*									,	['Shoegaze'							]],
			['Ska Punk'							,	['Ska-Punk'							]],
			// [-									,	['Skatepunk'						]],
			// [*									,	['Slowcore'							]],
			// [-									,	['Sophisti-Pop'						]],
			// [*									,	['Space Rock'						]],
			['Ska Revival'						,	['Third Wave Ska Revival'			]],
			// [-									,	['Twee Pop'							]],
			// [-									,	['Witch House'						]],
		/* Art-Rock/Experimental */
			['Progressive Rock XL'				,	['Art-Rock/Experimental'			]],
			// [0									,	['Art Rock'							]],
			// [*									,	['Avant-Prog'						]],
			// [*									,	['Canterbury Scene'					]],
			// [0									,	['Experimental Rock'				]],
			['Krautrock'						,	['Kraut Rock'						]],
			// [*									,	['Neo-Prog'							]],
			['Noise Rock'						,	['Noise-Rock'						]],
			['Progressive Rock'					,	['Prog-Rock'						]],
		/* Asian Pop */
			// [-									,	['Asian Pop'						]],
			// [-									,	['C-Pop'							]],
			// [-									,	['Cantopop'							]],
			// [-									,	['City Pop'							]],
			// [-									,	['J-Pop'							]],
			// [-									,	['K-Pop'							]],
			// [-									,	['Kayokyoku'						]],
			// [-									,	['Mandopop'							]],
			// [-									,	['Okinawan Pop'						]],
			// [-									,	['Thai Pop'							]],
		/* Asian Rock */
			// [0									,	['Asian Rock'						]],
			// [0									,	['Chinese Rock'						]],
			// [0									,	['Japanese Rock'					]],
			// [0									,	['Korean Rock'						]],
			// [0									,	['Visual Kei'						]],
		/* British Invasion */
			// [*									,	['British Blues'					]],
			['Beat Music'						,	['British Invasion'					]],
			['Beat Music'						,	['Early British Pop / Rock'			]],
			['Beat Music'						,	['Freakbeat'						]],
			['Beat Music'						,	['Merseybeat'						]],
			// [0									,	['Mod'								]],
			// [*									,	['Skiffle'							]],
		/* Dance */
			// [0									,	['Dance'							]],
			// [0									,	['Club/Dance'						]],
			['Dance Pop'						,	['Dance-Pop'						]],
			['DanceRock'						,	['Dance-Rock'						]],
			['Eurodance'						,	['Euro-Dance'						]],
			// [0									,	['Exercise'							]],
			// [0									,	['Latin Freestyle'					]],
			// [0									,	['Teen Pop'							]],
		/* Europop */
			// [*									,	['Europop'							]],
			['Europop'							,	['Euro-Pop'							]],
			// [-									,	['Euro-Rock'						]],
			['Europop'							,	['Schlager'							]],
			['Europop'							,	['Swedish Pop/Rock'					]],
		/* Folk/Country Rock */
			// [0									,	['Folk/Country Rock'				]],
			// [*									,	['British Folk-Rock'				]],
			['Country Rock'						,	['Country-Rock'						]],
			// [*									,	['Folk-Rock'						]],
		/* Foreign Language Rock */
			// [0									,	['Foreign Language Rock'			]],
			// [0									,	['Aboriginal Rock'					]],
			// [0									,	['AustroPop'						]],
			// [0									,	['Dutch Pop'						]],
			// [0									,	['Eastern European Pop'				]],
			// [0									,	['French Pop'						]],
			// [0									,	['French Rock'						]],
			// [0									,	['Indipop'							]],
			// [0									,	['International Pop'				]],
			// [0									,	['Italian Pop'						]],
			// [0									,	['Liedermacher'						]],
			// [0									,	['Nouvelle Chanson'					]],
			// [0									,	['Rock en Español'					]],
			// [0									,	['Scandinavian Pop'					]],
			// [0									,	['Yé-yé'							]],
		/* Hard Rock */
			['Classic Rock XL'					,	['Album Rock'						]],
			// [*									,	['Arena Rock'						]],
			// [*									,	['Aussie Rock'						]],
			// [*									,	['Boogie Rock'						]],
			// [*									,	['Detroit Rock'						]],
			// [*									,	['Glam Rock'						]],
			// [-									,	['Glitter'							]],
			// [*									,	['Hard Rock'						]],
			// [*									,	['Southern Rock'					]],
			['Rap Rock'							,	['Rap-Rock'							]],
		/* Heavy Metal */
			// [*									,	['Heavy Metal'						]],
			['Alt. Metal XL'					,	['Alternative Metal'				]],
			// [-									,	['Avant-Garde Metal'				]],
			// [*									,	['Black Metal'						]],
			// [-									,	['Blackgaze'						]],
			['British Metal'					,	['British Alternative Metal'		]],
			['Death Metal'						,	['Death Alternative Metal'			]],
			// [-									,	['Deathcore'						]],
			['Doom Metal'						,	['Doom Alternative Metal'			]],
			// [-									,	['Drone Alternative Metal'			]],
			// [-									,	['Electronicore'					]],
			['Folk Metal'						,	['Folk-Alternative Metal'			]],
			['Funk Metal'						,	['Funk Alternative Metal'			]],
			['Gothic Metal'						,	['Goth Alternative Metal'			]],
			// [*									,	['Grindcore'						]],
			// [0									,	['Guitar Virtuoso'					]],
			// ['Hair Metal'						,	['Hair Alternative Metal'			]],
			['Industrial Metal'					,	['Industrial Alternative Metal'		]],
			['Metalcore'						,	['Alternative Metalcore'			]],
			['Neo-Classical Metal'				,	['Neo-Classical Alternative Metal'	]],
			['British Metal'					,	['New Wave of British Heavy Alternative Metal']],
			['Nu Metal'							,	['Nü Alternative Metal'				]],
			['Pop Metal'						,	['Pop-Alternative Metal'			]],
			['Post-Metal'						,	['Post-Alternative Metal'			]],
			['Power Metal'						,	['Power Alternative Metal'			]],
			['Progressive Metal'				,	['Progressive Alternative Metal'	]],
			// [-									,	['Punk Alternative Metal'			]],
			['Rap Metal'						,	['Rap-Alternative Metal'			]],
			// [-									,	['Scandinavian Alternative Metal'	]],
			['Sludge Metal'						,	['Sludge Alternative Metal'			]],
			['Speed Metal'						,	['Speed / Thrash Alternative Metal'	]],
			['Stoner Metal'						,	['Stoner Alternative Metal'			]],
			['Symphonic Metal'					,	['Symphonic Black Alternative Metal']],
			['Symphonic Metal'					,	['Symphonic Alternative Metal'		]],
			['Death Metal'						,	['Technical Death Alternative Metal']],
		/* Pop/Rock */
			['Pop Rock'							,	['Pop/Rock'							]],
			['Pop Rock'							,	['AM Pop'							]],
			// [*									,	['Baroque Pop'						]],
			['Brill Building Sound'				,	['Brill Building Pop'				]],
			// [-									,	['Bubblegum'						]],
			// [-									,	['Celebrity'						]],
			['Contemporary Rock'				,	['Contemporary Pop/Rock'			]],
			['Pop Rock'							,	['Early Pop/Rock'					]],
			// [0									,	['Girl Groups'						]],
			// [*									,	['Pop'								]],
			// [0									,	['Pop Idol'							]],
			// [0									,	['Social Media Pop'					]],
			// [*									,	['Sunshine Pop'						]],
			// [0									,	['Teen Idols'						]],
			// [0									,	['Tribute Albums'					]],
		/* Psychedelic/Garage */
			['Psychedelic Folk'					,	['Acid Folk'						]],
			// [*									,	['Acid Rock'						]],
			// [0									,	['African Psychedelia'				]],
			// [0									,	['Asian Psychedelia'				]],
			// [*									,	['British Psychedelia'				]],
			// [0									,	['European Psychedelia'				]],
			// [*									,	['Garage Rock'						]],
			// [0									,	['Latin Psychedelia'				]],
			// [-									,	['Obscuro'							]],
			['Psy XL & Gaze'					,	['Psychedelic'						]],
			// [*									,	['Psychedelic Pop'					]],
			['Psychedelic Rock'					,	['Psychedelic/Garage'				]],
			// [0									,	['Turkish Psychedelia'				]],
		/*  Punk/New Wave */
			['Punk Rock_supergenre'				,	['Punk/New Wave'					]],
			// [-									,	['American Punk'					]],
			// [-									,	['Anarchist Punk'					]],
			// [-									,	['British Punk'						]],
			// [*									,	['Hardcore Punk'					]],
			// [-									,	['L.A. Punk'						]],
			// [-									,	['Mod Revival'						]],
			// [-									,	['New Romantic'						]],
			// [*									,	['New Wave'							]],
			// [-									,	['New York Punk'					]],
			// [-									,	['No Wave'							]],
			// [-									,	['Oi!'								]],
			// [*									,	['Post-Punk'						]],
			// [*									,	['Power Pop'						]],
			// [*									,	['Proto-Punk'						]],
			// [*									,	['Punk'								]],
			// [*									,	['Ska Revival'						]],
			// [-									,	['Straight-Edge'					]],
			['Synth-Pop'						,	['Synth Pop'						]],
		/* Rock & Roll/Roots */
			// [-									,	['American Trad Rock'				]],
			['Pub Rock'							,	['Bar Band'							]],
			['Blues Rock'						,	['Blues-Rock'						]],
			// [-									,	['Frat Rock'						]],
			// [*									,	['Heartland Rock'					]],
			// [-									,	['Hot Rod'							]],
			// [-									,	['Hot Rod Revival'					]],
			// [0									,	['Instrumental Rock'				]],
			// [0									,	['Jam Bands'						]],
			// [*									,	['Latin Rock'						]],
			// [*									,	['Pub Rock'							]],
			['Retro Rock'						,	['Retro-Rock'						]],
			// [*									,	['Rock & Roll'						]],
			// [*									,	['Rockabilly'						]],
			// [*									,	['Rockabilly Revival'				]],
			// [*									,	['Roots Rock'						]],
			['Surf Rock'						,	['Surf'								]],
			['Surf Rock'						,	['Surf Revival'						]],
			// [-									,	['Swamp Pop'						]],
			// [0									,	['Tex-Mex'							]],
		/* Singer/Songwriter */
			['Songwriter'						,	['Singer/Songwriter'				]],
			['Songwriter'						,	['Contemporary Singer/Songwriter'	]],
			['Songwriter'						,	['Alternative Singer/Songwriter'	]],
		/* Soft Rock */
			['Soft Rock'						,	['Adult Contemporary'				]]
			// [*									,	['Soft Rock'						]]
	],
	// For graph filtering
	map_distance_exclusions: new Set([
		/* Alternative/Indie Rock */
		'Grunge Revival',
		/* Art-Rock/Experimental */
		'Art Rock','Experimental Rock',
		/* Asian Rock */
		'Asian Rock','Chinese Rock','Japanese Rock','Korean Rock','Visual Kei',
		/* British Invasion */
		'Mod',
		/* Dance */
		'Exercise','Latin Freestyle','Teen Pop',
		/* Folk/Country Rock */
		'Folk/Country Rock',
		/* Foreign Language Rock */
		'Foreign Language Rock','Aboriginal Rock','AustroPop','Dutch Pop','Eastern European Pop',
		'French Pop','French Rock','Indipop','International Pop','Italian Pop','Liedermacher',
		'Nouvelle Chanson','Rock en Español','Scandinavian Pop','Yé-yé',
		/* Heavy Metal */
		'Guitar Virtuoso',
		/* Psychedelic/Garage */
		'African Psychedelia','Asian Psychedelia','European Psychedelia','Turkish Psychedelia',
		/* Rock & Roll/Roots */
		'Jam Bands'
	]),
};

// Don't edit past this line...
if (Object.keys(music_graph_descriptors_allmusic).length) {
	Object.keys(music_graph_descriptors_allmusic).forEach((key) => { // We have only: arrays, sets, strings, numbers and booleans properties
			if (Array.isArray(music_graph_descriptors[key]) && Array.isArray(music_graph_descriptors_allmusic[key])) { // Arrays
				music_graph_descriptors_allmusic[key].forEach((nodeArray, i) => {
						// [ [A,[values]], ..., [[X,[values]], ... ] index of X within main array? Using flat(), length gets doubled.
						const doubleIndex = music_graph_descriptors[key].flat().indexOf(nodeArray[0]);
						const index = !(doubleIndex & 1) ? doubleIndex / 2 : -1; // -1 for odd indexes, halved for even values
						if (index !== -1) { // If present on both files, replace with new value
							const oldPair = music_graph_descriptors[key][index];
							const newPair = music_graph_descriptors_allmusic[key][i];
							const oldPairSet = new Set(oldPair[1]);
							const newPairSet = new Set(newPair[1]);
							const toDelete = newPairSet.size ? oldPairSet.intersection(newPairSet) : null;
							// Merge sets and delete elements present on both
							// Note replacing [A,[B,C]] with [A,[]] is the same than deleting the line, since no link will be created
							const newValue = newPairSet.size ? [...oldPairSet.union(newPairSet).difference(toDelete)] : []; 
							oldPair[1] = newValue;
						} else { // Otherwise just push new pair
							music_graph_descriptors[key].push(music_graph_descriptors_allmusic[key][i]);
						}
					}
				);
			} else if (music_graph_descriptors[key].constructor === Set && music_graph_descriptors_allmusic[key].constructor === Set) { // Sets
				const oldPairSet = music_graph_descriptors[key];
				const newPairSet = music_graph_descriptors_allmusic[key];
				const toDelete = oldPairSet.intersection(newPairSet);
				// Merge sets and delete elements present on both
				const newValue = newPairSet.size ? oldPairSet.union(newPairSet).difference(toDelete) : new Set();
				music_graph_descriptors[key] = newValue;
			} else { // Replace numbers, strings and booleans
				music_graph_descriptors[key] = music_graph_descriptors_allmusic[key];
			}
	});
} else {console.log('User\'s music_graph_descriptors has been loaded but it contains no changes... using only default one.');}