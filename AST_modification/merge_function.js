var _ = require('lodash');
var esprima = require("esprima");
var escodegen = require("escodegen");

var u = require('../utility_functions.js');
var ReturnHandler = require('./return_handler.js');

// Merges two function calls together, will also merge the corresponding function bodies.
module.exports = function mergeFunction(){
    var mergeName = null;// Tracks the current merge name for above
    var merges = [];// List of merged functions in string form, used to check if I am adding a duplicate function body
    this.merges = merges;
    this.returnHandler = new ReturnHandler();
    
    
    // Merges the second call into the first and the second function into the first
    this.merge = function(callMergeTo, callMergeFrom, functionMergeTo, functionMergeFrom, callback){
        mergeName = callMergeTo.simpleName + '-' + callMergeFrom.simpleName;
        
        var twoReturns = this.mergeFunctions(functionMergeTo, functionMergeFrom);
        this.mergeCalls(callMergeTo, callMergeFrom, twoReturns);
        
        merges.push(mergeName);
        
        return callback();
    }
    
    // Merges calls:
    // 1. Copy arguments of mergeInto to mergeTo
    // 2. If both function calls are part of an assignment must assign to both variables from a function returns false if there was an error
    // 3. If first function call has an expression must make second one have same expression with variable
    // 4. Erase the function call merging to
    this.mergeCalls = function(mergeTo, mergeFrom, twoReturns){
        var removeFrom = true;
        
        // 1. Move any arguments, to prevent (╯°□°）╯︵ ┻━┻ only allow literals (e.g. 1 or 'a' or a, no function arguments etc.) to be copied.
        if (u.hasOwnPropertyChain(mergeTo.data, 'arguments') && u.hasOwnPropertyChain(mergeFrom.data, 'arguments')){
            if (!_.find(mergeFrom.data.arguments, function(item){ return item.type !== 'Literal' && item.type !== 'Identifier'})){
                _.each(mergeFrom.data.arguments.reverse(), function(item){
                    mergeTo.data.arguments.unshift(item);
                });
                mergeFrom.data.arguments.reverse();
            }
        } 
        else
            throw("Error: Second calls arguments could not be copied into the first");
        
        // 2. If both functions are part of an assignment must make sure both assigned to variables get what they need for the function.
        if (mergeTo.assignmentExp !== null && mergeFrom.assignmentExp !== null && twoReturns){
            var loopingItem = mergeTo.assignmentExpParent;
            if(u.hasOwnPropertyChain(mergeTo.assignmentExpParent, 'body'))
                loopingItem = mergeTo.assignmentExpParent.body;
            
            // Loop through expression parent until expression is located, the index is where to insert to after.    
            _.find(loopingItem, function(item, index){
                if (u.hasOwnPropertyChain(item, 'loc', 'start', 'line') && item.loc.start.line === mergeTo.assignmentExp.loc.start.line){
                    this.addSplittingVariables(index, mergeFrom, mergeTo, loopingItem);
                    return true;
                }
            });
        }
        // 3. If the first function is an assignment must make second function an assignment and then copy over the variables
        else if (mergeFrom.assignmentExp !== null){
            // Add To's call expression to from's assignment expression
            if (mergeFrom.assignmentExp.type === 'AssignmentExpression')
                mergeFrom.assignmentExp.right = mergeTo.data;
            else
                mergeFrom.assignmentExp.declarations[0].init = mergeTo.data;
            
            // Give to from's assignment expression, assuming mergeTo's immediate parent is an array
            _.find(mergeTo.parent, function(obj, index){
                if (u.hasOwnPropertyChain(obj, 'loc', 'start', 'line') && u.hasOwnPropertyChain(mergeTo.data, 'loc', 'start', 'line')
                && obj.loc.start.line === mergeTo.data.loc.start.line){
                    if (mergeFrom.assignmentExp.type === 'AssignmentExpression'){
                        obj.expression = mergeFrom.assignmentExp;
                    }
                    else{
                        obj = mergeFrom.assignmentExp;
                        if (_.isArray(mergeTo.parent)) this.removeFromParentArray(mergeTo.data, mergeTo.parent);
                        removeFrom = false;
                    }
                    // mergeTo now is an assignment expression
                    mergeTo.assignmentExp = mergeFrom.assignmentExp;
                    mergeTo.assignmentExp.loc.start.line = Number(mergeTo.assignmentExp.loc.start.line) + 1;
                    
                    return true;
                }
            });
        }
        
        // 4. Remove from function call
        if (removeFrom) this.removeItemFromParent(mergeFrom, mergeTo);
        
        return true;
    }
    
    // Function will be modified to return the two variables as an array, so must extract each individually. If the merging to function has already
    // done this operation...
    // Note: Will only work if parent is an array
    this.addSplittingVariables = function(index, mergeFrom, mergeTo, mergeToAssignmentParent){
        if (mergeFrom.assignmentExp.type === 'AssignmentExpression')
            var varFor1 =  mergeFrom.assignmentExp.left.name;
        else
            var varFor1 = 'var ' + mergeFrom.assignmentExp.declarations[0].id.name;
        
        
        // to already split variables with another function, so just add from's variable assignment i.e. <fromVar> = _r[<last r>]
        if (u.hasOwnPropertyChain(mergeTo.assignmentExp, 'left', 'name') && mergeTo.assignmentExp.left.name === '_r'){
            
            // Increment each index of the inserted splitting variables
            if (u.hasOwnPropertyChain(mergeToAssignmentParent, (index + 1) + "", "body")){
                var lastItem = _.last(mergeToAssignmentParent[index + 1].body);
                for (var i = 1; u.hasOwnPropertyChain(lastItem, 'expression', 'right', 'object') &&
                                lastItem.expression.right.object.name === '_r'; i += 1){ 
                    lastItem.expression.right.property.value += 1;
                    if (u.hasOwnPropertyChain(mergeToAssignmentParent, (index + i + 1) + "", "body"))
                        lastItem = _.last(mergeToAssignmentParent[index + i + 1].body);
                    else
                        break;
                }
            }
            
            // Insert the mergeFrom argument first
            mergeToAssignmentParent.splice(index + 1, 0, esprima.parse(varFor1 + ' = _r[0];', {loc: false}));
        }
        else{
            if (mergeTo.assignmentExp.type === 'AssignmentExpression')
                var varFor2 =  mergeTo.assignmentExp.left.name;
            else
                var varFor2 = 'var ' + mergeTo.assignmentExp.declarations[0].id.name;
                
            mergeToAssignmentParent.splice(index + 1, 0, esprima.parse(varFor1 + ' = _r[0];', {loc: false}));
            mergeToAssignmentParent.splice(index + 2, 0, esprima.parse(varFor2 + ' = _r[1];', {loc: false}));
            
            // Replace variable name of array returned, make sure to use a var so no global variable is set
            if (mergeTo.assignmentExp.type === 'AssignmentExpression')
                mergeTo.assignmentExp.left.name = '_r';
            else
                mergeTo.assignmentExp.declarations[0].id.name = '_r';
            
            var code = escodegen.generate(mergeTo.assignmentExp);
            var varForMain = (code.indexOf('+') < 0 && code.indexOf('.') < 0) ? 'var ': '';
            
            mergeToAssignmentParent.splice(index, 0, esprima.parse(code, {loc: false}) );
            mergeToAssignmentParent.remove(index);
        }
        
        return true;
    }
    
    // Merges function declarations, returns boolean for if both functions had a return value
    // 1. Concatenate parameter lists
    // 2. Insert second functions body into first
    // 3. Delete second function decleration
    this.mergeFunctions = function(mergeTo, mergeFrom){
        var twoReturns = false;
        
        // 1. Concatenate function parameters
        if (u.hasOwnPropertyChain(mergeTo.data, 'params') && u.hasOwnPropertyChain(mergeFrom.data, 'params')){
            // Assuming all bodies are arrays (from past evidence)
             _.each(mergeFrom.data.params.reverse(), function(item){
                if (!_.contains(mergeTo.data.params, item)){
                    mergeTo.data.params.unshift(item);
                }
            });
            mergeFrom.data.params.reverse();// Note that reverse is in place so I must restore the array
        }
        else
            throw("Error: Second function parameters could not be copied into the first");
        
        // 2. Copy second function body into the first
        if (u.hasOwnPropertyChain(mergeTo.data, 'body', 'body') && u.hasOwnPropertyChain(mergeFrom.data, 'body', 'body')){
            // Add body data in the form of a block statement, preserves mergeFrom's object which could be the parent of a call. Unfortunately, each
            // function body add now carries a penalty of two extra characters ('{ and '}')
            if (!this.isDuplicateInsert()){
                var toInsert = {
                    type: "BlockStatement",
                    body: mergeFrom.data.body.body
                }
                
                // Combine return statements if necessary
                var last = _.last(mergeFrom.data.body.body)
                if (u.hasOwnPropertyChain(last, 'type') && last.type === 'ReturnStatement')
                    twoReturns = this.returnHandler.moveReturns(mergeTo.data.body,  mergeFrom.data.body);
                else
                    mergeTo.data.body.body.unshift(toInsert);
            }
        }
        else
            throw("Error: Second function body could not be copied into the first");
        
        // 3. Delete second function declaration
        this.removeItemFromParent(mergeFrom, mergeTo);
        
        return twoReturns;
    }
    
    // Removes item from its parent or make the item equivalent to removed when it can't be removed. For example when the item to remove the first
    // part of an if, copy the second part to the first and erase the first part.
    this.removeItemFromParent = function(mergeFrom, mergeTo){
        // mergeFrom.nameInParent cannot reliably be taken as the correct index because the index could get changed as items are deleted in the
        // parent by previous call merges.
        if (_.isArray(mergeFrom.parent) ){
            this.removeFromParentArray(mergeFrom.data, mergeFrom.parent);
            
            // If there is an empty array, I must put something there instead like a {}
            if (mergeFrom.parent.length === 0){
                mergeFrom.parent.push({
                    type: "BlockStatement",
                    body: []
                });
            }
        }
        // If an if statement must make item null not remove it due to how ifs are parsed
        else if (u.hasOwnPropertyChain(mergeTo.parent, 'type') && mergeTo.parent.type === 'IfStatement'){
            // Make sure that there isn't a lone else statement
            if (mergeFrom.nameInParent === 'consequent'){
                mergeFrom.parent['consequent'] = mergeFrom.parent['alternate'];
                mergeFrom.parent['alternate'] = null;
            }
            else if (mergeFrom.nameInParent === 'alternate')
                mergeFrom.parent[mergeFrom.nameInParent] = null;
            // If it's a 'test' (the x of the if (x) part) don't remove it.
        }
        // Can't get the parent of the expression statement, but can still make function null
        else if (u.hasOwnPropertyChain(mergeFrom.parent, 'type') && mergeFrom.parent.type === 'ExpressionStatement'){
            mergeFrom.parent.expression.right = {
                "type": "Literal",
                "value": null,
                "raw": "null"
            }
        }
        else if (mergeFrom.nameInParent === 'body')
            this.removeFromParentArray(mergeFrom.data, mergeFrom.parent.body);
            
        return true;
    }
    
    // Finds the item to delete and removes that item from the parent. (Always returns true)
    this.removeFromParentArray = function(toRemove, parentArray){
        _.each(parentArray, function(item, index){
            if (u.hasOwnPropertyChain(item, 'loc', 'start', 'line') && u.hasOwnPropertyChain(toRemove, 'loc', 'start', 'line')
                && item.loc.start.line === toRemove.loc.start.line){
                parentArray.remove(index);
                return true;
            }
            return true;// Be consistent, if each loop has a return everything must
        });
        
        return true;
    }
    
    this.isDuplicateInsert = function(){
        return _.contains(merges, mergeName);
    }
    
    return this;
}