var fs = require('fs');
var esprima = require("esprima");
var escodegen = require("escodegen");
var _ = require('lodash');

var mergeFunctions = require('../AST_modification/merge_functions');
var u = require('../utility_functions.js');

var PRINT_MERGES = true;

//constructor, needs base input file to generate the data combinations into the output file.
module.exports = function Generator(rawDataDirectory, mergedDataDirectory, files){
    if (u.nullOrUndefined(rawDataDirectory) || u.nullOrUndefined(mergedDataDirectory))
        messages.generation.rawMergedDirectories().error();
    if (u.nullOrUndefined(files))
        messages.generation.filesNotSpecified().error();
    
    this.once_done = null;
    var context = this;
    
    // Generate the data and put it in the specified output file, sets this.AST to the new AST. Also, clears all files specified in files that are
    // specified to be cleared in main.
    this.generateData = function(callback, filenames){
        // Clear all files in files, also makes new_file object equal to each file[0]
        var new_files = {};
        for (file in files){
            if (files[file][1]) fs.writeFileSync(files[file][0], '');
            new_files[file] = files[file][0];
        }
        
        // Get list of files to work with
        if (!filenames){
            var filenames = fs.readdirSync(rawDataDirectory);
                filenames = _.reject(filenames, function(name){ return name.slice(-1) === '~' });// Remove temporary files
        }
        
        // Load each file and perform merge operations on it
        var merges = 0;
        filenames.forEach(function(file, index){
            fs.readFile(rawDataDirectory + "/" + file, 'utf8', function (err, data) {
                if (err) throw err;
                
                var merge = new mergeFunctions(new_files, esprima.parse(data, {loc: true, comment: true}));
                merge.merge(file, function(AST){
                    
                    context.writeToMergedFile(file, AST, function(){
                        merges += 1;
                        if (merges === filenames.length)
                            context.mergeStatsWithValidation(callback);
                    });
                }, null, PRINT_MERGES);
            });
        });
    }
    
    // Write the modified AST results
    this.writeToMergedFile = function(name, data, callback){
        fs.writeFile(mergedDataDirectory + '/' + name, escodegen.generate(data), function (err) {
            if (err) throw err;
            return callback();
        });
    };
    
    // Merges the functions stats with the validation data and writes to the specified combined file
    this.mergeStatsWithValidation = function(callback){
        if (!files.mergeData || !files.mergeData[0])
            return callback();

        fs.readFile(files.mergeData[0], 'utf8', function (err, functionData) {
            if (err) throw err;
            
            fs.readFile(files.validMerges[0], 'utf8', function (err, validData) {
                validData = JSON.parse(validData);
                functionData = u.getJSONFile(functionData);
                
                functionData.forEach(function(statistic){
                    statistic.valid = validData[statistic.name];
                });
                
                fs.writeFile(files.combinedData[0], JSON.stringify(functionData), function (err) {
                    if (err) throw err;
                    return callback();
                });
            });
        });
    };
    
    return this;
}