/**
 * Represents an Atom Plugin.
 */
interface AtomPlugin {
    /**
     * Called when Atom activates the plugin.
     */
    activate() : void;

    /**
     * Called when Atom deactivates the plugin.
     */
    deactivate() : void;
}
