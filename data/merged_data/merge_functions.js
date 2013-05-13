var _ = require('underscore');
var u = require('../utility_functions.js');
var MergeFunction = require('./merge_function.js');
module.exports = function mergeFunctions(AST) {
    if (u.nullOrUndefined(AST))
        throw 'Error: a file AST must be sent in';
    var context = this;
    this.mergeFunction = MergeFunction();
    this.functionDeclarations = {};
    this.functionCalls = [];
    this.merge = function (callback) {
        console.log('merging file...');
    };
    this.findFunctionDeclarations = null;
    this.toContinue = function (item, callback) {
        if (u.nullOrUndefined(item))
            return false;
        if (_.isArray(item) || _.some([
                'expression',
                'expressions',
                'argument',
                'arguments',
                'left',
                'right',
                'object',
                'properties',
                'value',
                'declarations',
                'body',
                'consequent',
                'init'
            ], function (type) {
                return item.hasOwnProperty(type);
            })) {
            callback();
        } else {
        }
    };
    this.findFunctionExpressionName = function (contents, index, item, currentName) {
        {
            console.log(contents.simpleName + ':' + contents.data.loc.start.line);
            if (previous !== null) {
                var seperation = Math.abs(context.getLineNumber(contents) - context.getLineNumber(previous));
                if (seperation <= MAX_SEPERATION && seperation >= MIN_SEPERATION && previous.simpleName !== contents.simpleName) {
                    console.log('========\nmerge functions: ' + merges + '\n========');
                    var previousFunction = context.functionDeclarations[previous.simpleName];
                    var contentsFunction = context.functionDeclarations[contents.simpleName];
                    context.mergeFunction.merge(previous, contents, previousFunction, contentsFunction, function () {
                        if (index === context.functionCalls.length - 1)
                            return callback();
                        return true;
                    });
                    contents = previous;
                    merges += 1;
                }
            }
            previous = contents;
        }
        if (item.hasOwnProperty('property') && item.property.hasOwnProperty('name'))
            return item.property.name;
        else if (item.hasOwnProperty('key') && item.key.hasOwnProperty('name'))
            return item.key.name;
        return currentName;
    };
    this.addFunctionDeclaration = null;
    this.findFunctionCalls = null;
    this.checkForCalls = function (item, parent) {
        var found = [];
        if (u.hasOwnPropertyChain(item, 'type')) {
            if (item.type === 'CallExpression')
                found.push({
                    call: item,
                    assignment: null,
                    parent: parent
                });
            else if (item.type === 'AssignmentExpression' && u.hasOwnPropertyChain(item, 'right', 'type') && item.right.type === 'CallExpression')
                found.push({
                    call: item.right,
                    assignment: item,
                    parent: parent
                });
            else if (item.type === 'VariableDeclaration' && u.hasOwnPropertyChain(item, 'declarations', 'init', 'type') && item.declarations.init.type === 'CallExpression')
                found.push({
                    call: item.right,
                    assignment: item,
                    parent: parent
                });
        }
        return found;
    };
    this.findCallExpressionName = function findName(callExpression, name) {
        if (u.hasOwnPropertyChain(callExpression, 'object')) {
            name = context.searchObjectForNames(callExpression.object, name);
        }
        if (u.hasOwnPropertyChain(callExpression, 'callee', 'name')) {
            if (u.nullOrUndefined(name))
                name = callExpression.callee.name;
            else
                name += '.' + callExpression.callee.name;
        } else if (u.hasOwnPropertyChain(callExpression, 'callee', 'property', 'name')) {
            if (u.hasOwnPropertyChain(callExpression, 'callee', 'object', 'type') && callExpression.callee.object.type === 'ThisExpression') {
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
    };
    this.extractSimpleName = function (name) {
        if (u.nullOrUndefined(name))
            return name;
        var parts = name.split('.');
        var simpleName = parts.slice(-1).pop();
        if (simpleName === 'call' || simpleName === 'apply')
            simpleName = parts.slice(-2, -1).pop();
        return simpleName;
    };
    this.searchObjectForNames = function findName(object, name) {
        if (u.hasOwnPropertyChain(object, 'property'))
            name = findName(object.property, name);
        if (u.hasOwnPropertyChain(object, 'object'))
            name = findName(object.object, name);
        if (!u.hasOwnPropertyChain(object, 'type') && object.type == 'ThisExpression')
            return 'this' + '.' + name;
        else if (u.hasOwnPropertyChain(object, 'name')) {
            if (u.nullOrUndefined(name))
                return object.name;
            else
                return object.name + '.' + name;
        }
        return name;
    };
    this.mergeFunctions = function (function_data, possibleName, parent, nameInParent, AST_data, level, callback, possibleName, parent, nameInParent, AST_data, level, functionNames, callback, possibleName, parent, nameInParent, callback) {
        {
            {
                if (function_data.hasOwnProperty('id') && function_data.id !== null && function_data.id.hasOwnProperty('name'))
                    var name = function_data.id.name;
                else if (function_data.type === 'FunctionExpression') {
                    var name = 'anonymous';
                    if (!u.nullOrUndefined(possibleName))
                        name = possibleName;
                } else {
                    throw 'Error: A function declaration has no name!';
                    console.log(function_data);
                }
                context.functionDeclarations[name] = {
                    data: function_data,
                    parent: parent,
                    nameInParent: nameInParent
                };
            }
            {
                context.findFunctionCalls(item, level + 1, functionNames, callback, possibleName, AST_data, index);
            }
            if (level === 0)
                parent = AST_data;
            if (level === 0)
                callback.call(context);
        }
        {
            _.each(AST_data, function (item, index) {
                if (item !== null) {
                    if (u.hasOwnPropertyChain(item, 'property', 'name')) {
                        if (u.nullOrUndefined(possibleName))
                            possibleName = item.property.name;
                        else
                            possibleName += '.' + item.property.name;
                    }
                    _.each(context.checkForCalls(item, parent), function (foundItem) {
                        var name = context.findCallExpressionName(foundItem.call);
                        var duplicate = false;
                        for (var i = 0; i < context.functionCalls.length && !duplicate; i++) {
                            if (context.getLineNumber(context.functionCalls[i].data) === context.getLineNumber(foundItem) && context.functionCalls[i].fullName === name)
                                duplicate = true;
                        }
                        if (!duplicate) {
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
                    context.toContinue(item, function () {
                        context.findFunctionCalls(item, level + 1, functionNames, callback, possibleName, AST_data, index);
                    });
                }
            });
            if (level === 0)
                callback.call(context);
        }
        context.mergeSimilarFunctions(callback);
    };
    this.trimFunctionCalls = null;
    this.mergeSimilarFunctions = function (callback) {
        {
            var newFunctionCalls = [];
            var functionDeclarationNames = _.map(this.functionDeclarations, function (funct, name) {
                    return name;
                });
            _.each(this.functionCalls, function (call) {
                if (_.contains(functionDeclarationNames, call.simpleName))
                    newFunctionCalls.push(call);
            });
            this.functionCalls = newFunctionCalls;
        }
        var MIN_SEPERATION = 1;
        var MAX_SEPERATION = 5;
        console.log('sorting');
        context.functionCalls.sort(function (callX, callY) {
            return callX.data.loc.start.line - callY.data.loc.start.line;
        });
        console.log('\nreordered');
        var previous = null;
        var merges = 0;
        _.each(context.functionCalls.reverse(), function (contents, index) {
            console.log(contents.simpleName + ':' + contents.data.loc.start.line);
            if (previous !== null) {
                var seperation = Math.abs(context.getLineNumber(contents) - context.getLineNumber(previous));
                if (seperation <= MAX_SEPERATION && seperation >= MIN_SEPERATION && previous.simpleName !== contents.simpleName) {
                    console.log('========\nmerge functions: ' + merges + '\n========');
                    var previousFunction = context.functionDeclarations[previous.simpleName];
                    var contentsFunction = context.functionDeclarations[contents.simpleName];
                    context.mergeFunction.merge(previous, contents, previousFunction, contentsFunction, function () {
                        if (index === context.functionCalls.length - 1)
                            return callback();
                        return true;
                    });
                    contents = previous;
                    merges += 1;
                }
            }
            previous = contents;
        });
        return [
            true,
            callback()
        ];
    };
    this.getLineNumber = function (item) {
        if (u.hasOwnPropertyChain(item, 'data', 'loc', 'start', 'line'))
            return item.data.loc.start.line;
        return -1;
    };
    return this;
};