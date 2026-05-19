import * as vscode from 'vscode';
import { loadConfig } from './loadConfig';
import { getSiteCode, syncFile, syncSite } from './syncFile';
import { CreateId } from './idManager';
import { Config } from './types';

export function activate(context: vscode.ExtensionContext) {
    const output = vscode.window.createOutputChannel('PleasanterSync');
    output.appendLine('[INFO] Pleasanter Sync extension activated');

    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(async (document) => {
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
            if (!workspaceFolder) return;

            const config = loadConfig(workspaceFolder.uri.fsPath, output);
            if (!config) return;

            const createId = new CreateId(config);

            try {
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: 'Pleasanter syncing...',
                }, async () => {
                    await syncFile(document, config, createId, output);
                });
            } catch (error: any) {
                vscode.window.showErrorMessage(`Sync failed: ${error.message}`);
                output.appendLine(`[ERROR] ${error.message}`);
            }
        }),

        vscode.commands.registerCommand('pleasanterSync.selectSite', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return;

            const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
            if (!workspaceFolder) return;

            const config = loadConfig(workspaceFolder.uri.fsPath, output);
            if (!config) {
                vscode.window.showErrorMessage('pleasanter.yml が見つかりません');
                return;
            }

            const selected = await selectSite(config);
            if (!selected) return;

            output.appendLine(`[INFO] Selected site: ${selected.label}`);

            const createId = new CreateId(config);

            try {
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: 'Pleasanter syncing...',
                }, async () => {
                    await syncSite(workspaceFolder.uri.fsPath, config, selected.label, createId, output);
                });
            } catch (error: any) {
                vscode.window.showErrorMessage(`SyncSite failed: ${error.message}`);
                output.appendLine(`[ERROR] ${error.message}`);
            }
        }),

        vscode.commands.registerCommand('pleasanterSync.action', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return;

            const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
            if (!workspaceFolder) return;

            const config = loadConfig(workspaceFolder.uri.fsPath, output);
            if (!config) {
                vscode.window.showErrorMessage('pleasanter.yml が見つかりません');
                return;
            }

            const siteId = await inputSiteId();
            if (!siteId) return;

            try {
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: 'Pleasanter syncing...',
                }, async () => {
                    await getSiteCode(workspaceFolder.uri.fsPath, config, siteId, output);
                });
            } catch (error: any) {
                vscode.window.showErrorMessage(`GetSiteCode failed: ${error.message}`);
                output.appendLine(`[ERROR] ${error.message}`);
            }
        }),

        output
    );
}

async function selectSite(config: Config) {
    const sites = config.sites ?? {};
    const siteNames = Object.keys(sites);
    if (siteNames.length === 0) {
        vscode.window.showInformationMessage('サイトが設定されていません');
        return;
    }

    return await vscode.window.showQuickPick(siteNames.map(name => ({
        label: name,
        description: `siteId: ${sites[name].siteId}`,
    })), {
        placeHolder: 'サイトを選択してください',
    });
}

async function inputSiteId() {
    const siteId = await vscode.window.showInputBox({
        prompt: 'サイトIDを入力してください',
        validateInput: (value) => {
            return /^\d+$/.test(value) ? null : '数値を入力してください';
        },
    });

    return siteId ? Number(siteId) : undefined;
}
