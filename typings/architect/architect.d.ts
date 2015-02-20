
declare module ArchitectModule {
    export interface RegisterFunction {
        (error: Error, exportedObject: any): void;
    }

    export interface IPluginConfiguration {
        consumes: Array<string>;
        provides: Array<string>;
        packagePath: string;
        setup: (options: any, imports: any, register: RegisterFunction) => void;
    }

    export interface Architect {
        on(eventName: string, callback: Function);
    }

    export function loadConfig(configPath: string, callback?: (error: Error, config: Array<IPluginConfiguration>) => void): Array<IPluginConfiguration>;

    export function resolveConfig(config: Array<IPluginConfiguration>, base: string, callback?: any);

    export function createApp(config: Array<IPluginConfiguration>, callback?: (error: Error, app: Architect) => void): Architect;
}

declare module "architect" {
    export = ArchitectModule;
}
