var _ = require('lodash'),
    chai = require('chai'),
    sinon = require('sinon'),
    stub = sinon.stub,
    assert = chai.assert,
    expect = chai.expect;

var MergeFunction = require('../../AST_modification/merge_function.js'),
    AST_structure = require('../../AST_modification/AST_structures.js'),
    mergeFunction = MergeFunction,
    u = require('../../utility_functions.js');
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
                    assert.deepEqual(parentArray, test.parentArray);
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
                    assert.deepEqual(parentArray, test.parentArray);
                });
            });

            it('should remove the item when it\'s line number is the same as one of the parents and the parent has more than one item', function(){
                assert.isTrue(mergeFunction.removeFromParentArray(test.emptyFunctionExpression, test.parentArray));
                assert.deepEqual(test.parentArray, [test.callExpression2]);
            });

            it('should remove the item when it\'s line number is the same as one of the parents and when the parent has one item', function(){
                var singleParent = [test.callExpression2];
                assert.isTrue(mergeFunction.removeFromParentArray(test.callExpression2, singleParent));
                assert.deepEqual(singleParent, []);
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
                assert.deepEqual(array, _array);
            }

            function arrayRemoveTest(array){
                assert.isTrue(mergeFunction.removeFromParent(test.callExpression2, array));

                array[0] = array[0] || array.body[0];
                assert.deepEqual(array[0], test.emptyFunctionExpression);
            }

            function arrayEmptyRemoveTest(array){
                assert.isTrue(mergeFunction.removeFromParent(test.callExpression2, array));
                assert.isTrue(mergeFunction.removeFromParent(test.emptyFunctionExpression, array));

                array[0] = array[0] || array.body[0];
                assert.deepEqual(array[0], AST_structure.emptyBlockStatement);
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
                assert.deepEqual(test.expressionParent, expressionParent);
            });

            it('should make the parents right part null if the item exists in the parent and the parent is an expression', function() {
                assert.isTrue(mergeFunction.removeFromParent(test.emptyFunctionExpression, test.expressionParent));
                assert.deepEqual(test.expressionParent.expression.right, AST_structure.nullLiteral);
            });
        });

        describe('#mergeFunctions()', function() {
            function testBodyMerges(hasReturn){
                stub(mergeFunction, "isDuplicateInsert").returns(false);
                
                var original = _.cloneDeep(test.functionDeclaration);
                    original.body.body.pop();
                if (!hasReturn) test.functionDeclaration.body.body.pop();
                var block = _.cloneDeep(AST_structure.emptyBlockStatement);

                assert.isFalse(mergeFunction.mergeFunctions(test.functionDeclaration, original));

                // make sure from's body was inserted into to's at the beggining while keeping the rest of to the same                
                var testBody = test.functionDeclaration.body.body;
                block.body = original.body.body;

                assert.deepEqual(testBody[0], block);
                for (var i = 1; i < testBody.length; i+=1){
                    // Don't expect last part to be equal if to has a return and from doesn't
                    if (!hasReturn || i < testBody.length - 1)
                        assert.deepEqual(testBody[i], original.body.body[i - 1]);
                }

                mergeFunction.isDuplicateInsert.restore();
            }

            it('should do nothing and return false when both variables sent in are enu', function(){
                (function merge(to, from){
                    assert.isFalse(mergeFunction.mergeFunctions(to, from));
                    return merge;
                })()(null)(null, {})(null, null)({})({}, null)({}, {});
            });

            it('should do nothing and return false when one variable sent in is enu', function(){
                var to = _.cloneDeep(test.emptyFunctionExpression);
                var from = _.cloneDeep(test.functionDeclaration);

                (function merge(to, from){
                    assert.isFalse(mergeFunction.mergeFunctions(to, from));

                    if (!u.enu(to))
                        assert.deepEqual(to, test.emptyFunctionExpression);
                    else
                        assert.deepEqual(from, test.functionDeclaration);

                    return merge;
                })(to)(to, null)(to, {})// to is not enu
                  (test.undefined, from)(null, from)({}, from);// from is not enu
            });

            it('should throw an error when either to or from functions possess no param property (unlikely)', function(){
                var params = test.functionDeclaration.params;
                
                (function merge(){
                    expect(function(){
                        mergeFunction.mergeFunctions(test.functionDeclaration, test.emptyFunctionExpression);
                    }).to.throw( mergeFunction.paramCouldntCopy(test.functionDeclaration, test.emptyFunctionExpression) );

                    return merge;
                })

                // Test ones not having, the other, then both
                (test.functionDeclaration.params = null)

                (test.functionDeclaration.params = params,
                test.emptyFunctionExpression.params = null)

                (test.functionDeclaration.params = null);
            });

            it('should append no arguments to to when both functions have no arguments', function(){
                mergeFunction.mergeFunctions(test.emptyFunctionExpression, _.cloneDeep(test.emptyFunctionExpression));
                assert.deepEqual(test.emptyFunctionExpression.params, []);
            });

            it('should append no arguments to to when from has no arguments', function(){
                var to = _.cloneDeep(test.functionDeclaration);
                mergeFunction.mergeFunctions(to, test.emptyFunctionExpression);
                assert.deepEqual(to.params, test.functionDeclaration.params);
            });

            it('should append froms arguments to to when to has no arguments', function(){
                mergeFunction.mergeFunctions(test.emptyFunctionExpression, test.functionDeclaration);
                assert.deepEqual(test.emptyFunctionExpression.params, test.functionDeclaration.params);
            });

            it('should append from\'s arguments to to\'s when both have arguments', function(){
                var to = _.cloneDeep(test.functionDeclaration);
                mergeFunction.mergeFunctions(to, test.functionDeclaration);

                for (var i = 0, j = 0; i < test.functionDeclaration.params; i+=1, j+=1)
                    assert.deepEqual(to.params[i], test.functionDeclaration.params[j]);
                for (j = 0; i < test.functionDeclaration.params; i+=1, j+=1)// no i reset is intentional
                    assert.deepEqual(to.params[i], test.functionDeclaration.params[j]);
            });

            it('should throw an error when either to or from functions possess no body (unlikely)', function(){
                var body = test.emptyFunctionExpression.body.body;
                
                (function merge(){
                    expect(function(){
                        mergeFunction.mergeFunctions(test.emptyFunctionExpression, test.functionDeclaration);
                    }).to.throw( mergeFunction.bodyCouldntCopy(test.emptyFunctionExpression, test.functionDeclaration) );

                    return merge;
                })

                // Test ones not having, the other, then both
                (test.emptyFunctionExpression.body.body = null)

                (test.emptyFunctionExpression.body.body = body,
                test.functionDeclaration.body.body = null)

                (test.emptyFunctionExpression.body.body = null);
            });

            it('should do nothing to to\'s body when it is a duplicate then return false', function(){
                stub(mergeFunction, "isDuplicateInsert").returns(true);

                var original = _.cloneDeep(test.functionDeclaration);
                assert.isFalse(mergeFunction.mergeFunctions(test.functionDeclaration, original));
                assert.deepEqual(test.functionDeclaration.body.body, original.body.body);// a deep check here is more explanatory

                mergeFunction.isDuplicateInsert.restore();
            });


            it('should append from\'s body to to\s when both lack returns and there is no duplicate then return false', function(){
                testBodyMerges(false);
            });

            it('should do the same as the last but now only to has a return which shouldn\'t be modified', function(){
                testBodyMerges(true);
            });

            it('should append from\'s returns into to\s and return true when both have returns and this is not a duplicate', function(){
                stub(mergeFunction, "isDuplicateInsert").returns(false);

                var original = _.cloneDeep(test.functionDeclaration);
                assert.isTrue(mergeFunction.mergeFunctions(test.functionDeclaration, original));

                // Test that arguments were modified, in detail tests happen in the return_handler unit tests
                var toArg = _.last(test.functionDeclaration.body.body).argument;
                assert.equal(toArg.elements.length, 2);// combining two binary expressions
                assert.equal(toArg.type, AST_structure.argumentTemplate.type);

                mergeFunction.isDuplicateInsert.restore();
            });

            it('should remove from from its parent', function(){
                stub(mergeFunction, "isDuplicateInsert").returns(false);

                var original = _.cloneDeep(test.functionDeclaration);
                assert.isTrue(mergeFunction.mergeFunctions(test.functionDeclaration, original));

                test.blockBodyParent2.body.forEach(function(item){
                    assert.notDeepEqual(item, original);
                });

                mergeFunction.isDuplicateInsert.restore();
            });
        });

        describe('#getVariableName()', function(){
            it('should return an empty string if the object sent in is enu', function(){
                assert.equal(mergeFunction.getVariableName(), '');
                assert.equal(mergeFunction.getVariableName(null), '');
                assert.equal(mergeFunction.getVariableName({}), '');
            });

            it('should be able to get an AssignmentExpression\'s name', function(){
                assert.equal(mergeFunction.getVariableName(test.assignmentExpression), test.assignmentExpression.left.name);
            });

            it('should be able to get an ExpressionStatement\s name', function(){
                assert.equal(mergeFunction.getVariableName(test.expressionStatement), test.expressionStatement.expression.left.name);
            });

            it('should be able to get an VariableDeclaration\s name', function(){
                assert.equal(mergeFunction.getVariableName(test.variableDeclaration1), 'var ' + test.variableDeclaration1.declarations[0].id.name);
            });
        });

        describe('#addSplittingVariables()', function(){
            function testNoModify(index, to, from, toParent){
                var original = _.cloneDeep(to);
                mergeFunction.addSplittingVariables(index, to, from, toParent);
                assert.deepEqual(to, original);
            }

            // Tests first time split by to being at the start and end of it's parent array, uses assignmentParent
            function testStartEndFirstTime(to, from){
                var originalTo = _.cloneDeep(to);
                    originalFrom = _.cloneDeep(from)

                // test having the item at the beginning and the end of the parent
                testFirstTimeSplit(to, from, 0);
                test.assignmentParent.push(originalTo)
                testFirstTimeSplit(originalTo, originalFrom, test.assignmentParent.length - 1);
            }

            function testFirstTimeSplit(to, from, index){
                var originalAssignment1 = _.cloneDeep(to),
                    originalAssignment2 = _.cloneDeep(from);

                mergeFunction.addSplittingVariables(index, to, from, test.assignmentParent);
                
                // first statement needs no var in front
                if (!test.assignmentParent[index].kind){

                    if (!test.assignmentParent[index].expression){
                        
                        if (test.assignmentParent[index].right.callee.object.name)
                            assert.equal(test.assignmentParent[index].right.callee.object.name, mergeFunction.splitVar);
                        else
                            assert.equal(test.assignmentParent[index].left.name, mergeFunction.splitVar);
                    }
                    else
                        assert.equal(test.assignmentParent[index].expression.left.name, mergeFunction.splitVar);
                }
                // first statement needs var in front
                else{
                    assert.equal(test.assignmentParent[index].declarations[0].id.name, mergeFunction.splitVar);
                    assert.equal(test.assignmentParent[index].kind, 'var')
                }

                // Next 2 assignments will be in the form var before = _r[index] 
                testVarCorrect(test.assignmentParent[index + 1].body[0], originalAssignment2, 0);
                testVarCorrect(test.assignmentParent[index + 2].body[0], originalAssignment1, 1);
            }

            // Checks if the decleration has a var in front if it should and if the right variable is being assigned with the right index
            function testVarCorrect(declaration, assignedTo, index){
                assert.equal(declaration.kind, assignedTo.kind);

                // If this is an assignment to an existing var
                if (!declaration.kind){
                    assert.equal(declaration.expression.right.object.name, mergeFunction.splitVar);
                    assert.equal(declaration.expression.right.property.value, index);

                    // The declarationName is needed for when assigned to is an assigment expression (does not happen to from)
                    var declarationName = (declaration.expression) ? declaration.expression.left.name : declaration.left.name;
                    assert.equal(declaration.expression.left.name, declarationName);
                } 
                else{
                    assert.equal(declaration.declarations[0].init.object.name, mergeFunction.splitVar);
                    assert.equal(declaration.declarations[0].init.property.value, index);
                    assert.equal(declaration.declarations[0].id.name, assignedTo.declarations[0].id.name);
                }
            }

            it('should do nothing if from or to are enu', function(){
                (function split(to, from){
                    testNoModify(1, to, from, test.assignmentParent);
                    return split;
                })()(null)(null, {})(null, null)({})({}, null)({}, {});
            });

            it('should do nothing if index is null/undefined or to\'s parent are enu', function(){
                (function split(index, toParent){
                    testNoModify(index, test.variableDeclaration1, test.variableDeclaration2, toParent);
                    return split;
                })()(null)(null, {})(null, null);
            });

            it('should replace the assignment expression with a var in to\'s parent with _r = last() and 2 splits with vars', function(){
                testStartEndFirstTime(test.assignmentParent[0], test.assignmentParent[1]);
            });

            it('should replace the assignment expression with a var in to\'s parent with a _r = last() and 2 splits with one var (from)', function(){ 
                test.assignmentParent.unshift(test.variableDeclaration1);
                testStartEndFirstTime(test.variableDeclaration1, test.expressionStatement);
            });

            it('should replace the assignment expression with a var in to\'s parent with a _r = last() and 2 splits with one var (to)', function(){
                test.assignmentParent.unshift(test.expressionStatement);
                testStartEndFirstTime(test.expressionStatement, test.variableDeclaration1);
            });

            it('should replace the assignment expression with a var in to\'s parent with a _r = last() and 2 splits with no vars', function(){
                var expressionCopy = _.cloneDeep(test.expressionStatement);
                test.assignmentParent.unshift(test.expressionStatement);
                testStartEndFirstTime(test.expressionStatement, expressionCopy);
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
        params: [],
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

    test.assignmentExpression = { 
        type: 'AssignmentExpression',
        operator: '=',
        left: 
        { 
            type: 'Identifier',
            name: 'c',
            loc: test.loc1
        },
        right: test.callExpression1,
        loc: test.loc1
    }

    test.functionDeclaration = {
        type: "FunctionDeclaration",
        id: {
            "type": "Identifier",
            "name": "test"
        },
        params: [
            {
                "type": "Identifier",
                "name": "a"
            },
            {
                "type": "Identifier",
                "name": "b"
            }
        ],
        defaults: [],
        body: {
            type: "BlockStatement",
            body:  [
                {
                    type: "ExpressionStatement",
                    expression: test.assignmentExpression
                },
                {
                    type: "ReturnStatement",
                    argument: {
                        type: "BinaryExpression",
                        operator: "*",
                        left: {
                            type: "Identifier",
                            name: "a"
                        },
                        right: {
                            type: "Identifier",
                            name: "b"
                        }
                    }
                }
            ]
        },
        rest: null,
        generator: false,
        expression: false,
        loc: test.loc1
    };

    test.parentArray = [
        test.emptyFunctionExpression,
        test.callExpression2,
    ]

    test.parentArray2 = [test.functionDeclaration, test.emptyFunctionExpression];

    // Used to build removeFromParent tests, mergeFunctions tests
    test.blockBodyParent = {
        type: 'BlockStatement',
        body: test.parentArray,
        loc: test.loc3
    }

    test.blockBodyParent2 = {
        type: 'BlockStatement',
        body: test.parentArray2,
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

    // Used to build addSplittingVariables tests
    test.expressionStatement = {
        type: "ExpressionStatement",
        expression: {
            type: "AssignmentExpression",
            operator: "=",
            left: {
                type: "Identifier",
                name: "a"
            },
            right: {
                type: "CallExpression",
                callee: {
                    type: "Identifier",
                    name: "red"
                },
                arguments: [
                    {
                        type: "Identifier",
                        name: "v"
                    }
                ]
            }
        }
    }

    test.variableDeclaration1 = { 
        type: 'VariableDeclaration',
        declarations: [
            { 
                type: 'VariableDeclarator',
                id: { 
                    type: 'Identifier',
                    name: 'a',
                    loc: test.loc1
                },
                init: test.callExpression1,
                loc: test.loc1
            }
        ],
        kind: 'var',
        loc: test.loc1,
    }

    test.variableDeclaration2 = { 
        type: 'VariableDeclaration',
        declarations: [
            { 
                type: 'VariableDeclarator',
                id: 
                { 
                    type: 'Identifier',
                    name: 'b',
                    loc: test.loc2
                },
                init: test.callExpression2,
                loc: test.loc2
            }
        ],
        kind: 'var',
        loc: test.loc1
    }

    test.assignmentParent = [ 
        test.assignmentExpression,
        test.variableDeclaration1,
        test.expressionStatement
    ]
    
    return reset;
})();