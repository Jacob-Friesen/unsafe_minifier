var _ = require('lodash');
var fs = require('fs');

var u = require('../utility_functions.js');

// numFile indicates how early the current file write is
module.exports = function functionStatistics(){
    var functionStatistics = [
        //{
        //      name: <callTo-callFrom>
        //      numOfParamsTo: <num>,
        //      numOfParamsFrom: <num>
        //      etc.
        //},
    ]
    
    // Adds the sent in functions statistics to the function statistics list, returns the function that was statistized.
    this.addFunctionStatistics = function(callTo, callFrom, functionTo, functionFrom){
        functionStatistics.push({
            name: callFrom.simpleName + '-' + callTo.simpleName,
            
            // naming
            toChar1: callTo.simpleName[0],
            fromChar1: callFrom.simpleName[0],
            toCharLast: callTo.simpleName[callTo.simpleName.length - 1],
            fromCharLast: callFrom.simpleName[callFrom.simpleName.length - 1],
            
            // arguments and parameters
            paramsTo: functionTo.data.params.length,
            paramsFrom: functionFrom.data.params.length,
            argsTo: callTo.data.arguments.length,
            argsFrom: callFrom.data.arguments.length,
            
            // locational
            startTo: callTo.data.loc.start.line,
            startFrom: callFrom.data.loc.start.line
        });
        
        //synchronous will prevent later modifications affecting current analysis
        return _.last(functionStatistics);
    }
    
    // Prints the set of function statistics to a file in CSV form. Data is not cleared it is appended. The header names are the names of the hash
    // params e.g. name.
    // Note: purely asynchronous just writes to the file as it pleases.
    this.printFunctionStatistics = function(toFile){
        var toWrite = '';
        if (functionStatistics.length > 0)
            toWrite = JSON.stringify(functionStatistics) + ",";
        
        // Append derived contents to the end of the specified file
        if (toFile){
            fs.appendFile(toFile, toWrite, function (err) {
                if (err) throw err;
            });
        }
    }
    
    return this;
}