var fs = require('fs'),
    util = require('util'),
    fann = require('node_fann'),
    _ = require('lodash');

var u = require('../utility_functions.js'),
    messages = new require('../messages.js')(),
    NeuralNetwork = require('./neural_network.js');

// Handles training the networks and saving them.
module.exports = function Trainer(files){
    if (u.nullOrUndefined(files))
        messages.training.filesNotSpecified().error();

    this.NeuralNetwork = NeuralNetwork;

    this.PARTITION = 0.7;// Training portion out of 1
    this.ERROR_RATE = 0.1;// For each network
    this.HIDDEN_SIZE = 4;// Multiple of input size
    this.NETWORKS = 5;// Number of networks to create, highly recommended to disable SAVE_NETWORKS when using a large number
    this.SAVE_NETWORKS = true;// All the networks will be saved, but the minification will only use the first 5

    this.PRINT_DATA_STATS = true;// Print statistics of initial data before partitioning and equalizing yes/nos
    this.PRINT_FANN_OUTPUT = false;// Whether FANN based output will appear
    this.PRINT_NETWORK_STATS = false;// Print statistics of individual networks
    this.PRINT_AVERAGE_STATS = true;// Print statistics across all network creations

    var _this = this;
    
    this.train = function(callback){
        console.log('\ntraining data...');
        
        // get function statistics
        fs.readFile(files.combinedData[0], 'utf8', function (err, data) {
            if (err) throw err;
            var combinedData = JSON.parse(data);
            
            // Look at data representation
            if (_this.PRINT_DATA_STATS){
                var yes = 0;
                var no = 0;
                combinedData.forEach(function(dataPoint){
                    if (dataPoint.valid === 'yes') yes += 1;
                    else no += 1;
                });
                console.log("Yes's:No's: " + yes + ":" + no);
                console.log("Yes:No Percentage: " + yes/combinedData.length + ":" + no/combinedData.length);
                console.log("Number of Data Points: " + combinedData.length);
            }
            
            var totalSuccess = [0,0,0];// total, positive, negative
            (function run(time){
                var organized = _this.evenizeData(_this.formatData(combinedData));
                var dataPartitions = _this.partitionData(organized);
                
                // Run the network, displaying the average success rate after calling the callback if it has ran enough times.
                return _this.runNetwork(dataPartitions.training, dataPartitions.test, _this.SAVE_NETWORKS, time, function(success, positives, negatives){
                    totalSuccess = [totalSuccess[0] + success, totalSuccess[1] + positives, totalSuccess[2] + negatives];
                    if (time < _this.NETWORKS - 1)
                        return run(time + 1);
                    else{
                        if (_this.PRINT_AVERAGE_STATS){
                            console.log('\n' + _this.NETWORKS + ' Accuracy: ' + totalSuccess[0]/_this.NETWORKS);
                            console.log('Precision: ' + totalSuccess[1]/_this.NETWORKS);
                            console.log('Negatives Rate: ' + totalSuccess[2]/_this.NETWORKS);
                        }
                        console.log();
                        return callback();
                    }
                });
            })(0);
        });
    };
    
    // Turns all data into numeric values and puts it into the correct array form specified in train network.
    this.formatData = function(data){
        var newData = [];
        data.forEach(function(dataPoint){            
            newData.push(_this.formatDataPoint(dataPoint));
        });
        
        return newData;
    };
    
    this.formatDataPoint = function(dataPoint){
        // Put input data into array form turning characters into thier ascii numbers
        var inputs = [];
        _.reject(dataPoint, function(__, attr){ return attr === 'name' ||  attr === 'valid'; }).forEach( function(part){
            if (typeof part ===  "string")
                inputs.push(part.charCodeAt(0));//take first char of every string value
            else//assuming an integer
                inputs.push(part);
        });
        
        return [inputs, [(dataPoint.valid === 'yes') ? 1 : 0]];
    };
    
    // Makes the ratio of invalid to valid cases equal and returns the array, only takes formatted data. Does this randomly.
    this.evenizeData = function(data){
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
    };
    
    // Partitions the data randomly according to the partition amount 
    this.partitionData = function(data){
        var training = [];
        
        var portionNeeded = data.length * _this.PARTITION;
        while (training.length < portionNeeded){
            point = u.randomInt(0, data.length - 1);
            training.push(data[point]);
            data.remove(point);
        };
        
        return {training: training, test: data};
    };
    
    // Trains and tests then saves (if toSave is true) the nueral network with the available data. Training and testing data must be in the form:
    // [
    //      [[input1,input2,...,inputn], [output1,output2,...,outputn]],
    //      ...
    // ]
    // Gives the callback all three of the rates for the network once tested.
    this.runNetwork = function(training, testing, toSave, index, callback){
        if (u.enu(training) || !_.isArray(training[0]) || !_.isArray(training[0][0]) || !_.isArray(training[0][1]))
            messages.training.wrongTrainingDataFormat().error();

        var neuralNetwork = new _this.NeuralNetwork(training[0][0].length, training[0][0].length * _this.HIDDEN_SIZE, training[0][1].length);
        neuralNetwork.train(training, _this.ERROR_RATE, _this.PRINT_FANN_OUTPUT);

        var rates = neuralNetwork.test(testing, _this.PRINT_NETWORK_STATS);
        
        if (toSave){
            return neuralNetwork.save(files.neuralNetwork[0].replace('.json', index + '.json'), function(){
                if (callback) return callback(rates[0], rates[1], rates[2], neuralNetwork.network);
            });
        }

        if (callback) return callback(rates[0], rates[1], rates[2], neuralNetwork.network);
    };
    
    return this;
}
