var fs = require('fs'),
    esprima = require("esprima"),
    escodegen = require("escodegen"),
    fann = require('node_fann'),
    exec = require('child_process').exec;

var u = require('../utility_functions.js'),
    mergeFunctions = require('../AST_modification/merge_functions'),
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
    this.NETWORKS = 5;// Number of networks to use when deciding
    this.PRINT_MERGES = true;// Print functions merged when that state is reached
    
    // object decides whether a function can be merged, sent through merge functions to be used.
    var mergeDecider = {
        networks: [],
        
        // Use all the networks to come to a consensus on the whether a function should be minified
        canMerge: function(statistics){
            var training = new Training(files),
                data = training.formatDataPoint(statistics);
            
            var networkTotal = 0;
            this.networks.forEach(function(network){
                networkTotal += network.getResultOf(data[0])
                //console.log(networkTotal);
            });
            
            if (networkTotal > this.networks.length/2)
                return true;
            return false;
        }
    }
    
    // load the network then use it to minify the file correctly (hopefully at least the ann is no 100% accurate)
    this.minifyFile = function(file, callback){
        console.log('\nminifying file...');
        
        this.loadNetworks(function(neuralNetworks){
            mergeDecider.networks = neuralNetworks;
            
            console.log('found networks');
            return fs.readFile(file, 'utf8', function (err, data) {
                if (err) throw err;
                
                // Makes new_file object equal to each file[0]
                var new_files = {};
                for (_file in files)
                    new_files[_file] = files[_file][0];
                
                // Merge all the functions in the file using the merge decider to decide if the file can be minified.
                var merge = new mergeFunctions(new_files, esprima.parse(data, {loc: true, comment: true}));
                return merge.merge(file, function(AST){
                    var newFile = file.replace('.js', '.min.js'); 
                    
                    fs.writeFile(newFile, escodegen.generate(AST), function (err) {
                        if (err) throw err;
                        console.log('AI merged file has been written to ' + newFile);
                        
                        var finalFile = file.replace('.js','.full.min.js') 
                        exec('java -jar safe_minifier/compiler.jar --js='+newFile+' --js_output_file='+finalFile, function(err){
                            if (err) throw(err);
                            console.log('Fully merged file has been written to ' + finalFile);
                            
                            var safeFile = file.replace('.js','.safe.min.js') 
                            exec('java -jar safe_minifier/compiler.jar --js='+file+' --js_output_file='+safeFile, function(err){
                                if (err) throw(err);
                                console.log('Safely minified file has been written to ' + safeFile + '\n');
                                
                                if (callback) callback();
                            });
                        });
                    });
                }, mergeDecider, _this.PRINT_MERGES); 
            });
        });
    };
    
    // Loads the network data from 5 nueral networks constructing a nueral network from their data. Sends the retrieved networks in the callback
    this.loadNetworks = function(callback){
        (function read(toRead, networks){            
            var file = files.neuralNetwork[0].replace('.json',toRead + '.json');
            return fs.readFile(file, 'utf8', function (err, data) {
                if (err) throw err;
                
                data = JSON.parse(data);
                var neuralNetwork = new NeuralNetwork(data.layerSizes[0], data.layerSizes[1], data.layerSizes[2]);
                neuralNetwork.network.set_weight_array(data.weights);
                networks.push(neuralNetwork);
                
                console.log('loaded network from ' + file);
                if (toRead > 0)
                    return read(toRead - 1, networks);
                else
                    return callback(networks);
            });
        })(this.NETWORKS - 1, []);
    };
    
    return this;
}
