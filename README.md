# Search-by-Distance-SMP
[![version][version_badge]][changelog]
[![CodeFactor][codefactor_badge]](https://www.codefactor.io/repository/github/regorxxx/Search-by-Distance-SMP/overview/main)
[![Codacy Badge][codacy_badge]](https://www.codacy.com/gh/regorxxx/Search-by-Distance-SMP/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=regorxxx/Search-by-Distance-SMP&amp;utm_campaign=Badge_Grade)
![GitHub](https://img.shields.io/github/license/regorxxx/Search-by-Distance-SMP)  
An implementation of [Music-Graph](https://github.com/regorxxx/Music-Graph) for [foobar2000](https://www.foobar2000.org) using [Spider Monkey Panel](https://theqwertiest.github.io/foo_spider_monkey_panel), which creates intelligent "spotify-like" playlist using high-level data from tracks and computing their similarity using genres/styles.

![Animation11](https://user-images.githubusercontent.com/83307074/116761198-80a8bd80-aa06-11eb-904c-b3d50905f6bd.gif)

## Features
Creates playlists using high-level data from tracks similar to the currently selected one according to genre, style, key, etc. When their score is over a threshold, they are included in the final pool. After all tracks have been evaluated and the final pool is complete, some of those tracks are chosen to populate the playlist. You can choose whether this final selection is done according to score, randomly, using harmonic rules, etc. All settings are configurable via button's menus (on customizable button) or the properties panel (static buttons).

To use this plugin at its best and to benefit the most from your library, you will want to make sure that your songs have the most possible information on genre, style, key, moods, etc. These are the weight/tags pairs checked by default:

Weight|Tag|Weight|Tag
-------------|----------------|--------------|-------------
genreWeight | genre | styleWeight | style 
dyngenreWeight  | virtual tag	| moodWeight | mood
keyWeight | key | dateWeight	 | $year(%date%)
bpmWeight | bpm | composerWeight | composer (unused by default)
customStrWeight | (unused by default) | customNumWeight | (unused by default)	 
	
Any Weight/tags pair can be remapped and/or merged (sep. by comma). 
For example, linking genreWeight to 2 different genre tags on your files:
Original Tag|Remap to
-------------|----------------
genreTag |allmusic_genre,my_genre_tag
	
Some weight/tags pairs can be linked to TitleFormat Expr. Use tag names instead of TF expressions when possible (+ performance).
Tag|TF|Tag|TF
-------------|----------------|--------------|-------------
dateTag | $year(%date%) | customNumWeight | (unused by default)	 
	
![search_by_distance_white](https://user-images.githubusercontent.com/83307074/183678441-416b39c1-3fc5-4bca-a45c-60c3f9220723.png)
	
There are 3 methods to calculate similarity between tracks: WEIGHT, GRAPH (see above) and DYNGENRE.

* WEIGHT: -> Score  
	Calculates similarity by scoring according to the tags. Similarity is calculated by simple string matching ('Rock' != 'Soul') and ranges for numeric tags. This means some coherence in tags is needed to make it work, and the script only works with high level data (tags) which should havebeen added to files previously using manual or automatic methods (like MusicBrainz Picard, see note at bottom).

* GRAPH: -> Score + Distance  
	Apart from scoring, it compares the genre/styles tags set to the ones of the reference track using a graph and calculating their minimum mean distance. Imagine [Google maps for genre/styles](https://regorxxx.github.io/Music-Graph/Draw%20Graph.html), and looking for the distance from Rock to Jazz for ex. Note this is totally different to simple string matching, so 'Acid Rock' may be similar to 'Psychedelic Rock' even if they are totally different tag values (or strings). This method is pretty computational intensive.
* DYNGENRE: -> Score + Simplifed Distance
	Uses a simplification of the GRAPH method. Let's say we assign a number to every "big" cluster of points on the music graph, then we can simply	put any genre/style point into any of those clusters and give them a value.

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

## Note about editing 'helpers/music_graph_descriptors_xxx.js' or user file
Graph behavior, new genres or substitutions may be tweaked by the use. Changes to the descriptors may be added to an user file instead of editing the original descriptor: 'helpers/music_graph_descriptors_xxx_user.js'. Check sample for more info.

## Also integrates
 1. [Music-Graph](https://github.com/regorxxx/Music-Graph): An open source graph representation of most genres and styles found on popular, classical and folk music.
 2. [Camelot-Wheel-Notation](https://github.com/regorxxx/Camelot-Wheel-Notation): Javascript implementation of the Camelot Wheel, ready to use "harmonic mixing" rules and translations for standard key notations.

![Draw Graph_05](https://user-images.githubusercontent.com/83307074/116759506-fcecd200-aa01-11eb-8d2c-8a48ebcc73c0.gif)

## Other implementations
 1. [Playlist-Tools-SMP](https://github.com/regorxxx/Playlist-Tools-SMP): Offers different pre-defefined examples for intelligent playlist creation.

![playlist_tools_menu_05](https://user-images.githubusercontent.com/83307074/116759000-cebac280-aa00-11eb-8a81-9a450e13205a.gif)

## Installation
See [_TIPS and INSTALLATION (txt)](https://github.com/regorxxx/Search-by-Distance-SMP/blob/main/_TIPS%20and%20INSTALLATION.txt) and the [Wiki](https://github.com/regorxxx/Search-by-Distance-SMP/wiki/Installation).
Not properly following the installation instructions will result in scripts not working as intended. Please don't report errors before checking this.

[changelog]: CHANGELOG.md
[version_badge]: https://img.shields.io/github/release/regorxxx/Search-by-Distance-SMP.svg
[codacy_badge]: https://api.codacy.com/project/badge/Grade/1677d2b0dee54548bf44614fcf808529
[codefactor_badge]: https://www.codefactor.io/repository/github/regorxxx/Search-by-Distance-SMP/badge/main
