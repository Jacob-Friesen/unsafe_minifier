var fs = require('fs'),
    esprima = require("esprima"),
    escodegen = require("escodegen"),
    fann = require('node_fann'),
    child_process = require('child_process');

var u = require('../utility_functions.js'),
    messages = new require('../messages.js')(),
    MergeFunctions = require('../AST_modification/merge_functions'),
    Training = require('../training'),
    NeuralNetwork = require('../training/neural_network.js');

// Handles Minifying the code. Reads the file and neural network data to parse through it and apply appropriate transformations. The results are
// in three output files:
// <filename>.min.js: file with just the unsafe minifications applied
// <filename>.safe.min.js: file with just the safe (external library) minifications applied
// <filename>.full.min.js: file with the unsafe minifications applied, then the safe ones
module.exports = function Minification(files){
    if (u.enu(files))
        messages.minification.filesNotSpecified().error();

    var _this = this;

    this.Training = Training;
    this.NeuralNetwork = NeuralNetwork;
    this.MergeFunctions = MergeFunctions;
    this.NETWORKS = 5;// Number of networks to use when deciding
    this.PRINT_MERGES = true;// Print functions merged when that state is reached
    
    // object decides whether a function can be merged, sent through merge functions to be used.
    this.mergeDecider = {
        networks: [],
        
        // Use all the networks to come to a consensus on the whether a function should be minified
        canMerge: function(statistics){
            var training = new Training(files),
                data = training.formatDataPoint(statistics);
            
            var networkTotal = 0;
            this.networks.forEach(function(network){
                networkTotal += network.getResultOf(data[0]);
            });
            
            if (networkTotal > this.networks.length/2)
                return true;
            return false;
        }
    }
    
    // load the network then use it to minify the file correctly (hopefully at least the ann is no 100% accurate)
    this.minifyFile = (function(toMinify, callback){
        // Makes new_file object equal to each file[0]
        var newFiles = {};
        for (file in files)
            newFiles[file] = files[file][0];
        
        this.loadNetworks(newFiles.neuralNetwork, function(neuralNetworks){
            _this.mergeDecider.networks = neuralNetworks;

            return fs.readFile(toMinify, 'utf8', function (err, data) {
                if (err) throw err;
                
                _this.doMerges(toMinify, data, newFiles, callback);
            });
        });
    }).defaultsWith(u.nullOrUndefined, '');

    // Merge all the functions in toMinify using the merge decider to decide if the file can be minified. Then write all the minified versions of the
    // files as described at the top of this file.
    this.doMerges = (function(toMinify, toMinifyData, files, callback){
        var merge = new _this.MergeFunctions(files, esprima.parse(toMinifyData, {loc: true, comment: true}));

        return merge.merge(toMinify, function(AST){
            _this.writeMinifiedFiles(toMinify, AST, callback);
        }, _this.mergeDecider, _this.PRINT_MERGES); 
    }).defaultsWith(u.nullOrUndefined, '', '');
    
    // Write all the minified versions of the files as described at the top of this file.
    this.writeMinifiedFiles = (function(toMinify, AST, callback){
        var unsafeMinified = toMinify.replace('.js', '.min.js');

        fs.writeFile(unsafeMinified, escodegen.generate(AST), function(err) {
            if (err) throw err;
            messages.minification.writtenUnsafe(unsafeMinified).send();
            
            var fullyMinified = toMinify.replace('.js','.full.min.js');
            child_process.exec('java -jar safe_minifier/compiler.jar --js='+unsafeMinified+' --js_output_file='+fullyMinified, function(err){
                if (err) throw(err);
                messages.minification.writtenFull(fullyMinified).send();
                
                var safeFile = toMinify.replace('.js','.safe.min.js');
                child_process.exec('java -jar safe_minifier/compiler.jar --js='+toMinify+' --js_output_file='+safeFile, function(err){
                    if (err) throw(err);
                    messages.minification.writtenSafe(safeFile).send();
                    
                    if (callback) callback();
                });
            });
        });
    }).defaultsWith(u.enu, '', {
        "type": "Program",
        "body": [
            {
                "type": "BlockStatement",
                "body": []
            }
        ]
    });

    // Loads the network data from NETWORKS nueral networks constructing a neural network from their data. It get the file names by appending the
    // current index down from NETWORKS to 0 to the neuralNetworkFile. Sends the retrieved networks as an array in the callback.
    this.loadNetworks = function(neuralNetworkFile, callback){
        (function read(toRead, networks){
            if (toRead < 0)
                return callback(networks);

            var file = neuralNetworkFile.replace('.json',toRead + '.json');

            return fs.readFile(file, 'utf8', function (err, data) {
                if (err) throw err;

                data = JSON.parse(data);

                var neuralNetwork = new _this.NeuralNetwork(data.layerSizes[0], data.layerSizes[1], data.layerSizes[2]);
                    neuralNetwork.network.set_weight_array(data.weights);
                networks.push(neuralNetwork);

                messages.minification.loadedNetwork(file).send();
                if (toRead > 0)
                    return read(toRead - 1, networks);
                else
                    return callback(networks);
            });
        })(this.NETWORKS - 1, []);
    };
    
    return this;
}
