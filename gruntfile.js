module.exports = function(grunt)
    {
        grunt.loadNpmTasks("grunt-run-grunt");

        grunt.initConfig(
            {
                gruntFiles:
                    [
                        "./**/gruntfile.js",
                        "!./gruntfile.js",
                        "!./**/node_modules/**/gruntfile.js"
                    ],

                deployableGruntFiles:
                    [ "./typescript-atomizer-plugin/gruntfile.js" ],
                testableGruntFiles:
                    [ "./typescript-services-test/gruntfile.js" ],

                run_grunt:
                    {
                        build:
                            {
                                src: "<%=gruntFiles %>",
                                options: { task: "build" }
                            },

                        test:
                            {
                                src: "<%=testableGruntFiles %>",
                                options: { task: "test" }
                            },

                        deploy:
                            {
                                src: "<%=deployableGruntFiles %>",
                                options: { task: "deploy" }
                            },

                        package:
                            {
                                src: "<%=deployableGruntFiles %>",
                                options: { task: "package" }
                            }
                    }
            }
        );

        grunt.registerTask("build",   [ "run_grunt:build" ]);
        grunt.registerTask("test",    [ "run_grunt:test" ]);
        grunt.registerTask("deploy",  [ "run_grunt:deploy" ]);
        grunt.registerTask("package", [ "run_grunt:build", "run_grunt:package" ]);
    };
