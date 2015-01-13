var fs = require("fs");
var package = require("./package.json");

function getAtomRootPackagesPath() {
    if (process.platform === "win32") {
        return process.env["userprofile"] + "/.atom/packages/" + package.name + "/";
    }

    throw new Error("Unsupported platform...");
}

function getGlobsForSymLinkedPackage(rootPath, realPath) {
    var globs = [];

    globs.push(rootPath + "/**/*.js");
    globs.push(rootPath + "/package.json");
    globs.push("!" + rootPath + "/node_modules/**/*");
    globs.push("!" + rootPath + "/gruntfile.js");

    var depPackage = require(realPath + "/package.json");

    for (var dependencyName in depPackage.dependencies) {
        path = rootPath + "/node_modules/" + dependencyName;

        if (fs.lstatSync(path).isSymbolicLink()) {
            globs = globs.concat(getGlobsForSymLinkedPackage(path, fs.realpathSync(path)));
        }
        else {
            globs.push(path + "/**");
        }
    }

    return globs;
}

function getPluginPackagableNodeModuleGlobs() {
    var globs = [];

    for (var dependencyName in package.dependencies) {
        var path = "node_modules/" + dependencyName;

        if (fs.lstatSync(path).isSymbolicLink()) {
            globs = globs.concat(getGlobsForSymLinkedPackage(path, fs.realpathSync(path)));
        }
        else {
            globs.push(path + "/**");
        }
    }

    return globs;
}

module.exports = function(grunt)
    {
        grunt.loadNpmTasks("grunt-typescript");
        grunt.loadNpmTasks("grunt-contrib-copy");
        grunt.loadNpmTasks("grunt-contrib-clean");
        grunt.loadNpmTasks("grunt-contrib-compress");
        grunt.loadNpmTasks("grunt-jasmine-node");

        grunt.initConfig(
            {
                typescriptFiles:
                    [
                        "**/*.ts",
                        "!node_modules/**/*",
                        "!typings/**/*",
                        "!*.d.ts"
                    ],

                pluginPackageFiles:
                    [
                        "grammars/*",
                        "keymaps/*",
                        "stylesheets/*",
                        "images/**",
                        "lib/**/*.js",
                        "lib/TypeScript/**",
                        "lib/Bootstrap/**",
                        "spec/**/*.js",
                        "package.json",
                        "README.md",
                    ].concat(getPluginPackagableNodeModuleGlobs()),

                typescript:
                    {
                        build:
                            {
                                src: "<%=typescriptFiles %>",
                                options:
                                    {
                                        module: "commonjs",
                                        target: "ES5",
                                        sourceMap: true
                                    }
                            }
                    },

                jasmine_node:
                    {
                        specs: [ "spec/" ]
                    },

                clean:
                    {
                        pluginOutput:
                            {
                                src: [ getAtomRootPackagesPath() ],
                                options:
                                    {
                                        force: true
                                    }
                            }
                    },

                copy:
                    {
                        pluginOutput:
                            {
                                src: "<%=pluginPackageFiles %>",
                                dest: getAtomRootPackagesPath()
                            }
                    },

                compress:
                    {
                        zip:
                        {
                            options:
                            {
                                mode: "zip",
                                archive: package.name + "-" + package.version + ".zip"
                            },
                            src: "<%=pluginPackageFiles %>"
                        },

                        tar:
                        {
                            options:
                            {
                                mode: "tar",
                                archive: package.name + "-" + package.version + ".tar"
                            },
                            src: "<%=pluginPackageFiles %>"
                        }
                    }
            }
        );

        grunt.registerTask("build",   [ "typescript:build" ]);
        grunt.registerTask("test",    [ "jasmine_node" ]);
        grunt.registerTask("deploy",  [ "clean:pluginOutput", "copy:pluginOutput" ]);
        grunt.registerTask("package", [ "compress:zip" ]);
    };
