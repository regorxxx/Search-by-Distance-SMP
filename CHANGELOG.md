# Changelog

## [Table of Contents]
- [Unreleased](#unreleased)
- [1.2.0](#120---2021-06-07)
- [1.1.0](#110---2021-05-26)
- [1.0.0](#100---2021-05-02)

## [Unreleased][]
### Added
### Changed
### Removed
### Fixed

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
- In key mixing: not really random due to using sort + random method. Using an array shuffle now instead.
- Random picking: not really random due to using sort + random method. Using an array shuffle now instead.

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

[Unreleased]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/6e0ae3f...v1.0.0
