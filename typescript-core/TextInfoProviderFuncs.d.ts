interface TextInfoProviderFuncs {
    textProvider: (path: string) => string;

    versionProvider: (path: string) => number;
}
