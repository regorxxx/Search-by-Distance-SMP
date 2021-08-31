# Changelog

## [Table of Contents]
- [Unreleased](#unreleased)
- [2.0.1](#201---2021-06-15)
- [2.0.0](#200---2021-06-15)
- [1.2.0](#120---2021-06-07)
- [1.1.0](#110---2021-05-26)
- [1.0.0](#100---2021-05-02)

## [Unreleased][]
### Added
- Key tag can now be remapped to another tag (uses 'key' by default). It's also directly configurable on the customizable button, via menus. For other buttons, use the properties panel.
- BPM tag can now be remapped to another tag (uses 'bpm' by default). It's also directly configurable on the customizable button, via menus. For other buttons, use the properties panel.
- Buttons: added a submenu to set variables' weight and range at custom button.
- Buttons: added a submenu to set additional query filters (along the forced query): Acoustic, Instrumental and Female Vocal tracks. They can work in conjunction with any recipe as long as the recipe does not force a query too.
- Recipes: added 'LikeADJ (MusicBee)' which replicates functionality of [MusicBee's plugin LikeADJ](https://getmusicbee.com/forum/index.php?topic=24631.0). Uses BPM, Key, Energy, Ratings, Genres and Harmonic Mixing. If only a subset of those things are desired, duplicate the recipe and configure it as needed or simply set a custom button using the recipe as reference with your own changes.
- Recipes: added Acoustic, Instrumental and Female Vocal versions for 'Similar tracks (G)' recipe which forces only acoustic, instrumental or female vocal tracks as output. Style, genre and Picard tags (acousticness, speechiness, gender) -see below- are taken into consideration.
- Harmonic Mixing: now works with Open Keys too (in addition to Camelo Keys and standard notation keys).
- Presets: scripts for Picard to retrieve high level tags (gender, valence, danceability, speechiness, ...) from AcousticBrainz high level data. Tags are easily configurable. AcousticBrainz Tags plugin 2.2+ is required (within Picard). Those tags are meant as a direct replacement, using an open source data model, of Spotify's tags... which can only be retrieved with an API in some software and rely on closed source models and data (new data can not be added by users). If some tracks are not in AcousticBrainz database, they may be [analyzed locally to then send send the results to their server](https://musicbrainz.org/doc/How_to_Submit_Analyses_to_AcousticBrainz) and later get the results on Picard.
### Changed
- Descriptors: Updated descriptors. Added multiple genre and styles to punk, rock, pop, folk, industrial, downtempo and metal super-genres, along their style clusters, substitutions and influence relations.
- Harmonic Mixing: greatly improved speed when the pool had thousands of tracks (improved shuffle method).
- Buttons framework: default icon size is now bigger.
- Buttons: custom button shows the current value on the menu entries (no need to click on them or open properties). It also shows the value if set -forced- by the recipe. 'sbd_max_graph_distance' value is evaluated before displaying (if not using a number).
- Buttons: minor renaming for AutoPlaylist - Playlist filter.
- Buttons: Added readmes to configurable button on menus: methods, full documentation and recipes & themes.
- Buttons: loading buttons using the customizable toolbar will show their associated readme (if it exists).
- Buttons: restoring defaults buttons on the toolbar will show the readme of all the restored buttons.
- Buttons: replaced the readme entry on the toolbar menu with a submenu pointing to all readmes of every button.
- Debug: new config to show popup even after test passing (meant to be used along Playlist Tools). Default behavior remains the same, popup only appears if errors are found.
- Installation: Installation path may now be changed by editing 'folders.xxxName' variable at '.\helpers\helpers_xxx.js'. This is a workaround for some SMP limitations when working with relative paths and text files, images or dynamic file loading.
- Helpers: updated. Whenever a folder needs to be created to save a new file, the entire tree is now created if needed. Previously it would fail as soon as any folder did not exist. This greatly speeds up setting panels since now the final folder does not need to exists at all to work, since it will be created on the fly.
### Removed
### Fixed
- Buttons: Fixed multiple button names while logging loading on console.
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

[Unreleased]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v2.0.1...HEAD
[2.0.1]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v1.2.0...v2.0.0
[1.2.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/6e0ae3f...v1.0.0
