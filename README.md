# Search-by-Distance-SMP
[![version][version_badge]][changelog]
[![CodeFactor][codefactor_badge]](https://www.codefactor.io/repository/github/regorxxx/Search-by-Distance-SMP/overview/main)
[![Codacy Badge][codacy_badge]](https://www.codacy.com/gh/regorxxx/Search-by-Distance-SMP/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=regorxxx/Search-by-Distance-SMP&amp;utm_campaign=Badge_Grade)
![GitHub](https://img.shields.io/github/license/regorxxx/Search-by-Distance-SMP)  
An implementation of [Music-Graph](https://github.com/regorxxx/Music-Graph) for [foobar2000](https://www.foobar2000.org) using [Spider Monkey Panel](https://theqwertiest.github.io/foo_spider_monkey_panel), which creates intelligent "spotify-like" playlist using high-level data from tracks and computing their similarity using genres/styles.

![Animation11](https://user-images.githubusercontent.com/83307074/116761198-80a8bd80-aa06-11eb-904c-b3d50905f6bd.gif)

## Features
Creates playlists using high-level data from tracks similar to the currently selected one according to genre, style, key, etc. When their score is over 'scoreFilter', then they are included in the final pool. After all tracks have been evaluated and the final pool is complete, some of them are chosen to populate the playlist. You can choose whether this final selection is done according to score, randomly chosen, etc. All settings are configurable on the properties panel (or set in the files when called using buttons, etc.)

Take a look at the descriptions of the properties panel to check how the variables work. These are the weight/tags pairs checked by default:

Weight|Tag|Weight|Tag
-------------|----------------|--------------|-------------
genreWeight | genre | styleWeight | style 
dyngenreWeight  | virtual tag	| moodWeight | mood
keyWeight | key | dateWeight	 | $year(%date%)
bpmWeight | bpm | composerWeight | composer (unused by default)
	
There are 2 custom tags which can be set by the user too:
Weight|Tag|Weight|Tag
-------------|----------------|--------------|-------------
customStrWeight | unused by default) | customNumWeight | (unused by default)	 
	
Any Weight/tags pair can be remapped and/or merged (sep. by comma). 
For example, linking genreWeight to 2 different genre tags on your files:
Original Tag|Remap to
-------------|----------------
genreTag |allmusic_genre,my_genre_tag
	
Some weight/tags pairs can be linked to TitleFormat Expr. Use tag names instead of TF expressions when possible (+ performance). 
For example, see dateWeight: TF is used to have the same results for tracks with YYYY-MM tags or YYYY tags.
Tag|TF|Tag|TF
-------------|----------------|--------------|-------------
dateTag | $year(%date%) | customNumWeight | (unused by default)	 
	
Genre and Style tags (or their remapped values) can be globally filtered. See 'genreStyleFilter'. Case sensitive.
For example, when comparing genre values from track A to track B, 'Soundtrack' and 'Radio Program' values are omitted:

* genreStyleFilter: Soundtrack,Radio Program
	
There are 3 methods to calc similarity: WEIGHT, GRAPH and DYNGENRE.

* WEIGHT: -> Score  
	Uses genreWeight, styleWeight, moodWeight, keyWeight, dateWeight, dateRange, bpmWeight, bpmRange, composerWeight, customStrWeight, customNumWeight + scoreFilter  
	Calculates similarity by scoring according to the tags. Similarity is calculated by simple string matching ('Rock' != 'Soul') and ranges for numeric tags. This means some coherence in tags is needed to make it work, and the script only works with high level data (tags) which should havebeen added to files previously using manual or automatic methods (like MusicBrainz Picard, see note at bottom).

* GRAPH: -> Score + Distance  
	Same than WEIGHT + max_graph_distance  
	Apart from scoring, it compares the genre/styles tags set to the ones of the reference track using a graph and calculating their min. mean distance. Minimum mean distance is done considering (A,B,D) set matches (A,B,C) at 2 points (0 distance). So we only need to find the nearest pointfrom (A,B,D) to (C) which will be x. Then we calculate the mean distance dividing by the number of points of the reference track : (0 + 0 + x)/3.  
  Imagine Google maps for genre/styles, and looking for the distance from Rock to Jazz for ex. 'max_graph_distance' sets the max distance allowed, so every track with genre/styles farther than that value will not be included in the final pool. Note this is totally different to simple string matching, so 'Acid Rock' may be similar to 'Psychedelic Rock' even if they are totally different tag values (or strings).  
  This method is pretty computational intensive, we are drawing a map with all known genres/styles and calculating the shortest path between the reference track and all the tracks from the library (after some basic filtering). Somewhere between 2 and 5 secs for 40 K tracks. 
  For a complete description of how it works check: 'helpers/music_graph_descriptors_xxx.js'.	And to see the map rendered in your browser like a map check: 'Draw Graph.html'
* DYNGENRE: -> Score  
	Same than WEIGHT + dyngenreWeight  
	Uses a simplification of the GRAPH method. Let's say we assign a number to every "big" cluster of points on the music graph, then we can simply	put any genre/style point into any of those clusters and give them a value. So 'Rock' is linked to 3, the same than 'Roots Rock' or 'Rock & Roll'.It's a more complex method than WEIGHT, but less than GRAPH, which allows cross-linking between different genres breaking from string matching.  
	For a complete description of how it works check: 'helpers/dyngenre_map_xxx.js'

### Other features 
* The pool can be filtered with a flobal forced query (for example to always exclude live tracks).
* The final selection can be choosen from the pool following 4 methods.
  * By score.
  * By probability.
  * Randomly.
  * Using [harmonic mixing](https://github.com/regorxxx/Camelot-Wheel-Notation).
* The final selection (aka playlist) can be sorted following 3 methods:
  *  Randomly.
  *  Following the order the tracks were chosen from the pool.
  *  Scattering instrumentals: Intercalate instrumental tracks breaking clusters if possible.
* Recursive playlist creation (where output tracks are used as new references, and so on).
* Influences and anti-influences playlists.
* There are some custom buttons which may be set according to user preferences, even its own name:  'buttons_search_bydistance_customizable.js'.

![Animation12](https://user-images.githubusercontent.com/83307074/116776801-073aba80-aa5a-11eb-8f3f-82e02ccf265e.gif)
	
## Note about genre/styles
GRAPH method doesn't care whether "Rock" is a genre or a style but the scoring part does! Both values are considered points without any distinction. Genre weight is related to genres, style weight is related to styles.... But there is a workaround, let's say you only use genre tags (and put all values
together there). Then set style weight to zero. It will just check genre tags and the graph part will work the same anyway.

## Note about GRAPH/DYNGENRE exclusions
Apart from the global filter (which applies to genre/style string matching for scoring purpose), there is another filtering done when mapping genres/styles to the graph or their associated static values. See 'map_distance_exclusions' at 'helpers/music_graph_descriptors_xxx.js'.  

It includes those genre/style tags which are not related to an specific musical genre. For ex. "Acoustic" which could be applied to any genre. They are filtered because they have no representation on the graph, not being a real genre/style but a musical characteristic of any musical composition. Therefore, they are useful for similarity scoring purposes but not for the graph. That's why we don't use the global filter for them.  

This second filtering stage is not really needed, but it greatly speedups the calculations if you have tons of files with these tags! In other words, any tag not included in 'helpers/music_graph_descriptors_xxx.js' as part of the graph will be omitted for distance calcs, but you save time if you add it manually to the exclusions (otherwise the entire graph will be visited trying to find a match).

## Note about editing 'helpers/music_graph_descriptors_xxx.js' or user file
Instead of editing the main file, you can add any edit to an user set file named 'helpers/music_graph_descriptors_xxx_user.js'. Check sample for more info. It's irrelevant whether you add your changes to the original file or the user's one but note on future script updates the main file may be updated too. That means you will need to manually merge the changes from the update with your own ones, if you want them. That's the only "problem" editing the main one.  

Both the html and foobar scripts will use any setting on the user file (as if it were in the main file), so there is no other difference.  Anything at this doc which points to 'helpers/music_graph_descriptors_xxx.js' applies the same to 'helpers/music_graph_descriptors_xxx_user.js'.

## Also integrates
 1. [Music-Graph](https://github.com/regorxxx/Music-Graph): An open source graph representation of most genres and styles found on popular, classical and folk music.
 2. [Camelot-Wheel-Notation](https://github.com/regorxxx/Camelot-Wheel-Notation): Javascript implementation of the Camelot Wheel, ready to use "harmonic mixing" rules and translations for standard key notations.

![Draw Graph_05](https://user-images.githubusercontent.com/83307074/116759506-fcecd200-aa01-11eb-8d2c-8a48ebcc73c0.gif)

## Other implementations
 1. [Playlist-Tools-SMP](https://github.com/regorxxx/Playlist-Tools-SMP): Offers different pre-defefined examples for intelligent playlist creation.

![playlist_tools_menu_05](https://user-images.githubusercontent.com/83307074/116759000-cebac280-aa00-11eb-8a81-9a450e13205a.gif)

## Installation
Copy all files from the zip into YOUR_FOOBAR_PROFILE_PATH\scripts\SMP\xxx-scripts  
Any other path WILL NOT work without editing the scripts. (see images\_Installation_*jpg)  
For ex: mine is c:\Users\xxx\AppData\Roaming\foobar2000\scripts\SMP\xxx-scripts\...  
For portable installations >= 1.6: .\foobar2000\profile\scripts\SMP\xxx-scripts\...  
For portable installations <= 1.5: .\foobar2000\scripts\SMP\xxx-scripts\...  
Then load 'buttons_toolbar.js' into a SMP panel within foobar. The toolbar can be configured within foobar to add pre-defined buttons with any of the 3 methods (GRAPH, WEIGHT and DYNGENRE) or to use a fully configurable button which is set using menus (you can add multiple instances of the same buttons).

[changelog]: CHANGELOG.md
[version_badge]: https://img.shields.io/github/release/regorxxx/Search-by-Distance-SMP.svg
[codacy_badge]: https://api.codacy.com/project/badge/Grade/1677d2b0dee54548bf44614fcf808529
[codefactor_badge]: https://www.codefactor.io/repository/github/regorxxx/Search-by-Distance-SMP/badge/main
