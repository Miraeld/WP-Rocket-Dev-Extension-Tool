import * as vscode from 'vscode';
import { QualityCheck } from '../qualityCheck';

export class CodeQualityViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'wprocket-quality';

    private _view?: vscode.WebviewView;
    private messageQueue: Array<{type: string, data?: any, success?: boolean}> = [];

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly qualityCheck: QualityCheck
    ) {}

    public sendOutput(data: string): void {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'output',
                data: data
            });
        } else {
            this.messageQueue.push({ type: 'output', data });
        }
    }

    public sendStarted(): void {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'started'
            });
        } else {
            this.messageQueue.push({ type: 'started' });
        }
    }

    public sendCompleted(success: boolean): void {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'completed',
                success: success
            });
        } else {
            this.messageQueue.push({ type: 'completed', success });
        }
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

        // Flush any queued messages
        this.flushMessageQueue();

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async data => {
            switch (data.type) {
                case 'runFull':
                    await this.qualityCheck.runFullCheck();
                    break;
                case 'runPhpcs':
                    await this.qualityCheck.runPhpcsOnly();
                    break;
                case 'runPhpstan':
                    await this.qualityCheck.runPhpstanOnly();
                    break;
            }
        });
    }

    private flushMessageQueue(): void {
        while (this.messageQueue.length > 0 && this._view) {
            const message = this.messageQueue.shift();
            if (message) {
                if (message.type === 'output') {
                    this._view.webview.postMessage({ type: 'output', data: message.data });
                } else if (message.type === 'started') {
                    this._view.webview.postMessage({ type: 'started' });
                } else if (message.type === 'completed') {
                    this._view.webview.postMessage({ type: 'completed', success: message.success });
                }
            }
        }
    }

    public async showView(): Promise<void> {
        await vscode.commands.executeCommand('wprocket-quality.focus');
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Code Quality</title>
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
                .actions {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    padding: 10px;
                }
                .btn {
                    padding: 10px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 2px;
                    cursor: pointer;
                    font-size: 12px;
                    text-align: left;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .btn:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                .btn .icon {
                    font-size: 16px;
                }
                .btn .label {
                    flex: 1;
                }
                .btn .description {
                    font-size: 11px;
                    opacity: 0.8;
                    margin-top: 2px;
                }
                .info {
                    padding: 10px;
                    font-size: 11px;
                    color: var(--vscode-descriptionForeground);
                    line-height: 1.5;
                }
                .info-item {
                    padding: 8px;
                    margin-bottom: 5px;
                    background: var(--vscode-editor-background);
                    border-radius: 2px;
                }
                .info-item strong {
                    color: var(--vscode-foreground);
                }
                .output-container {
                    padding: 10px;
                }
                .output-container h4 {
                    margin: 0 0 8px 0;
                    font-size: 12px;
                    font-weight: 600;
                }
                .output {
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 2px;
                    padding: 10px;
                    font-family: var(--vscode-editor-font-family);
                    font-size: 11px;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    max-height: 400px;
                    overflow-y: auto;
                    line-height: 1.5;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h3>✨ Code Quality</h3>
            </div>
            <div class="actions">
                <button class="btn" onclick="runCheck('full')">
                    <span class="icon">🔍</span>
                    <div class="label">
                        <div>Run Full Check</div>
                        <div class="description">PHPCS + PHPStan</div>
                    </div>
                </button>
                <button class="btn" onclick="runCheck('phpcs')">
                    <span class="icon">📝</span>
                    <div class="label">
                        <div>Run PHPCS</div>
                        <div class="description">Code style check</div>
                    </div>
                </button>
                <button class="btn" onclick="runCheck('phpstan')">
                    <span class="icon">🔬</span>
                    <div class="label">
                        <div>Run PHPStan</div>
                        <div class="description">Static analysis</div>
                    </div>
                </button>
            </div>
            <div class="info">
                <div class="info-item">
                    <strong>Auto-check:</strong> Quality checks run automatically when you save PHP files in watched paths.
                </div>
                <div class="info-item">
                    <strong>View results:</strong> Check the Problems panel for detailed diagnostics.
                </div>
            </div>
            <div class="output-container">
                <h4>Output</h4>
                <div id="output" class="output"></div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();

                function runCheck(type) {
                    if (type === 'full') {
                        vscode.postMessage({ type: 'runFull' });
                    } else if (type === 'phpcs') {
                        vscode.postMessage({ type: 'runPhpcs' });
                    } else if (type === 'phpstan') {
                        vscode.postMessage({ type: 'runPhpstan' });
                    }
                }

                window.addEventListener('message', event => {
                    const message = event.data;
                    const output = document.getElementById('output');
                    console.log('CodeQualityView received message:', message.type);

                    switch (message.type) {
                        case 'started':
                            output.textContent = 'Running quality check...\\n';
                            output.scrollTop = output.scrollHeight;
                            break;
                        case 'output':
                            output.textContent += message.data;
                            output.scrollTop = output.scrollHeight;
                            break;
                        case 'completed':
                            const status = message.success ? '\n✅ Check completed' : '\n❌ Check found issues';
                            output.textContent += status;
                            output.scrollTop = output.scrollHeight;
                            break;
                    }
                });
            </script>
        </body>
        </html>`;
    }
}
