# Changelog

## [Table of Contents]
- [Unreleased](#unreleased)
- [7.6.0](#760---2024-10-09)
- [7.5.0](#750---2024-08-13)
- [7.4.0](#740---2024-07-30)
- [7.3.0](#730---2024-07-24)
- [7.2.0](#720---2024-03-21)
- [7.1.0](#710---2024-03-15)
- [7.0.0](#700---2024-02-28)
- [6.1.3](#613---2023-12-17)
- [6.1.2](#612---2023-12-09)
- [6.1.1](#611---2023-12-08)
- [6.1.0](#610---2023-11-28)
- [6.0.1](#601---2023-11-26)
- [6.0.0](#600---2023-11-24)
- [5.1.2](#512---2023-11-16)
- [5.1.1](#511---2023-11-16)
- [5.1.0](#510---2023-11-15)
- [5.0.0](#500---2023-10-05)
- [4.7.0](#470---2023-09-25)
- [4.6.0](#460---2023-09-20)
- [4.5.1](#451---2023-07-29)
- [4.5.0](#450---2023-07-28)
- [4.4.2](#442---2023-06-29)
- [4.4.1](#441---2023-06-27)
- [4.4.0](#440---2023-05-08)
- [4.3.1](#431---2023-03-09)
- [4.3.0](#430---2023-03-08)
- [4.2.1](#421---2023-03-04)
- [4.2.0](#420---2023-03-04)
- [4.1.0](#410---2023-02-22)
- [4.0.3](#403---2023-02-21)
- [4.0.2](#402---2023-02-20)
- [4.0.1](#401---2023-02-19)
- [4.0.0](#400---2023-02-15)
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
- Configuration: new setting (at 'Search method') to stop processing as soon as the playlist is filled. This will greatly improve processing time on huge libraries, as long as the desired playlist size or desired similarity score is low enough. Note enabling this option can not ensure that tracks with highest similarity are shown, it just outputs the first -similar enough- tracks found. To avoid always showing the same tracks, while using this option the source items (library) are shuffled; i.e. consecutive runs will output different tracks (which may partially override other sorting and picking options). Enabling this option may increase performance up to +50% in some cases. This setting is now enabled by default.
- Descriptors: added Drill, Bubblegum Bass, Deconstructed Club, Big Room House Corrido Tumbado styles.
- Descriptors: added Mainstream Electronic and Latin Urban Music & Rap XL cluster.
- Descriptors: added influences and anti-influences for Freak Folk and Dream Pop.
- UI: toolbar tooltip now shows 'Shift + Win + R. Click' shortcut to open SMP/JSpliter panel menu (which works globally on any script and panel, at any position).
- Readmes: Ctrl + L. Click on any entry within 'Add button' submenu on toolbar now opens directly their associated readme (without actually adding the button).
- Info: added hated stats.
- Info: added artist stats. Total artists from selected genre and top 5 artists (by # tracks).
### Changed
- Dynamic queries: the submenu on the customizable button showing the filters now shows the current filter count, if any.
- Dynamic queries: non recognized filters are now shown as individual entries which open a popup with the query if clicked.
- Dynamic queries: improved entries file formatting on windows text editors which parse new lines only with CR+LF instead of LF.
- Dynamic queries: support for '*' wildcard (also for multi-value tags). i.e. 'ARTIST IS #ARTIST*%' -> 'ARTIST IS A*'
- Dynamic queries: support for 'ALBUM ARTIST' fallback expansion for multi-value tags. Note in foobar2000 '%ALBUM ARTIST%' works as a virtual tag pointing to ALBUM ARTIST|ARTIST|COMPOSER (but values are joined with commads) and 'ALBUM ARTIST' points to a file tag, thus never working with multiple values as intended. i.e. 'ALBUM ARTIST IS ACDC' only works if the track has a real tag with such value, but '%ALBUM ARTIST% IS ACDC' would not work properly with a track with 2 artists. Dynamic queries will automatically replace queries like 'ALBUM ARTIST IS #ALBUM ARTIST#' -> '(ALBUM ARTIST PRESENT AND ALBUM ARTIST IS #ALBUM ARTIST#) OR (ALBUM ARTIST MISSING AND ARTIST IS #ARTIST#)', thus working as intended in most cases.
- Tags: small performance improvements when using the setting 'Asciify string values internally'.
- Info: loved/hated tracks follow global tags settings.
- Configuration: anti-influences filters enabled by default on new installations.
- Debug: checked tags are now shown at 'Find genre/styles not on Graph' tool.
- Debug: expanded profiling logs and tools.
- UI: improvements of menu entries related to settings.
- Helpers: updated helpers.
- Helpers: general code cleanup on menus internal code. Please report any bug on extra separators or menu entries not working as expected.
- Performance improvements using GRAPH (approx. 17%) and WEIGHT (approx. 13%) modes.
### Removed
- Console: removed warnings about 'related' and 'unrelated' tags not being found when weight was non zero on basic logging (since that should be the most common use-case).
### Fixed
- UI: '&' being displayed as '_' on tooltips.
- Tags: fixed wrong application of LOGARITHMIC distribution for ranges greater than 100%, resulting in NaN values for the total socre. It did not affect the final results in any case, but resulted in some errors when refactoring the code. The fix should also add some small performance improvement.
- Dynamic Queries: improved support for tags with '#' values (for ex. KEY tags).
- Wrong warning about Smart Shuffle Tag not being set if it was empty even when the feature was not used.
- Wrong warning about Recursive playlist creation and no tags for duplicates removal even when the former feature was not used.

## [7.6.0] - 2024-10-09
### Added
### Changed
- UI: tag slots on search button can now be cloned. Note cloning also carries over any modification introduced by the active recipe.
- UI: tag entries on info button can now be cloned.
- Configuration: changed the remove duplicates bias to prefer tracks containing 'BEST' within a 'TRACKDSP' tag.
- [JSplitter (SMP)](https://foobar2000.ru/forum/viewtopic.php?t=6378&start=360) support and ES2021 compatibility.
- Helpers: in case saving a file throws an error due to long paths (+255 chars) a warning popup will be shown.
- Helpers: updated helpers.
### Removed
### Fixed

## [7.5.0] - 2024-08-13
### Added
- Similar artists: added readme to similar artists filter explaining its usage.
- Similar artists: added new option to use the similar artists tags and database from other scripts. For ex. [ListenBrainz-SMP](https://github.com/regorxxx/ListenBrainz-SMP)
- Near Genres Filter: added support at recipes.
- Near filter: added "aggressiveness" setting to tweak how the auto mode works. Higher values will further filter the library, while lower values will filter in a more relaxed way.
- Console: exposed all logging settings into 'Debug and testing' submenu of customizable button. Make use of these when reporting errors (and share the console logs).
### Changed
- Similar artists: reworked similar artists database handling and unified processing with other similar artists databases (like ListenBrainz one included on other scripts).
- Similar artists: recipe for calculation now uses the near genres filter added at [7.4.0](#740---2024-07-30) on auto mode. Total processing time should now be much lower than before, processing 3k artists in a few hours at max instead of days.
- Similar artists: similar artist tags may now be remapped (globally) at '[FOOBAR_PROFILE]\js_data\presets\global\globTags.json'.
- UI: Smart shuffle sorting bias custom entry now shows as default TF expression the last one used if it was associated to a named entry (instead of its name).
- UI: cleanup and reordering of 'Debug and testing' submenu.
- UI: the input box to set the GRAPH distance now allows a value of zero (i.e. only tracks with same genre/styles).
- UI: the input box to set the GRAPH distance now warns if the value used will limit results to only tracks with same genre/styles. This may happen not only when it's set to 0, but also if the distance is lower than the minimum distance between 2 points at the graph. This warning also applies for the near genres filter custom input.
- Debug: improved debug of descriptors weights (and keys).
- Helpers: updated helpers.
- Performance improvement (approx. 8%) due to code cleanup.
### Removed
### Fixed
- Near Genres Filter: fix crash using 'WEIGHT' method if the filter was active. [Issue 32](https://github.com/regorxxx/Search-by-Distance-SMP/issues/32).
- Genre Cultural Filter: fix crash in some methods if to 'Genre/style Region' tag had no assigned weight and the filter was active. [Issue 32](https://github.com/regorxxx/Search-by-Distance-SMP/issues/32).
- UI: crash opening settings menu with some recipes. [Issue 33](https://github.com/regorxxx/Search-by-Distance-SMP/issues/33).
- UI: minor errors on menu entries tips.
- Smart shuffle: foo_playcount was not being properly detected (instead looking for foo_enhanced_playcount).
- Tags cache: crash due to wrong path at include code.
- Tags: crash in some corner cases using WEIGHT method. See [Issue 34](https://github.com/regorxxx/Search-by-Distance-SMP/issues/34)
- Tags: crash in some corner cases if tags were not properly set. See [Issue 34](https://github.com/regorxxx/Search-by-Distance-SMP/issues/34)

## [7.4.0] - 2024-07-30
### Added
- Descriptors: added Retrowave style.
- Near Genres Filter: new option to filter the library using only genres/styles which are near the selected reference, greatly reducing processing time up to 50% (although some corner cases similar after calculating the mean distance may be excluded). By default is set to Auto. It works with any of the search methods, although it uses the genres relationship found at the GRAPH method.
### Changed
- UI: minor QoL improvements on menu entries.
### Removed
### Fixed

## [7.3.0] - 2024-07-24
### Added
- Descriptors: added Cloud Rap, Grime, Deathcore, Neoperreo, Emo Rap, Rumba Flamenca and Dark Techno styles.
- Descriptors: added Gothic XL style, Urban Rap XL, Urban R&B XL, Electronic Rap XL, Sad Emo XL, Progressive Electronic XL and Early Progressive Electronic XL cluster.
- Remove duplicates: added multi-value parsing to duplicates removal. i.e. A track with multiple artists but same title can be considered a duplicated if at least one of those artists matches (instead of requiring all to match).  This setting can be switched at the 'Other settings...\Duplicates' submenu. See [this](https://github.com/regorxxx/Search-by-Distance-SMP/issues/31#issuecomment-2111061984) for more info.
- Tags: to simplify the usage of 'RELATED' and 'UNRELATED' tags, new entries at the customizable button (see Other tools\Relate selected tracks...) have been added. They allow to add the 'ARTIST' values to 'RELATED' or 'UNRELATED' tags for the selected tracks (skipping the own artist of the track upon tagging).
- Readmes: added readme for global settings found at 'foobar2000\js_data\presets\global' .json files.
- Configuration: expanded user configurable file at '[FOOBAR PROFILE FOLDER]\js_data\presets\global\globSettings.json' with a new setting for console logging to file. Disabled by default. Now this is a change from the previous behavior, where console was always logged to 'console.log' file at the [FOOBAR PROFILE FOLDER]. It can now be switched, but since it's probably not useful for most users is disabled by default.
### Changed
- GRAPH: better handling of substitutions, which are now parsed before calculating scores, in case they introduce duplicates (like 'Trap' and 'Latin Trap' both being replaced by 'Trap').
- Descriptors: improved AllMusic support.
- Descriptors: updated some primary and secondary influences.
- Descriptors: updated some anti-influences (in particular for jazz styles).
- Configuration: changed the remove duplicates bias to prefer lossless tracks with 16 bits per sample, 44.1 Khz sample rate and greater %DYNAMIC RANGE% values.
- Tags: reworked similar artists, same artist and cultural filters to better handle tag values with commas.
- Tags: relating/unrelating tracks by MBID or title now skips the own value of such tags before tagging. i.e. you can select multiple tracks with same title, and they will not add that title on theirselves but only different ones.
- UI: tag values are now listed on the button tooltip of info button.
- UI: info button tooltip behavior now follows the global setting for the toolbar.
- UI: minor menu tweaks to better group and name some settings.
- UI: minor menu tweaks to reports.
- Presets: reworked changes introduced at [4.0.0](#400---2023-02-15) related to graph distance.
- Presets: enhanced parsing of recipe's variables.
- Presets: new recipes and query filter presets are now saved with Windows EOL for compatibility improvements with Windows text editors.
- Remove duplicates: improved performance of duplicates removal in multiple places.
- Helpers: json button files are now saved with Windows EOL for compatibility improvements with Windows text editors.
- Helpers: updated helpers.
- Performance improvement (approx. 15%) changing the 'RELATED'/'UNRELATED' tags logic usage implemented at [7.0.0](#700---2024-02-28). Note this change applies no matter the reference tracks has or not such tags, as long as they have a weight associated.
### Removed
### Fixed
- Influences: in some cases (anti)influences weight was not considered properly to calculate the total graph distance between nodes which had multiple links.
- Presets: recipe error on some cases for user-created recipes. May require to rebuild user created recipes (or remove any trace of "poolFilteringTag" from them using a text editor). Issue #30.
- Tags: new tags created via popups, using percentage ranges, were missing the range property. Issue #29.
- Configuration: .json files at 'foobar2000\js_data\presets\global' not being saved with the calculated properties based on user values from other files.
## [7.2.0] - 2024-03-21
### Added
- Descriptors: added Musical, Cabaret, Murga, Industrial Musical, Rock Musical, Music Hall, Revue, Vaudeville and Chèo styles.
### Changed
- Helpers: updated helpers.
### Removed
### Fixed

## [7.1.0] - 2024-03-15
### Added
- Configuration: expanded user configurable file at '[FOOBAR PROFILE FOLDER]\js_data\presets\global\globSettings.json' with a new setting for panel repaint debugging purpose. Disabled by default.
- Configuration: expanded user configurable file at '[FOOBAR PROFILE FOLDER]\js_data\presets\global\globSettings.json' with a new setting to check OS features on every panel startup. Enabled by default. This has been the default behavior since OS' features check was implemented, but it can now be disabled to improve init performance a bit, specially at foobar2000 startup (since it seems to hang in some cases when running it on slow HDDs or systems).
### Changed
- UI: Improved panel repaint routines to minimize resources usage.
- Helpers: updated helpers.
### Removed
### Fixed
- Presets: fixed LUFS TitleFormat CUI preset.

## [7.0.0] - 2024-02-28
### Added
- Tags: added 'RELATED' and 'UNRELATED' tags which may be used to specify tracks which are considered similar or not similar by the user. Matching the tag adds the given weight as absolute score to the total, i.e. it's not averaged with all weights. These special tags may use as values any combination of 'TITLE', 'ARTIST' or 'MUSICBRAINZ_TRACKID'. As expected, giving a title, would match any track with such title (from any artist). Giving an artist would match any track from such artist. And using the id value, would ensure only specific tracks are matched. This is something similar to the love/hate feature on Spotify (to make tracks appear or not on generated playlists), although in this case these special tags ensure you are only excluding/including specific tracks in relation to others, not globally. See the readme for more info.
- Tags: to simplify the usage of 'RELATED' and 'UNRELATED' tags (see above), new entries at the customizable button (see Other tools\Relate selected tracks...) have been added. They allow to add the 'MUSICBRAINZ_TRACKID' values to 'RELATED' or 'UNRELATED' tags for the selected tracks or the last track used as reference in a few clicks.
- Dynamic queries: added new dynamic queries for tracks within a date period relative to the reference track.
- Dynamic queries: added 'None' entry to clean all dynamic queries. If the entry is not checked, then there is at least a dynamic query set (even if it's not shown on the menus).
- Configuration: added COMPOSER to the list of global tags.
- Configuration: added LOCALE LAST.FM to the list of global tags.
- Configuration: added integrity checks to global user settings files, found at '[FOOBAR PROFILE FOLDER]\js_data\presets\global\[...].json'. In particular queries are now check to ensure they are valid and will throw a popup at init otherwise. Other settings are check to ensure they contain valid values too.
- Configuration: expanded user configurable file at '[FOOBAR PROFILE FOLDER]\js_data\presets\global\globSettings.json' with a new setting to output to console profiling logs at script init. They work globally. Disabled by default.
- Descriptors: added Symphonic Rap style.
- Toolbar: new settings for text (or icon) position: left, right (default), top and bottom. These settings mimic CUI options at the buttons bar.
- Toolbar: new settings for text scale (now independent of button and icon scale).
- Toolbar: new settings for icon scale (now independent of button and text scale).
### Changed
- Info: improved genre/style identification for substitutions and clusters.
- Tags: improved queries created according to tags and weights when using 'Negative score for tags out of range'; as result processing time may be lower in some cases (if weight is not high enough to filter a track by such tag but negative cases would exclude it).
- Cultural Regions: improvements to processing when using cultural filters in some cases.
- Cache: changed cache structure to minimize file size (up to 50%) and loading time (up to 30%). Link cache will need to be rebuilt on update.
- Configuration: changed the remove duplicates bias to prefer tracks with higher play-counts and positive feedback tag (love/hate).
- Helpers: updated helpers.
- Console: removed unnecessary logging in some cases.
- Console: improved log file formatting on windows text editors which parse new lines only with CR+LF instead of LF.
- UI: wrong parsing of png masks on unix systems (currently, it only affected the ListenBrainz icon when changing the font color).
- Code cleanup.
### Removed
### Fixed
- Scoring Method: fix to incorrect handling of (negative) values outside range for some methods ('NORMAL' and 'LOGISTIC').
- Readmes: minor fix to  'search_by_distance_info.txt' file.
- Info: minor fixes to reports provided by 'search_by_distance_info' button.
- Tags: incorrect handling of single-value tags in some cases. Issue #22.
- Tags: incorrect handling of empty tags in some cases.
- Tags: incorrect graph distance of genre/style tags if there were zero values. A reference with no genre/style tags should fallback to WEIGHT method and compared tracks should report infinite distance when missing the tags in GRAPH method. Issue #27.
- Tags: incorrect scoring of genre/style tags when they were put on custom tags. Issue #25.
- Tags: incorrect handling of genre/style tags not present on the graph for the reference track. Issue #26.
- Toolbar: buttons' size not restored back to normal height after disabling 'Full size buttons' without reloading the panel.
- Internal errors with set.add().
- Crash when using a probability of picking lower than 100 in some cases.
- Minor fixes.

## [6.1.3] - 2023-12-17
### Added
### Changed
- Helpers: updated helpers.
### Removed
### Fixed
- Readmes: missing 'shuffle_by_tags.txt' file.
- Tags: crash in some cases using custom single-valued tags. Issue #22

## [6.1.2] - 2023-12-09
### Added
### Changed
### Removed
### Fixed
- Tags: missing property (baseScore) for new tags. Issue #19

## [6.1.1] - 2023-12-08
### Added
- Toolbar: now supports color for image icons (which are not drawn using fonts).
### Changed
### Removed
### Fixed
- HTML: errors displaying node icons.

## [6.1.0] - 2023-11-28
### Added
- Buttons bar: added compatibility with headless mode (for other buttons).
### Changed
- Helpers: updated helpers.
- Improved error messages about features not working related to OS checks (at startup) with tips and warnings.
### Removed
### Fixed

## [6.0.1] - 2023-11-26
### Added
- UI: added setting to disable tooltip on all scripts. Found at '[FOOBAR PROFILE FOLDER]\js_data\presets\global\globSettings.json', by changing 'bTooltip'. By default tooltip is always shown. This setting will never be exposed within foobar, only at this file.
### Changed
### Removed
### Fixed
- HTML: errors displaying node distances on HTML file. [Issue](https://github.com/regorxxx/Music-Graph/issues/3)

## [6.0.0] - 2023-11-24
### Added
- Buttons: added new button 'search_by_distance_info', which pretty basic functionality right now, to display general statistics for a genre/style from the selected track. That data may come handy in creating new playlists (for tuning settings or filters), or to be used along [Timeline-SMP](https://regorxxx.github.io/foobar2000-SMP.github.io/scripts/timeline-smp/) or [World-Map-SMP](https://regorxxx.github.io/foobar2000-SMP.github.io/scripts/world-map-smp/) statistics.
- Buttons bar: new setting to enable asynchronous loading of buttons, now the default behavior.
- Descriptors: added Country Rap, Square Dance, Rodeo, Jug Band, K-Pop, J-Pop and Kayokyoku styles.
- Descriptors: improved debug tests to avoid duplicates entries in substitutions, influences, etc.
- Dynamic queries: added dynamic queries (like those found at [Playlist Tools](https://github.com/regorxxx/Playlist-Tools-SMP/)) for tracks and themes. Dynamic queries are like standard queries but with placeholders (#DATE#) which are evaluated on-the-fly, before running the query, using the selected reference track (or theme).  These queries are then used to filter the library at pre-scoring stage, changing the filter according to the reference For ex. for a Bob Dylan's track: COMPOSER IS #ARTIST# -> COMPOSER IS Bob Dylan. Full documentation can be found on the associated readme.
- Readmes: added readmes for dynamic queries, cultural filters and influence filters.
- HTML: added buttons to graph html page to directly go to live version or open the GitHub repository.
### Changed
- Descriptors: improved AllMusic support.
- Descriptors: extended debug tests for accents, ASCII compatibility and capitalization for all entries (including AllMusic).
- Configuration: extended tag checking at init also for user settings (and not only default values). They were already tagged with actual values at runtime and after editing tags.
- UI: tooltip while calculating the link cache (the button is animated) now shows the remaining percentage for every step.
- UI: minor cleanup of menus. Negative scoring for out of range tags setting may be reset after installation.
- Readmes: improved cultural and tags readme.
- HTML: minor UI tweaks to graph html page.
- HTML: moved HTML related scripts to its own folder.
- HTML: updated jquery dependency of graph html page.
- Debug: cleanup of debug routines, added comments about symmetries for distance calculation and better logging.
- Helpers: updated helpers.
- Console: reduced max log file size to 1 MB.
- Minor speed optimizations when looking for similar tracks using 'GRAPH' method.
### Removed
- Buttons bar: 'buttons\examples' folder, for file examples check [Playlist Tools](https://github.com/regorxxx/Playlist-Tools-SMP/).
### Fixed
- Pathfinder: fix long time bug on A* pathfinder which made it unusable. NBA* was used anyway so it doesn't affect at all current functionality.
- Pathfinder: fix distances output by getDistanceFromPath() due to incorrect handling of multi-edge graphs on [ngraph.graph](https://github.com/anvaka/ngraph.graph), where only the first link found was used. As result new distance values could be lower in some cases.
- Presets: non valid keys error on 'Similar genres (DYNGENRE)' recipe. Issue #16
- Descriptors: cleanup of duplicates entries and other minor errors in substitutions, influences, etc.
- Auto-update: changed logic to check [Playlist Tools](https://github.com/regorxxx/Playlist-Tools-SMP/)'s buttons updates independently to the toolbar version, so mixed scripts versions no longer produce false negatives.

## [5.1.2] - 2023-11-16
### Added
- Configuration: 'Restore defaults' menu entry at tag configuration.
- Configuration: base tags checking at init, when running the tool or editing tags in some way. A descriptive popup will show instructions about what to do if an error is found (see below).
### Changed
### Removed
### Fixed
- Buttons bar: border setting was grayed out when the buttons color had been set.
- "Tag missing multi-value type (multiple, single): dynGenre" warnings with dynGenre recipes, due to missing key at the base tags at properties. Use the 'Restore defaults' menu entry above for dynGenre tag to fix it on previous installations, new installations will use the right values automatically.

## [5.1.1] - 2023-11-16
### Added
### Changed
- Buttons bar: transparency input popup now has a description for the values.
- Descriptors: improved debug routines to avoid situations where a susbstitution term doesn't exist in the graph (see below).
- Descriptors: improved pathfinder routines to throw -with a descriptive error- when a path is not found due to some genre not being connected to the graph (see below).
### Removed
### Fixed
- Descriptors: added 'Kawaii Metal' and 'Darksynth' styles to cultural map.
- Descriptors: crash in some cases due to malformed descriptor. 'Kuduro' genre was not added properly as substitution. 

## [5.1.0] - 2023-11-15
### Added
- Auto-update: added -optional- automatic checks for updates on script load; enabled by default. Compares version of current file against GitHub repository. Manual checking can also be found at the settings menu. For buttons within the toolbar every button will check for updates independently (although the toolbar menu has an entry for batch checking). Setting may also be globally switched at '[FOOBAR PROFILE FOLDER]\js_data\presets\global\globSettings.json', by changing 'bAutoUpdateCheck'. It will apply by default to any new installed script (previous scripts will still need to be manually configured to change them).
- Descriptors: AllMusic support linking their genre/styles to the graph with substitutions. These tags are usually added by [Biography](https://github.com/Wil-B/Biography/) script. It may be enabled at the tags remap submenu of the customizable button. Setting is applied per panel (i.e. shared between different buttons on the same bar).
- Descriptors: added 'Chamber Music XL', Orchestral Music XL', 'Ballroom Music XL', 'Poetry-Secular Music XL', 'Choral-Spiritual Music XL' and 'Choral-Orchestral Music XL' classical music style clusters.
- Descriptors: added 'Kawaii Metal', 'Branle' and 'Darksynth' styles.
- Buttons bar: added some safe-checks to panel properties.
- Buttons bar: added custom button hover color and customization.
- Buttons bar: added custom offset for buttons along X/Y axis.
- Buttons bar: added full size mode for buttons, which will use full Width/Height according to Y/X orientation.
- Added setting to disable popups related to features not being supported by the OS (at startup). Found at '[FOOBAR PROFILE FOLDER]\js_data\presets\global\globSettings.json', by changing 'bPopupOnCheckSOFeatures'. By default popups are always shown. This setting will never be exposed within foobar, only at this file.
### Changed
- UI: toolbar's color menu entries now show the color name along the menu entry. 'none' equals to no color.
- Buttons bar: renamed background buttons to 'Use themed buttons', which depends on the windows theme.
- Helpers: updated helpers.
### Removed
### Fixed

## [5.0.0] - 2023-10-05
### Added
- Cultural Regions: new virtual tag named 'artistRegion' which uses artist's country data from 'locale last.fm' file tag or [World-Map-SMP](https://github.com/regorxxx/World-Map-SMP)'s database for comparison with a weight according to distance between cultural groups. i.e. a Spanish artist would be considered more similar to French than American artists. It can currently differentiate by country, region or continent. Note this is obviously not mean to be used along, since the genre similarities between different cultural groups/continents (i.e. Spanish rock vs American rock) are already managed by using the 'GRAPH' method or the new tag below, but it may come handy to prioritize tracks from the same region. This is the "tag scoring" version of the cultural filters [4.7.0](#470---2023-09-25). Check 'Tags & Weights: cultural' in the customizable button for more info.
- Cultural Regions: new virtual tag named 'genreStyleRegion' which uses internal genre mapping to cultural regions for comparison with a weight according to distance between cultural groups. i.e. instead of using the artist's origin, it uses the track genre's origin; therefore a blues track is considered similar -at least for this weight- no matter if it's played by a Japanese or American artist. This is the "tag scoring" version of the cultural filters [4.7.0](#470---2023-09-25). Check 'Tags & Weights: cultural' in the customizable button for more info.
- Configuration: new setting to invert the picking order for any method (i.e. taking tracks by lowest score first).
- Configuration: new setting to invert the sorting order for any method (independent to the picking method).
- Descriptors: updated descriptors with multiple additions: Kuduro, Semba, Kizomba, African Ritual-Tribal, Afro-Latin Ritual-Tribal, Asian Ritual-Tribal, Aboriginal Folk, Pre-Columbian Ritual-Tribal, Mbalax, Melodic Techno-House.
- Debug: cultural regions are now also checked to ensure every item on the graph is also included.
### Changed
- Configuration: pool picking submenu on customizable button is now disabled when using harmonic mixing.
- Configuration: expanded user configurable files at '[FOOBAR PROFILE FOLDER]\js_data\presets\global' with new queries. File will be automatically updated with new values (maintaining the user settings).
- Configuration: improved the user configurable files update check for missing keys.
- UI: menus to remap tags on customizable button now show the weight on the submenu name to easily have a general vision of all tag weights.
- UI: global genre/style filter property has been renamed to 'Filter for genre/style' (old setting will be lost).
- Tags: changed default weight values for tags. 'dynGenre' weight is now 15, 'artistRegion' weight is 5, 'genreStyleRegion' is 7, '. To apply these changes, restore defaults at 'Set Tags and weighting...'.
- Tags: changed default range values and scoring method for tags.'key' scoring distribution is LOGARITHMIC and range set to 3, 'date' scoring distribution is NORMAL and range set to 30, 'BPM' scoring distribution is NORMAL and range set to 50. To apply these changes, restore defaults at 'Set Tags and weighting...'.
- Tags: improved handling when some of the default tags are missing.
- Tags: improved logging when reference track does not have a tag.
### Removed
- UI: tags cache menu entry on customizable button has been removed (the setting is still accessible via the properties panel).
### Fixed

## [4.7.0] - 2023-09-25
### Added
- Cultural Regions: new artist cultural filter -for the customizable button- which allows to output only tracks by artists from same country, region, continent or worldwide. There is also an opposite version to output from different regions. 'LOCALE LAST.FM' tag must be set on files, or [World-Map-SMP](https://github.com/regorxxx/World-Map-SMP) installed (its database is used). When used along genre/style weighting, specially in GRAPH method, min. score, max. distance and/or weight should be adjusted to allow different enough tracks on the pool and letting the cultural filter do its work.
- Cultural Regions: new genre/style cultural filter -for the customizable button- which allows to output only tracks whose genres/styles originate from same region, continent or worldwide. There is also an opposite version to output from different regions. No need for external scripts. When used along genre/style weighting, specially in GRAPH method, min. score, max. distance and/or weight should be adjusted to allow different enough tracks on the pool and letting the cultural filter do its work.
### Changed
- Themes: now also save the ISO country code from selected track when created (to be used with the new cultural filter).
### Removed
### Fixed
- Tags: filters using queries related to genre/styles (influences filter) were not working as intended for multivalue-tags. 

## [4.6.0] - 2023-09-20
### Added
- Descriptors: updated descriptors with addition of 'Electrorock', 'Sephardic', 'Classical Sufi' and 'Electronic Sufi'. New 'Progressive Psychedelic Fusion XL' cluster.
### Changed
- Helpers: updated helpers
### Removed
### Fixed
- HTML: fix broken rendering due to file path change.
- Cultural Regions: name replacers not being used at some stages of the code.

## [4.5.1] - 2023-07-29
### Added
### Changed
### Removed
### Fixed
- Configuration: some fixes for ALBUM ARTIST usage instead of ARTIST. To apply the change on existing installations, delete '[foobar_profile]\js_data\presets\global\globQuery.json' and '[foobar_profile]\foobar2000\js_data\presets\global\globTags.json' files.
- Dynamic Queries: some fixes for KEY usage with values containing '#'.

## [4.5.0] - 2023-07-28
### Added
- Smart shuffle: new sorting bias settings. Key (sorted from 12A to 1B), Key 6A centered (starting from 6A). Using these is like merging Harmonic Mix (consecutive tracks should have similar keys) and Smart Shuffle.
- Descriptors: updated descriptors with multiple additions and improvements for Folk and Progressive Rock music.
### Changed
- Configuration: ALBUM ARTIST is now used instead of ARTIST by default (on new installations). This ensures better compatibility with classical music, where the artist is the actual performer but the album artist is the original composer/artist. To apply the change on existing installations, delete '[foobar_profile]\js_data\presets\global\globQuery.json' and '[foobar_profile]\foobar2000\js_data\presets\global\globTags.json' files. Further configuration may be needed via menus.
- Descriptors: improved debug checks for the genre/style graph.
- Helpers: updated helpers.
### Removed
### Fixed
- Fix for non [standard hyphen chars](https://jakubmarian.com/hyphen-minus-en-dash-and-em-dash-difference-and-usage-in-english/) on path names.

## [4.4.2] - 2023-06-29
### Added
### Changed
### Removed
### Fixed
- Helpers: fixed incorrect warning about missing font.

## [4.4.1] - 2023-06-27
### Added
### Changed
- Buttons: after a query error, input box is shown again with last input to fix the error and retry.
- Remove duplicates: when removing duplicates, tracks left for comparison are now preferred by a configurable TF expression. By default higher rating and not live tracks is preferred. This is apart from the forced query filtering (which may result on this feature being irrelevant in some use cases). Delete '[foobar_profile]\js_data\presets\global\globQuery.json' and '[foobar_profile]\foobar2000\js_data\presets\global\globTags.json' files after installation.
### Removed
### Fixed
- Buttons: setting the forced query always returned  'Query returns zero items on current library.' error, for any query. Bug introduced on [4.0.0](#400---2023-02-15).
- Buttons: crash while editing a tag directly in JSON. Bug introduced on [4.4.0](#440---2023-08-08).
- UI: tooltip flickering while pressing Shift/Ctrl over a button in icon-only mode.

## [4.4.0] - 2023-05-08
### Added
- Smart shuffle: additional option to scatter instrumental, live and other tracks while respecting the smart pattern by Artist. For ex. if it can swap tracks without altering the Artist proportion for a given range of tracks, thus moving an instrumental track to another position to soft-limit the appearance of consecutive instrumental tracks. Same rationale applies for live tracks or other special conditions. This somewhat ensures any cluster of tracks is as diverse as possible.
- Smart shuffle: additional options to prioritize tracks by Rating, Play Count (original Spotify's behavior), Last played date, randomly...
- Tags: new menu entry on customizable button to edit raw JSON entry for every tag (in case advanced flags want to be edited, like combinations).
- Descriptors: updated descriptors with multiple additions.
### Changed
- UI: additional info shown according to current settings on customizable button.
- Helpers: updated helpers.
- Console: multiple improvements when logging to file for FbMetadbHandle, FbMetadbHandleList, Error and unknown instances (totally irrelevant except for debug purposes).
- Console: menu entries are no longer logged to console after clicking.
### Removed
### Fixed
- Tags: incorrect query parsing of multi-value tags, with combinations, if number of available values was lower than required.
- Tags: multi-value tags, with combinations (like MOOD), containing TF functions, were not using 'HAS' instead of 'IS' on queries to ensure multi-value tags are taken into consideration.
- UI: tooltip was not showing some settings forced by the current recipe and using the properties instead. Only affected the 'Method' line.
- UI: tooltip flickering while pressing Shift/Ctrl over a button in icon-only mode.

## [4.3.1] - 2023-03-09
### Added
### Changed
### Removed
### Fixed
- Buttons: customizable button's width not properly adjusting to button name after renaming -using menu- in some cases.
- Buttons: customizable button's width not properly adjusting to button name when L. clicking for the first time while it's named 'Customize!'.
- Buttons: wrong customizable button's width and margins at startup.
- Crash when using drag n' drop if a button file was loaded (instead of using the toolbar), although this installation method is no longer supported.

## [4.3.0] - 2023-03-08
### Added
### Changed
- Helpers: updated helpers
### Removed
### Fixed

## [4.2.1] - 2023-03-04
### Added
### Changed
### Removed
### Fixed
- UI: icon now uses a dark-mode version or get inverted according to the button text color.

## [4.2.0] - 2023-03-04
### Added
### Changed
- UI: tweaked and unified buttons weight and margins, adjusted to scale set and DPI.
- UI: minor improvements to readme sub-folders names.
- UI: cursor now changes when over a button.
- UI: cursor now changes while performing buttons drag n' drop. It now clearly indicates when a move is allowed or it's outside the allowed range.
- UI: drag n' drop now only works when the mouse is over a button position. i.e. both the functionality and position rectangle are disabled if the mouse is not on a valid position. Previously moving the button to a blank part of the bar would have simply sent it to the first/last position for ex. This is disallowed now, which makes drag n' drop a bit more intuitive and offers an overall more cohesive experience. It also respects orientation and reflow settings.
- Internal code cleanup of menus.
### Removed
### Fixed
- UI: minor improvements to drag n drop behavior when mouse remains static and R. Click is released. Panel is redrawn immediately instead of waiting to move the mouse, current button remains hovered.
- UI: minor improvements to drag n drop behavior when R. Click menu is called in rapid succession. Panel is redrawn on the background now.
- Console: logging of null value not working properly (totally irrelevant except for debug purposes).
- Missing buttons' readme list.

## [4.1.0] - 2023-02-22
### Added
- UI: default fonts (buttons, icons, toolbar text and tooltip) may now be changed at '[foobar profile]\js_data\presets\global\globFonts.json'.
### Changed
- UI: improved compatibility with some fonts under Unix systems (using Wine). Sometimes weird chars appeared on menu entries.
### Removed
### Fixed
- Cultural Regions: crash when using 'Other tools\Calculate same zone artists' experimental tool due to file path changes on [4.0.0](#400---2023-02-15).

## [4.0.3] - 2023-02-21
### Added
### Changed
### Removed
### Fixed
- Buttons: properties were sometimes reset/mixed/not saved properly moving buttons using the 'Change buttons position' menu. It worked fine using drag n' drop though.
- Buttons: 'buttons_search_by_distance.js' crash when looking for missing genre/styles on Graph.

## [4.0.2] - 2023-02-20
### Added
### Changed
- Helpers: updated helpers
### Removed
### Fixed
- Buttons: 'buttons_search_by_distance.js' crash when showing tooltip under certain configurations.
- Tags: Queries created with some tracks missing tags were wrong, thus giving 0 results, due to not working checks for missing tags since 4.0.0 tag system rework.

## [4.0.1] - 2023-02-19
### Added
- UI: added settings for buttons color (the border and filling).
- UI: added settings for buttons transparency (the filling).
### Changed
- UI: enhanced colors and shading for buttons on mouse over/down when using custom toolbar color modes, etc.
- UI: pressing Ctrl resets selected setting on buttons bar colors submenu.
- Helpers: updated helpers
### Removed
### Fixed
- Buttons: fixed 'Restore default buttons' entry crash (not needed anymore since there are no more 'default buttons'), now replaced with 'Restore all buttons' (which simply restores back default settings for every button).
- Readmes: added missing 'Toolbar' readme.
- Workaround for [SMP bug](https://github.com/TheQwertiest/foo_spider_monkey_panel/issues/205) which made properties not being saved when closing foobar. That made the initial popups on first installation to keep firing on every restart.

## [4.0.0] - 2023-02-15
### Added
- Configuration: settings may now be shared among all search by distance buttons using the new menu entry. A popup asks to copy the configuration for every found button, which is highlighted on the buttons bar.
- Configuration: added user configurable files at '[FOOBAR PROFILE FOLDER]\js_data\presets\global' to edit default queries and tags for multiple tools. Usually used internally or on properties panel. Don't forget to reload the panels/restart foobar and restore defaults on all relevant buttons and menus to use the new values. It's recommended to do it upon installation of this update.
- Configuration: new setting to omit genre/styles not present on the descriptors  while calculating the mean distance on GRAPH method. It was supposed to be done via exclusions, but that method did leave some things values on non properly configured setups, while this setting covers all use-cases (although it requires more processing time).
- Presets: new preset 'Similar artists (G)' to make use of Similar Artists analysis. Similar artists calculation is -obviously- required first.
- Presets: added multiple integrity checks for presets which should ensure they are properly written. Warnings are shown with popups in case errors are found, when using the settings menu at the customizable button, selecting a preset (the list also shows an error warning on name) or when creating a new playlist with the tools.
- Tags: reworked the entire tag system to allow for indefinite custom tags, with weights, ranges, scoring distribution methods, ... Recipes and buttons have been reworked too to account for this.
- Tags: tags cache for Foobar2000 2.0, disabled by default. Disabled (forced) on lower versions (since it brings no improvement on processing time). After proper setup and caching of all library tags associated to remapped tags, processing time should be similar to Foobar2000 1.6+ versions. Enable it only on V2 in case [low memory mode](https://wiki.hydrogenaud.io/index.php?title=Foobar2000:Version_2.0_Beta_Change_Log#Beta_20) is used if better performance is desired.
- Tags: menu entry to -only- reset tag remapping. Asks for cache rebuilding afterwards.
- Smart Shuffle: shuffles tracks according to tags (Artist by default) in a semi-random pattern, ensuring no 2 consecutive tracks have the same tag value. Follows [Spotify design](https://engineering.atspotify.com/2014/02/how-to-shuffle-songs/). Overrides any other sorting when enabled. Contrary to [Spotify's preferences to recently played/loved tracks](https://thetab.com/uk/2021/11/17/spotify-shuffle-explained-228639), this algorithm is truly "random" in the sense that there is no preference for any track, it just ensures artists are distributed evenly with some randomness. Also differs from from 'Scatter by tags' (intercalate) at [Playlist Tools](https://github.com/regorxxx/Playlist-Tools-SMP/) in the way tracks are ordered (without strict alternation), i.e. it doesn't follow a pattern ABCABAA when it's possible to ensure no A tracks are together (ABACABA).
- Scoring Method: new options to set scoring method ('LOGARITHMIC', 'LOGISTIC', 'LINEAR', 'NORMAL'). Default behavior is 'LINEAR' (working the same as before). 'LOGARITHMIC' and 'LOGISTIC' scoring methods take into account that some tracks having a lot of values for some tags don't return so many matches because it's almost impossible to match all of them. Therefore it applies a logarithmic curve, giving an extra weight to lower matches, specially for high tag values counts (n). For ex. when 50% of the tags are matched, that equals to 50% weight applied on 'LINEAR' method but ~70% weight for 'LOGARITHMIC' method and 64%(n<=1) to 85%(n=3) for 'LOGISTIC' method. 'LOGISTIC' method is much more sensitive to the tag value count (n). Configurable per tag. Added related readme to this feature along a chart comparison.
- Base Score: new option to added base score for tags, in case tag is missing for the analyzed tracks. For ex. if BPM is set with a non-zero weight, and the reference track has such tag, usually the script would scan the entire library and check for tracks within a range compatible; in case a track has non BPM tag it would score zero for that tag, which may be undesirable in some situations (when not all tracks on a library contain the same tags or have not been tagged yet). In such case, that track would always get a lower scoring than any other, since the others have a BPM tag to compare against. Base score option allows to give a default score to such tracks, associated to the tag, to minimize the impact of track missing a tag (in relation to other tracks). Value is zero by default (previous behavior), but may be changed selectively for every tag. Value is also sensible to the scoring method set (see above).
- UI: added icons-only mode for toolbar buttons at the toolbar configuration menu ('Other UI configuration'). Tooltip is adjusted to show the button's name there instead. Handy when creating a compact toolbar and icons are good enough to recognize the tools.
- Descriptors: updated descriptors with multiple additions.
### Changed
- GRAPH: changed distance logic to be invariant to inversion (A->BC = BC -> A) and equivalent tag values (A->B1B2B3 = A-> B1B2) addition; both were lowering the total distance 'for free' in some cases. This will provide better results for tracks with lower tag counts, not so heavily weighted by the number of genre/style values. Distance values have changed for many use-cases so presets have been reworked to account for that.
- GRAPH: minor performance improvement using non-oriented links.
- GRAPH: variable performance improvement using dynamically created pre-filter queries (the same used on WEIGHT method).
- DYNGENRE: variable performance improvement using dynamically created pre-filter queries (the same used on WEIGHT method).
- Descriptors: changed style cluster distance. Presets have been reworked to account for that.
- Descriptors: updated and improved descriptors documentation (present on .js files).
- Tags: reverted default string tags to raw tags instead of using '$ascii(%TAG%)' in favor of internally converting values to ASCII. Works better for multi-value tags in queries. It's recommended to reset tag remapping to default for most users (or manually removing the TF functions if using other tags).
- Tags: when using TF functions on tags, queries now use 'HAS' instead of 'IS' to ensure multi-value tags are taken into consideration (otherwise only single-value tags match). Note this has the side-effect of partial matching being allowed (i.e. 'Rock' matches 'Progressive Rock' too, but not the opposite).
- Tags: all remapped tags now also allow TF functions instead of just tag names. Behavior previously available only on date and custom num tags.
- Tags: the buttons now ask to check for missing genre/styles on the Graph on first initialization.
- UI: unified tooltip structure and available info on all buttons (short description + relevant settings + keyboard modifiers).
- UI: shift modifier now opens configuration menu on customizable button, and Shift + Ctrl now sets the theme. This is done to follow the same behavior than other buttons having the configuration menu on Shift.
- UI: estimated time for similar artist calculation is now formatted into hours, min and seconds.
- UI: buttons are animated while graph links cache or graph statistics are being calculated.
- UI: customizable button now doesn't allow setting playlist sorting when using harmonic mixing. Submenu is greyed out.
- UI: buttons now show info about background processing if any is being done (usually also animated).
- UI: unified buttons size normalization settings and behavior for all axis modes. 
- UI: unified button icon alignment on reflow modes.
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
- Properties: 'Exclude any track with graph distance greater than (only GRAPH method)' property now also allows 'Infinity' as value, which equals to allowing any genre/style on the graph. But it may be used in conjunction with other filters, like influences or similar artists, thus not being equivalent to 'WEIGHT' or 'DYNGENRE' methods.
- Buttons: default method of installation requires now to load the toolbar (no more single buttons support), from there, any button can be loaded as desired.
- Buttons: the buttons bar now shows a message when no buttons have been added, left clicking shows a popup with available buttons presets. Right clicking opens the menu to configure the toolbar or add buttons manually.
- Buttons: reworked pre-defined filters switching, using RegExp, which should hopefully work in almost any case no matter their order or position on the forced query.
- Buttons: reworked input popups for settings on customizable button with specific descriptions, extensive error checking (with feedback popups), etc. It should be pretty clear now what's allowed on every setting, and non valid values will throw a warning (instead of just silently being discarded).
- Buttons: improved 'no background mode' on buttons toolbar with colors and shades adapted to the toolbar background color and following the design of native Foobar2000 buttons for a seamless integration.
- Buttons: improved 'no background mode' on buttons toolbar with proper animations (no longer a bad looking rectangle gradient).
- Buttons: generic button ('buttons_search_bydistance.js') can now be configured (although not in the same way than the customizable button). It replaces the buttons for specific methods, since the search method can now be set.
- Helpers: rewritten [Camelot-Wheel-Notation](https://github.com/regorxxx/Camelot-Wheel-Notation) helper.
- Helpers: updated helpers.
- HTML: removed unnecessary console warning on debugging.
- HTML: internal changes for non-oriented links.
- Console: added some console warnings when specific sorting options override others.
- Presets: updated all Picard scripts with comments, setting examples, new scripts (for folksonomy tags, performers, ...), code improvements, etc.
- Minor performance improvement (aprox. 10%) breaking the calculations when the current track can not reach the minimum score.
- Minor performance improvement (aprox. <3%, usually on subsequent calls) caching all TitleFormat expressions.
- Greater performance improvement (aprox. 30%) swapping the order of some elements on the query to short-circuit it faster and grouping combinations, -for ex. moods-, by matched elements.
### Removed
- Buttons: removed method specific buttons, now replaced with the generic one (which can be configured).
### Fixed
- Remove duplicates: tags may now be set to empty '[]', which disables the feature. Previously threw a crash.
- Recursive Playlist: when duplicates removal tags are set to empty, feature is disabled and a popup warns about it. Previously threw a crash.
- Presets: fixed misspelling of 'SPEECHNESS' at multiple places/presets, on queries, tag name, Picard scripts, etc.
- Key: tracks with a key difference greater than 6 were not properly evaluated, since they are nearer on the key wheel. Being the real distance (6 - difference). i.e. a track with key 12A would be considered at a distance 11 from a track 1A, instead of a distance 1. This happened at the scoring stage (it was properly evaluated at other places), resulting in less tracks being output as similar tracks in most cases (where KEY was used for weighting).
- UI: after renaming custom button, button width was not properly adjusted. Width on panel reload and after renaming did not match.
- UI: estimated time for similar artist calculation was not properly computed when having multiple tracks by same artist(s) on selection.
- UI: recipes were not properly numbered when they had duplicates names.
- UI: some GRAPH-only options where available to configure when using other methods. Now greyed out.
- UI: don't show tooltip during buttons drag n drop.
- UI: background color mismatch when resizing windows and using custom background colors.
- UI: fixed reflow mode in some cases when resizing back to the required width/height to show all buttons on a single row/column.
- UI: fixed reflow mode in some cases when normalization mode was not active and buttons had different size; non needed empty space was added in some rows/columns.
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
- Cache: graph links cache is not re-calculated on first init after installation if there are other 'Search by Distance' buttons present on other panels.
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
- Console: fixed console logging to file (lines were not being split properly).

## [2.3.0] - 2022-08-12
### Added
- Diagram: diagrams explaining the design logic of similar artists calculation with 3 different methods ('_images\search_by_distance_SIMILAR_ARTISTS(R|V|W)_diagram.png').
- Descriptors: added 'Dembow' and 'Renaissance Rock', along their influences.
- Readmes: added 'Similar artists' readme.
### Changed
- Similar artists: library tracks are now filtered by nearest genre/styles to tracks by selected artist for every track, instead of using only the first track as reference. This should better reflect the works of an artist without depending on the reference track at all. Previously, output score would be heavily dependent on the reference track.
- Similar artists: scores are now weighted with genre/style appearance on all artist's tracks. i.e. if 'Mdour Moctar' has 1 Reggae track on your library and 99 Rock tracks, then if the Reggae track is chosen for the calcs, it's score is weighted as 1% of the total score (instead of averaging all N scores).
- Similar artists: current method uses the 2 above changes, named 'weighted'. Using only the filter change is 'variable'. Previous method based on reference track is named 'reference'. This is an internal change, but functionality -based on names- can be seen on the diagrams. 'Weighted' will be the default method from now on, not meant to be changed (unless the script 'search_bydistance_extra.js' is edited). In resume, this change is aimed to better reflect the entire work of an artist, instead of specific tracks or being tied to random variations.
- Console: reworked console logging to group buttons loading info into one line.
- Console: reduced console logging at startup.
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
- Console: minor improvements to console logging when reporting track li
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
- Descriptors: preliminary AllMusic and Last.fm support by linking their genre/styles to the graph with substitutions (wip).
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
- Console: Greatly optimized console logging when sending selected tacks to console. It now outputs the entire list at once (instead of one entry per track). This reduces processing time by +2 secs for +50 tracks (the standard playlist size)... so total processing time has been reduced in most cases by half just with the logging optimization.
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
- Console: Progress code in multiple tools have been fixed to display more accurately the percentage progress in the log.
- Console: non needed warning about 'name' variable not being recognized on recipes.
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
- Similar artists: new option at 'Other tools', in customizable button, to compute the similar artists to those from the currently selected tracks (duplicates are filtered first). I.e. tries to compute something equivalent to 'Similar Artists Last.fm', which can be retrieved with [Biography](https://github.com/Wil-B/Biography/) script (but requires internet). In this case the process is entirely offline and uses the already coded routines of Search by Distance to find which artists are usually the most similar to a random set of [50] tracks by every selected artist. It requires some time, since it's equivalent to perform the 'GRAPH' search x 50 times x selected artist. The advantage is that it does not requires internet and works with any artists, whether it's 'popular' or not, since it's not based on things like users' listening behaviors, eurocentric bias, etc. The results are output to console and saved to JSON, so they only need to be calculated once. Later changes to the graph descriptors may affect the results, in that case the same artists may be checked again to update the list if required.
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
- Console: menu entries are no longer logged to console after clicking.
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
- Buttons: Customizable button now has all additional menu entries found at Playlist Tools button: debug graph, find genre/styles not on Graph, reset cache, etc. i.e. both now should offer the same degree of customization and advanced tools.
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
- Console: minor fixes at console logging.
- Multiple minor improvements and fixes on path handling for portable installations.
- Multiple minor improvements and fixes when saving files on non existing folder.
- Evaluation of 'sbd_max_graph_distance' at recipes on multiple places is now rounded (just for cleaner logging purpose).

## [2.0.0] - 2021-06-15
### Added
- Recipes: Recipes presets may be used to set variables of the function. Whenever the argument is set, it's used instead of related property. Custom button now allows to use a recipe file. Once set, button would always use the recipe as arguments instead of the properties variables. A recipe may force the use of a theme.
- Recipes: custom button now allows to set the recipe file used by pressing Ctrl + L. Click. 'None' would use the current properties variables, which is the default behavior.
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

[Unreleased]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v7.6.0...HEAD
[7.6.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v7.5.0...v7.6.0
[7.5.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v7.4.0...v7.5.0
[7.4.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v7.3.0...v7.4.0
[7.3.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v7.2.0...v7.3.0
[7.2.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v7.1.0...v7.2.0
[7.1.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v7.0.0...v7.1.0
[7.0.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v6.1.3...v7.0.0
[6.1.3]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v6.1.2...v6.1.3
[6.1.2]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v6.1.1...v6.1.2
[6.1.1]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v6.1.0...v6.1.1
[6.1.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v6.0.1...v6.1.0
[6.0.1]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v6.0.0...v6.0.1
[6.0.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v5.1.2...v6.0.0
[5.1.2]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v5.1.1...v5.1.2
[5.1.1]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v5.1.0...v5.1.1
[5.1.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v5.0.0...v5.1.0
[5.0.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v4.7.0...v5.0.0
[4.7.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v4.6.0...v4.7.0
[4.6.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v4.5.1...v4.6.0
[4.5.1]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v4.5.0...v4.5.1
[4.5.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v4.4.2...v4.5.0
[4.4.2]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v4.4.1...v4.4.2
[4.4.1]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v4.4.0...v4.4.1
[4.4.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v4.3.1...v4.4.0
[4.3.1]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v4.3.0...v4.3.1
[4.3.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v4.2.1...v4.3.0
[4.2.1]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v4.2.0...v4.2.1
[4.2.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v4.1.0...v4.2.0
[4.1.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v4.0.2...v4.1.0
[4.0.2]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v4.0.1...v4.0.2
[4.0.1]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v4.0.0...v4.0.1
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