# Changelog

All notable changes to the "WP Rocket Dev Tools" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-27

### Added
- 🚀 Beautiful WebView-based test dashboard with glassmorphism design
- 🧪 Comprehensive test runner for PHPUnit tests
- 🎯 Automatic quality checks on file save (PHPCS + PHPStan)
- 🏗️ Code generators for Service Providers, Subscribers, Tests, and Migrations
- 🧭 Smart navigation between source and test files
- 📝 Professional code snippets for WP Rocket development
- 📊 Status bar integration with real-time test status
- 🖱️ Context menu actions for quick access to features
- ⌨️ Keyboard shortcuts for all major commands
- 📈 Test history tracking and statistics
- 🔄 Live test output with auto-scroll
- 🎨 Dark theme optimized for long coding sessions
- 🔍 Hook usage search across entire codebase
- 📦 Service container explorer
- 🌿 Git integration (branch name, changed files)

### Features by Category

#### Test Runner
- Run unit tests individually or as a suite
- Run integration tests with exclusions
- Run all tests with one click
- Stop running tests
- View test output in real-time
- Track test history with success rates
- Visual statistics dashboard

#### Code Quality
- Auto-run PHPCS fixer on save
- Auto-run PHPStan on save
- Inline diagnostics in Problems panel
- Configurable file patterns to watch
- Optional notifications for quality checks
- Full quality check command

#### Code Generation
- Generate Service Provider classes
- Generate Event Subscriber classes
- Generate Unit/Integration test files
- Generate Database migration scaffolding
- All generators follow WP Rocket conventions
- Proper namespace and directory structure

#### Navigation
- Jump from source to test file (and vice versa)
- Create test files if they don't exist
- Find services in the container
- Search for WordPress hook usage
- View all Service Providers
- Quick Pick menus with fuzzy search

#### Developer Experience
- 10 professional code snippets
- Auto-detection of WP Rocket workspace
- Categorized test organization
- Beautiful UI with smooth animations
- Responsive design
- Comprehensive keyboard support

### Configuration Options
- `wprocket.workspacePath` - Path to WP Rocket (auto-detected)
- `wprocket.autoQualityCheck.enabled` - Enable auto quality checks
- `wprocket.autoQualityCheck.files` - File patterns to watch
- `wprocket.autoQualityCheck.runPhpcs` - Run PHPCS on save
- `wprocket.autoQualityCheck.runPhpstan` - Run PHPStan on save
- `wprocket.autoQualityCheck.showNotifications` - Show notifications
- `wprocket.testRunner.autoScroll` - Auto-scroll output
- `wprocket.testRunner.showNotifications` - Show test notifications
- `wprocket.testRunner.saveHistory` - Save test history
- `wprocket.testRunner.maxHistoryItems` - Max history items (default 100)
- `wprocket.theme` - Dashboard theme (dark/light)

### Commands
- `WP Rocket: Open Test Dashboard` - Open the main dashboard
- `WP Rocket: Run Unit Tests` - Run unit test suite
- `WP Rocket: Run Integration Tests` - Run integration tests
- `WP Rocket: Run Quality Check` - Run PHPCS + PHPStan
- `WP Rocket: Run All Tests` - Run complete test suite
- `WP Rocket: Stop Running Test` - Stop current test execution
- `WP Rocket: Generate Service Provider` - Create new provider
- `WP Rocket: Generate Subscriber` - Create new subscriber
- `WP Rocket: Generate Test File` - Create test for current file
- `WP Rocket: Generate Database Migration` - Create migration
- `WP Rocket: Go to Test File / Source File` - Toggle between files
- `WP Rocket: Find Service in Container` - Search services
- `WP Rocket: Find Hook Usage` - Search hook usage
- `WP Rocket: View Service Provider` - Browse providers
- `WP Rocket: Run Tests for This File` - Context menu action
- `WP Rocket: Run Quality Check on This File` - Context menu action

### Technical Details
- Built with TypeScript 5.0
- VS Code API 1.80.0+
- Chokidar for file watching
- Modular architecture
- Event-driven test runner
- WebView with message passing
- State management with VS Code storage API
- Git integration via child_process
- Composer.json parsing

### Known Limitations
- Requires Composer to be installed
- Requires WP Rocket plugin structure
- PHP quality tools must be configured in composer.json

## [Unreleased]

### Planned Features
- Light theme support
- Custom test filters
- Test coverage visualization
- Performance profiling integration
- AI-powered test generation
- Multi-workspace support
- Remote test execution
- Test result export (JSON, HTML)
- Code complexity metrics
- Dependency graph visualization
