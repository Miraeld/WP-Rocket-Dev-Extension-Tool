import * as vscode from 'vscode';
import { TestRunner, TestResult } from '../testRunner';
import { QualityCheck } from '../qualityCheck';
import { GitUtils } from '../utils/git';
import { ComposerUtils } from '../utils/composer';
import * as path from 'path';
import * as fs from 'fs';

export class TestDashboardProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private _panel?: vscode.WebviewPanel;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private testRunner: TestRunner,
        private qualityCheck: QualityCheck
    ) {
        // Listen to test runner events
        this.testRunner.onTestStart(() => {
            this.sendMessage({ type: 'testStarted', data: {} });
        });

        this.testRunner.onTestComplete((success: boolean) => {
            this.sendMessage({ 
                type: 'testCompleted', 
                data: { success } 
            });
            this.updateHistory();
            this.updateDashboard();
        });

        this.testRunner.onTestOutput((output: string) => {
            this.sendMessage({ 
                type: 'testOutput', 
                data: { output } 
            });
        });
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (message) => {
            await this.handleMessage(message);
        });

        // Send initial data
        this.updateDashboard();
    }

    public openDashboard() {
        if (this._panel) {
            this._panel.reveal();
            return;
        }

        this._panel = vscode.window.createWebviewPanel(
            'wprocketDashboard',
            '🚀 WP Rocket Test Dashboard',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [this._extensionUri],
                retainContextWhenHidden: true
            }
        );

        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

        this._panel.webview.onDidReceiveMessage(async (message) => {
            await this.handleMessage(message);
        });

        this._panel.onDidDispose(() => {
            this._panel = undefined;
        });

        // Send initial data
        this.updateDashboard();
    }

    private async handleMessage(message: any) {
        switch (message.command) {
            case 'runTest':
                await this.testRunner.runTests(message.payload.scriptName);
                break;
            case 'stopTest':
                this.testRunner.stopCurrentTest();
                break;
            case 'runQuality':
                await this.qualityCheck.runFullCheck();
                break;
            case 'clearHistory':
                this.testRunner.clearTestHistory();
                this.updateHistory();
                break;
            case 'refresh':
                await this.updateDashboard();
                break;
        }
    }

    private async updateDashboard() {
        const gitBranch = await GitUtils.getCurrentBranch();
        const changedFiles = await GitUtils.getChangedFiles();
        const testScripts = await this.getTestScripts();
        const history = this.testRunner.getTestHistory();
        const stats = this.calculateStats(history);
        const lastRuns = this.getLastRuns(history);

        this.sendMessage({
            type: 'dashboardData',
            data: {
                gitBranch,
                changedFiles,
                changedFilesCount: changedFiles.length,
                testScripts,
                stats,
                lastRuns
            }
        });

        this.updateHistory();
    }

    private async updateHistory() {
        const history = this.testRunner.getTestHistory();
        this.sendMessage({
            type: 'testHistory',
            data: { history: history.slice(0, 10) }
        });
    }

    private async getTestScripts(): Promise<any[]> {
        const workspacePath = this.getWorkspacePath();
        if (!workspacePath) {
            console.log('No workspace path found');
            return [];
        }

        console.log('Loading test scripts from:', workspacePath);
        const categorized = await ComposerUtils.getScriptsByCategory(workspacePath);
        const result: any[] = [];

        categorized.forEach((scripts, category) => {
            result.push({
                category,
                scripts: scripts.map(s => ({
                    name: s.name,
                    displayName: ComposerUtils.formatScriptName(s.name)
                }))
            });
        });

        console.log('Found test scripts:', result.length, 'categories');
        return result;
    }

    private calculateStats(history: TestResult[]): any {
        const last24h = history.filter(
            t => t.timestamp > Date.now() - 24 * 60 * 60 * 1000
        );

        const successCount = last24h.filter(t => t.success).length;
        const successRate = last24h.length > 0 
            ? (successCount / last24h.length) * 100 
            : 0;

        const avgDuration = last24h.length > 0
            ? last24h.reduce((sum, t) => sum + t.duration, 0) / last24h.length
            : 0;

        return {
            testsToday: last24h.length,
            successRate: Math.round(successRate),
            avgDuration: Math.round(avgDuration / 1000)
        };
    }
    
    private getLastRuns(history: TestResult[]): any {
        const lastRuns: any = {};
        const testTypes = ['test-unit', 'test-integration'];
        
        testTypes.forEach(testType => {
            const lastTest = history.find(t => t.name === testType);
            if (lastTest) {
                lastRuns[testType] = {
                    timestamp: lastTest.timestamp,
                    success: lastTest.success
                };
            }
        });
        
        return lastRuns;
    }

    private sendMessage(message: any) {
        if (this._view) {
            this._view.webview.postMessage(message);
        }
        if (this._panel) {
            this._panel.webview.postMessage(message);
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

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'out', 'webview', 'dashboard.js')
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'out', 'webview', 'dashboard.css')
        );

        // Load HTML template from file
        const htmlPath = path.join(this._extensionUri.fsPath, 'out', 'webview', 'dashboard.html');
        let html = fs.readFileSync(htmlPath, 'utf8');
        
        // Replace placeholders
        html = html.replace('{{cssUri}}', styleUri.toString());
        html = html.replace('{{scriptUri}}', scriptUri.toString());
        
        return html;
    }
}
