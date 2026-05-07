import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import YAML from 'yaml';
import * as dotenv from 'dotenv';
import { Config } from './types';

export function loadConfig(
    workspaceFolder: string,
    output: vscode.OutputChannel,
): Config | null {
    const configPath = path.join(workspaceFolder, 'pleasanter.yml');
    if (!fs.existsSync(configPath)) return null;

    dotenv.config({ path: path.join(workspaceFolder, '.env') });

    try {
        const raw = fs.readFileSync(configPath, 'utf-8');
        const parsed = YAML.parse(raw);

        return resolveEnv(parsed);
    } catch (error: any) {
        vscode.window.showErrorMessage('Invalid YAML: pleasanter.yml');
        output.appendLine(`[ERROR] YAML parse failed: ${error.message}`);
        return null;
    }
}

function resolveEnv(obj: any): any {
    if (typeof obj === 'string') {
        return obj.replace(/\$\{(.+?)\}/g, (_, key) => {
            if (!process.env[key]) {
                throw new Error(`Env not found: ${key}`);
            }
            return process.env[key];
        });
    }
    if (Array.isArray(obj)) {
        return obj.map(resolveEnv);
    }
    if (typeof obj === 'object' && obj !== null) {
        const result: any = {};
        for (const key in obj) {
            result[key] = resolveEnv(obj[key]);
        }
        return result;
    }

    return obj;
}
