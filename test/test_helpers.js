var chai = require('chai'),
    assert = chai.assert;

// Any of the tests return the function that calls the callback so they can be called again with more arguments sent in after the initial run through
module.exports = function(){
	
	// Tests all combinations in empty/null/undefined (enu) of a single variable
	this.ENUTest = function(testCallback){
		return (function testIt(arg){
			testCallback(arg);
			return testIt;
		})()(null)({});
	};

	// Tests all ENU combinations of the first and second argument using the sent in callback
	this.dualENUTest = function(testCallback){
        return (function testIt(arg1, arg2){
            testCallback(arg1, arg2);

            return testIt;
        })()({}.undefined, null)({}.undefined, {})
        (null)(null, null)(null, {})
        ({})({}, null)({}, {});
    }

    // Tests all null and undefined combinations for a single argument
    this.nullUndefinedTest = function(testCallback){
        return (function testIt(arg){
            testCallback(arg);
            return testIt;
        })()(null);
    }

    // Tests all null and undefined combinations of the first and second argument using the sent in callback
   	this.dualNullUndefinedTest = function(testCallback){
        return (function testIt(arg1, arg2){
            testCallback(arg1, arg2);

            return testIt;
        })()(null)(null, null)({}.undefined, null);
    }

    // Same as last but for three arguments
    this.tripleNullUndefinedTest = function(testCallback){
        return (function testIt(arg1, arg2, arg3){
            testCallback(arg1, arg2, arg3);

            return testIt;
        })()({}.undefined, {}.undefined, null)({}.undefined, null, {}.undefined)({}.undefined, null, null)
        (null, {}.undefined, {}.undefined)(null, {}.undefined, null)(null, null, {}.undefined)(null, null, null);
    }

    // Checks if all the properties of the given objects are present in each other
    this.sameStructureTest = function test(obj1, obj2){
        for(property in obj1)
            assert.isDefined(obj2[property]);
        for(property in obj2)
            assert.isDefined(obj1[property]);

        return test;
    }

	return this;
}
