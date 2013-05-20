var fs = require('fs');
var util = require('util');
var fann = require('node_fann');
var _ = require('lodash');

var u = require('../utility_functions.js');

// Manages operations on a nueral network. Constructor takes the layer of networks and constructs a standard fully connected back-propogated network.
module.exports = function nueralNetwork(inputNum, hiddenNum, outputNum){
    if (u.nullOrUndefined(inputNum) || u.nullOrUndefined(hiddenNum) || u.nullOrUndefined(outputNum))
        throw('Error: The number of inputs, hidden and output nodes must be specified.');
    
    var _this = this;
    this.network = new fann.standard(inputNum, hiddenNum, outputNum);
    this.OUTPUT_THRESHOLD = 0.3;// Everything less than this will be negative.
    
    // Trains the network with the specified error rate 10 times or earlier if the error rate is reached. Prints FANN statistics if indicated.
    this.train = function(data, errorRate, printFann){
        if (printFann) printFann = 1
        else printFann = 0;
        
        _this.network.train(data, {error: errorRate, epochs: 10, epochs_between_reports: printFann});
    };
    
    // See how many correct results are obtained using the data sent in, returns total, postive, and negative success rates. Prints the success rate
    // along with the positive and negative success rates if print is given.
    this.test = function(data, print){
        var success = [0,0];
        var tries = [0,0];
        
        data.forEach(function(test){
            if (_this.getResultOf(test[0]) == test[1])
                success[test[1]] += 1;
            tries[test[1]] += 1;
        });
        var successRate = (success[0] + success[1])/data.length;
        var positiveRate = success[0]/tries[0];
        var negativeRate = success[1]/tries[1];
        
        if (print){
            console.log("\nAccuracy: " + successRate + " (" + (success[0] + success[1]) + "/" + data.length + ")");
            console.log("Precision: " + positiveRate + " (" + success[0] + "/" + tries[0] + ")");
            console.log("Negative Rate: " + negativeRate + " (" + success[1] + "/" + tries[1] + ")");
        }
        
        
        return [successRate, positiveRate, negativeRate];
    };
    
    // Returns 1 if positive and 0 if negative, according to threshold value
    this.getResultOf = function(data){
        if (_this.network.run(data) < _this.OUTPUT_THRESHOLD)
            return 0;
        return 1;
    }
    
    // Saves the network to the specified file and calls the callback.
    // Note: network.save(file) does work but the node bindings library has no load network support.
    this.save = function(file, callback){
        var toPrint = {
            layerSizes: _this.network.layers,
            weights: _this.network.get_weight_array()
        }
        
        fs.writeFile(file, JSON.stringify(toPrint), function (err) {
            if (err) throw err;
            
            console.log('The network has been saved to ' + file);
            return callback();
        });
    };
    
    return this;
}
