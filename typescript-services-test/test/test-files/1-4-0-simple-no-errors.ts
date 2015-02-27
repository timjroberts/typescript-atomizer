export function sumNumbers(a: number | string, b: number | string): number {
    var aVal: number;
    var bVal: number;

    if (typeof a === "string")
        aVal = parseInt(<string>a);
    else
        aVal = <number>a;

    if (typeof b === "string")
        bVal = parseInt(<string>b);
    else
        bVal = <number>b;

    return aVal + bVal;
}
