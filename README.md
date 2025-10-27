# 🚀 WP Rocket Dev Tools

**The ultimate VS Code extension for WP Rocket plugin development**

A comprehensive, feature-rich development toolkit with a beautiful WebView-based test dashboard, automated code quality checks, intelligent code generators, and powerful workflow automation.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.80.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

### 🧪 Test Runner Dashboard

A stunning glassmorphism-designed WebView panel that makes running tests a pleasure:

- **Quick Actions** - One-click access to unit tests, integration tests, quality checks, and full test suite
- **Test Groups Grid** - Organized by category (Admin, E-Commerce, Page Builders, Hosting, Third-Party)
- **Live Output** - Terminal-style output with syntax highlighting and auto-scroll
- **Test History** - Track recent test runs with success rates and durations
- **Statistics** - Visual insights into test performance and trends
- **Real-time Updates** - Live progress indicators and status badges

**Command:** `WP Rocket: Open Test Dashboard` (Ctrl/Cmd+Shift+T D)

### 🎯 Auto Quality Check

Automatically run code quality tools on file save:

- **PHPCS Fixer** - Auto-fix code style issues
- **PHPStan** - Static analysis for type safety
- **Inline Diagnostics** - See issues directly in the Problems panel
- **Configurable Patterns** - Watch specific file patterns
- **Smart Notifications** - Optional success/error notifications

**Configuration:**
```json
{
  "wprocket.autoQualityCheck.enabled": true,
  "wprocket.autoQualityCheck.files": ["inc/Engine/**/*.php"],
  "wprocket.autoQualityCheck.runPhpcs": true,
  "wprocket.autoQualityCheck.runPhpstan": true
}
```

### 🏗️ Code Generators

Generate boilerplate code with proper structure:

- **Service Providers** - Create feature service providers with container registration
- **Subscribers** - Generate event subscribers with `get_subscribed_events()` method
- **Test Files** - Auto-generate Unit or Integration test files with fixtures
- **Database Migrations** - Scaffold BerlinDB table structures

**Commands:**
- `WP Rocket: Generate Service Provider`
- `WP Rocket: Generate Subscriber`
- `WP Rocket: Generate Test File`
- `WP Rocket: Generate Database Migration`

### 🧭 Smart Navigation

Jump between related files instantly:

- **Go to Test** - Switch between source and test files (or create new test)
- **Find Service** - Quick pick list of all registered services
- **Find Hook** - Search for WordPress hook usage across codebase
- **View Service Providers** - Jump to any ServiceProvider file

**Commands:**
- `WP Rocket: Go to Test File / Source File`
- `WP Rocket: Find Service in Container`
- `WP Rocket: Find Hook Usage`
- `WP Rocket: View Service Provider`

### 📝 Code Snippets

Professional code templates for rapid development:

- `wpr-provider` - Service Provider template
- `wpr-subscriber` - Event Subscriber template
- `wpr-testclass` - Complete test class structure
- `wpr-test` - Test method with data provider
- `wpr-dataprovider` - Data provider method
- `wpr-filter` - Filter method
- `wpr-action` - Action method
- `wpr-hook` - Hook registration
- `wpr-doc` - PHPDoc block
- `wpr-table` - Database table schema

### 📊 Status Bar Integration

Quick access and real-time status:

- 🚀 WP Rocket icon - Click to open dashboard
- Current git branch name
- Test status indicators (✅ passed / ❌ failed / 🔄 running)
- Changed files count

### 🖱️ Context Menu Integration

Right-click on files for quick actions:

- Run Tests for This File
- Run Quality Check on This File
- Generate Test File
- Go to Test File / Go to Source File

## 🚀 Getting Started

### Installation

1. Open VS Code
2. Press `Ctrl/Cmd+P` and type `ext install wp-media.wp-rocket-dev-tools`
3. Press Enter

### Prerequisites

- VS Code 1.80.0 or higher
- WP Rocket plugin workspace
- Composer installed
- PHP 7.4 or higher

### First Time Setup

1. Open your WP Rocket plugin folder in VS Code
2. The extension will auto-detect the workspace
3. Open the test dashboard: `Ctrl/Cmd+Shift+T D`
4. Start running tests!

## ⌨️ Keyboard Shortcuts

| Shortcut | Command |
|----------|---------|
| `Ctrl/Cmd+Shift+T U` | Run Unit Tests |
| `Ctrl/Cmd+Shift+T I` | Run Integration Tests |
| `Ctrl/Cmd+Shift+T Q` | Run Quality Check |
| `Ctrl/Cmd+Shift+T A` | Run All Tests |
| `Ctrl/Cmd+Shift+T D` | Open Test Dashboard |

## ⚙️ Configuration

### Settings

Access via `Settings` → `Extensions` → `WP Rocket Dev Tools`

```json
{
  // Workspace Configuration
  "wprocket.workspacePath": "",  // Auto-detected

  // Auto Quality Check
  "wprocket.autoQualityCheck.enabled": true,
  "wprocket.autoQualityCheck.files": ["inc/Engine/**/*.php"],
  "wprocket.autoQualityCheck.runPhpcs": true,
  "wprocket.autoQualityCheck.runPhpstan": true,
  "wprocket.autoQualityCheck.showNotifications": true,

  // Test Runner
  "wprocket.testRunner.autoScroll": true,
  "wprocket.testRunner.showNotifications": true,
  "wprocket.testRunner.saveHistory": true,
  "wprocket.testRunner.maxHistoryItems": 100,

  // UI
  "wprocket.theme": "dark"
}
```

## 📖 Usage Examples

### Running Tests

**From Dashboard:**
1. Open dashboard: `Ctrl/Cmd+Shift+T D`
2. Click any test card or button
3. View real-time output
4. Check test history and statistics

**From Command Palette:**
1. Press `Ctrl/Cmd+Shift+P`
2. Type "WP Rocket"
3. Select test command

**From File Context:**
1. Right-click on a PHP file
2. Select "Run Tests for This File"

### Generating Code

**Service Provider:**
```
1. Cmd+Shift+P → "WP Rocket: Generate Service Provider"
2. Enter feature name: "PerformanceHints"
3. File created at: inc/Engine/PerformanceHints/PerformanceHintsServiceProvider.php
```

**Test File:**
```
1. Open source file (e.g., CacheManager.php)
2. Right-click → "Generate Test File"
3. Select "Integration" or "Unit"
4. Test file created with proper structure
```

### Using Snippets

In any PHP file, type:
- `wpr-provider` → Tab → Complete Service Provider
- `wpr-subscriber` → Tab → Complete Subscriber
- `wpr-test` → Tab → Test method with data provider

## 🎨 Dashboard Design

The test dashboard features a modern glassmorphism design with:

- **Deep blue gradient background** (#0f172a to #1e293b)
- **Glass-morphic cards** with backdrop blur effects
- **Smooth animations** using CSS cubic-bezier transitions
- **Gradient accents** (cyan to purple)
- **Real-time status indicators** with pulsing animations
- **Responsive layout** that adapts to panel size

## 🏗️ Architecture

```
wp-rocket-dev-tools/
├── src/
│   ├── extension.ts              # Main entry point
│   ├── testRunner.ts             # Test execution engine
│   ├── qualityCheck.ts           # PHPCS & PHPStan integration
│   ├── fileWatcher.ts            # Auto quality check watcher
│   ├── codeGenerator.ts          # Code template generators
│   ├── navigation.ts             # Smart navigation features
│   ├── webview/
│   │   └── TestDashboard.ts      # WebView provider
│   └── utils/
│       ├── composer.ts           # Composer.json parser
│       ├── git.ts                # Git utilities
│       └── storage.ts            # Test history storage
├── snippets/
│   └── wprocket.code-snippets   # Code snippets
└── media/
    ├── rocket.svg               # Sidebar icon
    └── icon.png                 # Extension icon
```

## 🔧 Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/wp-media/wp-rocket-dev-tools.git
cd wp-rocket-dev-tools

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Package extension
npm run package
```

### Running Tests

```bash
npm run test
```

### Linting

```bash
npm run lint
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 Changelog

### 1.0.0 (2025-10-27)

**Initial Release**
- ✨ Beautiful WebView test dashboard
- 🧪 Comprehensive test runner
- 🎯 Auto quality check on save
- 🏗️ Code generators (Provider, Subscriber, Test, Migration)
- 🧭 Smart navigation features
- 📝 Professional code snippets
- 📊 Status bar integration
- 🖱️ Context menu actions
- ⌨️ Keyboard shortcuts

## 🐛 Known Issues

- None currently reported

## 💡 Tips & Tricks

1. **Quick Test Selection** - Use fuzzy search in Quick Pick menus
2. **Keyboard Navigation** - All features accessible via keyboard
3. **Custom Patterns** - Configure watched file patterns per project
4. **Test History** - Click history items to view detailed output
5. **Split View** - Open dashboard in split view for side-by-side coding

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 👥 Authors

**WP Media Team**
- Website: [wp-rocket.me](https://wp-rocket.me)
- GitHub: [@wp-media](https://github.com/wp-media)

## 🙏 Acknowledgments

- Built with ❤️ for the WP Rocket development team
- Inspired by modern VS Code extension design patterns
- Thanks to all contributors and testers

## 📞 Support

- 📧 Email: support@wp-rocket.me
- 🐛 Issues: [GitHub Issues](https://github.com/wp-media/wp-rocket-dev-tools/issues)
- 📖 Documentation: [Wiki](https://github.com/wp-media/wp-rocket-dev-tools/wiki)

---

**Made with 🚀 by WP Media**
