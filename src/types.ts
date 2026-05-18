export const TYPES = ['Styles', 'Scripts', 'Htmls', 'ServerScripts'] as const;
export type Types = typeof TYPES[number];

export interface BaseParams {
    Id?: number;
    Title?: string;
    Body?: string;
    Disabled?: boolean;
    [key: string]: any;
}


export type Config = {
    apiKey: string;
    apiVersion: number;
    baseUrl: string;
    utility?: {
        prefix?: string;
    } & Partial<Record<Types, Record<string, BaseParams>>>;
    sites: Record<
        string, {
            siteId: number;
        } & Partial<Record<Types, Record<string, BaseParams>>>
    >;
};
