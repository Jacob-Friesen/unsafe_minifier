// Run with: make test

// Files tested
var tests = [];
	tests.push(require('./utility_functions_test'));
	tests.push(require('./AST_modification/return_handler_test'));

// Running the tests
tests.forEach(function(test){ test(); });