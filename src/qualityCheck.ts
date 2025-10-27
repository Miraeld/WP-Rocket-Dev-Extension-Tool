import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class QualityCheck {
    private outputChannel: vscode.OutputChannel;
    private diagnosticsCollection: vscode.DiagnosticCollection;

    constructor(private context: vscode.ExtensionContext) {
        this.outputChannel = vscode.window.createOutputChannel('WP Rocket Quality Check');
        this.diagnosticsCollection = vscode.languages.createDiagnosticCollection('wprocket');
        context.subscriptions.push(this.diagnosticsCollection);
    }

    public async runFullCheck(): Promise<boolean> {
        const workspacePath = this.getWorkspacePath();
        if (!workspacePath) {
            vscode.window.showErrorMessage('No workspace folder found');
            return false;
        }

        this.outputChannel.clear();
        this.outputChannel.show();
        this.outputChannel.appendLine('🎯 Running Quality Check...');
        this.outputChannel.appendLine('='.repeat(80));

        const config = vscode.workspace.getConfiguration('wprocket');
        const runPhpcs = config.get<boolean>('autoQualityCheck.runPhpcs', true);
        const runPhpstan = config.get<boolean>('autoQualityCheck.runPhpstan', true);

        let success = true;

        if (runPhpcs) {
            this.outputChannel.appendLine('\n📝 Running PHPCS Fixer...');
            const phpcsSuccess = await this.runPhpcs(workspacePath);
            success = success && phpcsSuccess;
        }

        if (runPhpstan) {
            this.outputChannel.appendLine('\n🔍 Running PHPStan...');
            const phpstanSuccess = await this.runPhpstan(workspacePath);
            success = success && phpstanSuccess;
        }

        this.outputChannel.appendLine('\n' + '='.repeat(80));
        this.outputChannel.appendLine(
            success 
                ? '✅ Quality check passed!' 
                : '❌ Quality check found issues'
        );

        const showNotifications = config.get<boolean>('autoQualityCheck.showNotifications', true);
        if (showNotifications) {
            if (success) {
                vscode.window.showInformationMessage('✅ Quality check passed!');
            } else {
                vscode.window.showWarningMessage(
                    '❌ Quality check found issues',
                    'Show Output'
                ).then(selection => {
                    if (selection === 'Show Output') {
                        this.outputChannel.show();
                    }
                });
            }
        }

        return success;
    }

    public async runCheckForFile(uri: vscode.Uri): Promise<boolean> {
        const workspacePath = this.getWorkspacePath();
        if (!workspacePath) {
            return false;
        }

        const relativePath = path.relative(workspacePath, uri.fsPath);
        
        this.outputChannel.clear();
        this.outputChannel.show();
        this.outputChannel.appendLine(`🎯 Running Quality Check on: ${relativePath}`);
        this.outputChannel.appendLine('='.repeat(80));

        const config = vscode.workspace.getConfiguration('wprocket');
        const runPhpcs = config.get<boolean>('autoQualityCheck.runPhpcs', true);
        const runPhpstan = config.get<boolean>('autoQualityCheck.runPhpstan', true);

        let success = true;

        if (runPhpcs) {
            success = await this.runPhpcsForFile(workspacePath, relativePath) && success;
        }

        if (runPhpstan) {
            success = await this.runPhpstanForFile(workspacePath, relativePath) && success;
        }

        return success;
    }

    private async runPhpcs(workspacePath: string): Promise<boolean> {
        try {
            const command = `cd "${workspacePath}" && composer phpcs:fix`;
            const { stdout, stderr } = await execAsync(command, { maxBuffer: 10 * 1024 * 1024 });
            
            if (stdout) {
                this.outputChannel.appendLine(stdout);
            }
            if (stderr) {
                this.outputChannel.appendLine(stderr);
            }

            return true;
        } catch (error: any) {
            this.outputChannel.appendLine(error.stdout || error.message);
            return false;
        }
    }

    private async runPhpstan(workspacePath: string): Promise<boolean> {
        try {
            const command = `cd "${workspacePath}" && composer run-stan`;
            const { stdout, stderr } = await execAsync(command, { maxBuffer: 10 * 1024 * 1024 });
            
            if (stdout) {
                this.outputChannel.appendLine(stdout);
                this.parsePhpstanOutput(stdout, workspacePath);
            }
            if (stderr) {
                this.outputChannel.appendLine(stderr);
            }

            return !stdout.includes('[ERROR]');
        } catch (error: any) {
            this.outputChannel.appendLine(error.stdout || error.message);
            if (error.stdout) {
                this.parsePhpstanOutput(error.stdout, workspacePath);
            }
            return false;
        }
    }

    private async runPhpcsForFile(workspacePath: string, filePath: string): Promise<boolean> {
        try {
            const command = `cd "${workspacePath}" && ./vendor/bin/phpcs --standard=phpcs.xml "${filePath}" --report=json`;
            const { stdout } = await execAsync(command, { maxBuffer: 10 * 1024 * 1024 });
            
            this.outputChannel.appendLine(stdout);
            this.parsePhpcsOutput(stdout, workspacePath);
            
            return true;
        } catch (error: any) {
            this.outputChannel.appendLine(error.stdout || error.message);
            if (error.stdout) {
                this.parsePhpcsOutput(error.stdout, workspacePath);
            }
            return false;
        }
    }

    private async runPhpstanForFile(workspacePath: string, filePath: string): Promise<boolean> {
        try {
            const command = `cd "${workspacePath}" && ./vendor/bin/phpstan analyze "${filePath}" --error-format=json`;
            const { stdout } = await execAsync(command, { maxBuffer: 10 * 1024 * 1024 });
            
            this.outputChannel.appendLine(stdout);
            this.parsePhpstanOutput(stdout, workspacePath);
            
            return true;
        } catch (error: any) {
            this.outputChannel.appendLine(error.stdout || error.message);
            if (error.stdout) {
                this.parsePhpstanOutput(error.stdout, workspacePath);
            }
            return false;
        }
    }

    private parsePhpcsOutput(output: string, workspacePath: string): void {
        try {
            const result = JSON.parse(output);
            this.diagnosticsCollection.clear();

            for (const [filePath, fileData] of Object.entries(result.files || {})) {
                const diagnostics: vscode.Diagnostic[] = [];
                const data = fileData as any;

                (data.messages || []).forEach((message: any) => {
                    const range = new vscode.Range(
                        message.line - 1,
                        message.column - 1,
                        message.line - 1,
                        message.column + 10
                    );

                    const severity = message.type === 'ERROR' 
                        ? vscode.DiagnosticSeverity.Error 
                        : vscode.DiagnosticSeverity.Warning;

                    diagnostics.push(new vscode.Diagnostic(
                        range,
                        message.message,
                        severity
                    ));
                });

                const uri = vscode.Uri.file(filePath);
                this.diagnosticsCollection.set(uri, diagnostics);
            }
        } catch (error) {
            // Output is not JSON, skip parsing
        }
    }

    private parsePhpstanOutput(output: string, workspacePath: string): void {
        try {
            const result = JSON.parse(output);
            this.diagnosticsCollection.clear();

            if (result.files) {
                for (const [filePath, fileData] of Object.entries(result.files)) {
                    const diagnostics: vscode.Diagnostic[] = [];
                    const data = fileData as any;

                    (data.messages || []).forEach((message: any) => {
                        const range = new vscode.Range(
                            message.line - 1,
                            0,
                            message.line - 1,
                            100
                        );

                        diagnostics.push(new vscode.Diagnostic(
                            range,
                            message.message,
                            vscode.DiagnosticSeverity.Error
                        ));
                    });

                    const uri = vscode.Uri.file(filePath);
                    this.diagnosticsCollection.set(uri, diagnostics);
                }
            }
        } catch (error) {
            // Output is not JSON, skip parsing
        }
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
