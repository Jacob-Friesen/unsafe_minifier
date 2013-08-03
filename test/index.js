var _ = require('lodash');

// Run with: make test <---i> <---u>

// Unit
if (_.contains(process.argv, '---u')){
    var units = [
        './app_test',
        './utility_functions_test',
        './messages_test',
        './AST_modification/return_handler_test',
        './AST_modification/merge_function_test',
        './AST_modification/merge_functions_test',
        './generation/function_statistics_test',
        './generation/index_test',
        './training/neural_network_test',
        './training/index_test',
        './minification/index_test'
    ]

    units.forEach(function(file){
        require(file)(function(){
            if (file === _.last(units)) integrationTests();
        });
    });
}
else
    integrationTests();


// Integration
function integrationTests(){
    if (_.contains(process.argv, '---i')){
        [
            './integration/generation',
            './integration/training',
            './integration/minification'
        ].forEach(function(file){
            require(file)();
        });
    }
}