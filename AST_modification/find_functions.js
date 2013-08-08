var _ = require('lodash');

var u = require('../utility_functions.js');

// Finds function calls given an AST body
module.exports = function FindFunctions(AST){
    var _this = this;

    // format:
    // {
    //      decleration1: {
    //          data: <object>,
    //          parent: <object>
    //          nameInParent: <name>
    //      },...
    //}
    this.declarations = {};
    
    // format:
    //  [
    //      { fullName: 'this.callOne',
    //        simpleName: 'callOne',
    //        data: <object>,
    //        parent: <object>,
    //        nameInParent: <name>,
    //        assignmentExp: <object>, //Some function calls may not be in expressions so this may be null
    //        assignmentExpParent: <object>
    //      },...
    //  ]
    this.calls = [];

        // Finds function declerations (even if part of an expression)
    // ISSUES:
    // 1. Cannot handle auto invoking function expression name retrievals => Portfolio.selector = (function(_document)
    // 2. Cannot handle function assignments: var a = function b()
    // 3. Assumes function names are unique, so no _this checks
    this.findDeclarations = function(AST_data, possibleName, parent, nameInParent){
        parent = parent || AST_data;
        
        _.each(AST_data, function(item, index){
            if (item !== null) {
                possibleName = _this.findFunctionExpressionName(item, possibleName);
                
                // Matching function expressions and calls
                if (item.hasOwnProperty('type') && item.type === 'FunctionDeclaration' || item.type === 'FunctionExpression'){
                    _this.addFunctionDeclaration(item, possibleName, parent, nameInParent);
                    possibleName = null;
                }
                
                if (_this.toContinue(item))
                    _this.findDeclarations(item, possibleName, AST_data, index);
            }
        });

        return true;
    }
    
    // Decides if the current item is worth investigation
    this.toContinue = function(item){
        if (u.nullOrUndefined(item))
            return false;
        
        // See if the current item is worth investigating
        if (_.isArray(item) ||
            _.some(['expression', 'expressions', 'argument', 'arguments', 'left', 'right', 'object', 'properties',
                    'value', 'declarations', 'body', 'consequent'/*<-after if*/, 'init' /*Could contain call expressions*/],
            function(type){
                return item.hasOwnProperty(type);
            }
        )){
            return true;
        }

        return false;
    }
    
    // Tries to find a function expression name using the current item.
    this.findFunctionExpressionName = function(item, currentName){
        if (item.hasOwnProperty("property") && item.property.hasOwnProperty("name"))
            return item.property.name;
        else if(item.hasOwnProperty("key") && item.key.hasOwnProperty("name"))
            return item.key.name;
        return currentName;
    }
    
    // When a function is found add it to the list of found functions with its name. Since
    // function expressions are in the form a: function(){}, they must extract an earlier property
    // name value which is passed down through the recursion.
    this.addFunctionDeclaration = function(function_data, possibleName, parent, nameInParent){
        if (function_data.hasOwnProperty("id") && function_data.id !== null && function_data.id.hasOwnProperty("name"))
            var name = function_data.id.name;
        else if (function_data.type === 'FunctionExpression'){
            var name = 'anonymous';
            if (!u.nullOrUndefined(possibleName))
                name = possibleName;
        }
        else
            messages.merging.noNameFunction(function_data).error();
            
        _this.declarations[name] = {
            data: function_data,
            parent: parent,
            nameInParent: nameInParent
        }
    }
    
    // Finds all function calls that corespond to the number of found declarations
    // ISSUES:
    // 1. (address + "").split() style calls will not be detected
    // 2. Passed in callbacks
    this.findCalls = function(AST_data, functionNames, callback, possibleName, parent, nameInParent){
        _.each(AST_data, function(item, index){
            parent = parent || AST_data;
            
            if (item !== null) {
                // When function is anonymous it will be bound to another variable
                if (u.hasOwnPropertyChain(item, 'property', 'name')){
                    if (u.nullOrUndefined(possibleName))
                        possibleName = item.property.name;
                    else
                        possibleName += '.' + item.property.name;
                }
                
                // Add all the found functions if they don't already exist
                _.each(_this.checkForCalls(item, parent), function(foundItem){
                    // Try to find the name given that there is a callee
                    var name = _this.findCallExpressionName(foundItem.call);
                    
                    // Check for a duplicate entry before adding (See checkForCalls)
                    var duplicate = false;
                    for (var i = 0; i < _this.calls.length && !duplicate; i++){
                        if (u.getLineNumber(_this.calls[i].data.data) === u.getLineNumber(foundItem.data)
                            && _this.calls[i].fullName === name)
                            duplicate = true;
                    }
                    
                    // Add the item
                    if (!duplicate){
                        _this.calls.push({
                            fullName: name,
                            simpleName: _this.extractSimpleName(name),
                            data: _.clone(foundItem.call),
                            parent: parent,
                            nameInParent: nameInParent,
                            assignmentExp: foundItem.assignment,
                            assignmentExpParent: foundItem.parent
                        });
                    }
                });
                
                if (_this.toContinue(item))
                    _this.findCalls(item, functionNames, null, possibleName, AST_data, index);
            }
        });
            
        return true;
    }
    
    // Checks if the item is a call and returns that found, otherwise if an assignment expression
    // (var x = call() counts) checks all items one level below it. The items parent is needed the expressions
    // parent can be modified later. Returns an array of found calls in form:
    // {call: <>, assignment: <>, assignmentParent: <>}
    // Note: can result in duplicates because later the contents of AssignmentExpression will be checked for
    // CallExpression with the first type if.
    this.checkForCalls = function(item, parent){
        var found = [];
        
        if (u.hasOwnPropertyChain(item, 'type')){
            if (item.type === 'CallExpression')
                found.push({call: item, assignment: null, parent: parent});
            // Search for a call expression one level under an AssignmentExpression or VariableDeclaration
            else if (item.type === 'AssignmentExpression' && u.hasOwnPropertyChain(item, 'right', 'type')
                    && item.right.type === 'CallExpression')
                found.push({call: item.right, assignment: item, parent: parent});
            else if (item.type === 'VariableDeclaration' && u.hasOwnPropertyChain(item, 'declarations', '0' ,'init', 'type')
                    && item.declarations[0].init.type === 'CallExpression'){
                found.push({call: item.declarations[0].init, assignment: item, parent: parent});
            }
        }
        
        return found;
    }
    
    // Recursively looks down an items properties to find a name
    this.findCallExpressionName = function findName(callExpression, name){
        // Search through any object properties
        if (u.hasOwnPropertyChain(callExpression, 'object')){
            name = _this.searchObjectForNames(callExpression.object, name);
        }
        
        if (u.hasOwnPropertyChain(callExpression, 'callee', 'name')){
            if (u.nullOrUndefined(name))
                name = callExpression.callee.name;
            else
                name += '.' + callExpression.callee.name;
        }
        else if (u.hasOwnPropertyChain(callExpression, 'callee', 'property', 'name')){
            // This is the part right before the caller e.g. the this label in this.run()
            if (u.hasOwnPropertyChain(callExpression, 'callee', 'object', 'type') && callExpression.callee.object.type === 'ThisExpression'){
                // This appears before the object call
                if (u.nullOrUndefined(name))
                    name = 'this';
                else
                    name += '.this';
            }
            
            if (u.nullOrUndefined(name))
                name = callExpression.callee.property.name;
            else
                name += '.' + callExpression.callee.property.name;
                
            return findName(callExpression.callee, name);
        }

        return name;
    }
    
    // Find simple name, normally last part in split but not if there is a call or apply modifier.
    this.extractSimpleName = function(name){
        if (u.nullOrUndefined(name))
            return name;
        
        var parts = name.split('.');
        var simpleName = parts.slice(-1).pop();
        if (simpleName === 'call' || simpleName === 'apply')
            simpleName = parts.slice(-2,-1).pop();
            
        return simpleName;
    }
    
    // Goes through an object property of an item looking for object names (so far only used for calls)
    this.searchObjectForNames = function findName(object, name){
        if (u.hasOwnPropertyChain(object, 'property'))
            name = findName(object.property, name);
        if (u.hasOwnPropertyChain(object, 'object'))
            name = findName(object.object, name);
            
        if (!u.hasOwnPropertyChain(object, 'type') && object.type == 'ThisExpression')
            return 'this' + '.' + name;
        // At the bottom of the object/property search so extract whichever name is displayed
        else if (u.hasOwnPropertyChain(object, 'name')){
            if (u.nullOrUndefined(name))
                return object.name;
            else
                return object.name + '.' + name;// Placed in reverse order due to the recursion
        }
        return name;
    }
    
    // Eliminate function calls that have no found definitions and clean them up by storing the call name.
    this.trimCalls = function(){
        var newCalls = [];
        var declarationNames = _.map(this.declarations, function(funct, name){ return name; });
        
        // Only add function calls that have been declared in file  
        _.each(this.calls, function(call){
            if(_.contains(declarationNames, call.simpleName))
                newCalls.push(call);
        });
        
        this.calls = newCalls;
    }

    // Redorder function calls by start location, descending. Any calls within short range of each other are candidates for merging.
    this.sortCalls = function(){
        _this.calls.sort(function(callX, callY) {
            return u.getLineNumber(callY.data) - u.getLineNumber(callX.data);
        });
    }

    return this;
}