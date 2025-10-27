import * as vscode from 'vscode';
import { TestRunner } from '../testRunner';
import { ComposerUtils } from '../utils/composer';

export class TestExplorerViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'wprocket-tests';

    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly testRunner: TestRunner
    ) {
        // Listen to test events
        this.testRunner.onTestStart(() => this.refresh());
        this.testRunner.onTestComplete(() => this.refresh());
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async data => {
            switch (data.type) {
                case 'runTest':
                    await this.testRunner.runTests(data.script);
                    break;
                case 'openDashboard':
                    await vscode.commands.executeCommand('wprocket.openDashboard');
                    break;
            }
        });

        this.refresh();
    }

    public refresh() {
        if (this._view) {
            this._view.webview.postMessage({ type: 'refresh' });
            this.loadTestScripts();
        }
    }

    private async loadTestScripts() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return;
        }

        const scripts = await ComposerUtils.getScriptsByCategory(workspaceFolders[0].uri.fsPath);
        const scriptsData: any = {};
        
        scripts.forEach((scriptList, category) => {
            scriptsData[category] = scriptList;
        });

        this._view?.webview.postMessage({ 
            type: 'updateScripts', 
            scripts: scriptsData 
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Test Explorer</title>
            <style>
                body {
                    padding: 0;
                    margin: 0;
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-foreground);
                }
                .header {
                    padding: 10px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }
                .header h3 {
                    margin: 0 0 10px 0;
                    font-size: 13px;
                    font-weight: 600;
                }
                .quick-actions {
                    display: flex;
                    gap: 5px;
                    margin-bottom: 10px;
                }
                .btn {
                    flex: 1;
                    padding: 6px 10px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 2px;
                    cursor: pointer;
                    font-size: 12px;
                    text-align: center;
                }
                .btn:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                .btn-dashboard {
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }
                .btn-dashboard:hover {
                    background: var(--vscode-button-secondaryHoverBackground);
                }
                .category {
                    margin-bottom: 10px;
                }
                .category-title {
                    padding: 8px 10px;
                    background: var(--vscode-sideBar-background);
                    font-weight: 600;
                    font-size: 11px;
                    text-transform: uppercase;
                    color: var(--vscode-foreground);
                    opacity: 0.8;
                    cursor: pointer;
                    user-select: none;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .category-title:hover {
                    background: var(--vscode-list-hoverBackground);
                }
                .category-title .icon {
                    font-size: 10px;
                }
                .category-content {
                    display: none;
                }
                .category.expanded .category-content {
                    display: block;
                }
                .category.expanded .icon {
                    transform: rotate(90deg);
                }
                .test-item {
                    padding: 8px 10px 8px 25px;
                    cursor: pointer;
                    font-size: 12px;
                    border-left: 2px solid transparent;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .test-item:hover {
                    background: var(--vscode-list-hoverBackground);
                }
                .test-item .icon {
                    opacity: 0.7;
                }
                .empty-state {
                    padding: 20px;
                    text-align: center;
                    color: var(--vscode-descriptionForeground);
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <button class="btn btn-dashboard" onclick="openDashboard()" style="width: 100%; margin-bottom: 15px; padding: 12px; font-size: 13px; font-weight: 600;">
                    � Open Full Dashboard
                </button>
                <h3>🚀 Quick Tests</h3>
                <div class="quick-actions">
                    <button class="btn" onclick="runTest('test-unit')">Unit</button>
                    <button class="btn" onclick="runTest('test-integration')">Integration</button>
                </div>
            </div>
            <div id="test-list">
                <div class="empty-state">Loading tests...</div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();

                function runTest(script) {
                    vscode.postMessage({ type: 'runTest', script });
                }

                function openDashboard() {
                    vscode.postMessage({ type: 'openDashboard' });
                }

                function toggleCategory(element) {
                    element.closest('.category').classList.toggle('expanded');
                }

                window.addEventListener('message', event => {
                    const message = event.data;
                    
                    if (message.type === 'updateScripts') {
                        updateTestList(message.scripts);
                    }
                });

                function updateTestList(scripts) {
                    const container = document.getElementById('test-list');
                    
                    if (!scripts || Object.keys(scripts).length === 0) {
                        container.innerHTML = '<div class="empty-state">No test scripts found</div>';
                        return;
                    }

                    let html = '';
                    const categoryOrder = ['Unit Tests', 'Integration Tests', 'Core Integration', 'Page Builders', 'Hosting', 'Third-Party', 'Quality Checks', 'Other'];
                    
                    categoryOrder.forEach(category => {
                        if (scripts[category] && scripts[category].length > 0) {
                            const isExpanded = category === 'Unit Tests' || category === 'Integration Tests';
                            html += \`
                                <div class="category \${isExpanded ? 'expanded' : ''}">
                                    <div class="category-title" onclick="toggleCategory(this)">
                                        <span class="icon">▶</span>
                                        <span>\${category}</span>
                                        <span style="margin-left: auto; opacity: 0.6;">(\${scripts[category].length})</span>
                                    </div>
                                    <div class="category-content">
                                        \${scripts[category].map(script => \`
                                            <div class="test-item" onclick="runTest('\${script.name}')">
                                                <span class="icon">▶️</span>
                                                <span>\${formatScriptName(script.name)}</span>
                                            </div>
                                        \`).join('')}
                                    </div>
                                </div>
                            \`;
                        }
                    });

                    container.innerHTML = html || '<div class="empty-state">No test scripts found</div>';
                }

                function formatScriptName(name) {
                    return name
                        .replace(/^test-/, '')
                        .replace(/-/g, ' ')
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                }
            </script>
        </body>
        </html>`;
    }
}
