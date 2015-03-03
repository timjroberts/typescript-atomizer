
declare module ArchitectModule {
    /**
     * A callback function that registers an initialized plugin.
     */
    export interface RegisterCallbackFunction {
        /**
         * @param error An error if the plugin has failed to initialize.
         * @param exportedObject An object that collects the 'services' exported from the plugin.
         */
        (error: Error, exportedObject: any): void;
    }

    /**
     * Provides data about a plugin.
     */
    export interface IPluginConfiguration {
        /**
         * The 'service' names that the plugin requires.
         */
        consumes: Array<string>;

        /**
         * The 'service' names that the plugin exports.
         */
        provides: Array<string>;

        /**
         * The path to the package that initialized the plugin.
         */
        packagePath: string;

        /**
         * A function that is called to initialize the plugin.
         *
         * @param options A hash of options the user passes in when creating an instance of the plugin.
         * @param imports A hash of all the 'services' that the plugin is configured to consume.
         * @param register A callback that should be called when the plugin has completed initializing.
         */
        setup: (options: any, imports: any, register: RegisterCallbackFunction) => void;
    }

    /**
     * Encapsulates a composed collection of plugins and their exported services.
     */
    export interface Architect {
        /**
         * DDD
         *
         * @param eventName The name of the event.
         * @param callback The callback to call when the event...
         */
        on(eventName: string, callback: Function);
    }

    /**
     * Creates a composition from the configured plugins and their associated services.
     *
     * @param configPath The path to a file that can be 'require'd (such as JSON or Javascript).
     * @param callback An optional callback that is invoked when the configuration has completed loading.
     * @returns An array of configuration objects that describes the composable plugins and their service
     * requirements.
     */
    export function loadConfig(configPath: string, callback?: (error: Error, config: Array<IPluginConfiguration>) => void): Array<IPluginConfiguration>;

    export function resolveConfig(config: Array<IPluginConfiguration>, base: string, callback?: any);

    /**
     * Creates a composition from the configured plugins and their associated services.
     *
     * @param config An array of plugins.
     * @param callback An optional callback that is invoked when the composition completes.
     * @returns An Architect object that represents the composed collection of plugins and their
     * associated services.
     */
    export function createApp(config: Array<IPluginConfiguration>, callback?: (error: Error, app: Architect) => void): Architect;
}

declare module "architect" {
    export = ArchitectModule;
}
