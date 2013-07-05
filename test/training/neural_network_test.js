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
        after(function(){
            callback();
        });

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

        describe('#save()', function(){
            beforeEach(function(){
                test.standard = stub(fann, 'standard');
                test.writeFile = stub(fs, 'writeFile');

                test.callback = function(){};
                test.network = {
                    layers: [10, 40, 1],
                    get_weight_array: function(){ return [1, 2, 3]; }// contents don't matter in this case
                }

                test.standard.returns(test.network);

                test.neuralNetwork = new NeuralNetwork(10, 40, 1);
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
    });
}
