# Quick Start Guide - WP Rocket Dev Tools

## Installation & Setup

### 1. Install Dependencies

```bash
cd /Users/gaelrobin/Desktop/Work/tests/rocket-extension
npm install
```

### 2. Compile the Extension

```bash
npm run compile
```

Or watch for changes during development:

```bash
npm run watch
```

### 3. Run the Extension

Press `F5` in VS Code to open a new Extension Development Host window with the extension loaded.

## Testing the Extension

### Manual Testing

1. **Open WP Rocket Project**
   - Open a folder containing WP Rocket plugin (`wp-rocket.php` file)

2. **Open Test Dashboard**
   - Press `Ctrl/Cmd+Shift+T D`
   - Or: Command Palette → "WP Rocket: Open Test Dashboard"

3. **Run Tests**
   - Click any test card in the dashboard
   - Or use keyboard shortcuts:
     - `Ctrl/Cmd+Shift+T U` - Unit Tests
     - `Ctrl/Cmd+Shift+T I` - Integration Tests
     - `Ctrl/Cmd+Shift+T Q` - Quality Check
     - `Ctrl/Cmd+Shift+T A` - All Tests

4. **Test Code Generation**
   - Command Palette → "WP Rocket: Generate Service Provider"
   - Enter a feature name
   - Check that the file is created correctly

5. **Test Navigation**
   - Open any PHP file in `inc/Engine/`
   - Right-click → "Go to Test File / Source File"
   - Verify navigation works

6. **Test Auto Quality Check**
   - Enable in settings: `"wprocket.autoQualityCheck.enabled": true`
   - Edit a PHP file in `inc/Engine/`
   - Save the file
   - Check that quality checks run automatically

### Debugging

1. Set breakpoints in TypeScript files
2. Press `F5` to start debugging
3. Extension Development Host window opens
4. Trigger the feature you want to debug
5. VS Code debugger will pause at breakpoints

## Package for Distribution

```bash
npm run package
```

This creates a `.vsix` file that can be:
- Published to the VS Code Marketplace
- Installed locally: `code --install-extension wp-rocket-dev-tools-1.0.0.vsix`
- Shared with team members

## Project Structure

```
rocket-extension/
├── src/                          # TypeScript source code
│   ├── extension.ts              # Main entry point
│   ├── testRunner.ts             # Test execution logic
│   ├── qualityCheck.ts           # PHPCS/PHPStan integration
│   ├── fileWatcher.ts            # File watching for auto-checks
│   ├── codeGenerator.ts          # Code template generators
│   ├── navigation.ts             # Smart navigation features
│   ├── webview/
│   │   └── TestDashboard.ts      # WebView dashboard provider
│   └── utils/
│       ├── composer.ts           # Composer.json utilities
│       ├── git.ts                # Git utilities
│       └── storage.ts            # Storage utilities
├── snippets/
│   └── wprocket.code-snippets   # Code snippets
├── media/
│   ├── rocket.svg               # Sidebar icon
│   └── icon.png                 # Extension icon
├── out/                          # Compiled JavaScript (generated)
├── package.json                  # Extension manifest
├── tsconfig.json                 # TypeScript configuration
├── .eslintrc.json               # ESLint configuration
└── README.md                     # Documentation
```

## Development Workflow

1. **Make Changes**
   - Edit TypeScript files in `src/`

2. **Compile**
   - Run `npm run watch` for automatic compilation
   - Or `npm run compile` for one-time compilation

3. **Test**
   - Press `F5` to launch Extension Development Host
   - Test your changes

4. **Lint**
   - Run `npm run lint` to check for issues

5. **Commit**
   - Commit your changes with descriptive messages

## Common Commands

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Run linter
npm run lint

# Package extension
npm run package

# Publish to marketplace (requires publisher account)
vsce publish
```

## Configuration Tips

### Customize Watched File Patterns

```json
{
  "wprocket.autoQualityCheck.files": [
    "inc/Engine/**/*.php",
    "inc/ThirdParty/**/*.php"
  ]
}
```

### Adjust Test History

```json
{
  "wprocket.testRunner.maxHistoryItems": 200
}
```

### Disable Notifications

```json
{
  "wprocket.autoQualityCheck.showNotifications": false,
  "wprocket.testRunner.showNotifications": false
}
```

## Troubleshooting

### Extension Not Loading

- Check that `wp-rocket.php` exists in workspace
- Check Output → Log (Extension Host) for errors
- Verify TypeScript compilation succeeded

### Tests Not Running

- Ensure Composer is installed
- Verify `composer.json` exists with test scripts
- Check that vendor directory exists

### Quality Checks Not Working

- Verify PHPCS and PHPStan are installed via Composer
- Check composer.json has `phpcs:fix` and `phpstan` scripts
- Enable debug logging in VS Code

### WebView Not Displaying

- Check browser console in WebView (Developer Tools)
- Verify HTML is loading correctly
- Check for JavaScript errors

## Next Steps

1. Test all features thoroughly
2. Gather user feedback
3. Add more code generators as needed
4. Implement additional test categories
5. Add light theme support
6. Create tutorial videos
7. Write comprehensive documentation

## Support

For issues or questions:
- GitHub Issues: [Create an issue](https://github.com/wp-media/wp-rocket-dev-tools/issues)
- Email: support@wp-rocket.me
- Slack: #dev-tools channel

---

**Happy Coding! 🚀**
