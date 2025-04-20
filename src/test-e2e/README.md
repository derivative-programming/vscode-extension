# E2E Testing for AppDNA Extension

This directory contains End-to-End (E2E) tests for the AppDNA VS Code extension using WebdriverIO with the VS Code service.

## Overview

The E2E tests simulate real user interactions with the extension within a running VS Code window. These tests validate that:

- The extension activates correctly
- UI elements appear as expected
- Commands can be executed
- Workflows function properly

## Configuration

The tests are configured in `wdio.conf.ts`, which specifies:

- Using your local VS Code installation (no download required)
- Running tests sequentially (one at a time)
- Using Mocha as the test framework
- Setting appropriate timeouts for VS Code operations

## Test Files

Test files are located in the `specs/` directory:

- `basic.test.ts`: Tests core extension functionality like activation, view containers, and commands

## Running Tests

To run the E2E tests, use:

```bash
npm run test:e2e
```

For debugging tests, use:

```bash
npm run test:e2e:debug
```

## Local VS Code Path

The configuration is set to use the local VS Code installation at `C:\Program Files\Microsoft VS Code\Code.exe`. If your VS Code is installed in a different location, update the `binary` path in `wdio.conf.ts`:

```typescript
// For Windows:
binary: 'C:\\Program Files\\Microsoft VS Code\\Code.exe',

// For macOS:
binary: '/Applications/Visual Studio Code.app/Contents/MacOS/Electron',

// For Linux:
binary: '/usr/bin/code',
```

## Adding New Tests

To add new E2E tests:

1. Create a new TypeScript file in the `specs/` directory
2. Use the WebdriverIO API and VS Code service to interact with the extension
3. Follow the pattern in existing tests for consistent structure

## WebdriverIO Documentation

For more information on WebdriverIO and the VS Code service, refer to:

- [WebdriverIO Documentation](https://webdriver.io/docs/gettingstarted)
- [VS Code Service Documentation](https://webdriver.io/docs/wdio-vscode-service)