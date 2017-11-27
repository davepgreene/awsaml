# Change Log

## [Unreleased]

## [1.5.0] - 2017-08-25
### Added
- Ability to use custom names for "Recent Logins" profiles by @udangel-r7.
- Login button for "Recent Logins" profiles by @udangel-r7.
- yarn.lock file to pin package version changes by @davepgreene.

### Changed
- Electron to pin version at 1.6.11 by @onefrankguy.
- Build process to allow platform to be set at run time by @onefrankguy.
- Build process to use "electron" instead of "electron-prebuilt" by @erran.

## [1.4.0] - 2016-11-21
### Added
- :construction_worker: Enable TravisCI builds for continuous integration by @erran!
- Support a list of "recent logins" on the configure page by @erran.

## [1.3.0] - 2016-09-28
### Added
- Homebrew cask support by @fpedrini.
- Tests for the AwsCredentials class by @onefrankguy.
- Transpiler tooling to make frontend/backend splitting easier by @dgreene-r7.
- .nvmrc file to pin to the latest LTS release by @davepgreene.

### Changed
- Credentials so they default to hidden in the UI by @erran.
- Electron packaging so tests are excluded from releases by @onefrankguy.
- Routes and server config to reside in their own source files by @davepgreene.

### Fixed
- Issue where empty storage files caused uncaught exceptions by @erran.
- Issue where automatic token renewal failed after logout by @onefrankguy.

## [1.2.0] - 2016-05-13
### Added
- Ability to run server backend locally without Electron by @dgreene-r7.
- Logout button and server endpoint by @devkmsg.
- Mocha test framework by @onefrankguy.

### Changed
- Electron version to 0.37.8 by @onefrankguy.

### Fixed
- Documentation to use the correct audience restriction URL by @erran.

## [1.1.0] - 2016-02-22
### Added
- Display of error messages for invalid metadata URLs by @dgreene-r7.
- Display of setup commands to make configuring CLI tools easier by @dgreene-r7.
- Display of AWS account ID to make using multiple accounts easier by @athompson-r7.

### Changed
- Electron version to 0.36.7 by @onefrankguy.
- Code formatting to match the Rapid7 Style Guide by @dgreene-r7.

### Fixed
- Issue where refresh button didn't work after session timeout by @dgreene-r7.

## [1.0.0] - 2016-01-19
### Added
- Initial release by @onefrankguy.

[Unreleased]: https://github.com/rapid7/awsaml/compare/v1.5.0...HEAD
[1.5.0]: https://github.com/rapid7/awsaml/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/rapid7/awsaml/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/rapid7/awsaml/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/rapid7/awsaml/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/rapid7/awsaml/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/rapid7/awsaml/tree/v1.0.0
