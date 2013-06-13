var _ = require('lodash'),
    chai = require('chai'),
    sinon = require('sinon'),
    stub = sinon.stub,
    assert = chai.assert,
    expect = chai.expect;

var MergeFunction = require('../../AST_modification/merge_function.js'),
    AST_structure = require('../../AST_modification/AST_structures.js'),
    test = require('../test_data.js'),
    mergeFunction = MergeFunction,
    u = require('../../utility_functions.js');
module.exports = function(callback){
    describe('mergeFunction', function() {
        beforeEach(function(){
            test = test.resetTestData();
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

            function testParentRemoval(parent){
                stub(mergeFunction, "isDuplicateInsert").returns(false);

                var originalLength = test.blockBodyParent2.body.length;
                assert.isTrue(mergeFunction.mergeFunctions(test.functionDeclaration, _.cloneDeep(test.functionDeclaration), parent));

                // The parent's array is smaller if the object was removed and does not contain the object
                assert.equal( test.blockBodyParent2.body.length, originalLength - ((u.enu(parent)) ? 0 : 1) );
                assert.equal(u.enu(parent), _.some(test.blockBodyParent2.body, function(item){
                    return _.isEqual(item, test.functionDeclaration);
                }));

                mergeFunction.isDuplicateInsert.restore();

                return testParentRemoval;
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

            it('should not remove from from its parent, when fromParent is enu', function(){
                testParentRemoval()(null)({});
            });

            it('should remove from from its parent when fromParent is specified', function(){
                testParentRemoval(test.blockBodyParent2);
            });
        });

        describe('#findObjectName()', function(){
            beforeEach(function(){
                test.level3 = {
                    object: {
                        object: test.undefined
                    }
                }
            });

            it('should return an empty string if the object sent in is enu', function(){
                assert.equal(mergeFunction.findObjectName(), '');
                assert.equal(mergeFunction.findObjectName(null), '');
                assert.equal(mergeFunction.findObjectName({}), '');
            });

            it('should return the object name one level deep', function(){
                assert.equal(mergeFunction.findObjectName({name: 'test'}), 'test');
            });

            it('should return an empty string if there is no name or object property at one level deep', function(){
                assert.equal(mergeFunction.findObjectName({unrelated: 'test'}), '');
            });

            it('should return an empty string if object is enu 3 levels deep', function(){
                (function test(){
                    assert.equal(mergeFunction.findObjectName(test.level3), '');
                    return test;
                })()(test.level3.object = test.undefined)(test.level3.object = {});
            });

            it('should return an empty string if there is no name or object property at one 3 levels deep', function(){
                test.level3.object = {unrelated: 'test'}; 
                assert.equal(mergeFunction.findObjectName(test.level3), '');
            });

            it('should return the name at 3 levels deep', function(){
                test.level3.object = {name: 'test'}; 
                assert.equal(mergeFunction.findObjectName(test.level3), 'test');
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

            it('should be able to get the name of a AssignmentExpression\'s that has a nested object', function(){
                assert.equal(mergeFunction.getVariableName(test.assignmentExpressionNestedObject), 
                    test.assignmentExpressionNestedObject.left.object.name);
            });

            it('should be able to get an ExpressionStatement\s name', function(){
                assert.equal(mergeFunction.getVariableName(test.expressionStatement), test.expressionStatement.expression.left.name);
            });

            it('should be able to get an VariableDeclaration\s name', function(){
                assert.equal(mergeFunction.getVariableName(test.variableDeclaration1), 'var ' + test.variableDeclaration1.declarations[0].id.name);
            });
        });

        describe('#splitCallAssignment()', function(){
            function testNoModify(index, to, from, toParent){
                var original = _.cloneDeep(to);
                mergeFunction.splitCallAssignment(index, to, from, toParent);
                assert.deepEqual(to, original);
            }

            // tests if the var _r = functionToMergeTo(...) is correct
            function testMainAssignmentCorrect(index){
                // first statement needs no var in front
                if (!test.assignmentParent[index].kind){

                    if (!test.assignmentParent[index].expression){
                        
                        if (test.assignmentParent[index].right.callee.object.name)
                            assert.equal(test.assignmentParent[index].right.callee.object.name, mergeFunction.SPLIT_VAR);
                        else
                            assert.equal(test.assignmentParent[index].left.name, mergeFunction.SPLIT_VAR);
                    }
                    else
                        assert.equal(test.assignmentParent[index].expression.left.name, mergeFunction.SPLIT_VAR);
                }
                // first statement needs var in front
                else{
                    assert.equal(test.assignmentParent[index].declarations[0].id.name, mergeFunction.SPLIT_VAR);
                    assert.equal(test.assignmentParent[index].kind, 'var')
                }
            }

            // Checks if the declaration has a var in front if it should and if the right variable is being assigned with the right index
            function testVarCorrect(declaration, assignedTo, index){
                assert.equal(declaration.kind, assignedTo.kind);

                // If this is an assignment to an existing var
                if (!declaration.kind){
                    assert.equal(declaration.expression.right.object.name, mergeFunction.SPLIT_VAR);
                    assert.equal(declaration.expression.right.property.value, index);

                    // The declarationName is needed for when assigned to is an assigment expression (does not happen to from)
                    var declarationName = (declaration.expression) ? declaration.expression.left.name : declaration.left.name;
                    assert.equal(declaration.expression.left.name, declarationName);
                } 
                else{
                    assert.equal(declaration.declarations[0].init.object.name, mergeFunction.SPLIT_VAR);
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

            describe('splitting variables for the first time', function(){
                // Tests first time sptest.assignmentExpressionlit by to being at the start then end of it's parent array, uses assignmentParent
                function testStartEndFirstTime(to, from){
                    var originalTo = _.cloneDeep(to);
                        originalFrom = _.cloneDeep(from)

                    // test having the item at the beginning and the end of the parent
                    testFirstTimeSplit(to, from, 0);
                    test.assignmentParent.push(originalTo)
                    testFirstTimeSplit(originalTo, originalFrom, test.assignmentParent.length - 1);
                }

                // Checks if the correct variables were assigned in a first time split
                function testFirstTimeSplit(to, from, index){
                    var originalAssignment1 = _.cloneDeep(to),
                        originalAssignment2 = _.cloneDeep(from);

                    mergeFunction.splitCallAssignment(index, to, from, test.assignmentParent);
                    
                    // Main assignment then split tests
                    testMainAssignmentCorrect(index);
                    testVarCorrect(test.assignmentParent[index + 1].body[0], originalAssignment2, 0);
                    testVarCorrect(test.assignmentParent[index + 2].body[0], originalAssignment1, 1);
                }

                it('should replace the assignment expression with a var in to\'s parent with _r = and 2 splits with vars', function(){
                    test.assignmentParent.unshift(test.variableDeclaration1);
                    testStartEndFirstTime(test.variableDeclaration1, test.variableDeclaration2);
                });

                it('should replace the assignment expression with a var in to\'s parent with a _r = and 2 splits with one a from var', function(){ 
                    test.assignmentParent.unshift(test.variableDeclaration1);
                    testStartEndFirstTime(test.variableDeclaration1, test.expressionStatement);
                });

                it('should replace the assignment expression with a var in to\'s parent with a _r = and 2 splits with a to var', function(){
                    test.assignmentParent.unshift(test.expressionStatement);
                    testStartEndFirstTime(test.expressionStatement, test.variableDeclaration2);
                });

                it('should replace the assignment expression with a var in to\'s parent with a _r = and 2 splits with no vars', function(){
                    var expressionCopy = _.cloneDeep(test.expressionStatement);
                    test.assignmentParent.unshift(test.expressionStatement);
                    testStartEndFirstTime(test.expressionStatement, expressionCopy);
                });
            });

            describe('splitting variables to an already split call', function(){
                function insertSplitAt(start, to, from){
                    var method = (start) ? 'unshift' : 'push';
                    test.assignmentParent[method](to);

                    var position = (start) ? 0 : test.assignmentParent.length - 1;
                    mergeFunction.splitCallAssignment(position, to, from, test.assignmentParent);
                }

                // Checks if the correct variables were assigned in a first time split
                function testMultiSplit(to, from, start){
                    insertSplitAt(start, to, from);

                    var index = (start) ? 0 : test.assignmentParent.length - 3,
                        originalKind = test.assignmentParent[index].kind,
                        originalFromAssignment = _.cloneDeep(from),
                        originalPrevious1 = _.cloneDeep(test.assignmentParent[index + 1]),
                        originalPrevious2 = _.cloneDeep(test.assignmentParent[index + 2]);

                    mergeFunction.splitCallAssignment(index, to, from, test.assignmentParent);
                    index = (start) ? 0 : test.assignmentParent.length - 4;

                    // Main assignment then from split then previous splits (now incremented)
                    testMainAssignmentCorrect(index);
                    testVarCorrect(test.assignmentParent[index + 1].body[0], originalFromAssignment, 0);
                    testVarCorrect(test.assignmentParent[index + 2].body[0], originalPrevious1.body[0], 1);
                    testVarCorrect(test.assignmentParent[index + 3].body[0], originalPrevious2.body[0], 2);
                }

                function testMultiSplitStartEnd(to, from){
                    testMultiSplit(test[to], test[from], false);
                    test = test.resetTestData();
                    testMultiSplit(test[to], test[from], true);
                }

                it('should insert the new from split at the beggining and increment previously inserted values with 2 with from-to vars', function(){
                    testMultiSplitStartEnd('variableDeclaration1', 'variableDeclaration2');
                });

                it('should do the same as last (with changed var checks), but now from is not a variable declaration', function(){
                    testMultiSplitStartEnd('variableDeclaration1', 'expressionStatement');
                });

                it('should do the same as last (with changed var checks), but now to is not a variable declaration instead of from', function(){
                    testMultiSplitStartEnd('expressionStatement', 'variableDeclaration2');
                });

                it('should do the same as last (with changed var checks), but now both are not declarations', function(){
                    testMultiSplitStartEnd('expressionStatement', 'expressionStatement');
                });
            });


        });

        describe('#copyFromAssignment', function(){
            beforeEach(function(){
                test.notFromToAssignment = {
                    to: test.callExpression2,
                    toParent: test.blockBodyParent,
                    toAssignmentParent: test.assignmentParent,
                    bothHaveReturns: true
                }

                test.all = _.cloneDeep(test.notFromToAssignment);
                test.all.toAssignment = test.assignmentExpression;
                test.all.fromAssignment = _.cloneDeep(test.assignmentExpression);
            });

            it('should do nothing when toAssignment is enu and fromAssignment is enu', function(){
                (function copy(to, from){
                    var original = _.cloneDeep(to);
                    test.notFromToAssignment.toAssignment = to;
                    test.notFromToAssignment.fromAssignment = from;
                    to = mergeFunction.copyFromAssignment(test.notFromToAssignment);

                    assert.deepEqual(original, to);

                    return copy;
                })()(test.undefined, null)(test.undefined, {})
                (null)(null, null)(null, {})
                ({})({}, null)({}, {});
            });

            it('should do nothing when bothHaveReturns is false and fromAssignment is enu', function(){
                test.notFromToAssignment.toAssignment = test.assignmentExpression;
                test.notFromToAssignment.bothHaveReturns = false;

                (function copy(from){
                    var original = _.cloneDeep(test.assignmentExpression);
                    test.notFromToAssignment.fromAssignment = from;
                    var to = mergeFunction.copyFromAssignment(test.notFromToAssignment);

                    assert.deepEqual(original, to);

                    return copy;
                })()(null)({});
            });

            // only going to test when both to and from assignments have arguments as splitting has been tested a lot more in detail in the
            // splitCallAssignment tests
            it('should split the to assignment combining return values when from and to assignment have return arguments', function(){
                var toAssignmentOrig = _.cloneDeep(test.all.toAssignment);

                test.all.fromAssignment.left.name = 'b';
                var fromAssignmentOrig = _.cloneDeep(test.all.fromAssignment);

                var to = mergeFunction.copyFromAssignment(test.all);

                // return should be split into a split_var = call; from
                assert.equal(to.left.name, mergeFunction.SPLIT_VAR);

                // from was mapped correctly
                var expression = test.all.toAssignmentParent[1].body[0].expression;
                assert.equal(expression.right.object.name, mergeFunction.SPLIT_VAR);
                assert.equal(expression.right.property.value, 0);
                assert.equal(expression.left.name, fromAssignmentOrig.left.name);

                // to was mapped correctly
                var expression = test.all.toAssignmentParent[2].body[0].expression;
                assert.equal(expression.right.object.name, mergeFunction.SPLIT_VAR);
                assert.equal(expression.right.property.value, 1);
                assert.equal(expression.left.name, toAssignmentOrig.left.name);
            });

            it('should do nothing if equivalent to last but to\'s assignment parent is enu', function(){
                var original = _.cloneDeep(test.assignmentExpression);

                (function copy(parent){
                    test.all.toAssignmentParent = parent;
                    var to = mergeFunction.copyFromAssignment(test.all);
                    assert.deepEqual(test.assignmentExpression, original);

                    return copy
                })()(null)({});
            });

            it('should do nothing if fromAssignment is not enu and to or toParent are enu', function(){
                var original = _.cloneDeep(test.all.toAssignment);
                test.all.bothHaveReturns = false;

                (function copy(to, toParent){
                    test.all.to = to;
                    test.all.toParent = toParent;
                    var to = mergeFunction.copyFromAssignment(test.all);

                    assert.deepEqual(to, original);

                    return copy
                })()(test.undefined, null)(test.undefined, {})
                (null)(null, null)(null, {})
                ({})({}, null)({}, {});
            });

            it('should make toAssignment be fromAssignment with .right as to and its start number incremented if from is an AssignmentExpression', 
            function(){
                var fromAssignmentOrig = _.cloneDeep(test.all.fromAssignment);

                test.all.bothHaveReturns = false;
                var to = mergeFunction.copyFromAssignment(test.all);

                assert.equal(to.loc.start.line, fromAssignmentOrig.loc.start.line + 1);

                // The immediate parent of to must be the same as the previously set fromAssignment which is now toAssignment. There is a circular
                // argument for the below variables, so go to that point instead of the parent to avoid infinite evaluation
                assert.deepEqual(_.find(test.all.toParent.body, function(obj){
                    return u.sameLine(obj, test.callExpression2);
                }).expression.right.expression.right, to.right.expression.right);

                assert.deepEqual(to.right.expression.right, test.all.to);
            });

            it('should make toAssignment be fromAssignment with the initialization as to and its start number incremented if from is not an ' +
               'AssignmentExpression', function(){
                test.all.fromAssignment = test.variableDeclaration1;
                var fromAssignmentOrig = _.cloneDeep(test.all.fromAssignment);

                test.all.bothHaveReturns = false;
                var to = mergeFunction.copyFromAssignment(test.all);

                assert.equal(to.loc.start.line, fromAssignmentOrig.loc.start.line + 1);                
                assert.deepEqual(to.declarations[0].init, test.callExpression2);
            });
        });

        describe('#mergeCalls()', function(){
            function testArgs(to, from, shouldBe){
                test.all.to = to;
                test.all.from = from;
                test.all.fromAssignment = null;

                mergeFunction.mergeCalls(test.all);
                assert.deepEqual(to.arguments, shouldBe);
            }

            beforeEach(function(){
                test.notTo = {
                    toAssignment: test.assignmentExpression,
                    toAssignmentParent: test.assignmentParent,
                    from: test.callExpression2,
                    fromParent: test.blockBodyParent,
                    fromAssignment: test.assignmentExpression,
                    bothHaveReturns: false
                }

                test.notFrom = {
                    to: test.callExpression2,
                    toParent: test.blockBodyParent,
                    toAssignment: test.assignmentExpression,
                    toAssignmentParent: test.assignmentParent,
                    fromParent: _.cloneDeep(test.blockBodyParent),
                    fromAssignment: _.cloneDeep(test.assignmentExpression),
                    bothHaveReturns: false
                }

                test.all = _.cloneDeep(test.notFrom);
                test.all.from = _.cloneDeep(test.callExpression2);
                test.all.bothHaveReturns = true;
            });

            // These will not cover every null case but represent a large enough sample to cover everything
            it('should do nothing if to or to\'s parent are enu', function(){
                (function merge(to, toParent){
                    test.notTo.to = to;
                    test.notTo.toParent = toParent;
                    mergeFunction.mergeCalls(test.notTo);

                    return merge;
                })()(null)(null, {})(null, null)({})({}, null)({}, {});
            });

            // fromParent checking tests are done later with the deletion from fromParent tests
            it('should do nothing if from is enu', function(){
                (function merge(from){
                    test.notFrom.from = from;
                    mergeFunction.mergeCalls(test.notFrom);
                    return merge;
                })()(null)({});
            });

            it('should throw an error if either from or to have either no arguments object or an undefined one', function(){
                (function mergeArgTest(testObject){
                    expect(function(){
                        mergeFunction.mergeCalls(test.all);
                    }).to.throw(mergeFunction.argsCouldntCopy(test.all.to, test.all.from));

                    return mergeArgTest;
                })(test.all.to = {red: 'test'})
                (test.all.to = {arguments: null})
                (test.all.from = {red: 'test'})
                (test.all.from = {arguments: null});
            });

            it('should append no arguments to to when both calls have no arguments', function(){
                testArgs(test.callExpression2, test.callExpression2, []);
            });

            it('should append no arguments to to when only to has arguments', function(){
                testArgs(test.callExpression1, test.callExpression2, test.callExpression1.arguments);
            });

            it('should append from\'s arguments to to when only from has arguments', function(){
                testArgs(test.callExpression2, test.callExpression1, test.callExpression1.arguments);
            });

            it('should prepend from\'s arguments to to\'s when both have arguments', function(){
                var modified = _.cloneDeep(test.callExpression1);
                modified.arguments[0].name += 'modified';

                testArgs(modified, test.callExpression1, [test.callExpression1.arguments[0], modified.arguments[0]]);
            });

            it('should not return a modified toAssignment if fromAssignment is enu', function(){
                (function merge(from){
                    mergeFunction.mergeCalls(test.callExpression2, test.blockBodyParent, test.assignmentExpression, test.assignmentParent,
                        _.cloneDeep(test.callExpression2), _.cloneDeep(test.blockBodyParent), from, true);
                    return merge;
                })()(null)({});
            });

            it('should return a modified toAssignment by using from assignment by combining arguments if fromAssignment is not enu', function(){
                var originalParentLength = test.assignmentParent.length;
                var to = mergeFunction.mergeCalls(test.all);

                // Check that SPLIT_VAR is assigned to via the main call
                assert.equal(to.left.name, mergeFunction.SPLIT_VAR);

                // check that to Assignment's parent has the split variables
                assert.equal(test.all.toAssignmentParent.length, originalParentLength + 2);
                assert.equal(test.all.toAssignmentParent[1].body[0].expression.right.object.name, mergeFunction.SPLIT_VAR);
                assert.equal(test.all.toAssignmentParent[1].body[0].expression.right.property.value, 0);
                assert.equal(test.all.toAssignmentParent[2].body[0].expression.right.object.name, mergeFunction.SPLIT_VAR);
                assert.equal(test.all.toAssignmentParent[2].body[0].expression.right.property.value, 1);
            });

            it('should remove from from it\'s parent', function(){
                var from = _.cloneDeep(test.callExpression2),
                    fromParent = _.cloneDeep(test.blockBodyParent);

                test.all.from = from;
                test.all.fromParent = fromParent;
                mergeFunction.mergeCalls(test.all);

                assert.isUndefined(_.find(fromParent.body, function(item){
                    return _.isEqual(item, from);
                }));
            });
        });
    });
}