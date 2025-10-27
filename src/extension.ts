import * as vscode from 'vscode';
import { TestDashboardProvider } from './webview/TestDashboard';
import { WelcomeViewProvider } from './webview/WelcomeView';
import { TestRunner } from './testRunner';
import { QualityCheck } from './qualityCheck';
import { FileWatcher } from './fileWatcher';
import { CodeGenerator } from './codeGenerator';
import { Navigation } from './navigation';
import { GitUtils } from './utils/git';

let testDashboard: TestDashboardProvider;
let welcomeView: WelcomeViewProvider;
let testRunner: TestRunner;
let qualityCheck: QualityCheck;
let fileWatcher: FileWatcher;
let codeGenerator: CodeGenerator;
let navigation: Navigation;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    console.log('WP Rocket Dev Tools: activate() called');
    vscode.window.showInformationMessage('WP Rocket: Extension activated');

    // Initialize core services
    testRunner = new TestRunner(context);
    qualityCheck = new QualityCheck(context);
    fileWatcher = new FileWatcher(context, qualityCheck);
    codeGenerator = new CodeGenerator(context);
    navigation = new Navigation(context);
    
    console.log('WP Rocket Dev Tools: Core services initialized');
    
    // Initialize WebView dashboard
    testDashboard = new TestDashboardProvider(context.extensionUri, testRunner, qualityCheck);
    
    console.log('WP Rocket Dev Tools: Dashboard provider created');
    
    // Initialize welcome view
    welcomeView = new WelcomeViewProvider(context.extensionUri);
    
    console.log('WP Rocket Dev Tools: Welcome view created');
    
    // Register welcome view
    console.log('WP Rocket Dev Tools: Registering welcome view provider with viewType:', WelcomeViewProvider.viewType);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            WelcomeViewProvider.viewType,
            welcomeView
        )
    );
    
    console.log('WP Rocket Dev Tools: Welcome view registered');
    vscode.window.showInformationMessage('WP Rocket: Welcome view registered');
    
    console.log('WP Rocket Dev Tools: Welcome view registered with type:', WelcomeViewProvider.viewType);

    // Register dashboard command
    context.subscriptions.push(
        vscode.commands.registerCommand('wprocket.openDashboard', () => {
            testDashboard.openDashboard();
        })
    );

    // Register test commands
    context.subscriptions.push(
        vscode.commands.registerCommand('wprocket.runUnitTests', async () => {
            await testRunner.runTests('test-unit');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wprocket.runIntegrationTests', async () => {
            await testRunner.runTests('test-integration');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wprocket.runQualityCheck', async () => {
            await qualityCheck.runFullCheck();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wprocket.runAllTests', async () => {
            await testRunner.runTests('run-tests');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wprocket.stopRunningTest', () => {
            testRunner.stopCurrentTest();
        })
    );

    // Register code generator commands
    context.subscriptions.push(
        vscode.commands.registerCommand('wprocket.generateServiceProvider', async () => {
            await codeGenerator.generateServiceProvider();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wprocket.generateSubscriber', async () => {
            await codeGenerator.generateSubscriber();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wprocket.generateTest', async () => {
            await codeGenerator.generateTest();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wprocket.generateMigration', async () => {
            await codeGenerator.generateMigration();
        })
    );

    // Register navigation commands
    context.subscriptions.push(
        vscode.commands.registerCommand('wprocket.goToTest', async () => {
            await navigation.goToTest();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wprocket.findService', async () => {
            await navigation.findService();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wprocket.findHook', async () => {
            await navigation.findHook();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wprocket.viewServiceProvider', async () => {
            await navigation.viewServiceProvider();
        })
    );

    // Register context menu commands
    context.subscriptions.push(
        vscode.commands.registerCommand('wprocket.runTestForFile', async (uri: vscode.Uri) => {
            await testRunner.runTestsForFile(uri);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wprocket.runQualityCheckForFile', async (uri: vscode.Uri) => {
            await qualityCheck.runCheckForFile(uri);
        })
    );

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = '$(rocket) WP Rocket';
    statusBarItem.command = 'wprocket.openDashboard';
    statusBarItem.tooltip = 'Open WP Rocket Test Dashboard';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Update status bar with git info
    updateStatusBar();

    // Listen to test runner events for status bar updates
    testRunner.onTestStart(() => {
        statusBarItem.text = '$(rocket) $(loading~spin) Running...';
    });

    testRunner.onTestComplete((success: boolean) => {
        const icon = success ? '$(check)' : '$(error)';
        statusBarItem.text = `$(rocket) ${icon}`;
        setTimeout(updateStatusBar, 3000);
    });

    // Start file watcher
    fileWatcher.start();
}

async function updateStatusBar() {
    const branch = await GitUtils.getCurrentBranch();
    if (branch) {
        statusBarItem.text = `$(rocket) ${branch}`;
    } else {
        statusBarItem.text = '$(rocket) WP Rocket';
    }
}

export function deactivate() {
    if (fileWatcher) {
        fileWatcher.stop();
    }
    if (testRunner) {
        testRunner.dispose();
    }
}
