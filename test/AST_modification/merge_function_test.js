var _ = require('lodash'),
    chai = require('chai'),
    sinon = require('sinon'),
    stub = sinon.stub,
    assert = chai.assert,
    expect = chai.expect;

var MergeFunction = require('../../AST_modification/merge_function.js'),
    AST_structure = require('../../AST_modification/AST_structures.js'),
    mergeFunction = MergeFunction;
module.exports = function(callback){
    describe('mergeFunction', function() {
        afterEach(function(){
            resetTestData();
        });

        after(function(){
            callback();
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

            it('should remove the item when it\'s line number is the same as one of the parents and when the parent has one item', function(){
                var singleParent = [test.callExpression2];
                assert.isTrue(mergeFunction.removeFromParentArray(test.callExpression2, singleParent));
                assert.isTrue(_.isEmpty(singleParent));
            });

        });

        describe('#removeFromParent()', function() {
            it('should do nothing when ENUs are sent in', function() {
                (function remove(item, parent){
                    assert.isTrue(mergeFunction.removeFromParent(item, parent));
                    return remove;
                })()({})({}, null)({}, {})({}, [])(null)(null, null)(null, {})(null, []);
            });

            function arrayNothingTest(array){
                var _array = _.cloneDeep(array);

                assert.isTrue(mergeFunction.removeFromParent(test.callExpression1, array));
                assert.isTrue(_.isEqual(array, _array));
            }

            function arrayRemoveTest(array){
                assert.isTrue(mergeFunction.removeFromParent(test.callExpression2, array));

                array[0] = array[0] || array.body[0];
                assert.isTrue(_.isEqual(array[0], test.emptyFunctionExpression));
            }

            function arrayEmptyRemoveTest(array){
                assert.isTrue(mergeFunction.removeFromParent(test.callExpression2, array));
                assert.isTrue(mergeFunction.removeFromParent(test.emptyFunctionExpression, array));

                array[0] = array[0] || array.body[0];
                assert.isTrue(_.isEqual(array[0], AST_structure.emptyBlockStatement));
            }

            // A little repetitive, but metaprogramming to make these 6 more DRY would be overkill
            describe('parent is an array', function(){
                it('should remove nothing when the specified item is not in the parent', function() {
                    arrayNothingTest(test.fullItem1.parent);
                });

                it('should remove the specified item when the parent has length > 1', function() {
                    arrayRemoveTest(test.fullItem1.parent);
                });

                it('should remove the specified item when the parent has length < 1 and insert and empty element', function() {
                    arrayEmptyRemoveTest(test.fullItem1.parent)
                });
            });

            describe('parent is an object containing a body property that is an array', function(){
                it('should remove nothing when the specified item is not in the parent', function() {
                    arrayNothingTest(test.fullItem2.parent);
                });

                it('should remove the specified item when the parent has length > 1', function() {
                    arrayRemoveTest(test.fullItem2.parent);
                });

                it('should remove the specified item when the parent has length < 1 and insert and empty element', function() {
                    arrayEmptyRemoveTest(test.fullItem1.parent)
                });
            });

            it('should do nothing if the item does not exist in the parent and the parent is an expression', function() {
                var expressionParent = _.cloneDeep(test.expressionParent);

                assert.isTrue(mergeFunction.removeFromParent(test.callExpression2, test.expressionParent));
                assert.isTrue(_.isEqual(test.expressionParent, expressionParent));
            });

            it('should make the parents right part null if the item exists in the parent and the parent is an expression', function() {
                assert.isTrue(mergeFunction.removeFromParent(test.emptyFunctionExpression, test.expressionParent));
                assert.isTrue(_.isEqual(test.expressionParent.expression.right, AST_structure.nullLiteral));
            });
        });
    });
}


var test = {};
var resetTestData = (function reset(){
    test = {};

    // Used for removeFromParentArray tests and to build removeFromParent tests
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

    // Used to build removeFromParent tests
    test.blockBodyParent = {
        type: 'BlockStatement',
        body: test.parentArray,
        loc: test.loc3
    }

    test.fullItem1 = {
        data: test.callExpression2,
        parent: test.parentArray
        // there is more properties but they are irrelevant
    }

    test.fullItem2 = {
        data: test.emptyFunctionExpression,
        parent: test.blockBodyParent
        // there is more properties but they are irrelevant
    }

    test.expressionParent = { 
        type: 'ExpressionStatement',
        expression: { 
            type: 'AssignmentExpression',
            operator: '=',
            left: { 
                type: 'MemberExpression',
                computed: false,
                object: {
                    type: 'Identifier',
                    name: 'a',
                    loc: test.loc3
                },
                property: { 
                    type: 'Identifier',
                    name: 'name',
                    loc: test.loc3 
                },
                loc: test.loc3
            },
            right: test.emptyFunctionExpression,
            loc: test.loc3
        },
        loc: test.loc3 
    }
    
    return reset;
})();