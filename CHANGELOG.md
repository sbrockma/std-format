# Changelog
## [1.4.1] - 2025-04-20
### Fixed
- Missing "exports" "types" in package.json.

## [1.4.0] - 2025-04-20
### Added
- Build targets esm, cjs and umd (browser). 
- Support code points > 0xFFFF for type specifier 'c'.
### Changed
- Create single std-format.d.ts types file.
- Transpile to ES5 (ie 11) for build targets cjs and umd.
- Removed use of named regex groups and parse format specification manually, for legacy JS support.

## [1.3.5] - 2025-04-17
### Fixed
- Format number as float by default (JavaScript has no int/float types). To format as integer, use specifier 'd'.
- Fixed formatting error when type specifier was omitted.
### Changed
- Omit functions int() and float() from public interface for now.
- Added functions int() and float(), classes IntWrapper and FloatWrapper.
- Added dependency "jsbi" (IntWrapper uses JSBI).
- Removed usage of JavaScript BigInt for legacy support.
- Format integers directly in formatNumber(). No need to use NumberConverter.

## [1.3.4] - 2025-04-15
### Changed
- Improved number formatting with locale-specific grouping (e.g. "hi-IN").
- BigInt values are no longer allowed with float specifier.
- Improved format specifiers validation.
### Fixed
-Numbers with fractions were displayed with long decimals because floating-point numbers can’t represent some fractions exactly.

## [1.3.3] - 2025-04-14
### Changed
- More strict error throwing checks of which specifiers can be used together.
- Performance optimization in cases were replacement field is simple "{}" or "{d}".
- Split single big source file into multiple source files.

## [1.3.2] - 2025-04-12
### Fixed
- Allow 'z' specifier to be used with type specifier '%'.
## Changed
- Lot of refactoring for better code.

## [1.3.1] - 2025-04-10
### Changed
- Format changelog based on Keep a Changelog.
- Stop using newer JS functions to support older environments.
- Renamed bundle to "std-format.umd.js" and add library: "StdFormat" in webpack.config.js.

## [1.3.0] - 2025-04-09
### Added
- New functions format(), setLocale() and class FormatError.
### Deprecated
- Functions stdFormat(), stdSpecificationHint(), stdLocaleHint() and class StdFormatError are now deprecated.

## [1.2.1] - 2025-04-09
### Chenged
- Better error message when parsing replacement field failed.
- More error throwing checks of format specifiers.
### Fixed
- Formatting with fill and align.
- Format specification regex.

## [1.2.0] - 2025-04-08
### Added
- Added specification hint "js".
### Fixed
- Enable grouping with '%' type specifier.
- More checks with type specifier 's'.
- Char formatting with type specifier 'c'.

## [1.1.1] - 2025-04-08
### Fixed
- Forgot stdLocaleHint from exports.

## [1.1.0] - 2025-04-08
### Added
- Precision field with string sets maximum field size.
- Implemented specifier 'z', 'n', 'L', ',' and '_'.
- Support bigint arguments.
### Fixed
- Do not treat zero as float when type specifier is '' (default).

## [1.0.0] - 2025-04-07
First release.