var _ = require('lodash'),
    chai = require('chai'),
    assert = chai.assert,
    sinon = require('sinon'),
    stub = sinon.stub,
    spy = sinon.spy;

var u = require('../../utility_functions.js'),
    messages = new require('../../messages.js')(),
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

            test.functionCalls = [];
            [
                test.callWrapper,
                _.cloneDeep(test.callWrapper),
                _.cloneDeep(test.callWrapper)
            ].forEach(function(item, index){
                item.simpleName = 'test' + index;
                test.functionCalls.push(item);
            });

            var declarationList = [
                test.functionWrapper,
                _.cloneDeep(test.functionWrapper),
                _.cloneDeep(test.functionWrapper)
            ]

            test.functionDecs = {};
            test.functionCalls.forEach(function(item, index){
                test.functionDecs[item.simpleName] = declarationList[index];
            });
        });

        describe('combineFunctions', function(){
            function stubAddMerge(){
                test.add = stub(mergeFunctions.functionStatistics, 'add');
                test.merge = stub(mergeFunctions.mergeFunction, 'merge');
            }

            function setCallLines(lines){
                test.functionCalls.forEach(function(item, index){
                    item.data.loc.start.line = lines[index];
                });
            }

            function prepareFor3Merges(alreadyStubbed){
                if (!alreadyStubbed){
                    test.add = spy(mergeFunctions.functionStatistics, 'add');
                    test.merge = spy(mergeFunctions.mergeFunction, 'merge');
                }

                test.originalCalls = [_.cloneDeep(test.functionCalls[0]), _.cloneDeep(test.functionCalls[1])];
                test.originalDecs = [_.cloneDeep(test.functionDecs['test0']), _.cloneDeep(test.functionDecs['test1'])];

                setCallLines([151, 150, 150 - mergeFunctions.MAX_SEPERATION + 1]);// keep in mind 1 collapses into 0, then 2 into 1 
                mergeFunctions.functionCalls = test.functionCalls;
                mergeFunctions.functionDeclarations = test.functionDecs;
            }

            beforeEach(function(){
                mergeFunctions = new MergeFunctions({});
                test.print = stub(mergeFunctions.functionStatistics, 'print');
            });

            afterEach(function(){
                mergeFunctions.functionStatistics.print.restore();
                if (mergeFunctions.functionStatistics.add.restore)
                    mergeFunctions.functionStatistics.add.restore();
                if (mergeFunctions.mergeFunction.merge.restore)
                    mergeFunctions.mergeFunction.merge.restore();
            });

            // Will test the callback and print calling going through the loop too later
            it('should do nothing when functionCalls are not set except call the callback and print the function statistics', function(){
                var callback = stub();
                mergeFunctions.combineFunctions(null, false, callback);

                assert.isTrue(callback.calledOnce);
                assert.isTrue(test.print.calledOnce);
            });

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

                mergeFunctions.combineFunctions(null, false, null);

                // Make sure I didn't screw up anything else that uses forEach
                assert.isTrue(forEach.calledOnce);
                Array.prototype.forEach.restore();

                test.functionCalls.forEach(function(item, index){
                    assert.equal(item.data.loc.start.line, test.functionCalls.length - 1 - index);
                });
            });

            it('should merge no functions and add no statistics if functionDeclarations are empty', function(){
                stubAddMerge();

                mergeFunctions.combineFunctions(null, false, null);
                assert.isFalse(test.add.called);
                assert.isFalse(test.merge.called);
            });

            it('should print just the total number of merges with the previous conditions if printMerges is true', function(){
                stubAddMerge();

                var consoleSpy = spy(console, 'log');
                mergeFunctions.combineFunctions(null, true, null);
                assert.isTrue(consoleSpy.calledWith(messages.merging.total(0) + ''));

                console.log.restore();
            });

            it('should merge no functions and add no statistics if all functions line numbers are either too close or far apart', function(){
                stubAddMerge();

                setCallLines([150, 150 - mergeFunctions.MAX_SEPERATION - 1, 150 - mergeFunctions.MAX_SEPERATION - 1]);
                mergeFunctions.functionCalls = test.functionCalls;

                mergeFunctions.combineFunctions(null, false, null);
                assert.isFalse(test.add.called);
                assert.isFalse(test.merge.called);
            });

            it('should merge no functions if they are far apart enough, but have the same simpleNames', function(){
                stubAddMerge();

                test.functionCalls.forEach(function(item){
                    item.simpleName = 'test';
                })

                setCallLines([150, 150 - mergeFunctions.MAX_SEPERATION, 150 - mergeFunctions.MAX_SEPERATION - 1]);
                mergeFunctions.functionCalls = test.functionCalls;

                mergeFunctions.combineFunctions(null, false, null);
                assert.isFalse(test.add.called);
                assert.isFalse(test.merge.called);
            });

            it('should merge 2 functions and add their statistics if they are in the correct seperation distance', function(){
                test.add = spy(mergeFunctions.functionStatistics, 'add');
                test.merge = spy(mergeFunctions.mergeFunction, 'merge');

                var originalCall = _.cloneDeep(test.functionCalls[1]),
                    originalDec = _.cloneDeep(test.functionDecs['test1']);

                setCallLines([150, 150, 150 - mergeFunctions.MAX_SEPERATION]);
                mergeFunctions.functionCalls = test.functionCalls;
                mergeFunctions.functionDeclarations = test.functionDecs;

                //console.log(mergeFunctions.mergeFunction)
                mergeFunctions.combineFunctions(null, false, null);

                //test that the calls were correct
                assert.isTrue(test.add.calledOnce);
                assert.isTrue(test.merge.calledOnce);
                assert.isTrue(test.add.calledWith(test.functionCalls[1], test.functionCalls[2], 
                    test.functionDecs['test1'], test.functionDecs['test2']));
                assert.isTrue(test.merge.calledWith(test.functionCalls[1], test.functionCalls[2], 
                    test.functionDecs['test1'], test.functionDecs['test2']));

                // test the contents of test.functionCalls were actually modified, these are very basic tests as more detailed modification tests
                // take place in merge_function_test
                assert.notDeepEqual(mergeFunctions.functionCalls[1], originalCall);
                assert.notDeepEqual(mergeFunctions.functionDeclarations['test1'], originalDec);
            });

            // e.g. line numbers: 0, 0 + MAX_SEPERATION, MAX_SEPERATION + MAX_SEPERATION
            it('should merge 3 functions and add their statistics if they are in the correct seperation distance from each other', function(){
                prepareFor3Merges();

                mergeFunctions.combineFunctions(null, false, null);

                //test that the calls were correct
                assert.isTrue(test.add.calledTwice);
                assert.isTrue(test.merge.calledTwice);

                // test the contents of test.functionCalls were actually modified, these are very basic tests as more detailed modification tests
                // take place in merge_function_test
                assert.notDeepEqual(mergeFunctions.functionCalls[0], test.originalCalls[0]);
                assert.notDeepEqual(mergeFunctions.functionCalls[1], test.originalCalls[1]);
                assert.notDeepEqual(mergeFunctions.functionDeclarations[0], test.originalDecs[0]);
                assert.notDeepEqual(mergeFunctions.functionDeclarations[1], test.originalDecs[1]);
            });

            it('should print each of the merges and the total number of merges with the previous conditions if printMerges is true', function(){
                stubAddMerge();
                prepareFor3Merges(true);

                var consoleSpy = spy(console, 'log');
                mergeFunctions.combineFunctions(null, true, null);

                assert.isTrue(consoleSpy.calledThrice);
                assert.equal(consoleSpy.args[0][0], messages.merging.merge(test.functionCalls[1].simpleName, test.functionCalls[0].simpleName) + '');
                assert.equal(consoleSpy.args[1][0], messages.merging.merge(test.functionCalls[2].simpleName, test.functionCalls[0].simpleName) + '');
                assert.equal(consoleSpy.args[2][0], messages.merging.total(2) + '');
            });

            it('should call the callback and print the statistics using the previous tests conditions', function(){
                stubAddMerge();
                prepareFor3Merges(true);

                var callback = stub();
                mergeFunctions.combineFunctions(null, false, callback);

                assert.isTrue(callback.calledOnce);
                assert.isTrue(test.print.calledOnce);
            });

            // Going to hold off on network tests until I am done testing the nueral network section.
        });

        describe('trimFunctionCalls', function(){
            beforeEach(function(){
                mergeFunctions = new MergeFunctions({});
            });

            it('should return an empty array when the function calls array is empty', function(){
                assert.deepEqual(mergeFunctions.trimFunctionCalls(), []);
            });

            it('should return an empty array when there are no matching functions to the calls', function(){
                test.functionCalls.forEach(function(item, index){
                    test.functionDecs[item.simpleName + 't'] = item;
                    delete test.functionDecs[item.simpleName];
                });
                mergeFunctions.functionCalls = test.functionCalls;
                mergeFunctions.functionDeclarations = test.functionDecs;

                assert.deepEqual(mergeFunctions.trimFunctionCalls(), []);
            });

            it('should return an array contianing calls that have a matching function declaration name', function(){
                test.functionCalls.forEach(function(item, index){
                    if (index < test.functionCalls.length - 1){
                        test.functionDecs[item.simpleName + 't'] = item;
                        delete test.functionDecs[item.simpleName];
                    }
                });
                mergeFunctions.functionCalls = test.functionCalls;
                mergeFunctions.functionDeclarations = test.functionDecs;

                assert.deepEqual(mergeFunctions.trimFunctionCalls(), [test.functionCalls[2]]);
            });

            it('should return an array the same function Call array as before when each call has a matching declaration', function(){
                mergeFunctions.functionCalls = test.functionCalls;
                mergeFunctions.functionDeclarations = test.functionDecs;

                assert.deepEqual(mergeFunctions.trimFunctionCalls(), test.functionCalls);
            });
        });
    });
}