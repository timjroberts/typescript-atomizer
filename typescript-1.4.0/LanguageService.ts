/// <reference path="./typescript-1-4-0.d.ts" />
/// <reference path="../typescript-core/typescript-core.d.ts" />

import ts = require("ts");
import TypeScript = require("TypeScript");
import BaseLanguageService = require("typescript-core/LanguageService");
import Diagnostic = require("typescript-core/Diagnostic");
import DiagnosticType = require("typescript-core/DiagnosticType");
import DiagnosticCategory = require("typescript-core/DiagnosticCategory");

/**
 * Provides language services for TypeScript 1.3.
 */
class LanguageService extends BaseLanguageService {
    private _underlyingLanguageService: ts.LanguageService;

    /**
     * Initializes a new Language Service that supports TypeScript 1.3.
     *
     * @param path The root file path for which language services are required.
     * @param underlyingLanguageService The underlying TypeScript 1.3 language services that is being adapted.
     */
    constructor(path: string, underlyingLanguageService: ts.LanguageService) {
        super(path);

        this._underlyingLanguageService = underlyingLanguageService;
    }

    /**
     * Returns the syntactic diagnostic issues for a given file path.
     *
     * @param path The path of the file for which diagnostics should be returned.
     * @returns An array of diagnostics.
     */
    protected getSyntacticDiagnosticsForFile(path: string): Diagnostic[] {
        var syntacticDiagnostics = this._underlyingLanguageService.getSyntacticDiagnostics(path);

        return syntacticDiagnostics.map((diagnostic: ts.Diagnostic) => {
                return <Diagnostic> {
                    path:           diagnostic.file.filename,
                    start:          diagnostic.start,
                    length:         diagnostic.length,
                    messageText:    diagnostic.messageText,
                    code:           diagnostic.code,
                    category:       LanguageService.mapDiagnosticCategory(diagnostic.category),
                    diagnosticType: DiagnosticType.Syntactic
                }});
    }

    /**
     * Returns the semantic diagnostic issues for a given file path.
     *
     * @param path The path of the file for which diagnostics should be returned.
     * @returns An array of diagnostics.
     */
    protected getSemanticDiagnosticsForFile(path: string): Diagnostic[] {
        var semanticDiagnostics = this._underlyingLanguageService.getSemanticDiagnostics(path);

        return semanticDiagnostics.map((diagnostic: ts.Diagnostic) => {
                return <Diagnostic> {
                    path:           diagnostic.file.filename,
                    start:          diagnostic.start,
                    length:         diagnostic.length,
                    messageText:    diagnostic.messageText,
                    code:           diagnostic.code,
                    category:       LanguageService.mapDiagnosticCategory(diagnostic.category),
                    diagnosticType: DiagnosticType.Semantic
                }});
    }

    /**
     * Transforms an underlying TypeScript diagnostic category value into one understood
     * by the TypeScript Services core.
     *
     * @param category The TypeScript diagnostic category value.
     * @returns A diagnostic category that can be used by the TypeScript Services core.
     */
    private static mapDiagnosticCategory(category: ts.DiagnosticCategory): DiagnosticCategory {
        if (category === ts.DiagnosticCategory.Error)
            return DiagnosticCategory.Error;
        else if (category === ts.DiagnosticCategory.Warning)
            return DiagnosticCategory.Warning;
        else if (category === ts.DiagnosticCategory.Message)
            return DiagnosticCategory.Message;

        throw new Error("Unknown DiagnosticCategory encountered.");
    }
}

export = LanguageService;
