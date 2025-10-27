import * as vscode from 'vscode';

export class WelcomeViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'wprocket-welcome';

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        console.log('WelcomeView: resolveWebviewView called');
        
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        const html = this._getHtmlForWebview();
        console.log('WelcomeView: HTML generated, length:', html.length);
        webviewView.webview.html = html;

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async data => {
            switch (data.type) {
                case 'openDashboard':
                    await vscode.commands.executeCommand('wprocket.openDashboard');
                    break;
            }
        });

        // Auto-open dashboard when view is first shown
        setTimeout(() => {
            vscode.commands.executeCommand('wprocket.openDashboard');
        }, 100);
    }

    private _getHtmlForWebview() {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>WP Rocket</title>
            <style>
                body {
                    padding: 20px;
                    margin: 0;
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 200px;
                }
                .logo {
                    font-size: 48px;
                    margin-bottom: 20px;
                }
                h2 {
                    margin: 0 0 20px 0;
                    font-size: 18px;
                    font-weight: 600;
                }
                .btn {
                    padding: 12px 24px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                }
                .btn:hover {
                    background: var(--vscode-button-hoverBackground);
                }
            </style>
        </head>
        <body>
            <div class="logo">🚀</div>
            <h2>WP Rocket Dev Tools</h2>
            <button class="btn" onclick="openDashboard()">Open Dashboard</button>

            <script>
                const vscode = acquireVsCodeApi();

                function openDashboard() {
                    vscode.postMessage({ type: 'openDashboard' });
                }
            </script>
        </body>
        </html>`;
    }
}
