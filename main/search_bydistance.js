'use strict';

/*	
	Search by Distance 03/05/21
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
		- Key tag using TF.
		- Allow multiple tracks as reference
			- Save references as json to create 'mood' file which can be exported.
			- Save references as playlist to create 'mood' playlist file which can be edited anytime.
			- Integrate within playlist manager (?) for automatic saving purpose
		- Clean unused things
		- Fingerprint comparison for scoring?
			- Output just similar tracks by fingerprint
			- Give more weighting to similar tracks
		- Fine-tune Pre-filtering:
			- Fine-tune queries
		- Different date formats or just TF? YYYY-MM-DD; YYYY-MM
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
include('..\\helpers\\music_graph_descriptors_xxx.js');
include('..\\helpers\\music_graph_xxx.js');
include('..\\helpers\\music_graph_test_xxx.js');
include('remove_duplicates.js');

/* 
	Properties
*/
const SearchByDistance_properties = {
	genreWeight				: 	['Genre Weight for final scoring', 15],
	styleWeight				:	['Style Weight for final scoring', 15],
	dyngenreWeight			:	['Dynamic Genre Weight for final scoring (only with DYNGENRE method)', 40],
	dyngenreRange			:	['1.Dynamic Genre Range (only tracks within range will score)', 1],
	moodWeight				:	['Mood Weight for final scoring', 10],
	keyWeight				:	['Key Weight for final scoring', 5],
	keyRange				:	['1.Key Range (uses Camelot Wheel \'12 hours\' scale)', 1],
	dateWeight				:	['Date Weight for final scoring', 10],
	dateRange				:	['1.Date Range (only tracks within range will score positively)', 15],
	bpmWeight				:	['BPM Weight for final scoring', 5],
	bpmRange				:	['1.BPM Range in % (for considering BPM Weight)', 25],
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
	bUseAntiInfluencesFilter:	['Filter anti-influences by query, before any scoring/distance calc', false],
	bUseInfluencesFilter:		['Allows only influences on the pool, before any scoring/distance calc', false],
	genreStyleFilter		:	['Filter these values globally for genre/style (sep. by comma)', 'Children\'s Music'],
	scoreFilter				:	['Exclude any track with similarity lower than (in %)', 75],
	sbd_max_graph_distance	:	['Exclude any track with graph distance greater than (only GRAPH method):', music_graph_descriptors.intra_supergenre],
	method					:	['Method to use (\'GRAPH\', \'DYNGENRE\' or \'WEIGHT\')', 'WEIGHT'],
	bNegativeWeighting		:	['Assigns negative score for numeric tags when they fall outside their range', true],
	poolFilteringTag		:	['Allows only N + 1 tracks on the pool per tag set', 'artist'],
	poolFilteringN			:	['Allows only N + 1 tracks on the pool (-1 = disabled)', -1],
	bRandomPick				:	['Take randomly from pool? (thus not sorted by weighting)', true],
	probPick				:	['Probability of track being choosen -after weighting- for final mix (makes playlist a bit random!)', 100],
	playlistLength			:	['Max Playlist Mix length', 50],
	bSortRandom				:	['Randomize sorting of final playlist? (not while picking from pool)', true],
	bScatterInstrumentals	:	['Intercalate instrumental tracks breaking clusters if possible', true],
	bProgressiveListOrder	:	['Sorting by score of final playlist? (not while picking from pool)', false],
	bInKeyMixingPlaylist	:	['DJ-like playlist creation with key changes following harmonic mixing rules', false],
	bProgressiveListCreation:	['Recursive playlist creation, uses output tracks as new references, ...', false],
	progressiveListCreationN:	['Steps when using recursive playlist creation (>1 and <100)', 4],
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
	}
});
SearchByDistance_properties['scoreFilter'].push({range: [[0,100]], func: Number.isSafeInteger}, SearchByDistance_properties['scoreFilter'][1]);
SearchByDistance_properties['probPick'].push({range: [[1,100]], func: Number.isSafeInteger}, SearchByDistance_properties['probPick'][1]);
SearchByDistance_properties['progressiveListCreationN'].push({range: [[2,99]], func: Number.isSafeInteger}, SearchByDistance_properties['progressiveListCreationN'][1]);

const SearchByDistance_panelProperties = {
	bCacheOnStartup 		:	['Calculates link cache on script startup (instead of on demand)', true],
	bGraphDebug 			:	['Warnings about links/nodes set wrong', false],
	bSearchDebug			:	['Enables debugging console logs', false],
	bProfile 				:	['Enables profiling console logs', false],
	bShowQuery 				:	['Enables query console logs', false],
	bBasicLogging 			:	['Enables basic console logs', true],
	bShowFinalSelection 	:	['Enables selection\'s final scoring console logs', true],
	firstPopup				:	['Search by distance: Fired once', false],
	descriptorCRC			:	['Graph Descriptors CRC', crc32(JSON.stringify(music_graph_descriptors))],
};

var sbd_prefix = 'sbd_';
if (typeof buttons === 'undefined' && typeof bNotProperties === 'undefined') { // Merge all properties when not loaded along buttons
	// With const var creating new properties is needed, instead of reassigning using A = {...A,...B}
	Object.entries(SearchByDistance_panelProperties).forEach(([key, value]) => {SearchByDistance_properties[key] = value;});
	setProperties(SearchByDistance_properties, sbd_prefix);
} else { // With buttons, set these properties only once per panel
	setProperties(SearchByDistance_panelProperties, sbd_prefix);
}
const panelProperties = (typeof buttons === 'undefined' && typeof bNotProperties === 'undefined') ? getPropertiesPairs(SearchByDistance_properties, sbd_prefix) : getPropertiesPairs(SearchByDistance_panelProperties, sbd_prefix);

// Info Popup
if (!panelProperties.firstPopup[1]) {
	panelProperties.firstPopup[1] = true;
	overwriteProperties(panelProperties); // Updates panel
	const readmePath = folders.xxx + 'helpers\\readme\\search_bydistance.txt';
	if (_isFile(readmePath)) {
		const readme = utils.ReadTextFile(readmePath, 65001);
		if (readme.length) {fb.ShowPopupMessage(readme, 'Search by Distance');}
	}
}

/* 
	Initialize maps/graphs at start. Global variables
*/
const all_music_graph = music_graph();
const [genre_map , style_map, genre_style_map] = dyngenre_map();
const kMoodNumber = 6;  // Used for query filtering, combinations of K moods for queries. Greater values will pre-filter better the library..

/* 
	Reuse cache on the same session, from other panels and from json file
*/
// Only use file cache related to current descriptors, otherwise delete it
if (panelProperties.bProfile[1]) {var profiler = new FbProfiler('descriptorCRC');}
const descriptorCRC = crc32(JSON.stringify(music_graph_descriptors));
if (panelProperties.descriptorCRC[1] !== descriptorCRC) {
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
// Delays update after startup
debounce(updateCache, 3000)();
// Ask others instances to share cache on startup
if (typeof cacheLink === 'undefined') {
	window.NotifyOthers('SearchByDistance: requires cacheLink map', true);
}
if (typeof cacheLinkSet === 'undefined') {
	window.NotifyOthers('SearchByDistance: requires cacheLinkSet map', true);
}
function updateCache({newCacheLink, newCacheLinkSet} = {}) {
	if (typeof cacheLink === 'undefined' && !newCacheLink) { // only required if on_notify_data did not fire before
		if (panelProperties.bProfile[1]) {var profiler = new FbProfiler('calcCacheLinkSGV2');}
		cacheLink = panelProperties.bCacheOnStartup[1] ? calcCacheLinkSGV2(all_music_graph) : new Map();
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
		window.NotifyOthers(window.Name + ' SearchByDistance: cacheLinkSet map', cacheLink);
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

// 1550 ms 24K tracks weight all default on i7 920 from 2008
// 1500 ms 24K tracks GRAPH all default on i7 920 from 2008
// 3500 ms 46K tracks DYNGENRE all default on i7 920 from 2008
function do_searchby_distanceV2(genreWeight				= Number(getProperties(SearchByDistance_properties, sbd_prefix)	['genreWeight'				]),
                                styleWeight				= Number(getProperties(SearchByDistance_properties, sbd_prefix)	['styleWeight'				]),
                                dyngenreWeight			= Number(getProperties(SearchByDistance_properties, sbd_prefix)	['dyngenreWeight'			]),
                                moodWeight				= Number(getProperties(SearchByDistance_properties, sbd_prefix)	['moodWeight'				]),
                                keyWeight				= Number(getProperties(SearchByDistance_properties, sbd_prefix)	['keyWeight'				]),
                                dateWeight				= Number(getProperties(SearchByDistance_properties, sbd_prefix)	['dateWeight'				]),
                                dateRange				= Number(getProperties(SearchByDistance_properties, sbd_prefix)	['dateRange'				]),
                                bpmWeight				= Number(getProperties(SearchByDistance_properties, sbd_prefix)	['bpmWeight'				]),
                                bpmRange				= Number(getProperties(SearchByDistance_properties, sbd_prefix)	['bpmRange'					]),
                                playlistLength			= Number(getProperties(SearchByDistance_properties, sbd_prefix)	['playlistLength'			]),
                                probPick				= Number(getProperties(SearchByDistance_properties, sbd_prefix)	['probPick'					]),
                                scoreFilter				= Number(getProperties(SearchByDistance_properties, sbd_prefix)	['scoreFilter'				]),
                                sbd_max_graph_distance	= Number(getProperties(SearchByDistance_properties, sbd_prefix)	['sbd_max_graph_distance'	]),
                                bRandomPick				= getProperties(SearchByDistance_properties, sbd_prefix)		['bRandomPick'				],
                                method					= getProperties(SearchByDistance_properties, sbd_prefix)		['method'					],
                                forcedQuery				= getProperties(SearchByDistance_properties, sbd_prefix)		['forcedQuery'				],
                                bSortRandom				= getProperties(SearchByDistance_properties, sbd_prefix)		['bSortRandom'				],
								prefix = sbd_prefix, 
								newProperties = SearchByDistance_properties
							) { // Number() is used to avoid bugs with dates or other values...
								// getPropertyByKey would be faster or calling getProperties once.
		// Check input
		playlistLength = (playlistLength >= 0) ? playlistLength : 0;
		probPick = (probPick <= 100 && probPick > 0) ? probPick : 100;
		scoreFilter = (scoreFilter <= 100 && scoreFilter >= 0) ? scoreFilter : 100;
		const sbd_distanceFilter_dyngenre_below = 5;
		const sbd_distanceFilter_graph_below = 10;
		
		// Configuration
		const properties = getPropertiesPairs(newProperties, prefix); // Load once! [0] = descriptions, [1] = values set by user (not defaults!)
		const genreTag = properties['genreTag'][1];
		const styleTag = properties['styleTag'][1];
		const moodTag = properties['moodTag'][1];
		const poolFilteringArray = ['artist'];
		// let bPoolFiltering = isArrayStrings(poolFilteringArray);
		const bPoolFiltering = false;
		const bProfile = false;
		const bShowQuery = true;
		const bShowFinalSelection = true;
		if (bProfile) {var test = new FbProfiler('Group #1');}
		// if (bProfile) {test.Print('\nTask #1:', false);}
		
		
		if (method === 'DYNGENRE') {  // Warn users if they try wrong settings
			if (dyngenreWeight === 0) {
				console.log('Check "' + properties['dyngenreWeight'][0] + '" value (' + dyngenreWeight + '). Must be greater than zero if you want to use DYNGENRE method!.');
				return;
			} else {method = 'WEIGHT';} // For calcs they are the same!
		} else {dyngenreWeight = 0;}
	
		let minFilter;
		if (method === 'GRAPH') {
			dyngenreWeight = 0;
			minFilter = scoreFilter - sbd_distanceFilter_graph_below;
		} else {minFilter = scoreFilter - sbd_distanceFilter_dyngenre_below;}
		
		const totalweight = genreWeight + styleWeight + dyngenreWeight +  moodWeight + keyWeight + dateWeight + bpmWeight; //100%
		const countweights = (genreWeight ? 1 : 0) + (styleWeight ? 1 : 0) + (dyngenreWeight ? 1 : 0) + (moodWeight ? 1 : 0) + (keyWeight ? 1 : 0) + (dateWeight ? 1 : 0) + (bpmWeight ? 1 : 0);
		let originaldistance = 0;
    
		if (!playlistLength) {
			console.log('Check "Playlist Mix length" value (' + playlistLength + '). Must be greater than zero.');
            return;
		}
		if (!totalweight && method !== 'GRAPH') {
			console.log('Check weight values, all are set to zero');
            return;
		}
		const sel = fb.GetFocusItem();
        if (!sel) {
			console.log('No track selected for mix.');
            return;
		}
		try {fb.GetQueryItems(new FbMetadbHandleList(), forcedQuery);} // Sanity check
		catch (e) {fb.ShowPopupMessage('Query not valid, check forced query:\n' + forcedQuery); return;}
		
		// Look if target playlist already exists and clear it. Preferred to removing it, since then we could undo later...
		const playlist_name = 'Search...';
		let i = 0;
		const plc = plman.PlaylistCount;
        while (i < plc) {
            if (plman.GetPlaylistName(i) === playlist_name) {
				plman.ActivePlaylist = i;
				plman.UndoBackup(plman.ActivePlaylist);
				plman.ClearPlaylist(plman.ActivePlaylist);
				break;
            } else {
                i++;
			}
        }
		if (i === plc) { //if no playlist was found before
			plman.CreatePlaylist(plc, playlist_name);
			plman.ActivePlaylist = plc;
		}
        
        // Query
        let query = [];
		let queryl = query.length;
		
		// These should be music characteristics not genre/styles. Like "electric blues" o "acoustic", which could be any blues style... those things are not connected by graph, but considered as weight variables instead.
		const map_distance_exclusions = music_graph_descriptors.map_distance_exclusions; // Set
		
		const [keyArr, dateArr, bpmArr] = getTagsValuesV4(new FbMetadbHandleList(sel), ['key','date','bpm']).flat(); 	//We use flat since it's only 1 track. i.e. genre[0][i] === genre.flat()[i]
		const genre = getTagsValuesV3(new FbMetadbHandleList(sel), [genreTag], true).flat().filter(Boolean); 	//We use flat since it's only 1 track. i.e. genre[0][i] === genre.flat()[i]
		const style = getTagsValuesV3(new FbMetadbHandleList(sel), [styleTag], true).flat().filter(Boolean); 	//We use flat since it's only 1 track. i.e. genre[0][i] === genre.flat()[i]
		const mood = getTagsValuesV3(new FbMetadbHandleList(sel), [moodTag], true).flat().filter(Boolean); 	//We use flat since it's only 1 track. i.e. genre[0][i] === genre.flat()[i]
		const key = keyArr[0];
		const date = Number(dateArr[0]);
		const bpm = Number(bpmArr[0]);
		const style_genreSet = new Set(genre.concat(style)).difference(map_distance_exclusions); // We remove exclusions
		const style_genre = Array.from(style_genreSet);
		
		
		// Genres
        const genreNumber = genre.length;
		if (genreNumber !== 0) {
			originaldistance += genreWeight;
			if (genreWeight / totalweight >= totalweight / countweights / 100) {
				queryl = query.length;
				query[queryl] = '';
				query[queryl] += query_combinations(genre, genreTag, 'OR');
			}
		}
        // Styles
		const styleNumber = style.length;
		if (styleNumber !== 0) {
			originaldistance += styleWeight;
			if ( styleWeight / totalweight >= totalweight / countweights / 100) {
				queryl = query.length;
				query[queryl] = '';
				query[queryl] += query_combinations(style, styleTag, 'OR');
			}
		}
		// Dyngenre
		const style_genre_length = style_genre.length;
		if (dyngenreWeight !== 0 && style_genre_length !== 0) {
			var dyngenreNumber = 0;
			var dyngenre = [];
			let i = 0;
			while (i < style_genre_length) {
				let dyngenre_i = genre_style_map.get(style_genre[i]);
				if (dyngenre_i) {
					let k;
					let dyngenre_i_length = dyngenre_i.length;
					for (k = 0; k < dyngenre_i_length; k++) {
						dyngenre.push(dyngenre_i[k]);
					}
				}
				i++;
			}
			dyngenreNumber = dyngenre.length;
			if (dyngenreNumber !== 0) {
				originaldistance += dyngenreWeight;
			}
		}
        // Moods
		const moodNumber = mood.length;
		if (moodNumber !== 0) {
			originaldistance += moodWeight;
			if (moodWeight / totalweight / moodNumber * kMoodNumber >= totalweight / countweights / 100) {
				queryl = query.length;
				query[queryl] = '';
				let k = moodNumber >= kMoodNumber ? kMoodNumber : moodNumber; //on combinations of 4
				const moodcomb = k_combinations(mood, k);
				query[queryl] += query_combinations(moodcomb, moodTag, 'OR', 'AND');
			}
		}
        // Key
		if (key) {
			originaldistance += keyWeight;
			if (keyWeight / totalweight >= totalweight / countweights / 100) {
				queryl = query.length;
				query[queryl] = '';
				query[queryl] += 'key IS ' + key;
			}
		}
		// Date
		if (date) {
			originaldistance += dateWeight;
			if (dateWeight / totalweight >= totalweight / countweights / 100) {
				queryl = query.length;
				query[queryl] = '';
				let dateUpper = date + dateRange;
				let dateLower = date - dateRange;
				if (dateUpper !== dateLower) {query[queryl] += 'date GREATER ' + dateLower + ' AND date LESS ' + dateUpper;} 
				else {query[queryl] += 'date EQUAL ' + date;}
			}
		}
		// BPM
		if (bpm) {
			originaldistance += bpmWeight;
			if (bpmWeight / totalweight >= totalweight / countweights / 100) {
				queryl = query.length;
				query[queryl] = '';
				let bmpUpper = round(bpm * (100 + bpmRange) / 100, 0);
				let bmpLower = round(bpm * (100 - bpmRange) / 100, 0);
				if (bmpUpper !== bmpLower) {query[queryl] += 'bpm GREATER ' + bmpLower + ' AND bpm LESS ' + bmpUpper;}
				else {query[queryl] += 'bpm EQUAL ' + bpm;}
			}
		}

		// Total score
		originaldistance = (originaldistance * 100) / totalweight; // always 100% but this is done as a check...
		if (bProfile) {test.Print('\nTask #1: Reference track', false);}
		
        // Create final query
		// Pre filtering by query greatly speeds up the next part (weight and graph distance calcs), but it requires variable queries according to the weights.
		// i.e. if genreWeight is set too high, then only same genre tracks would pass the later score/distance filter... 
		// But having the same values for other tags could make the track pass to the final pool too, specially for Graph method. 
		// So a variable pre-filter would be needed, calculated according to the input weight values and later score filter.
		// Also an input track missing some tags would break the pre-filter logic if not adjusted.
        queryl = query.length;
		if (queryl === 0) {
			if (!moodNumber && !styleNumber && !genreNumber) {
				console.log('No query available for selected track. Probably missing tags!');
				return;
			} else {query[queryl] = '';} // Pre-Filter may not be relevant according to weights...
		}
		const querylength = query.length;
		if (method === 'WEIGHT' && dyngenreWeight === 0) { // Weight method. Pre-filtering is really simple...
			if (querylength === 1 && query[0] === '') {query[querylength] = '';}
			else {query[querylength] = query_join(query, 'OR');} //join previous query's
		} else if (method === 'WEIGHT' && dyngenreWeight !== 0) { //Dyngenre method.
			query[querylength] = '';
		} else { // Graph Method
			query[querylength] = '';
		}
		if (forcedQuery) { //Add user input query to the previous one
			if (query[querylength].length) {query[querylength] = '(' + query[querylength] + ') AND ' + forcedQuery;}
			else {query[querylength] += forcedQuery;}
		}
		
		// Load query
		let handle_list;
		try {handle_list = fb.GetQueryItems(fb.GetLibraryItems(), query[querylength]);} // Sanity check
		catch (e) {fb.ShowPopupMessage('Query not valid:\n' + query[querylength]); return;}
		if (bProfile) {test.Print('\nTask #2: Query', false);}
		
		// Find and remove duplicates ~900 ms for 55k tracks
		// It was 500ms
		handle_list = do_remove_duplicates(handle_list, '%title% - %artist% - %date%', '%title%', '%artist%', '%date%');
		
		const tracktotal = handle_list.Count;
		if (bShowQuery) {console.log('Query created: ' + query[querylength]);}
		console.log('Items retrieved by query (minus duplicates): ' + tracktotal + ' tracks');
		
        //Compute similarity distance by Weight and/or Graph	
		//Similar Artists, Similar Styles, Dynamic Genre, Date Range & Weighting
        let distance = [];
		let cacheLink = [];
		
		if (method === 'GRAPH') { // Sort by the things we will look for at the graph! -> Cache speedup
			let tfo = fb.TitleFormat('%genre%|%style%');
			handle_list.OrderByFormat(tfo, 1);
		}
		if (bProfile) {test.Print('\nTask #3: Remove Duplicates and sorting', false);}
		
		// const handle_list_array = handle_list.Convert();
		const [genreHandle, styleHandle, moodHandle, keyHandle, dateHandle, bpmHandle] = getTagsValuesV4(handle_list, [genreTag, styleTag, moodTag,'key','date','bpm']);
		const genreSet = new Set(genre);
		const styleSet = new Set(style);
		const moodSet = new Set(mood);
		i = 0;
        while (i < tracktotal) {
            let genreDistance = 0;
			let styleDistance = 0;
            let dyngenreDistance = 0;    
            let moodDistance = 0;
            let keyDistance = 0;
            let dateDistance = 0;
			let bpmDistance = 0;
			let map_distance = -1;
			
			let dyngenreNumberNew = 0;
			let dyngenreNew = [];
			const genreNew = genreHandle[i];
			const styleNew = styleHandle[i];
			const moodNew = moodHandle[i];
			const genreNewSet = new Set(genreNew);
			const styleNewSet = new Set(styleNew);
			const moodNewSet = new Set(moodNew);
			const keyNew = keyHandle[i][0];
			const dateNew = Number(dateHandle[i][0]);
			const bpmNew = Number(bpmHandle[i][0]);
			const style_genreSetNew = new Set(genreNew.concat(styleNew)).difference(map_distance_exclusions); // We remove exclusions
			const style_genre_new = Array.from(style_genreSetNew);
			const style_genre_new_length = style_genre_new.length;
			
			// O(i)*O(j*k) time
			// i = # tracks retrieved by query, j & K = # number of style/genre tags
			if (genreWeight !== 0 && genreNumber !== 0) {
				let common = genreSet.intersection(genreNewSet).size;
				if (common) {
					genreDistance += genreWeight / genreNumber * common;
				}
			}
			
			if (styleWeight !== 0 && styleNumber !== 0) {
				let common = styleSet.intersection(styleNewSet).size;
				if (common) {
					styleDistance += styleWeight / styleNumber * common;
				}
			}
			
			if (moodWeight !== 0 && moodNumber !== 0) {
				let common = moodSet.intersection(moodNewSet).size;
				if (common) {
					moodDistance += moodWeight / moodNumber * common;
				}
			}
			
			if (keyWeight !== 0 && key.length) {
				if (key === keyNew) {
					keyDistance += keyWeight;
				}
			}
			
			if (dateWeight !== 0 && date !== 0) {
				if (dateNew !== 0) {
					if (date === dateNew){
						dateDistance += dateWeight;
					} else 	if (dateRange !== 0) {
						const datedifference = dateRange - Math.abs(date -  dateNew);
						dateDistance += (datedifference / dateRange) * dateWeight;  //becomes negative outside the allowed range!
					}
				}
			}
			
			if (bpmWeight !== 0 && bpm !== 0) {
				if (bpmNew !== 0) {
					if (bpm === bpmNew){
						bpmDistance += bpmWeight;
					} else if (bpmRange !== 0) {
						const irange = bpm * bpmRange / 100;
						const bpmdifference = irange - Math.abs(bpm -  bpmNew);
						bpmDistance += (bpmdifference / bpmRange / bpm * 100 ) * bpmWeight;
					}
				}
			}
			
			if (dyngenreWeight !== 0 && dyngenreNumber !== 0) {
				if (style_genre_new_length !== 0) {
					let i = 0;
					while (i < style_genre_new_length) {
						let dyngenre_i = genre_style_map.get(style_genre_new[i]);
						if (dyngenre_i) {
							let k;
							let dyngenre_i_length = dyngenre_i.length;
							for (k = 0; k < dyngenre_i_length; k++) {
								dyngenreNew.push(dyngenre_i[k]);
							}
						}
						i++;
					}
				}
				dyngenreNumberNew = dyngenreNew.length;
				if (dyngenreNumberNew !== 0) {
					let j = 0;
					while (j < dyngenreNumber) {
						let h = 0;
							while (h < dyngenreNumberNew) {
							const [lowrange , highrange] = dyn_genre_range(dyngenre[j], 1); //On +-1 range
							if (lowrange <= dyngenreNew[h] && dyngenreNew[h] <= highrange) {
								dyngenreDistance += dyngenreWeight / dyngenreNumber;
								break;
							}
							h++;
						}
						j++;
					}
				}
			}
			
			const weightValue = round(((genreDistance + styleDistance + dyngenreDistance + moodDistance + keyDistance + dateDistance + bpmDistance) * 100) / originaldistance / totalweight, 3);
			const score = round(weightValue * 100, 1);
			
			if (method === 'GRAPH') {
				// Weight filtering excludes most of the tracks before other calcs -> Much Faster than later! (40k tracks can be reduced to just ~1k)
				if (score < minFilter) {
					map_distance = -1;
				} else {
					// PUT THIS IN ITS OWN FUNCTION
					// Get the minimum distance of the entire set of tags (track B, i) to every style of the original track (A, j): 
					// O(i)*O(j*k)*O(lg n) time
					// where n = # nodes on map, i = # tracks retrieved by query, j & K = # number of style/genre tags
					// Pre-filtering number of tracks is the best approach to reduce calc time (!)
					let map_distance_setA = new Set();
					let map_distance_setB = new Set();

					let j = 0;
					let i_influenceDistance = 0;
					while (j < style_genre_length) {
						let h = 0;
						while (h < style_genre_new_length) {
							if (style_genre[j] === style_genre_new[h]) {  // Same style/genre, no need to continue
									map_distance_setB.add(0);
									break;
							} else {
								let jh_distance = -1;
								let jh_influenceDistance = 0;
								let bfoundcache = 0;
								let k = cacheLink.length;
								while (k--){  //Look first at cache. Having the list already sorted by genre/style it gets even faster...
									if (cacheLink[k].styleB === style_genre_new[h] && cacheLink[k].styleA === style_genre[j]) { //style_genre_new changes more, so first one...
										jh_distance = cacheLink[k].distance;
										jh_influenceDistance = cacheLink[k].influenceDistance;
										bfoundcache = 1;
										break;
									} else if (cacheLink[k].styleA === style_genre_new[h] && cacheLink[k].styleB === style_genre[j]) { //idem, but reversed
										jh_distance = cacheLink[k].distance;
										jh_influenceDistance = cacheLink[k].influenceDistance;
										bfoundcache = 1;
										break;
									}
								}
								if (!bfoundcache) { // Calc distances if not found at cache. This is the heaviest part of the calc.
									[jh_distance, jh_influenceDistance] = calc_map_distance(all_music_graph, style_genre[j], style_genre_new[h], true); 
									//Graph is initialized at startup
									cacheLink.push({ styleA: style_genre[j], styleB: style_genre_new[h], distance: jh_distance , influenceDistance: jh_influenceDistance});
								}
								if (jh_distance !== -1) {
									map_distance_setB.add(jh_distance);
								}
								if (jh_influenceDistance !== 0) {i_influenceDistance += jh_influenceDistance;} // Added to the total distance, not per link.
							}
							h++;
						}
						if (map_distance_setB.size) { //Get the minimum distance of the entire set
							if (map_distance === -1) {
								if (map_distance_setB.has(0)) {
									map_distance = 0;
								} else {
									let setMinB = Math.min(...Array.from(map_distance_setB));
									map_distance = setMinB;
								}
							} else {
								let setMinB = Math.min(...Array.from(map_distance_setB));
								map_distance += setMinB;
							}
							map_distance_setB.clear();
						}
						j++;
					}
					if (map_distance !== -1) {
						map_distance += i_influenceDistance; // Adds negative influence. Note it's added to the total distance, not per link.
						map_distance /= style_genre_new_length;  // And calcs mean distance!
						map_distance = round(map_distance,1);
					}
				}
			} // Distance / style_genre_new_length < sbd_max_graph_distance / style_genre_length ?
			if (method === 'GRAPH') {
				if (map_distance !== -1 && map_distance <= sbd_max_graph_distance) { //	We are checking that the  mean distance of every genre/style
					// Save computed distance and index									from new track is below graph distance
					const newtrack = handle_list[i];
					const newtrack_info = newtrack.GetFileInfo();
					const titleIdx = newtrack_info.MetaFind('title');
					const title = (titleIdx !== -1) ? newtrack_info.MetaValue(titleIdx,0) : '';
					distance.push({ index: i, name: title, value: score, mapdistance: map_distance });
				}
			}
			if (method === 'WEIGHT') {
				if (weightValue !== -1 && score > minFilter) {
					// Save computed distance and index
					const newtrack = handle_list[i];
					const newtrack_info = newtrack.GetFileInfo();
					const titleIdx = newtrack_info.MetaFind('title');
					const title = (titleIdx !== -1) ? newtrack_info.MetaValue(titleIdx,0) : '';
					distance.push({ index: i, name: title, value: score });
				}
			}
            i++;
        }
		if (bProfile) {test.Print('\nTask #4: Score and Distance', false);}
		// console.log(distance);
		let poollength = distance.length;
		if (method === 'WEIGHT') {
			distance.sort(function (a, b) {return b.value - a.value;});
			let i = 0;
			while (i < poollength) {
				const i_score = distance[i].value;
				if (i_score < scoreFilter) { //If below minimum score
					if (i >= playlistLength) { //Break when reaching required playlist length
						distance.length = i;
						break;
					} else if (sbd_distanceFilter_dyngenre_below && i_score < minFilter) {	//Or after min value - 10% range
						distance.length = i;
						break;
					}
				}
				i++;
			}
			poollength = distance.length;
			console.log('Pool of tracks with similarity greater than ' + scoreFilter + '%: ' + poollength + ' tracks');
		} 
		else {	// GRAPH
				// Done on 3 steps. Weight filtering (done before!) -> Graph distance filtering -> Graph distance sort
			// TODO: FILTER DYNAMICALLY MAX DISTANCE*STYLES OR ABSOLUTE VALUE?
			distance.sort(function (a, b) {return b.value - a.value;});
			let i = 0;
			while (i < poollength) {
				const i_score = distance[i].value;
				if (i_score < scoreFilter) {	//If below minimum score
					if (i >= playlistLength) {	//Break when reaching required playlist length
						distance.length = i;
						break;
					} else if (sbd_distanceFilter_graph_below && i_score < minFilter) {	//Or after min value - 10% range
						distance.length = i;
						break;
					}
				}
				i++;
			}
			distance.sort(function (a, b) {return a.mapdistance - b.mapdistance;}); // First sorted by graph distance, then by weight
			poollength = distance.length;
			console.log('Pool of tracks with similarity greater than ' + (scoreFilter - sbd_distanceFilter_graph_below) + '% and graph distance lower than ' + sbd_max_graph_distance +': ' + poollength + ' tracks');
		}
		
		// Pre Filter (note there are no real duplicates at this point)
		if (bPoolFiltering) {
			let handlePoolArray = [];
			let i = poollength;
			while (i--) {handlePoolArray.push(handle_list_array[distance[i].index]);}
			let handlePool = new FbMetadbHandleList(handlePoolArray);
			handlePool = do_remove_duplicatesV3(handlePool, null, poolFilteringArray, 2); // n + 1 = 3 tracks set of tags
			let distanceCopy = [];
			i = 0;
			while (i < handlePool.Count) {
				let newtrack = handlePool[i];
				let newtrack_info = newtrack.GetFileInfo();
				let titleIdx = newtrack_info.MetaFind('title');
				let title = (titleIdx !== -1) ? newtrack_info.MetaValue(titleIdx,0) : '';
				let j = 0;
				while (j < poollength) { 
					if (distance[j].name === title) {
						distanceCopy[i] = distance[j]; //It's an object! only copy references
					}
					j++;
				}
				i++;
			}
			distance = distanceCopy; //We don't care about storing only the selected references...
			poollength = distance.length;
			console.log('Pool of tracks after filtering by : ' + distance.length + ' tracks');
		}
		
		// Final selection
		let handleSelectionArray = [];
		let SelectionArray = []; //For console
		if (poollength > playlistLength) {
			if (bRandomPick){	//Random from pool
				const numbers = Array(poollength).fill().map((_, index) => index);
				numbers.sort(() => Math.random() - 0.5);
				const randomSeed = numbers.slice(0, playlistLength); //random numbers from 0 to playlistLength - 1
				let i = 0;
				while (i < playlistLength) {
					const i_random = randomSeed[i];
					handleSelectionArray.push(handle_list[distance[i_random].index]);
					SelectionArray.push(distance[i_random]);
					i++;
				}
			} else { 
				if (probPick < 100) {	//Random but starting from high score picked tracks
					let randomSeed = 0;
					let indexSelectionArray = []; //Save index and handles in parallel. Faster than comparing handles.
					let i = 0;
					while (indexSelectionArray.length < playlistLength) {
						randomSeed = Math.floor((Math.random() * 100) + 1);
						if (randomSeed < probPick) {
							if (indexSelectionArray.indexOf(distance[i].index) === -1) { //No duplicate selection
								indexSelectionArray.push(distance[i].index);
								handleSelectionArray.push(handle_list[distance[i].index]);
								SelectionArray.push(distance[i]);
							}
						}
						i++;
						if (i >= poollength) { //Start selection from the beginning of pool
							i = 0;
						}
					}
				} else {	//In order starting from high score picked tracks
					distance.length = playlistLength;
					let i = 0;
					while (i < playlistLength) {
						handleSelectionArray.push(handle_list[distance[i].index]);
						SelectionArray.push(distance[i]);
						i++;
					}
				}
			}
		} else {	//Entire pool
			let i = 0;
			while (i < poollength) {
				handleSelectionArray[i] = handle_list[distance[i].index];
				SelectionArray.push(distance[i]);
				i++;
			}
			if (isFinite(playlistLength)) {
				console.log('Warning: Final Playlist selection length (= ' + i + ') lower/equal than ' + playlistLength + ' tracks. You may want to check "' + SearchByDistance_properties.sbd_max_graph_distance[0] + '" parameter (= ' + scoreFilter + '%).');
			}
		}
		if (bProfile) {test.Print('Task #5: Final Selection', false);}
		if (bShowFinalSelection) {
			let i = SelectionArray.length;
			while (i--) {console.log(SelectionArray[i].name + ' - ' + SelectionArray[i].value + (typeof SelectionArray[i].mapdistance !== 'undefined' ? ' - ' + SelectionArray[i].mapdistance : ''));}
		}
	
		// Create final handle and sort random
		let final_handle_list = new FbMetadbHandleList(handleSelectionArray);
		
		if (bSortRandom) { // Note that bRandomPick makes playlist randomly sorted too!
			const tfo = fb.TitleFormat('$rand()');
			final_handle_list.OrderByFormat(tfo, 1);
		}
		// Insert to playlist
		plman.InsertPlaylistItems(plman.ActivePlaylist, 0, final_handle_list);
		console.log('Final Playlist selection length: ' + final_handle_list.Count + ' tracks.');
}

/* 
	Helpers
*/

// Get the minimum distance of the entire set of tags (track B, i) to every style of the original track (A, j): 
// worst case is O(i*j*k*lg(n)) time, greatly reduced by caching link distances.
// where n = # nodes on map, i = # tracks retrieved by query, j & K = # number of style/genre tags
// Pre-filtering number of tracks is the best approach to reduce calc time (!)
function calcMeanDistance(mygraph, style_genre_reference, style_genre_new) {
	let map_distance = Infinity;
	const difference = style_genre_reference.difference(style_genre_new);
	if (style_genre_reference.size === 0 || style_genre_new.size === 0) { // When no tags are available, sets are empty & tracks are not connected
		map_distance = Infinity;
	} else { // With non-empty sets
		if (!difference.size) { // If style_genre_new is superset of style_genre_reference.
			map_distance = 0;
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
						[jh_distance, jh_influenceDistance] = calc_map_distance(mygraph, style_genre, style_genreNew, true); 
						//Graph is initialized at startup
						cacheLink.set([style_genre, style_genreNew].sort().join('-'), {distance: jh_distance , influenceDistance: jh_influenceDistance}); // Sorting removes the need to check A-B and B-A later...
					}
					if (jh_distance < setMin) {setMin = jh_distance;}
					if (jh_influenceDistance !== 0) {influenceDistance += jh_influenceDistance;}
				}
				if (setMin < Infinity) { //Get the minimum distance of the entire set
					if (map_distance === Infinity) { // If points were not linked before
							map_distance = setMin;
					} else { // else sum the next minimum
						map_distance += setMin;
						if (map_distance === Infinity) {break;}
					}
				}
			}
			if (map_distance < Infinity) { // If they are linked
				map_distance += influenceDistance; // Adds positive/negative influence distance ('negative' means nearer...)
				map_distance /= style_genre_new.size;  // mean distance
				map_distance /= style_genre_reference.size;  // mean distance //TODO:
				map_distance = round(map_distance,1); // And rounds the final value
				if (map_distance < 0) {map_distance = 0;} // Safety check, since influence may lower values below zero
			}
		}
	}
	return map_distance;
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
function calcCacheLinkSGV2(mygraph, limit = -1) {
	let cache = new Map();
	let nodeList = [];
	
	// Filter SGs with those on library
	nodeList = new Set(music_graph_descriptors.style_supergenre.flat(Infinity)).union(new Set(music_graph_descriptors.style_weak_substitutions.flat(Infinity))).union(new Set(music_graph_descriptors.style_substitutions.flat(Infinity))).union(new Set(music_graph_descriptors.style_cluster.flat(Infinity))); // all values without duplicates
	let tfo = fb.TitleFormat('%genre%|%style%'); // TODO: Use properties!
	const styleGenres = new Set(tfo.EvalWithMetadbs(fb.GetLibraryItems()).join('|').split('|')); // All styles/genres from library without duplicates
	nodeList = [...nodeList.intersection(styleGenres)];
	
	let nodeListLength = nodeList.length;
	let i = 0;
	while (i < nodeListLength){
		let j = i + 1;
		while (j < nodeListLength){
			let [ij_distance, ij_antinfluenceDistance] = calc_map_distance(mygraph, nodeList[i], nodeList[j], true);
			if (limit === -1 || ij_distance <= limit) {
				// Sorting removes the need to check A-B and B-A later...
				cache.set([nodeList[i], nodeList[j]].sort().join('-'), {distance: ij_distance, influenceDistance: ij_antinfluenceDistance});
			}
			j++;
		}
		i++;
	}
	return cache;
}

// Save and load cache on json
function saveCache(cacheMap, path) {
	_save(path, JSON.stringify(Object.fromEntries(cacheMap)));
}

function loadCache(path) {
	let cacheMap = new Map();
	if (utils.IsFile(path)) {
		let obj = Object.entries(_jsonParseFile(path));
		obj.forEach((pair) => {
			if (pair[1] === null) {pair[1] = Infinity;} // TODO: Only 1 cache structure for both files
			if (pair[1].distance === null) {pair[1].distance = Infinity;}
		}); // stringify converts Infinity to null, this reverts the change
		cacheMap = new Map(obj);
	}
	return cacheMap;
}