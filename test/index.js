var _ = require('lodash');

// Run with: make test <---i> <---u>

// Unit
if (_.contains(process.argv, '---u')){
	var units = [
		'./utility_functions_test',
	    './AST_modification/return_handler_test',
	    './AST_modification/merge_function_test',
	    './AST_modification/merge_functions_test',
	    './data_generation/function_statistics_test'
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
			'./integration/generation'
		].forEach(function(file){
			require(file)();
		});
	}
}