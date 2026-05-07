import { Config, Types } from './types';

type UtilState = {
    titleMap: Map<string, number>;
    maxUtilId: number;
}

type SiteState = {
    titleMap: Map<string, number>;
    nextId: number;
}

export class CreateId {
    private config: Config;
    private utilState: Partial<Record<Types, UtilState>> = {};
    private siteState: Partial<Record<Types, Record<string, SiteState>>> = {};

    constructor(config: Config) {
        this.config = config;
    }

    getUtilId(type: Types, title: string): number | undefined {
        const state = this.getUtilState(type);

        if (state.titleMap.has(title)) {
            return state.titleMap.get(title)!;
        }

        return undefined;
    }

    getSiteId(type: Types, site: string, title: string): number | undefined {
        const state = this.getSiteState(type, site);

        if (state.titleMap.has(title)) {
            return state.titleMap.get(title)!;
        }

        return undefined;
    }

    private getUtilState(type: Types): UtilState {
        if (this.utilState[type]) {
            return this.utilState[type];
        }

        const titleMap = new Map<string, number>();
        let maxUtilId = 0;

        const prefix = this.config.utility?.prefix ?? '';
        const utilTypeConfig = this.config.utility?.[type];
        if (utilTypeConfig && typeof utilTypeConfig === 'object') {
            for (const title of Object.keys(utilTypeConfig)) {
                maxUtilId++;
                titleMap.set(prefix + title, maxUtilId);
            }
        }

        this.utilState[type] = {
            titleMap,
            maxUtilId,
        };

        return this.utilState[type];
    }

    private getSiteState(type: Types, site: string): SiteState {
        this.siteState[type] ??= {};
        if (this.siteState[type]![site]) {
            return this.siteState[type]![site];
        }

        const util = this.getUtilState(type);
        const titleMap = new Map<string, number>();
        let nextId = util.maxUtilId + 1;

        const siteTypeConfig = this.config.sites?.[site]?.[type];
        if (siteTypeConfig && typeof siteTypeConfig === 'object') {
            for (const [title, params] of Object.entries(siteTypeConfig)) {
                // utility
                if (util.titleMap.has(title)) {
                    titleMap.set(title, util.titleMap.get(title)!);
                    continue;
                }
                // 明示Id
                if (params && typeof params === 'object' && 'Id' in params) {
                    titleMap.set(title, Number(params.Id));
                    nextId = Math.max(nextId, titleMap.get(title)! + 1);
                    continue
                }
                // 自動Id
                titleMap.set(title, nextId++);
            }
        }

        this.siteState[type]![site] = {
            titleMap,
            nextId,
        }

        return this.siteState[type]![site];
    }
}
