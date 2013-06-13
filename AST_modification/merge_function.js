var _ = require('lodash'),
    esprima = require("esprima"),
    escodegen = require("escodegen");

var u = require('../utility_functions.js'),
    ReturnHandler = require('./return_handler.js'),
    AST_structure = require('./AST_structures.js');

// Merges two function calls together, will also merge the corresponding function bodies.
module.exports = function mergeFunction(){
    var mergeName = null,// Tracks the current merge name for above
        merges = [],// List of merged functions in string form, used to check if I am adding a duplicate function body
        _this = this;

    this.merges = merges;
    this.returnHandler = new ReturnHandler();
    this.SPLIT_VAR = '_r';
    
    // Merges the second call into the first and the second function into the first
    this.merge = function(callTo, callFrom, functionTo, functionFrom, callback){
        if (enu(functionTo) || enu(functionFrom) || enu(callTo) || enu(callFrom))
            return callback();

        mergeName = callTo.simpleName + '-' + callFrom.simpleName;
        
        var bothHaveReturns = this.mergeFunctions(functionTo.data, functionFrom.data, functionFrom.parent);

        callTo.assignmentExp = this.mergeCalls({
            to: callTo.data,
            toParent: callTo.parent,
            toAssignment: callTo.assignmentExp,
            toAssignmentParent: callTo.assignmentExpParent,
            from: callFrom.data,
            fromParent: callFrom.parent,
            fromAssignment: callFrom.assignmentExp,
            bothHaveReturns: bothHaveReturns
        });
        
        merges.push(mergeName);
        
        return callback();
    }
    
    // Accepts an object:
    // {
    //      -- These must be defined and not empty    
    //      to: <object>,
    //      toParent: <object>,
    //      from: <object>,
    //      -- This must not be empty if from is to be properly removed from it's parent
    //      fromParent: <object>,
    //      -- These are only required if from has an assignment
    //      toAssignment: <object>,
    //      toAssignmentParent: <object>,
    //      fromAssignment: <object>,
    //      bothHaveReturns: true/false
    // }
    //
    // Merges calls by following these steps:
    // 1. Copy arguments of from to to
    // 2. If from is part of an assignment make the necessary modifications to to
    // 3. Erase the function call merging to (if from's parent is provided)
    // Returns the modified version of to's assignment expression
    this.argsCouldntCopy = function(to, from){
        return "Error: Second calls arguments could not be copied into the first: \n"  + to + '\n' + from;
    }
    this.mergeCalls = function(o){
        if (u.enu(o.to) || u.enu(o.toParent) || u.enu(o.from))
            return true;

        o.bothHaveReturns = o.bothHaveReturns || false;
        var removeFrom = true;
        
        // 1. Move any arguments, to prevent (╯°□°）╯︵ ┻━┻ only allow literals (e.g. 1 or 'a' or a, no function arguments etc.) to be copied.
        if (u.hasOwnPropertyChain(o.to, 'arguments') && u.hasOwnPropertyChain(o.from, 'arguments')){
            if (!_.find(o.from.arguments, function(item){ return item.type !== 'Literal' && item.type !== 'Identifier'})){
                _.each(o.from.arguments.reverse(), function(item){
                    o.to.arguments.unshift(item);
                });
                o.from.arguments.reverse();
            }
        } 
        else
            throw(_this.argsCouldntCopy(o.to, o.from));
        
        // 2. Change to's structure if from is part of an assignment
        if (!u.enu(o.fromAssignment)){
            o.toAssignment = this.copyFromAssignment({
                to: o.to,
                toParent: o.toParent,
                toAssignment: o.toAssignment,
                toAssignmentParent: o.toAssignmentParent,
                fromAssignment: o.fromAssignment,
                bothHaveReturns: o.bothHaveReturns
            });
        }
        
        // 3. Remove from function call
        this.removeFromParent(o.from, o.fromParent);
        
        return o.toAssignment;
    }

    // Accepts an object:
    // {
    //      -- These must be defined and not empty if from has an assignment and either bothHaveReturns is false or to doesn't have an assignment   
    //      to: <object>,
    //      toParent: <object>,
    //      fromAssignment:<object>,
    //      -- Also, these must not be empty if from is to be properly removed from it's parent
    //      toAssignment: <>,
    //      toAssignmentParent: <object>,
    //      bothHaveReturns: true/false
    // }
    // Updates to's assignment structure and data when from is an assignment. Returns the modified the toAssignment.
    this.copyFromAssignment = function(o){
        // If both to and from are part of an assignment and both have returns, the returns must be combined
        if (!enu(o.toAssignment) && o.bothHaveReturns){
            var loopingItem = o.toAssignmentParent;
            if(u.hasOwnPropertyChain(loopingItem, 'body'))
                loopingItem = loopingItem.body;
            
            // Loop through expression parent until expression is located, the index is where to insert to after.    
            _.find(loopingItem, function(item, index){
                if (u.sameLine(item, o.toAssignment)){
                    _this.splitCallAssignment(index, o.toAssignment, o.fromAssignment, loopingItem);
                    return true;
                }
            });
        }
        // If from has an assignment must give to the contents of that assignment with to being initialized instead of from
        else if (!enu(o.fromAssignment) && !enu(o.to) && !enu(o.toParent)){
            // Add to's call expression to from's assignment expression
            if (o.fromAssignment.type === 'AssignmentExpression')
                o.fromAssignment.right = o.to;
            else
                o.fromAssignment.declarations[0].init = o.to;
            
            // If from is an assignment expression give to it as to's expression
            if (o.fromAssignment.type === 'AssignmentExpression'){
                var loopingItem = o.toParent;
                if(u.hasOwnPropertyChain(loopingItem, 'body'))
                    loopingItem = loopingItem.body;

                _.find(loopingItem, function(obj){
                    return u.sameLine(obj, o.to);
                }).expression = o.fromAssignment;
            }

            // to now is the modified version of from's assignment expression
            o.toAssignment = o.fromAssignment;
            o.toAssignment.loc.start.line += 1;
        }

        return o.toAssignment;
    }
    
    // Function will be modified to return the two variables as an array, so must extract each individually which is what this does. Uses the to and
    // from assignment expressions to get the right variables and puts them in to's parent. The index is to's location in it's parent
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
    this.splitCallAssignment = function(index, to, from, toParent){
        if (u.nullOrUndefined(index) || u.enu(from) || u.enu(to) || u.enu(toParent))
            return true;

        var varFrom = this.getVariableName(from),
            varTo = this.getVariableName(to);
        
        // to already split variables with another function, so just add from's variable assignment i.e. <fromVar> = _r[<last r>]
        if (varTo.indexOf(this.SPLIT_VAR) >= 0){
            // Increment each index of the already inserted splitting variables
            if (u.hasOwnPropertyChain(toParent, (index + 1) + "", "body")){

                var lastItem = _.last(toParent[index + 1].body);
                for (var i = 1; this.getVariableName(lastItem).indexOf(this.SPLIT_VAR >= 0); i += 1){
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
            toParent.splice(index + 1, 0, esprima.parse(varFrom + ' = '+this.SPLIT_VAR+'[0];', {loc: false}));
        }
        // Splitting variables for the first time
        else{    
            // Add the two new return splits to the place after the call
            toParent.splice(index + 1, 0, esprima.parse(varFrom + ' = ' + this.SPLIT_VAR+'[0];', {loc: false}));
            toParent.splice(index + 2, 0, esprima.parse(varTo + ' = ' + this.SPLIT_VAR+'[1];', {loc: false}));
            
            // Replace variable name of array returned with the split var, make sure to use a var so no global variable is set
            if (varTo.indexOf('var') < 0){
                if (to.expression)
                    to.expression.left.name = this.SPLIT_VAR;
                else
                    to.left.name = this.SPLIT_VAR;
            }
            else
                to.declarations[0].id.name = this.SPLIT_VAR;
            
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
            return this.findObjectName(object.left)
        else if (object.type === 'ExpressionStatement')
            return object.expression.left.name;
        return 'var ' + object.declarations[0].id.name;
    }

    // keeps on going down the first set of objects until a name is reached or undefined in which '' is returned
    this.findObjectName = function findObjectName(object){
        if (!u.enu(object)){
            if (object.name) 
                return object.name;
            else if (object.object)
                return findObjectName(object.object);
        }
        return '';
    }
    
    // Merges function declarations, returns boolean for if both functions had a return value
    // 1. Concatenate parameter lists
    // 2. Insert second functions body into first
    // 3. Delete second function declaration (from's parent is needed to guarantee this)
    this.paramCouldntCopy = function(to, from){
        return "Error: Second function parameters could not be copied into the first: \n"  + to + '\n' + from;
    }
    this.bodyCouldntCopy = function(to, from){
        return "Error: Second function body could not be copied into the first: \n"  + to + '\n' + from;
    }
    this.mergeFunctions = function(to, from, fromParent){
        var bothHaveReturns = false;
        if (u.enu(to) || u.enu(from))
            return bothHaveReturns;
        
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
                    bothHaveReturns = this.returnHandler.moveReturns(to.body,  from.body);
                else
                    to.body.body.unshift(toInsert);
            }
        }
        else
            throw(this.bodyCouldntCopy(to, from));
        
        // 3. Delete second function declaration
        this.removeFromParent(from, fromParent);
        
        return bothHaveReturns;
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
            if (u.sameLine(item, parent.expression.right))
                parent.expression.right = AST_structure.nullLiteral;
        }
            
        return true;
    }
    
    // Finds the item to delete and removes that item from the parent. (Always returns true)
    this.removeFromParentArray = function(toRemove, parentArray){
        _.each(parentArray, function(item, index){
            if (u.sameLine(item, toRemove)){
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