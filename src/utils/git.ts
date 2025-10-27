import { exec } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';

const execAsync = promisify(exec);

export class GitUtils {
    public static async getCurrentBranch(): Promise<string | null> {
        try {
            const workspacePath = this.getWorkspacePath();
            if (!workspacePath) {
                return null;
            }
            const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: workspacePath });
            return stdout.trim() || null;
        } catch (error) {
            console.error('Error getting git branch:', error);
            return null;
        }
    }

    public static async getChangedFiles(): Promise<string[]> {
        try {
            const workspacePath = this.getWorkspacePath();
            if (!workspacePath) {
                return [];
            }
            const { stdout } = await execAsync('git status --porcelain', { cwd: workspacePath });
            const files = stdout
                .split('\n')
                .filter(line => line.trim())
                .map(line => line.substring(3).trim());
            return files;
        } catch (error) {
            return [];
        }
    }

    public static async getCommitCount(since: string = '1 day ago'): Promise<number> {
        try {
            const workspacePath = this.getWorkspacePath();
            if (!workspacePath) {
                return 0;
            }
            const { stdout } = await execAsync(`git log --since="${since}" --oneline | wc -l`, { cwd: workspacePath });
            return parseInt(stdout.trim(), 10) || 0;
        } catch (error) {
            return 0;
        }
    }

    public static async getRepositoryInfo(): Promise<{ owner: string; repo: string } | null> {
        try {
            const workspacePath = this.getWorkspacePath();
            if (!workspacePath) {
                return null;
            }
            const { stdout } = await execAsync('git remote get-url origin', { cwd: workspacePath });
            const url = stdout.trim();
            
            // Parse GitHub/GitLab URL
            const match = url.match(/[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
            if (match) {
                return {
                    owner: match[1],
                    repo: match[2]
                };
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    private static getWorkspacePath(): string | null {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        return workspaceFolders ? workspaceFolders[0].uri.fsPath : null;
    }
}
