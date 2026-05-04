import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import YAML from 'yaml';
import { Config } from './types';

export function loadConfig(
    workspaceFolder: string,
    output: vscode.OutputChannel,
): Config | null {
    const configPath = path.join(workspaceFolder, 'pleasanter.yml');
    if (!fs.existsSync(configPath)) return null;

    try {
        const raw = fs.readFileSync(configPath, 'utf-8');
        return YAML.parse(raw);
    } catch (error: any) {
        vscode.window.showErrorMessage('Invalid YAML: pleasanter.yml');
        output.appendLine(`[ERROR] YAML parse failed: ${error.message}`);
        return null;
    }
}
