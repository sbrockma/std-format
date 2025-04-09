# Change Log

## 1.2.1
### Fixes
- Better error message if parsing replacement field failed.
- More error throwing checks for specifiers.
- Formatting with fill and align.
- Format specification regex.

## 1.2.0
### New Features
- Added specification hint "js".
### Fixes
- Enable grouping with type specifier '%'
- More checks with string type specifier 's'.
- Char formatting with type specifier 'c'.
### Docs
- Added note that stdSpecificationHint will be deprecated in version 2.

## 1.1.1
### Fixes
- Forgot stdLocaleHint from exports.

## 1.1.0
### New Features
- Apply precision field with string type specifier to set maximum field size.
- Implemented specifier 'z'.
- Implemented locale affected formatting specifiers 'n' and 'L'.
- Implemented grouping specifiers ',' and '_'.
- Added support to bigint arguments.
### Fixes
- Do not treat zero with default type specifier as float.

## 1.0.0
First release.