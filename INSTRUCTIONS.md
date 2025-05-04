# Instructions for TypeScript/JavaScript String Formatter

## Tasks

### Run Test

    npm run test

### Build

    npm run build:dev
    npm run build:prod

## Publish
    // Update changelog
    git log --pretty="- %s"

    // Update version number
    npm version major|minor|patch

    // Build production version
    npm run build:prod

    // Test package
    npm pack

    // Publish
    npm login
    npm publish --access public

