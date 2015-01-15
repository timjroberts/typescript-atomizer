/// <reference path="../typings/atom.d.ts" />

class SelectionFixes
{
    private static TokenRegExp: RegExp = /\.|\w+/g;

    private _prefix: string;
    private _suffix: string;
    private _isStartOfMemberCompletion: boolean;

    constructor(prefix: string, suffix: string, isStartOfMemberCompletion: boolean)
    {
        this._prefix = prefix ? prefix : "";
        this._suffix = suffix ? suffix : "";
        this._isStartOfMemberCompletion = isStartOfMemberCompletion;
    }

    public get prefix(): string { return this._prefix; }

    public get suffix(): string { return this._suffix; }

    public get isStartOfMemberCompletion(): boolean { return this._isStartOfMemberCompletion; }

    public get isEmpty(): boolean
    {
        return (this._prefix.length + this._suffix.length) == 0;
    }

    /**
     * Retrieves the prefix and suffix of a selection within a text editor.
     */
    public static getFixesForSelection(textEditor: TextEditor, selection: Selection): SelectionFixes
    {
        var selectionRange: Range = selection.getBufferRange();
        var lineRange = [[selectionRange.start.row, 0], [selectionRange.end.row, textEditor.lineTextForBufferRow(selectionRange.end.row).length]]
        var prefix: string = "";
        var suffix: string = "";
        var isStartOfMemberCompletion: boolean = false;

        textEditor.getBuffer()
            .scanInRange(SelectionFixes.TokenRegExp, lineRange, (match: ScanMatch) =>
            {
                if (match.range.start.isGreaterThan(selectionRange.end))
                    match.stop();

                if (match.range.intersectsWith(selectionRange))
                {
                    if (match.matchText === ".")
                    {
                        isStartOfMemberCompletion = true;
                    }
                    else
                    {
                        var prefixOffset: number = selectionRange.start.column - match.range.start.column;
                        var suffixOffset: number = match.range.end.column - selectionRange.end.column;

                        if (match.range.start.isLessThan(selectionRange.start))
                            prefix = match.matchText.substring(0, prefixOffset);

                        if (match.range.end.isGreaterThan(selectionRange.end))
                            suffix = match.matchText.substring(match.matchText.length - suffixOffset);
                    }
                }
            });

        return new SelectionFixes(prefix, suffix, isStartOfMemberCompletion);
    }
}

export = SelectionFixes;
