var fs = require('fs'),
    esprima = require("esprima"),
    escodegen = require("escodegen"),
    _ = require('lodash');

var MergeFunctions = require('../AST_modification/merge_functions'),
    u = require('../utility.js');

// Generates test data needed for training.
module.exports = function Generator(rawDataDirectory, mergedDataDirectory, files){
    this.MergeFunctions = MergeFunctions;

    if (u.nullOrUndefined(rawDataDirectory) || u.nullOrUndefined(mergedDataDirectory))
        messages.generation.rawMergedDirectories().error();
    if (u.nullOrUndefined(files))
        messages.generation.filesNotSpecified().error();
    
    this.once_done = null;
    var _this = this;
    
    // Generate the data and put it in the specified output file, sets this.AST to the new AST. Also, clears all files specified in files that are
    // specified to be cleared in main.
    this.generateData = function(filenames, callback){
        files = this.clearFileData(files);
        if (u.nullOrUndefined(filenames))
            var filenames = this.getFileList(rawDataDirectory);
        
        // Load each file and perform merge operations on it
        var merges = 0;
        filenames.forEach(function(file, index){
            fs.readFile(rawDataDirectory + "/" + file, 'utf8', function (err, data) {
                if (err) throw err;
                
                var merge = new _this.MergeFunctions(files, esprima.parse(data, {loc: true, comment: true}));
                merge.merge(file, function(AST){
                    
                    _this.writeToMergedFile(mergedDataDirectory, file, AST, function(){
                        merges += 1;
                        if (merges === filenames.length)
                            _this.mergeStatsWithValidation(files.mergeData, files.validMerges, files.combinedData, callback);
                    });
                }, null);
            });
        });
    }

    // Clears each file specified with the second array element as true, returns newFile object with {fileType: location, ...}
    this.clearFileData = function(files){
        var newFiles = {};
        for (file in files){
            if (_.isArray(files[file])){
                if (files[file][1]) 
                    fs.writeFileSync(files[file][0], '');
                newFiles[file] = files[file][0];
            }
        }

        return newFiles;
    }

    // Gets the list of files for the given directory removing all temporary files (which should be marked with ~ at the end). Returns [] with no
    // specified directory.
    this.getFileList = function(directory){
        if (u.nullOrUndefined(directory))
            return [];

        var filenames = fs.readdirSync(directory);
        return _.reject(filenames, function(name){ return name.slice(-1) === '~' });// Remove temporary files
    }
    
    // Write the modified AST results to the specific file in the directory
    this.writeToMergedFile = function(directory, name, data, callback){
        fs.writeFile(directory + '/' + name, escodegen.generate(data), function (err) {
            if (err) throw err;
            return callback();
        });
    };
    
    // Merges the functions stats with the validation data and writes to the specified combined file
    this.mergeStatsWithValidation = function(mergeData, validMerges, combinedData, callback){
        if (u.nullOrUndefined(mergeData))
            return callback();
        if (u.nullOrUndefined(validMerges) || u.nullOrUndefined(combinedData))
            messages.generation.noValidMergesCombinedData().error();

        fs.readFile(mergeData, 'utf8', function(err, functionData) {
            if (err) throw err;
            
            fs.readFile(validMerges, 'utf8', function(err, validData) {
                validData = JSON.parse(validData);
                functionData = u.getJSONFile(functionData);
                
                if (functionData !== null){
                    functionData.forEach(function(statistic){
                        statistic.valid = validData[statistic.name];
                    });
                }
                
                fs.writeFile(combinedData, JSON.stringify(functionData), function (err) {
                    if (err) throw err;
                    return callback();
                });
            });
        });
    };
    
    return this;
}