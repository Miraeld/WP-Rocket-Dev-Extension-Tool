import * as vscode from 'vscode';
import { exec, ChildProcess } from 'child_process';
import * as path from 'path';
import { ComposerUtils } from './utils/composer';
import { StorageUtils } from './utils/storage';

export interface TestResult {
    name: string;
    success: boolean;
    duration: number;
    output: string;
    timestamp: number;
}

export class TestRunner {
    private outputChannel: vscode.OutputChannel;
    private currentProcess: ChildProcess | null = null;
    private testStartCallbacks: (() => void)[] = [];
    private testCompleteCallbacks: ((success: boolean) => void)[] = [];
    private testOutputCallbacks: ((output: string) => void)[] = [];
    private storage: StorageUtils;

    constructor(private context: vscode.ExtensionContext) {
        this.outputChannel = vscode.window.createOutputChannel('WP Rocket Tests');
        this.storage = new StorageUtils(context);
    }

    public onTestStart(callback: () => void): void {
        this.testStartCallbacks.push(callback);
    }

    public onTestComplete(callback: (success: boolean) => void): void {
        this.testCompleteCallbacks.push(callback);
    }

    public onTestOutput(callback: (output: string) => void): void {
        this.testOutputCallbacks.push(callback);
    }

    public async runTests(scriptName: string): Promise<TestResult> {
        const workspacePath = this.getWorkspacePath();
        if (!workspacePath) {
            vscode.window.showErrorMessage('No workspace folder found');
            throw new Error('No workspace folder');
        }

        // Notify test start
        this.testStartCallbacks.forEach(cb => cb());

        const startTime = Date.now();
        
        const config = vscode.workspace.getConfiguration('wprocket');
        const showNotifications = config.get<boolean>('testRunner.showNotifications', true);
        const showOutput = config.get<boolean>('testRunner.showOutput', false);
        
        // Only clear and write to output if showOutput is enabled
        if (showOutput) {
            this.outputChannel.clear();
            this.outputChannel.appendLine(`🚀 Running: ${scriptName}`);
            this.outputChannel.appendLine('='.repeat(80));
        }

        if (showNotifications) {
            vscode.window.showInformationMessage(`Running ${scriptName}...`);
        }

        return new Promise((resolve) => {
            let command: string;
            
            // Use direct PHPUnit execution for unit and integration tests with memory limit
            if (scriptName === 'test-unit') {
                command = `cd "${workspacePath}" && php -d memory_limit=512M vendor/bin/phpunit --configuration tests/Unit/phpunit.xml.dist --testdox`;
            } else if (scriptName === 'test-integration') {
                command = `cd "${workspacePath}" && php -d memory_limit=512M vendor/bin/phpunit --configuration tests/Integration/phpunit.xml.dist --testdox`;
            } else {
                // Use composer for other test scripts
                command = `cd "${workspacePath}" && composer ${scriptName}`;
            }

            this.currentProcess = exec(command, { maxBuffer: 10 * 1024 * 1024 });

            let output = '';

            if (this.currentProcess.stdout) {
                this.currentProcess.stdout.on('data', (data: Buffer) => {
                    const text = data.toString();
                    output += text;
                    if (showOutput) {
                        this.outputChannel.append(text);
                    }
                    this.testOutputCallbacks.forEach(cb => cb(text));
                });
            }

            if (this.currentProcess.stderr) {
                this.currentProcess.stderr.on('data', (data: Buffer) => {
                    const text = data.toString();
                    output += text;
                    if (showOutput) {
                        this.outputChannel.append(text);
                    }
                    this.testOutputCallbacks.forEach(cb => cb(text));
                });
            }

            this.currentProcess.on('close', (code: number | null) => {
                const duration = Date.now() - startTime;
                const success = code === 0;
                
                if (showOutput) {
                    this.outputChannel.appendLine('='.repeat(80));
                    this.outputChannel.appendLine(
                        success 
                            ? `✅ Tests passed in ${(duration / 1000).toFixed(2)}s` 
                            : `❌ Tests failed after ${(duration / 1000).toFixed(2)}s`
                    );
                }

                // Save to history
                const result: TestResult = {
                    name: scriptName,
                    success,
                    duration,
                    output,
                    timestamp: Date.now()
                };

                const config = vscode.workspace.getConfiguration('wprocket');
                const saveHistory = config.get<boolean>('testRunner.saveHistory', true);
                
                if (saveHistory) {
                    this.storage.addTestResult(result);
                }

                // Notify completion
                this.testCompleteCallbacks.forEach(cb => cb(success));

                if (showNotifications) {
                    if (success) {
                        vscode.window.showInformationMessage(
                            `✅ ${scriptName} passed in ${(duration / 1000).toFixed(2)}s`
                        );
                    } else {
                        vscode.window.showErrorMessage(
                            `❌ ${scriptName} failed`,
                            'Show Output'
                        ).then(selection => {
                            if (selection === 'Show Output') {
                                this.outputChannel.show();
                            }
                        });
                    }
                }

                this.currentProcess = null;
                resolve(result);
            });
        });
    }

    public async runTestsForFile(uri: vscode.Uri): Promise<void> {
        const workspacePath = this.getWorkspacePath();
        if (!workspacePath) {
            return;
        }

        const relativePath = path.relative(workspacePath, uri.fsPath);
        
        // Determine test type based on file path
        let testScript = 'run-tests';
        if (relativePath.includes('tests/Unit')) {
            testScript = 'test-unit';
        } else if (relativePath.includes('tests/Integration')) {
            testScript = 'test-integration';
        }

        await this.runTests(testScript);
    }

    public async getAvailableTests(): Promise<string[]> {
        const workspacePath = this.getWorkspacePath();
        if (!workspacePath) {
            return [];
        }

        const scripts = await ComposerUtils.getTestScripts(workspacePath);
        return scripts;
    }

    public stopCurrentTest(): void {
        if (this.currentProcess) {
            this.currentProcess.kill();
            this.outputChannel.appendLine('\n⚠️ Test execution stopped by user');
            this.currentProcess = null;
            this.testCompleteCallbacks.forEach(cb => cb(false));
        }
    }

    public getTestHistory(): TestResult[] {
        return this.storage.getTestHistory();
    }

    public clearTestHistory(): void {
        this.storage.clearTestHistory();
    }

    public dispose(): void {
        this.stopCurrentTest();
        this.outputChannel.dispose();
    }

    private getWorkspacePath(): string | undefined {
        const config = vscode.workspace.getConfiguration('wprocket');
        let workspacePath = config.get<string>('workspacePath');

        if (!workspacePath && vscode.workspace.workspaceFolders) {
            // Auto-detect WP Rocket path
            for (const folder of vscode.workspace.workspaceFolders) {
                const wpRocketPath = path.join(folder.uri.fsPath, 'wp-rocket.php');
                if (require('fs').existsSync(wpRocketPath)) {
                    workspacePath = folder.uri.fsPath;
                    break;
                }
            }
        }

        return workspacePath;
    }
}
