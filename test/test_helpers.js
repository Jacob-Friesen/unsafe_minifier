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

    // Tests all null and undefined combinations of the first and second argument using the sent in callback
   	this.dualNullUndefinedTest = function(testCallback){
        return (function testIt(arg1, arg2){
            testCallback(arg1, arg2);

            return testIt;
        })()(null)(null, null)({}.undefined, null);
    }

	return this;
}
