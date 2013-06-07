var _ = require('lodash'),
    esprima = require("esprima"),
    escodegen = require("escodegen");

var u = require('../utility_functions.js'),
    ReturnHandler = require('./return_handler.js'),
    AST_structure = require('./AST_structures.js');

// Merges two function calls together, will also merge the corresponding function bodies.
module.exports = function mergeFunction(){
    var mergeName = null;// Tracks the current merge name for above
    var merges = [];// List of merged functions in string form, used to check if I am adding a duplicate function body
    this.merges = merges;
    this.returnHandler = new ReturnHandler();
    
    
    // Merges the second call into the first and the second function into the first
    this.merge = function(callMergeTo, callMergeFrom, functionMergeTo, functionMergeFrom, callback){
        mergeName = callMergeTo.simpleName + '-' + callMergeFrom.simpleName;
        
        var twoReturns = this.mergeFunctions(functionMergeTo.data, functionMergeFrom.data, functionMergeFrom.parent);
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
                    this.splitCallAssignment(index, mergeTo.assignmentExp, mergeFrom.assignmentExp, loopingItem);
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
        if (removeFrom) this.removeFromParent(mergeFrom.data, mergeFrom.parent);
        
        return true;
    }
    
    // Function will be modified to return the two variables as an array, so must extract each individually which is what this does. Uses the to and
    // from assignment expressions to get the right variables and puts them in to's parent. The index is to's location in it's parent.
    // e.g. with this return
    //    return [
    //        x * x,
    //        y
    //    ];
    // You will get the call space modified like so:
    // _r = fromToMerge(5, 6);
    // a = _r[0];
    // b = _r[1];
    //
    // Note: Will only work if parent is an array
    this.splitVar = '_r';
    this.splitCallAssignment = function(index, to, from, toParent){
        if (u.nullOrUndefined(index) || u.enu(from) || u.enu(to) || u.enu(toParent))
            return true;

        var varFrom = this.getVariableName(from),
            varTo = this.getVariableName(to);
        
        // to already split variables with another function, so just add from's variable assignment i.e. <fromVar> = _r[<last r>]
        if (varTo.indexOf(this.splitVar) >= 0){
            // Increment each index of the already inserted splitting variables
            if (u.hasOwnPropertyChain(toParent, (index + 1) + "", "body")){

                var lastItem = _.last(toParent[index + 1].body);
                for (var i = 1; this.getVariableName(lastItem).indexOf(this.splitVar >= 0); i += 1){
                    // part to increment depends on if there is a var in front or not
                    if (lastItem.type === 'ExpressionStatement')
                        lastItem.expression.right.property.value += 1; 
                    else
                        lastItem.declarations[0].init.property.value += 1;

                    if (u.hasOwnPropertyChain(toParent, (index + i + 1) + "", "body"))
                        lastItem = _.last(toParent[index + i + 1].body);
                    else
                        break;
                }
            }
            
            // Insert the from argument before all the previously inserted arguments
            toParent.splice(index + 1, 0, esprima.parse(varFrom + ' = '+this.splitVar+'[0];', {loc: false}));
        }
        // Splitting variables for the first time
        else{    
            // Add the two new return splits to the place after the call
            toParent.splice(index + 1, 0, esprima.parse(varFrom + ' = ' + this.splitVar+'[0];', {loc: false}));
            toParent.splice(index + 2, 0, esprima.parse(varTo + ' = ' + this.splitVar+'[1];', {loc: false}));
            
            // Replace variable name of array returned with the split var, make sure to use a var so no global variable is set
            if (varTo.indexOf('var') < 0){
                if (to.expression)
                    to.expression.left.name = this.splitVar;
                else
                    to.left.name = this.splitVar;
            }
            else
                to.declarations[0].id.name = this.splitVar;
            
            toParent.splice(index, 0, to);
            toParent.remove(index);
        }
        
        return true;
    }

    // Extracts the variable assigning to from the given object
    this.getVariableName = function(object){
        if (u.enu(object))
            return '';
        if (object.type === 'AssignmentExpression')
            return object.left.name;
        else if (object.type === 'ExpressionStatement')
            return object.expression.left.name;
        return 'var ' + object.declarations[0].id.name;
    }
    
    // Merges function declarations, returns boolean for if both functions had a return value
    // 1. Concatenate parameter lists
    // 2. Insert second functions body into first
    // 3. Delete second function decleration (from's parent is needed to guarantee this)
    this.paramCouldntCopy = function(to, from){
        return "Error: Second function parameters could not be copied into the first: \n"  + to + '\n' + from;
    }
    this.bodyCouldntCopy = function(to, from){
        return "Error: Second function body could not be copied into the first: \n"  + to + '\n' + from;
    }
    this.mergeFunctions = function(to, from, fromParent){
        var twoReturns = false;
        if (u.enu(to) || u.enu(from))
            return twoReturns;
        
        // 1. Concatenate function parameters
        if (u.hasOwnPropertyChain(to, 'params') && u.hasOwnPropertyChain(from, 'params')){
            // Assuming all bodies are arrays (from past evidence)
             _.each(from.params.reverse(), function(item){
                if (!_.contains(to.params, item)){
                    to.params.unshift(item);
                }
            });
            from.params.reverse();// Note that reverse is in place so I must restore the array
        }
        else
            throw(this.paramCouldntCopy(to, from));
        
        // 2. Copy second function body into the first
        if (u.hasOwnPropertyChain(to, 'body', 'body') && u.hasOwnPropertyChain(from, 'body', 'body')){
            // Add body data in the form of a block statement, preserves from's object which could be the parent of a call. Unfortunately, each
            // function body add now carries a penalty of two extra characters ('{ and '}'). These are eliminated in safe minification later.
            if (!this.isDuplicateInsert()){
                var toInsert = {
                    type: "BlockStatement",
                    body: from.body.body
                }
                
                // Combine return statements if necessary
                var last = _.last(from.body.body);
                if (u.hasOwnPropertyChain(last, 'type') && last.type === 'ReturnStatement')
                    twoReturns = this.returnHandler.moveReturns(to.body,  from.body);
                else
                    to.body.body.unshift(toInsert);
            }
        }
        else
            throw(this.bodyCouldntCopy(to, from));
        
        // 3. Delete second function declaration
        this.removeFromParent(from, fromParent);
        
        return twoReturns;
    }
    
    // Removes item from its parent or make the item equivalent to removed when it can't be removed. For example when the item to remove the first
    // part of an if, copy the second part to the first and erase the first part. (Always returns true)
    // Note: parent is modified
    this.removeFromParent = function(item, parent){
        if (u.enu(item) || u.enu(parent))
            return true;

        var parent = (_.isArray(parent.body)) ? parent.body : parent;
        if (u.enu(parent))
            return true;

        // mergeFrom.nameInParent cannot reliably be taken as the correct index because the index could get changed as items are deleted in the
        // parent by previous call merges.
        if (_.isArray(parent)){
            this.removeFromParentArray(item, parent);
            
            // If there is an empty array, I must put something there instead like a {}
            if (parent.length === 0)
                parent.push(AST_structure.emptyBlockStatement);
        }
        // Can't get the parent of the expression statement, but can still make function expression null if the item is to be deleted
        else if (u.hasOwnPropertyChain(parent, 'type') && parent.type === 'ExpressionStatement'){
            if (item.loc.start.line === parent.expression.right.loc.start.line)
                parent.expression.right = AST_structure.nullLiteral;
        }
            
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
            return true;// Be consistent, if each loop has a return everything must return
        });
        
        return true;
    }
    
    this.isDuplicateInsert = function(){
        return _.contains(merges, mergeName);
    }
    
    return this;
}