# Changelog

## [Table of Contents]
- [Unreleased](#unreleased)
- [1.3.0](#130---2021-06-13)
- [1.2.0](#120---2021-06-07)
- [1.1.0](#110---2021-05-26)
- [1.0.0](#100---2021-05-02)

## [Unreleased][]
### Added
### Changed
### Removed
### Fixed

## [1.3.0] - 2021-06-13
### Added
- Recipes: Recipes presets may be used to set variables of the function. Whenever the argument is set, it's used instead of related property. Custom button now allows to use a recipe file. Once set, button would always use the recipe as arguments instead of the properties variables. A recipe may force the use of a theme.
- Recipes: custom button now allows to set the recipe file used by pressing Ctrl + L. Click. 'None' would use the current properties variables, which is the default behaviour.
- Themes: themes presets may be used as reference instead of tracks. Whenever the argument is set, it's used instead of the selection. Custom button now allows to use a theme file. Once set, button would always use the theme as reference instead of the current selection.
- Buttons: custom button now allows to set the theme file used by pressing Shift + L. Click. 'None' would use the current selection, which is the default behavior.
- Buttons: custom button now allows to create a theme file using the currently focused track's tags. See theme menu (Shift + L. Click).
- Buttons: custom button now allows to set most configs using the configuration menu (Ctrl + Shift + L. Click): method, tags remapping, filters, etc. Whenever a config is overriden by a recipe, the related entry is greyed and a warning is shown.
### Changed
- Console: shows on console the track or theme used as reference (name and path).
- Buttons: custom button code cleanup and improvements on name changing.
- Buttons: custom button tooltip shows the theme and recipe being used, along tips to change them..
- Portable: when properties are set for the first time, now use relative paths on profile folder for portable installations (>= 1.6). When possible, any other stored path is also stored as relative paths (for example themes or recipes on buttons).
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
- In key mixing: crash when pool was smaller than set playlist length.
- In key mixing: not really random due to using sort + random method. Using an array shuffle now instead.
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

[Unreleased]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/6e0ae3f...v1.0.0
