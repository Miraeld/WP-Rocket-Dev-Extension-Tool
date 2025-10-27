import * as vscode from 'vscode';
import * as chokidar from 'chokidar';
import * as path from 'path';
import { QualityCheck } from './qualityCheck';

export class FileWatcher {
    private watcher: chokidar.FSWatcher | null = null;
    private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

    constructor(
        private context: vscode.ExtensionContext,
        private qualityCheck: QualityCheck
    ) {}

    public start(): void {
        const config = vscode.workspace.getConfiguration('wprocket');
        const enabled = config.get<boolean>('autoQualityCheck.enabled', true);

        if (!enabled) {
            return;
        }

        const patterns = config.get<string[]>('autoQualityCheck.files', ['inc/Engine/**/*.php']);
        const workspacePath = this.getWorkspacePath();

        if (!workspacePath) {
            return;
        }

        const watchPaths = patterns.map(pattern => path.join(workspacePath, pattern));

        this.watcher = chokidar.watch(watchPaths, {
            ignored: /(^|[\/\\])\../,
            persistent: true,
            ignoreInitial: true
        });

        this.watcher.on('change', (filePath: string) => {
            this.handleFileChange(filePath);
        });
    }

    public stop(): void {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }

        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
    }

    private handleFileChange(filePath: string): void {
        // Debounce file changes
        const existing = this.debounceTimers.get(filePath);
        if (existing) {
            clearTimeout(existing);
        }

        const timer = setTimeout(() => {
            this.runQualityCheckForFile(filePath);
            this.debounceTimers.delete(filePath);
        }, 500);

        this.debounceTimers.set(filePath, timer);
    }

    private async runQualityCheckForFile(filePath: string): Promise<void> {
        const uri = vscode.Uri.file(filePath);
        const config = vscode.workspace.getConfiguration('wprocket');
        const showNotifications = config.get<boolean>('autoQualityCheck.showNotifications', true);

        if (showNotifications) {
            const fileName = path.basename(filePath);
            vscode.window.setStatusBarMessage(`$(loading~spin) Checking ${fileName}...`, 2000);
        }

        await this.qualityCheck.runCheckForFile(uri);
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
