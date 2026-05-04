export type Types = 'Styles' | 'Scripts' | 'Htmls' | 'ServerScripts';

export type Params = 'Id' | 'Title' | 'Disabled' | 'Body' | 'Delete';

export type Config = {
    apiKey: string;
    apiVersion: number;
    baseUrl: string;
    utility?: {
        prefix?: string;
    } & Partial<Record<Types, Record<Params | string, any>>>;
    sites: Record<
        string, {
            siteId: number;
        } & Partial<Record<Types, Record<Params | string, any>>>
    >;
};

export type Option = {
    siteId: number;
    params: Record<Params | any, any>;
}
