var _ = require('lodash'),
    fs = require('fs'),
    util = require('util'),
    fann = require('fann');

var u = require('../utility.js'),
    messages = new require('../messages.js')();

// Manages operations on a nueral network. Constructor takes the layer of networks and constructs a standard fully connected back-propogated network.
module.exports = function NeuralNetwork(inputNum, hiddenNum, outputNum){
    if (u.nullOrUndefined(inputNum) || u.nullOrUndefined(hiddenNum) || u.nullOrUndefined(outputNum))
        messages.training.layerSizesNotSpecified().error();
    
    var _this = this;
    this.network = new fann.standard(inputNum, hiddenNum, outputNum);
    this.OUTPUT_THRESHOLD = 0.3;// Everything less than this will be negative.
    this.EPOCHS = 10;
    
    // Trains the network with the specified error rate EPOCHS times or earlier if the error rate is reached. Prints FANN statistics if indicated. 
    // Data follows this form:
    // dataPoints -> [
    //    point -> [
    //        function statistics -> [1,2,3], 1 <- What the result should be
    //    ]
    // ]
    // More information can be obtained from: http://leenissen.dk/fann/html/files/fann_train-h.html
    this.train = function(data, errorRate, printFann){
        if (u.enu(data) || !_.isNumber(errorRate))
            messages.training.dataErrorRateNotSpecified().error();

        _this.network.train(data, {error: errorRate, epochs: _this.EPOCHS, epochs_between_reports: (printFann) ? 1 : 0});
    };
    
    // See how many correct results are obtained using the data sent in, returns total, postive, and negative success rates. Prints the success rate
    // along with the positive and negative success rates if print is given. NaN indicates if any values were divided by 0 (check with lodash).
    this.test = function(data, printStats){
        var success = [0,0],
            tries = [0,0];

        if (!u.nullOrUndefined(data)){
            // Loop through all the data points seeing if the input data in array slot one matches the result in array slot 2.
            data.forEach(function(test){
                if (_this.getResultOf(test[0]) == test[1])
                    success[test[1]] += 1;
                tries[test[1]] += 1;
            });
        }

        var length = (u.hasOwnPropertyChain(data, 'length') ? data.length : 0),
            successRate = (success[0] + success[1])/length,
            positiveRate = success[0]/tries[0],
            negativeRate = success[1]/tries[1];
        
        if (printStats)
            messages.training.testStats(successRate, positiveRate, negativeRate, success, tries, length).send();
        
        return [successRate, positiveRate, negativeRate];
    };
    
    // Sends given inputs into the network, returns 1 if less than the threshold and 0 if not.
    this.getResultOf = function(data){
        if (_this.network.run(data) < _this.OUTPUT_THRESHOLD)
            return 0;
        return 1;
    };
    
    // Saves the network to the specified file and calls the callback.
    // Note: network.save(file) does work but the node bindings library has no load network support.
    this.save = function(file, callback){
        if (!_.isString(file) || file.length < 1)
            messages.training.noSaveFile(file).error();

        var toPrint = {};
        if (!u.nullOrUndefined(_this.network.layers) && _.isFunction(_this.network.get_weight_array)){
            toPrint = {
                layerSizes: _this.network.layers,
                weights: _this.network.get_weight_array()
            }
        }
        
        fs.writeFile(file, JSON.stringify(toPrint), function (err) {
            if (err) throw err;
            
            messages.training.saveNetwork(file).send();
            if (callback) callback();
        });
    };
    
    return this;
}
