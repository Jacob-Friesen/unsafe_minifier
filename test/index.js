// Run with: make test

[
	'./utility_functions_test',
    './AST_modification/return_handler_test',
    './AST_modification/merge_function_test'
].forEach(function(file){
	require(file)();
});