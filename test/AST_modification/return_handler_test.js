var _ = require('lodash'),
    chai = require('chai'),
    assert = chai.assert,
    expect = chai.expect;

// ENU = empty/undefined/null
var returnHandler = new require('../../AST_modification/return_handler.js')(),
    AST_structure = require('../../AST_modification/AST_structures.js'),
    test = require('../test_data.js');

module.exports = function(callback){

    describe('returnHandler', function() {
        beforeEach(function(){
            test = test.resetTestData();
        });

        after(function(){
            callback();
        });

        describe('#addArgsToElements()', function() {
            it('should throw an error when the elements argument is null or undefined', function() {
                (function run(arg1, arg2){
                    expect(function(){
                        returnHandler.addArgsToElements(arg1, arg2);
                    }).to.throw(returnHandler.addArgsToElementsError);

                    return run;
                })()(null)(null, null)({}, null);// Send in 2 undefineds then one null and a undefined and etc.
            });

            it('should return empty elements when the element sent in is empty and the object to add to is ENU', function() {
                assert.deepEqual(returnHandler.addArgsToElements(null, []), []);
                assert.deepEqual(returnHandler.addArgsToElements(test.test, []), []);
                assert.deepEqual(returnHandler.addArgsToElements({}, []), []);
            });

            it('should add the specified element\'s argument to an empty array and return an array containing just that argument', function(){
                assert.equal(returnHandler.addArgsToElements(test.return1, [])[0], test.return1.argument);
            });

            it('should add the specified elements argument to the beginning of an array containing 1 argument and return that', function(){
                var returned = returnHandler.addArgsToElements(test.return1, test.addArgsElements);

                assert.equal(returned[0], test.return1.argument);
                assert.equal(returned[1], test.argument2);
            });

            it('should add the specified elements argument to the beginning of thearray containing multiple arguments and return that', function (){
                test.addArgsElements.push(test.argument3);
                var returned = returnHandler.addArgsToElements(test.return1, test.addArgsElements);

                assert.equal(returned[0], test.return1.argument);
                assert.equal(returned[1], test.argument2);
                assert.equal(returned[2], test.argument3);
            });
        });

        describe('#generateNewReturn()', function() {
            function setReturnTemplateElements(elements){
                test.argumentTemplate.elements = elements; 
                test.returnTemplate.argument = test.argumentTemplate;
            }

            beforeEach(function(){
                test.returnTemplate = AST_structure.emptyReturn;
                test.argumentTemplate = AST_structure.argumentTemplate;
            });

            it('should return an object with an empty return and indication of no 2nd return, when given 2 ENU returns', function(){
                (function run(arg1, arg2){
                    assert.deepEqual( returnHandler.generateNewReturn(arg1, arg2), {newReturn: test.returnTemplate, returnInTo: false} );
                    return run;
                })()(null)(null, null)({}, null)({},{});// Send in 2 undefineds then one null and a undefined and etc.
            });

            it('should return an object with the 1st return\'s element in an Array Expression and indication of a return, when 2nd is ENU', function(){
                setReturnTemplateElements([test.return1.argument]);

                (function run(arg){
                    assert.deepEqual( returnHandler.generateNewReturn(test.return1, arg), {newReturn: test.returnTemplate, returnInTo: true} );
                    return run;
                })()(null)({});
            });

            it('should return an object with the 1st return\'s argument and no indication of a return, when the 1st return is ENU', function(){
                test.returnTemplate.argument = test.return1.argument;

                (function run(arg){
                    assert.deepEqual( returnHandler.generateNewReturn(arg, test.return1), {newReturn: test.returnTemplate, returnInTo: false} );
                    return run;
                })()(null)({});
            });

            it('should return an object with the 2nd return\'s element + 1st returns element and an indication of a return, when 2 returns are ' + 
               'sent', function(){
                setReturnTemplateElements([test.return1.argument, test.return2.argument]);

                // Running the same test twice to check if either return sent in is modified which shouldn't happen
                for (var i = 0; i < 2; i += 1)
                    assert.deepEqual( returnHandler.generateNewReturn(test.return2, test.return1), {newReturn: test.returnTemplate, returnInTo: true} );
            });

            it('should return same as last with an extra arg, 1st return\'s argument now has elements instead of a single element', function(){
                var elements = test.returnArray1.argument.elements;
                setReturnTemplateElements([test.return1.argument, elements[0], elements[1]])

                // Running the same test twice to check if either return sent in is modified which shouldn't happen
                for (var i = 0; i < 2; i += 1)
                    assert.deepEqual( returnHandler.generateNewReturn(test.returnArray1, test.return1), {newReturn: test.returnTemplate, returnInTo: true} );
            });

            it('should return same as 2 above with an extra arg, 2nd return\'s argument now has elements instead of a single element', function(){
                var elements = test.returnArray1.argument.elements;
                setReturnTemplateElements([elements[0], elements[1], test.return1.argument])

                assert.deepEqual( returnHandler.generateNewReturn(test.return1, test.returnArray1), {newReturn: test.returnTemplate, returnInTo: true} );
            });

            it('should return same as last with 2 extra args, 1st and 2nd returns argument now have elements instead of a single element', function(){
                var elements1 = test.returnArray1.argument.elements,
                    elements2 = test.returnArray2.argument.elements;
                setReturnTemplateElements([elements1[0], elements1[1], elements2[0], elements2[1]])

                assert.deepEqual( returnHandler.generateNewReturn(test.returnArray2, test.returnArray1), {newReturn: test.returnTemplate, returnInTo: true} );
            });
        });

        // You may notice I don't do seperate array to single element returns. This is because the previous tests should cover those cases.
        describe('#moveReturns()', function() {
            it('should return false if both function bodies are ENU', function(){ 
                (function run(arg1, arg2){
                    assert.isFalse(returnHandler.moveReturns(arg1, arg2));
                    return run;
                })()(null)({})(null, {})({}, null)({}, {});
            });

            it('should return false if any of the arguments are ENU', function(){
                // Once again, not every combination but tests all important ENUs
                (function run(arg1, arg2){
                    assert.isFalse(returnHandler.moveReturns(arg1, arg2));
                    return run;
                })(test.functionBody1, {})({}, test.functionBody1);
            });

            it('should return false and and add the from\'s bodies contents to the to body if the merge from body doesn\'t have a return', function(){
                var oldBody = _.cloneDeep(test.functionBody1.body);

                assert.isFalse(returnHandler.moveReturns(test.functionBody1, test.functionBodyNoReturn));

                assert.deepEqual(test.functionBody1.body[0], test.functionBodyNoReturn);
                for (var i = 1; i < oldBody.length + 1; i += 1)
                    assert.deepEqual( test.functionBody1.body[i], oldBody[i - 1] );
            });

            it('should return false and add the from bodies return if the merge from body has a return and the to body does not', function(){
                assert.isFalse(returnHandler.moveReturns(test.functionBodyNoReturn, test.functionBody1));
                assert.deepEqual( _.last(test.functionBodyNoReturn), _.last(test.functionBody1) );
            });

            it('should also insert the from bodies contents at the beggining of to bodies and modify nothing else before the last element', function(){
                var oldBody = _.cloneDeep(test.functionBodyNoReturn.body);
                returnHandler.moveReturns(test.functionBodyNoReturn, test.functionBody1);

                assert.deepEqual(_.last(test.functionBodyNoReturn[0]), _.last(test.functionBody1));
                for (var i = 1; i < oldBody.length + 1; i += 1)
                    assert.deepEqual( test.functionBodyNoReturn.body[i], oldBody[i - 1] );
            });

            it('should return true and add the from bodies returns arguments to the to bodies arguments if both have returns', function(){
                var oldBody1 = _.cloneDeep(test.functionBody1);
                var oldBody2 = _.cloneDeep(test.functionBody2);

                assert.isTrue(returnHandler.moveReturns(test.functionBody1, test.functionBody2));

                _.last(oldBody2.body).argument.elements.concat(_.last(oldBody1.body).argument.elements);
                _.last(oldBody2.body).argument.elements.forEach(function(element, index){
                    assert.deepEqual( _.last(test.functionBody1.body).argument.elements[index], element );
                });
            });

            it('should also insert the from bodies contents at the beggining of to bodies and modify nothing else before the last element', function(){
                var oldBody = _.cloneDeep(test.functionBody1.body);
                returnHandler.moveReturns(test.functionBody1, test.functionBody2);

                assert.deepEqual(_.last(test.functionBody1[0]), _.last(test.functionBody2));
                for (var i = 1; i < oldBody.length; i += 1)
                    assert.deepEqual( test.functionBody1.body[i], oldBody[i - 1] );
            });
        });
    });
}