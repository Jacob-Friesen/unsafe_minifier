var _ = require('lodash');

var u = require('../utility.js'),
    messages = new require('../messages.js')(),
    FindFunctions = require('./find_functions.js'),
    MergeFunction = require('./merge_function.js'),
    FunctionStatistics = require('../generation/function_statistics.js');

// Handles function merging for the given AST.
module.exports = function MergeFunctions(files, AST){
    if (u.nullOrUndefined(files) || u.nullOrUndefined(AST) || u.nullOrUndefined(AST.body))
        messages.merging.noFilesAST().error();
        
    var _this = this;
    this.mergeFunction = new MergeFunction();
    this.functionStatistics = new FunctionStatistics();
    this.findFunctions = new FindFunctions();
    this.files = files;

    // How far apart in terms of lines similar functions can be
    this.MIN_SEPERATION = 1;// No same line merges
    this.MAX_SEPERATION = 5;
        
    // Merges the functions calling the callback with the returned AST, if a nueral network is included the network is used to determine if a merge is
    // appropriate.
    this.merge = function(fileName, callback, network){
        if (!u.nullOrUndefined(fileName))
            messages.merging.file(fileName).send();
        else
            messages.merging.noFile().send();
        
        // Find function declerations in the AST..
        this.findFunctions.findDeclarations(AST.body);

        // ... and then use those to find any that calls them
        var functionNames = _.map(this.findFunctions.declarations, function(funct, name){ return name; });
        this.findFunctions.findCalls(AST.body, functionNames);
            
        // Find which functions can be combined
        this.findFunctions.trimCalls();
        this.combineFunctions(network);

        if (_.isFunction(callback)) callback(AST);
    }
    
    // Decide when to minify similar functions and record data on minified functions, if a nueral network is present gathers statistics then sends
    // them to its checking function. The network object is defined in Minification/index.js.
    this.combineFunctions = function(network){
        this.findFunctions.sortCalls();
        
        var previous = null,
            merges = 0;
        _this.findFunctions.calls.forEach(function(contents, index){
            if (previous !== null){

                var seperation = Math.abs(u.getLineNumber(contents.data) - u.getLineNumber(previous.data));
                if (seperation <= _this.MAX_SEPERATION && seperation >= _this.MIN_SEPERATION && previous.simpleName !== contents.simpleName){
                    var previousFunction = _this.findFunctions.declarations[previous.simpleName],
                        contentsFunction = _this.findFunctions.declarations[contents.simpleName];
                    
                    var statistics = _this.functionStatistics.add(previous, contents, previousFunction, contentsFunction);
                    if (u.nullOrUndefined(network) || network.canMerge(statistics)){
                        messages.merging.merge(contents.simpleName, previous.simpleName).send();
                        
                        _this.mergeFunction.merge(previous, contents, previousFunction, contentsFunction);

                        merges += 1;
                    }
                    
                    // Deleted function shouldn't serve as a basis for adding to functions
                    contents = previous;
                }
            }
            previous = contents;
        });
        messages.merging.total(merges).send();
        
        _this.functionStatistics.print(_this.files.mergeData);

        return true;
    }
    
    return this;
}