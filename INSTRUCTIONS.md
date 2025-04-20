# Instructions for std-format

## Tasks

### Run Test

    npm run test

### Build

    npm run build:dev
    npm run build:prod

## Publish
    // Update changelog
    git log --pretty="- %s"

    npm version major|minor|patch

    npm run build:prod

    npm login
    npm publish --access public

