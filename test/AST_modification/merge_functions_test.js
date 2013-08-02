var _ = require('lodash'),
    chai = require('chai'),
    assert = chai.assert,
    expect = chai.expect,
    sinon = require('sinon'),
    stub = sinon.stub,
    spy = sinon.spy;

var u = require('../../utility_functions.js'),
    messages = new require('../../messages.js')(),
    MergeFunctions = require('../../AST_modification/merge_functions.js'),
    MergeFunction = require('../../AST_modification/merge_function.js'),
    FunctionStatistics = require('../../generation/function_statistics.js'),
    AST_structure = require('../../AST_modification/AST_structures.js'),
    helper = new require('../test_helpers.js')(),
    test = require('../test_data.js');

module.exports = function(callback){

    describe('MergeFunctions', function(){
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

        describe('#constructor()', function(){
            it('should throw an error when the files or AST sent in is null or undefined', function(){
                helper.dualNullUndefinedTest(function(files, AST){
                    expect(function(){
                        mergeFunctions = new MergeFunctions(files, AST);
                    }).to.throw(messages.merging.noFilesAST() + '');
                });
            });

            it('should have the correct variables set', function(){
                mergeFunctions = new MergeFunctions({}, {body: {}});

                helper.sameStructureTest(mergeFunctions.functionStatistics, new FunctionStatistics());
                helper.sameStructureTest(mergeFunctions.mergeFunction, new MergeFunction())
                assert.deepEqual(mergeFunctions.files, {});
                assert.isTrue(_.isNumber(mergeFunctions.MIN_SEPERATION));
                assert.isTrue(_.isNumber(mergeFunctions.MAX_SEPERATION));
                assert.deepEqual(mergeFunctions.functionDeclarations, {});
                assert.deepEqual(mergeFunctions.functionCalls, []);
            });
        });

        describe('#combineFunctions()', function(){
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

            function createNetworkWith(returns){
                var index = -1;

                return {
                    canMerge: function(){
                        index += 1;
                        return returns[index]; 
                    }
                }
            }

            beforeEach(function(){
                messages.merging.print = false;

                mergeFunctions = new MergeFunctions({}, {body: {}});
                test.print = stub(mergeFunctions.functionStatistics, 'print');
            });

            afterEach(function(){
                mergeFunctions.functionStatistics.print.restore();
                if (mergeFunctions.functionStatistics.add.restore)
                    mergeFunctions.functionStatistics.add.restore();
                if (mergeFunctions.mergeFunction.merge.restore)
                    mergeFunctions.mergeFunction.merge.restore();
            });

            it('should do nothing when functionCalls are not set except print the function statistics', function(){
                mergeFunctions.combineFunctions(null);
                assert.isTrue(test.print.calledOnce);
            });

            it('should do the same as last but with an undefined callback', function(){
                mergeFunctions.combineFunctions(null);
                assert.isTrue(test.print.calledOnce);
            });

            it('should sort the function calls by line order', function(){
                var forEach = stub(Array.prototype, 'forEach');

                test.functionCalls[0].data.loc.start.line = 1;
                test.functionCalls[1].data.loc.start.line = 0;
                test.functionCalls[2].data.loc.start.line = 2;
                mergeFunctions.functionCalls = test.functionCalls;

                mergeFunctions.combineFunctions(null);

                // Make sure I didn't screw up anything else that uses forEach
                assert.isTrue(forEach.calledOnce);
                Array.prototype.forEach.restore();

                test.functionCalls.forEach(function(item, index){
                    assert.equal(item.data.loc.start.line, test.functionCalls.length - 1 - index);
                });
            });

            it('should merge no functions and add no statistics if functionDeclarations are empty', function(){
                stubAddMerge();

                mergeFunctions.combineFunctions(null);
                assert.isFalse(test.add.called);
                assert.isFalse(test.merge.called);
            });

            it('should print just the total number of merges with the previous conditions if printMerges is true', function(){
                stubAddMerge();
                messages.merging.print = true;

                var consoleStub = stub(console, 'log');
                mergeFunctions.combineFunctions(null);
                assert.isTrue(consoleStub.calledWith(messages.merging.total(0) + ''));

                console.log.restore();
            });

            it('should merge no functions and add no statistics if all functions line numbers are either too close or far apart', function(){
                stubAddMerge();

                setCallLines([150, 150 - mergeFunctions.MAX_SEPERATION - 1, 150 - mergeFunctions.MAX_SEPERATION - 1]);
                mergeFunctions.functionCalls = test.functionCalls;

                mergeFunctions.combineFunctions(null);
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

                mergeFunctions.combineFunctions(null);
                assert.isFalse(test.add.called);
                assert.isFalse(test.merge.called);
            });

            it('should merge 1 function and add its statistics if it is in the correct separation distance', function(){
                test.add = spy(mergeFunctions.functionStatistics, 'add');
                test.merge = spy(mergeFunctions.mergeFunction, 'merge');

                var originalCall = _.cloneDeep(test.functionCalls[1]),
                    originalDec = _.cloneDeep(test.functionDecs['test1']);

                setCallLines([150, 150, 150 - mergeFunctions.MAX_SEPERATION]);
                mergeFunctions.functionCalls = test.functionCalls;
                mergeFunctions.functionDeclarations = test.functionDecs;

                mergeFunctions.combineFunctions(null);

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
            it('should merge 2 functions and add their statistics if they are in the correct seperation distance from each other', function(){
                prepareFor3Merges();

                mergeFunctions.combineFunctions(null);

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

            it('should merge no functions, but still add their statistics if the previous, but the network indicates they can\'t merge', function(){
                prepareFor3Merges();

                mergeFunctions.combineFunctions(createNetworkWith([false, false]));

                assert.isTrue(test.add.calledTwice);
                assert.isFalse(test.merge.called);
            });

            it('should merge 2 functions and add their statistics if the previous, but the network indicates they all can merge', function(){
                prepareFor3Merges();

                mergeFunctions.combineFunctions(createNetworkWith([true, true]));

                assert.isTrue(test.add.calledTwice);
                assert.isTrue(test.merge.calledTwice);
            });

            it('should merge 1 functions and 2 functions statistics if the previous, but the network indicates one can merge', function(){
                prepareFor3Merges();

                mergeFunctions.combineFunctions(createNetworkWith([true, false]));

                assert.isTrue(test.add.calledTwice);
                assert.isTrue(test.merge.calledOnce);
            });

            it('should print each of the merges and the total number of merges with the previous conditions if printMerges is true', function(){
                stubAddMerge();
                prepareFor3Merges(true);
                messages.merging.print = true;

                var consoleStub = stub(console, 'log');
                mergeFunctions.combineFunctions(null);

                assert.isTrue(consoleStub.calledThrice);
                assert.equal(consoleStub.args[0][0], messages.merging.merge(test.functionCalls[1].simpleName, test.functionCalls[0].simpleName) + '');
                assert.equal(consoleStub.args[1][0], messages.merging.merge(test.functionCalls[2].simpleName, test.functionCalls[0].simpleName) + '');
                assert.equal(consoleStub.args[2][0], messages.merging.total(2) + '');

                console.log.restore();
            });

            it('should print the statistics using the previous tests conditions', function(){
                stubAddMerge();
                prepareFor3Merges(true);

                mergeFunctions.combineFunctions(null);

                assert.isTrue(test.print.calledOnce);
            });
        });

        describe('#trimFunctionCalls()', function(){
            beforeEach(function(){
                mergeFunctions = new MergeFunctions({}, {body: {}});
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

            it('should return an array containing calls that have a matching function declaration name', function(){
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

            it('should return an array the same function call array as before when each call has a matching declaration', function(){
                mergeFunctions.functionCalls = test.functionCalls;
                mergeFunctions.functionDeclarations = test.functionDecs;

                assert.deepEqual(mergeFunctions.trimFunctionCalls(), test.functionCalls);
            });
        });

        describe('#merge()', function(){
            function consoleTest(fileName, test){
                var consoleStub = stub(console, 'log');
                messages.merging.print = true;

                mergeFunctions.merge(fileName, null);
                test(consoleStub);

                console.log.restore();
            }

            beforeEach(function(){
                test.fileName = 'test.js';
                test.AST = {body: {}};
                mergeFunctions = new MergeFunctions({}, test.AST);

                test.findFunctionDeclarations = stub(mergeFunctions, 'findFunctionDeclarations');
                test.findFunctionCalls = stub(mergeFunctions, 'findFunctionCalls');
                test.trimFunctionCalls = stub(mergeFunctions, 'trimFunctionCalls');
                test.combineFunctions = stub(mergeFunctions, 'combineFunctions');

                messages.merging.print = false;
            });

            afterEach(function(){
                mergeFunctions.findFunctionDeclarations.restore();
                mergeFunctions.findFunctionCalls.restore();
                mergeFunctions.trimFunctionCalls.restore();
                mergeFunctions.combineFunctions.restore();
            })

            it('should print an undefined filename merging message if the file is null or undefined', function(){
                [test.undefined, null].forEach(function(fileName){
                    consoleTest(fileName, function(consoleStub){
                        assert.isTrue(consoleStub.calledOnce);
                        assert.isTrue(consoleStub.calledWith(messages.merging.noFile() + ''));
                    });
                });
            });

            it('should print a file merging message with the given filename', function(){
                consoleTest(test.fileName, function(consoleStub){
                    assert.isTrue(consoleStub.calledOnce);
                    assert.isTrue(consoleStub.calledWith(messages.merging.file('test.js') + ''));
                });
            });

            it('should call function declarations with the AST body', function(){
                mergeFunctions.merge(test.fileName, null);
                assert.isTrue(test.findFunctionDeclarations.calledOnce);
                assert.isTrue(test.findFunctionDeclarations.calledWith(test.AST.body));
            });

            it('should call the find function declarations function with the AST body', function(){
                mergeFunctions.merge(test.fileName, null);
                assert.isTrue(test.findFunctionDeclarations.calledOnce);
                assert.isTrue(test.findFunctionDeclarations.calledWith(test.AST.body));
            });

            it('should call the find function calls function with the AST body and the function declaration names', function(){
                var names = ['test1', 'test2'];
                names.forEach(function(name){
                    mergeFunctions.functionDeclarations[name] = {};
                });

                mergeFunctions.merge(test.fileName, null);
                assert.isTrue(test.findFunctionCalls.calledOnce);
                assert.isTrue(test.findFunctionCalls.calledWith(test.AST.body, names));
            });

            it('should call the trim functions to get new trimmed functions then call combine functions with the network', function(){
                var names = ['test1', 'test2'];
                names.forEach(function(name){
                    mergeFunctions.functionDeclarations[name] = {};
                });

                var functionCalls = [test.callWrapper];
                test.trimFunctionCalls.returns(functionCalls);

                mergeFunctions.merge(test.fileName, null);
                assert.deepEqual(mergeFunctions.functionCalls, functionCalls);

                assert.isTrue(test.trimFunctionCalls.calledOnce);
                assert.isTrue(test.combineFunctions.calledOnce);
            });

            it('should call the callback with the AST', function(){
                var callbackStub = stub();
                mergeFunctions.merge(test.fileName, callbackStub);
                assert.isTrue(test.combineFunctions.calledOnce);
            });
        });
    });
}