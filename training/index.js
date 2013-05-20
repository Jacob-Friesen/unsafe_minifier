var fs = require('fs');
var util = require('util');
var fann = require('node_fann');
var _ = require('lodash');

var u = require('../utility_functions.js');
var NueralNetwork = require('./nueral_network.js');

var PARTITION = 0.7;// Training portion out of 1
var ERROR_RATE = 0.1;// For each network
var HIDDEN_SIZE = 4;// Multiple of input size

var PRINT_DATA_STATS = true;// Print statistics of initial data before partitioning and equalizing yes/nos
var PRINT_FANN_OUTPUT = false;// Whether FANN based output will appear
var PRINT_NETWORK_STATS = false;// Print statistics of individual networks
var PRINT_AVERAGE_STATS = true;// Print statistics across all network creations
var SAVE_NETWORKS = true;// All the networks will be saved, but the minification will only use the first 5
var NETWORKS = 5;// Number of networks to create, highly recommended to disable SAVE_NETWORKS when using a large number

// Handles training the networks and saving them.
module.exports = function train(files){
    if (u.nullOrUndefined(files))
        throw('Error: files must be specified in main.js.');
    var _this = this;
    
    this.train = function(callback){
        console.log('\ntraining data...');
        
        // get function statistics
        fs.readFile(files.combinedData[0], 'utf8', function (err, data) {
            if (err) throw err;
            var combinedData = JSON.parse(data);
            
            // Look at data representation
            if (PRINT_DATA_STATS){
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
                return _this.runNetwork(dataPartitions.training, dataPartitions.test, SAVE_NETWORKS, time, function(success, positives, negatives){
                    totalSuccess = [totalSuccess[0] + success, totalSuccess[1] + positives, totalSuccess[2] + negatives];
                    if (time < NETWORKS - 1)
                        return run(time + 1);
                    else{
                        if (PRINT_AVERAGE_STATS){
                            console.log('\n' + NETWORKS + ' Accuracy: ' + totalSuccess[0]/NETWORKS);
                            console.log('Precision: ' + totalSuccess[1]/NETWORKS);
                            console.log('Negatives Rate: ' + totalSuccess[2]/NETWORKS);
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
        
        //console.log('evenized\n',newData);
        return newData;
    };
    
    // Partitions the data randomly according to the partition amount 
    this.partitionData = function(data){
        var training = [];
        
        var portionNeeded = data.length * PARTITION;
        while (training.length < portionNeeded){
            point = u.randomInt(0, data.length - 1);
            training.push(data[point]);
            data.remove(point);
        };
        
        return {training: training, test: data};
    };
    
    // Trains and tests then saves (if toSave is true) the nueral network with the available data. Training and testing data must be in the form:
    // [
    //      [[input1,input2,...,inputn], [output1,output2,...,outputn]],...
    // ]
    // Gives the callback the object containing the successRate and network.
    this.runNetwork = function(trainingData, testingData, toSave, index, callback){
        var nueralNetwork = new NueralNetwork(trainingData[0][0].length, trainingData[0][0].length * HIDDEN_SIZE, trainingData[0][1].length);
        nueralNetwork.train(trainingData, ERROR_RATE, PRINT_FANN_OUTPUT);
        var success = nueralNetwork.test(testingData, PRINT_NETWORK_STATS);
        
        if (toSave)
            return nueralNetwork.save(files.nueralNetwork[0].replace('.json',index + '.json'), function(){
                return callback(success[0], success[1], success[2], nueralNetwork.network);
            });
        return callback(success[0], success[1], success[2], nueralNetwork.network);
    };
    
    return this;
}
