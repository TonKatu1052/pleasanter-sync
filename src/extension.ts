import * as vscode from 'vscode';
import { loadConfig } from './loadConfig';
import { syncFile } from './syncFile';

export function activate(context: vscode.ExtensionContext) {
    const output = vscode.window.createOutputChannel('PleasanterSync');

    const disposable = vscode.workspace.onDidSaveTextDocument(async (document) => {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder) return;

        const config = loadConfig(workspaceFolder.uri.fsPath, output);
        if (!config) return;

        try {
            await syncFile(document, config, output);
        } catch (error: any) {
            vscode.window.showErrorMessage(`Sync failed: ${error.message}`);
            output.appendLine(`[ERROR] ${error.message}`);
        }
    });

    context.subscriptions.push(disposable, output);
}
