# Changelog

## [Table of Contents]
- [Unreleased](#unreleased)
- [4.0.0](#400---2022-12-12)
- [3.1.0](#310---2022-08-22)
- [3.0.0](#300---2022-08-21)
- [2.3.0](#230---2022-08-12)
- [2.2.4](#224---2022-08-10)
- [2.2.3](#223---2022-08-09)
- [2.2.2](#222---2022-08-07)
- [2.2.1](#221---2022-08-06)
- [2.2.0](#220---2022-08-05)
- [2.1.5](#215---2022-05-23)
- [2.1.4](#214---2022-05-09)
- [2.1.3](#213---2022-05-04)
- [2.1.2](#212---2022-04-13)
- [2.1.1](#211---2022-03-06)
- [2.1.0](#210---2022-03-02)
- [2.0.1](#201---2021-12-23)
- [2.0.0](#200---2021-06-15)
- [1.2.0](#120---2021-06-07)
- [1.1.0](#110---2021-05-26)
- [1.0.0](#100---2021-05-02)

## [Unreleased][]
### Added
### Changed
### Removed
### Fixed

## [4.0.0] - 2022-12-12
### Added
- Configuration: settings may now be shared among all search by distance buttons using the new menu entry. A popup asks to copy the configuration for every found button, which is highlighted on the buttons bar.
- Configuration: added user configurable files at '[FOOBAR PROFILE FOLDER]\js_data\presets\global' to edit default queries and tags for multiple tools. Usually used internally or on properties panel. Don't forget to reload the panels/restart foobar and restore defaults on all relevant buttons and menus to use the new values. It's recommended to do it upon installation of this update.
- Presets: new preset 'Similar artists (G)' to make use of Similar Artists analysis. Similar artists calculation is -obviously- required first.
- Tags: reworked the entire tag system to allow for indefinite custom tags, with weights, ranges, scoring distribution methods, ... Recipes and buttons have been reworked too to account for this.
- Tags: tags cache for Foobar2000 2.0, enabled by default. Disabled on lower versions (since it brings no improvement on processing time). After proper setup and caching of all library tags associated to remapped tags, processing time should be similar to Foobar2000 1.6+ versions.
- Tags: menu entry to -only- reset tag remapping. Asks for cache rebuilding afterwards.
- Smart Shuffle: shuffles tracks according to tags (Artist by default) in a semi-random pattern, ensuring no 2 consecutive tracks have the same tag value. Follows [Spotify design](https://engineering.atspotify.com/2014/02/how-to-shuffle-songs/). Overrides any other sorting when enabled. Contrary to [Spotify's preferences to recently played/loved tracks](https://thetab.com/uk/2021/11/17/spotify-shuffle-explained-228639), this algorithm is truly "random" in the sense that there is no preference for any track, it just ensures artists are distributed evenly with some randomness. Also differs from from 'Scatter by tags' (intercalate) at [Playlist Tools](https://github.com/regorxxx/Playlist-Tools-SMP/) in the way tracks are ordered (without strict alternation), i.e. it doesn't follow a pattern ABCABAA when it's possible to ensure no A tracks are together (ABACABA).
- Scoring Method: new options to set scoring method ('LOGARITHMIC', 'LOGISTIC', 'LINEAR', 'NORMAL'). Default behavior is 'LINEAR' (working the same as before). 'LOGARITHMIC' and 'LOGISTIC' scoring methods take into account that some tracks having a lot of values for some tags don't return so many matches because it's almost impossible to match all of them. Therefore it applies a logarithmic curve, giving an extra weight to lower matches, specially for high tag values counts (n). For ex. when 50% of the tags are matched, that equals to 50% weight applied on 'LINEAR' method but ~70% weight for 'LOGARITHMIC' method and 64%(n<=1) to 85%(n=3) for 'LOGISTIC' method. 'LOGISTIC' method is much more sensitive to the tag value count (n). Configurable per tag. Added related readme to this feature along a chart comparison.
- Base Score: new option to added base score for tags, in case tag is missing for the analyzed tracks. For ex. if BPM is set with a non-zero weight, and the reference track has such tag, usually the script would scan the entire library and check for tracks within a range compatible; in case a track has non BPM tag it would score zero for that tag, which may be undesirable in some situations (when not all tracks on a library contain the same tags or have not been tagedd yet). In such case, that track would always get a lower scoring than any other, since the others have a BPM tag to compare against. Base score option allows to give a default score to such tracks, associated to the tag, to minimize the impact of track missing a tag (in relation to other tracks). Value is zero by default (previous behavior), but may be changed selectively for every tag. Value is also sensible to the scoring method set (see above).
### Changed
- GRAPH: changed distance logic to be invariant to inversion (A->BC = BC -> A) and equivalent tag values (A->B1B2B3 = A-> B1B2) addition; both were lowering the total distance 'for free' in some cases. This will provide better results for tracks with lower tag counts, not so heavily weighted by the number of genre/style values. Distance values have changed for many use-cases so presets have been reworked to account for that.
- GRAPH: minor performance improvement using non-oriented links.
- GRAPH: greater performance improvement using dynamically created pre-filter queries (the same used on WEIGHT method).
- DYNGENRE: greater performance improvement using dynamically created pre-filter queries (the same used on WEIGHT method).
- Descriptors: changed style cluster distance. Presets have been reworked to account for that.
- Descriptors: updated descriptors with multiple additions.
- Descriptors: updated and improved descriptors documentation (present on .js files).
- Tags: reverted default string tags to raw tags instead of using '$ascii(%TAG%)' in favor of internally converting values to ASCII. Works better for multi-value tags in queries. It's recommended to reset tag remapping to default for most users (or manually removing the TF functions if using other tags).
- Tags: when using TF functions on tags, queries now use 'HAS' instead of 'IS' to ensure multi-value tags are taken into consideration (otherwise only single-value tags match). Note this has the side-effect of partial matching being allowed (i.e. 'Rock' matches 'Progressive Rock' too, but not the opposite).
- Tags: all remapped tags now also allow TF functions instead of just tag names. Behavior previously available only on date and custom num tags.
- Tags: the buttons now ask to check for missing genre/styles on the Graph on first initialization.
- Tags: genre/styles not present on the descriptors are no longer considered to calculate the mean distance on GRAPH method. It was supposed to be done via exclusions, but that method did leave some things values on non properly configured setups.
- UI: shift modifier now opens configuration menu on customizable button, and Shift + Ctrl now sets the theme. This is done to follow the same behavior than other buttons having the configuration menu on Shift.
- UI: estimated time for similar artist calculation is now formatted into hours, min and seconds.
- UI: buttons are animated while graph links cache or graph statistics are being calculated.
- UI: customizable button now doesn't allow setting playlist sorting when using harmonic mixing. Submenu is greyed out.
- UI: buttons now show info about background processing if any is being done (usually also animated).
- Similar artists: now shows a popup with the report of similar artists found along their similarity scoring. Previously this info was only logged to console.
- Similar artists: now uses 'LOGARITHMIC' scoring method by default (set on preset file, can still be manually changed there).
- Removed duplicates: all uses of function changed to make use of '$year(%DATE%)' and '$ascii($lower($trim(%TITLE%))' instead of 'DATE' and 'TITLE'. This is a changed ported from Search by Distance, to ensure the most matches possible.
- Remove duplicates: advanced RegEx title matching option. For example, tracks like these would be considered to be duplicates: 'My track (live)', 'My track (acoustic)', 'My track (2022 remix)', ' My track [take 3]', ... but not those with keywords like 'part', 'pt.', 'act' or Roman numerals.
- Remove duplicates: advanced RegEx title matching option. Words with "-in'" and a list of verbs ending in "-in" are matched against "-ing" verbs to further refine the search. For ex. "walkin", "walkin'" and "walking" are all considered equivalent.
- Remove duplicates: TF/tag expression to match duplicates along the advanced RegEx title matching option can be configured on the customizable button. Also found on properties panel.
- Key: queries involving key tags now use all possibles equivalences in different notations (standard, Open keys, Camelot keys). For ex: '((KEY IS A) OR (KEY IS 4d) OR (KEY IS 11B))'.
- Cache: improved graph links cache asynchronous calculation.
- Properties: additional checks to variables and properties. In case a previous property is not valid, reset to default using menus where applicable.
- Properties: remapped tags properties have been rewritten, previous config will be lost. Tags now follow a JSON format, which will be more compatible with TF functions in any field.
- Properties: 'Exclude any track with graph distance greater than (only GRAPH method)' property now also allows 'Infinity' as value, which equals to allowing any genre/style on the graph. But it may be used in conjuction with other filters, like influences or similar artists, thus not being equivalent to 'WEIGHT' or 'DYNGENRE' methods.
- Buttons: reworked pre-defined filters switching, using RegExp, which should hopefully work in almost any case no matter their order or position on the forced query.
- Buttons: reworked input popups for settings on customizable button with specific descriptions, extensive error checking (with feedback popups), etc. It should be pretty clear now what's allowed on every setting, and non valid values will throw a warning (instead of just silently being discarded).
- Buttons: improved 'no background mode' on buttons toolbar with colors and shades adapted to the toolbar background color and following the design of native Foobar2000 buttons for a seamless integration.
- Buttons: improved 'no background mode' on buttons toolbar with proper animations (no longer a bad looking rectangle gradient).
- Helpers: rewritten [Camelot-Wheel-Notation](https://github.com/regorxxx/Camelot-Wheel-Notation) helper.
- Helpers: updated helpers.
- HTML: removed unnecessary console warning on debugging.
- HTML: internal changes for non-oriented links.
- Logging: added some console warnings when specific sorting options override others.
- Minor performance improvement breaking the calculations when the current track can not reach the minimum score.
### Removed
### Fixed
- Remove duplicates: tags may now be set to empty '[]', which disables the feature. Previously threw a crash.
- Recursive Playlist: when duplicates removal tags are set to empty, feature is disabled and a popup warns about it. Previously threw a crash.
- Presets: fixed misspelling of 'SPEECHNESS' at multiple places/presets, on queries, tag name, Picard scripts, etc.
- Key: tracks with a key difference greater than 6 were not properly evaluated, since they are nearer on the key wheel. Being the real distance (6 - difference). i.e. a track with key 12A would be considered at a distance 11 from a track 1A, instead of a distance 1. This happened at the scoring stage (it was properly evaluated at other places), resulting in less tracks being output as similar tracks in most cases (where KEY was used for weighting).
- UI: after renaming custom button, button width was not properly adjusted. Width on panel reload and after renaming did not match.
- UI: estimated time for similar artist calculation was not properly computed when having multiple tracks by same artist(s) on selection.
- UI: recipes were not properly numbered when they had duplicates names.
- UI: some GRAPH-only options where available to configure when using other methods. Now greyed out.
- Tags: remapped key tag was not being used on queries (used 'KEY' in any case). It only affected queries, tags were being retrieved using the right name though.
- Tags: remapped key and BPM tags were not being used on theme creation.
- Tags: remapped tags with commas were not working properly (for example within a function like '$replace(%GENRE%, &,',')').
- Tags: no longer asks to rebuild link cache if genre/style tags have not changed after tag resetting (more of an improvement than a fix).
- Similar artists: remapped genre/style tags were not being properly used on filtering step.
- Similar artists: remapped genre/style tags were not working as expected with TF functions (which are now the default behavior for ASCII handling).
- Similar artists: calculation did not have into consideration tracks with same genre/style values on filtering step.
- Similar artists: in some cases similar artists were duplicated.
- Similar artists: crash when date tag was not set (now uses tracks from any date in such case).
- Cache: graph links cache re-calculation is now blocked when there is already an on-going calculation. User is asked to manually re-run it afterwards via popups now.
- Buttons: crash when adding buttons files not associated to a category by their filename. Only relevant for developers.
- Buttons: no background on buttons configuration for toolbar was not properly set on script init/reloading.
- Buttons: multiple crashes due to wrong variable name when opening popups.
- Buttons: forced query is now checked for queries returning no items on current library, which are now considered non-valid.
- Readmes: separators not being properly identified on readme files checking.

## [3.1.0] - 2022-08-22
### Added
### Changed
- UI: minor improvements to word lists within popups in some instances. Now split in new lines after X elements.
- Helpers: updated helpers.
### Removed
### Fixed

## [3.0.0] - 2022-08-21
### Added
- Readmes: added 'User descriptors' readme.
### Changed
- Descriptors: user file has been moved to profile folder at 'js_data/helpers/music_graph_descriptors_xxx_user.js'. This will ensure it doesn't get overwritten on script updates. Using the menu entries to open the descriptor will automatically create a copy there and open it if it's not found. Users who have been adding changes and being careful to not overwrite the file at the current location only have to copy it manually or use the menu entry to apply the change (and future edits must be done on the data folder). This step is only required once.
- Descriptors: all style/genres on the graph use now ASCII only values, so it should be easier to match any value to them if required.
- HTML: tries to load the user descriptors file from data folder first, then from helpers folder if not found. Will give a warning on console on the latter.
- Tags: default genre and style tags use now '$ascii()' TF function. This will ensure a match when using accents, etc. See change above. On previous installations, change tags to (without quotes): '$ascii(%genre%)' & '$ascii(%style%)'
- Tags: after tag remapping, a popup asks to rebuild the cache.
- Cache: improved graph links cache asynchronous calculation.
### Removed
### Fixed
- Descriptors: minor fix about 'Tuareg Music'.
- Descriptors: fixed warnings about non ASCII values on the descriptors.
- Logging: fixed console logging to file (lines were not being split properly).

## [2.3.0] - 2022-08-12
### Added
- Diagram: diagrams explaining the design logic of similar artists calculation with 3 different methods ('_images\search_by_distance_SIMILAR_ARTISTS(R|V|W)_diagram.png').
- Descriptors: added 'Dembow' and 'Renaissance Rock', along their influences.
- Readmes: added 'Similar artists' readme.
### Changed
- Similar artists: library tracks are now filtered by nearest genre/styles to tracks by selected artist for every track, instead of using only the first track as reference. This should better reflect the works of an artist without depending on the reference track at all. Previously, output score would be heavily dependent on the reference track.
- Similar artists: scores are now weighted with genre/style appearance on all artist's tracks. i.e. if 'Mdour Moctar' has 1 Reggae track on your library and 99 Rock tracks, then if the Reggae track is chosen for the calcs, it's score is weighted as 1% of the total score (instead of averaging all N scores).
- Similar artists: current method uses the 2 above changes, named 'weighted'. Using only the filter change is 'variable'. Previous method based on reference track is named 'reference'. This is an internal change, but functionality -based on names- can be seen on the diagrams. 'Weighted' will be the default method from now on, not meant to be changed (unless the script 'search_bydistance_extra.js' is edited). In resume, this change is aimed to better reflect the entire work of an artist, instead of specific tracks or being tied to random variations.
- Logging: reworked console logging to group buttons loading info into one line.
- Logging: reduced console logging at startup.
- Helpers: switched all callbacks to [event listeners](https://github.com/regorxxx/Callbacks-Framework-SMP).
### Removed
### Fixed
- Similar artists: before choosing N random tracks, from selected artist, duplicates are now removed (to ensure no track is selected twice if it appears at different albums for ex.). Checks for Title + Artist + Date.
- Presets: updated Picard AcousticBrainz presets with fixes to output when values used scientific notation and other weird situations.
- Workaround for some instances where the scripts would warn about some feature not being supported by the OS (due to an OS or SMP bug). 

## [2.2.4] - 2022-08-10
### Added
- Buttons: new menu entry, on custom button, to reset entire button configuration to default values.
### Changed
- Diagram: minor update to diagram to clarify a few things ('_images\search_by_distance_GRAPH_diagram.png').
### Removed
### Fixed
- Tags: composer tag was not being properly used on queries and scoring, leading to wrong results or query errors.
- Tags: custom string tag was not being properly used on queries and scoring, leading to wrong results or query errors.
- Tags: date, BPM and custom num tag was being skipped on calculations when equal to zero. While that may make sense for Date or BPM in real use-cases, the custom tag could be used to also store zero values. Now it will also compare the tags when set to zero, and only skip them when not found.

## [2.2.3] - 2022-08-09
### Added
- Presets: new menu entry on customizable button to show all hidden presets (recipes or themes).
- Presets: new option to hide selected preset (Shift + Click).
- Diagram: diagram explaining the design logic of playlist creation and GRAPH method ('_images\search_by_distance_GRAPH_diagram.png').
### Changed
- Presets: any recipe or theme file starting with 'test_' or 'int_' will be hidden everytime when opening the customizable button's menu.
### Removed
### Fixed
- Presets: None preset was not being shown as current preset when there were no more presets on the list.
- Presets: 'test_with_forcedThemePath.json' recipe is no longer available by default (see change above). Previously a warning popup was shown everytime the menus were called due to inline forced theme path being wrong.

## [2.2.2] - 2022-08-07
### Added
### Changed
### Removed
### Fixed
- Buttons: graph variable 'Exclude any track with graph distance greater than (only GRAPH method' was not being parsed properly when set to a string.
- Buttons: crash when trying to move a button when only a single button script was loaded on the panel.

## [2.2.1] - 2022-08-06
### Added
### Changed
- Logging: minor improvements to console logging when reporting track li
### Removed
### Fixed
- Themes: fix to theme checking. Themes were being reported as non valid when they were fine
- Buttons: forced query was not being properly saved when using pre-defined filters.

## [2.2.0] - 2022-08-05
### Added
- Buttons: added new queries to pre-defined filters (queries).
- Readmes: new readmes for 'Tagging requisites', 'Tags sources' and 'Other tag notes'. They should cover most frequently asked questions about tagging compatible with the tools or tag remapping.
### Changed
- Influences filter: now doesn't overwrite score filter or graph distance filter. Although it was designed to do so (to output any influence without considering score), it did not work in a logical way since those filters can be manually tuned to achieve the same result while also allowing other options.
- Buttons: added new entry to open the file to set pre-defined filters (queries). In case the file is deleted, clicking on the menu entry will recreate it.
- UI: themed buttons are replaced with manually drawn buttons when the first method fails (on Wine for ex.). Console will output: "window.CreateThemeManager('Button') failed, using experimental buttons" in such case.
- UI: enforced SMP version checking via popups.
- Descriptors: Updated descriptors.
- Readmes: rewritten readmes to avoid line wrapping wen showing them within popup for a cleaner presentation.
- Helpers: temp files are now written at 'js_data\temp' instead of 'js_data'.
- Helpers: updated helpers.
- Minor speed optimization on multiple tools/buttons using duplicates removal code.
### Removed
### Fixed
- UI: crash due to themed buttons not being available on wine.
- Readmes: some minor fixes to names displayed and missing entries.
- Crash when using composer tag for similarity.

## [2.1.5] - 2022-05-23
### Added
### Changed
- Helpers: updated helpers.
- Buttons: more warnings on customizable button when forced theme is not found, with popups instead of only logging to console.
### Removed
### Fixed
- Buttons: configuration menu on customizable button was not showing forced theme applied by recipe and disabling the other entries.

## [2.1.4] - 2022-05-09
### Added
### Changed
### Removed
### Fixed
- Crash due to a missing variable when trying to remove duplicates.

## [2.1.3] - 2022-05-04
### Added
### Changed
- Helpers: updated helpers.
### Removed
### Fixed
- Crash in some cases when pool of selected tracks was empty.

## [2.1.2] - 2022-04-13
### Added
- Descriptors: preliminary All Music and Last.fm support by linking their genre/styles to the graph with substitutions (wip).
- HTML: Changed CSS layout to adjust sizes according to window.
- HTML: Added statistics calculation. To run it, use the associated button, results will be shown on a popup and cached for the current session. Statistics button is now animated while processing
- HTML: Added reset view button.
- HTML: SuperGenre legend is now dragable.
- HTML: Selecting a node and pressing shift while hovering another node shows the distance (+ influences) between them.
- HTML: Selecting a node and pressing shift while hovering another node highlights the shortest path between them.
- HTML: Added favicon.
- Debug: added 'graphStatistics' function which will perform basic statistical analysis over the entire graph, providing variables like: mean, median, standard deviation, distance histogram, etc. Given those values, it's reasonably easy to 'choose' the right values to retrieve nodes for a given similarity. Results are output as text and raw data (in object).
- Debug: added multiple letter case checks at debug.
- Debug: added accent checks (instead of single quotes) at debug.
- Debug: added ASCII compatibility checks at debug.
### Changed
- Logging: Greatly optimized console logging when sending selected tacks to console. It now outputs the entire list at once (instead of one entry per track). This reduces processing time by +2 secs for +50 tracks (the standard playlist size)... so total processing time has been reduced in most cases by half just with the logging optimization.
- HTML: Changed CSS layout to adjust sizes according to window.
- Similar artists: Added new option to write similar artists tags only to previously non tagged files.
- Helpers: improved sort and query expressions validity checks.
- Optimized a bit the comparison code along a general cleanup of code.
### Removed
### Fixed
- Descriptors: fixed multiple letter case errors.
- Descriptors: fixed accent usage instead of single quote.
- Cultural Regions: improved capitalization logic.
- Helpers: avoid file reading crashing in any case (even if it's locked by another process).
- Helpers: fixed query checking not working due to upper/lower case mixing in some cases, should now be pretty robust with RegEx.
- Helpers: fixed UI slowdowns when required font is not found (due to excessive console logging). Now a warning popup is shown and logging is only done once per session.
- Logging: Progress code in multiple tools have been fixed to display more accurately the percentage progress in the log.
- Logging: non needed warning about 'name' variable not being recognized on recipes.
- Recipes: 'name' was not being excluded when trying to save a recipe from current properties.
- Properties were not being properly renumbered on some cases when moving buttons.
- Crash when using double pass on harmonic mixing.

## [2.1.1] - 2022-03-06
### Added
### Changed
### Removed
### Fixed
- Crash when using harmonic mixing due to a typo on the code.

## [2.1.0] - 2022-03-02
### Added
- Anti-influences filter: added new setting for conditional anti-influences filtering which only triggers for specific genres when enabled. i.e. using a Jazz track as reference will use it, but a Rock track will skip it. Rationale: some genres are more sensitive to style changes than others. For ex. it may be tolerable to get a grunge track on a rock playlist, but that situation should be absolutely avoided for Classical or Jazz playlists. Compatible with recipe files.
- Similar artists: new option at 'Other tools', in customizable button, to compute the similar artists to those from the currently selected tracks (duplicates are filtered first). I.e. tries to compute something equivalent to 'Similar Artists Last.fm', which can be retrieved with Bio script (but requires internet). In this case the process is entirely offline and uses the already coded routines of Search by Distance to find which artists are usually the most similar to a random set of [50] tracks by every selected artist. It requires some time, since it's equivalent to perform the 'GRAPH' search x 50 times x selected artist. The advantage is that it does not requires internet and works with any artists, whether it's 'popular' or not, since it's not based on things like users' listening behaviors, eurocentric bias, etc. The results are output to console and saved to JSON, so they only need to be calculated once. Later changes to the graph descriptors may affect the results, in that case the same artists may be checked again to update the list if required.
- Similar artists: new option at 'Other tools', in customizable button, to save the similar artists values from JSON to all tracks by the present artists. See previous change. I.e. instead of being saved on JSON, any track by the artist would have a tag named 'Similar Artists' which its own list (<= 10 artists). Once saved on tags, other tools like Playlist Tools may use them to easily create queries, pools, etc.
- Similar artists: new filter option to only use tracks by similar artists as source for all Search by Distance methods. See previous change. It may use both the track's tags or the JSON library. When no data is found, it fallbacks to the selected artist (since is the only one known to be similar to itself). Use of this filter requires to precompute first all similar artist for the library to work properly. The advantage of using it is reduced processing time whenever looking for similar tracks (since most work was done when comparing artists).
- Recipes: new option, in customizable button, to create a recipe file with the current config (does not inherit values from other recipes, only from the user-configured values on the menus). Also export additional variables from properties (see popup).
- Recipes: full documentation of allowed variables to be used is automatically generated on the recipes folder (see 'allowedKeys.txt') whenever the script is updated. So it will be up to date if further changes are included on the future.
- Recipes: now allow tag remapping to be set via properties. See 'test_tag_remap.json' for an example.
- Recipes: recipe nesting is allowed. i.e. a recipe may load another recipe which adds new variables, and this one may also load another recipe which does the same, and so on.... Recipe's variables priority follow order of load if duplicated. A -> B -> C, where C variables may be overridden by B and A.
- Recipes: recipe modularization is allowed. i.e. a recipe may load a set of recipes (instead of nesting), which add or override variables by order of load. A -> [B , C], where C variables may be overridden by B and A. Modularization and nesting may be mixed too. i.e. A -> [B -> D, C], where C variables may be overridden by D, B and A.
- Exclude same artist: new option to exclude currently selected artist before calculating similarity score with queries. It may work in conjunction with the Similar Artists option. Use-case example: to create a playlist with tracks similar to one track by Jimi Hendrix but only considering tracks by other artists, so nothing by Jimi Hendrix is included.
- Minimum score: exposed minimum score filter variable, used in case the pool doesn't have enough tracks with the required score. For ex. if similar tracks require to have a 70% similarity and the desired playlist length is 50 tracks, in case only 40 tracks are found, it tries to fill the playlist usin tracks with lower score (up to minimum score). It was done previously under the hood, but now it's configurable (and therefore can be disabled). Setting it to 100, to -1 or the same value than the score filter, disables it. Compatible with recipe files.
- Harmonic mixing: new option to perform a double pass on harmonic mixing which increases the number of tracks selected for the final mix. Enabled by default.
- Playlist Name: new option to configure the output playlist name. TF expressions are allowed along a placeholder tag for themes (which don't use a track to evaluate the TF expression with). Compatible with recipe files.
- Buttons bar: menu entry to change buttons scale (for high resolution screens or non standard DPI settings).
- Buttons bar: menu entry to enable/disable properties ID on buttons' tooltip.
- Buttons bar: menu entry to change toolbar orientation: Horizontal / Vertical.
- Buttons bar: menu entry to change how max button size is set according to the orientation.
- Buttons bar: buttons can now be freely moved clicking and holding the right mouse button while moving them. This is equivalent to using the menu entry to change buttons position.
- Buttons bar: menu entry to place buttons on new rows / columns if they fill the entire width or height of the panel. Does not require a reload of the panel.
- UI: Added UI columns presets for LRA, for both Columns UI and Default UI. Found at presets folder.
- Debug: added a 'Graph statistics' entry which will perform basic statistical analysis over the entire graph, providing variables like: mean, median, standard deviation, distance histogram, etc. Given those values, it's reasonably easy to 'choose' the right values for the graph distance filter for the desired similarity threshold. Results are output to console.
### Changed
- Cache: now uses the genre and style remapped tags set by the user (first button config takes precedence). Actual tags used are output to console whenever the cache is rebuilt.
- Influences filter: reworked influences and anti-influences filtering to also consider internal term substitutions, it should lead to more precise results now for some tags.
- Buttons bar: buttons scale is now set by default according to system's DPI instead of using a fixed size. If the resulting button size is found to be greater than the panel size, a warning popup is shown.
- Buttons: properties have been renamed to not use numbers before the description. Previous config will be lost on upgrade.
- Buttons: reworked the entire configuration menu to better reflect what each option is related to.
- Themes: when creating a new theme, if a file already exists with the same name, a popup asks now before overwriting the file.
- Recipes: hidden files are now omitted on the menu list.
- Themes: hidden files are now omitted on the menu list.
- Tooltip: shortcuts info on customizable button is now configurable, i.e. can be hidden.
- Helpers: updated helpers.
- General cleanup of code and json file formatting.
- Removed all code and compatibility checks for SMP <1.4.0. 
### Removed
### Fixed
- Pool filtering: fixed crash on pool filtering when tags where not set. Warns with a popup when config is wrong.
- Buttons bar: exposed missing Dyngenre weight configuration on customizable button. It's also greyed out whenever the method is not 'DYNGENRE' on the current recipe or config.
- Buttons bar: menu entry to change buttons position was not working properly.
- Buttons bar: fixed some instances where the buttons properties were not properly moved along the button when changing position.
- Buttons: multiple instances where the input values were not being saved at the customizable button (weights, ranges, etc.).
- Cache: crash when trying to execute a search before cache was calculated on the first seconds of script loading. It only happened on an already initialized foobar session when manually reloading the panel.
- Cache: cache was always being shared between panels after executing a search. Fixed now, it only notifies other panels to share it when there is a change after searching. It's mostly a cosmetic change, to not pollute the console with unnecessary messages (since it did not affect performance or results at all).
- Cache: 'searchByDistance_cacheLinkSet' values were messed up with other cache values due to a typo, now fixed. Did not affect results but it did for performance. Cache reset will be forced when installing the new update to also fix any old files present on previous installations.
- Descriptors: fixed 'Symphonic Prog' error.
- Helpers: file deletion failed when file was read-only.

## [2.0.1] - 2021-12-23
### Added
- Helpers: added full script console logging to file at foobar profile folder ('console.log'). File is reset when reaching 5 MB. Logging is also sent to foobar2000's console (along other components logging).
- Cache: Checks graph links cache size on startup and warns when file size > 40 Mb. This is done to avoid memory leaks, since the file is fully loaded on memory and a corrupted file may increase the map size indefinitely until crashing the panel.
- Buttons: Customizable button now has all additional menu entries found at Playlist Tools button: debug graph, find genre/styles not on graph, reset cache, etc. i.e. both now should offer the same degree of customization and advanced tools.
- Buttons: buttons' text color can now be customized via menus on the bar menu (R. Click on the bar).
- Key tag can now be remapped to another tag (uses 'key' by default). It's also directly configurable on the customizable button, via menus. For other buttons, use the properties panel.
- BPM tag can now be remapped to another tag (uses 'bpm' by default). It's also directly configurable on the customizable button, via menus. For other buttons, use the properties panel.
- Buttons: added a submenu to set variables' weight and range at custom button.
- Buttons: added a submenu to set additional query filters (along the forced query): Acoustic, Instrumental and Female Vocal tracks. They can work in conjunction with any recipe as long as the recipe does not force a query too. Filters may be added or edited on 'xxx-scripts\presets\Search by\filters\custom_button_filters.json'.
- Recipes: added 'LikeADJ (MusicBee)' which replicates functionality of [MusicBee's plugin LikeADJ](https://getmusicbee.com/forum/index.php?topic=24631.0). Uses BPM, Key, Energy, Ratings, Genres and Harmonic Mixing. If only a subset of those things are desired, duplicate the recipe and configure it as needed or simply set a custom button using the recipe as reference with your own changes.
- Recipes: added Acoustic, Instrumental and Female Vocal versions for 'Similar tracks (G)' recipe which forces only acoustic, instrumental or female vocal tracks as output. Style, genre and Picard tags (acousticness, speechiness, gender) -see below- are taken into consideration.
- Harmonic Mixing: now works with Open Keys too (in addition to Camelo Keys and standard notation keys).
- Presets: scripts for Picard to retrieve high level tags (gender, valence, danceability, speechiness, ...) from AcousticBrainz high level data. Tags are easily configurable. AcousticBrainz Tags plugin 2.2+ is required (within Picard). Those tags are meant as a direct replacement, using an open source data model, of Spotify's tags... which can only be retrieved with an API in some software and rely on closed source models and data (new data can not be added by users). If some tracks are not in AcousticBrainz database, they may be [analyzed locally to then send the results to their server](https://musicbrainz.org/doc/How_to_Submit_Analyses_to_AcousticBrainz) and later get the results on Picard.
### Changed
- Cache: now gets refreshed not only when the descriptors change ('music_graph_descriptors_xxx.js' & 'music_graph_descriptors_xxx_user.js') but also when the 2 functions to create the paths or the influences method change. Even if changing those functions is not planned, it ensures the cache reflects the actual state of the graph in any case. In particular, the 'influences bugfix' would have required a manual cache reset by the user without this change which now will be performed automatically. The properties panel now tracks the CRC32 of those 6 items as merged strings (instead of only the 2 descriptors).
- Influences: Added 4 methods top check influences: 'fullPath', 'adjacentNodes', 'zeroNodes' and 'direct'. 'direct' is the previous behavior ("bugged") checking only the first against the last node. 'zeroNodes' the fix listed bellow. 'adjacentNodes' works like zeroNodes but without forcing the adjacent nodes to be substitutions (checks (A,B) against (Y,Z), i.e. max. 4 possible links). 'fullPath' checks all consecutive links on the path (A->B), (B->C), ...) and also applies 'adjacentNodes' logic (to check the origin and final nodes). 'adjacentNodes' is now the default behavior.
- Descriptors: Added a few anti-influences.
- Remove duplicates: optimized the code, now runs at least x2 times faster. Updated all instances where the functions were being used to call the new version.
- Requisites: Script requires at minimum SMP 1.5.2. now.
- Cache: Graph links cache is now calculated asynchronously whenever it's required (on first initialization or when manually forced to do so, thus improving the startup time the first time the panel it's loaded and not blocking the UI on posterior updates.
- Descriptors: Updated descriptors. Added multiple genre and styles to punk, rock, pop, folk, industrial, downtempo and metal super-genres, along their style clusters, substitutions and influence relations.
- Harmonic Mixing: greatly improved speed when the pool had thousands of tracks (improved shuffle method).
- Buttons: toolbar configuration menu now is opened with R. Click (instead of Shift + L. Click on empty space). This is done to allow opening the menu anywhere even when the bar has no empty space left anymore.
- Buttons framework: default icon size is now bigger.
- Buttons: custom button now has a menu entry to rename it after the first time (instead of using the properties panel).
- Buttons: custom button shows the current value on the menu entries (no need to click on them or open properties). It also shows the value if set -forced- by the recipe. 'sbd_max_graph_distance' value is evaluated before displaying (if not using a number).
- Buttons: custom button, reworked a bit the first input popup when setting the name to explain general functionality.
- Buttons: minor renaming for AutoPlaylist - Playlist filter.
- Buttons: Added readmes to configurable button on menus: methods, full documentation and recipes & themes.
- Buttons: loading buttons using the customizable toolbar will show their associated readme (if it exists).
- Buttons: restoring defaults buttons on the toolbar will show the readme of all the restored buttons.
- Buttons: replaced the readme entry on the toolbar menu with a submenu pointing to all readmes of every button.
- Buttons: colors are changed without reloading the panel.
- Buttons: the list of buttons when adding a new one is now split by categories to easily found them according to their functionality. Same with their readme popup.
- Debug: new config to show popup even after test passing (meant to be used along Playlist Tools). Default behavior remains the same, popup only appears if errors are found.
- Installation: Installation path may now be changed by editing 'folders.xxxName' variable at '.\helpers\helpers_xxx.js'. This is a workaround for some SMP limitations when working with relative paths and text files, images or dynamic file loading.
- Helpers: updated. Whenever a folder needs to be created to save a new file, the entire tree is now created if needed. Previously it would fail as soon as any folder did not exist. This greatly speeds up setting panels since now the final folder does not need to exists at all to work, since it will be created on the fly.
- Helpers: additional checks at json loading on all scripts. Warnings via popup when a corrupted file is found.
- All json files are now saved as UTF-8 without BOM. All json files are now read as UTF-8 (forced).
- Link cache is now saved in an human readable structure.
### Removed
### Fixed
- Influences: were not being correctly parsed when the original or the final node was a substitution (zero weight). Now adjacent nodes which may be substitutions are also checked at both sides, for ex for this path: Hip-Hop <- Rap_supergenre <- Rap_cluster <- Rythm Music_supercluster <- Blue_Note_cluster <- Blues_supergenre <- Blues. Where Hip-Hop is a substitution for Rap_supergenre,  Rap_supergenre is checked against Blues_supergenre and/or Blues for (anti)influences. Note it doesn't check for links at Hip-Hop since the influences link are always added to the generic items by design (in this case Rap_supergenre_supergenre), so there is max. 1 possible link. (note this may be overridden by the default behavior listed at top)
- Buttons: Fixed multiple button names while logging loading on console.
- Cache: Fixed crash while trying to parse the cache file if it's being edited at the same time or corrupt.
- Cache: crash when using the tools and link cache has not been built (on the 10 first secs on first startup or after cache resetting).
- Logging: minor fixes at console logging.
- Multiple minor improvements and fixes on path handling for portable installations.
- Multiple minor improvements and fixes when saving files on non existing folder.
- Evaluation of 'sbd_max_graph_distance' at recipes on multiple places is now rounded (just for cleaner logging purpose).

## [2.0.0] - 2021-06-15
### Added
- Recipes: Recipes presets may be used to set variables of the function. Whenever the argument is set, it's used instead of related property. Custom button now allows to use a recipe file. Once set, button would always use the recipe as arguments instead of the properties variables. A recipe may force the use of a theme.
- Recipes: custom button now allows to set the recipe file used by pressing Ctrl + L. Click. 'None' would use the current properties variables, which is the default behaviour.
- Themes: themes presets may be used as reference instead of tracks. Whenever the argument is set, it's used instead of the selection. Custom button now allows to use a theme file. Once set, button would always use the theme as reference instead of the current selection.
- Buttons: custom button now allows to set the theme file used by pressing Shift + L. Click. 'None' would use the current selection, which is the default behavior.
- Buttons: custom button now allows to create a theme file using the currently focused track's tags. See theme menu (Shift + L. Click).
- Buttons: custom button now allows to set most variables using the configuration menu (Ctrl + Shift + L. Click): method, tags remapping, filters, etc. Whenever a config is overridden by a recipe, the related entry is greyed and a warning is shown.
- Buttons: new '_buttons_toolbar.js' toolbar which can be customized without editing the js file. Allows to enable/disable buttons -even add multiple copies- on demand and customize toolbar background color (L. Click on the bar).
### Changed
- Console: shows on console the track or theme used as reference (name and path).
- Buttons: custom button code cleanup and improvements on name changing.
- Buttons: custom button tooltip shows the theme and recipe being used, along tips to change them.
- Buttons: icons to all buttons.
- Buttons framework: skip icon drawing if font is not found.
- Buttons framework: allow a menu when clicking on the panel (and not on buttons).
- Portable: when properties are set for the first time, now use relative paths on profile folder for portable installations (>= 1.6). When possible, any other stored path is also stored as relative paths (for example themes or recipes on buttons).
- Helpers: warn about missing font on console if trying to load a font and is not found.
- Split all buttons into examples, toolbar and buttons folder. 'buttons_toolbar.js' is now the main script -in root folder- which can be loaded within a panel for easy configuration of buttons from this repository or any other.
### Removed
### Fixed
- Console: when playlist length is set to Infinite, warnings are no longer shown about number of tracks being less than it (which obviously always happened).

## [1.2.0] - 2021-06-07
### Added
- Buttons: 4 sets of buttons, one for each method: GRAPH, WEIGHT, DYNGENRE + ONE CONFIGURABLE (method at properties). (This in addition to the fully customizable buttons)
### Changed
- GRAPH: mean distance is now also divided by the number of genre/styles of the reference track. That should give more results for tracks with too many tags, while not changing so much for the rest. Distance filters have been updated accordingly in all buttons to reflect the change (and users should do the same in their customized buttons).
- Buttons framework: updated.
- Helpers: Moved all external libraries to 'helpers-external'.
- Helpers: Split 'helpers_xxx.js' file into multiple ones for easier future maintenance.
- Moved all SMP scripts without UI (those not meant to be loaded directly on panels) to 'main'.
- All buttons now have not needed properties deleted, to not confuse users about things on properties not being reflected on the buttons.
### Removed
### Fixed
- Default args: crashes when trying to access non present properties on the arguments (found while applying the previous changes).
- Cache: crash when sharing cache between 2 panels due to a typo.
- Harmonic Mixing: crash when pool was smaller than set playlist length.
- Harmonic Mixing: not really random due to using sort + random method. Using an array shuffle now instead.
- Random picking: not really random due to using sort + random method. Using an array shuffle now instead.
- GRAPH: setting both genre and style weights to zero output nothing with GRAPH method instead of using the values for the graph and not for weighting.

## [1.1.0] - 2021-05-26
### Added
- Harmonic mixing: multiple debug additions.
- Cache: is now saved to a json file and reused between different sessions. Cuts loading time by 4 secs for 70K tracks on startup (!).
- Cache: gets automatically refreshed whenever the descriptors crc change. i.e. it will be recalculated with any change by the user too.
- Descriptors: Multiple new additions.
### Changed
- Harmonic mixing: small changes and optimizations.
- Harmonic mixing: code for pattern creation moved to camelot_wheel.js.
- Harmonic mixing: code for sending to playlist moved to helpers and reused in multiple scripts.
- Debug: greatly expanded the debug functions to check possible errors or inconsistencies in the descriptors. It should be foolproof now.
- Descriptors: multiple fixes on descriptors found with the new debug code.
- Buttons: variables are now set according to distance variables on descriptors. i.e. if they change at a latter point, they will be re-scaled.
### Removed
- Removed all lodash dependence and deleted helper.
### Fixed

## [1.0.0] - 2021-05-02
### Added
- First release.
### Changed
### Removed
### Fixed

[Unreleased]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v3.1.0...HEAD
[4.0.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v3.1.0...v4.0.0
[3.1.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v2.3.0...v3.0.0
[2.3.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v2.2.4...v2.3.0
[2.2.4]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v2.2.3...v2.2.4
[2.2.3]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v2.2.2...v2.2.3
[2.2.2]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v2.2.1...v2.2.2
[2.2.1]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v2.1.5...v2.2.0
[2.1.5]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v2.1.4...v2.1.5
[2.1.4]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v2.1.3...v2.1.4
[2.1.3]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v2.1.2...v2.1.3
[2.1.2]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v2.1.1...v2.1.2
[2.1.1]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v2.0.0...v2.1.0
[2.0.1]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v1.2.0...v2.0.0
[1.2.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/6e0ae3f...v1.0.0
