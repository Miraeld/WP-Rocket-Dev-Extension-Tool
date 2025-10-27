import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class Navigation {
    constructor(private context: vscode.ExtensionContext) {}

    public async goToTest(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active file');
            return;
        }

        const currentPath = editor.document.uri.fsPath;
        const workspacePath = this.getWorkspacePath();
        if (!workspacePath) {
            return;
        }

        const relativePath = path.relative(workspacePath, currentPath);

        // Check if we're in a test file
        if (relativePath.startsWith('tests/')) {
            await this.goToSourceFile(currentPath, workspacePath);
        } else {
            await this.goToTestFile(currentPath, workspacePath);
        }
    }

    public async findService(): Promise<void> {
        const workspacePath = this.getWorkspacePath();
        if (!workspacePath) {
            return;
        }

        // Find all ServiceProvider files
        const providers = await this.findServiceProviders(workspacePath);
        
        if (providers.length === 0) {
            vscode.window.showInformationMessage('No service providers found');
            return;
        }

        const quickPickItems = providers.map(p => ({
            label: p.name,
            description: p.path,
            filePath: p.fullPath
        }));

        const selected = await vscode.window.showQuickPick(quickPickItems, {
            placeHolder: 'Select a service provider'
        });

        if (selected) {
            const document = await vscode.workspace.openTextDocument(selected.filePath);
            await vscode.window.showTextDocument(document);
        }
    }

    public async findHook(): Promise<void> {
        const hookName = await vscode.window.showInputBox({
            prompt: 'Enter hook name to search for',
            placeHolder: 'e.g., wp_enqueue_scripts'
        });

        if (!hookName) {
            return;
        }

        const workspacePath = this.getWorkspacePath();
        if (!workspacePath) {
            return;
        }

        // Search for hook usage
        const results = await vscode.workspace.findFiles(
            '**/*.php',
            '**/vendor/**'
        );

        const hookUsages: { file: string; line: number; text: string }[] = [];

        for (const fileUri of results) {
            const content = fs.readFileSync(fileUri.fsPath, 'utf8');
            const lines = content.split('\n');

            lines.forEach((line, index) => {
                if (line.includes(hookName)) {
                    hookUsages.push({
                        file: fileUri.fsPath,
                        line: index + 1,
                        text: line.trim()
                    });
                }
            });
        }

        if (hookUsages.length === 0) {
            vscode.window.showInformationMessage(`No usages found for hook: ${hookName}`);
            return;
        }

        const quickPickItems = hookUsages.map(usage => ({
            label: `Line ${usage.line}: ${usage.text.substring(0, 60)}...`,
            description: path.relative(workspacePath, usage.file),
            file: usage.file,
            line: usage.line
        }));

        const selected = await vscode.window.showQuickPick(quickPickItems, {
            placeHolder: `Found ${hookUsages.length} usage(s) of ${hookName}`
        });

        if (selected) {
            const document = await vscode.workspace.openTextDocument(selected.file);
            const editor = await vscode.window.showTextDocument(document);
            const position = new vscode.Position(selected.line - 1, 0);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position));
        }
    }

    public async viewServiceProvider(): Promise<void> {
        await this.findService();
    }

    private async goToSourceFile(testPath: string, workspacePath: string): Promise<void> {
        const relativePath = path.relative(workspacePath, testPath);
        const sourcePath = relativePath
            .replace('tests/Unit/', 'inc/')
            .replace('tests/Integration/', 'inc/')
            .replace('Test_', '')
            .replace(/^tests\/[^\/]+\//, 'inc/');

        const fullSourcePath = path.join(workspacePath, sourcePath);

        if (fs.existsSync(fullSourcePath)) {
            const document = await vscode.workspace.openTextDocument(fullSourcePath);
            await vscode.window.showTextDocument(document);
        } else {
            vscode.window.showErrorMessage(`Source file not found: ${sourcePath}`);
        }
    }

    private async goToTestFile(sourcePath: string, workspacePath: string): Promise<void> {
        const relativePath = path.relative(workspacePath, sourcePath);
        const fileName = path.basename(sourcePath);

        // Try both Unit and Integration test paths
        const testPaths = [
            path.join(workspacePath, 'tests', 'Unit', relativePath.replace('inc/', '')),
            path.join(workspacePath, 'tests', 'Integration', relativePath.replace('inc/', ''))
        ];

        const testFileName = `Test_${fileName}`;

        for (const testDir of testPaths) {
            const testPath = path.join(path.dirname(testDir), testFileName);
            if (fs.existsSync(testPath)) {
                const document = await vscode.workspace.openTextDocument(testPath);
                await vscode.window.showTextDocument(document);
                return;
            }
        }

        // Test file doesn't exist, offer to create it
        const create = await vscode.window.showQuickPick(
            ['Create Unit Test', 'Create Integration Test', 'Cancel'],
            { placeHolder: 'Test file not found. Create one?' }
        );

        if (create && create !== 'Cancel') {
            const testType = create.includes('Unit') ? 'Unit' : 'Integration';
            const testDir = path.join(
                workspacePath,
                'tests',
                testType,
                path.dirname(relativePath.replace('inc/', ''))
            );
            const testPath = path.join(testDir, testFileName);

            if (!fs.existsSync(testDir)) {
                fs.mkdirSync(testDir, { recursive: true });
            }

            const className = path.basename(fileName, '.php');
            const content = this.getTestTemplate(className, testType);
            fs.writeFileSync(testPath, content);

            const document = await vscode.workspace.openTextDocument(testPath);
            await vscode.window.showTextDocument(document);
        }
    }

    private async findServiceProviders(workspacePath: string): Promise<Array<{
        name: string;
        path: string;
        fullPath: string;
    }>> {
        const results = await vscode.workspace.findFiles(
            '**/ServiceProvider.php',
            '**/vendor/**'
        );

        return results.map(uri => ({
            name: path.basename(path.dirname(uri.fsPath)),
            path: path.relative(workspacePath, uri.fsPath),
            fullPath: uri.fsPath
        }));
    }

    private getTestTemplate(className: string, testType: string): string {
        return `<?php

namespace WP_Rocket\\Tests\\${testType};

use WP_Rocket\\Tests\\${testType}\\TestCase;

/**
 * @covers \\${className}
 * @group  ${className}
 */
class Test_${className} extends TestCase {
    protected function setUp(): void {
        parent::setUp();
    }

    public function testExample() {
        \$this->assertTrue( true );
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
