var fs = require('fs'),
    util = require('util'),
    fann = require('fann'),
    _ = require('lodash');

var u = require('../utility_functions.js'),
    messages = new require('../messages.js')(),
    NeuralNetwork = require('./neural_network.js');

// Handles training the networks and saving them.
module.exports = function Trainer(files){
    if (u.nullOrUndefined(files))
        messages.training.filesNotSpecified().error();

    this.NeuralNetwork = NeuralNetwork;

    this.PARTITION = 0.7;// Training portion out of 1.
    this.ERROR_RATE = 0.1;// For each network.
    this.HIDDEN_SIZE = 4;// Multiple of input size.
    this.NETWORKS = 5;// Number of networks to create, highly recommended to disable SAVE_NETWORKS when using a large number.
    this.SAVE_NETWORKS = true;// All the networks will be saved, but the minification will only use the first 5.

    this.PRINT_DATA_STATS = true;// Print statistics of initial data before partitioning and equalizing yes/nos.
    this.PRINT_FANN_OUTPUT = false;// Whether FANN based output will appear.
    this.PRINT_NETWORK_STATS = false;// Print statistics of individual networks.

    var _this = this;
    
    // Trains the network by fetching the file contained in combinedData
    this.train = function(callback){
        fs.readFile(files.combinedData[0], 'utf8', function (err, data) {
            if (err) throw err;
            var combinedData = JSON.parse(data);
            
            // Give a representation of valid to invalids (yes/no's)
            if (messages.training.print){
                var yes = 0,
                    no = 0;
                combinedData.forEach(function(dataPoint){
                    if (dataPoint.valid === 'yes') yes += 1;
                    else no += 1;
                });

                messages.training.yesNoStats(yes, no, combinedData.length).send();
            }
            
            _this.runTraining(combinedData, callback);
        });
    };

    // Trains and validates the nueral networks, uses combined data in the format:
    // [{
    //      name: 'test-1',
    //      param1: param1Val,
    //      ...
    //      paramN: paramNVal,
    //      valid: <'yes'/'no'>
    // },
    // ...
    // ]
    // Returns the networks [total, positive, negative] success rates.
    this.runTraining = (function(combinedData, callback){
        
        // Run the network, displaying the average success rate after calling the callback if it has been run enough times.
        var totalSuccess = [0,0,0];
        return (function run(time){
            var organized = _this.evenizeData(_this.formatData(combinedData)),
                partitions = _this.partitionData(organized);

            return _this.runNetwork(partitions.training, partitions.testing, _this.SAVE_NETWORKS, time, function(success, positives, negatives){
                totalSuccess = [totalSuccess[0] + success, totalSuccess[1] + positives, totalSuccess[2] + negatives];

                if (time < _this.NETWORKS - 1)
                    return run(time + 1);
                else {
                    messages.training.averageStats(_this.NETWORKS, totalSuccess).send();

                    if (callback) return callback();
                }
            });
        })(0);

    }).defaults([]);
    
    // Turns all data into numeric values and puts it into the correct array form specified in train network.
    this.formatData = (function(data){
        var newData = [];
        data.forEach(function(dataPoint){            
            newData.push(_this.formatDataPoint(dataPoint));
        });
        
        return newData;
    }).defaultsWith(u.nullOrUndefined, []);
    
    // Transform all data in a data point to a number. Returns an array:
    // [[1,2,...], [0]] <- 0 for invalid, 1 for valid
    this.formatDataPoint = (function(point){
        // Put input data into array form turning characters into thier ascii numbers
        var inputs = [];
        _.reject(point, function(__, attr){ return attr === 'name' || attr === 'valid' }).forEach(function(part){
            if (typeof part === "string")
                inputs.push(part.charCodeAt(0));// Take first char of every string value
            else // Assuming an integer
                inputs.push(part);
        });
        
        return [inputs, [(point.valid === 'yes') ? 1 : 0]];
    }).defaultsWith(u.nullOrUndefined, []);
    
    // Makes the ratio of invalid to valid cases equal and returns the array. Does this randomly. Only takes formatted data.
    // [
    //      [[input1,input2,...,inputn], [output1,output2,...,outputn]],
    //      ...
    // ]
    // Returns the modified data.
    this.evenizeData = (function(data){
        var newData = [];
        
        // Find ratio of each: invalid/valid
        ratio = [0,0];
        data.forEach(function(point){
           (point[1] == 1) ? ratio[1] += 1 : ratio[0] += 1;
        });
        var min = _.min(ratio);
        
        // Randomly pick values for ratios, until both data points sets are filled up
        found = [0,0];
        while (found[0] + found[1] < min * 2 && data.length > 0){
            var point = u.randomInt(0, data.length - 1);

            if (data[point][1] == 0 && found[0] < min){
                found[0] += 1;
                newData.push(data[point]);
            }
            else if (data[point][1] == 1 && found[1] < min){
                found[1] += 1;
                newData.push(data[point]);
            }
            data.remove(point);//prevent duplicates
        }
        
        return newData;
    }).defaultsWith(u.nullOrUndefined, []);
    
    // Partitions the data randomly according to the partition amount modifies sent in data.
    this.partitionData = (function(data){
        var training = [];
        
        var portionNeeded = data.length * _this.PARTITION;
        while (training.length < portionNeeded){
            var point = u.randomInt(0, data.length - 1);
            training.push(data[point]);
            data.remove(point);
        };
        
        return {training: training, testing: data};
    }).defaultsWith(u.nullOrUndefined, []);
    
    // Trains and tests then saves (if toSave is true) the nueral network with the available data. Training and testing data must be in the form:
    // [
    //      [[input1,input2,...,inputn], [output1,output2,...,outputn]],
    //      ...
    // ]
    // Gives the callback all three of the rates for the network once tested.
    this.runNetwork = function(training, testing, toSave, index, callback){
        if ( !_.isEmpty(training) && (!_.isArray(training[0]) || !_.isArray(training[0][0]) || !_.isArray(training[0][1])) ) 
            messages.training.wrongTrainingDataFormat().error();

        var rates = [0,0,0],
            neuralNetwork = {network: {}};
        if (!_.isEmpty(training)){_
            var neuralNetwork = new _this.NeuralNetwork(training[0][0].length, training[0][0].length * _this.HIDDEN_SIZE, training[0][1].length);
            neuralNetwork.train(training, _this.ERROR_RATE, _this.PRINT_FANN_OUTPUT);

            rates = neuralNetwork.test(testing, _this.PRINT_NETWORK_STATS);
        }
        
        if (toSave && neuralNetwork.save){
            return neuralNetwork.save(files.neuralNetwork[0].replace('.json', index + '.json'), function(){
                if (callback) return callback(rates[0], rates[1], rates[2], neuralNetwork.network);
            });
        }

        if (callback) return callback(rates[0], rates[1], rates[2], neuralNetwork.network);
    };
    
    return this;
}
