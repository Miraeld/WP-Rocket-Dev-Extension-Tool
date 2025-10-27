# WP Rocket Dev Tools - Feature Showcase

This document demonstrates all the features of the WP Rocket Dev Tools extension with real-world examples.

## 🚀 Quick Start Demo

### Scenario 1: Running Tests

**Goal:** Run integration tests for the PerformanceHints feature

**Steps:**

1. **Open Test Dashboard**
   ```
   Press: Ctrl/Cmd+Shift+T D
   ```

2. **View Test Categories**
   - Dashboard shows tests organized by category
   - Admin Tests
   - E-Commerce (WooCommerce)
   - Page Builders (Elementor, Beaver Builder)
   - Hosting (Cloudflare, WPEngine, Kinsta)
   - Third-Party (Jetpack, RankMath)

3. **Run Tests**
   - Click "Integration Tests" card
   - Or press: `Ctrl/Cmd+Shift+T I`
   - Watch real-time output in terminal-style panel
   - See success/failure status

4. **View Results**
   - Check "Recent Tests" sidebar
   - View statistics (success rate, average duration)
   - Review test history

### Scenario 2: Auto Quality Check on Save

**Goal:** Automatically fix code style issues when saving a file

**Setup:**

1. **Enable Auto Quality Check**
   ```json
   {
     "wprocket.autoQualityCheck.enabled": true,
     "wprocket.autoQualityCheck.runPhpcs": true,
     "wprocket.autoQualityCheck.runPhpstan": true
   }
   ```

2. **Configure Watched Patterns**
   ```json
   {
     "wprocket.autoQualityCheck.files": [
       "inc/Engine/**/*.php"
     ]
   }
   ```

**Usage:**

1. Open: `inc/Engine/Media/ImageDimensions/ImageDimensions.php`
2. Make some changes (add spaces, formatting issues)
3. Press `Ctrl/Cmd+S` to save
4. Watch status bar: "Checking ImageDimensions.php..."
5. PHPCS automatically fixes formatting
6. PHPStan reports any type issues
7. Problems panel shows inline diagnostics

### Scenario 3: Generating a Service Provider

**Goal:** Create a new feature with proper structure

**Steps:**

1. **Run Generator**
   ```
   Command Palette → "WP Rocket: Generate Service Provider"
   ```

2. **Enter Feature Name**
   ```
   Feature Name: PerformanceHints
   ```

3. **Result:**
   ```
   Created: inc/Engine/PerformanceHints/PerformanceHintsServiceProvider.php
   ```

4. **Generated Code:**
   ```php
   <?php

   namespace WP_Rocket\Engine\PerformanceHints;

   use WP_Rocket\Dependencies\League\Container\ServiceProvider\AbstractServiceProvider;

   /**
    * Service provider for PerformanceHints
    */
   class PerformanceHintsServiceProvider extends AbstractServiceProvider {
       protected $provides = [
           // Add service names here
       ];

       public function register(): void {
           // Register services here
       }
   }
   ```

### Scenario 4: Creating an Event Subscriber

**Goal:** Generate a subscriber for performance hints display

**Steps:**

1. **Open Feature Directory**
   ```
   Navigate to: inc/Engine/PerformanceHints/
   ```

2. **Run Generator**
   ```
   Command Palette → "WP Rocket: Generate Subscriber"
   ```

3. **Enter Subscriber Name**
   ```
   Subscriber Name: DisplaySubscriber
   ```

4. **Result:**
   ```
   Created: inc/Engine/PerformanceHints/Subscriber/DisplaySubscriber.php
   ```

5. **Use Code Snippets to Add Hooks**
   - Type: `wpr-hook`
   - Tab to complete
   - Fill in hook name and method

   ```php
   public static function get_subscribed_events(): array {
       return [
           'wp_enqueue_scripts' => ['enqueue_scripts', 10],
           'wp_footer' => 'add_performance_hints',
       ];
   }
   ```

### Scenario 5: Generating Test Files

**Goal:** Create integration tests for ImageDimensions class

**Steps:**

1. **Open Source File**
   ```
   File: inc/Engine/Media/ImageDimensions/ImageDimensions.php
   ```

2. **Generate Test**
   - Right-click in editor
   - Select: "Generate Test File"
   - Choose: "Integration"

3. **Result:**
   ```
   Created: tests/Integration/Engine/Media/ImageDimensions/Test_ImageDimensions.php
   ```

4. **Add Test Methods Using Snippets**
   ```php
   // Type: wpr-test
   /**
    * @dataProvider imageDataProvider
    */
   public function testGetDimensions( $input, $expected ) {
       $dimensions = $this->instance->get_dimensions( $input );
       $this->assertSame( $expected, $dimensions );
   }

   // Type: wpr-dataprovider
   public function imageDataProvider() {
       return [
           [
               'input' => 'image.jpg',
               'expected' => ['width' => 800, 'height' => 600],
           ],
       ];
   }
   ```

### Scenario 6: Smart Navigation

**Goal:** Jump between source and test files

**Example 1: Source → Test**

1. **Open Source**
   ```
   File: inc/Engine/Optimization/RUCSS/Controller/UsedCSS.php
   ```

2. **Navigate to Test**
   - Press: `Right-click → Go to Test File`
   - Or: Command Palette → "WP Rocket: Go to Test File"
   - Or: Context menu → "Go to Test File"

3. **Opens:**
   ```
   tests/Integration/Engine/Optimization/RUCSS/Controller/Test_UsedCSS.php
   ```

**Example 2: Test → Source**

1. **Open Test**
   ```
   File: tests/Integration/Engine/CDN/Test_CDN.php
   ```

2. **Navigate to Source**
   - Right-click → "Go to Test File / Source File"
   - Automatically opens: `inc/Engine/CDN/CDN.php`

### Scenario 7: Finding Services in Container

**Goal:** Locate service registration in container

**Steps:**

1. **Run Service Finder**
   ```
   Command Palette → "WP Rocket: Find Service in Container"
   ```

2. **Search for Service**
   ```
   Type: "cache"
   Shows all cache-related services:
   - cache.manager
   - cache.purger
   - cache.subscriber
   ```

3. **Select Service**
   - Click on `cache.manager`
   - Opens ServiceProvider where it's registered
   - Jumps to exact registration line

### Scenario 8: Hook Usage Search

**Goal:** Find all uses of a WordPress hook

**Steps:**

1. **Run Hook Finder**
   ```
   Command Palette → "WP Rocket: Find Hook Usage"
   ```

2. **Enter Hook Name**
   ```
   Hook: wp_enqueue_scripts
   ```

3. **Results:**
   ```
   Found 12 usage(s):
   - inc/Engine/Admin/Settings/Subscriber.php:45
   - inc/Engine/Media/Subscriber.php:78
   - inc/Engine/Optimization/Subscriber.php:92
   - ...
   ```

4. **Jump to Usage**
   - Select any result
   - Editor opens at exact line

### Scenario 9: Using Code Snippets

**Service Provider Example:**

```php
// Type: wpr-provider
// Expands to:
<?php

namespace WP_Rocket\Engine\PerformanceHints;

use WP_Rocket\Dependencies\League\Container\ServiceProvider\AbstractServiceProvider;

class PerformanceHintsServiceProvider extends AbstractServiceProvider {
    protected $provides = [
        
    ];

    public function register(): void {
        
    }
}
```

**Subscriber Example:**

```php
// Type: wpr-subscriber
// Expands to:
<?php

namespace WP_Rocket\Engine\PerformanceHints\Subscriber;

use WP_Rocket\Event_Management\Subscriber_Interface;

class DisplaySubscriber implements Subscriber_Interface {
    public static function get_subscribed_events(): array {
        return [
            'hook_name' => 'method_name',
        ];
    }

    public function method_name() {
        
    }
}
```

**Test Class Example:**

```php
// Type: wpr-testclass
// Generates complete test structure with setUp, tearDown, test method, and data provider
```

### Scenario 10: Monitoring Test Statistics

**Goal:** Track test performance over time

**Dashboard View:**

```
╔══════════════════════════════════════════════════════════════╗
║ 🚀 WP Rocket Test Runner                                     ║
║ Branch: feature/performance-hints    |    12 changed files   ║
╚══════════════════════════════════════════════════════════════╝

╔════════════════╗  ╔════════════════╗  ╔════════════════╗
║ Tests Today    ║  ║ Success Rate   ║  ║ Avg Duration   ║
║      24        ║  ║      96%       ║  ║      12s       ║
╚════════════════╝  ╚════════════════╝  ╚════════════════╝

Recent Tests:
✅ test:integration - 11:23 AM - 14.2s
✅ test:unit - 11:15 AM - 3.5s
❌ test:integration-woo - 11:08 AM - 18.7s
✅ phpcs:fix - 11:02 AM - 2.1s
✅ test:unit - 10:58 AM - 3.4s
```

### Scenario 11: Context Menu Power User

**Right-Click on PHP File:**

```
📄 CacheManager.php

┌─────────────────────────────────────┐
│ Cut                                  │
│ Copy                                 │
│ Paste                                │
├─────────────────────────────────────┤
│ 🚀 Run Tests for This File          │ ← WP Rocket
│ 🎯 Run Quality Check on This File   │ ← WP Rocket
│ 📝 Generate Test File               │ ← WP Rocket
│ 🔄 Go to Test File / Source File    │ ← WP Rocket
└─────────────────────────────────────┘
```

### Scenario 12: Keyboard Shortcuts Mastery

```
Workflow: Fix Bug → Write Test → Run Tests → Quality Check

1. Edit source file: inc/Engine/CDN/CDN.php
   Fix the bug...

2. Generate test:
   Cmd+Shift+P → "Generate Test File" → "Integration"

3. Write test using snippets:
   wpr-test → Tab → Fill in test logic

4. Run tests:
   Cmd+Shift+T I (Integration Tests)

5. Quality check:
   Cmd+Shift+T Q (Auto-fix code style)

6. Commit:
   All done! ✅
```

## 💡 Pro Tips

### Tip 1: Dashboard as Second Monitor

Open dashboard in split view:
```
1. Cmd+Shift+T D (Open Dashboard)
2. Drag to side panel
3. Code on left, tests on right
4. Live feedback while coding
```

### Tip 2: Custom Test Filters

Edit settings to watch specific patterns:
```json
{
  "wprocket.autoQualityCheck.files": [
    "inc/Engine/Media/**/*.php",
    "inc/Engine/Optimization/**/*.php"
  ]
}
```

### Tip 3: Quick Test Debugging

When test fails:
```
1. Click test in history
2. View full output
3. Copy error message
4. Fix code
5. Re-run with keyboard shortcut
```

### Tip 4: Batch Code Generation

Generate complete feature:
```
1. Generate Service Provider
2. Generate 3-4 Subscribers
3. Generate corresponding tests
4. Run quality check on all files
5. Commit as feature branch
```

### Tip 5: Hook Discovery Workflow

Finding where hooks are used:
```
1. Cmd+Shift+P → "Find Hook Usage"
2. Enter hook name
3. Browse all implementations
4. Understand feature flow
5. Add new subscriber if needed
```

## 🎯 Real-World Workflows

### Workflow 1: New Feature Development

```
1. Generate Service Provider (wpr-provider snippet)
2. Create Subscriber classes (wpr-subscriber snippet)
3. Write business logic
4. Generate tests (wpr-testclass snippet)
5. Run tests continuously (Cmd+Shift+T I)
6. Auto quality check on save ✅
7. Review in dashboard
8. Commit when all green ✅
```

### Workflow 2: Bug Fix with TDD

```
1. Navigate to source file
2. Generate test file (Right-click → Generate Test)
3. Write failing test first (wpr-test snippet)
4. Run test (should fail ❌)
5. Fix the bug in source
6. Save (auto quality check runs)
7. Run test again (should pass ✅)
8. Commit fix + test
```

### Workflow 3: Code Review Preparation

```
1. Run all tests (Cmd+Shift+T A)
2. Run quality check (Cmd+Shift+T Q)
3. Review test history in dashboard
4. Check success rate (should be 100%)
5. Review changed files
6. Create PR with confidence ✅
```

## 📊 Dashboard Features in Detail

### Live Test Output

```javascript
Running: test:integration

PHPUnit 9.5.28 by Sebastian Bergmann and contributors.

...............................................................  63 / 156 ( 40%)
...............................................................  126 / 156 ( 80%)
..............................                                  156 / 156 (100%)

Time: 00:14.236, Memory: 38.00 MB

OK (156 tests, 453 assertions)

✅ Tests passed in 14.24s
```

### Test Groups Visualization

```
Admin Tests
┌──────────────┬──────────────┬──────────────┐
│ AdminOnly    │ AdminBar     │ Settings     │
│ ✅ Ready     │ ✅ Ready     │ ✅ Ready     │
└──────────────┴──────────────┴──────────────┘

E-Commerce
┌──────────────┬──────────────┐
│ WithWoo      │ WithEDD      │
│ ✅ Ready     │ ✅ Ready     │
└──────────────┴──────────────┘
```

## 🚀 Advanced Features

### Feature 1: Test History Analysis

View trends over time:
- Success rate by day
- Most frequently run tests
- Average duration trends
- Failure patterns

### Feature 2: Smart Notifications

Context-aware notifications:
- ✅ All tests passed → Success notification
- ❌ Tests failed → Error with "Show Output" button
- 🎯 Quality check passed → Brief status message
- ⚠️ Quality issues → Warning with file list

### Feature 3: Git Integration

Real-time workspace info:
- Current branch name
- Number of changed files
- Commit count today
- Remote repository info

---

**This showcase demonstrates the full power of WP Rocket Dev Tools. Experiment with each feature to boost your productivity! 🚀**
