import * as fs from 'fs';
import * as path from 'path';

export interface ComposerScript {
    name: string;
    command: string;
    category?: string;
}

export class ComposerUtils {
    public static async getTestScripts(workspacePath: string): Promise<string[]> {
        try {
            const composerPath = path.join(workspacePath, 'composer.json');
            const content = fs.readFileSync(composerPath, 'utf8');
            const composer = JSON.parse(content);

            if (!composer.scripts) {
                return [];
            }

            // Filter test-related scripts
            const testScripts = Object.keys(composer.scripts).filter(name =>
                name.startsWith('test') || 
                name.startsWith('run-tests') ||
                name.includes('phpunit') ||
                name.includes('phpcs') ||
                name.includes('phpstan') ||
                name.includes('stan')
            );

            return testScripts;
        } catch (error) {
            console.error('Error reading composer.json:', error);
            return [];
        }
    }

    public static async getScriptsByCategory(workspacePath: string): Promise<Map<string, ComposerScript[]>> {
        const scripts = await this.getTestScripts(workspacePath);
        const categorized = new Map<string, ComposerScript[]>();

        scripts.forEach(scriptName => {
            const category = this.categorizeScript(scriptName);
            if (!categorized.has(category)) {
                categorized.set(category, []);
            }
            categorized.get(category)!.push({
                name: scriptName,
                command: scriptName,
                category
            });
        });

        return categorized;
    }

    private static categorizeScript(scriptName: string): string {
        const lower = scriptName.toLowerCase();

        if (lower === 'test-unit' || lower === 'test-unit-coverage') {
            return 'Unit Tests';
        }
        if (lower === 'test-integration' || lower === 'test-integration-coverage' || 
            lower === 'run-tests' || lower === 'run-tests-coverage') {
            return 'Integration Tests';
        }
        if (lower.includes('adminonly') || lower.includes('performancehints') || lower.includes('multisite')) {
            return 'Core Integration';
        }
        if (lower.includes('elementor') || lower.includes('beaver') || lower.includes('bb') ||
            lower.includes('revolutionslider')) {
            return 'Page Builders';
        }
        if (lower.includes('wpengine') || lower.includes('cloudways') || lower.includes('kinsta') || 
            lower.includes('dreampress') || lower.includes('o2switch') || lower.includes('spinupwp') ||
            lower.includes('wpcom') || lower.includes('godaddy') || lower.includes('litespeed') ||
            lower.includes('onecom') || lower.includes('wpxcloud') || lower.includes('proisp') ||
            lower.includes('pressidium')) {
            return 'Hosting';
        }
        if (lower.includes('cloudflare') || lower.includes('smush') || lower.includes('amp') || 
            lower.includes('hummingbird') || lower.includes('pdf') || lower.includes('woo') ||
            lower.includes('sccss') || lower.includes('wordfence') || lower.includes('convertplug') ||
            lower.includes('jetpack') || lower.includes('seo') || lower.includes('lazyload') ||
            lower.includes('events-calendar') || lower.includes('perfmatters') || lower.includes('rapidload') ||
            lower.includes('geotargeting') || lower.includes('translatepress') || lower.includes('weglot')) {
            return 'Third-Party';
        }
        if (lower.includes('quality') || lower.includes('phpcs') || lower.includes('phpstan') || lower.includes('stan')) {
            return 'Quality Checks';
        }

        return 'Other';
    }

    public static formatScriptName(scriptName: string): string {
        return scriptName
            .replace(/^test:/, '')
            .replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}
