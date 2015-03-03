import PathUtils = require("./PathUtils");
import Diagnostic = require("./Diagnostic");

/**
 * A base Language Service.
 */
class LanguageService {
    private _path: string;

    /**
     * Initializes the LanguageService instance.
     *
     * @param path The path of the TypeScript document that this Language Service queries from.
     */
    constructor(path: string) {
        this._path = PathUtils.normalizePath(path);
    }

    /**
     * Retrieves the TypeScript diagnostics.
     */
    public getDiagnostics(): Diagnostic[] {
        return this.getSyntacticDiagnosticsForFile(this._path)
            .concat(this.getSemanticDiagnosticsForFile(this._path));
    }

    protected getSyntacticDiagnosticsForFile(path: string): Diagnostic[] {
        throw new Error("getSyntacticDiagnosticsForFile() should be overriden in the derived LanguageService.");
    }

    protected getSemanticDiagnosticsForFile(path: string): Diagnostic[] {
        throw new Error("getSemanticDiagnosticsForFile() should be overriden in the derived LanguageService.");
    }
}

export = LanguageService;
