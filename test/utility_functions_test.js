var _ = require('lodash'),
    chai = require('chai'),
    assert = chai.assert,
    expect = chai.expect;

var u = require('../utility_functions'),
    helper = new require('./test_helpers.js')(),
    messages = new require('../messages')();
module.exports = function(callback){ 

    describe('utility_functions', function(){
        var test = {};
        beforeEach(function(){
            test = {};
        });

        after(function(){
            callback();
        });

        // Can really only test bound for this type of thing due to randomness
        describe('#randomInt()', function() {
            it('should always give the name number when the ranges are the same', function(){
                for(i = 0; i < 10; i++)
                    assert.equal(u.randomInt(0,0), 0);
            });

            it('should always return an integer', function(){
                for(i = 0; i < 10; i++)
                    assert.strictEqual(u.randomInt(0, 50) % 1, 0);
            });

            it('should always give a number in the specified range', function(){
                for(i = 0; i < 100; i++){
                    var random = u.randomInt(50, 100);
                    assert(random <= 100 && random >= 50, 'Number is above ranges '+ random+':'+50+':'+100);
                }
            });

        });

        describe('#nullOrUndefined()', function(){
            it('should return true when a variable is not defined', function(){
                assert.isTrue(u.nullOrUndefined(test.test));
            });

            it('should return true when a variable is null', function(){
                test = null; 
                assert.isTrue(u.nullOrUndefined(test));
            });

            it('should return false when a variable is assigned', function(){
                test = false;
                assert.isFalse(u.nullOrUndefined(test));
            })
        });

        describe('#enu()', function(){
            it('should return true when a variable is not defined', function(){
                assert.isTrue(u.enu(test.test));
            });

            it('should return true when a variable is null', function(){
                test = null; 
                assert.isTrue(u.enu(test));
            });

            it('should return true when a variable is empty', function(){
                assert.isTrue(u.enu(test));
            });

            it('should return false when the variable is not empty', function(){
                test = ['here'];
                assert.isFalse(u.enu(test));
                test = {property: ''};
                assert.isFalse(u.enu(test));
            })
        });

        // Unlikely this will fail, but it is a good idea to include some basic tests for test coverage reasons.
        describe('#Array.prototype.remove()', function() {
            function arrayEqual(array1, array2){
                assert(array1.length === array2.length, 'One array is shorter than the other: ' +  array1.length +" to "+ array2.length);
                array1.forEach(function(element, index){
                    assert.equal(array2[index], element, 'Elements at index ' + index + ' are not equal');
                });
            }

            var arr = [];
            beforeEach(function(){
                arr = [1, 2, 3, '4', '5', 6];// Strings are intentional
            });

            it('should make the array length shorter', function(){
                var length = arr.length;
                arr.remove(0);
                assert.equal(arr.length, length - 1);
            });

            it('should remove the first array member and have no undefineds', function(){
                arr.remove(0);
                arrayEqual([2, 3,'4','5', 6], arr);
            });

            it('should remove the second array member and have no undefineds', function(){
                arr.remove(1);
                arrayEqual([1, 3,'4','5', 6], arr);
            });

            it('should remove the last array member and have no undefineds', function(){
                arr.remove(-1);
                arrayEqual([1, 2, 3,'4','5'], arr);
            });

            it('should remove nothing and return null when a index that is too high is requested', function(){
                var retrieved  = arr.remove(arr.length);
                arrayEqual([1, 2, 3,'4','5', 6], arr);
                assert.isNull(retrieved);
            });

            it('should remove nothing and return null when a index that is too low is requested (via negatives)', function(){
                var retrieved  = arr.remove(arr.length * -1);
                arrayEqual([1, 2, 3,'4','5', 6], arr);
                assert.isNull(retrieved);
            });
        });

        describe('#Function.prototype.defaults', function() {
            beforeEach(function(){
                test.obj = {set: 'set'};
            });

            it('should set no default values if none were given', function(){
                (function(arg1, arg2){
                    assert.isTrue(arg1);
                    assert.deepEqual(arg2, test.obj);
                }).defaults()(true, test.obj);
            });

            it('should set one default value if function was called with nothing and one default value was specified', function(){
                helper.nullUndefinedTest(function(arg1){
                    (function(inArg1){
                        assert.deepEqual(inArg1, arg1);
                    }).defaults(arg1)();

                })(true)(1)('test')(test.obj);
            });

            it('should set one default value if function was called with one undefined first value and a later value', function(){
                helper.nullUndefinedTest(function(arg1){
                    (function(inArg1, inArg2){
                        assert.deepEqual(inArg1, arg1);
                        assert.isTrue(inArg2);
                    }).defaults(arg1)({}.undefined, true);

                })(true)(1)('test')(test.obj);
            });


            it('should set all the parameter defaults when all are not defined by call and defaults specify all of them', function(){
                test.obj1 = _.cloneDeep(test.obj);

                helper.dualNullUndefinedTest(function(arg1, arg2){
                    (function(inArg1, inArg2){
                        assert.deepEqual(inArg1, arg1);
                        assert.deepEqual(inArg2, arg2);
                    }).defaults(arg1, arg2)();

                })(true, false)(1, 2)('test1', 'test2')(test.obj, test.obj1);
            });

            // (Completes overall test that function parameters have no effect)
            it('should set multiple default values even if no parameters are given (accessible through arguments)', function(){
                (function(){
                    assert.isTrue(arguments[0]);
                    assert.isFalse(arguments[1]);
                    assert.deepEqual(arguments[2], test.obj);
                }).defaults(true, false, test.obj)();
            });
        });

        describe('#hasOwnPropertyChain()', function(){
            it('should return true when nothing is provided', function(){
                assert.isTrue(u.hasOwnPropertyChain());
            });

            it('should return true when no extra arguments are provided', function(){
                assert.isTrue(u.hasOwnPropertyChain(test));
            });

            it('should return false when the base object is null/undefined', function(){
                assert.isFalse(u.hasOwnPropertyChain(null));
                assert.isFalse(u.hasOwnPropertyChain(test.test));
            });

            it('should return false when the first object is null/undefined', function(){
                assert.isFalse(u.hasOwnPropertyChain(test, 'test'));
                test.test = null;
                assert.isFalse(u.hasOwnPropertyChain(test, 'test'));
            });

            it('should return true when the first object is assigned', function(){
                test.test = 'red';
                assert.isTrue(u.hasOwnPropertyChain(test, 'test'));
            });

            it('should return false when the last object is null/undefined', function(){
                assert.isFalse(u.hasOwnPropertyChain(test, 'test'));
                test.test = {};
                test.test.test = {};
                assert.isFalse(u.hasOwnPropertyChain(test, 'test' ,'test', 'test'));
                test.test.test.test = null;
                assert.isFalse(u.hasOwnPropertyChain(test, 'test' ,'test', 'test'));
            });

            it('should return true when every object is assigned', function(){
                assert.isFalse(u.hasOwnPropertyChain(test, test));
                test.test = {};
                test.test.test = {};
                test.test.test.test = 'end';
                assert.isTrue(u.hasOwnPropertyChain(test, 'test' ,'test', 'test'));
            });
        });

        describe('#getLineNumber()', function(){
            it('should return -1 if the item sent in is enu', function(){
                [test.undefined, null, {}].forEach(function(item){
                    assert.equal(u.getLineNumber(item), -1);
                });
            });

            it('should return -1 when .loc.start.line is empty', function(){
                (function get(){
                    assert.equal(u.getLineNumber(test), -1);
                    return get;
                })(test.loc = {})
                (test.loc.start = {});
            });

            it('should return the line number .loc.start.line is defined', function(){
                test.loc = {
                    start: {
                        line: 110
                    }
                }

                assert.equal(u.getLineNumber(test), 110);
            });
        });

        describe('#sameLine()', function(){

            function testObjectEmpty(first){
                var notEmpty = {
                    loc: {
                        start: {
                            line: 100
                        }
                    }
                };

                [
                    {loc: {}},
                    {loc: {start: {}}},
                    {loc: {start: {line: {}}}}
                ].forEach(function compare(empty){
                    if (first)
                        assert.isFalse(u.sameLine(empty, notEmpty));
                    else
                        assert.isFalse(u.sameLine(notEmpty, empty));

                    return compare;
                });
            }

            function createValidLineObject(){
                return {
                    loc: {
                        start: {
                            line: 100
                        }
                    }
                };
            }

            it('should return false when both objects line numbers cannot be accessed', function(){
                (function compare(object1, object2){
                    assert.isFalse(u.sameLine(object1, object2));
                    return compare;
                })()
                ({loc: {}}, {loc: {}})
                ({loc: {start: {}}}, {loc: {start: {}}})
                ({loc: {start: {line: {}}}}, {loc: {start: {line: {}}}});
            });

            it('should return false when object 1\'s line numbers cannot be accessed', function(){
                testObjectEmpty(true);
            });

            it('should return false when object 2\'s line numbers cannot be accessed', function(){
                testObjectEmpty(false);
            });

            it('should return false when the objects line number are not equal', function(){
                var object1 = new createValidLineObject(),
                    object2 = new createValidLineObject();
                object2.loc.start.line = 101;

                assert.isFalse(u.sameLine(object1, object2));
            });

            it('should return true when the objects line number are equal', function(){
                var object1 = new createValidLineObject();
                assert.isTrue(u.sameLine(object1, object1));
            });
        });

        describe('#getJSONFile()', function(){
            it('should return null when given nothing', function(){
                assert.isNull(u.getJSONFile());
            });

            it('should return null when given an undefined or null', function(){
                assert.isNull(u.getJSONFile(test.test));
                test.test = null;
                assert.isNull(u.getJSONFile(test.test));
            });

            it('should return an empty string when one is sent in', function(){
                assert.equal(u.getJSONFile(''), '');
            });

            it('should return non JSON file contents', function(){
                expect(function(){
                    u.getJSONFile('Hello World!')
                }).to.throw(messages.utility.fileNoParse());
            });

            it('should remove commas from the end of the sent in string', function(){
                assert.equal(u.getJSONFile('["hello"],'),'hello');
            });

            it('should merge all arrays of the JSON string into one', function(){
                var part1 = [
                    {
                        a: '1',
                        b: 2,
                    },
                    {
                        c: '3',
                        d: 4
                    }
                ]

                var part2 = [
                    {
                        a: 'a',
                        b: 'b'
                    },
                    {
                        c: 'c',
                        d: 'd'
                    }
                ]

                // This is the ideal result
                var combined = [];
                combined = combined.concat(part1);
                part2.forEach(function(element){
                    combined.push(element);
                })

                // Check all valuse down to the single element level
                var result = u.getJSONFile(JSON.stringify(part1)+','+JSON.stringify(part2)+',');
                result.forEach(function(element, index){
                    for (ele in element)
                        assert.equal(element[ele], combined[index][ele]);
                });
            });
        });
    });
}