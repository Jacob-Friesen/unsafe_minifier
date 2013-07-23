var _ = require('lodash'),
    chai = require('chai'),
    assert = chai.assert,
    expect = chai.expect,
    sinon = require('sinon'),
    stub = sinon.stub;

var helper = new require('../test_helpers.js')(),
    messages = new require('../../messages.js')(),
    Trainer = require('../../training/index.js'),
    NeuralNetwork = require('../../training/neural_network.js');

module.exports = function(callback){
    describe('Train', function(){
        var test = {};
        beforeEach(function(){
            test = {};

            test.neuralNetworkFile = 'test.json';
            test.trainer = new Trainer({
                neuralNetwork: [test.neuralNetworkFile, true]
            });
        });

        after(function(){
            callback();
        });

        describe('#constructor()', function(){
            it('should throw an error if the files are enu', function(){
                helper.ENUTest(function(files){
                    expect(function(){
                        new Trainer(files);
                    }).to.throw(messages.training.filesNotSpecified());
                });
            });

            it('should have the correct variables set', function(){
                var t = test.trainer;

                assert.deepEqual(NeuralNetwork, t.NeuralNetwork);

                [t.PARTITION, t.ERROR_RATE, t.HIDDEN_SIZE, t.NETWORKS].forEach(function(variable){
                    assert.isTrue(_.isNumber(variable));
                });

                [t.SAVE_NETWORKS, t.PRINT_DATA_STATS, t.PRINT_FANN_OUTPUT, t.PRINT_NETWORK_STATS].forEach(function(variable){
                    assert.isTrue(_.isBoolean(variable));
                });
            });
        });

        describe('#runTraining()', function(){
            beforeEach(function(){
                test.callback = stub();
                test.averageStats = stub(messages.training, 'averageStats');
                test.averageStats.returns({send: function(){} });

                test.formatData = stub(test.trainer, 'formatData');
                test.evenizeData = stub(test.trainer, 'evenizeData');
                test.partitionData = stub(test.trainer, 'partitionData');
                test.partitionData.returns({training: [], test: []});

                test.runNetwork = stub(test.trainer, 'runNetwork');
                test.runNetwork.callsArg(4);

                messages.training.print = false;
            });

            afterEach(function(){
                test.averageStats.restore();
                test.formatData.restore();
                test.evenizeData.restore();
                test.partitionData.restore();
                test.runNetwork.restore();
            });

            it('should call run network with the test and training dataPartitions, whether to save the networks, and the current recurse, and call ' +
               'the callback', function(){
                // Formats don't matter just need to tell if the vars were passed correctly
                var training = ['test1'],
                    testing = ['test2'];
                test.partitionData.returns({training: training, testing: testing});

                test.trainer.runTraining([], test.callback);

                Array(test.trainer.NETWORKS).forEach(function(__, index){
                     assert.isTrue(test.runNetwork.calledWith(training, test, true, index));
                });
                assert.equal(test.runNetwork.callCount, test.trainer.NETWORKS);
            });

            it('should print average stats with [0,0,0] for success rates when combinedData is enu NETWORKS times and call the callback', function(){
                helper.ENUTest(function(data){
                    messages.training.print = true;

                    test.trainer.runTraining(data, test.callback);

                    assert.isTrue(test.averageStats.calledOnce);
                    test.averageStats.callCount -= 1;
                    assert.isTrue(test.averageStats.calledWith(test.trainer.NETWORKS, [0,0,0]));
                    assert.isTrue(test.callback.calledOnce);
                    test.callback.callCount -= 1;
                });
            });

            it('should print average stats with 0.625,0.5,0.75 each multiplied by the network for success rates when runNetwork provides that', 
            function(){
                messages.training.print = true;

                // Have to restore and stub again to get a proper first call
                test.runNetwork.restore();
                test.runNetwork = stub(test.trainer, 'runNetwork');

                var rates = [0.625,0.5,0.75];
                test.runNetwork.callsArgWith(4, rates[0], rates[1], rates[2]);

                test.trainer.runTraining([], test.callback);

                assert.isTrue(test.averageStats.calledWith(test.trainer.NETWORKS, rates.map(function(rate){
                    return rate * test.trainer.NETWORKS;
                })));
            });
        });

        describe('#formatData()', function(){
            it('should return an empty array when datapoint is enu', function(){
                helper.ENUTest(function(data){
                    assert.deepEqual(test.trainer.formatData(data), []);
                });
            });

            it('should return the array of added values', function(){
                var data = [0,1,2].map(function(setTo){
                    return {
                        prop1: setTo,
                        prop2: setTo + 1
                    }
                });

                assert.deepEqual(test.trainer.formatData(data), [0,1,2].map(function(setTo){
                    return [[setTo, setTo + 1],[0]];
                }));
            });
        });

        describe('#formatDataPoint()', function(){
            it('should return an array like [[], [0]] when datapoint is enu', function(){
                helper.ENUTest(function(point){
                    assert.deepEqual(test.trainer.formatDataPoint(point), [[],[0]]);
                });
            });

            it('should never include the name or valid values in the input array', function(){
                assert.deepEqual(test.trainer.formatDataPoint({
                    name: 'test',
                    other: 1,
                    valid: 'yes'
                })[0], [1]);
            });

            it('should transform all values in the input array to numbers if necessary', function(){
                var rNum = 'r'.charCodeAt(0);
                assert.deepEqual(test.trainer.formatDataPoint({
                    name: 'test',
                    prop1: 1,
                    prop2: 'red',
                    prop3: 'r',
	            prop4: 3,
                    valid: 'yes'
                })[0], [1,rNum,rNum,3]);
            });

            it('should return a 0 for the output array when valid is "no"', function(){
                assert.deepEqual(test.trainer.formatDataPoint({valid: 'no'})[1][0], 0);
            });

            it('should return a 1 for the output array when valid is "yes"', function(){
                assert.deepEqual(test.trainer.formatDataPoint({valid: 'yes'})[1][0], 1);
            });
        });

        describe('#evenizeData()', function(){
            function CheckValidInvalid(data, correct){
                var found = [0,0];
                test.trainer.evenizeData(data).forEach(function(point) {
                    found[point[1]] += 1;
                });

                assert.deepEqual(found, correct);
            }

            it('should return an empty array when input is enu', function(){
                helper.ENUTest(function(data){
                    assert.deepEqual(test.trainer.evenizeData(data), []);
                });
            });

            it('should return an empty array when there is no valid data', function(){
                assert.deepEqual(test.trainer.evenizeData([
                    [[1,2],[0]],
                    [[3,4],[0]]
                ]), []);
            });

            it('should return an empty array when there is no invalid data', function(){
                assert.deepEqual(test.trainer.evenizeData([
                    [[1,2],[1]],
                    [[3,4],[1]]
                ]), []);
            });

            it('should return an array containing one valid and invalid when there are 2 values', function(){
                var data = [
                    [[1,2],[0]],
                    [[3,4],[1]]
                ];
                var old = data.concat([]);

                data = test.trainer.evenizeData(data);
                data.sort(function(point1, point2){
                      if (point1[1] < point2[1])
                         return -1;
                      if (point1[1] > point2[1])
                         return 1;
                      return 0;
                });
                assert.deepEqual(data, old);
            });

            it('should return an array containing one valid and invalid when there are 3 values (1 invalid only)', function(){
                var data = [
                    [[1,2],[1]],
                    [[3,4],[0]],
                    [[4,5],[1]]
                ];

                CheckValidInvalid(data, [1,1]);
            });

            it('should return an array containing two valids and invalids when there are 7 values (2 invalids only)', function(){
                var data = [
                    [[1,2],[1]],
                    [[3,4],[0]],
                    [[4,5],[1]],
                    [[6,7],[1]],
                    [[8,9],[1]],
                    [[10,11],[0]],
                    [[12,13],[1]]
                ];

                CheckValidInvalid(data, [2,2]);
            });
        });

        describe('#partitionData()', function(){
            function setData(length){
                var data = Array(length);
                return test.trainer.partitionData(data);
            }

            it('should return an object containing empty test and training data if data is empty, null or undefined', function(){
                helper.ENUTest(function(data){
                    assert.deepEqual(test.trainer.partitionData(data), {training: [], testing: []});
                });
            });

            it('should split the data according to the partition specified', function(){
                var length = 100,
                    sets = setData(length);

                assert.equal(sets.training.length, length * test.trainer.PARTITION);
                assert.equal(sets.testing.length, length - (length * test.trainer.PARTITION));
            });

            it('should split the data 0 100 when the partion is 1', function(){
                test.trainer.PARTITION = 1;

                var length = 100,
                    sets = setData(length);

                assert.equal(sets.training.length, 100);
                assert.equal(sets.testing.length, 0);
            });

            it('should split the data 100 0 when the partion is 0', function(){
                test.trainer.PARTITION = 0;

                var length = 100,
                    sets = setData(length);

                assert.equal(sets.training.length, 0);
                assert.equal(sets.testing.length, 100);
            });
        });

        describe('#runNetwork()', function(){
            function testCallback(toSave, index){
                test.callback = stub();
                var rates = [0.6,0.7,0.8];
                test.test.returns(rates);

                test.trainer.runNetwork(test.training, ['test'], toSave, index, test.callback);

                assert.isTrue(test.callback.calledOnce);
                assert.isTrue(test.callback.calledWith(rates[0], rates[1], rates[2], test.network));
            }

            beforeEach(function(){
                test.neuralNetwork = stub(test.trainer, 'NeuralNetwork');
                test.train = stub();
                test.test = stub();
                test.save = stub();

                test.network = {a: 'network'};
                test.neuralNetwork.returns({
                    train: test.train,
                    test: test.test,
                    save: test.save,
                    network: test.network
                });
                test.test.returns([0,0,0]);

                test.input = Array(16);
                test.output = Array(1);
                test.training = [[ test.input,test.output ]];

                test.trainer.PRINT_NETWORK_STATS = false;
            });

            afterEach(function(){
                test.neuralNetwork.restore();
            })

            it('should throw an error when the training data is not in the correct format (see function)', function(){
                (function run(training){
                    expect(function(){
                        test.trainer.runNetwork(training);
                    }).to.throw(messages.training.wrongTrainingDataFormat());

                    assert.isFalse(test.neuralNetwork.called);

                    return run;
                })(['test'])
                ([[ 'test' ]])
                ([[ [0],'test' ]]);
            });

            it('should create a Neural Network with the input length, the input length multiplied by hidden size and the output length', function(){
                test.trainer.runNetwork(test.training);

                assert.isTrue(test.neuralNetwork.calledOnce);
                assert.isTrue(test.neuralNetwork.calledWith(test.input.length, test.input.length * test.trainer.HIDDEN_SIZE, test.output.length));
            });

            it('should call the new neural networks train with the training data, the error rate and whether to print FANN stats', function(){
                test.trainer.runNetwork(test.training);

                assert.isTrue(test.train.calledOnce);
                assert.isTrue(test.train.calledWith(test.training, test.trainer.ERROR_RATE, test.trainer.PRINT_FANN_OUTPUT));
            });

            it('should call the new neural networks test with the test data and if to print the network stats while testing', function(){
                test.trainer.runNetwork(test.training, ['test']);

                assert.isTrue(test.test.calledOnce);
                assert.isTrue(test.test.calledWith(['test'], test.trainer.PRINT_NETWORK_STATS));
            });

            it('should call the callback with the rates and nueralNetworks network object if save is falsey', function(){
                testCallback(false, 0);
            });

            it('should call the new neural networks save with the nueralNetwork file updated with the index', function(){
                test.save.callsArg(1);

                [0,1,2,3,875,'red'].forEach(function(index){
                    testCallback(true, index);

                    assert.isTrue(test.save.calledOnce)
                    test.save.callCount -= 1;
                    assert.isTrue(test.save.calledWith(test.neuralNetworkFile.replace('.json',index + '.json')));
                });
            });
        });
    });
}
