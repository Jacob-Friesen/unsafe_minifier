var _ = require('lodash'),
    chai = require('chai'),
    assert = chai.assert;

var FunctionStatistics = require('../../data_generation/function_statistics.js'),
    AST_structure = require('../../AST_modification/AST_structures.js'),
    test = require('../test_data.js'),
    u = require('../../utility_functions.js');

module.exports = function(callback){
    describe('functionStatistics', function(){

        // Tests all combinations of to and from using the sent in callback for equality checks
        function dualENUTest(testCallback){
            return (function testIt(to, from){
                testCallback(to, from);

                return testIt;
            })()(test.undefined, null)(test.undefined, {})
            (null)(null, null)(null, {})
            ({})({}, null)({}, {});
        }

        var functionStatistics;
        beforeEach(function(){
            test = test.resetTestData();
            functionStatistics = FunctionStatistics();
        });

        after(function(){
            callback();
        });

        describe('#add()', function(){
            it('should do nothing and return an object empty object when either call wrapper is enu', function(){
                dualENUTest(function(to, from){
                    assert.deepEqual(functionStatistics.add(to, from, test.functionWrapper, test.functionWrapper), {});
                    return assert.deepEqual(functionStatistics.statistics, []);
                });
            });

            it('should do nothing and return an object empty object when either function wrapper is enu', function(){
                dualENUTest(function(to, from){
                    assert.deepEqual(functionStatistics.add(test.callWrapper, test.callWrapper, to, from), {});
                    return assert.deepEqual(functionStatistics.statistics, []);
                });
            });

            it('should record the names of the calls, add them to the function list and return the object', function(){
                test.callWrapper1 = _.cloneDeep(test.callWrapper);
                test.callWrapper1.simpleName = 'test1';
                test.callWrapper.simpleName = 'atest2';

                var statistics = functionStatistics.add(test.callWrapper, test.callWrapper1, test.functionWrapper, test.functionWrapper);

                [statistics, _.last(functionStatistics.statistics)].forEach(function(stats){
                    assert.equal(stats.name, test.callWrapper1.simpleName + '-' + test.callWrapper.simpleName);
                    assert.equal(stats.toChar1, test.callWrapper.simpleName[0]);
                    assert.equal(stats.fromChar1, test.callWrapper1.simpleName[0]);
                    assert.equal(stats.toCharLast, _.last(test.callWrapper.simpleName));
                    assert.equal(stats.fromCharLast, _.last(test.callWrapper1.simpleName));
                });
            });

            it('should record the arguments and parameters of the calls, add them to the function list and return the object', function(){
                test.callWrapper1 = _.cloneDeep(test.callWrapper);
                test.callWrapper.data.arguments.length = 1;
                test.callWrapper1.data.arguments.length = 2;

                test.functionWrapper1 = _.cloneDeep(test.functionWrapper);
                test.functionWrapper.data.params.length = 3;
                test.functionWrapper1.data.params.length = 4;

                var statistics = functionStatistics.add(test.callWrapper, test.callWrapper1, test.functionWrapper, test.functionWrapper1);

                [statistics, _.last(functionStatistics.statistics)].forEach(function(stats){
                    assert.equal(stats.paramsTo, test.functionWrapper.data.params.length);
                    assert.equal(stats.paramsFrom, test.functionWrapper1.data.params.length);
                    assert.equal(stats.argsTo, test.callWrapper.data.arguments.length);
                    assert.equal(stats.argsFrom, test.callWrapper1.data.arguments.length);
                });
            });

            it('should record the locations of the calls, add them to the function list and return the object', function(){
                test.callWrapper1 = _.cloneDeep(test.callWrapper);
                test.callWrapper.data.loc.start.line = 151;
                test.callWrapper1.data.loc.start.line = 152;

                var statistics = functionStatistics.add(test.callWrapper, test.callWrapper1, test.functionWrapper, test.functionWrapper);

                [statistics, _.last(functionStatistics.statistics)].forEach(function(stats){
                    assert.equal(stats.startTo, test.callWrapper.data.loc.start.line);
                    assert.equal(stats.startFrom, test.callWrapper1.data.loc.start.line);
                });
            });
        });
    });
}