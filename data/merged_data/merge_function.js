var _ = require('underscore');
var esprima = require('esprima');
var escodegen = require('escodegen');
var u = require('../utility_functions.js');
var ReturnHandler = require('./return_handler.js');
var util = require('util');
module.exports = function mergeFunction() {
    var merges = [];
    var mergeName = null;
    this.returnHandler = ReturnHandler();
    this.merge = function (callMergeTo, callMergeFrom, functionMergeTo, functionMergeFrom, callback) {
        mergeName = callMergeTo.simpleName + '-' + callMergeFrom.simpleName;
        this.mergeFunctions(callMergeTo, callMergeFrom, functionMergeTo, functionMergeFrom);
        merges.push(mergeName);
        return callback();
    };
    this.mergeCalls = null;
    this.mergeFunctions = function (mergeTo, mergeFrom, mergeTo, mergeFrom) {
        {
            if (u.hasOwnPropertyChain(mergeTo.data, 'arguments') && u.hasOwnPropertyChain(mergeFrom.data, 'arguments')) {
                _.each(mergeFrom.data.arguments.reverse(), function (item) {
                    if (!_.contains(mergeTo.data.arguments, item))
                        mergeTo.data.arguments.unshift(item);
                });
                mergeFrom.data.arguments.reverse();
            } else
                throw 'Error: Second calls arguments could not be copied into the first';
            this.removeItemFromParent(mergeFrom, mergeTo);
            if (mergeTo.assignmentExp != null && mergeFrom.assignmentExp != null) {
                var fromVar = mergeFrom.assignmentExp.left;
                var toVar = mergeTo.assignmentExp.left;
                _.each(mergeTo.assignmentExpParent, function (item, index) {
                    if (u.hasOwnPropertyChain(item, 'loc', 'start', 'line') && item.loc.start.line === mergeTo.assignmentExp.loc.start.line)
                        addSplittingVariables(index);
                });
                function addSplittingVariables(index) {
                    var varFor1 = mergeFrom.assignmentExpParent.type === 'AssignmentExpression' ? 'var ' : '';
                    var varFor2 = mergeTo.assignmentExpParent.type === 'AssignmentExpression' ? 'var ' : '';
                    mergeTo.assignmentExpParent.splice(index + 1, 0, esprima.parse(varFor1 + mergeFrom.assignmentExp.left.name + ' = _r[0];', { loc: true }));
                    mergeTo.assignmentExpParent.splice(index + 2, 0, esprima.parse(varFor2 + mergeTo.assignmentExp.left.name + ' = _r[1];', { loc: true }));
                    mergeTo.assignmentExp.left.name = '_r';
                    var code = escodegen.generate(mergeTo.assignmentExp);
                    var varForMain = code.indexOf('+') < 0 ? 'var ' : '';
                    mergeTo.assignmentExpParent.splice(index, 0, esprima.parse(varForMain + code, { loc: true }));
                    mergeTo.assignmentExpParent.remove(index + 1);
                }
            }
        }
        if (u.hasOwnPropertyChain(mergeTo.data, 'params') && u.hasOwnPropertyChain(mergeFrom.data, 'params')) {
            _.each(mergeFrom.data.params.reverse(), function (item) {
                if (!_.contains(mergeTo.data.params, item)) {
                    mergeTo.data.params.unshift(item);
                }
            });
            mergeFrom.data.params.reverse();
        } else
            throw 'Error: Second function parameters could not be copied into the first';
        if (u.hasOwnPropertyChain(mergeTo.data, 'body', 'body') && u.hasOwnPropertyChain(mergeFrom.data, 'body', 'body')) {
            if (!this.isDuplicateInsert()) {
                var toInsert = {
                        type: 'BlockStatement',
                        body: mergeFrom.data.body.body
                    };
                if (_.last(mergeFrom.data.body.body).type === 'ReturnStatement')
                    this.returnHandler.moveReturns(mergeTo.data.body.body, mergeFrom.data.body.body, mergeFrom.data.body);
                else
                    mergeTo.data.body.body.unshift(toInsert);
            }
        } else
            throw 'Error: Second function body could not be copied into the first';
        this.removeItemFromParent(mergeFrom, mergeTo);
        return [
            true,
            true
        ];
    };
    this.removeFromParentArray = function (toRemove, parent) {
        _.each(parent, function (item, index) {
            if (u.hasOwnPropertyChain(item, 'loc', 'start', 'line') && u.hasOwnPropertyChain(toRemove, 'loc', 'start', 'line') && item.loc.start.line === toRemove.loc.start.line) {
                parent.remove(index);
                return true;
            }
        });
        return true;
    };
    this.removeItemFromParent = function (mergeFrom, mergeTo) {
        if (_.isArray(mergeFrom.parent))
            this.removeFromParentArray(mergeFrom.data, mergeFrom.parent);
        else if (u.hasOwnPropertyChain(mergeTo.parent, 'type') && mergeTo.parent.type === 'IfStatement') {
            if (mergeFrom.nameInParent === 'consequent') {
                mergeFrom.parent['consequent'] = mergeFrom.parent['alternate'];
                mergeFrom.parent['alternate'] = null;
            } else
                mergeFrom.parent[mergeFrom.nameInParent] = [];
        } else {
            if (mergeFrom.nameInParent === 'body')
                this.removeFromParentArray(mergeFrom.data, mergeFrom.parent.body);
            else
                mergeFrom.parent[mergeFrom.nameInParent] = [];
        }
        return true;
    };
    this.isDuplicateInsert = function () {
        return _.contains(merges, mergeName);
    };
    return this;
};