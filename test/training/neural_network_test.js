var _ = require('lodash'),
    chai = require('chai'),
    assert = chai.assert,
    expect = chai.expect,
    sinon = require('sinon'),
    stub = sinon.stub;

var helper = new require('../test_helpers.js')(),
    messages = new require('../../messages.js')(),
    NeuralNetwork = require('../../training/neural_network.js'),
    fann = require('node_fann');



module.exports = function(callback){
    describe('NeuralNetwork', function(){
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

    });
}