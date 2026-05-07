import * as vscode from 'vscode';
import { loadConfig } from './loadConfig';
import { syncFile } from './syncFile';
import { CreateId } from './idManager';

export function activate(context: vscode.ExtensionContext) {
    const output = vscode.window.createOutputChannel('PleasanterSync');
    output.appendLine('[INFO] Pleasanter Sync extension activated');

    const disposable = vscode.workspace.onDidSaveTextDocument(async (document) => {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder) return;

        const config = loadConfig(workspaceFolder.uri.fsPath, output);
        if (!config) return;

        const createId = new CreateId(config);

        try {
            await syncFile(document, config, createId, output);
        } catch (error: any) {
            vscode.window.showErrorMessage(`Sync failed: ${error.message}`);
            output.appendLine(`[ERROR] ${error.message}`);
        }
    });

    context.subscriptions.push(disposable, output);
}
