var chai = require('chai'),
    assert = chai.assert;

var u = require('../utility');

// Any of the tests return the function that calls the callback so they can be called again with more arguments sent in after the initial run through.
module.exports = function(){
    var _this = this;

    // Sends every combination of the variables with the argument number to the callback.
    this.testCombination = function(/*combinations..., argNum, callback*/){
        var args = Array.prototype.slice.call(arguments),
            values = args.slice(0, -2),
            callback = args.pop(),
            argNum = args.pop();

        return (function combinate(){
            // Assign the new values and call the callback with those values
            var newValues = [];
            Array.prototype.slice.call(arguments).forEach(function(position, index){
                newValues[index] = values[position];
            });
            callback.apply(this, newValues);

            // Increment the correct argument
            var added = false;
            for (var i = arguments.length - 1; i >= 0 && !added; i -= 1){
                if (arguments[i] < values.length - 1){
                    arguments[i] += 1;
                    added = true;
                }
                else if (i > 0)
                    arguments[i] = 0;
            }

            // If all arguments have been incremented to the limit stop
            if (!added)
                return combinate;
            return combinate.apply(this, arguments);

        }).apply(this, u.fillArrayWithNumber(argNum));
    };

    // Tests all combinations in empty/null/undefined (enu) of a single variable. Empty specifies an override to the empty value for {}.
    this.ENUTest = function(testCallback, empty){
        return _this.testCombination(undefined, null, empty, 1, testCallback);
    };

    // Tests all ENU combinations of the first and second argument using the sent in callback.
    this.dualENUTest = function(testCallback){
        return _this.testCombination(undefined, null, {}, 2, testCallback);
    };

    // Tests all null and undefined combinations for a single argument.
    this.nullUndefinedTest = function(testCallback){
        return _this.testCombination(undefined, null, 1, testCallback);
    };

    // Tests all null and undefined combinations of the first and second argument using the sent in callback.
    this.dualNullUndefinedTest = function(testCallback){
        return _this.testCombination(undefined, null, 2, testCallback);
    };

    // Same as last but for three arguments.
    this.tripleNullUndefinedTest = function(testCallback){
        return _this.testCombination(undefined, null, 3, testCallback);
    };

    // Checks if all the properties of the given objects are present in each other.
    this.sameStructureTest = function test(obj1, obj2){
        for(property in obj1)
            assert.isDefined(obj2[property]);
        for(property in obj2)
            assert.isDefined(obj1[property]);

        return test;
    };
    
    return this;
}
