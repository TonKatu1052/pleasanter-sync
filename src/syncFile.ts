import * as path from 'path';
import * as vscode from 'vscode';
import { Config, Option, Types } from './types';

export async function syncFile(
    document: vscode.TextDocument,
    config: Config,
    output: vscode.OutputChannel,
) {
    const filePath = document.uri.fsPath;
    const content = document.getText();
    const { site, type, title } = parsePath(filePath);
    const options = getOptions(config, site, type, title);
    if (options.length === 0) return;

    output.appendLine(`[SYNC] ${site}/${type}/${title}`);

    await Promise.all(options.map(async (option) => {
        const siteId = option.siteId;

        const response = await fetch(`${config.baseUrl}/api/items/${siteId}/updatesitesettings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
                ApiVersion: config.apiVersion,
                ApiKey: config.apiKey,
                [type]: [{
                    Title: title,
                    Body: content,
                    ...option.params,
                }],
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`API Error：${response.status} - ${text}`);
        }
    }));
}

function parsePath(filePath: string) {
    const parts = filePath.split(path.sep);

    if (parts.length < 3) {
        throw new Error('Invalid path structure');
    }

    const site = parts[parts.length - 3];
    const type = parts[parts.length - 2] as Types;
    const file = parts[parts.length - 1];

    const title = file.replace(/\.[^/.]+$/, '');

    return { site, type, title };
}

function getOptions(
    config: Config,
    site: string,
    type: Types,
    title: string,
): Option[] {
    if (site === 'Utility') {
        const utilParams = config.utility?.[type]?.[title] ?? {};
        title = (config.utility?.prefix ?? '') + title;

        const options: Option[] = [];

        for (const siteConfig of Object.values(config.sites ?? {})) {
            const typeConfig = siteConfig?.[type];
            const siteId = siteConfig?.siteId;

            if (typeConfig && title in typeConfig && siteId) {
                options.push({
                    siteId: siteId,
                    params: { Title: title, ...utilParams, ...typeConfig[title] },
                });
            }
        }

        return options;
    }

    const siteId = config.sites?.[site]?.siteId ?? null;
    const params = config.sites?.[site]?.[type]?.[title] ?? null;

    return siteId && params
        ? [{
            siteId: siteId,
            params: params,
        }]
        : [];
}
