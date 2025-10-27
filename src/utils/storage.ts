import * as vscode from 'vscode';
import { TestResult } from '../testRunner';

export class StorageUtils {
    private static readonly TEST_HISTORY_KEY = 'wprocket.testHistory';
    private static readonly MAX_HISTORY_ITEMS = 100;

    constructor(private context: vscode.ExtensionContext) {}

    public addTestResult(result: TestResult): void {
        const history = this.getTestHistory();
        history.unshift(result);

        const config = vscode.workspace.getConfiguration('wprocket');
        const maxItems = config.get<number>('testRunner.maxHistoryItems', StorageUtils.MAX_HISTORY_ITEMS);

        // Keep only the most recent items
        if (history.length > maxItems) {
            history.splice(maxItems);
        }

        this.context.globalState.update(StorageUtils.TEST_HISTORY_KEY, history);
    }

    public getTestHistory(): TestResult[] {
        return this.context.globalState.get<TestResult[]>(StorageUtils.TEST_HISTORY_KEY, []);
    }

    public clearTestHistory(): void {
        this.context.globalState.update(StorageUtils.TEST_HISTORY_KEY, []);
    }

    public getTestStatistics(days: number = 30): {
        totalRuns: number;
        successRate: number;
        averageDuration: number;
        mostFrequent: string[];
    } {
        const history = this.getTestHistory();
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        const recentTests = history.filter(t => t.timestamp >= cutoff);

        if (recentTests.length === 0) {
            return {
                totalRuns: 0,
                successRate: 0,
                averageDuration: 0,
                mostFrequent: []
            };
        }

        const successCount = recentTests.filter(t => t.success).length;
        const totalDuration = recentTests.reduce((sum, t) => sum + t.duration, 0);

        // Count test frequency
        const frequency = new Map<string, number>();
        recentTests.forEach(t => {
            frequency.set(t.name, (frequency.get(t.name) || 0) + 1);
        });

        const mostFrequent = Array.from(frequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name]) => name);

        return {
            totalRuns: recentTests.length,
            successRate: (successCount / recentTests.length) * 100,
            averageDuration: totalDuration / recentTests.length,
            mostFrequent
        };
    }
}
