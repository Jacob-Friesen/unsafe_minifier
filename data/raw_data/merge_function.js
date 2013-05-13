var _ = require('underscore');
var esprima = require("esprima");
var escodegen = require("escodegen");

var u = require('../utility_functions.js');
var ReturnHandler = require('./return_handler.js');

// debugging
var util = require('util');

module.exports = function mergeFunction(){
    // List of merged functions in string form, used to check if I am adding a duplicate function body
    var merges = [];
    var mergeName = null;// Tracks the current merge name for above
    this.returnHandler = ReturnHandler();
    
    
    // Merges the second call into the first and the second function into the first
    this.merge = function(callMergeTo, callMergeFrom, functionMergeTo, functionMergeFrom, callback){
        mergeName = callMergeTo.simpleName + '-' + callMergeFrom.simpleName;
        
        this.mergeCalls(callMergeTo, callMergeFrom);
        this.mergeFunctions(functionMergeTo, functionMergeFrom);
        
        merges.push(mergeName)
        
        return callback();
    }
    
    // Merges calls:
    // 1. Copy arguments of mergeInto to mergeTo
    // 2. Erase the function call merging to
    // 3. If both functions are part of an assignment must assign to both variables from a function
    // Returns false if there was an error
    this.mergeCalls = function(mergeTo, mergeFrom){
        // 1. Move any arguments
        if (u.hasOwnPropertyChain(mergeTo.data, 'arguments') && u.hasOwnPropertyChain(mergeFrom.data, 'arguments')){
            // Assuming all bodies are arrays (from past evidence)
            _.each(mergeFrom.data.arguments.reverse(), function(item){
                if (!_.contains(mergeTo.data.arguments, item))
                    mergeTo.data.arguments.unshift(item);
            });
            mergeFrom.data.arguments.reverse();
        }
        else
            throw("Error: Second calls arguments could not be copied into the first");
        
        // 2. Remove second function call
        this.removeItemFromParent(mergeFrom, mergeTo);
        
        // 3. If both functions are part of an assignment must make sure both assigned to variables get what they need for the function.
        if (mergeTo.assignmentExp != null && mergeFrom.assignmentExp != null){
            var fromVar = mergeFrom.assignmentExp.left;
            var toVar = mergeTo.assignmentExp.left;
            
            // loop through expression parent until expression is located, the index is where to insert to after.
            _.each(mergeTo.assignmentExpParent, function(item, index){
                if (u.hasOwnPropertyChain(item, 'loc', 'start', 'line') && item.loc.start.line === mergeTo.assignmentExp.loc.start.line)
                    addSplittingVariables(index);
            });
            
            // Function will be modified to return the two variables as an array, so must extract each individually
            // Note: Will only work if parent is an array
            function addSplittingVariables(index){
                // Give var the the local variables that were setting var before
                var varFor1 = (mergeFrom.assignmentExpParent.type === 'AssignmentExpression') ? 'var ': '';
                var varFor2 = (mergeTo.assignmentExpParent.type === 'AssignmentExpression') ? 'var ': '';
                
                mergeTo.assignmentExpParent.splice(index + 1, 0, esprima.parse(varFor1 +  mergeFrom.assignmentExp.left.name + ' = _r[0];', {loc: true}));
                mergeTo.assignmentExpParent.splice(index + 2, 0, esprima.parse(varFor2 +  mergeTo.assignmentExp.left.name + ' = _r[1];', {loc: true}));
                
                // Replace variable name of array returned, make sure to use a var so no global variable is set
                mergeTo.assignmentExp.left.name = '_r';
                var code = escodegen.generate(mergeTo.assignmentExp);
                var varForMain = (code.indexOf('+') < 0) ? 'var ': '';
                mergeTo.assignmentExpParent.splice(index, 0, esprima.parse(varForMain + code, {loc: true}) );
                mergeTo.assignmentExpParent.remove(index + 1);
            }
        }
        
        return true;
    }
    
    // Merges function declarations
    // 1. Concatenate parameter lists
    // 2. Insert second functions body into first
    // 3. Delete second function decleration
    this.mergeFunctions = function(mergeTo, mergeFrom){
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
                if (_.last(mergeFrom.data.body.body).type === 'ReturnStatement')
                    this.returnHandler.moveReturns(mergeTo.data.body.body,  mergeFrom.data.body.body,  mergeFrom.data.body);
                else
                    mergeTo.data.body.body.unshift(toInsert);
            }
        }
        else
            throw("Error: Second function body could not be copied into the first");
        
        // 3. Delete second function declaration        
        this.removeItemFromParent(mergeFrom, mergeTo);
        
        return true;
    }
    
    this.removeFromParentArray = function(toRemove, parent){
        _.each(parent, function(item, index){
            if (u.hasOwnPropertyChain(item, 'loc', 'start', 'line') && u.hasOwnPropertyChain(toRemove, 'loc', 'start', 'line')
                && item.loc.start.line === toRemove.loc.start.line){
                parent.remove(index);
                return true;
            }
        });
        
        return true;
    }
    
    // Removes item from its parent, complicated.
    this.removeItemFromParent = function(mergeFrom, mergeTo){
        // mergeFrom.nameInParent cannot reliably be taken as the correct index because the index could get changed as items are deleted in the
        // parent by previous call merges
        if (_.isArray(mergeFrom.parent))
            this.removeFromParentArray(mergeFrom.data, mergeFrom.parent);
            
        // If an if statement must make item null not remove it due to how ifs are parsed
        else if(u.hasOwnPropertyChain(mergeTo.parent, 'type') && mergeTo.parent.type === 'IfStatement'){
            // Make sure that there isn't a lone else statement
            if (mergeFrom.nameInParent === 'consequent'){
                mergeFrom.parent['consequent'] = mergeFrom.parent['alternate'];
                mergeFrom.parent['alternate'] = null;
            }
            else
                mergeFrom.parent[mergeFrom.nameInParent] = [];
        }
        else{
            if (mergeFrom.nameInParent === 'body')
                this.removeFromParentArray(mergeFrom.data, mergeFrom.parent.body);
            else
                mergeFrom.parent[mergeFrom.nameInParent] = [];
        }
            
        return true;
    }
    
    // Each time a merge from to pattern is added to the merges list in string form after the merging has been done. So this checks if the contents
    // of one function have already been moved into another.
    this.isDuplicateInsert = function(){
        return _.contains(merges, mergeName);
    }
    
    return this;
}