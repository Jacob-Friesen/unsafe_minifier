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

                [t.SAVE_NETWORKS, t.PRINT_DATA_STATS, t.PRINT_FANN_OUTPUT, t.PRINT_NETWORK_STATS, t.PRINT_AVERAGE_STATS].forEach(function(variable){
                    assert.isTrue(_.isBoolean(variable));
                });
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
                    assert.deepEqual(test.trainer.partitionData(data), {training: [], test: []});
                });
            });

            it('should split the data according to the partition specified', function(){
                var length = 100,
                    sets = setData(length);

                assert.equal(sets.training.length, length * test.trainer.PARTITION);
                assert.equal(sets.test.length, length - (length * test.trainer.PARTITION));
            });

            it('should split the data 0 100 when the partion is 1', function(){
                test.trainer.PARTITION = 1;

                var length = 100,
                    sets = setData(length);

                assert.equal(sets.training.length, 100);
                assert.equal(sets.test.length, 0);
            });

            it('should split the data 100 0 when the partion is 0', function(){
                test.trainer.PARTITION = 0;

                var length = 100,
                    sets = setData(length);

                assert.equal(sets.training.length, 0);
                assert.equal(sets.test.length, 100);
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
                helper.ENUTest(function(training){
                    expect(function(){
                        test.trainer.runNetwork(training);
                    }).to.throw(messages.training.wrongTrainingDataFormat());

                    assert.isFalse(test.neuralNetwork.called);
                })({})
                (['test'])
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