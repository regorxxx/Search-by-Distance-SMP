# Changelog

## [Table of Contents]
- [Unreleased](#unreleased)
- [2.1.1](#211---2022-03-06)
- [2.1.0](#210---2022-03-02)
- [2.0.1](#201---2021-12-23)
- [2.0.0](#200---2021-06-15)
- [1.2.0](#120---2021-06-07)
- [1.1.0](#110---2021-05-26)
- [1.0.0](#100---2021-05-02)

## [Unreleased][]
### Added
- Descriptors: added All Music and Last.fm support by linking all their genre/styles to the graph with substitutions.
- HTML: Changed CSS layout to adjust sizes according to window.
- HTML: Added statistics calculation. To run it, use the associated button, results will be shown on a popup and cached for the current session. Statistics button is now animated while processing
- HTML: Added reset view button.
- HTML: SuperGenre legend is now dragable.
- HTML: Selecting a node and pressing shift while hovering another node shows the distance (+ influences) between them.
- HTML: Selecting a node and pressing shift while hovering another node highlights the shortest path between them.
- HTML: Added favicon.
- Debug: added 'graphStatistics' function which will perform basic statistical analysis over the entire graph, providing variables like: mean, median, standard deviation, distance histogram, etc. Given those values, it's reasonably easy to 'choose' the right values to retrieve nodes for a given similarity. Results are output as text and raw data (in object).
### Changed
- HTML: Changed CSS layout to adjust sizes according to window.
- Similar artists: Added new option to write similar artists tags only to previously non tagged files.
- Helpers: improved sort and query expressions validity checks.
### Removed
### Fixed
- Helpers: avoid file reading crashing in any case (even if it's locked by another process).
- Helpers: fixed query checking not working due to upper/lower case mixing in some cases, should now be pretty robust with RegEx.
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
- Debug: Greatly expanded the debug functions to check possible errors or inconsistencies in the descriptors. It should be foolproof now.
- Descriptors: Multiple fixes on descriptors found with the new debug code.
- Buttons: Variables are now set according to distance variables on descriptors. i.e. if they change at a latter point, they will be re-scaled.
### Removed
- Removed all lodash dependence and deleted helper.
### Fixed

## [1.0.0] - 2021-05-02
### Added
- First release.
### Changed
### Removed
### Fixed

[Unreleased]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v2.1.1...HEAD
[2.1.1]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v2.0.0...v2.1.0
[2.0.1]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v1.2.0...v2.0.0
[1.2.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/6e0ae3f...v1.0.0
