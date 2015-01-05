declare module "fs"
{
    interface LStat
    {
        isFile(): boolean;
        isDirectory(): boolean;
    }

    export function existsSync(path: string): boolean;

    export function readFileSync(path: string, encoding: string): string;

    export function lstatSync(path: string): LStat;
}
