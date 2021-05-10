# Changelog

## [Table of Contents]
- [Unreleased](#unreleased)
- [1.0.0](#100---2021-05-02)

## [Unreleased][]
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
### Removed
- Removed all lodash dependence and deleted helper.
## [1.0.0] - 2021-05-02
### Added
- First release.

### Changed

### Removed

[Unreleased]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/regorxxx/Search-by-Distance-SMP/compare/6e0ae3f...v1.0.0
