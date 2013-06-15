var _ = require('lodash');

var u = require('../utility_functions.js');
var MergeFunction = require('./merge_function.js');
var FunctionStatistics = require('../data_generation/function_statistics.js');

// Handles function merging for the given AST. Finds most of the calls and functions in the code, keep in mined
// JS is extremely expressive and this system is a prototype. Function declerations and calls that will not be
// discovered are in findFunctionDeclarations and findFunctionCalls respectively.
module.exports = function mergeFunctions(files, AST){
    if (u.nullOrUndefined(files))
        throw('Error: files must be specified in main.js.');
        
    var context = this;
    this.mergeFunction = MergeFunction();
    this.functionStatistics = FunctionStatistics();
    this.files = files;
    
    // format:
    // {
    //      decleration1: {
    //          data: <object>,
    //          parent: <object>
    //          nameInParent: <name>
    //      },...
    //}
    this.functionDeclarations = {};
    
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
    this.functionCalls = [];
        
    // Merges the functions calling the callback with the returned AST, if a nueral network is included the network is used to determine if a merge is
    // appropriate. Prints the functions that were merged if printMerges is true.
    this.merge = function(fileName, callback, network, printMerges){
        console.log('merging ' + fileName + '...');
        
        // Find function declerations in the AST and then use those to find any that calls them
        this.findFunctionDeclarations(AST.body, function(){
            
            var functionNames = _.map(this.functionDeclarations, function(funct, name){ return name; });
            context.findFunctionCalls(AST.body, functionNames, function(){
                
                context.mergeFunctions(function(){
                    return callback(AST);
                }, network, printMerges);
            });
        });
    }
    
    // Finds function declerations (even if part of an expression)
    // ISSUES:
    // 1. Cannot handle auto invoking function expression name retrievals => Portfolio.selector = (function(_document)
    // 2. Cannot handle function assignments: var a = function b()
    // 3. Assumes function names are unique, so no context checks
    this.findFunctionDeclarations = function(AST_data, callback, possibleName, parent, nameInParent){
        if (callback) parent = AST_data;
        
        _.each(AST_data, function(item, index){
            if (item !== null) {
                possibleName = context.findFunctionExpressionName(item, possibleName);
                
                // Matching function expressions and calls
                if (item.hasOwnProperty('type') && item.type === 'FunctionDeclaration' || item.type === 'FunctionExpression'){
                    context.addFunctionDeclaration(item, possibleName, parent, nameInParent);
                    possibleName = null;
                }
                
                context.toContinue(item, function(){
                    context.findFunctionDeclarations(item, null, possibleName, AST_data, index);
                });
            }
        });
        
        if (callback) callback();
    }
    
    // Decides if the current item is worth investigation, if so recurse
    this.toContinue = function(item, callback){
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
            return callback();
        }
        return true;
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
        else {
            console.log(function_data);
            throw('Error: A function declaration has no name!');
        }
            
        context.functionDeclarations[name] = {
            data: function_data,
            parent: parent,
            nameInParent: nameInParent
        }
    }
    
    // Finds all function calls that corespond to the number of found functionDeclarations
    // ISSUES:
    // 1. (address + "").split() style calls will not be detected
    // 2. Passed in callbacks
    this.findFunctionCalls = function(AST_data, functionNames, callback, possibleName, parent, nameInParent){
        _.each(AST_data, function(item, index){
            if (callback) parent = AST_data;
            
            if (item !== null) {
                // When function is anonymous it will be bound to another variable
                if (u.hasOwnPropertyChain(item, 'property', 'name')){
                    if (u.nullOrUndefined(possibleName))
                        possibleName = item.property.name;
                    else
                        possibleName += '.' + item.property.name;
                }
                
                // Add all the found functions if they don't already exist
                _.each(context.checkForCalls(item, parent), function(foundItem){
                    // Try to find the name given that there is a callee
                    var name = context.findCallExpressionName(foundItem.call);
                    
                    // Check for a duplicate entry before adding (See checkForCalls)
                    var duplicate = false;
                    for (var i = 0; i < context.functionCalls.length && !duplicate; i++){
                        if (context.getLineNumber(context.functionCalls[i].data) === context.getLineNumber(foundItem)
                            && context.functionCalls[i].fullName === name)
                            duplicate = true;
                    }
                    
                    // Add the item
                    if (!duplicate){
                        context.functionCalls.push({
                            fullName: name,
                            simpleName: context.extractSimpleName(name),
                            data: _.clone(foundItem.call),
                            parent: parent,
                            nameInParent: nameInParent,
                            assignmentExp: foundItem.assignment,
                            assignmentExpParent: foundItem.parent
                        });
                    }
                });
                
                context.toContinue(item, function(){
                    context.findFunctionCalls(item, functionNames, null, possibleName, AST_data, index);
                });
            }
        });
            
        if (callback) callback();
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
            name = context.searchObjectForNames(callExpression.object, name);
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
    
    // find simple name, normally last part in split but not if there is a call or apply modifier
    // see these links for how call and apply work:
    // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/call
    // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/apply
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
    
    // Decide on the functions to merge using a nueral network if applicable and writes the statistics of the merged function pairs
    this.mergeFunctions = function(callback, network, printMerges){
        this.functionCalls = context.trimFunctionCalls();
        return context.mergeSimilarFunctions(callback, network, printMerges);
    }
    
    // Eliminate function calls that have no found definitions and clean them up by storing the call name and
    // proper call name (e.g. red vs this.selector.red)) seperately
    this.trimFunctionCalls = function(){
        var newFunctionCalls = [];
        var functionDeclarationNames = _.map(this.functionDeclarations, function(funct, name){ return name; });
        
        // Only add function calls that have been declared in file  
        _.each(this.functionCalls, function(call){
            if(_.contains(functionDeclarationNames, call.simpleName))
                newFunctionCalls.push(call);
        });
        
        return newFunctionCalls;
    }
    
    // Decide when to minify similar functions and record data on minified functions, if a nueral network is present gathers
    // statistics then sends them to its checking function
    this.mergeSimilarFunctions = function(callback, network, printMerges){
        var MIN_SEPERATION = 1;// Cannot merge function calls on the same line (TODO: maybe the nueral net can detect this??)
        var MAX_SEPERATION = 5;// Only merge function calls that are this many lines apart
        
        // Redorder function calls by start location, any calls within short range of each other are candidates
        // for merging.
        context.functionCalls.sort(function(callX, callY) {
            return callX.data.loc.start.line - callY.data.loc.start.line;
        });
        
        var previous = null;
        var merges = 0;
        
        // Reversed so data that needs to be copied can be inserted at the beggining instead of end
        context.functionCalls.reverse().forEach(function(contents, index){
            if (previous !== null){
                var seperation = Math.abs(context.getLineNumber(contents) - context.getLineNumber(previous));
                if (seperation <= MAX_SEPERATION && seperation >= MIN_SEPERATION
                    && previous.simpleName !== contents.simpleName){//<- no point to merge same name functions, would result in code doubling
                    var previousFunction = context.functionDeclarations[previous.simpleName];
                    var contentsFunction = context.functionDeclarations[contents.simpleName];
                    
                    var statistics = context.functionStatistics.add(previous, contents, previousFunction, contentsFunction);
                    if (u.nullOrUndefined(network) || network.canMerge(statistics)){
                        if (printMerges)
                            console.log('  merging: ' + contents.simpleName + "-" + previous.simpleName);
                        merges += 1;
                        
                        context.mergeFunction.merge(previous, contents, previousFunction, contentsFunction, function(){
                            return true;
                        });
                    }
                    
                    
                    // Deleted function shouldn't serve as a basis for adding to functions
                    contents = previous;
                }
            }
            previous = contents;
        });
        if (printMerges) console.log('merged ' + merges + ' functions.\n');
        
        context.functionStatistics.print(context.files.mergeData);
        return callback();
    }
    
    this.getLineNumber = function(item){
        if (u.hasOwnPropertyChain(item, 'data', 'loc', 'start', 'line'))
            return item.data.loc.start.line;
        return -1;
    }
    
    return this;
}
