var _ = require('underscore'),
	chai = require('chai'),
    assert = chai.assert,
    expect = chai.expect;

var returnHandler = require('../../AST_modification/return_handler.js')();
module.exports = function(){

	describe('returnHandler', function() {
		afterEach(function(){
			resetTestData();
		});

		// Make sure the tester is running
		describe('#addFromElements()', function() {
			it('should throw an error when the elements argument is null or undefined', function() {
				(function test(arg1, arg2){
					expect(function(){
	            		returnHandler.addFromElements(arg1, arg2);
	            	}).to.throw(returnHandler.addFromElementsError);

	            	return test;
				})()(null)(null, null)({}, null);// Send in 2 undefineds then one null and a undefined and etc.
	        });

	        it('should return empty elements when the elements sent in are empty and the object to add is null/undefined/empty', function() {
	            assert.isTrue( _.isEmpty(returnHandler.addFromElements(null, [])) );
	            assert.isTrue( _.isEmpty(returnHandler.addFromElements(test.test, [])) );
	            assert.isTrue( _.isEmpty(returnHandler.addFromElements({}, [])) );
	        });

	        it('should add the specified elements argument to an empty array and return an array containing just that argument', function(){
	        	assert.equal(returnHandler.addFromElements(test.addFromReturn, [])[0], test.addFromReturn.argument);
	        });

	        it('should add the specified elements arguments to an empty array and return an array containing just those arguments');
	        it('should add the specified elements argument to an array containing 1 argument and return an array containing the argument added to' +
	           'the previous element arguments');
	        it('should add the specified elements arguments to an array containing 1 argument and return an array containing those arguments added' +
	           'to the previous element arguments');
        	it('should add the specified elements arguments to an array containing multiple arguments and return an array containing those' +
        	   'arguments added to the previous element arguments');
		});
	});
}

// Test Data, seperated so the code above is more readable
var test = {};
var resetTestData = (function reset(){
	test.addFromReturn = { 
		type: 'ReturnStatement',
		argument: 
		{ 
			type: 'BinaryExpression',
		     operator: '+',
		     left: { type: 'Identifier', name: 'x', loc: [Object] },
		     right: { type: 'Identifier', name: 'x', loc: [Object] },
		     loc: { start: [Object], end: [Object] } 
		},
	  	loc: { 
	  		start: { line: 146, column: 8 },
	     	end: { line: 146, column: 21 } 
	    }
	}

	test.addFromElements = [ 
		{ 
			type: 'BinaryExpression',
	    	operator: '*',
	    	left: { type: 'Identifier', name: 'y', loc: [Object] },
	    	right: { type: 'Identifier', name: 'y', loc: [Object] },
	    	loc: { start: [Object], end: [Object] }
	    } 
	]

	return reset;
})();
