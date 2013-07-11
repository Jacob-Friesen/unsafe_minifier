var _ = require('lodash'),
    chai = require('chai'),
    assert = chai.assert,
    expect = chai.expect,
    sinon = require('sinon'),
    stub = sinon.stub,
    spy = sinon.spy;

var helper = new require('../test_helpers.js')(),
    messages = new require('../../messages.js')(),
    fann = require('node_fann'),
    fs = require('fs'),
    NeuralNetwork = require('../../training/neural_network.js');



module.exports = function(callback){
    describe('NeuralNetwork', function(){

        var test = {};
        beforeEach(function(){
            test = {};
        });

        after(function(){
            callback();
        });

        function setNetwork(network){
            test.standard.returns(network);
            test.neuralNetwork = new NeuralNetwork(10, 40, 1);
        }

        describe('#constructor()', function(){
            it('should throw an error if the input, hidden or output layer sizes are null or undefined', function(){
                helper.tripleNullUndefinedTest(function(inputNum, hiddenNum, outputNum){
                    expect(function(){
                        new NeuralNetwork(inputNum, hiddenNum, outputNum);
                    }).to.throw(messages.training.layerSizesNotSpecified());
                });
            });

            it('should have the correct variables set', function(){
                var standard = stub(fann, 'standard'),
                    network = {an: 'object'};
                standard.returns(network);

                var neuralNetwork = new NeuralNetwork(10, 40, 1);

                assert.equal(neuralNetwork.network, network);
                assert.isTrue(_.isNumber(neuralNetwork.OUTPUT_THRESHOLD));

                standard.restore();
            });
        });

        describe('#getResultOf()', function(){
            function setThreshold(threshold){
                setNetwork({
                    run: function(data){
                        return threshold;
                    }
                });
            }

            beforeEach(function(){
                test.standard = stub(fann, 'standard');
                setNetwork({});
            });

            afterEach(function(){
                test.standard.restore();
            });

            // No specific error checking (or testing) the default error for sending in data is sufficient
            it('should return 0 when the network output is less than the threshold', function(){
                setThreshold(test.neuralNetwork.OUTPUT_THRESHOLD - 0.0001);
                assert.equal(test.neuralNetwork.getResultOf({}), 0);
            });

            it('should return 1 when the network output is >= to the threshold', function(){
                setThreshold(test.neuralNetwork.OUTPUT_THRESHOLD);
                assert.equal(test.neuralNetwork.getResultOf({}), 1);
                setThreshold(test.neuralNetwork.OUTPUT_THRESHOLD + 0.0001);
                assert.equal(test.neuralNetwork.getResultOf({}), 1);
            });
        });

        describe('#save()', function(){
            beforeEach(function(){
                test.standard = stub(fann, 'standard');
                test.writeFile = stub(fs, 'writeFile');

                test.callback = function(){};
                test.network = {
                    layers: [10, 40, 1],
                    get_weight_array: function(){ return [1, 2, 3]; }// contents don't matter in this case
                }

                setNetwork(test.network);
            });

            afterEach(function(){
                test.standard.restore();
                test.writeFile.restore();
            });

            it('should throw an error if the file name is not specified or is a string', function(){
                helper.nullUndefinedTest(function(file){
                    expect(function(){
                        test.neuralNetwork.save('', test.callback);
                    }).to.throw(messages.training.noSaveFile(file));
                })('');
            });

            it('should print an empty object if the network layers or weight array can\'t be reached', function(){
                function networkReturns(returnThis){
                    test.standard.returns(returnThis);
                    test.neuralNetwork = new NeuralNetwork(10, 40, 1);
                }

                (function save(){
                    test.neuralNetwork.save('test_file.json', test.callback);
                    assert.isTrue(test.writeFile.calledOnce);
                    assert.isTrue(test.writeFile.calledWith('test_file.json', '{}'));
                    test.writeFile.callCount -= 1;

                    return save;
                })(networkReturns({}))
                
                (networkReturns({layers: ['here']}))

                (networkReturns({get_weight_array: 'here'}));
            });

            it('should print an object containing the layer sizes and weights', function(){
                test.neuralNetwork.save('test_file.json', test.callback);
                assert.isTrue(test.writeFile.calledOnce);

                toPrint = {
                    layerSizes: test.network.layers,
                    weights: test.network.get_weight_array()
                }
                assert.isTrue(test.writeFile.calledWith('test_file.json', JSON.stringify(toPrint)));
            });

            it('should specify the file saved to and call the callback', function(){
                test.writeFile.callsArg(2);
                var callbackSpy = spy(test, 'callback'),
                    logStub = stub(console, 'log');

                test.neuralNetwork.save('test_file.json', test.callback);
                assert.isTrue(callbackSpy.calledOnce);
                assert.isTrue(logStub.calledOnce);
                assert.isTrue(logStub.calledWith(messages.training.saveNetwork('test_file.json') + ''));

                logStub.restore();
                callbackSpy.restore();
            });
        });

        describe('#test()', function(){
            beforeEach(function(){
                test.log = stub(console, 'log');
                test.standard = stub(fann, 'standard');

                setNetwork({});
                test.getResultOf = stub(test.neuralNetwork, 'getResultOf');
            });

            afterEach(function(){
                test.log.restore();
                test.standard.restore();
                test.getResultOf.restore();
            });

            it('should just return and not print when printStats is falsey with null or undefined data', function(){
                helper.nullUndefinedTest(function(data){
                    test.neuralNetwork.test(data, true).forEach(function(rate){
                        assert.isTrue(_.isNaN(rate));
                    });
                });
            });

            it('should return and print NaN for the success, negative and positives rate when data is null or undefined', function(){
                helper.nullUndefinedTest(function(data){
                    test.neuralNetwork.test(data, true).forEach(function(rate){
                        assert.isTrue(_.isNaN(rate));
                    });

                    assert.isTrue(test.log.calledOnce);
                    assert.isTrue(test.log.calledWith(messages.training.testStats(NaN, NaN, NaN, [0,0], [0,0], 0) + ''));
                    test.log.callCount -= 1;
                });
            });

            it('should return and print 0 and a NaN for the success, negative and positives rate when the data has one point not validated',
            function(){
                // Expected is positive vs expected is negative
                [0, 1].forEach(function(index){
                    test.getResultOf.returns((index === 1) ? 0 : 1);

                    var results = test.neuralNetwork.test([[ [null],index ]], true);
                    assert.equal(results[0], 0);
                    if (index !== 0)
                        assert.isTrue(_.isNaN(results[1]));
                    else
                        assert.equal(results[1], 0);
                    if (index !== 1)
                        assert.isTrue(_.isNaN(results[2]));
                    else
                        assert.equal(results[2], 0);
                    
                    assert.isTrue(test.log.calledOnce);
                    test.log.callCount -= 1;

                    var tries = [0,0];
                    tries[index] += 1;
                    assert.isTrue(test.log.calledWith(messages.training.testStats(0, 0, 0, [0,0], tries, 1) + ''));
                });
            });

            // I could reduce repetition here but it would make give more conditionals making it harder to debug.
            it('should return and print 1 for success and 1 for each positive/negative depending on case', function(){                
                // Expected is positive vs expected is negative
                [0, 1].forEach(function(index){
                    test.getResultOf.returns(index);

                    var results = test.neuralNetwork.test([[ [null],index ]], true);
                    assert.equal(results[0], 1);
                    if (index !== 0)
                        assert.isTrue(_.isNaN(results[1]));
                    else
                        assert.equal(results[1], 1);
                    if (index !== 1)
                        assert.isTrue(_.isNaN(results[2]));
                    else
                        assert.equal(results[2], 1);

                    
                    assert.isTrue(test.log.calledOnce);
                    test.log.callCount -= 1;

                    var tries = [0,0];
                    tries[index] += 1;
                    assert.isTrue(test.log.calledWith(messages.training.testStats(0, 0, 0, [0,0], tries, 1) + ''));
                });
            });

            it('should return and print 1 for all rates when positive and negative rates are validated', function(){
                test.getResultOf.withArgs([0]).returns(0);
                test.getResultOf.withArgs([1]).returns(1);

                assert.deepEqual(test.neuralNetwork.test([[ [0],0 ],
                                                          [ [1],1 ]], true), [1,1,1]);
                    
                assert.isTrue(test.log.calledOnce);
                assert.isTrue(test.log.calledWith(messages.training.testStats(1, 1, 1, [1,1], [1,1], 2) + ''));
            });

            it('should return and print 0.66... for success when 2 out of 3 results in total pass and 1/2 for another', function(){
                test.getResultOf.withArgs([0]).returns(0);
                test.getResultOf.withArgs([1]).returns(1);
                test.getResultOf.withArgs([2]).returns(0);

                assert.deepEqual(test.neuralNetwork.test([[ [0],0 ],
                                                          [ [1],1 ],
                                                          [ [2],1 ]], true), [2/3,1,1/2]);
                    
                assert.isTrue(test.log.calledOnce);
                assert.isTrue(test.log.calledWith(messages.training.testStats(2/3, 1, 1/2, [1,1], [1,2], 3) + ''));
            });
        });

        describe('#train()', function(){
            beforeEach(function(){
                test.standard = stub(fann, 'standard');
                test.train = stub();

                setNetwork({
                    train: test.train
                });
            });

            afterEach(function(){
                if (test.standard.restore)
                    test.standard.restore();
            });

            it('should throw an error the data sent is enu or the errorRate is not a number', function(){
                function testTrain(data, errorRate){
                    expect(function(){
                        test.neuralNetwork.train(data, errorRate);
                    }).to.throw(messages.training.dataErrorRateNotSpecified());
                    assert.isFalse(test.train.called);
                }

                helper.ENUTest(function(data){
                    [null, '1', 1].forEach(function(errorRate){
                        testTrain(data, errorRate);
                    });
                });
                testTrain([[0],[1]], '1');
            });

            it('should send the data and error, epochs, and epochs between reports options', function(){
                var data = [[[1,2,3],1]];// (single point, not that it matters)
                test.neuralNetwork.train(data, 1, false);

                assert.isTrue(test.train.calledOnce);
                assert.isTrue(test.train.calledWith(data, {error: 1, epochs: test.neuralNetwork.EPOCHS, epochs_between_reports: 0}));
            });
        });
    });
}
