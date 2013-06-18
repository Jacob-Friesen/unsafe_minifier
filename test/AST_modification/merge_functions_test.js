var _ = require('lodash'),
    chai = require('chai'),
    assert = chai.assert,
    sinon = require('sinon'),
    stub = sinon.stub,
    spy = sinon.spy;

var u = require('../../utility_functions.js'),
    messages = require('../../messages.js')(),
    MergeFunctions = require('../../AST_modification/merge_functions.js'),
    AST_structure = require('../../AST_modification/AST_structures.js'),
    test = require('../test_data.js');

module.exports = function(callback){

    describe('mergeFunctions', function(){
        after(function(){
            callback();
        });

        var mergeFunctions;
        beforeEach(function(){
            test = test.resetTestData();
        });

        describe('mergeSimilarFunctions', function(){
            beforeEach(function(){
                mergeFunctions = MergeFunctions({});

                test.functionCalls = [
                    test.callWrapper,
                    _.cloneDeep(test.callWrapper),
                    _.cloneDeep(test.callWrapper)
                ]

                test.print = stub(mergeFunctions.functionStatistics, 'print');
                test.add = stub(mergeFunctions.functionStatistics, 'add');
                test.merge = stub(mergeFunctions.mergeFunction, 'merge');
            });

            afterEach(function(){
                mergeFunctions.functionStatistics.print.restore();
                mergeFunctions.functionStatistics.add.restore();
                mergeFunctions.mergeFunction.merge.restore();
            });

            // Will test the callback and print calling going through the loop too later
            it('should do nothing when functionCalls are not set except call the callback and print the function statistics', function(){
                var callback = stub();
                mergeFunctions.combineFunctions(null, false, callback);

                assert.isTrue(callback.calledOnce);
                assert.isTrue(test.print.calledOnce);
            });

            // Will test the callback and print calling going through the loop too later
            it('should do the same as last but with an undefined callback', function(){
                mergeFunctions.combineFunctions(null, false, {});
                assert.isTrue(test.print.calledOnce);
            });

            it('should sort the function calls by line order', function(){
                var forEach = stub(Array.prototype, 'forEach');

                test.functionCalls[0].data.loc.start.line = 1;
                test.functionCalls[1].data.loc.start.line = 0;
                test.functionCalls[2].data.loc.start.line = 2;
                mergeFunctions.functionCalls = test.functionCalls;

                mergeFunctions.combineFunctions(null, false, callback);

                // Make sure I didn't screw up anything else that uses forEach
                assert.isTrue(forEach.calledOnce);
                Array.prototype.forEach.restore();

                test.functionCalls.forEach(function(item, index){
                    assert.equal(item.data.loc.start.line, test.functionCalls.length - 1 - index);
                });
            });

            it('should merge no functions and add no statistics if functionDeclarations are empty', function(){
                mergeFunctions.combineFunctions(null, false, callback);
                assert.isFalse(test.add.called);
                assert.isFalse(test.merge.called);
            });

            it('should print just the total number of merges with the previous conditions if printMerges is true', function(){
                var consoleSpy = spy(console, 'log');
                mergeFunctions.combineFunctions(null, true, callback);
                assert.isTrue(consoleSpy.calledWith(messages.merging.total(0) + ''));
            });

            it('should merge no functions and add no statistics if all functions line numbers are either too close or far apart');

            it('should merge 2 functions and add thier statistics if they are in the correct seperation distance');

            // e.g. line numbers: 0, 0 + MAX_SEPERATION, MAX_SEPERATION + MAX_SEPERATION
            it('should merge 3 functions and add thier statistics if they are in the correct seperation distance from each other');

            it('should print each of the merges and the total number of merges with the previous conditions if printMerges is true');

            // Going to hold off on network tests until I am done testing the nueral network section.
        });
    });
}