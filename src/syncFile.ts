import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { BaseParams, Config, TYPES, Types } from './types';
import { CreateId } from './idManager';

export async function syncSite(
    workspacePath: string,
    site: string,
    config: Config,
    createId: CreateId,
    output: vscode.OutputChannel
) {
    const siteConfig = getSiteConfig(config, site);

    const types = [...TYPES];
    const params = initTypesParam(types);

    for (const type of types) {
        const typeConfig = siteConfig[type];
        if (!typeConfig) continue;

        for (const title of Object.keys(typeConfig)) {
            const file = resolveFile(workspacePath, site, type, title, config.utility?.prefix);

            if (!file) {
                output.appendLine(`[WARN] File not found: ${type}/${title}`);
                continue;
            }

            const context = fs.readFileSync(file.path, 'utf-8');
            const opt = getOptions(config, file.isUtil, site, type, file.name, createId);
            if (!opt) continue;

            const options = { ...getInvalidOptions(type), ...opt };

            params[type].push({
                Title: title,
                Body: context,
                ...options,
            });
        }
    }

    await updatesitesettings(config, siteConfig.siteId, params, output);
}

export async function syncFile(
    document: vscode.TextDocument,
    config: Config,
    createId: CreateId,
    output: vscode.OutputChannel,
) {
    const filePath = document.uri.fsPath;
    const content = document.getText();
    const { folderName, type, fileName } = parsePath(filePath);
    if (!TYPES.includes(type)) {
        output.appendLine(`[SKIP] ${filePath}`);
        return;
    }

    output.appendLine(`[SYNC] File: ${folderName}/${type}/${fileName}`);

    const params = (() => {
        if (folderName === 'Utility') {
            const options = [];
            for (const [site, siteConfig] of Object.entries(config.sites ?? {})) {
                const opt = getOptions(config, true, site, type, fileName, createId);
                if (siteConfig.siteId && opt) {
                    options.push({
                        siteId: siteConfig.siteId,
                        options: opt,
                    });
                }
            }

            return options;
        }

        const siteId = config.sites[folderName]?.siteId;
        const options = getOptions(config, false, folderName, type, fileName, createId);

        return siteId && options
            ? [{
                siteId: siteId,
                options: options,
            }] : [];
    })();

    await Promise.all(params.map(async (option) => {
        await updatesitesettings(config, option.siteId, {
            [type]: [{
                Title: fileName,
                Body: content,
                ...option.options,
            }],
        }, output);
    }));
}

async function updatesitesettings(config: Config, siteId: number, params: Record<string, any>, output: vscode.OutputChannel) {
    const url = `${config.baseUrl}/api/items/${siteId}/updatesitesettings`;
    output.appendLine(`[SYNC] URL: ${url}`);
    console.log(params);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ApiVersion: config.apiVersion,
            ApiKey: config.apiKey,
            ...params,
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`API Error：${response.status} - ${text}`);
    }

    const data = await response.json();
    if (typeof data === 'object' && data !== null && 'Id' in data && 'Message' in data) {
        output.appendLine(`[SUCCESS] Id: ${data.Id} ${data.Message}`);
    }

    return response;
}

function getSiteConfig(config: Config, site: string) {
    const siteConfig = config.sites?.[site];
    if (!siteConfig?.siteId) {
        throw new Error(`siteId not found: ${site}`);
    }

    return siteConfig;
}

function initTypesParam(types: Types[]) {
    return types.reduce((pV, cV) => {
        return { ...pV, [cV]: [] };
    }, {}) as Record<Types, any[]>;
}

function resolveFile(
    workspacePath: string,
    site: string,
    type: Types,
    title: string,
    prefix?: string
) {
    const ext = getExtension(type);

    if (prefix && title.startsWith(prefix)) {
        const fileName = title.slice(prefix.length);
        const utilPath = path.join(workspacePath, 'Utility', type, `${fileName}${ext}`);

        return fs.existsSync(utilPath) ? { name: fileName, path: utilPath, isUtil: true } : null;
    }

    const sitePath = path.join(workspacePath, site, type, `${title}${ext}`);

    return fs.existsSync(sitePath) ? { name: title, path: sitePath, isUtil: false } : null;
}

function getExtension(type: Types): string {
    switch (type) {
        case 'Styles': return '.css';
        case 'Htmls': return '.html';
        default: return '.js';
    }
}

function getOptions(
    config: Config,
    isUtil: boolean,
    site: string,
    type: Types,
    fileName: string,
    createId: CreateId
) {
    const siteConfig = config.sites?.[site];
    const siteId = siteConfig?.siteId;
    if (!siteId) {
        return null;
    }

    const title = isUtil
        ? `${config.utility?.prefix ?? ''}${fileName}`
        : fileName;
    if (!siteConfig[type] || !(title in siteConfig[type])) {
        return null;
    }

    let options: BaseParams = {};

    if (isUtil) {
        const utilOptions = config.utility?.[type]?.[fileName] ?? {};

        if (Object.keys(utilOptions).length) {
            options = { ...options, Title: title, ...utilOptions };
            if (options.Id === undefined) {
                options.Id = createId.getUtilId(type, title);
            }
        }
    }

    const siteOptions = siteConfig[type]?.[title] ?? {};
    options = { ...options, ...siteOptions };

    if (options.Id === undefined) {
        options.Id = createId.getSiteId(type, site, title);
    }

    return options;
}

function getInvalidOptions(type: Types) {
    const list: Record<Types, string[]> = {
        Styles: [
            'StyleAll',
            'StyleNew', 'StyleEdit', 'StyleIndex',
            'StyleCalendar', 'StyleCrosstab', 'StyleGantt',
            'StyleBurnDown', 'StyleTimeSeries', 'StyleKamban',
            'StyleImageLib',
        ],
        Scripts: [
            'ScriptAll',
            'ScriptNew', 'ScriptEdit', 'ScriptIndex',
            'ScriptCalendar', 'ScriptCrosstab', 'ScriptGantt',
            'ScriptBurnDown', 'ScriptTimeSeries', 'ScriptKamban',
            'ScriptImageLib',
        ],
        Htmls: [
            'HtmlAll',
            'HtmlNew', 'HtmlEdit', 'HtmlIndex',
            'HtmlCalendar', 'HtmlCrosstab', 'HtmlGantt',
            'HtmlBurnDown', 'HtmlTimeSeries', 'HtmlKamban',
            'HtmlImageLib',
        ],
        ServerScripts: [
            'ServerScriptWhenloadingSiteSettings', 'ServerScriptWhenViewProcessing',
            'ServerScriptWhenloadingRecord', 'ServerScriptBeforeFormula',
            'ServerScriptAfterFormula', 'ServerScriptBeforeCreate',
            'ServerScriptAfterCreate', 'ServerScriptBeforeUpdate',
            'ServerScriptAfterUpdate', 'ServerScriptBeforeDelete',
            'ServerScriptAfterDelete', 'ServerScriptBeforeBulkDelete',
            'ServerScriptAfterBulkDelete', 'ServerScriptBeforeOpeningPage',
            'ServerScriptBeforeOpeningRow', 'ServerScriptShared',
        ],
    }

    return list[type].reduce((pV, cV) => {
        return { ...pV, [cV]: false };
    }, {});
}

function parsePath(filePath: string) {
    const parts = filePath.split(path.sep);

    if (parts.length < 3) {
        throw new Error('Invalid path structure');
    }

    const folderName = parts[parts.length - 3];
    const type = parts[parts.length - 2] as Types;
    const file = parts[parts.length - 1];

    const fileName = file.replace(/\.[^/.]+$/, '');

    return { folderName, type, fileName };
}
