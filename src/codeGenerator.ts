import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class CodeGenerator {
    constructor(private context: vscode.ExtensionContext) {}

    public async generateServiceProvider(): Promise<void> {
        const featureName = await vscode.window.showInputBox({
            prompt: 'Enter the feature name (e.g., PerformanceHints)',
            placeHolder: 'FeatureName'
        });

        if (!featureName) {
            return;
        }

        const workspacePath = this.getWorkspacePath();
        if (!workspacePath) {
            return;
        }

        const className = `${featureName}ServiceProvider`;
        const dirPath = path.join(workspacePath, 'inc', 'Engine', featureName);
        const filePath = path.join(dirPath, `${className}.php`);

        // Create directory if it doesn't exist
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        const content = this.getServiceProviderTemplate(featureName, className);
        fs.writeFileSync(filePath, content);

        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);

        vscode.window.showInformationMessage(`Created ${className}`);
    }

    public async generateSubscriber(): Promise<void> {
        const subscriberName = await vscode.window.showInputBox({
            prompt: 'Enter the subscriber name (e.g., DisplaySubscriber)',
            placeHolder: 'SubscriberName'
        });

        if (!subscriberName) {
            return;
        }

        const workspacePath = this.getWorkspacePath();
        if (!workspacePath) {
            return;
        }

        // Try to determine feature from current file
        const editor = vscode.window.activeTextEditor;
        let featurePath = 'inc/Engine';
        
        if (editor) {
            const currentPath = editor.document.uri.fsPath;
            const match = currentPath.match(/inc\/Engine\/([^\/]+)/);
            if (match) {
                featurePath = path.join('inc', 'Engine', match[1], 'Subscriber');
            }
        }

        const dirPath = path.join(workspacePath, featurePath);
        const filePath = path.join(dirPath, `${subscriberName}.php`);

        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        const content = this.getSubscriberTemplate(subscriberName, featurePath);
        fs.writeFileSync(filePath, content);

        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);

        vscode.window.showInformationMessage(`Created ${subscriberName}`);
    }

    public async generateTest(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active file');
            return;
        }

        const sourcePath = editor.document.uri.fsPath;
        const workspacePath = this.getWorkspacePath();
        if (!workspacePath) {
            return;
        }

        const relativePath = path.relative(workspacePath, sourcePath);
        
        // Determine if unit or integration test
        const testType = await vscode.window.showQuickPick(
            ['Unit', 'Integration'],
            { placeHolder: 'Select test type' }
        );

        if (!testType) {
            return;
        }

        const testDir = path.join(workspacePath, 'tests', testType);
        const testPath = relativePath
            .replace('inc/', '')
            .replace('.php', '');
        
        const testFilePath = path.join(testDir, testPath, 'Test_' + path.basename(sourcePath));
        const testDirPath = path.dirname(testFilePath);

        if (!fs.existsSync(testDirPath)) {
            fs.mkdirSync(testDirPath, { recursive: true });
        }

        const className = path.basename(sourcePath, '.php');
        const content = this.getTestTemplate(className, testType, relativePath);
        fs.writeFileSync(testFilePath, content);

        const document = await vscode.workspace.openTextDocument(testFilePath);
        await vscode.window.showTextDocument(document);

        vscode.window.showInformationMessage(`Created test file: ${path.basename(testFilePath)}`);
    }

    public async generateMigration(): Promise<void> {
        const tableName = await vscode.window.showInputBox({
            prompt: 'Enter the table name (e.g., cache)',
            placeHolder: 'table_name'
        });

        if (!tableName) {
            return;
        }

        const workspacePath = this.getWorkspacePath();
        if (!workspacePath) {
            return;
        }

        vscode.window.showInformationMessage(
            `Database migration generation for "${tableName}" - Template ready!`
        );
    }

    private getServiceProviderTemplate(featureName: string, className: string): string {
        return `<?php

namespace WP_Rocket\\Engine\\${featureName};

use WP_Rocket\\Dependencies\\League\\Container\\ServiceProvider\\AbstractServiceProvider;

/**
 * Service provider for ${featureName}
 */
class ${className} extends AbstractServiceProvider {
    /**
     * The provides array is a way to let the container know that a service
     * is provided by this service provider.
     *
     * @var array
     */
    protected $provides = [
        // Add service names here
    ];

    /**
     * Registers the services in the container
     *
     * @return void
     */
    public function register(): void {
        // Register services here
    }
}
`;
    }

    private getSubscriberTemplate(subscriberName: string, featurePath: string): string {
        const namespace = featurePath.replace(/\//g, '\\').replace('inc\\', 'WP_Rocket\\');
        
        return `<?php

namespace ${namespace};

use WP_Rocket\\Event_Management\\Subscriber_Interface;

/**
 * ${subscriberName}
 */
class ${subscriberName} implements Subscriber_Interface {
    /**
     * Return an array of events that this subscriber listens to.
     *
     * @return array
     */
    public static function get_subscribed_events(): array {
        return [
            // 'hook_name' => 'method_name',
        ];
    }
}
`;
    }

    private getTestTemplate(className: string, testType: string, sourcePath: string): string {
        const testClass = `Test_${className}`;
        const baseClass = testType === 'Unit' ? 'TestCase' : 'TestCase';
        
        return `<?php

namespace WP_Rocket\\Tests\\${testType};

use WP_Rocket\\Tests\\${testType}\\TestCase;

/**
 * @covers \\${className}
 * @group  ${className}
 */
class ${testClass} extends TestCase {
    /**
     * Test setup
     */
    protected function setUp(): void {
        parent::setUp();
    }

    /**
     * Test teardown
     */
    protected function tearDown(): void {
        parent::tearDown();
    }

    /**
     * @dataProvider dataProvider
     */
    public function testExample( $input, $expected ) {
        // Add your test here
        \$this->assertSame( $expected, $input );
    }

    /**
     * Data provider for testExample
     */
    public function dataProvider() {
        return [
            [
                'input'    => 'test',
                'expected' => 'test',
            ],
        ];
    }
}
`;
    }

    private getWorkspacePath(): string | undefined {
        const config = vscode.workspace.getConfiguration('wprocket');
        let workspacePath = config.get<string>('workspacePath');

        if (!workspacePath && vscode.workspace.workspaceFolders) {
            workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        }

        return workspacePath;
    }
}
