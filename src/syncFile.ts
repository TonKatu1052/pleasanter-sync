import * as path from 'path';
import * as vscode from 'vscode';
import { Config, Option, Types } from './types';
import { CreateId } from './idManager';

export async function syncFile(
    document: vscode.TextDocument,
    config: Config,
    createId: CreateId,
    output: vscode.OutputChannel,
) {
    const filePath = document.uri.fsPath;
    const content = document.getText();
    const { site, type, title } = parsePath(filePath);
    const options = getOptions(config, site, type, title, createId);
    if (options.length === 0) return;

    output.appendLine(`[SYNC] ${site}/${type}/${title}`);

    await Promise.all(options.map(async (option) => {
        const siteId = option.siteId;
        const url = `${config.baseUrl}/api/items/${siteId}/updatesitesettings`;

        output.appendLine(`[SYNC] URL: ${url}`);
        output.appendLine(`[SYNC] Params: ${JSON.stringify(option.params)}`);

        const response = await fetch(url, {
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
    createId: CreateId,
): Option[] {
    if (site === 'Utility') {
        const utilParams = config.utility?.[type]?.[title] ?? {};
        title = (config.utility?.prefix ?? '') + title;

        const options: Option[] = [];

        for (const siteConfig of Object.values(config.sites ?? {})) {
            const typeConfig = siteConfig?.[type];
            const siteId = siteConfig?.siteId;

            if (typeConfig && title in typeConfig && siteId) {
                const params = { Title: title, ...utilParams, ...typeConfig[title] };
                if (params.Id === undefined) {
                    params.Id = createId.getUtilId(type, title);
                }

                options.push({
                    siteId: siteId,
                    params: params,
                });
            }
        }

        return options;
    }

    const siteId = config.sites?.[site]?.siteId;
    const params = config.sites?.[site]?.[type]?.[title];
    if (typeof params === 'object' && params.Id === undefined) {
        params.Id = createId.getSiteId(type, site, title);
    }

    return siteId && params
        ? [{
            siteId: siteId,
            params: params,
        }]
        : [];
}
