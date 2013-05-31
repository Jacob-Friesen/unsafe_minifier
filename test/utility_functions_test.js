var chai = require('chai'),
    assert = chai.assert,
    expect = chai.expect;

var u = require('../utility_functions');
module.exports = function(callback){ 

    describe('utility_functions', function() {
        after(function(){
            callback();
        });

        // Unlikely this will fail, but it is a good idea to include it for testing reasons.
        describe('#Array.prototype.remove()', function() {
            var arr = [];
            beforeEach(function(){
                arr = [1, 2, 3, '4', '5', 6];// Strings are intentional
            });

            it('should make the array length shorter', function() {
                var length = arr.length;
                arr.remove(0);
                assert.equal(arr.length, length - 1);
            });

            function arrayEqual(array1, array2){
                assert(array1.length === array2.length, 'One array is shorter than the other: ' +  array1.length +" to "+ array2.length);
                array1.forEach(function(element, index){
                    assert.equal(array2[index], element, 'Elements at index ' + index + ' are not equal');
                });
            }

            it('should remove the first array member and have no undefineds', function() {
                arr.remove(0);
                arrayEqual([2, 3,'4','5', 6], arr);
            });

                it('should remove the second array member and have no undefineds', function() {
                arr.remove(1);
                arrayEqual([1, 3,'4','5', 6], arr);
            });

            it('should remove the last array member and have no undefineds', function() {
                arr.remove(-1);
                arrayEqual([1, 2, 3,'4','5'], arr);
            });

            it('should remove nothing and return null when a index that is too high is requested', function() {
                var retrieved  = arr.remove(arr.length);
                arrayEqual([1, 2, 3,'4','5', 6], arr);
                assert.isNull(retrieved);
            });

            it('should remove nothing and return null when a index that is too low is requested (via negatives)', function() {
                var retrieved  = arr.remove(arr.length * -1);
                arrayEqual([1, 2, 3,'4','5', 6], arr);
                assert.isNull(retrieved);
            });
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

        describe('#nullOrUndefined', function(){
            it('should return true when a variable is not defined', function(){
                var test = {};
                assert.isTrue(u.nullOrUndefined(test.test));
            });

            it('should return true when a variable is null', function(){
                var test; 
                assert.isTrue(u.nullOrUndefined(test));
            });

            it('should return false when a variable is assigned', function(){
                var test = false;
                assert.isFalse(u.nullOrUndefined(test));
            })
        });

        describe('#enu', function(){
            it('should return true when a variable is not defined', function(){
                var test = {};
                assert.isTrue(u.enu(test.test));
            });

            it('should return true when a variable is null', function(){
                var test; 
                assert.isTrue(u.enu(test));
            });

            it('should return true when a variable is empty', function(){
                var test = {}; 
                assert.isTrue(u.enu(test));
            });

            it('should return false when the variable is not empty', function(){
                var test = ['here'];
                assert.isFalse(u.enu(test));
                test = {property: ''};
                assert.isFalse(u.enu(test));
            })
        });

        describe('#hasOwnPropertyChain', function(){
            var test = {};
            beforeEach(function(){
                test = {};
            });

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

        describe('getJSONFile', function(){
            it('should return null when given nothing', function(){
                assert.isNull(u.getJSONFile());
            });

            it('should return null when given an undefined or null', function(){
                var test = {};
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
                }).to.throw(u.fileErrorMessage + 'Hello World!');
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