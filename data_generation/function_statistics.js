var _ = require('lodash');
var fs = require('fs');

var u = require('../utility_functions.js');

// Records statistics by writing into an internal array (statistics) and can write JSON contents to a file.
module.exports = function functionStatistics(){
    var statistics = [
        //{
        //      name: <callTo-callFrom>
        //      numOfParamsTo: <num>,
        //      numOfParamsFrom: <num>
        //      etc.
        //},
    ]
    this.statistics = statistics;
    
    // Adds the sent in functions statistics to the function statistics list, returns statistics object that was generated.
    this.add = function(callTo, callFrom, functionTo, functionFrom){
        if (u.enu(callTo) || u.enu(callFrom) || u.enu(functionTo) || u.enu(functionFrom))
            return {};

        statistics.push({
            name: callFrom.simpleName + '-' + callTo.simpleName,
            
            // naming
            toChar1: callTo.simpleName[0],
            fromChar1: callFrom.simpleName[0],
            toCharLast: _.last(callTo.simpleName),
            fromCharLast: _.last(callFrom.simpleName),
            
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
        return _.last(statistics);
    }
    
    // Prints the set of function statistics to a file in CSV form. Data is not cleared it is appended. The header names are the names of the hash
    // params e.g. name.
    // Note: purely asynchronous just writes to the file as it pleases.
    this.printFunctionStatistics = function(toFile){
        var toWrite = '';
        if (statistics.length > 0)
            toWrite = JSON.stringify(statistics) + ",";
        
        // Append derived contents to the end of the specified file
        if (toFile){
            fs.appendFile(toFile, toWrite, function (err) {
                if (err) throw err;
            });
        }
    }
    
    return this;
}