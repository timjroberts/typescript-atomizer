import PathUtils = require("./PathUtils");
import Diagnostic = require("./Diagnostic");

class LanguageService {
    private _path: string;

    constructor(path: string) {
        this._path = PathUtils.normalizePath(path);
    }

    public getDiagnostics(): Diagnostic[] {
        return this.getSyntacticDiagnosticsForFile(this._path)
            .concat(this.getSemanticDiagnosticsForFile(this._path));
    }

    protected getSyntacticDiagnosticsForFile(path: string): Diagnostic[] {
        return [ ];
    }

    protected getSemanticDiagnosticsForFile(path: string): Diagnostic[] {
        return [ ];
    }
}

export = LanguageService;
