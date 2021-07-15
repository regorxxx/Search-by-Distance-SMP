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
if (panelProperties.descriptorCRC[1] != descriptorCRC) {
	console.log('SearchByDistance: CRC mistmatch. Deleting old json cache.')
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
	console.log('hola¡')
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
	}
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
	}
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
		let poollength = distance.length
		if (method === 'WEIGHT') {
			distance.sort(function (a, b) {return b.value - a.value;});
			let i = 0;
			while (i < poollength) {
				const i_score = distance[i].value;
				if (i_score < scoreFilter) {	//If below minimum score
					if (i >= playlistLength) {	//Break when reaching required playlist length
						distance.length = i;
						break;
					} else if (sbd_distanceFilter_dyngenre_below && i_score < minFilter) {	//Or after min value - 10% range
						distance.length = i;
						break;
					}
				}
				i++
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
				i++
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
			while (i--) {console.log(SelectionArray[i].name + ' - ' + SelectionArray[i].value + (SelectionArray[i].mapdistance !== undefined ? ' - ' + SelectionArray[i].mapdistance : ''));}
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

// 1600 ms 24K tracks WEIGHT all default on i7 920 from 2008
// 1900 ms 24K tracks GRAPH all default on i7 920 from 2008
// 3144 ms 46K tracks DYNGENRE all default on i7 920 from 2008
function do_searchby_distance({
								// --->Default args (aka properties from the panel and input)
								properties	 			= getPropertiesPairs(SearchByDistance_properties, sbd_prefix),
								panelProperties			= (typeof buttons === 'undefined') ? properties : getPropertiesPairs(SearchByDistance_panelProperties, sbd_prefix),
								sel 					= fb.GetFocusItem(), // Reference track, first item of act. pls. if can't get focus item
								theme					= {}, // May be a file path or object with Arr of tags {name, tags: [{genre, style, mood, key, date, bpm, composer, customStr, customNum}]}
								recipe 					= {}, // May be a file path or object with Arr of arguments {genreWeight, styleWeight, ...}
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
								bUseAntiInfluencesFilter= properties.hasOwnProperty('bUseAntiInfluencesFilter') ? properties['bUseAntiInfluencesFilter'][1] : false, // Filter anti-influences by query, before any scoring/distance calc. 					
								bUseInfluencesFilter	= properties.hasOwnProperty('bUseInfluencesFilter') ? properties['bUseInfluencesFilter'][1] : false, // Allows only influences by query, before any scoring/distance calc. 
								// --->Scoring Method
                                method					= properties.hasOwnProperty('method') ? properties['method'][1] : 'WEIGHT',
								// --->Scoring filters
                                scoreFilter				= properties.hasOwnProperty('scoreFilter') ? Number(properties['scoreFilter'][1]) :  75,
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
								bCreatePlaylist			= true, // false: only outputs handle list. To be used along other scripts and/or recursive calls
								} = {}) {
		// Recipe check
		const themePath = folders.xxx + 'presets\\Search by\\themes\\';
		const recipePath = folders.xxx + 'presets\\Search by\\recipes\\';
		const bUseRecipe = recipe && (recipe.length || Object.keys(recipe).length);
		if (bUseRecipe) {
			let path;
			if (isString(recipe)) { // File path
				path = !_isFile(recipe) && _isFile(recipePath + recipe) ? recipePath + recipe : recipe;
				console.log(path);
				recipe = _jsonParseFile(path);
				if (!recipe) {
					console.log('Recipe file selected is missing or not valid: ' + path);
					return;
				}
			}
			const name = recipe.hasOwnProperty('name') ? recipe.name : (path ? isCompatible('1.4.0') ? utils.SplitFilePath(path)[1] : utils.FileTest(path, 'split')[1] : '-no name-');  //TODO: Deprecated
			// Rewrite args or use destruct when passing args
			// Sel is ommited since it's a function or a handle
			// Note a theme may be set within a recipe too, overwriting any other them set
			// Changes null to infinity and not found theme filenames into full paths
			const allowedKeys = new Set(['properties', 'panelProperties', 'theme', 'recipe', 'genreWeight', 'styleWeight', 'dyngenreWeight', 'moodWeight', 'keyWeight', 'dateWeight', 'bpmWeight', 'composerWeight', 'customStrWeight', 'customNumWeight', 'dyngenreRange', 'keyRange', 'dateRange', 'bpmRange', 'customNumRange', 'bNegativeWeighting', 'forcedQuery', 'bUseAntiInfluencesFilter', 'bUseInfluencesFilter', 'method', 'scoreFilter', 'sbd_max_graph_distance', 'poolFilteringTag', 'poolFilteringN', 'bPoolFiltering', 'bRandomPick', 'probPick', 'playlistLength', 'bSortRandom', 'bProgressiveListOrder', 'bScatterInstrumentals', 'bInKeyMixingPlaylist', 'bProgressiveListCreation', 'progressiveListCreationN', 'bProfile', 'bShowQuery', 'bShowFinalSelection', 'bBasicLogging', 'bSearchDebug', 'bCreatePlaylist'])
			let bOverwriteTheme = false;
			Object.keys(recipe).forEach((key) => {
				const value = recipe[key] !== null ? recipe[key] : Infinity;
				if (allowedKeys.has(key)) {
					if (isStringWeak(value)) {
						eval(key + ' = \'' + value + '\'');
					} else if (isArrayStrings(value)) {
						const newVal = '\'' + value.join('\',\'') + '\'';
						eval(key + ' = [' + newVal + ']');
					} else {eval(key + ' = ' + value);}
					if (key === 'theme') {bOverwriteTheme = true;};
				}
			});
			if (bBasicLogging) {
				console.log('Using recipe as config: ' + name + (path ? ' (' + path + ')' : ''));
				if (bOverwriteTheme) {console.log('Recipe forces its own theme.')};
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
			const validVars = Object.keys(music_graph_descriptors).map((_) => {return 'music_graph_descriptors.' + _;});
			if (sbd_max_graph_distance.indexOf('+') === -1 && sbd_max_graph_distance.indexOf('-') === -1 && sbd_max_graph_distance.indexOf('*') === -1 && sbd_max_graph_distance.indexOf('/') === -1 && validVars.indexOf(sbd_max_graph_distance) === -1) {
				console.log('Error parsing sbd_max_graph_distance (using no arithmethics or variable): ' + sbd_max_graph_distance);
				return;
			}
			sbd_max_graph_distance = eval(sbd_max_graph_distance);
			console.log('Parsed sbd_max_graph_distance to: ' + sbd_max_graph_distance);
		}
		// Theme check
		const bUseTheme = theme && (theme.length || Object.keys(theme).length);
		if (bUseTheme) {
			let path;
			if (isString(theme)) { // File path: try to use plain path or themes folder + filename
				path = !_isFile(theme) && _isFile(themePath + theme) ? themePath + theme : theme;
				theme = _jsonParseFile(path);
				if (!theme) {
					console.log('Theme file selected is missing or not valid: ' + path);
					return;
				}
			}
			
			// Array of objects
			const tagsToCheck = ['genre', 'style', 'mood', 'key', 'date', 'bpm', 'composer', 'customStr', 'customNum'];
			const tagCheck = theme.hasOwnProperty('tags') ? theme.tags.findIndex((tagArr) => {isArrayEqual(Object.keys(tagArr), tagsToCheck)}) : 0;
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
		const genreTag = (genreWeight !== 0 || dyngenreWeight !== 0 || method === 'GRAPH') ? properties['genreTag'][1].split(',').filter(Boolean) : [];
		const styleTag = (styleWeight !== 0 || dyngenreWeight !== 0 || method === 'GRAPH') ? properties['styleTag'][1].split(',').filter(Boolean) : [];
		const moodTag = (moodWeight !== 0) ? properties['moodTag'][1].split(',').filter(Boolean) : [];
		const dateTag = (dateWeight !== 0) ? properties['dateTag'][1].split(',').filter(Boolean) : []; // This one only allows 1 value, but we put it into an array
		const keyTag = (keyWeight !== 0 || bInKeyMixingPlaylist) ? properties['keyTag'][1].split(',').filter(Boolean) : []; // This one only allows 1 value, but we put it into an array
		const bpmTag = (bpmWeight !== 0) ? properties['bpmTag'][1].split(',').filter(Boolean) : []; // This one only allows 1 value, but we put it into an array
		const composerTag = (composerWeight !== 0) ? properties['composerTag'][1].split(',').filter(Boolean) : [];
		const customStrTag = (customStrWeight !== 0) ? properties['customStrTag'][1].split(',').filter(Boolean) : [];
		const customNumTag = (customNumWeight !== 0) ? properties['customNumTag'][1].split(',').filter(Boolean) : []; // This one only allows 1 value, but we put it into an array
		
		// Check input
		playlistLength = (playlistLength >= 0) ? playlistLength : 0;
		probPick = (probPick <= 100 && probPick > 0) ? probPick : 100;
		scoreFilter = (scoreFilter <= 100 && scoreFilter >= 0) ? scoreFilter : 100;
		const sbd_distanceFilter_dyngenre_below = 5;
		const sbd_distanceFilter_graph_below = 10;
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
	
		let minFilter;
		if (method === 'GRAPH') {minFilter = scoreFilter - sbd_distanceFilter_graph_below;} 
		else {minFilter = scoreFilter - sbd_distanceFilter_dyngenre_below;}
		if (minFilter < 0) {minFilter = 0;}
		
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
		const map_distance_exclusions = music_graph_descriptors.map_distance_exclusions; // Set
		
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
		const genre = (genreTag.length && (genreWeight !== 0 || dyngenreWeight !== 0 || method === 'GRAPH')) ? (bUseTheme ? (bTagFilter ? theme.tags[0].genre.filter(tag => !genreStyleFilter.has(tag)) : theme.tags[0].genre.filter(Boolean)) : (bTagFilter ? getTagsValuesV3(selHandleList, genreTag, true).flat().filter(tag => !genreStyleFilter.has(tag)) : getTagsValuesV3(selHandleList, genreTag, true).flat().filter(Boolean))): [];
		const style = (styleTag.length && (styleWeight !== 0 || dyngenreWeight !== 0 || method === 'GRAPH')) ? (bUseTheme ? (bTagFilter ? theme.tags[0].style.filter(tag => !genreStyleFilter.has(tag)) : theme.tags[0].style.filter(Boolean)) : (bTagFilter ? getTagsValuesV3(selHandleList, styleTag, true).flat().filter(tag => !genreStyleFilter.has(tag)) : getTagsValuesV3(selHandleList, styleTag, true).flat().filter(Boolean))) : [];
		const mood = (moodWeight !== 0) ? (bUseTheme ? theme.tags[0].mood.filter(Boolean) : getTagsValuesV3(selHandleList, moodTag, true).flat().filter(Boolean)) : [];
		const composer = (composerWeight !== 0) ? (bUseTheme ? theme.tags[0].composer.filter(Boolean) : getTagsValuesV3(selHandleList, composerTag, true).flat().filter(Boolean)) : [];
		const customStr = (customStrWeight !== 0) ? (bUseTheme ? theme.tags[0].customStr.filter(Boolean) : getTagsValuesV3(selHandleList, customStrTag, true).flat().filter(Boolean)) : [];
		
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
        const genreNumber = genre.length;
		if (genreNumber !== 0) {
			originalWeightValue += genreWeight;
			if ( genreWeight / totalWeight >= totalWeight / countWeights / 100) {
				queryl = query.length;
				query[queryl] = '';
				if (genreTag.length > 1) {query[queryl] += query_join(query_combinations(genre, genreTag, 'OR'), 'OR');}
				else {query[queryl] += query_combinations(genre, genreTag, 'OR');}
			}
		} else if (genreWeight !== 0 && bBasicLogging) {console.log('GenreWeight was not zero but selected track had no genre tags');}
        // Styles
		const styleNumber = style.length;
		if (styleNumber !== 0) {
			originalWeightValue += styleWeight;
			if ( styleWeight / totalWeight >= totalWeight / countWeights / 100) {
				queryl = query.length;
				query[queryl] = '';
				if (styleTag.length > 1) {query[queryl] += query_join(query_combinations(style, styleTag, 'OR'), 'OR');}
				else {query[queryl] += query_combinations(style, styleTag, 'OR');}
			}
		} else if (styleWeight !== 0 && bBasicLogging) {console.log('styleWeight was not zero but selected track had no style tags');}
		// Dyngenre
		const style_genre_length = style_genreSet.size;
		if (dyngenreWeight !== 0 && style_genre_length !== 0) {
			// This virtual tag is calculated with previous values
			var dyngenreNumber = 0;
			var dyngenre = [];
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
		const moodNumber = mood.length;
		if (moodNumber !== 0) {
			originalWeightValue += moodWeight;
			if ( moodWeight / totalWeight / moodNumber * kMoodNumber >= totalWeight / countWeights / 100) {
				queryl = query.length;
				query[queryl] = '';
				const k = moodNumber >= kMoodNumber ? kMoodNumber : moodNumber; //on combinations of 6
				const moodComb = k_combinations(mood, k);
				
				if (moodTag.length > 1) {query[queryl] += query_join(query_combinations(moodComb, moodTag, 'OR', 'AND'), 'OR');}
				else {query[queryl] += query_combinations(moodComb, moodTag, 'OR', 'AND');}
			}
		} else if (moodWeight !== 0 && bBasicLogging) {console.log('moodWeight was not zero but selected track had no mood tags');}
        // Key
		if (key.length) {
			originalWeightValue += keyWeight;
			if ( keyWeight / totalWeight >= totalWeight / countWeights / 100) {
				queryl = query.length;
				query[queryl] = '';
				// Cross on wheel with length keyRange, can change hour or letter, but not both without a penalty (-1 length)
				// Gets both, flat and sharp equivalences
				const camelotKey = camelotWheel.keyNotationObject.has(key) ? {...camelotWheel.keyNotationObject.get(key)} : null;
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
				const tagNameTF = ((dateTag[0].indexOf('$') === -1) ? dateTag[0] : '"' + dateTag[0] + '"') // May be a tag or a function...
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
		const customStrNumber = customStr.length;
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
				const tagNameTF = ((customNumTag[0].indexOf('$') === -1) ? customNumTag[0] : '"' + customNumTag[0] + '"') // May be a tag or a function...
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
			if (bUseAntiInfluencesFilter) { // Removes anti-influences using queries
					let influences = [];
				style_genreSet.forEach(styleGenre => {influences.push(...getAntiInfluences(styleGenre));})
				// Even if the argument is known to be a genre or style, the output values may be both, genre and styles.. so we use both for the query
				if (influences.length) {
					let temp = query_combinations(influences, genreTag.concat(styleTag), 'OR'); // min. array with 2 values or more if tags are remapped
					temp = 'NOT (' + query_join(temp, 'OR') + ')'; // flattens the array
					influencesQuery.push(temp);
				}
			}
			if (bUseInfluencesFilter) { // Outputs only influences using queries
				let influences = [];
				style_genreSet.forEach(styleGenre => {influences.push(...getInfluences(styleGenre));})
				// Even if the argument is known to be a genre or style, the output values may be both, genre and styles.. so we use both for the query
				if (influences.length) {
					let temp = query_combinations(influences, genreTag.concat(styleTag), 'OR'); // min. array with 2 values or more if tags are remapped
					temp = '(' + query_join(temp, 'OR') + ')'; // flattens the array. Here changes the 'not' part
					influencesQuery.push(temp);
					sbd_max_graph_distance = Infinity;
					scoreFilter = 40;
					minFilter = 30;
				}
			}
			
			query[querylength] = influencesQuery.length ? query_join(influencesQuery, 'AND') : ''; // TODO: Add weight query, now is dynamically set
		}
		if (forcedQuery.length) { //Add user input query to the previous one
			if (query[querylength].length) {query[querylength] = '(' + query[querylength] + ') AND ' + forcedQuery;}
			else {query[querylength] += forcedQuery;}
		}
		if (!query[querylength].length) {query[querylength] = 'ALL'}
		
		// Load query
		if (bShowQuery) {console.log('Query created: ' + query[querylength]);}
		let handle_list;
		try {handle_list = fb.GetQueryItems(fb.GetLibraryItems(), query[querylength]);} // Sanity check
		catch (e) {fb.ShowPopupMessage('Query not valid. Check query:\n' + query[querylength]); return;}
		if (bProfile) {test.Print('Task #2: Query', false);}
		// Find and remove duplicates ~900 ms for 55k tracks
		// It was 500ms
		handle_list = do_remove_duplicates(handle_list, '%title% - %artist% - %date%', '%title%', '%artist%', '%date%');
		
		const tracktotal = handle_list.Count;
		if (bBasicLogging) {console.log('Items retrieved by query (minus duplicates): ' + tracktotal + ' tracks');}
		if (!tracktotal) {console.log('Query created: ' + query[querylength]); return;}
        // Compute similarity distance by Weight and/or Graph
		// Similar Artists, Similar Styles, Dynamic Genre, Date Range & Weighting
        let scoreData = [];
		// let cacheLink = new Map();
		
		if (method === 'GRAPH') { // Sort by the things we will look for at the graph! -> Cache speedup
			let tfo = fb.TitleFormat(genreTag.concat(styleTag).join('|'));
			handle_list.OrderByFormat(tfo, 1);
		}
		if (bProfile) {test.Print('Task #3: Remove Duplicates and sorting', false);}
		
		// const handle_list_array = handle_list.Convert();
		// Get the tag values for all the handle list. Skip those with weight 0.
		// Now flat is not needed, we have 1 array of tags per track [i][j]
		// Also filter using boolean to remove '' values within an array, so [''] becomes [] with 0 length, but it's done per track.
		// Using only boolean filter it's 3x faster than filtering by set, here bTagFilter becomes useful since we may skip +40K evaluations 
		const genreHandle = (genreTag.length && (genreWeight !== 0 || dyngenreWeight !== 0 || method === 'GRAPH')) ? getTagsValuesV3(handle_list, genreTag, true) : null;
		const styleHandle = (styleTag.length && (styleWeight !== 0 || dyngenreWeight !== 0 || method === 'GRAPH')) ? getTagsValuesV3(handle_list, styleTag, true) : null;
		const moodHandle = (moodWeight !== 0) ? getTagsValuesV3(handle_list, moodTag, true) : null;
		const composerHandle = (composerWeight !== 0) ? getTagsValuesV3(handle_list, composerTag, true) : null;
		const customStrHandle = (customStrWeight !== 0) ? getTagsValuesV3(handle_list, customStrTag, true) : null;
		const [keyHandle, dateHandle, bpmHandle, customNumHandle] = getTagsValuesV4(handle_list, restTagNames);
		const titleHandle = getTagsValuesV3(handle_list, ['title'], true);
		let i = 0;
		while (i < tracktotal) {
            let weightValue = 0;
			let map_distance = Infinity; // We consider points are not linked by default
			let dyngenreNumberNew = 0;
			let dyngenreNew = [];
			
			// Get the tags according to weight and filter ''. Also create sets for comparison
			const genreNew = (genreWeight !== 0 || dyngenreWeight !== 0 || method === 'GRAPH') ? (bTagFilter ? genreHandle[i].filter(tag => !genreStyleFilter.has(tag)) : genreHandle[i].filter(Boolean)) : [];
			const styleNew = (styleWeight !== 0 || dyngenreWeight !== 0 || method === 'GRAPH') ? (bTagFilter ? styleHandle[i].filter(tag => !genreStyleFilter.has(tag)) : styleHandle[i].filter(Boolean)) : [];
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
			const style_genre_new_length = style_genreSetNew.size;
			
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
			
			if (keyWeight !== 0 && key.length !== 0 && keyNew.length) {
				if (key === keyNew) { // Not only fastest but also allows for arbitrary key notations (although only using simple matching)
					weightValue += keyWeight;
				} else if (keyRange !== 0){
					const camelotKeyNew = camelotWheel.keyNotationObject.get(keyNew);
					const camelotKey = camelotWheel.keyNotationObject.get(key);
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
				if (style_genre_new_length !== 0) {
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
				// Weight filtering excludes most of the tracks before other calcs -> Much Faster than later! (40k tracks can be reduced to just ~1k)
				if (score >= minFilter) {
					// Get the minimum distance of the entire set of tags (track B, i) to every style of the original track (A, j): 
					// Worst case is O(i*j*k*lg(n)) time, greatly reduced by caching results (since tracks may be unique but not their tag values)
					// where n = # nodes on map, i = # tracks retrieved by query, j & K = # number of style/genre tags
					// Pre-filtering number of tracks is the best approach to reduce calc time (!)
					// Distance cached at 2 points, for individual links (Rock -> Jazz) and entire sets ([Rock, Alt. Rock, Indie] -> [Jazz, Swing])
					let mapKey = [[...style_genreSet].sort(),[...style_genreSetNew].sort()].join(' -> ');
					if (cacheLinkSet.has(mapKey)) { // Mean distance from entire set (A,B,C) to (X,Y,Z)
						map_distance = cacheLinkSet.get(mapKey);
					} else { // Calculate it if not found
						map_distance = calcMeanDistance(all_music_graph, style_genreSet, style_genreSetNew);
						cacheLinkSet.set(mapKey, map_distance); // Caches the mean distance from entire set (A,B,C) to (X,Y,Z)
					}
				}
			} // Distance / style_genre_new_length < sbd_max_graph_distance / style_genre_length ?
			if (method === 'GRAPH') {
				if (map_distance <= sbd_max_graph_distance) {
					scoreData.push({ index: i, name: titleHandle[i][0], score: score, mapdistance: map_distance });
				}
			}
			if (method === 'WEIGHT') {
				if (score > minFilter) {
					scoreData.push({ index: i, name: titleHandle[i][0], score: score });
				}
			}
            i++;
        }
		if (bProfile) {test.Print('Task #4: Score and Distance', false);}
		let poolLength = scoreData.length
		if (method === 'WEIGHT') {
			scoreData.sort(function (a, b) {return b.score - a.score;});
			let i = 0;
			while (i < poolLength) {
				const i_score = scoreData[i].score;
				if (i_score < scoreFilter) {	//If below minimum score
					if (i >= playlistLength) {	//Break when reaching required playlist length
						scoreData.length = i;
						break;
					} else if (sbd_distanceFilter_dyngenre_below && i_score < minFilter) {	//Or after min score - 10% range
						scoreData.length = i;
						break;
					}
				}
				i++
			}
			poolLength = scoreData.length;
			if (bBasicLogging) {console.log('Pool of tracks with similarity greater than ' + scoreFilter + '%: ' + poolLength + ' tracks');}
		} 
		else {	// GRAPH
			// Done on 3 steps. Weight filtering (done) -> Graph distance filtering (done) -> Graph distance sort
			// Now we check if all tracks are needed (over 'minFilter') or only those over 'scoreFilter'.
			// TODO: FILTER DYNAMICALLY MAX DISTANCE*STYLES OR ABSOLUTE score?
			scoreData.sort(function (a, b) {return b.score - a.score;});
			let i = 0;
			while (i < poolLength) {
				const i_score = scoreData[i].score;
				if (i_score < scoreFilter) {	//If below minimum score
					if (i >= playlistLength) {	//Break when reaching required playlist length
						scoreData.length = i;
						break;
					} else if (sbd_distanceFilter_graph_below && i_score < minFilter) {	//Or after min score - 10% range
						scoreData.length = i;
						break;
					}
				}
				i++
			}
			scoreData.sort(function (a, b) {return a.mapdistance - b.mapdistance;}); // First sorted by graph distance, then by weight
			poolLength = scoreData.length;
			if (bBasicLogging) {console.log('Pool of tracks with similarity greater than ' + minFilter + '% and graph distance lower than ' + sbd_max_graph_distance +': ' + poolLength + ' tracks');}
		}
		
		// Post Filter (note there are no real duplicates at this point)
		if (bPoolFiltering) {
			let handlePoolArray = [];
			let i = poolLength;
			while (i--) {handlePoolArray.push(handle_list[scoreData[i].index]);}
			let handlePool = new FbMetadbHandleList(handlePoolArray);
			handlePool = do_remove_duplicatesV3(handlePool, null, poolFilteringTag, poolFilteringN); // n + 1
			const [titleHandlePool] = getTagsValuesV4(handlePool, ['title']);
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
				if (bSearchDebug) {console.log(pattern)};
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
						camelotKeyCurrent = keyCurrent.length ? camelotWheel.getKeyNotationObject(keyCurrent) : null;
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
								camelotKeyNew = (keyNew.length) ? camelotWheel.getKeyNotationObject(keyNew) : null;
								if (camelotKeyNew) {keyCache.set(indexNew, camelotKeyNew);}
								else {toCheck.delete(indexNew);}
							} else {camelotKeyNew = keyCache.get(indexNew);}
							if (camelotKeyNew) {
								if (nextKeyObj.hour === camelotKeyNew.hour && nextKeyObj.letter === camelotKeyNew.letter) {
									selectedHandlesArray.push(handle_list[index]);
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
				selectedHandlesArray.push(handle_list[nextIndex]); 
				selectedHandlesData.push(scoreData[nextIndexScore]);
				if (bSearchDebug) {keyDebug.push(camelotKeyNew); keySharpDebug.push(camelotWheel.getKeyNotationSharp(camelotKeyNew));}
				// Debug console
				if (bSearchDebug) {
					console.log('Keys from selection:');
					console.log(keyDebug);
					console.log(keySharpDebug);
					console.log('Pattern applied:');
					console.log(patternDebug); // Always has one item less thankey arrays
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
						selectedHandlesArray.push(handle_list[scoreData[i_random].index]);
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
									selectedHandlesArray.push(handle_list[scoreData[i].index]);
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
							selectedHandlesArray.push(handle_list[scoreData[i].index]);
							selectedHandlesData.push(scoreData[i]);
							i++;
						}
					}
				}
			} else {	//Entire pool
				let i = 0;
				while (i < poolLength) {
					selectedHandlesArray[i] = handle_list[scoreData[i].index];
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
		const finalPlaylistLength = selectedHandlesArray.length;
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
				selectedHandlesData.sort(function (a, b) {return a.mapdistance - b.mapdistance;});
				selectedHandlesArray.sort(function (a, b) {return a.mapdistance - b.mapdistance;}); 
			}
		} else if (bProgressiveListOrder && !bRandomPick && probPick === 100) {console.log('Warning: bProgressiveListOrder has no use if tracks are already choosen by scoring order from pool.')}
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
					if (bSearchDebug) {console.log('bScatterInstrumentals: ' + index + '->' + j)};
					selectedHandlesArray.splice(j, 0, handle); // (at, 0, item)
					selectedHandlesData.splice(j, 0, removedData[index]); // (at, 0, item)
				});
			} else if (toMoveTracks) {console.log('Warning: Could not scatter instrumentals. Interval is too low. (' + toMoveTracks + ' < 2)')}
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
						let newSel = bInKeyMixingPlaylist ? selectedHandlesArray[firstPlaylistLength - 1] : handle_list[scoreData[poolLength - 1].index];
						// Reuse arguments for successive calls and disable debug/logs and playlist creation
						let newArgs = {};
						for (let j = 0; j < arguments.length; j++) {newArgs = {...newArgs, ...arguments[j]};}
						newArgs = {...newArgs, bSearchDebug: false, bProfile: false, bShowQuery: false ,bShowFinalSelection: false, bProgressiveListCreation: false, bRandomPick: true, bSortRandom: true, bProgressiveListOrder: false, sel: newSel, bCreatePlaylist: false};
						// Get #n tracks per call and reuse lower scoring track as new selection
						let newSelectedHandlesArray, newSelectedHandlesData;
						for (let i = 0; i < progressiveListCreationN; i++) {
							const prevtLength = selectedHandlesArray.length;
							if (bSearchDebug) {console.log('selectedHandlesArray.length: ' + prevtLength);}
							[newSelectedHandlesArray, newSelectedHandlesData, , newArgs['sel']] = do_searchby_distance(newArgs);
							// Get all new tracks, remove duplicates after merging with previous tracks and only then cut to required length
							selectedHandlesArray = do_remove_duplicates(new FbMetadbHandleList(selectedHandlesArray.concat(newSelectedHandlesArray)), null, '%title%', '%artist%', '%date%').Convert();
							if (selectedHandlesArray.length > prevtLength + newPlaylistLength) {selectedHandlesArray.length = prevtLength + newPlaylistLength;}
						}
					} else {console.log('Warning: Can not create a Progressive List. First Playlist selection contains less than the required number of tracks.')}
				} else {console.log('Warning: Can not create a Progressive List. Current finalPlaylistLength (' + finalPlaylistLength + ') and progressiveListCreationN (' + progressiveListCreationN + ') values would create a playlist with track groups size (' + newPlaylistLength + ') lower than the minimum 3.')}
			} else {console.log('Warning: Can not create a Progressive List. rogressiveListCreationN (' + progressiveListCreationN + ') must be greater than 1 (and less than 100 for safety).')}
		}
		
		if (bProfile) {test.Print('Task #5: Final Selection', false);}
		if (bShowFinalSelection && !bProgressiveListCreation) {
			let i = finalPlaylistLength;
			while (i--) {console.log(selectedHandlesData[i].name + ' - ' + selectedHandlesData[i].score + (selectedHandlesData[i].mapdistance !== undefined ? ' - ' + selectedHandlesData[i].mapdistance : ''));}
		}
			
		// Insert to playlist
		if (bCreatePlaylist) {
			// Look if target playlist already exists and clear it. Preferred to removing it, since then we can undo later...
			const playlist_name = 'Search...';
			let i = 0;
			const plc = plman.PlaylistCount;
			while (i < plc) {
				if (plman.GetPlaylistName(i) === playlist_name) {
					plman.ActivePlaylist = i;
					plman.UndoBackup(i);
					plman.ClearPlaylist(i);
					break;
				}
				i++;
			}
			if (i === plc) { //if no playlist was found before
				plman.CreatePlaylist(plc, playlist_name);
				plman.ActivePlaylist = plc;
			}
			const outputHandleList = new FbMetadbHandleList(selectedHandlesArray);
			plman.InsertPlaylistItems(plman.ActivePlaylist, 0, outputHandleList);
			if (bBasicLogging) {console.log('Final Playlist selection length: ' + finalPlaylistLength + ' tracks.');}
		}
		// Share changes on cache
		if (cacheLink.size && method === 'GRAPH') {window.NotifyOthers(window.Name + ' SearchByDistance: cacheLink map', cacheLink);}
		if (cacheLinkSet.size && method === 'GRAPH') {window.NotifyOthers(window.Name + ' SearchByDistance: cacheLinkSet map', cacheLinkSet);}
		// Output handle list (as array), the score data, current selection (reference track) and more distant track
		return [selectedHandlesArray, selectedHandlesData, sel, (poolLength ? handle_list[scoreData[poolLength - 1].index] : -1)];
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