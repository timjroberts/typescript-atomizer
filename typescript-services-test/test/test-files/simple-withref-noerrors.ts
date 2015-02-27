/// <reference path="./simple-declarations.d.ts" />

export function sumNumbers(a: NumberProviderFunc, b: NumberProviderFunc): number {
    return a() + b();
}
