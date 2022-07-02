'use strict';
//01/07/22

/*	
	Search by Distance
	-----------------------------------
	Creates a playlist with similar tracks to the currently selected one according to genre, style, key, etc.
	Every track of the library is given a score according to those tags and/or a distance according to genre/style.
	When their score is over 'scoreFilter', then they are included in the final pool.
	After all tracks have been evaluated and the final pool is complete, some of them are chosen to populate
	the playlist. You can choose whether this final selection is done according to score, randomly chosen, etc.
	All settings are configurable on the properties panel (or set in the files when called using buttons, etc.)
	Check the descriptions of the properties panel to check how the variables work.
	
	These are the weight/tags pairs checked by default:
		- genreWeight	 : genre					- styleWeight	 : style
		- dyngenreWeight : virtual tag				- moodWeight	 : mood
		- keyWeight		 : key						- dateWeight	 : $year(%date%)
		- bpmWeight 	 : bpm						- composerWeight : composer (unused by default)
	There are 2 custom tags which can be set by the user too:
		- customStrWeight: (unused by default)		- customNumWeight: (unused by default)	
		
	Any Weight/tags pair can be remapped and/or merged (sep. by comma). 
	For example, linking genreWeight to 2 different genre tags on your files:
		- genreTag 		 : allmusic_genre,my_genre_tag
		
	Some weight/tags pairs can be linked to TitleFormat Expr. Use tag names instead of TF expressions when possible (+ performance). 
	For example, see dateWeight: TF is used to have the same results for tracks with YYYY-MM tags or YYYY tags.
		- dateTag		 : $year(%date%)			-customNumTag : (unused by default)
		
	Genre and Style tags (or their remapped values) can be globally filtered. See 'genreStyleFilter'. Case sensitive.
	For example, when comparing genre values from track A to track B, 'Soundtrack' and 'Radio Program' values are omitted:
		- genreStyleFilter: Soundtrack,Radio Program
		
	There are 3 methods to calc similarity: WEIGHT, GRAPH and DYNGENRE.
		- WEIGHT: -> Score
				Uses genreWeight, styleWeight, moodWeight, keyWeight, dateWeight, dateRange, bpmWeight, bpmRange, composerWeight, customStrWeight, customNumWeight + scoreFilter
				Calculates similarity by scoring according to the tags. Similarity is calculated by simple string matching ('Rock' != 'Soul') and ranges for numeric tags. This means some coherence in tags is needed to make it work, and the script only works with high level data (tags) which should have
				been added to files previously using manual or automatic methods (like MusicBrainz Picard, see note at bottom).
		- GRAPH: -> Score + Distance
				Same than WEIGHT + max_graph_distance
				Apart from scoring, it compares the genre/styles tags set to the ones of the reference track using a graph and calculating their min. mean distance.
				Minimum mean distance is done considering (A,B,D) set matches (A,B,C) at 2 points (0 distance). So we only need to find the nearest point 
				from (A,B,D) to (C) which will be x. Then we calculate the mean distance dividing by the number of points of the reference track : (0 + 0 + x)/3
				Imagine Google maps for genre/styles, and looking for the distance from Rock to Jazz for ex. 'max_graph_distance' sets the max distance allowed, so every track with genre/styles farther than that value will not be included in the final pool. Note this is totally different to simple string matching, so 'Acid Rock' may be similar to 'Psychedelic Rock' even if they are totally different tag values (or strings). 
				This method is pretty computational intensive, we are drawing a map with all known genres/styles and calculating the shortest path between the reference track and all the tracks from the library (after some basic filtering). Somewhere between 2 and 5 secs for 40 K tracks.
				For a complete description of how it works check: 'helpers/music_graph_descriptors_xxx.js'
				And to see the map rendered in your browser like a map check: 'Draw Graph.html'
		- DYNGENRE: -> Score
				Same than WEIGHT + dyngenreWeight
				Uses a simplification of the GRAPH method. Let's say we assign a number to every 'big' cluster of points on the music graph, then we can simply
				put any genre/style point into any of those clusters and give them a value. So 'Rock' is linked to 3, the same than 'Roots Rock' or 'Rock & Roll'.
				It's a more complex method than WEIGHT, but less than GRAPH, which allows cross-linking between different genres breaking from string matching.
				For a complete description of how it works check: 'helpers/dyngenre_map_xxx.js'
		
	Any weight equal to zero or tag not set will be skipped for calcs. Therefore it's recommended to only use those really relevant, for speed improvements.
	There are a 3 exceptions to this rule, where tags are used beyond tag comparisons for scoring purposes:
		- dyngenreWeight > 0 & method = DYNGENRE:	genre and style tags will always be retrieved, even if their weight is set to 0. They will not be considered for
													scoring... but are needed to calculate dynGenre virtual tags.
		- method = GRAPH:							genre and style tags will always be retrieved, even if their weight is set to 0. They will not be considered for
													scoring... but are needed to calculate the distance in the graph between different tracks.
		- bInKeyMixingPlaylist = true:				key tags will always be retrieved, even if keyWeight is set to 0. This is done to create the special playlist
													even if keys are totally ignored for similarity scoring.
		
	Arguments: 	As object, anything not set uses default values set at properties panel.
		{	
			// --->Default args (aka properties from the panel)
			properties,
			panelProperties,
			sel, // Reference track, first item of active pls. if can't get focus item
			// --->Weights          
			genreWeight, styleWeight, dyngenreWeight, moodWeight, keyWeight, dateWeight, bpmWeight, composerWeight,	customStrWeight, customNumWeight,
			// --->Ranges (for associated weighting)
			dyngenreRange, dateRange, bpmRange, customNumRange,
			bNegativeWeighting, // Assigns negative score for numeric tags when they fall outside their range
			// --->Pre-Scoring Filters
			forcedQuery, // Query to filter library
			bUseAntiInfluencesFilter, // Filter anti-influences by query, before any scoring/distance calc. Stricter than distance checking.
			bUseInfluencesFilter, // Allow only influences by query, before any scoring/distance calc.
			// --->Scoring Method
			method,	// GRAPH, WEIGHT, DYNGENRE
			// --->Scoring filters
			scoreFilter, sbd_max_graph_distance, // Minimum score & max distance to include track on pool
			// --->Post-Scoring Filters
			poolFilteringTag, poolFilteringN, bPoolFiltering, // Allows only N +1 tracks per tag set on pool... like only 2 tracks per artist
			// --->Playlist selection
			bRandomPick, // Get randomly from pool
			probPick, // Get by scoring order but with x probability of being chosen from pool		
			playlistLength,	// Max playlist size
			// --->Playlist sorting
			bSortRandom, // Random sorting (independently of picking method)
			bProgressiveListOrder, // Following progressive changes on tags (score)
			bScatterInstrumentals, // Intercalate instrumental tracks breaking clusters if possible
			// --->Special Playlists
			bInKeyMixingPlaylist, // Key changes following harmonic mixing rules like a DJ
			bProgressiveListCreation, // Uses output tracks as new references, and so on...
			progressiveListCreationN, // > 1 and < 100
			// --->Console logging
			bProfile, bShowQuery, bShowFinalSelection, bSearchDebug // Different logs on console
			// --->Output
			bCreatePlaylist, // false: only outputs handle list
			
		}
			
	Examples: Some usage examples, most of them can be combined in some way (like A with H, etc.)
		A:  Random mix with only nearest tracks, most from the same decade
			args = {genreWeight: 15, styleWeight: 10, moodWeight: 5, keyWeight: 10, dateWeight: 10, bpmWeight: 5,  dateRange: 15, 
					bpmRange: 25, probPick: 100, scoreFilter: 60, sbd_max_graph_distance: 150, bRandomPick: true, method: 'GRAPH'};
			do_searchby_distance(args);
		
		B:	Random mix a bit varied on styles (but similar genres), most from the same decade. [like A with more diversity]
			args = {genreWeight: 10, styleWeight: 5, moodWeight: 5, keyWeight: 5, dateWeight: 25, bpmWeight: 5,  dateRange: 15, 
					bpmRange: 25, probPick: 100, scoreFilter: 60, sbd_max_graph_distance: 250, bRandomPick: true, method: 'GRAPH'};
			do_searchby_distance(args);
		
		C:	Random mix even more varied on styles/genres, most from the same decade.
			args = {genreWeight: 0, styleWeight: 5, moodWeight: 15, keyWeight: 10, dateWeight: 25, bpmWeight: 5,  dateRange: 15, 
					bpmRange: 25, probPick: 100, scoreFilter: 50, sbd_max_graph_distance: 300, bRandomPick: true, method: 'GRAPH'};
			do_searchby_distance(args);
			
		D: 	Random mix with different genres but same mood from any date.
			args = {genreWeight: 0, styleWeight: 5, moodWeight: 15, keyWeight: 10, dateWeight: 0, bpmWeight: 5, bpmRange: 25, 
			probPick: 100, scoreFilter: 50, sbd_max_graph_distance: 600, bRandomPick: true, method: 'GRAPH'};
			do_searchby_distance(args);
			
		E:  Uses the properties of the current panel to set all the arguments.
			do_searchby_distance();
			
		F:  Uses a properties object to set all the arguments. [like E but overriding the properties used, usually for merged buttons]
			args = {properties: yourPropertiesPairs}; // {key: [description, value], ...} see SearchByDistance_properties
			do_searchby_distance(args);		
			
		G:  Outputs only influences from any date. [doesn't output similar genre/style tracks but influences! May be similar too, but not required]
			args = {genreWeight: 5, styleWeight: 5, moodWeight: 15, keyWeight: 10, dateWeight: 0, bpmWeight: 10, bUseInfluencesFilter: true, 
			probPick: 100, scoreFilter: 40, sbd_max_graph_distance: 500, bRandomPick: true, method: 'GRAPH'};
			do_searchby_distance(args);
			
		H:  Uses the properties of the current panel, and allows only 2 tracks (n+1) per artist on the pool. [like E with pool filtering]
			args = {poolFilteringTag: 'artist', poolFilteringN: 1} // bPoolFiltering evaluates to true whenever poolFilteringN != -1
			do_searchby_distance(args);
		
		I:  Random mix even more varied on styles/genres, most from the same decade. [like C but WEIGHT method]
			args = {genreWeight: 10, styleWeight: 5, moodWeight: 5, keyWeight: 5, dateWeight: 25, bpmWeight: 5,  dateRange: 15, 
					bpmRange: 25, probPick: 100, scoreFilter: 60, bRandomPick: true, method: 'WEIGHT'};
			do_searchby_distance(args);
			
		J:  Mix with similar genre/styles using DYNGENRE method. The rest of the args are set according to the properties of the current panel.
			args = {dyngenreWeight: 20, dyngenreRange: 1, method: 'DYNGENRE'};
			do_searchby_distance(args);
			
		K:  Progressive list (n = 5) created with influences from any date.. [like G with recursive calls]
			args = {genreWeight: 5, styleWeight: 5, moodWeight: 15, keyWeight: 10, dateWeight: 0, bpmWeight: 10, bUseInfluencesFilter: true,
			probPick: 100, scoreFilter: 40, sbd_max_graph_distance: 500, bRandomPick: true, method: 'GRAPH', bProgressiveListCreation: true,
			progressiveListCreationN: 5};
			do_searchby_distance(args);
			
		L:  Harmonic mix with similar genre/styles using DYNGENRE method. keyWeight is set to zero because we want all possible tracks with any key
			within dyngenreRange on the pool. Harmonic mixing will choose which tracks/keys get to the playlist. [like J with harmonic mixing]
			args = {dyngenreWeight: 20, dyngenreRange: 1, keyWeight: 0, method: 'DYNGENRE', bInKeyMixingPlaylist: true};
			do_searchby_distance(args);
			
	Note about 'bProgressiveListCreation':
	Creating progressive lists involves recursive calls to the main function using a track from the previous call as new reference. Therefore calc time is O(n),
	where n is 'progressiveListCreationN'. Beware main function call involves O(i*j*k) time, where i is equal to num of tracks in library, j tags to check,
	and k tag values... total calc time may easily be greater than a minute as soon as you set 'progressiveListCreationN' greater than 5 for big libraries (40K).
			
	Note about genre/styles: 
	GRAPH method doesn't care whether 'Rock' is a genre or a style but the scoring part does! Both values are considered points without any distinction.
	Genre weight is related to genres, style weight is related to styles.... But there is a workaround, let's say you only use genre tags (and put all values
	together there). Then set style weight to zero. It will just check genre tags and the graph part will work the same anyway.
	
	Note about GRAPH/DYNGENRE exclusions: 
	Apart from the global filter (which applies to genre/style string matching for scoring purpose), there is another filtering done when mapping
	genres/styles to the graph or their associated static values. See 'map_distance_exclusions' at 'helpers/music_graph_descriptors_xxx.js'.
	It includes those genre/style tags which are not related to an specific musical genre. For ex. 'Acoustic' which could be applied to any genre.
	They are filtered because they have no representation on the graph, not being a real genre/style but a musical characteristic of any musical composition.
	Therefore, they are useful for similarity scoring purposes but not for the graph. That's why we don't use the global filter for them.
	This second filtering stage is not really needed, but it greatly speedups the calculations if you have tons of files with these tags! 
	In other words, any tag not included in 'helpers/music_graph_descriptors_xxx.js' as part of the graph will be omitted for distance calcs, 
	but you save time if you add it manually to the exclusions (otherwise the entire graph will be visited trying to find a match).
	
	Note about GRAPH substitutions: 
	The graph created follows a genre/style convention found at 'helpers/music_graph_descriptors_xxx.js'. That means than only things written there, with exactly
	the same name (including casing) will be found at the graph. As already noted, 'rock' will not be the same than 'Rock', neither 'Prog. Rock' and 'Progressive Rock'. This is a design decision, to force users to use a tag convention (whatever they want) and only one. See last note at bottom. As a workaround, since you
	don't have to follow my convention, there is a section named 'style_substitutions' which lets you tell the scripts that 'Prog. Rock' is the same than 
	'Progressive Rock' for example. So once you have all your library tagged as you please, you can either mass replace the different terms to follow the convention
	of the graph OR add substitutions for all of them. It has other complex uses too, but that goes beyond this doc. Check 'helpers/music_graph_descriptors_xxx.js'.
	
	Note about console logs: 
	The function assigns a score to every track and you can see the names - score (- graph distance) at console. The selected track will get a score = 100 and distance = 0. Then, the other tracks will get (lower or eq.) score and (greater or eq.) distance according to their similarity. You can toggle logging and profiling on/off setting the booleans within the function code (at their start).
	
	Note about graph configuration and error checking: 
	By default 'bGraphDebug' is set to true. That means it checks the graph files whenever you load the script (usually once per session). You can disable it (faster loading). If you edit 'helpers/music_graph_descriptors_xxx.js' file, it's advised to enable it at least once so you can check there are no obvious
	errors. The html rendering helps at that too (and also has debugging enabled by default).
	
	Note about editing 'helpers/music_graph_descriptors_xxx.js' or user file:
	Instead of editing the main file, you can add any edit to an user set file named 'helpers/music_graph_descriptors_xxx_user.js'. Check sample for more info.
	It's irrelevant whether you add your changes to the original file or the user's one but note on future script updates the main file may be updated too. 
	That means you will need to manually merge the changes from the update with your own ones, if you want them. That's the only 'problem' editing the main one. 
	Both the html and foobar scripts will use any setting on the user file (as if it were in the main file), so there is no other difference. 
	Anything at this doc which points to 'helpers/music_graph_descriptors_xxx.js' applies the same to 'helpers/music_graph_descriptors_xxx_user.js'.
	
	Note about buttons framework:
	When used along buttons framework, you must pass all arguments, along the new prefix and merged properties! See 'buttons_search_bydistance_customizable.js'
	
	Note about High Level data, tag coherence, automatic tagging and MusicBrainz Picard:
	Network players and servers like Spotify, Itunes Genius, YouTube, etc. offer similar services to these scripts. Whenever you play a track within their players,
	similar tracks are offered on a regular basis. All the work is done on the servers, so it seems to be magic for the user. There are 2 important caveats for 
	this approach: It only works because the tracks have been previously analyzed ('tagged') on their server. And all the data is closed source and network
	dependent. i.e. you can always listen to Spotify and your great playlist, at least while you pay them, those tracks are not removed for your region and you
	have a constant Internet connection.
	
	That music listening model has clear drawbacks, and while the purpose of this caveat is not talking about them, at least we have to note the closed source 
	nature of that analysis data. Spotify's data is not the same than Youtube's data... and for sure, you can not make use of that data for your library in any way. 
	Ironically, being at a point where machine learning and other methods of analysis are ubiquitous, they are mostly relegated behind a pay-wall. And every time
	a company or a developer wants to create similar features, they must start from scratch and create their own data models.
	
	An offline similar program which does the same would be MusicIP ( https://spicefly.com/article.php?page=what-is-musicip ). It appeared as a viable alternative
	to that model, offering both an Internet server and a complete ability to analyze files offline as fall-back. Nowadays, the company is gone, the software
	is obsolete (although usable!) and documentation is missing for advanced features. The main problems? It was meant as a standalone solution, so there is no
	easy way to	connect other programs to its local server to create playlists on demand. It can be done, but requires manually refreshing and maintaining 
	the server database with new tag changes, data analysis, and translating ratings (from foobar for ex.) to the program. The other big problem is analysis time.
	It may well take a minute per track when calculating all the data needed... and the data is also closed source (so it has no meaning outside the program).
	The reason it takes so much time is simple, the program was created when machine learning was not a reality. MusicIP may well have been ahead of its time.
	
	Back to topic, both online and offline methods due to its closed source nature greatly difficult interoperability between different programs and use-cases.
	These scripts offer a solution to both problems, relying only in offline data (your tags) and open source data (your tags again). But to make it work,
	the data (your tags) need relevant info. Since every user fills their tags without following an universal convention (most times leaving some tags unfilled),
	the only requirement for these scripts to work is tag coherence:
		- Tags must point to high-level data, so analysis (whether computational or human) must be done previously. 'Acoustic' or 'Happy' moods are high level data,
		'barkbands' with a list of values is low-level data (meant to be used to calculate high-level ones). See this for more info: https://acousticbrainz.org/data
		- Tags not present are simply skipped. The script doesn't expect any specific tag to work, except the obvious ones (can not use GRAPH method without
		genre/style tags). This is done to not enforce an specific set of tags, only the ones you need / use.
		- Tags are not hard-linked to an specific tag-name convention. Genre may have as tag name 'genre', 'my_genre' or 'hjk'.
		- Basic filtering features to solve some corner cases (for genre/styles).
		- Casing must be the same along all tags. i.e. 'Rock' always spelled as 'Rock'. Yes, it could be omitted using .toLowerCase(), but is a design decision, since it forces users to check the casing of their entire set of tags (ensuring a bit more consistency in other fields).
		- Reproducibility all along the library set. And this is the main point of tag coherence. 
		
	About Reproducibility: If two users tag a track with different genres or moods, then the results will be totally different. But that's not a problem as long as 
	every user applies its own 'logic' to their entire library. i.e. if you have half of your library tagged right and the other half with missing tags, 
	some wrongly set and others 'as is' when you got the files... then there is no coherence at all in your set of tracks nor your tags. Some follow a convention
	and others follow another convention. To help with that here are 2 advises: tag your tracks properly (I don't care about specific use-cases to solve what ifs)
	and take a look at MusicBrainz Picard (that's the open source part): https://picard.musicbrainz.org/
	Now, you DON'T need to change all your tags or your entire library. But Picard offers 3 tags using the high-level open source data of AcousticBraiz:
	mood, key and BPM. That means, you can use your manual set tags along those automatically set Picard's tags to fulfill both: your tag convention and reproducibility along your entire library. Also you can manually fix or change later any mood with your preferred editor or player. Picard also offers plugins
	to fill other tags like genres, composers, etc. Filling only empty tags, or adding them to the existing ones, replacing them, ... whatever you want.
	There are probably other solutions like fetching data from AllMusic (moods), lastFm (genres), Discogs (composers), etc. Use whatever you want as long as tag
	coherence and reproducibility are ensured. 
	
	What happens if you don't want to (re)tag your files with moods, bpm, key, splitting genres/styles, ...? Then you will miss that part, that's all. But it works.
	What about a library properly tagged but using 'rock' instead of 'Rock' or 'African Folk' instead of 'Nubian Folk' (although that's a bit racist you know ;)? Then use substitutions at 'helpers/music_graph_descriptors_xxx.js' (not touching your files) and/or use mass tagging utilities to replace values (touching them).
	And what about having some tracks of my library properly tagged and not others? Then... garbage in, garbage out. Your mileage may vary.
*/ 
/*
 	Last changes:
		- Speed improvements replacing arrays with sets in multiple places.
		- Speed improvements on tag filtering.
		- User file to overwrite\add\delete properties from 'music_graph_descriptors'. On new updates, it would never get overwritten.
		- Default arguments using object notation.
		- Pre-scoring filters
			- Anti-Influence filter: filter anti-influences by query for GRAPH Method.
			- Influence filter: gets only influences by query for GRAPH Method.
		- Post-scoring filters
			- Allow only N+1 tracks per tag on the pool. Configurable.
		- Link cache pre-calculated on startup with styles/genres present on library (instead of doing it on function evaluation later).
		- Apart from individual link caching, cache entire distance from set (A,B,C) to (X,Y,Z)
		- New Option: Scattering vocal & instrumental tracks, breaking clusters of instrumental tracks.
		- New Option: Progressive list ordering, having more different tracks the more you advance within a playlist (using probPick < 100 && bProgressiveListOrder)
		- New Option: Progressive playlist creation, uses one track as reference, and then uses the output tracks as new references, and so on...
		- 'Camelot Wheel':
			- Key matching is done using 'Camelot Wheel' logic, allowing similar keys by a range using a 'cross' (changing hour or letter, but both is penalized).
			- Keys are supported using standard notation (Ab, Am, A#, etc.) and flat or sharp equivalences.
			- For other key notations simple string matching will be used.
		- New Option: Dj-like playlist creation following harmonic mixing rules.
		- New Option: Negative scores for numeric tags when they fall outside range, configurable.
		- Can delete properties (bSbdDeleteArgProperties) which are also used as arguments to not clobber the properties panel (but you must provide defaults when calling the function).
		- Bugfix: crash when forcedQuery and calculated query were both empty. Query defaults to 'ALL' in those cases now.
		- Bugfix: crash with empty genreTag or styleTag while using GRAPH method. Now tags retrieval is skipped in those cases too.
		- Bugfix: distance was zero when joined genre/style set was empty using GRAPH method. calcMeanDistance: distance is Infinity in those cases now.
		- Sanity check for queries when executing them. Warns with popup instead of crashing when error.
		- Bugfix: harmonic mixing.
		- Bugfix: scatter instrumentals.
	TODO:
		- Allow multiple tracks as reference
			- Save references as json to create 'mood' file which can be exported.
			- Save references as playlist to create 'mood' playlist file which can be edited anytime.
			- Integrate within playlist manager (?) for automatic saving purpose
		- Fingerprint comparison for scoring?
			- Output just similar tracks by fingerprint
			- Give more weighting to similar tracks
		- Fine-tune Pre-filtering:
			- Fine-tune queries
		- Get data using MusicBrainz Ids for all tracks on library, save to json files and use them when no tags present
		- Support for more high-level data (https://acousticbrainz.org/data#sample-data):
			- danceability
			- gender
			- moods_mirex
			- timbre
			- tonal_atonal
			- voice_instrumental
			- Instruments
		- Make it easy to port the code to other frameworks outside foobar:
			- 'Include' replaced with 'import'
			- Properties are just objects
			- All graph calcs and descriptors are independent of foobar so they work 'as is'. That's the main feature and heaviest part.
			- All tag 'getValues' would be done using external libraries or native player's methods
			- Queries would be disabled (they are not intrinsic part of the code, just a speed optimization)
			- Handle lists should be replaced with similar objects
			- Console logs work as they are.
			- Helpers used don't need foobar at all (except the 'getValues' for tags obviously)
*/

include('..\\helpers-external\\ngraph\\a-star.js');
include('..\\helpers-external\\ngraph\\a-greedy-star.js');
include('..\\helpers-external\\ngraph\\NBA.js');
include('..\\helpers\\ngraph_helpers_xxx.js');
var bLoadTags = true; // This tells the helper to load tags descriptors extra files
include('..\\helpers\\helpers_xxx.js');
include('..\\helpers\\helpers_xxx_crc.js');
include('..\\helpers\\helpers_xxx_prototypes.js');
include('..\\helpers\\helpers_xxx_properties.js');
include('..\\helpers\\helpers_xxx_tags.js');
include('..\\helpers\\helpers_xxx_math.js');
include('..\\helpers\\camelot_wheel_xxx.js');
include('..\\helpers\\dyngenre_map_xxx.js');
include('..\\helpers\\music_graph_xxx.js');
include('..\\helpers\\music_graph_test_xxx.js');
include('remove_duplicates.js');

checkCompatible('1.6.1');

/* 
	Properties
*/
const SearchByDistance_properties = {
	genreWeight				: 	['Genre Weight for final scoring', 15],
	styleWeight				:	['Style Weight for final scoring', 15],
	dyngenreWeight			:	['Dynamic Genre Weight for final scoring (only with DYNGENRE method)', 40],
	dyngenreRange			:	['Dynamic Genre Range (only tracks within range will score)', 1],
	moodWeight				:	['Mood Weight for final scoring', 10],
	keyWeight				:	['Key Weight for final scoring', 5],
	keyRange				:	['Key Range (uses Camelot Wheel \'12 hours\' scale)', 1],
	dateWeight				:	['Date Weight for final scoring', 10],
	dateRange				:	['Date Range (only tracks within range will score positively)', 15],
	bpmWeight				:	['BPM Weight for final scoring', 5],
	bpmRange				:	['BPM Range in % (for considering BPM Weight)', 25],
	composerWeight			:	['Composer Weight for final scoring', 0],
	customStrWeight			:	['CustomStr Weight for final scoring', 0],
	customNumWeight			:	['CustomNum Weight for final scoring', 0],
	customNumRange			:	['CustomNum Range for final scoring', 0],
	genreTag				:	['To remap genre tag to other tag(s) change this (sep. by comma)', 'genre'],
	styleTag				:	['To remap style tag to other tag(s) change this (sep. by comma)', 'style'],
	moodTag					:	['To remap mood tag to other tag(s) change this (sep. by comma)', 'mood'],
	dateTag					:	['To remap date tag or TF expression change this (1 numeric value / track)', '$year(%date%)'],
	keyTag					:	['To remap key tag to other tag change this', 'key'],
	bpmTag					:	['To remap bpm tag to other tag change this (sep. by comma)', 'bpm'],
	composerTag				:	['To remap composer tag to other tag(s) change this (sep. by comma)', 'composer'],
	customStrTag			:	['To use a custom string tag(s) change this (sep.by comma)', ''],
	customNumTag			:	['To use a custom numeric tag or TF expression change this (1 numeric value / track)', ''],
	forcedQuery				:	['Forced query to pre-filter database (added to any other internal query)', 
								'NOT (%rating% EQUAL 2 OR %rating% EQUAL 1) AND NOT (STYLE IS Live AND NOT STYLE IS Hi-Fi) AND %channels% LESS 3 AND NOT COMMENT HAS Quad AND TITLE PRESENT AND ARTIST PRESENT AND DATE PRESENT'],
	bSameArtistFilter		:	['Exclude tracks by same artist', false],
	bUseAntiInfluencesFilter:	['Exclude anti-influences by query', false],
	bConditionAntiInfluences:	['Conditional anti-influences filter', false],
	bUseInfluencesFilter	:	['Allow only influences by query', false],
	bSimilArtistsFilter		:	['Allow only similar artists', false],
	genreStyleFilter		:	['Filter these values globally for genre/style (sep. by comma)', 'Children\'s Music'],
	scoreFilter				:	['Exclude any track with similarity lower than (in %)', 75],
	minScoreFilter			:	['Minimum in case there are not enough tracks (in %)', 70],
	sbd_max_graph_distance	:	['Exclude any track with graph distance greater than (only GRAPH method):', 'music_graph_descriptors.intra_supergenre'],
	method					:	['Method to use (\'GRAPH\', \'DYNGENRE\' or \'WEIGHT\')', 'WEIGHT'],
	bNegativeWeighting		:	['Assign negative score when tags fall outside their range', true],
	poolFilteringTag		:	['Filter pool by tag', 'artist'],
	poolFilteringN			:	['Allows only N + 1 tracks on the pool (-1 = disabled)', -1],
	bRandomPick				:	['Take randomly from pool? (not sorted by weighting)', true],
	probPick				:	['Probability of tracks being choosen for final mix (makes playlist a bit random!)', 100],
	playlistLength			:	['Max Playlist Mix length', 50],
	bSortRandom				:	['Sort final playlist randomly', true],
	bProgressiveListOrder	:	['Sort final playlist by score', false],
	bScatterInstrumentals	:	['Intercalate instrumental tracks', true],
	bInKeyMixingPlaylist	:	['DJ-like playlist creation, following harmonic mixing rules', false],
	bHarmonicMixDoublePass	:	['Harmonic mixing double pass to match more tracks', true],
	bProgressiveListCreation:	['Recursive playlist creation, uses output as new references', false],
	progressiveListCreationN:	['Steps when using recursive playlist creation (>1 and <100)', 4],
	playlistName			:	['Playlist name (TF allowed)', 'Search...']
};

Object.keys(SearchByDistance_properties).forEach( (key) => { // Checks
	if (key.toLowerCase().endsWith('weight')) {
		SearchByDistance_properties[key].push({greaterEq: 0, func: Number.isSafeInteger}, SearchByDistance_properties[key][1]);
	} else if (key.toLowerCase().endsWith('range')) {
		SearchByDistance_properties[key].push({greaterEq: 0, func: Number.isSafeInteger}, SearchByDistance_properties[key][1]);
	} else if (key.toLowerCase().endsWith('length')) {
		SearchByDistance_properties[key].push({greaterEq: 0, func: Number.isSafeInteger}, SearchByDistance_properties[key][1]);
	} else if (key.toLowerCase().endsWith('query')) {
		SearchByDistance_properties[key].push({func: (query) => {return checkQuery(query, true);}}, SearchByDistance_properties[key][1]);
	} else if (key.toLowerCase().endsWith('tag')) {
		SearchByDistance_properties[key].push({func: isStringWeak}, SearchByDistance_properties[key][1]);
	}
});
SearchByDistance_properties['genreStyleFilter'].push({func: isStringWeak}, SearchByDistance_properties['genreStyleFilter'][1]);
SearchByDistance_properties['method'].push({func: isStringWeak}, SearchByDistance_properties['method'][1]);
SearchByDistance_properties['sbd_max_graph_distance'].push({func: (x) => {return (isString(x) && music_graph_descriptors.hasOwnProperty(x.split('.').pop())) || isInt(x);}}, SearchByDistance_properties['sbd_max_graph_distance'][1]);
SearchByDistance_properties['playlistLength'].push({greater: 0, func: isInt}, SearchByDistance_properties['playlistLength'][1]);
SearchByDistance_properties['scoreFilter'].push({range: [[0,100]], func: isInt}, SearchByDistance_properties['scoreFilter'][1]);
SearchByDistance_properties['probPick'].push({range: [[1,100]], func: isInt}, SearchByDistance_properties['probPick'][1]);
SearchByDistance_properties['progressiveListCreationN'].push({range: [[2,99]], func: isInt}, SearchByDistance_properties['progressiveListCreationN'][1]);

const SearchByDistance_panelProperties = {
	bCacheOnStartup 		:	['Calculates link cache on script startup (instead of on demand)', true],
	bGraphDebug 			:	['Warnings about links/nodes set wrong', false],
	bSearchDebug			:	['Enables debugging console logs', false],
	bProfile 				:	['Enables profiling console logs', false],
	bShowQuery 				:	['Enables query console logs', false],	
	bBasicLogging 			:	['Enables basic console logs', true],
	bShowFinalSelection 	:	['Enables selection\'s final scoring console logs', true],
	firstPopup				:	['Search by distance: Fired once', false],
	descriptorCRC			:	['Graph Descriptors CRC', -1], // Calculated later on first time
	bAllMusicDescriptors	:	['Load All Music descriptors?', false],
	bLastfmDescriptors		:	['Load Last.fm descriptors?', false],
};

var sbd_prefix = 'sbd_';
if (typeof buttonsBar === 'undefined' && typeof bNotProperties === 'undefined') { // Merge all properties when not loaded along buttons
	// With const var creating new properties is needed, instead of reassigning using A = {...A,...B}
	Object.entries(SearchByDistance_panelProperties).forEach(([key, value]) => {SearchByDistance_properties[key] = value;});
	setProperties(SearchByDistance_properties, sbd_prefix);
} else { // With buttons, set these properties only once per panel
	setProperties(SearchByDistance_panelProperties, sbd_prefix);
}
const panelProperties = (typeof buttonsBar === 'undefined' && typeof bNotProperties === 'undefined') ? getPropertiesPairs(SearchByDistance_properties, sbd_prefix) : getPropertiesPairs(SearchByDistance_panelProperties, sbd_prefix);

// Info Popup
if (!panelProperties.firstPopup[1]) {
	panelProperties.firstPopup[1] = true;
	overwriteProperties(panelProperties); // Updates panel
	const readmeKeys = [{name: 'search_bydistance', title: 'Search by Distance'}, {name: 'tags_structure', title: 'Tagging requisites'}]; // Must read files on first execution
	readmeKeys.forEach((objRead) => {
		const readmePath = folders.xxx + 'helpers\\readme\\' + objRead.name + '.txt';
		const readme = _open(readmePath, utf8);
		if (readme.length) {fb.ShowPopupMessage(readme, objRead.title);}
	});
}

/* 
	Load additional descriptors: All Music, Last.fm, ...
*/
[
	{name: 'All Music', file: 'helpers\\music_graph_descriptors_xxx_allmusic.js', prop: 'bAllMusicDescriptors'},
	{name: 'Last.fm', file: 'helpers\\music_graph_descriptors_xxx_lastfm.js', prop: 'bLastfmDescriptors'}
].forEach((descr) => {
	if (panelProperties[descr.prop][1]) {
		if (_isFile(folders.xxx + descr.file)) {
			console.log(descr.name + '\'s music_graph_descriptors - File loaded: ' + folders.xxx + descr.file);
			include('..\\' + descr.file);
		}
	}
});

/* 
	Initialize maps/graphs at start. Global variables
*/
const all_music_graph = music_graph();
const [genre_map , style_map, genre_style_map] = dyngenre_map();
const kMoodNumber = 6;  // Used for query filtering, combinations of K moods for queries. Greater values will pre-filter better the library..
const influenceMethod = 'adjacentNodes'; // direct, zeroNodes, adjacentNodes, fullPath

/* 
	Reuse cache on the same session, from other panels and from json file
*/
// Only use file cache related to current descriptors, otherwise delete it
if (panelProperties.bProfile[1]) {var profiler = new FbProfiler('descriptorCRC');}
const descriptorCRC = crc32(JSON.stringify(music_graph_descriptors) + music_graph.toString() + calc_map_distance.toString() + calcMeanDistance.toString() + influenceMethod + 'v1.0.1');
const bMissmatchCRC = panelProperties.descriptorCRC[1] !== descriptorCRC;
if (bMissmatchCRC) {
	console.log('SearchByDistance: CRC mistmatch. Deleting old json cache.');
	_deleteFile(folders.data + 'searchByDistance_cacheLink.json');
	_deleteFile(folders.data + 'searchByDistance_cacheLinkSet.json');
	panelProperties.descriptorCRC[1] = descriptorCRC;
	overwriteProperties(panelProperties); // Updates panel
}
if (panelProperties.bProfile[1]) {profiler.Print();}
// Start cache
var cacheLink;
var cacheLinkSet;
if (_isFile(folders.data + 'searchByDistance_cacheLink.json')) {
	const data = loadCache(folders.data + 'searchByDistance_cacheLink.json');
	if (data.size) {cacheLink = data; console.log('SearchByDistance: Used Cache - cacheLink from file.');}
}
if (_isFile(folders.data + 'searchByDistance_cacheLinkSet.json')) {
	const data = loadCache(folders.data + 'searchByDistance_cacheLinkSet.json');
	if (data.size) {cacheLinkSet = data; console.log('SearchByDistance: Used Cache - cacheLinkSet from file.');}
}
// Delays cache update after startup (must be called by the button file if it's not done here)
if (typeof buttonsBar === 'undefined' && typeof bNotProperties === 'undefined') {debounce(updateCache, 3000)({properties: panelProperties});}
// Ask others instances to share cache on startup
if (typeof cacheLink === 'undefined') {
	window.NotifyOthers('SearchByDistance: requires cacheLink map', true);
}
if (typeof cacheLinkSet === 'undefined') {
	window.NotifyOthers('SearchByDistance: requires cacheLinkSet map', true);
}
async function updateCache({newCacheLink, newCacheLinkSet, bForce = false, properties = null} = {}) {
	if (typeof cacheLink === 'undefined' && !newCacheLink) { // only required if on_notify_data did not fire before
		if (panelProperties.bProfile[1]) {var profiler = new FbProfiler('calcCacheLinkSGV2');}
		if (panelProperties.bCacheOnStartup[1] || bForce) {
			const genreTag = properties && properties.hasOwnProperty('genreTag') ? properties.genreTag[1].split(/, */g).map((tag) => {return '%' + tag + '%';}).join('|') : '%genre%';
			const styleTag = properties && properties.hasOwnProperty('styleTag') ? properties.styleTag[1].split(/, */g).map((tag) => {return '%' + tag + '%';}).join('|') : '%style%';
			const tags = [genreTag, styleTag].filter(Boolean).join('|');
			console.log('SearchByDistance: tags used for cache - ' + tags);
			const tfo = fb.TitleFormat(tags);
			const styleGenres = new Set(tfo.EvalWithMetadbs(fb.GetLibraryItems()).join('|').split(/\| *|, */g)); // All styles/genres from library without duplicates
			cacheLink = await calcCacheLinkSGV2(all_music_graph, styleGenres);
		} else {
			cacheLink = new Map();
		}
		saveCache(cacheLink, folders.data + 'searchByDistance_cacheLink.json');
		if (panelProperties.bProfile[1]) {profiler.Print();}
		console.log('SearchByDistance: New Cache - cacheLink');
		window.NotifyOthers(window.Name + ' SearchByDistance: cacheLink map', cacheLink);
	} else if (newCacheLink) {
		cacheLink = newCacheLink;
	}
	if (typeof cacheLinkSet === 'undefined' && !newCacheLinkSet) { // only required if on_notify_data did not fire before
		cacheLinkSet = new Map();
		console.log('SearchByDistance: New Cache - cacheLinkSet');
		window.NotifyOthers(window.Name + ' SearchByDistance: cacheLinkSet map', cacheLinkSet);
	} else if (newCacheLinkSet) {
		cacheLinkSet = newCacheLinkSet;
	}
	// Multiple Graph testing and logging of results using the existing cache
	if (panelProperties.bSearchDebug[1]) {
		doOnce('Test 1',testGraph)(all_music_graph);
		doOnce('Test 2',testGraphV2)(all_music_graph);
	}
}

function onNotifyData(name, info) {
	if (name) {
		if (name.indexOf('SearchByDistance: requires cacheLink map') !== -1 && typeof cacheLink !== 'undefined' && cacheLink.size) { // When asked to share cache, delay 1 sec. to allow script loading
			debounce(() => {if (typeof cacheLink !== 'undefined') {window.NotifyOthers(window.Name + ' SearchByDistance: cacheLink map', cacheLink);}}, 1000)();
			console.log('SearchByDistance: Requested Cache - cacheLink.');
		}
		if (name.indexOf('SearchByDistance: requires cacheLinkSet map') !== -1 && typeof cacheLinkSet !== 'undefined' && cacheLinkSet.size) { // When asked to share cache, delay 1 sec. to allow script loading
			debounce(() => {if (typeof cacheLinkSet !== 'undefined') {window.NotifyOthers(window.Name + ' SearchByDistance: cacheLinkSet map', cacheLinkSet);}}, 1000)();
			console.log('SearchByDistance: Requested Cache - cacheLinkSet.');
		} 
		if (name.indexOf('SearchByDistance: cacheLink map') !== -1 && info) {
			console.log('SearchByDistance: Used Cache - cacheLink from other panel.');
			let data = JSON.parse(JSON.stringify([...info])); // Deep copy
			data.forEach((pair) => {if (pair[1].distance === null) {pair[1].distance = Infinity;}}); // stringify converts Infinity to null, this reverts the change
			updateCache({newCacheLink: new Map(data)});
		}
		if (name.indexOf('SearchByDistance: cacheLinkSet map') !== -1 && info) {
			console.log('SearchByDistance: Used Cache - cacheLinkSet from other panel.');
			let data = JSON.parse(JSON.stringify([...info])); // Deep copy
			data.forEach((pair) => {if (pair[1] === null) {pair[1] = Infinity;}}); // stringify converts Infinity to null, this reverts the change
			updateCache({newCacheLinkSet: new Map(data)});
		}
	}
}
if (typeof on_notify_data !== 'undefined') {
	const oldFunc = on_notify_data;
	on_notify_data = function(name, info) {
		oldFunc(name, info);
		onNotifyData(name, info);
	};
} else {var on_notify_data = onNotifyData;}

function onScriptUnload() {
	console.log('SearchByDistance: Saving Cache.');
	if (cacheLink) {saveCache(cacheLink, folders.data + 'searchByDistance_cacheLink.json');}
	if (cacheLinkSet) {saveCache(cacheLinkSet, folders.data + 'searchByDistance_cacheLinkSet.json');}
}
if (typeof on_script_unload !== 'undefined') {
	const oldFunc = on_script_unload;
	on_script_unload = function() {
		oldFunc();
		onScriptUnload();
	};
} else {var on_script_unload = onScriptUnload;}

/* 
	Warnings about links/nodes set wrong
*/
if (panelProperties.bGraphDebug[1]) {
	if (panelProperties.bProfile[1]) {var profiler = new FbProfiler('graphDebug');}
	graphDebug(all_music_graph);
	if (panelProperties.bProfile[1]) {profiler.Print();}
}

/* 
	Variables allowed at recipe files and automatic documentation update
*/
const recipeAllowedKeys = new Set(['name', 'properties', 'theme', 'recipe', 'genreWeight', 'styleWeight', 'dyngenreWeight', 'moodWeight', 'keyWeight', 'dateWeight', 'bpmWeight', 'composerWeight', 'customStrWeight', 'customNumWeight', 'dyngenreRange', 'keyRange', 'dateRange', 'bpmRange', 'customNumRange', 'bNegativeWeighting', 'forcedQuery', 'bSameArtistFilter', 'bConditionAntiInfluences', 'bUseAntiInfluencesFilter', 'bUseInfluencesFilter', 'bSimilArtistsFilter', 'method', 'scoreFilter', 'minScoreFilter', 'sbd_max_graph_distance', 'poolFilteringTag', 'poolFilteringN', 'bPoolFiltering', 'bRandomPick', 'probPick', 'playlistLength', 'bSortRandom', 'bProgressiveListOrder', 'bScatterInstrumentals', 'bInKeyMixingPlaylist', 'bProgressiveListCreation', 'progressiveListCreationN', 'playlistName', 'bProfile', 'bShowQuery', 'bShowFinalSelection', 'bBasicLogging', 'bSearchDebug', 'bCreatePlaylist']);
const recipePropertiesAllowedKeys = new Set(['genreTag', 'styleTag', 'moodTag', 'dateTag', 'keyTag', 'bpmTag', 'composerTag', 'customStrTag', 'customNumTag']);
const themePath = folders.xxx + 'presets\\Search by\\themes\\';
const recipePath = folders.xxx + 'presets\\Search by\\recipes\\';
if (!_isFile(folders.xxx + 'presets\\Search by\\recipes\\allowedKeys.txt') || bMissmatchCRC) {
	const data = [...recipeAllowedKeys].map((key) => {
		const propDescr = SearchByDistance_properties[key] || SearchByDistance_panelProperties[key];
		let descr = propDescr ? propDescr[0] : '';
		if (!descr.length) {
			if (key.toLowerCase().indexOf('properties') !== -1) {
				descr = {'Object properties to pass other arguments': 
					Object.fromEntries([...recipePropertiesAllowedKeys].map((key) => {return [key, (SearchByDistance_properties[key] || SearchByDistance_panelProperties[key])[0]];}))
				};
			}
			if (key === 'name') {descr = 'Preset name (instead of filename)';}
			if (key === 'theme') {descr = 'Load additional theme by file name or path';}
			if (key === 'recipe') {descr = 'Load additional recipe(s) by file name or path. Nesting and multiple values (array) allowed';}
			if (key === 'bPoolFiltering') {descr = 'Global enable/disable switch. Equivalent to setting poolFilteringN to >0 or -1';}
			if (key === 'bCreatePlaylist') {descr = 'Output results to a playlist or only for internal use';}
		}
		return [key, descr];
	});
	console.log('Updating recipes documentation at: ' + folders.xxx + 'presets\\Search by\\recipes\\allowedKeys.txt');
	_save(folders.xxx + 'presets\\Search by\\recipes\\allowedKeys.txt', JSON.stringify(Object.fromEntries(data), null, '\t'));
}

// 1900 ms 24K tracks GRAPH all default on i7 920 from 2008
// 3144 ms 46K tracks DYNGENRE all default on i7 920 from 2008
function do_searchby_distance({
								// --->Default args (aka properties from the panel and input)
								properties	 			= getPropertiesPairs(SearchByDistance_properties, sbd_prefix),
								panelProperties			= (typeof buttonsBar === 'undefined') ? properties : getPropertiesPairs(SearchByDistance_panelProperties, sbd_prefix),
								sel 					= fb.GetFocusItem(), // Reference track, first item of act. pls. if can't get focus item
								theme					= {}, // May be a file path or object with Arr of tags {name, tags: [{genre, style, mood, key, date, bpm, composer, customStr, customNum}]}
								recipe 					= {}, // May be a file path or object with Arr of arguments {genreWeight, styleWeight, ...}
								// --->Args modifiers
								bAscii					= true, // Sanitize all tag values with ACII equivalent chars // TODO
								bCapitalize				= true, // Sanitize all genre/style tag values with proper letter case // TODO
								// --->Weights
								genreWeight				= properties.hasOwnProperty('genreWeight') ? Number(properties['genreWeight'][1]) : 0, // Number() is used to avoid bugs with dates or other values...
								styleWeight				= properties.hasOwnProperty('styleWeight') ? Number(properties['styleWeight'][1]) : 0,
								dyngenreWeight			= properties.hasOwnProperty('dyngenreWeight') ? Number(properties['dyngenreWeight'][1]) : 0,
								moodWeight				= properties.hasOwnProperty('moodWeight') ? Number(properties['moodWeight'][1]) : 0,
								keyWeight				= properties.hasOwnProperty('keyWeight') ? Number(properties['keyWeight'][1]) : 0,
								dateWeight				= properties.hasOwnProperty('dateWeight') ? Number(properties['dateWeight'][1]) : 0,
								bpmWeight				= properties.hasOwnProperty('bpmWeight') ? Number(properties['bpmWeight'][1]) : 0,
								composerWeight 			= properties.hasOwnProperty('composerWeight') ? Number(properties['composerWeight'][1]) : 0,
								customStrWeight 		= properties.hasOwnProperty('customStrWeight') ? Number(properties['customStrWeight'][1]) : 0, // Only used if tag is set at properties
								customNumWeight 		= properties.hasOwnProperty('customNumWeight') ? Number(properties['customNumWeight'][1]) : 0, // Only used if tag is set at properties
								// --->Ranges (for associated weighting)
								dyngenreRange 			= dyngenreWeight !== 0 && properties.hasOwnProperty('dyngenreRange') ? Number(properties['dyngenreRange'][1]) : 0,
								keyRange 				= keyWeight !== 0 && properties.hasOwnProperty('keyRange') ? Number(properties['keyRange'][1]) : 0,
								dateRange				= dateWeight !== 0 && properties.hasOwnProperty('dateRange') ? Number(properties['dateRange'][1]) : 0,
								bpmRange				= bpmWeight !== 0 && properties.hasOwnProperty('bpmRange')? Number(properties['bpmRange'][1]) : 0,
								customNumRange 			= customNumWeight !== 0  && properties.hasOwnProperty('customNumRange') ? Number(properties['customNumRange'][1]) : 0,
								bNegativeWeighting		= properties.hasOwnProperty('bNegativeWeighting') ? properties['bNegativeWeighting'][1] : true, // Assigns negative score for num. tags when they fall outside range
								// --->Pre-Scoring Filters
								// Query to filter library
								forcedQuery				= properties.hasOwnProperty('forcedQuery') ? properties['forcedQuery'][1] : '',
								// Exclude same artist
								bSameArtistFilter		= properties.hasOwnProperty('bSameArtistFilter') ? properties['bSameArtistFilter'][1] : false,
								// Similar artists
								bSimilArtistsFilter		= properties.hasOwnProperty('bSimilArtistsFilter') ? properties['bSimilArtistsFilter'][1] : false, 
								// Filter anti-influences by query, before any scoring/distance calc.
								bConditionAntiInfluences= properties.hasOwnProperty('bConditionAntiInfluences') ? properties['bConditionAntiInfluences'][1] : false, // Only for specific style/genres (for ex. Jazz) 
								bUseAntiInfluencesFilter= !bConditionAntiInfluences && properties.hasOwnProperty('bUseAntiInfluencesFilter') ? properties['bUseAntiInfluencesFilter'][1] : false,
								// Allows only influences by query, before any scoring/distance calc.
								bUseInfluencesFilter	= properties.hasOwnProperty('bUseInfluencesFilter') ? properties['bUseInfluencesFilter'][1] : false, 
								// --->Scoring Method
								method					= properties.hasOwnProperty('method') ? properties['method'][1] : 'WEIGHT',
								// --->Scoring filters
								scoreFilter				= properties.hasOwnProperty('scoreFilter') ? Number(properties['scoreFilter'][1]) :  75,
								minScoreFilter			= properties.hasOwnProperty('minScoreFilter') ? Number(properties['minScoreFilter'][1]) :  scoreFilter - 10,
								sbd_max_graph_distance	= properties.hasOwnProperty('sbd_max_graph_distance') ? Number(properties['sbd_max_graph_distance'][1]) : Infinity,
								// --->Post-Scoring Filters
								// Allows only N +1 tracks per tag set... like only 2 tracks per artist, etc.
								poolFilteringTag 		= properties.hasOwnProperty('poolFilteringTag') ? properties['poolFilteringTag'][1].split(',').filter(Boolean) : [],
								poolFilteringN			= properties.hasOwnProperty('poolFilteringN') ? Number(properties['poolFilteringN'][1]) : -1,
								bPoolFiltering 			= poolFilteringN >= 0 && poolFilteringN < Infinity ? true : false,
								// --->Playlist selection
								// How tracks are chosen from pool
								bRandomPick				= properties.hasOwnProperty('bRandomPick') ? properties['bRandomPick'][1] : false, // Get randomly
								probPick				= properties.hasOwnProperty('probPick') ? Number(properties['probPick'][1]) : 100, // Get by scoring order but with x probability of being chosen
								playlistLength			= properties.hasOwnProperty('playlistLength') ? Number(properties['playlistLength'][1]) : 50, // Max playlist size
								// --->Playlist sorting
								// How playlist is sorted (independently of playlist selection)
								bSortRandom				= properties.hasOwnProperty('bSortRandom') ? properties['bSortRandom'][1] : false, // Random sorting 
								bProgressiveListOrder	= properties.hasOwnProperty('bProgressiveListOrder') ? properties['bProgressiveListOrder'][1] : false, // Sorting following progressive changes on tags (score)
								bScatterInstrumentals	= properties.hasOwnProperty('bScatterInstrumentals') ? properties['bScatterInstrumentals'][1] : false, // Intercalate instrumental tracks breaking clusters if possible
								// --->Special Playlists
								// Use previous playlist selection, but override playlist sorting, since they use their own logic
								bInKeyMixingPlaylist	= properties.hasOwnProperty('bInKeyMixingPlaylist') ? properties['bInKeyMixingPlaylist'][1] : false, // Key changes following harmonic mixing rules like a DJ
								bHarmonicMixDoublePass	= properties.hasOwnProperty('bHarmonicMixDoublePass') ? properties['bHarmonicMixDoublePass'][1] : false, // Usually outputs more tracks in harmonic mixing
								bProgressiveListCreation= properties.hasOwnProperty('bProgressiveListCreation') ? properties['bProgressiveListCreation'][1] : false, // Uses output tracks as new references, and so on...
								progressiveListCreationN= bProgressiveListCreation ? Number(properties['progressiveListCreationN'][1]) : 1, // > 1 and < 100
								// --->Console logging
								// Uses panelProperties instead of properties, so it always points to the right properties... used along buttons or not.
								// They are the same for all instances within the same panel
								bProfile 				= panelProperties.hasOwnProperty('bProfile') ? panelProperties['bProfile'][1] : false,
								bShowQuery 				= panelProperties.hasOwnProperty('bShowQuery') ? panelProperties['bShowQuery'][1] : true,
								bShowFinalSelection 	= panelProperties.hasOwnProperty('bShowFinalSelection') ? panelProperties['bShowFinalSelection'][1] : true,
								bBasicLogging			= panelProperties.hasOwnProperty('bBasicLogging') ? panelProperties['bBasicLogging'][1] : false,
								bSearchDebug 			= panelProperties.hasOwnProperty('bSearchDebug') ? panelProperties['bSearchDebug'][1] : false,
								// --->Output
								playlistName			= properties.hasOwnProperty('playlistName') ? properties['playlistName'][1] : 'Search...',
								bCreatePlaylist			= true, // false: only outputs handle list. To be used along other scripts and/or recursive calls
								} = {}) {
		const descr = music_graph_descriptors;
		const oldCacheLinkSize = cacheLink ? cacheLink.size : 0;
		const oldCacheLinkSetSize = cacheLinkSet ? cacheLinkSet.size : 0;
		// Recipe check
		const bUseRecipe = recipe && (recipe.length || Object.keys(recipe).length);
		const recipeProperties = {};
		if (bUseRecipe) {
			let path;
			if (isString(recipe)) { // File path
				path = !_isFile(recipe) && _isFile(recipePath + recipe) ? recipePath + recipe : recipe;
				recipe = _jsonParseFileCheck(path, 'Recipe json', 'Search by Distance', utf8);
				if (!recipe) {console.log('Recipe not found: ' + path); return;}
			}
			const name = recipe.hasOwnProperty('name') ? recipe.name : (path ? utils.SplitFilePath(path)[1] : '-no name-');
			// Rewrite args or use destruct when passing args
			// Sel is omitted since it's a function or a handle
			// Note a theme may be set within a recipe too, overwriting any other theme set
			// Changes null to infinity and not found theme filenames into full paths
			let bOverwriteTheme = false;
			if (recipe.hasOwnProperty('recipe')) { // Process nested recipes
				let toAdd = processRecipe(recipe.recipe);
				delete toAdd.recipe;
				Object.keys(toAdd).forEach((key) => {if (!recipe.hasOwnProperty(key)) {recipe[key] = toAdd[key];}});
			}
			Object.keys(recipe).forEach((key) => { // Process current recipe
				const value = recipe[key] !== null ? recipe[key] : Infinity;
				if (recipeAllowedKeys.has(key)) {
					if (key === 'name') {
						return;
					} else if (key === 'recipe') {
						return; // Skip, already processed
					} else if (key === 'properties') { // Overrule current ones (but don't touch original object!)
						const newProperties = recipe[key];
						if (newProperties) {
							Object.keys(newProperties).forEach((rKey) => {
								if (!properties.hasOwnProperty(rKey)) {console.log('Recipe has a property key not recognized: ' + rKey); return;}
								recipeProperties[rKey] = newProperties[rKey];
							});
						}
					} else {
						if (isStringWeak(value)) {
							eval(key + ' = \'' + value + '\'');
						} else if (isArrayStrings(value)) {
							const newVal = '\'' + value.join('\',\'') + '\'';
							eval(key + ' = [' + newVal + ']');
						} else {eval(key + ' = ' + value);}
						if (key === 'theme') {bOverwriteTheme = true;}
					}
				} else {console.log('Recipe has a variable not recognized: ' + key);}
			});
			if (bBasicLogging) {
				console.log('Using recipe as config: ' + name + (path ? ' (' + path + ')' : ''));
				if (bOverwriteTheme) {console.log('Recipe forces its own theme.');}
			}
		}
		// Parse args
		if (isString(sbd_max_graph_distance)) { // Safety check
			if (sbd_max_graph_distance.length >= 50) {
				console.log('Error parsing sbd_max_graph_distance (length >= 50): ' + sbd_max_graph_distance);
				return;
			}
			if (sbd_max_graph_distance.indexOf('music_graph_descriptors') === -1 || sbd_max_graph_distance.indexOf('()') !== -1 || sbd_max_graph_distance.indexOf(',') !== -1) {
				console.log('Error parsing sbd_max_graph_distance (is not a valid variable or using a func): ' + sbd_max_graph_distance);
				return;
			}
			const validVars = Object.keys(descr).map((key) => {return 'music_graph_descriptors.' + key;});
			if (sbd_max_graph_distance.indexOf('+') === -1 && sbd_max_graph_distance.indexOf('-') === -1 && sbd_max_graph_distance.indexOf('*') === -1 && sbd_max_graph_distance.indexOf('/') === -1 && validVars.indexOf(sbd_max_graph_distance) === -1) {
				console.log('Error parsing sbd_max_graph_distance (using no arithmethics or variable): ' + sbd_max_graph_distance);
				return;
			}
			sbd_max_graph_distance = Math.floor(eval(sbd_max_graph_distance));
			if (bBasicLogging) {console.log('Parsed sbd_max_graph_distance to: ' + sbd_max_graph_distance);}
		}
		// Theme check
		const bUseTheme = theme && (theme.length || Object.keys(theme).length);
		if (bUseTheme) {
			let path;
			if (isString(theme)) { // File path: try to use plain path or themes folder + filename
				path = !_isFile(theme) && _isFile(themePath + theme) ? themePath + theme : theme;
				theme = _jsonParseFileCheck(path, 'Theme json', 'Search by Distance', utf8);
				if (!theme) {return;}
			}
			
			// Array of objects
			const tagsToCheck = ['genre', 'style', 'mood', 'key', 'date', 'bpm', 'composer', 'customStr', 'customNum'];
			const tagCheck = theme.hasOwnProperty('tags') ? theme.tags.findIndex((tagArr) => {return isArrayEqual(Object.keys(tagArr), tagsToCheck);}) : 0;
			const bCheck = theme.hasOwnProperty('name') && tagCheck === -1;
			if (!bCheck) {
				console.log('Theme selected for mix is missing some keys: ' + (theme.hasOwnProperty('name') ? [...new Set(tagsToCheck).difference(new Set(Object.keys(theme.tags[tagCheck])))] : 'name'));
				return;
			}
			if (bBasicLogging) {
				console.log('Using theme as reference: ' + theme.name + (path ? ' (' + path + ')' : ''));
				console.log(theme);
			}
		}
		// Sel check
		if (!bUseTheme) {
			if (!sel) {
				console.log('No track\\theme selected for mix.');
				return;
			}
			if (bBasicLogging) {
				console.log('Using selection as reference: ' + fb.TitleFormat('[%track% - ]%title%').EvalWithMetadb(sel) + ' (' + sel.RawPath + ')');
			}
		}
		if (bProfile) {var test = new FbProfiler('do_searchby_distance');}
		
		// May be more than one tag so we use split(). Use filter() to remove '' values. For ex:
		// styleTag: 'tagName,, ,tagName2' => ['tagName','Tagname2']
		// We check if weights are zero first
		const genreTag = (genreWeight !== 0 || dyngenreWeight !== 0 || method === 'GRAPH') ? (recipeProperties.genreTag || properties.genreTag[1]).split(',').filter(Boolean) : [];
		const styleTag = (styleWeight !== 0 || dyngenreWeight !== 0 || method === 'GRAPH') ? (recipeProperties.styleTag || properties.styleTag[1]).split(',').filter(Boolean) : [];
		const moodTag = (moodWeight !== 0) ?(recipeProperties.moodTag || properties.moodTag[1]).split(',').filter(Boolean) : [];
		const dateTag = (dateWeight !== 0) ?(recipeProperties.dateTag || properties.dateTag[1]).split(',').filter(Boolean) : []; // This one only allows 1 value, but we put it into an array
		const keyTag = (keyWeight !== 0 || bInKeyMixingPlaylist) ? (recipeProperties.keyTag || properties.keyTag[1]).split(',').filter(Boolean) : []; // This one only allows 1 value, but we put it into an array
		const bpmTag = (bpmWeight !== 0) ? (recipeProperties.bpmTag || properties.bpmTag[1]).split(',').filter(Boolean) : []; // This one only allows 1 value, but we put it into an array
		const composerTag = (composerWeight !== 0) ? (recipeProperties.composerTag || properties.composerTag[1]).split(',').filter(Boolean) : [];
		const customStrTag = (customStrWeight !== 0) ? (recipeProperties.customStrTag || properties.customStrTag[1]).split(',').filter(Boolean) : [];
		const customNumTag = (customNumWeight !== 0) ? (recipeProperties.customNumTag || properties.customNumTag[1]).split(',').filter(Boolean) : []; // This one only allows 1 value, but we put it into an array
		
		// Check input
		playlistLength = (playlistLength >= 0) ? playlistLength : 0;
		probPick = (probPick <= 100 && probPick > 0) ? probPick : 100;
		scoreFilter = (scoreFilter <= 100 && scoreFilter >= 0) ? scoreFilter : 100;
		minScoreFilter = (minScoreFilter <= scoreFilter && minScoreFilter >= 0) ? minScoreFilter : scoreFilter;
		bPoolFiltering = bPoolFiltering && (poolFilteringN >= 0 && poolFilteringN < Infinity) ? true : false;
		if (bPoolFiltering && (!poolFilteringTag || !poolFilteringTag.length || !isArrayStrings(poolFilteringTag))) {fb.ShowPopupMessage('Tags for pool filtering are not set or have an invalid value:\n' + poolFilteringTag); return;}
		if (customNumTag.length > 1) { // Safety Check. Warn users if they try wrong settings
			if (bBasicLogging) {console.log('Check \'' + properties['customNumTag'][0] + '\' value (' + properties['customNumTag'][1] + '). Must be only one tag name!.');}
			return;
		}
		if (genreTag.length === 0 && styleTag.length === 0 && (method === 'GRAPH' || method === 'DYNGENRE')) { // Can not use those methods without genre/style tags at all
			if (bBasicLogging) {console.log('Check \'' + properties['genreTag'][0] + '\' and \''  + properties['styleTag'][0] + '\'. Both can not be empty when using GRAPH or DYNGENRE methods.');}
			return;
		}
		
		// Zero weights if there are no tag names to look for
		if (genreTag.length === 0) {genreWeight = 0;}
		if (styleTag.length === 0) {styleWeight = 0;}
		if (moodTag.length === 0) {moodWeight = 0;}
		if (dateTag.length === 0) {dateWeight = 0;}
		if (keyTag.length === 0) {keyWeight = 0; bInKeyMixingPlaylist = false;}
		if (bpmTag.length === 0) {bpmWeight = 0;}
		if (composerTag.length === 0) {composerWeight = 0;}
		if (customStrTag.length === 0) {customStrWeight = 0;}
		if (customNumTag.length === 0) {customNumWeight = 0;}
		
		if (method === 'DYNGENRE') {  // Warn users if they try wrong settings
			if (dyngenreWeight === 0) {
				if (bBasicLogging) {console.log('Check \'' + properties['dyngenreWeight'][0] + '\' value (' + dyngenreWeight + '). Must be greater than zero if you want to use DYNGENRE method!.');}
				return;
			} else {method = 'WEIGHT';} // For calcs they are the same!
		} else {dyngenreWeight = 0;}
	
		const totalWeight = genreWeight + styleWeight + dyngenreWeight +  moodWeight + keyWeight + dateWeight + bpmWeight + customStrWeight + customNumWeight + composerWeight; //100%
		const countWeights = (genreWeight ? 1 : 0) + (styleWeight ? 1 : 0) + (dyngenreWeight ? 1 : 0) + (moodWeight ? 1 : 0) + (keyWeight ? 1 : 0) + (dateWeight ? 1 : 0) + (bpmWeight ? 1 : 0) + (customStrWeight ? 1 : 0) + (customNumWeight ? 1 : 0) + (composerWeight ? 1 : 0);
		
		if (!playlistLength) {
			if (bBasicLogging) {console.log('Check \'Playlist Mix length\' value (' + playlistLength + '). Must be greater than zero.');}
            return;
		}
		if (!totalWeight && method === 'WEIGHT') {
			if (bBasicLogging) {
				if (properties['dyngenreWeight'][1] !== 0) {console.log('Check weight values, all are set to zero and ' + properties['dyngenreWeight'][0] + ' is not used for WEIGHT method.');}
				else {console.log('Check weight values, all are set to zero.');}
			}
			return;
		}
		
		try {fb.GetQueryItems(new FbMetadbHandleList(), forcedQuery);} // Sanity check
		catch (e) {fb.ShowPopupMessage('Query not valid, check forced query:\n' + forcedQuery); return;}
		// Query
		let query = [];
		let queryl = 0;
		
		// These should be music characteristics not genre/styles. Like 'electric blues' o 'acoustic', which could apply to any blues style... those things are not connected by graph, but considered only for weight scoring instead.
		const map_distance_exclusions = descr.map_distance_exclusions; // Set
		
		// Tag filtering: applied globally. Matched values omitted on both calcs, graph and scoring..
		// Add '' value to set so we also apply a ~boolean filter when evaluating. Since we are using the filter on string tags, it's good enough.
		// It's faster than applying array.filter(Boolean).filter(genreStyleFilter)
		const genreStyleFilter = properties['genreStyleFilter'][1].length ? new Set(properties['genreStyleFilter'][1].split(',').concat('')) : null;
		const bTagFilter = genreStyleFilter ? true : false; // Only use filter when required
		
		// Get the tag value. Skip those with weight 0 and get num of values per tag right (they may be arrays, single values, etc.)
		// We use flat since it's only 1 track: genre[0][i] === genre.flat()[i]
		// Also filter using boolean to remove '' values within an array, so [''] becomes [] with 0 length.
		// Using only boolean filter it's 3x faster than filtering by set
		const selHandleList = bUseTheme ? null : new FbMetadbHandleList(sel);
		const genre = (genreTag.length && (genreWeight !== 0 || dyngenreWeight !== 0 || method === 'GRAPH')) ? (bUseTheme ? theme.tags[0].genre : getTagsValuesV3(selHandleList, genreTag, true).flat()).filter(bTagFilter ? (tag) => !genreStyleFilter.has(tag) : Boolean): [];
		const style = (styleTag.length && (styleWeight !== 0 || dyngenreWeight !== 0 || method === 'GRAPH')) ? (bUseTheme ? theme.tags[0].style : getTagsValuesV3(selHandleList, styleTag, true).flat()).filter(bTagFilter ? (tag) => !genreStyleFilter.has(tag) : Boolean): [];
		const mood = (moodWeight !== 0) ? (bUseTheme ? theme.tags[0].mood : getTagsValuesV3(selHandleList, moodTag, true).flat()).filter(Boolean) : [];
		const composer = (composerWeight !== 0) ? (bUseTheme ? theme.tags[0].composer : getTagsValuesV3(selHandleList, composerTag, true).flat()).filter(Boolean) : [];
		const customStr = (customStrWeight !== 0) ? (bUseTheme ? theme.tags[0].customStr : getTagsValuesV3(selHandleList, customStrTag, true).flat()).filter(Boolean) : [];
		
		const restTagNames = [(keyWeight !== 0 || bInKeyMixingPlaylist) ? keyTag[0] : 'skip', (dateWeight !== 0) ? dateTag[0] : 'skip', (bpmWeight !== 0) ? bpmTag[0] : 'skip', (customNumWeight !== 0) ? customNumTag[0] : 'skip']; // 'skip' returns empty arrays...
		const [keyArr, dateArr, bpmArr, customNumArr] = bUseTheme ? [theme.tags[0].key, theme.tags[0].date, theme.tags[0].bpm, theme.tags[0].customNum]: getTagsValuesV4(selHandleList, restTagNames).flat();
		const key = (keyWeight !== 0 || bInKeyMixingPlaylist) ? keyArr[0] : '';
		const date =(dateWeight !== 0) ? Number(dateArr[0]) : 0;
		const bpm = (bpmWeight !== 0) ? Number(bpmArr[0]) : 0;
		const customNum = (customNumWeight !== 0) ? Number(customNumArr[0]) : 0;
		
		// Sets for later comparison
		const style_genreSet = new Set(genre.concat(style)).difference(map_distance_exclusions); // We remove exclusions
		const genreSet = new Set(genre);
		const styleSet = new Set(style);
		const moodSet = new Set(mood);
		const customStrSet = new Set(customStr);
		
		let originalWeightValue = 0;
		// Genres
        const genreNumber = genreSet.size;
		if (genreNumber !== 0) {
			originalWeightValue += genreWeight;
			if (genreWeight / totalWeight >= totalWeight / countWeights / 100) {
				queryl = query.length;
				query[queryl] = '';
				if (genreTag.length > 1) {query[queryl] += query_join(query_combinations(genre, genreTag, 'OR'), 'OR');}
				else {query[queryl] += query_combinations(genre, genreTag, 'OR');}
			}
		} else if (genreWeight !== 0 && bBasicLogging) {console.log('GenreWeight was not zero but selected track had no genre tags');}
        // Styles
		const styleNumber = styleSet.size;
		if (styleNumber !== 0) {
			originalWeightValue += styleWeight;
			if (styleWeight / totalWeight >= totalWeight / countWeights / 100) {
				queryl = query.length;
				query[queryl] = '';
				if (styleTag.length > 1) {query[queryl] += query_join(query_combinations(style, styleTag, 'OR'), 'OR');}
				else {query[queryl] += query_combinations(style, styleTag, 'OR');}
			}
		} else if (styleWeight !== 0 && bBasicLogging) {console.log('styleWeight was not zero but selected track had no style tags');}
		// Dyngenre
		const style_genre_length = style_genreSet.size;
		let dyngenreNumber = 0, dyngenre = [];
		if (dyngenreWeight !== 0 && style_genre_length !== 0) {
			// This virtual tag is calculated with previous values
			for (const style_genre_i of style_genreSet) {
				const dyngenre_i = genre_style_map.get(style_genre_i);
				if (dyngenre_i) {dyngenre = dyngenre.concat(dyngenre_i);}
			}
			dyngenreNumber = dyngenre.length;
			if (dyngenreNumber !== 0) {
				originalWeightValue += dyngenreWeight;
			}
		} else if (dyngenreWeight !== 0 && bBasicLogging) {console.log('dyngenreWeight was not zero but selected track had no style nor genre tags');}
        // Moods
		const moodNumber = moodSet.size;
		if (moodNumber !== 0) {
			originalWeightValue += moodWeight;
			if (moodWeight / totalWeight / moodNumber * kMoodNumber >= totalWeight / countWeights / 100) {
				queryl = query.length;
				query[queryl] = '';
				const k = moodNumber >= kMoodNumber ? kMoodNumber : moodNumber; //on combinations of 6
				const moodComb = k_combinations(mood, k);
				
				if (moodTag.length > 1) {query[queryl] += query_join(query_combinations(moodComb, moodTag, 'OR', 'AND'), 'OR');}
				else {query[queryl] += query_combinations(moodComb, moodTag, 'OR', 'AND');}
			}
		} else if (moodWeight !== 0 && bBasicLogging) {console.log('moodWeight was not zero but selected track had no mood tags');}
        // Key
		const keyLength = key.length;
		if (keyLength) {
			originalWeightValue += keyWeight;
			if (keyWeight / totalWeight >= totalWeight / countWeights / 100) {
				queryl = query.length;
				query[queryl] = '';
				// Cross on wheel with length keyRange, can change hour or letter, but not both without a penalty (-1 length)
				// Gets both, flat and sharp equivalences
				const camelotKey = camelotWheel.getKeyNotationObjectCamelot(key);
				if (camelotKey) {
					let nextKeyObj, nextKeyFlat, nextKeySharp;
					let keyComb = [];
					// Mayor axis with same letter
					nextKeyObj = {...camelotKey};
					for (let i = 0; i < keyRange; i++) {
						nextKeyObj = camelotWheel.energyBoost(nextKeyObj);
						nextKeyFlat = camelotWheel.wheelNotationSharp.get(nextKeyObj.hour)[nextKeyObj.letter];
						nextKeySharp = camelotWheel.wheelNotationFlat.get(nextKeyObj.hour)[nextKeyObj.letter];
						if (nextKeyFlat !== nextKeySharp) {keyComb.push('key IS ' + nextKeySharp + ' OR key IS ' + nextKeyFlat);}
						else {keyComb.push('key IS ' + nextKeySharp);}
					}
					nextKeyObj = {...camelotKey};
					for (let i = 0; i <  keyRange; i++) {
						nextKeyObj = camelotWheel.energyDrop(nextKeyObj);
						nextKeyFlat = camelotWheel.wheelNotationSharp.get(nextKeyObj.hour)[nextKeyObj.letter];
						nextKeySharp = camelotWheel.wheelNotationFlat.get(nextKeyObj.hour)[nextKeyObj.letter];
						if (nextKeyFlat !== nextKeySharp) {keyComb.push('key IS ' + nextKeySharp + ' OR key IS ' + nextKeyFlat);}
						else {keyComb.push('key IS ' + nextKeySharp);}
					}
					// Minor axis after changing letter
					nextKeyObj = {...camelotKey};
					nextKeyObj = camelotWheel.energySwitch(nextKeyObj);
					for (let i = 0; i <  keyRange - 1; i++) {
						nextKeyObj = camelotWheel.energyBoost(nextKeyObj);
						nextKeyFlat = camelotWheel.wheelNotationSharp.get(nextKeyObj.hour)[nextKeyObj.letter];
						nextKeySharp = camelotWheel.wheelNotationFlat.get(nextKeyObj.hour)[nextKeyObj.letter];
						if (nextKeyFlat !== nextKeySharp) {keyComb.push('key IS ' + nextKeySharp + ' OR key IS ' + nextKeyFlat);}
						else {keyComb.push('key IS ' + nextKeySharp);}
					}
					nextKeyObj = {...camelotKey};
					nextKeyObj = camelotWheel.energySwitch(nextKeyObj);
					for (let i = 0; i < keyRange - 1; i++) {
						nextKeyObj = camelotWheel.energyDrop(nextKeyObj);
						nextKeyFlat = camelotWheel.wheelNotationSharp.get(nextKeyObj.hour)[nextKeyObj.letter];
						nextKeySharp = camelotWheel.wheelNotationFlat.get(nextKeyObj.hour)[nextKeyObj.letter];
						if (nextKeyFlat !== nextKeySharp) {keyComb.push('key IS ' + nextKeySharp + ' OR key IS ' + nextKeyFlat);}
						else {keyComb.push('key IS ' + nextKeySharp);}
						i++;
					}
					// Different letter and same number
					nextKeyObj = {...camelotKey};
					nextKeyObj = camelotWheel.energySwitch(nextKeyObj);
					nextKeyFlat = camelotWheel.wheelNotationSharp.get(nextKeyObj.hour)[nextKeyObj.letter];
					nextKeySharp = camelotWheel.wheelNotationFlat.get(nextKeyObj.hour)[nextKeyObj.letter];
					if (nextKeyFlat !== nextKeySharp) {keyComb.push('key IS ' + nextKeySharp + ' OR key IS ' + nextKeyFlat);}
					else {keyComb.push('key IS ' + nextKeySharp);}
					// Same letter and number
					nextKeyObj = {...camelotKey};
					nextKeyFlat = camelotWheel.wheelNotationSharp.get(nextKeyObj.hour)[nextKeyObj.letter];
					nextKeySharp = camelotWheel.wheelNotationFlat.get(nextKeyObj.hour)[nextKeyObj.letter];
					if (nextKeyFlat !== nextKeySharp) {keyComb.push('key IS ' + nextKeySharp + ' OR key IS ' + nextKeyFlat);}
					else {keyComb.push('key IS ' + nextKeySharp);}
					// And combinate queries
					if (keyComb.length !== 0) {query[queryl] = query_join(keyComb, 'OR');}
				} else {query[queryl] = 'key IS ' + key;} // For non-standard notations just use simple matching
			}
		} else if (keyWeight !== 0 && bBasicLogging) {console.log('keyWeight was not zero but selected track had no key tags');}
		// Date
		if (date) {
			originalWeightValue += dateWeight;
			if (dateWeight / totalWeight >= totalWeight / countWeights / 100) {
				queryl = query.length;
				query[queryl] = '';
				const dateUpper = date + dateRange;
				const dateLower = date - dateRange;
				const tagNameTF = ((dateTag[0].indexOf('$') === -1) ? dateTag[0] : '"' + dateTag[0] + '"'); // May be a tag or a function...
				if (dateUpper !== dateLower) {query[queryl] += tagNameTF + ' GREATER ' + dateLower + ' AND ' + tagNameTF + ' LESS ' + dateUpper;} 
				else {query[queryl] += tagNameTF + ' EQUAL ' + date;}
			}
		} else if (dateWeight !== 0 && bBasicLogging) {console.log('dateWeight was not zero but selected track had no date tags');}
		// BPM
		if (bpm) {
			originalWeightValue += bpmWeight;
			if (bpmWeight / totalWeight >= totalWeight / countWeights / 100) {
				queryl = query.length;
				query[queryl] = '';
				const bmpUpper = round(bpm * (100 + bpmRange) / 100, 0);
				const bmpLower = round(bpm * (100 - bpmRange) / 100, 0);
				if (bmpUpper !== bmpLower) {query[queryl] += 'bpm GREATER ' + bmpLower + ' AND bpm LESS ' + bmpUpper;}
				else {query[queryl] += 'bpm EQUAL ' + bpm;}
			}
		} else if (bpmWeight !== 0 && bBasicLogging) {console.log('bpmWeight was not zero but selected track had no bpm tags');}
		// Composer
		const composerNumber = composer.length;
		if (composerNumber !== 0) {
			originalWeightValue += composerWeight;
			if ( composerWeight / totalWeight >= totalWeight / countWeights / 100) {
				queryl = query.length;
				query[queryl] = '';
				if (composerTag.length > 1) {query[queryl] += query_join(query_combinations(composer, composerTag, 'OR'), 'OR');}
				else {query[queryl] += query_combinations(style, composerTag, 'OR');}
			}
		} else if (composerWeight !== 0 && bBasicLogging) {console.log('composerWeight was not zero but selected track had no composer tags');}
        // customStringTag
		const customStrNumber = customStrSet.size;
		if (customStrNumber !== 0) {
			originalWeightValue += customStrWeight;
			if ( customStrWeight / totalWeight >= totalWeight / countWeights / 100) {
				queryl = query.length;
				query[queryl] = '';
				if (customStrTag.length > 1) {query[queryl] += query_join(query_combinations(customStr, customStrTag, 'OR'), 'OR');}
				else {query[queryl] += query_combinations(style, customStrTag, 'OR');}
			}
		} else if (customStrWeight !== 0 && bBasicLogging) {console.log('customStrWeight was not zero but selected track had no custom string tags');}
		// customNumTag
		if (customNum) {
			originalWeightValue += customNumWeight;
			if (customNumWeight / totalWeight >= totalWeight / countWeights / 100) {
				queryl = query.length;
				query[queryl] = '';
				const customNumUpper = customNum + customNumRange;
				const customNumLower = customNum - customNumRange;
				// If it worked like bpm in %...
				// let customNumUpper = round(customNum * (100 + customNumRange) / 100, 0);
				// let customNumLower = round(customNum * (100 - customNumRange) / 100, 0);
				const tagNameTF = ((customNumTag[0].indexOf('$') === -1) ? customNumTag[0] : '"' + customNumTag[0] + '"'); // May be a tag or a function...
				if (customNumUpper !== customNumLower) {query[queryl] += tagNameTF + ' GREATER ' + customNumLower + ' AND ' + tagNameTF + ' LESS ' + customNumUpper;}
				else {query[queryl] += tagNameTF + ' EQUAL ' + customNum;}
			}
		} else if (customNumWeight !== 0 && bBasicLogging) {console.log('customNumWeight was not zero but selected track had no custom number tags');}
		// Total score
		const originalScore = (originalWeightValue * 100) / totalWeight; // if it has tags missing then original Distance != totalWeight
		if (bProfile) {test.Print('Task #1: Reference track', false);}
		
        // Create final query
		// Pre filtering by query greatly speeds up the next part (weight and graph distance calcs), but it requires variable queries according to the weights.
		// i.e. if genreWeight is set too high, then only same genre tracks would pass the later score/distance filter... 
		// But having the same values for other tags could make the track pass to the final pool too, specially for Graph method. 
		// So a variable pre-filter would be needed, calculated according to the input weight values and -estimated- later filters scoring.
		// Also an input track missing some tags could break the pre-filter logic if not adjusted.
        queryl = query.length;
		if (queryl === 0) {
			if (!originalScore) {
				console.log('No query available for selected track. Probably missing tags!');
				return;
			} else {query[queryl] = '';} // Pre-Filter may not be relevant according to weights...
		}
		const querylength = query.length;
		if (method === 'WEIGHT' && dyngenreWeight === 0) { // Weight method. Pre-filtering is really simple...
			if (querylength === 1 && !query[0].length) {query[querylength] = '';}
			else {query[querylength] = query_join(query, 'OR');} //join previous query's
		} else if (method === 'WEIGHT' && dyngenreWeight !== 0) { //Dyngenre method.
			query[querylength] = ''; // TODO: Add weight query, now is dynamically set
		} else { // Graph Method
			let influencesQuery = [];
			if (bUseAntiInfluencesFilter || bConditionAntiInfluences) { // Removes anti-influences using queries
				let influences = [];
				style_genreSet.forEach((styleGenre) => {
					let anti = bConditionAntiInfluences ? descr.getConditionalAntiInfluences(styleGenre) : descr.getAntiInfluences(styleGenre);
					if (anti.length) {influences.push(...descr.replaceWithSubstitutionsReverse(anti));}
				});
				// Even if the argument is known to be a genre or style, the output values may be both, genre and styles.. so we use both for the query
				if (influences.length) {
					influences = [...new Set(influences)];
					let temp = query_combinations(influences, genreTag.concat(styleTag), 'OR'); // min. array with 2 values or more if tags are remapped
					temp = 'NOT (' + query_join(temp, 'OR') + ')'; // flattens the array
					influencesQuery.push(temp);
				}
			}
			if (bUseInfluencesFilter) { // Outputs only influences using queries (and changes other settings!)
				let influences = [];
				style_genreSet.forEach((styleGenre) => {
					let infl = descr.getInfluences(styleGenre);
					if (infl.length) {influences.push(...descr.replaceWithSubstitutionsReverse(infl));}
				});
				// Even if the argument is known to be a genre or style, the output values may be both, genre and styles.. so we use both for the query
				if (influences.length) {
					influences = [...new Set(influences)];
					let temp = query_combinations(influences, genreTag.concat(styleTag), 'OR'); // min. array with 2 values or more if tags are remapped
					temp = _p(query_join(temp, 'OR')); // flattens the array. Here changes the 'not' part
					influencesQuery.push(temp);
				}
			}
			
			query[querylength] = influencesQuery.length ? query_join(influencesQuery, 'AND') : ''; // TODO: Add weight query, now is dynamically set
		}
		if (bSameArtistFilter && !bUseTheme) {
			let tags = fb.TitleFormat('[%artist%]').EvalWithMetadb(sel).split(', ').filter(Boolean);
			let queryArtist = '';
			if (tags.length) {
				queryArtist = tags.map((artist) => {return 'ARTIST IS ' + artist;});
				queryArtist = 'NOT ' + _p(query_join(queryArtist, 'OR'));
			}
			if (queryArtist.length) {
				if (query[querylength].length) {query[querylength] = _p(query[querylength]) + ' AND ' + _p(queryArtist);}
				else {query[querylength] += queryArtist;}
			}
		}
		if (bSimilArtistsFilter && !bUseTheme) {
			const file = folders.data + 'searchByDistance_artists.json';
			const tagName = 'SIMILAR ARTISTS SEARCHBYDISTANCE';
			let similTags = fb.TitleFormat(_bt(tagName)).EvalWithMetadb(sel).split(', ').filter(Boolean);
			let querySimil = '';
			if (!similTags.length && _isFile(file)) {
				const data = _jsonParseFile(file, utf8);
				const artist = fb.TitleFormat('%artist%').EvalWithMetadb(sel);
				if (data) {
					const dataArtist = data.find((obj) => {return obj.artist === artist;});
					if (dataArtist) {dataArtist.val.forEach((artistObj) => {similTags.push(artistObj.artist);});}
				}
				if (!bSameArtistFilter) {similTags.push(artist);} // Always add the original artist as a valid value
			}
			if (similTags.length) {
				querySimil = similTags.map((artist) => {return 'ARTIST IS ' + artist;});
				querySimil = query_join(querySimil, 'OR');
			}
			if (querySimil.length) {
				if (query[querylength].length) {query[querylength] = _p(query[querylength]) + ' AND ' + _p(querySimil);}
				else {query[querylength] += querySimil;}
			}
		}
		if (forcedQuery.length) { //Add user input query to the previous one
			if (query[querylength].length) {query[querylength] = _p(query[querylength]) + ' AND ' + _p(forcedQuery);}
			else {query[querylength] += forcedQuery;}
		}
		if (!query[querylength].length) {query[querylength] = 'ALL';}
		
		// Load query
		if (bShowQuery) {console.log('Query created: ' + query[querylength]);}
		let handleList;
		try {handleList = fb.GetQueryItems(fb.GetLibraryItems(), query[querylength]);} // Sanity check
		catch (e) {fb.ShowPopupMessage('Query not valid. Check query:\n' + query[querylength]); return;}
		if (bBasicLogging) {console.log('Items retrieved by query: ' + handleList.Count + ' tracks');}
		if (bProfile) {test.Print('Task #2: Query', false);}
		// Find and remove duplicates ~600 ms for 50k tracks
		handleList = removeDuplicatesV2({handleList, sortOutput: '%title% - %artist% - %date%', checkKeys: ['title', 'artist', 'date']});
		
		const tracktotal = handleList.Count;
		if (bBasicLogging) {console.log('Items retrieved by query (minus duplicates): ' + tracktotal + ' tracks');}
		if (!tracktotal) {console.log('Query created: ' + query[querylength]); return;}
        // Compute similarity distance by Weight and/or Graph
		// Similar Artists, Similar Styles, Dynamic Genre, Date Range & Weighting
        let scoreData = [];
		
		if (method === 'GRAPH') { // Sort by the things we will look for at the graph! -> Cache speedup
			let tfo = fb.TitleFormat(genreTag.concat(styleTag).join('|'));
			handleList.OrderByFormat(tfo, 1);
		}
		if (bProfile) {test.Print('Task #3: Remove Duplicates and sorting', false);}
		
		// Get the tag values for all the handle list. Skip those with weight 0.
		// Now flat is not needed, we have 1 array of tags per track [i][j]
		// Also filter using boolean to remove '' values within an array, so [''] becomes [] with 0 length, but it's done per track.
		// Using only boolean filter it's 3x faster than filtering by set, here bTagFilter becomes useful since we may skip +40K evaluations 
		const genreHandle = (genreTag.length && (genreWeight !== 0 || dyngenreWeight !== 0 || method === 'GRAPH')) ? getTagsValuesV3(handleList, genreTag, true) : null;
		const styleHandle = (styleTag.length && (styleWeight !== 0 || dyngenreWeight !== 0 || method === 'GRAPH')) ? getTagsValuesV3(handleList, styleTag, true) : null;
		const moodHandle = (moodWeight !== 0) ? getTagsValuesV3(handleList, moodTag, true) : null;
		const composerHandle = (composerWeight !== 0) ? getTagsValuesV3(handleList, composerTag, true) : null;
		const customStrHandle = (customStrWeight !== 0) ? getTagsValuesV3(handleList, customStrTag, true) : null;
		const [keyHandle, dateHandle, bpmHandle, customNumHandle] = getTagsValuesV4(handleList, restTagNames);
		const titleHandle = getTagsValuesV3(handleList, ['title'], true);
		if (bProfile) {test.Print('Task #4: Library tags', false);}
		let i = 0;
		while (i < tracktotal) {
            let weightValue = 0;
			let mapDistance = Infinity; // We consider points are not linked by default
			let dyngenreNumberNew = 0;
			let dyngenreNew = [];
			
			// Get the tags according to weight and filter ''. Also create sets for comparison
			const genreNew = (genreWeight !== 0 || dyngenreWeight !== 0 || method === 'GRAPH') ? genreHandle[i].filter(bTagFilter ? (tag) => !genreStyleFilter.has(tag) : Boolean) : [];
			const styleNew = (styleWeight !== 0 || dyngenreWeight !== 0 || method === 'GRAPH') ? styleHandle[i].filter(bTagFilter ? (tag) => !genreStyleFilter.has(tag) : Boolean) : [];
			const moodNew = (moodWeight !== 0) ? moodHandle[i].filter(Boolean) : [];
			const genreNewSet = new Set(genreNew);
			const styleNewSet = new Set(styleNew);
			const moodNewSet = new Set(moodNew);
			
			const keyNew = (keyWeight !== 0) ? keyHandle[i][0] : '';
			const dateNew = (dateWeight !== 0) ? Number(dateHandle[i][0]) : 0;
			const bpmNew =(bpmWeight !== 0) ? Number(bpmHandle[i][0]) : 0;
			
			const composerNew = (composerWeight !== 0) ? composerHandle[i].filter(Boolean) : [];
			const customStrNew = (customStrWeight !== 0) ? customStrHandle[i].filter(Boolean) : [];
			const customNumNew = (customNumWeight !== 0) ? Number(customNumHandle[i][0]) : 0;
			const composerNewSet = new Set(composerNew);
			const customStrNewSet = new Set(customStrNew);
			
			const style_genreSetNew = new Set(genreNew.concat(styleNew)).difference(map_distance_exclusions); // Remove exclusions
			
			// O(i*j*k) time
			// i = # tracks retrieved by query, j & K = # number of style/genre tags
			if (genreWeight !== 0 && genreNumber !== 0 && genreNew.length) {
				let common = genreSet.intersectionSize(genreNewSet);
				if (common) {
					weightValue += genreWeight / genreNumber * common;
				}
			}
			
			if (styleWeight !== 0 && styleNumber !== 0 && styleNew.length) {
				let common = styleSet.intersectionSize(styleNewSet);
				if (common) {
					weightValue += styleWeight / styleNumber * common;
				}
			}
			
			if (moodWeight !== 0 && moodNumber !== 0 && moodNew.length) {
				let common = moodSet.intersectionSize(moodNewSet);
				if (common) {
					weightValue += moodWeight / moodNumber * common;
				}
			}
			
			if (keyWeight !== 0 && keyLength !== 0 && keyNew.length) {
				if (key === keyNew) { // Not only fastest but also allows for arbitrary key notations (although only using simple matching)
					weightValue += keyWeight;
				} else if (keyRange !== 0){
					const camelotKeyNew = camelotWheel.getKeyNotationObjectCamelot(keyNew);
					const camelotKey = camelotWheel.getKeyNotationObjectCamelot(key);
					if (camelotKey && camelotKeyNew) {
						const bLetterEqual = (camelotKey.letter === camelotKeyNew.letter);
						const hourDifference = keyRange - Math.abs(camelotKey.hour - camelotKeyNew.hour);
						// Cross on wheel with length keyRange + 1, can change hour or letter, but not both without a penalty
						if ((hourDifference < 0 && bNegativeWeighting) || hourDifference > 0) {
							weightValue += (bLetterEqual) ? ((hourDifference + 1)/ (keyRange + 1)) * keyWeight : (hourDifference / keyRange) * keyWeight;  //becomes negative outside the allowed range!
						}
					}
				}
			}
			
			if (dateWeight !== 0 && date !== 0) {
				if (dateNew !== 0) {
					if (date === dateNew){
						weightValue += dateWeight;
					} else if (dateRange !== 0) {
						const dateDifference = dateRange - Math.abs(date -  dateNew);
						if ((dateDifference < 0 && bNegativeWeighting) || dateDifference > 0) {
							weightValue += (dateDifference / dateRange) * dateWeight;  //becomes negative outside the allowed range!
						}
					}
				}
			}
			
			if (bpmWeight !== 0 && bpm !== 0) {
				if (bpmNew !== 0) {
					if (bpm === bpmNew){
						weightValue += bpmWeight;
					} else if (bpmRange !== 0) {
						const iRange = bpm * bpmRange / 100;
						const bpmdifference = iRange - Math.abs(bpm -  bpmNew);
						if ((bpmdifference < 0 && bNegativeWeighting) || bpmdifference > 0) {
							weightValue += (bpmdifference / bpmRange / bpm * 100 ) * bpmWeight; //becomes negative outside the allowed range!
						}
					}
				}
			}
			
			if (composerWeight !== 0 && composerNumber !== 0 && composerNew.length) {
				let common = composerSet.intersectionSize(composerNewSet);
				if (common) {
					weightValue += composerWeight / composerNumber * common;
				}
			}
			
			if (customStrWeight !== 0 && customStrNumber !== 0 && customStrNew.length) {
				let common = customStrSet.intersectionSize(customStrNewSet);
				if (common) {
					weightValue += customStrWeight / customStrNumber * common;
				}
			}
			
			if (customNumWeight !== 0 && customNum !== 0) {
				if (customNumNew !== 0) {
					if (customNum === customNumNew){
						weightValue += customNumWeight;
					} else if (customNumRange !== 0) {
						const customNumdifference = customNumRange - Math.abs(customNum - customNumNew);
						if ((customNumdifference < 0 && bNegativeWeighting) || customNumdifference > 0) {
							weightValue += (customNumdifference / customNumRange) * customNumWeight;  //becomes negative outside the allowed range!
						}
						// If it worked like bpm in %...
						// const iRange = customNum * customNumRange / 100;
						// const customNumdifference = iRange - Math.abs(customNum -  customNumNew);
						// weightValue += (customNumDifference / customNumRange / customNum* 100 ) * customNumWeight;
					}
				}
			}
			
			if (dyngenreWeight !== 0 && dyngenreNumber !== 0) {
				if (style_genreSetNew.size !== 0) {
					for (let style_genreNew_i of style_genreSetNew) {
						const dyngenre_i = genre_style_map.get(style_genreNew_i);
						if (dyngenre_i) {dyngenreNew = dyngenreNew.concat(dyngenre_i);}
					}
				}
				dyngenreNumberNew = dyngenreNew.length;
				if (dyngenreNumberNew !== 0) {
					let j = 0;
					while (j < dyngenreNumber) {
						let h = 0;
							while (h < dyngenreNumberNew) {
								if (dyngenreNew[h] === dyngenre[j]) {
									weightValue += dyngenreWeight / dyngenreNumber;
									break;
								} else if (dyngenreRange !== 0) {
									const [valueLower, valueUpper, lowerLimit, upperLimit] = cyclicTagsDescriptor['dynamic_genre'](dyngenre[j], dyngenreRange, true);
									if (valueLower !== -1) { //All or none are -1
										if (valueLower > dyngenre[j]) { // we reached the limits and swapped values (x - y ... upperLimit + 1 = lowerLimit ... x ... x + y ... upperLimit)
											if (lowerLimit <= dyngenreNew[h] && dyngenreNew[h] <= valueLower) {  // (lowerLimit , x)
												weightValue += dyngenreWeight / dyngenreNumber;
												break;
											}
											else if (valueLower <= dyngenreNew[h] && dyngenreNew[h] <= dyngenre[j]) {  // (x, x + y)
												weightValue += dyngenreWeight / dyngenreNumber;
												break;
											}
											else if (valueUpper <= dyngenreNew[h] && dyngenreNew[h] <= upperLimit) { // (x - y, upperLimit)
												weightValue += dyngenreWeight / dyngenreNumber;
												break;
											}
										} else if (valueLower <= dyngenreNew[h] && dyngenreNew[h] <= valueUpper) {
											weightValue += dyngenreWeight / dyngenreNumber;
											break;
										}
									}
								}
							h++;
						}
						j++;
					}
				}
			}
			const score = round(weightValue * 10000 / originalScore / totalWeight, 1); // The original track will get a 100 score, even if it has tags missing (original Distance != totalWeight)
			
			if (method === 'GRAPH') {
				// Create cache if it doesn't exist. It may happen when calling the function too fast on first init (this avoids a crash)!
				if (!cacheLink) {cacheLink = new Map();}
				if (!cacheLinkSet) {cacheLinkSet = new Map();}
				// Weight filtering excludes most of the tracks before other calcs -> Much Faster than later! (40k tracks can be reduced to just ~1k)
				if (score >= minScoreFilter) {
					// Get the minimum distance of the entire set of tags (track B, i) to every style of the original track (A, j): 
					// Worst case is O(i*j*k*lg(n)) time, greatly reduced by caching results (since tracks may be unique but not their tag values)
					// where n = # nodes on map, i = # tracks retrieved by query, j & K = # number of style/genre tags
					// Pre-filtering number of tracks is the best approach to reduce calc time (!)
					// Distance cached at 2 points, for individual links (Rock -> Jazz) and entire sets ([Rock, Alt. Rock, Indie] -> [Jazz, Swing])
					let mapKey = [[...style_genreSet].sort(),[...style_genreSetNew].sort()].join(' -> ');
					if (cacheLinkSet.has(mapKey)) { // Mean distance from entire set (A,B,C) to (X,Y,Z)
						mapDistance = cacheLinkSet.get(mapKey);
					} else { // Calculate it if not found
						mapDistance = calcMeanDistance(all_music_graph, style_genreSet, style_genreSetNew);
						cacheLinkSet.set(mapKey, mapDistance); // Caches the mean distance from entire set (A,B,C) to (X,Y,Z)
					}
				}
			} // Distance / style_genre_new_length < sbd_max_graph_distance / style_genre_length ?
			if (method === 'GRAPH') {
				if (mapDistance <= sbd_max_graph_distance) {
					scoreData.push({ index: i, name: titleHandle[i][0], score, mapDistance});
				}
			}
			if (method === 'WEIGHT') {
				if (score > minScoreFilter) {
					scoreData.push({ index: i, name: titleHandle[i][0], score });
				}
			}
            i++;
        }
		if (bProfile) {test.Print('Task #5: Score and Distance', false);}
		let poolLength = scoreData.length;
		if (method === 'WEIGHT') {
			scoreData.sort(function (a, b) {return b.score - a.score;});
			let i = 0;
			let bMin = false;
			while (i < poolLength) {
				const i_score = scoreData[i].score;
				if (i_score < scoreFilter) { //If below minimum score
					if (i >= playlistLength) { //Break when reaching required playlist length
						scoreData.length = i;
						break;
					} else if (i_score < minScoreFilter) { //Or after min score
						scoreData.length = i;
						bMin = true;
						break;
					}
				}
				i++;
			}
			poolLength = scoreData.length;
			if (bBasicLogging) {
				if (bMin && minScoreFilter !== scoreFilter) {console.log('Not enough tracks on pool with current score filter ' +  scoreFilter + '%, using minimum score instead ' + minScoreFilter + '%.');}
				console.log('Pool of tracks with similarity greater than ' + (bMin ? minScoreFilter : scoreFilter) + '%: ' + poolLength + ' tracks');
			}
		} 
		else { // GRAPH
			// Done on 3 steps. Weight filtering (done) -> Graph distance filtering (done) -> Graph distance sort
			// Now we check if all tracks are needed (over 'minScoreFilter') or only those over 'scoreFilter'.
			// TODO: FILTER DYNAMICALLY MAX DISTANCE*STYLES OR ABSOLUTE score?
			scoreData.sort(function (a, b) {return b.score - a.score;});
			let i = 0;
			let bMin = false;
			while (i < poolLength) {
				const i_score = scoreData[i].score;
				if (i_score < scoreFilter) {	//If below minimum score
					if (i >= playlistLength) {	//Break when reaching required playlist length
						scoreData.length = i;
						break;
					} else if (i_score < minScoreFilter) { //Or after min score
						scoreData.length = i;
						bMin = true;
						break;
					}
				}
				i++;
			}
			scoreData.sort(function (a, b) {return a.mapDistance - b.mapDistance;}); // First sorted by graph distance, then by weight
			poolLength = scoreData.length;
			if (bMin && minScoreFilter !== scoreFilter) {console.log('Not enough tracks on pool with current score filter ' +  scoreFilter + '%, using minimum score instead ' + minScoreFilter + '%.');}
			if (bBasicLogging) {console.log('Pool of tracks with similarity greater than ' + (bMin ? minScoreFilter : scoreFilter) + '% and graph distance lower than ' + sbd_max_graph_distance +': ' + poolLength + ' tracks');}
		}
		
		// Post Filter (note there are no real duplicates at this point)
		if (bPoolFiltering) {
			let handlePoolArray = [];
			let i = poolLength;
			while (i--) {handlePoolArray.push(handleList[scoreData[i].index]);}
			let handlePool = new FbMetadbHandleList(handlePoolArray);
			handlePool = removeDuplicates({handleList: handlePool, checkKeys: poolFilteringTag, nAllowed: poolFilteringN}); // n + 1
			const [titleHandlePool] = getTagsValuesV4(handlePool, ['title'], void(0), void(0), null);
			let filteredScoreData = [];
			i = 0;
			while (i < handlePool.Count) {
				let j = 0;
				while (j < poolLength) { 
					if (titleHandlePool[i][0] === scoreData[j].name) {
						filteredScoreData[i] = scoreData[j]; // Copies references
					}
					j++;
				}
				i++;
			}
			scoreData = filteredScoreData; // Maintains only selected references...
			poolLength = scoreData.length;
			if (bBasicLogging) {console.log('Pool of tracks after post-filtering, ' + ++poolFilteringN + ' tracks per ' + poolFilteringTag.join(', ') + ': ' + poolLength + ' tracks');}
		}	
		
		// Final selection
		// In Key Mixing or standard methods.
		let selectedHandlesArray = []; // Final playlist output
		let selectedHandlesData = []; // For console
		let finalPlaylistLength = 0;
		if (poolLength) {
			if (bInKeyMixingPlaylist) {
				// DJ-like playlist creation with key changes following harmonic mixing rules... Uses 9 movements described at 'camelotWheel' on camelot_wheel_xxx.js
				// The entire pool is considered, instead of using the standard playlist selection. Since the pattern is random, it makes no sense
				// to use any specific order of pre-selection or override the playlist with later sorting.
				// Also note the movements creates a 'path' along the track keys, so even changing or skipping one movement changes drastically the path;
				// Therefore, the track selection changes on every execution. Specially if there are not tracks on the pool to match all required movements. 
				// Those unmatched movements will get skipped (lowering the playlist length per step), but next movements are relative to the currently selected track... 
				// so successive calls on a 'small' pool, will give totally different playlist lengths. We are not matching only keys, but a 'key path', which is stricter.
				bSortRandom = bProgressiveListOrder = bScatterInstrumentals = false;
				if (key.length) {
					// Instead of predefining a mixing pattern, create one randomly each time, with predefined proportions
					const size = poolLength < playlistLength ? poolLength : playlistLength;
					const pattern = createHarmonicMixingPattern(size);  // On camelot_wheel_xxx.js
					if (bSearchDebug) {console.log(pattern);}
					let nextKeyObj;
					let keyCache = new Map();
					let keyDebug = [];
					let keySharpDebug = [];
					let patternDebug = [];
					let toCheck = new Set(Array(poolLength).fill().map((_, index) => index).shuffle());
					let nextIndexScore = 0;
					let nextIndex = scoreData[nextIndexScore].index; // Initial track, it will match most times the last reference track when using progressive playlists
					let camelotKeyCurrent, camelotKeyNew;
					for (let i = 0, j = 0; i < size - 1; i++) {
						// Search key
						const indexScore = nextIndexScore;
						const index = nextIndex;
						if (!keyCache.has(index)) {
							const keyCurrent = keyHandle[index][0];
							camelotKeyCurrent = keyCurrent.length ? camelotWheel.getKeyNotationObjectCamelot(keyCurrent) : null;
							if (camelotKeyCurrent) {keyCache.set(index, camelotKeyCurrent);}
						} else {camelotKeyCurrent = keyCache.get(index);}
						// Delete from check selection
						toCheck.delete(indexScore);
						if (!toCheck.size) {break;}
						// Find next key
						nextKeyObj = camelotKeyCurrent ? camelotWheel[pattern[i]]({...camelotKeyCurrent}) : null; // Applies movement to copy of current key
						if (nextKeyObj) { // Finds next track, but traverse pool with random indexes...
							let bFound = false;
							for (const indexNewScore of toCheck) {
								const indexNew = scoreData[indexNewScore].index;
								if (!keyCache.has(indexNew)) {
									const keyNew = keyHandle[indexNew][0];
									camelotKeyNew = keyNew.length ? camelotWheel.getKeyNotationObjectCamelot(keyNew) : null;
									if (camelotKeyNew) {keyCache.set(indexNew, camelotKeyNew);}
									else {toCheck.delete(indexNew);}
								} else {camelotKeyNew = keyCache.get(indexNew);}
								if (camelotKeyNew) {
									if (nextKeyObj.hour === camelotKeyNew.hour && nextKeyObj.letter === camelotKeyNew.letter) {
										selectedHandlesArray.push(handleList[index]);
										selectedHandlesData.push(scoreData[indexScore]);
										if (bSearchDebug) {keyDebug.push(camelotKeyCurrent); keySharpDebug.push(camelotWheel.getKeyNotationSharp(camelotKeyCurrent)); patternDebug.push(pattern[i]);}
										nextIndex = indexNew; // Which will be used for next movement
										nextIndexScore = indexNewScore; // Which will be used for next movement
										bFound = true;
										break;
									}
								}
							}
							if (!bFound) { // If nothing is found, then continue next movement with current track
								camelotKeyNew = camelotKeyCurrent; // For debug console on last item
								if (j === 1) {j = 0; continue;}  // try once retrying this step with default movement
								else {
									pattern[i] = 'perfectMatch';
									i--;
									j++;
								}
							} else {j = 0;} // Reset retry counter if found 
						} else { // No tag or bad tag
							i--;
							if (toCheck.size) {nextIndexScore = [...toCheck][0]; nextIndex = scoreData[nextIndexScore].index;} // If tag was not found, then use next handle
						}
					}
					// Add tail
					selectedHandlesArray.push(handleList[nextIndex]); 
					selectedHandlesData.push(scoreData[nextIndexScore]);
					if (bSearchDebug) {keyDebug.push(camelotKeyNew); keySharpDebug.push(camelotWheel.getKeyNotationSharp(camelotKeyNew));}
					// Double pass
					if (bHarmonicMixDoublePass && poolLength >= playlistLength) {
						let tempPlaylistLength = selectedHandlesArray.length;
						if (tempPlaylistLength < playlistLength) {
							const toAdd = {};
							const toAddData = {};
							const keyMap = new Map();
							// Find positions where the remainder tracks could be placed as long as they have the same key than other track
							for (let i = 0;  i < poolLength; i++) {
								const currTrackData = scoreData[i];
								if (selectedHandlesData.indexOf(currTrackData) === -1) {
									const matchIdx = selectedHandlesData.findIndex((selTrackData, j) => {
										let idx = -1;
										if (keyMap.has(j)) {idx = keyMap.get(j);}
										else {idx = scoreData.indexOf(selTrackData); keyMap.set(j, idx);}
										const selKey = keyHandle[idx];
										return selKey[0] === keyHandle[i][0];
									});
									if (matchIdx !== -1) {
										const currTrack = handleList[currTrackData.index];
										if (toAdd.hasOwnProperty(matchIdx)) {toAdd[matchIdx].push(currTrack); toAddData[matchIdx].push(currTrackData);}
										else {toAdd[matchIdx] = [currTrack]; toAddData[matchIdx] = [currTrackData];}
										tempPlaylistLength++;
									}
								}
								if (tempPlaylistLength >= playlistLength) {break;}
							}
							// Add items in reverse order to not recalculate new idx
							const indexes = Object.keys(toAdd).sort().reverse();
							if (indexes.length) {
								let count = 0;
								for (let idx of indexes) {
									selectedHandlesArray.splice(idx, 0, ...toAdd[idx]);
									selectedHandlesData.splice(idx, 0, ...toAddData[idx]);
									count += toAdd[idx].length;
								}
								if (bSearchDebug) {console.log('Added ' + count + ' items on second pass');}
							}
						}
						// Debug console: using double pass reports may not be accurate since tracks on second pass are skipped on log
						if (bSearchDebug) {
							console.log('Keys from selection:');
							console.log(keyDebug);
							console.log(keySharpDebug);
							console.log('Pattern applied:');
							console.log(patternDebug); // Always has one item less than key arrays
						}
					}
				} else {console.log('Warning: Can not create in key mixing playlist, selected track has not a key tag.');}
			} else { // Standard methods
				if (poolLength > playlistLength) {
					if (bRandomPick){	//Random from pool
						const numbers = Array(poolLength).fill().map((_, index) => index).shuffle();
						const randomseed = numbers.slice(0, playlistLength); //random numbers from 0 to poolLength - 1
						let i = 0;
						while (i < playlistLength) {
							const i_random = randomseed[i];
							selectedHandlesArray.push(handleList[scoreData[i_random].index]);
							selectedHandlesData.push(scoreData[i_random]);
							i++;
						}
					} else { 
						if (probPick < 100) {	//Random but starting from high score picked tracks
							let randomseed = 0;
							let indexSelected = new Set(); //Save index and handles in parallel. Faster than comparing handles.
							let i = 0;
							while (indexSelectionArray.length < playlistLength) {
								randomseed = Math.floor((Math.random() * 100) + 1);
								if (randomseed < probPick) {
									if (!indexSelected.has(scoreData[i].index)) { //No duplicate selection
										indexSelected.add(scoreData[i].index);
										selectedHandlesArray.push(handleList[scoreData[i].index]);
										selectedHandlesData.push(scoreData[i]);
									}
								}
								i++;
								if (i >= poolLength) { //Start selection from the beginning of pool
									i = 0;
								}
							}
						} else {	//In order starting from high score picked tracks
							let i = 0;
							while (i < playlistLength) {
								selectedHandlesArray.push(handleList[scoreData[i].index]);
								selectedHandlesData.push(scoreData[i]);
								i++;
							}
						}
					}
				} else {	//Entire pool
					let i = 0;
					while (i < poolLength) {
						selectedHandlesArray[i] = handleList[scoreData[i].index];
						selectedHandlesData.push(scoreData[i]);
						i++;
					}
					if (isFinite(playlistLength)) {
						if (method === 'GRAPH') {
							if (bBasicLogging) {
								let propertyText = properties.hasOwnProperty('sbd_max_graph_distance') ? properties['sbd_max_graph_distance'][0] : SearchByDistance_properties['sbd_max_graph_distance'][0];
								console.log('Warning: Final Playlist selection length (= ' + i + ') lower/equal than ' + playlistLength + ' tracks. You may want to check \'' + propertyText + '\' parameter (= ' + sbd_max_graph_distance + ').');
							}
						}
						if (bBasicLogging) {
							let propertyText = properties.hasOwnProperty('scoreFilter') ? properties['scoreFilter'][0] : SearchByDistance_properties['scoreFilter'][0];
							console.log('Warning: Final Playlist selection length (= ' + i + ') lower/equal than ' + playlistLength + ' tracks. You may want to check \'' + propertyText + '\' parameter (= ' + scoreFilter + '%).');
						}
					}
				}
			}
			
			// Final sorting
			// This are final sorting-only steps, which may override previous one(s). But always outputs the same set of tracks.
			// Sorting is disabled when using bInKeyMixingPlaylist for harmonic mixed playlists, since they have its own order.
			// bProgressiveListCreation also changes sorting, since it has its own order after playlist creation/sorting!
			finalPlaylistLength = selectedHandlesArray.length;
			// Note that bRandomPick makes playlist randomly sorted too (but using different sets of tracks on every call)!
			if (bSortRandom) {
				if (bProgressiveListOrder) {console.log('Warning: bSortRandom and bProgressiveListOrder are both set to true, but last one overrides random order.');}
				for (let i = finalPlaylistLength - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1));
					[selectedHandlesArray[i], selectedHandlesArray[j]] = [selectedHandlesArray[j], selectedHandlesArray[i]];
					[selectedHandlesData[i], selectedHandlesData[j]] = [selectedHandlesData[j], selectedHandlesData[i]];
				}
			}
			// Forces progressive changes on tracks, independently of the previous sorting/picking methods
			// Meant to be used along bRandomPick or low probPick, otherwise the playlist is already sorted!
			if (bProgressiveListOrder && (poolLength < playlistLength || bRandomPick || probPick < 100)) { //
				if (bSortRandom) {console.log('Warning: bProgressiveListOrder is overriding random sorting when used along bSortRandom.');}
				selectedHandlesData.sort(function (a, b) {return b.score - a.score;});
				selectedHandlesArray.sort(function (a, b) {return b.score - a.score;});
				if (method === 'GRAPH') { // First sorted by graph distance, then by score
					selectedHandlesData.sort(function (a, b) {return a.mapDistance - b.mapDistance;});
					selectedHandlesArray.sort(function (a, b) {return a.mapDistance - b.mapDistance;}); 
				}
			} else if (bProgressiveListOrder && !bRandomPick && probPick === 100) {console.log('Warning: bProgressiveListOrder has no use if tracks are already choosen by scoring order from pool.');}
			// Tries to intercalate vocal & instrumental tracks, breaking clusters of instrumental tracks. 
			// May override previous sorting methods (only for instrumental tracks). 
			// Finds instrumental track indexes, and move them to a random range without overlapping.
			if (bScatterInstrumentals) { // Could reuse scatter_by_tags but since we already have the tags... done here
				let newOrder = [];
				for (let i = 0; i < finalPlaylistLength; i++) {
					const index = selectedHandlesData[i].index;
					const genreNew = (genreWeight !== 0 || dyngenreWeight !== 0) ? genreHandle[index].filter(Boolean) : [];
					const styleNew = (styleWeight !== 0 || dyngenreWeight !== 0) ? styleHandle[index].filter(Boolean) : [];
					const tagSet_i = new Set(genreNew.concat(styleNew).map((item) => {return item.toLowerCase();}));
					if (tagSet_i.has('instrumental')) { // Any match, then add to reorder list
						newOrder.push(i);
					}
				}
				// Reorder
				const toMoveTracks = newOrder.length;
				if (bSearchDebug) {console.log('toMoveTracks: ' + toMoveTracks);}
				const scatterInterval = toMoveTracks ? Math.round(finalPlaylistLength / toMoveTracks) : 0;
				if (scatterInterval >= 2) { // Lower value means we can not uniformly scatter instrumental tracks, better left it 'as is'
					let removed = [], removedData = [];
					[...newOrder].reverse().forEach((index) => {
						removed.push(...selectedHandlesArray.splice(index, 1));
						removedData.push(...selectedHandlesData.splice(index, 1));
					});
					removed.reverse();
					removedData.reverse();
					removed.forEach((handle, index) => {
						const i_scatterInterval = index * scatterInterval;
						let j = Math.floor(Math.random() * (scatterInterval - 1)) + i_scatterInterval;
						if (j === 0 && scatterInterval > 2) {j = 1;} // Don't put first track as instrumental if possible
						if (bSearchDebug) {console.log('bScatterInstrumentals: ' + index + '->' + j);}
						selectedHandlesArray.splice(j, 0, handle); // (at, 0, item)
						selectedHandlesData.splice(j, 0, removedData[index]); // (at, 0, item)
					});
				} else if (toMoveTracks) {console.log('Warning: Could not scatter instrumentals. Interval is too low. (' + toMoveTracks + ' < 2)');}
			}
			
			// Progressive list creation, uses output tracks as new references, and so on...
			// Note it can be combined with 'bInKeyMixingPlaylist', creating progressive playlists with harmonic mixing for every sub-group of tracks
			if (bProgressiveListCreation) {
				if (progressiveListCreationN > 1 && progressiveListCreationN < 100) { // Safety limit
					const newPlaylistLength = Math.floor(playlistLength / (progressiveListCreationN + 1)); // First call also included N + 1!
					const firstPlaylistLength = newPlaylistLength + playlistLength % (progressiveListCreationN + 1); // Get most tracks from 1st call
					if (newPlaylistLength > 2) { // Makes no sense to create a list with groups of 1 or 2 tracks...
						if (finalPlaylistLength >= firstPlaylistLength) { // Don't continue if 1st playlist doesn't have required num of tracks
							selectedHandlesArray.length = firstPlaylistLength;
							// Use the track with less score from pool as new reference or the last track of the playlist when using 'In key mixing'
							let newSel = bInKeyMixingPlaylist ? selectedHandlesArray[firstPlaylistLength - 1] : handleList[scoreData[poolLength - 1].index];
							// Reuse arguments for successive calls and disable debug/logs and playlist creation
							let newArgs = {};
							for (let j = 0; j < arguments.length; j++) {newArgs = {...newArgs, ...arguments[j]};}
							newArgs = {...newArgs, bSearchDebug: false, bProfile: false, bShowQuery: false ,bShowFinalSelection: false, bProgressiveListCreation: false, bRandomPick: true, bSortRandom: true, bProgressiveListOrder: false, sel: newSel, bCreatePlaylist: false};
							// Get #n tracks per call and reuse lower scoring track as new selection
							let newSelectedHandlesArray;
							for (let i = 0; i < progressiveListCreationN; i++) {
								const prevtLength = selectedHandlesArray.length;
								if (bSearchDebug) {console.log('selectedHandlesArray.length: ' + prevtLength);}
								[newSelectedHandlesArray, , , newArgs['sel']] = do_searchby_distance(newArgs);
								// Get all new tracks, remove duplicates after merging with previous tracks and only then cut to required length
								selectedHandlesArray = removeDuplicatesV2({handleList: new FbMetadbHandleList(selectedHandlesArray.concat(newSelectedHandlesArray)), checkKeys: ['title', 'artist', 'date']}).Convert();
								if (selectedHandlesArray.length > prevtLength + newPlaylistLength) {selectedHandlesArray.length = prevtLength + newPlaylistLength;}
							}
						} else {console.log('Warning: Can not create a Progressive List. First Playlist selection contains less than the required number of tracks.');}
					} else {console.log('Warning: Can not create a Progressive List. Current finalPlaylistLength (' + finalPlaylistLength + ') and progressiveListCreationN (' + progressiveListCreationN + ') values would create a playlist with track groups size (' + newPlaylistLength + ') lower than the minimum 3.');}
				} else {console.log('Warning: Can not create a Progressive List. rogressiveListCreationN (' + progressiveListCreationN + ') must be greater than 1 (and less than 100 for safety).');}
			}
			// Logging
			if (bProfile) {test.Print('Task #6: Final Selection', false);}
			if (bShowFinalSelection && !bProgressiveListCreation) {
				let i = finalPlaylistLength;
				let conText = 'List of selected tracks:';
				while (i--) {conText += '\n                  ' + selectedHandlesData[i].name + ' - ' + selectedHandlesData[i].score + (typeof selectedHandlesData[i].mapDistance !== 'undefined' ? ' - ' + selectedHandlesData[i].mapDistance : '');}
				console.log(conText); // Much faster to output the entire list at once than calling log n times. It takes more than 2 secs with +50 Tracks!!
			}
		} else {
			if (bProfile) {test.Print('Task #6: Final Selection', false);}
			if (bBasicLogging) {
				let propertyText = '';
				if (method === 'GRAPH') {
					propertyText = properties.hasOwnProperty('sbd_max_graph_distance') ? properties['sbd_max_graph_distance'][0] : SearchByDistance_properties['sbd_max_graph_distance'][0];
					console.log('Warning: Final Playlist selection length (= ' + finalPlaylistLength + ') lower/equal than ' + playlistLength + ' tracks. You may want to check \'' + propertyText + '\' parameter (= ' + sbd_max_graph_distance + ').');
				}
				propertyText = properties.hasOwnProperty('scoreFilter') ? properties['scoreFilter'][0] : SearchByDistance_properties['scoreFilter'][0];
				console.log('Warning: Final Playlist selection length (= ' + finalPlaylistLength + ') lower/equal than ' + playlistLength + ' tracks. You may want to check \'' + propertyText + '\' parameter (= ' + scoreFilter + '%).');
			}
		}
		// Insert to playlist
		if (bCreatePlaylist) {
			// Look if target playlist already exists and clear it. Preferred to removing it, since then we can undo later...
			let playlistNameEval;
			const bIsTF =  /(%.*%)|(\$.*\(.*\))/.test(playlistName);
			if (bUseTheme) {
				const themeRegexp = /%sbd_theme%/gi;
				if (bIsTF && themeRegexp.test(playlistName)) {
					playlistNameEval = fb.TitleFormat(playlistName.replace(themeRegexp, '$puts(x,' + theme.name +')$get(x)')).Eval(true); // Hack to evaluate strings as true on conditional expressions
				} else {
					playlistNameEval = playlistName;
				}
			} else {
				playlistNameEval = bIsTF ? fb.TitleFormat(playlistName).EvalWithMetadb(sel) : playlistName;
			}
			let i = 0;
			const plc = plman.PlaylistCount;
			while (i < plc) {
				if (plman.GetPlaylistName(i) === playlistNameEval) {
					plman.ActivePlaylist = i;
					plman.UndoBackup(i);
					plman.ClearPlaylist(i);
					break;
				}
				i++;
			}
			if (i === plc) { //if no playlist was found before
				plman.CreatePlaylist(plc, playlistNameEval);
				plman.ActivePlaylist = plc;
			}
			const outputHandleList = new FbMetadbHandleList(selectedHandlesArray);
			plman.InsertPlaylistItems(plman.ActivePlaylist, 0, outputHandleList);
			if (bBasicLogging) {console.log('Final Playlist selection length: ' + finalPlaylistLength + ' tracks.');}
		} else {
			if (bBasicLogging) {console.log('Final selection length: ' + finalPlaylistLength + ' tracks.');}
		}
		// Share changes on cache (checks undefined to ensure no crash if it gets run on the first 3 seconds after loading a panel)
		if (typeof cacheLink !== 'undefined' && oldCacheLinkSize !== cacheLink.size && method === 'GRAPH') {window.NotifyOthers(window.Name + ' SearchByDistance: cacheLink map', cacheLink);}
		if (typeof cacheLinkSet !== 'undefined' && oldCacheLinkSetSize !== cacheLinkSet.size && method === 'GRAPH') {window.NotifyOthers(window.Name + ' SearchByDistance: cacheLinkSet map', cacheLinkSet);}
		// Output handle list (as array), the score data, current selection (reference track) and more distant track
		return [selectedHandlesArray, selectedHandlesData, sel, (poolLength ? handleList[scoreData[poolLength - 1].index] : -1)];
}


/* 
	Helpers
*/

// Get the minimum distance of the entire set of tags (track B, i) to every style of the original track (A, j): 
// worst case is O(i*j*k*lg(n)) time, greatly reduced by caching link distances.
// where n = # nodes on map, i = # tracks retrieved by query, j & K = # number of style/genre tags
// Pre-filtering number of tracks is the best approach to reduce calc time (!)
function calcMeanDistance(mygraph, style_genre_reference, style_genre_new) {
	if (!cacheLink) {cacheLink = new Map();}
	let mapDistance = Infinity;
	const difference = style_genre_reference.difference(style_genre_new);
	if (style_genre_reference.size === 0 || style_genre_new.size === 0) { // When no tags are available, sets are empty & tracks are not connected
		mapDistance = Infinity;
	} else { // With non-empty sets
		if (!difference.size) { // If style_genre_new is superset of style_genre_reference.
			mapDistance = 0;
		} else {
			let influenceDistance = 0;
			for (let style_genre of difference) { // No need to check for those already matched. We are making an assumption here... i.e. that A genre has zero distance to only one value: A. But not to multiple ones: A, B, etc. That possibility is given by zero weight substitutions, but in that case 'calc_map_distance' will output a zero distance too.
				let setMin = Infinity;
				for (let style_genreNew of style_genre_new) { // But we need the entire set of new genre/styles to check lowest distance
					let jh_distance = Infinity; // We consider points are not linked by default
					let jh_influenceDistance = 0;
					let bfoundcache = false;
					const id = [style_genre, style_genreNew].sort().join('-'); // A-B and B-A are the same link
					if (cacheLink.has(id)) { //style_genre_new changes more, so first one...
						const jh_link = cacheLink.get(id);
						jh_distance = jh_link.distance;
						jh_influenceDistance = jh_link.influenceDistance;
						bfoundcache = true;
					}
					if (!bfoundcache) { // Calc distances not found at cache. This is the heaviest part of the calc.
						[jh_distance, jh_influenceDistance] = calc_map_distance(mygraph, style_genre, style_genreNew, true, influenceMethod); 
						//Graph is initialized at startup
						cacheLink.set([style_genre, style_genreNew].sort().join('-'), {distance: jh_distance , influenceDistance: jh_influenceDistance}); // Sorting removes the need to check A-B and B-A later...
					}
					if (jh_distance < setMin) {setMin = jh_distance;}
					if (jh_influenceDistance !== 0) {influenceDistance += jh_influenceDistance;}
				}
				if (setMin < Infinity) { //Get the minimum distance of the entire set
					if (mapDistance === Infinity) { // If points were not linked before
							mapDistance = setMin;
					} else { // else sum the next minimum
						mapDistance += setMin;
						if (mapDistance === Infinity) {break;}
					}
				}
			}
			if (mapDistance < Infinity) { // If they are linked
				mapDistance += influenceDistance; // Adds positive/negative influence distance ('negative' means nearer...)
				mapDistance /= style_genre_new.size;  // mean distance
				mapDistance /= style_genre_reference.size;  // mean distance //TODO:
				mapDistance = round(mapDistance,1); // And rounds the final value
				if (mapDistance < 0) {mapDistance = 0;} // Safety check, since influence may lower values below zero
			}
		}
	}
	return mapDistance;
}

// Same than V1 but also checks for exclusions and arrays
function calcMeanDistanceV2(mygraph, style_genre_reference, style_genre_new) {
	// Convert to sets if needed
	if (Array.isArray(style_genre_reference)) {style_genre_reference = new Set(style_genre_reference);}
	if (Array.isArray(style_genre_new)) {style_genre_new = new Set(style_genre_new);}
	// Remove excluded styles
	const map_distance_exclusions = music_graph_descriptors.map_distance_exclusions;
	style_genre_reference = style_genre_reference.difference(map_distance_exclusions);
	style_genre_new = style_genre_new.difference(map_distance_exclusions);
	// And calc
	return calcMeanDistance(mygraph, style_genre_reference, style_genre_new);
}

// Finds distance between all SuperGenres present on foobar library. Returns a map with {distance, influenceDistance} and keys 'nodeA-nodeB'.
function calcCacheLinkSGV2(mygraph, styleGenres, limit = -1) {
	let nodeList = [];
	// Filter SGs with those on library
	const descr = music_graph_descriptors;
	nodeList = new Set([...descr.style_supergenre, ...descr.style_weak_substitutions, ...descr.style_substitutions, ...descr.style_cluster].flat(Infinity)); 
	nodeList = [...nodeList.intersection(styleGenres)];
	return new Promise((resolve) => {
		let cache = new Map();
		const promises = [];
		const total = nodeList.length - 1;
		let prevProgress = -1;
		for (let i = 0; i < total; i++) {
			for (let j = i + 1; j <= total; j++) {
				promises.push(new Promise((resolve) => {
					setTimeout(() => {
						let [ij_distance, ij_antinfluenceDistance] = calc_map_distance(mygraph, nodeList[i], nodeList[j], true, influenceMethod);
						if (limit === -1 || ij_distance <= limit) {
							// Sorting removes the need to check A-B and B-A later...
							cache.set([nodeList[i], nodeList[j]].sort().join('-'), {distance: ij_distance, influenceDistance: ij_antinfluenceDistance});
						}
						const progress = Math.round(i * j / (total * total) * 4) * 25;
						if (progress > prevProgress) {prevProgress = progress; console.log('Calculating graph links ' + progress + '%.');}
						resolve('done');
					}, iDelaySBDCache * j);
				}));
			}
		}
		Promise.all(promises).then(() => {
			resolve(cache);
		});
	});
}

// Save and load cache on json
function saveCache(cacheMap, path) {
	_save(path, JSON.stringify(Object.fromEntries(cacheMap), null, '\t'));
}

function loadCache(path) {
	let cacheMap = new Map();
	if (_isFile(path)) {
		if (utils.GetFileSize(path) > 400000000) {console.log('SearchByDistance: cache link file size exceeds 40 Mb, file is probably corrupted (try resetting it): ' + path);}
		let obj = _jsonParseFileCheck(path, 'Cache Link json', 'Search by Distance',  utf8);
		if (obj) { 
			obj = Object.entries(obj);
			obj.forEach((pair) => {
				if (pair[1] === null) {pair[1] = Infinity;} // TODO: Only 1 cache structure for both files
				if (pair[1].distance === null) {pair[1].distance = Infinity;}
			}); // stringify converts Infinity to null, this reverts the change
			cacheMap = new Map(obj);
		}
	}
	return cacheMap;
}

// Process nested recipes
function processRecipe(initialRecipe) {
	let toAdd = {};
	const processRecipeFile = (newRecipe) => {
		const newPath = !_isFile(newRecipe) && _isFile(recipePath + newRecipe) ? recipePath + newRecipe : newRecipe;
		const newRecipeObj = _jsonParseFileCheck(newPath, 'Recipe json', 'Search by Distance', utf8);
		if (!newRecipeObj) {console.log('Recipe not found: ' + newPath);}
		else {toAdd = {...newRecipeObj, ...toAdd};}
		return newRecipeObj;
	};
	let newRecipe = initialRecipe;
	while (newRecipe.length) {
		if (isString(newRecipe)) {
			const newRecipeObj = processRecipeFile(newRecipe);
			if (!newRecipeObj) {break;}
			newRecipe = newRecipeObj.recipe || '';
		} else if (isArrayStrings(newRecipe)) {
			for (const subRecipe of newRecipe) {
				const newRecipeObj = processRecipeFile(subRecipe);
				if (!newRecipeObj) {newRecipe = ''; break;}
				newRecipe = newRecipeObj.recipe || '';
				if (newRecipe.length) {toAdd = {...processRecipe(newRecipe), ...toAdd};}
			}
		} else {
			console.log('Recipe not found: ' + newRecipe);
			break;
		}
	}
	return toAdd;
}