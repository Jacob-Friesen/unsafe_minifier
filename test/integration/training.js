var _ = require('lodash'),
    fs = require('fs'),
    chai = require('chai'),
    sinon = require('sinon'),
    stub = sinon.stub,
    assert = chai.assert,
    expect = chai.expect;

var messages = new require('../../messages')();

var tests = 'data/raw_data',
    verification = 'data/merged_data',
    Train = require('../../training');

var FILES = {
    statistics: 'data/training_integration/statistics.json',
    neural: 'data/neural_networks/trainedx.json',
    networkNumber: 5
}
var sendFiles = {
    combinedData: [FILES.statistics, true],
    neuralNetwork: ['data/neural_networks/trained.json', true]
}

module.exports = function(){
    describe('Training Tests', function(){
        // Get all the data for testing by opening the specified test and verification directories and reading files in there.
        function createTestData(callback){
            createStatisticFile(function(){
                var train = new Train(sendFiles);

                train.train(function(){
                    if (callback) return callback(train);
                });
            });
        }

        // Uses the statistics provided here to make the file. (Need to test whole training process).
        function createStatisticFile(callback){
            var dir = FILES.statistics.split('/');
                dir.pop();
                dir = dir.join().replace(/,/g,'/');

            if (!fs.existsSync(dir))
                fs.mkdirSync(dir);

            fs.writeFile(FILES.statistics, JSON.stringify(test.statistics), function(err){
                if(err) throw(err);

                return callback();
            });
        }

        // Retrieves the created neural Networks data and passes a JS object it as the first argument to the sent callback.
        function getNeuralNetworkData(callback, index, networkData){
            index = index || 0;
            networkData = networkData || [];

            if (index > 0){
                fs.readFile(FILES.neural.replace('x', (index - 1) + ''), 'utf-8', function(err, data){
                    if (err) throw(err);

                    networkData.push(JSON.parse(data));
                    getNeuralNetworkData(callback, index - 1, networkData)
                });
            }
            else
                callback(networkData);
        }

        before(function(done){
            messages.training.print = false;

            createTestData(function(train){
                test.train = train;

                getNeuralNetworkData(function(networkData){
                    test.networkData = networkData;

                    done();
                }, test.train.NETWORKS);
            });
        });

        after(function(done){
            messages.training.print = true;

            fs.unlink(FILES.statistics, function (err) {
                if (err) throw err;

                var dir = FILES.statistics.split('/');
                    dir.pop();
                    dir = dir.join().replace(/,/g,'/');
                fs.rmdir(dir, function (err) {
                    if (err) throw err;
                    done();
                });
            });
        })

        it('Should generate networks with as many weights as layers defined except for the output', function(){
            test.networkData.forEach(function(network){
                var layerSum = network.layerSizes.reduce(function(sum, num) {
                  return sum + num;
                });

                // No connections coming from the output layer node hence - 1
                assert.equal(layerSum, _.size(network.weights) - 1);
            });
        });

        it('Should generate networks with weights in (9.99..,9.99..)', function(){
            test.networkData.forEach(function(network){

                _.values(network.weights).forEach(function(set){
                    _.values(set).forEach(function(weight){
                        assert.isTrue(Math.abs(weight) < 10);
                    });
                });
            });
        });
    });
}

var test = {};

// Going to have to update this on every change to the style of statistics generated. I could get the statistics from function statistics but that
// would make the tests more complicated than they needed to be for simple maintainability.
test.statistics = [
    {
        "name":"test2-test1",
        "toChar1":"t",
        "fromChar1":"t",
        "toCharLast":"1",
        "fromCharLast":"2",
        "paramsTo":0,
        "paramsFrom":0,
        "argsTo":0,
        "argsFrom":0,
        "startTo":0,
        "startFrom":1,
        "valid":"no"
    },
    {
        "name":"test3-test1",
        "toChar1":"t",
        "fromChar1":"t",
        "toCharLast":"1",
        "fromCharLast":"3",
        "paramsTo":2,
        "paramsFrom":2,
        "argsTo":1,
        "argsFrom":3,
        "startTo":0,
        "startFrom":1,
        "valid":"yes"
    },
]