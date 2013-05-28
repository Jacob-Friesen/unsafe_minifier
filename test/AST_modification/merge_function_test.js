var _ = require('lodash'),
    chai = require('chai'),
    sinon = require('sinon'),
    stub = sinon.stub,
    assert = chai.assert,
    expect = chai.expect;

var MergeFunction = require('../../AST_modification/merge_function.js');
var mergeFunction = MergeFunction;
module.exports = function(){
    describe('mergeFunction', function() {
        afterEach(function(){
            resetTestData();
        });
        
        describe('#isDuplicateInsert()', function() {
            beforeEach(function(){
                mergeFunction = new MergeFunction();

                stub(mergeFunction, "mergeFunctions");
                stub(mergeFunction, "mergeCalls");
            });

            afterEach(function(){
                mergeFunction.mergeFunctions.restore();
                mergeFunction.mergeCalls.restore();
            })

            it('should return false when no functions have been merged', function() {
                assert.isFalse(mergeFunction.isDuplicateInsert());
            });

            it('should return true when only one function set has been sent in', function() {
                mergeFunction.merge({simpleName: 'call 1'}, {simpleName: 'call 2'}, {}, {}, function(){});
                assert.isTrue(mergeFunction.isDuplicateInsert());
            });

            it('should return false when a second second function set sent in is different and merges.push has not been reached', function() {
                mergeFunction.merge({simpleName: 'call 1'}, {simpleName: 'call 2'}, {}, {}, function(){});

                stub(mergeFunction.merges, "push");

                mergeFunction.merge({simpleName: 'call 1'}, {simpleName: 'call 3'}, {}, {}, function(){});
                assert.isFalse(mergeFunction.isDuplicateInsert());

                mergeFunction.merges.push.restore();
            });

            it('should return true when a second second function set sent in is different and merges.push has been reached', function() {
                mergeFunction.merge({simpleName: 'call 1'}, {simpleName: 'call 2'}, {}, {}, function(){});
                mergeFunction.merge({simpleName: 'call 1'}, {simpleName: 'call 3'}, {}, {}, function(){});
                assert.isTrue(mergeFunction.isDuplicateInsert());
            });

            it('should return true when a second second function set sent matches a later set and merges.push has not been reached', function() {
                (function merge(callTo, callFrom){
                    mergeFunction.merge(callTo, callFrom, {}, {}, function(){});
                    return merge;
                })({simpleName: 'call 1'}, {simpleName: 'call 2'})
                  ({simpleName: 'call 1'}, {simpleName: 'call 3'}),
                  ({simpleName: 'call 1'}, {simpleName: 'call 4'}),
                  ({simpleName: 'call 5'}, {simpleName: 'call 6'});

                stub(mergeFunction.merges, "push");

                mergeFunction.merge({simpleName: 'call 1'}, {simpleName: 'call 3'}, {}, {}, function(){});
                assert.isTrue(mergeFunction.isDuplicateInsert());

                mergeFunction.merges.push.restore();
            });
        });

        describe('#removeFromParentArray()', function() {
            it('should do nothing when the parent is not an array', function() {
                (function remove(parentArray){
                    assert.isTrue(mergeFunction.removeFromParentArray(null, parentArray));
                    return remove;
                })()(null)({});
            });

            it('should remove nothing when item to remove is ENU or has no line number', function() {
                test.callExpression1.loc.start = null;
                var parentArray = _.cloneDeep(test.parentArray);

                (function remove(toRemove){
                    assert.isTrue(mergeFunction.removeFromParentArray(toRemove, test.parentArray));
                    assert.isTrue(_.isEqual(parentArray, test.parentArray));
                    return remove;
                })()(null)({})(test.callExpression1);
            });

            it('should remove nothing when the item to remove\'s line number doesn\'t appear in the parent array', function() {
                var parentArray = _.cloneDeep(test.parentArray);
                var emptyFunctionExpression = _.cloneDeep(test.emptyFunctionExpression);
                emptyFunctionExpression.loc.start.line += 1;

                [
                    test.callExpression1,
                    emptyFunctionExpression
                ].forEach(function(toRemove){
                    assert.isTrue(mergeFunction.removeFromParentArray(toRemove, test.parentArray));
                    assert.isTrue(_.isEqual(parentArray, test.parentArray));
                });
            });

            it('should remove the item when it\'s line number is the same as one of the parents and the parent has more than one item', function(){
                assert.isTrue(mergeFunction.removeFromParentArray(test.emptyFunctionExpression, test.parentArray));
                assert.isTrue(_.isEqual(test.parentArray, [test.callExpression2]));
            });

            it('should remove the item when it\'s line number is the same as one of the parents and leave an empty parent, when the parent has one item', function(){
                var singleParent = [test.callExpression2];
                assert.isTrue(mergeFunction.removeFromParentArray(test.callExpression2, singleParent));
                assert.isTrue(_.isEmpty(singleParent));
            });

        });
    });
}


var test = {};
var resetTestData = (function reset(){
    test = {};

    test.loc1 = { 
        start: { line: 145, column: 8 },
        end: { line: 147, column: 5 }  
    };

    test.loc2 = { 
        start: { line: 154, column: 24 },
        end: { line: 154, column: 34 }  
    };

    test.loc3 = { 
        start: { line: 12, column: 24 },
        end: { line: 13, column: 34 }  
    };

    test.emptyFunctionExpression = { 
        type: 'FunctionExpression',
        id: null,
        params: [ { type: 'Identifier', name: 'x', loc: [Object] } ],
        defaults: [],
        body: { 
            type: 'BlockStatement',
            body: [],
            loc: test.loc1
        },
        rest: null,
        generator: false,
        expression: false,
        loc: test.loc1
    };

    test.callExpression1 = { 
        type: 'CallExpression',
        callee: { 
            type: 'MemberExpression',
            computed: false,
            object: { 
                type: 'ThisExpression', 
                loc: test.loc2// Technically, a little off, but this level of detail doesn't matter
            },
            property: { 
                type: 'Identifier',
                name: 'f9',
                loc: test.loc2
            },
            loc: test.loc2
        },
        arguments: [
            { 
                type: 'Identifier',
                name: 'v',
                loc: test.loc2 
            } 
        ],
        loc: test.loc2
    }

    test.callExpression2 = { 
        type: 'CallExpression',
        callee: { 
            type: 'MemberExpression',
            computed: false,
            object: { 
                type: 'ThisExpression', 
                loc: test.loc3// Technically, a little off, but this level of detail doesn't matter
            },
            property: { 
                type: 'Identifier',
                name: 'f0',
                loc: test.loc3
            },
            loc: test.loc3
        },
        arguments: [],
        loc: test.loc3
     }

    test.parentArray = [
        test.emptyFunctionExpression,
        test.callExpression2
    ]
});