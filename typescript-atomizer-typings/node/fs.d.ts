declare module "fs" {
    export function existsSync(path: string): boolean;

    export function readFileSync(path: string, encoding: string): string;
}
