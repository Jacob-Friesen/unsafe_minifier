var _ = require('lodash'),
    chai = require('chai'),
    assert = chai.assert,
    expect = chai.expect
    sinon = require('sinon'),
    stub = sinon.stub,
    fs = require('fs'),
    child_process = require('child_process');

var helper = new require('../test_helpers.js')(),
    messages = new require('../../messages.js')(),
    Minification = require('../../minification/index.js'),
    Training = require('../../training/index.js'),
    NeuralNetwork = require('../../training/neural_network.js');

module.exports = function(callback){
    describe('Minification', function(){
        var test = {};
        beforeEach(function(){
            test = {};

            test.files = { aFile: ''};
            test.minification = new Minification({ aFile: test.files});
        });

        after(function(){
            callback();
        });

        describe('#constructor()', function(){
            it('should throw an error if the files sent in are enu', function(){
                helper.ENUTest(function(files){
                    expect(function(){
                        new Minification(files);
                    }).to.throw(messages.minification.filesNotSpecified());
                });
            });

            it('should have the correct variables set', function(){
                assert.deepEqual(Training, test.minification.Training);
                assert.deepEqual(NeuralNetwork, test.minification.NeuralNetwork);
                assert.isNumber(test.minification.NETWORKS);
                assert.isBoolean(test.minification.PRINT_MERGES);
            });
        });

        describe('#loadNetworks()', function(){
            function setupRead(networks){
                test.minification.NETWORKS = networks;
                test.readFile.callsArgWith(2, false);
                test.parse.returns({layerSizes: [0,1,2]});
            }

            beforeEach(function(){
                messages.minification.print = false;

                test.readFile = stub(fs, 'readFile');
                test.NeuralNetwork = stub(test.minification, 'NeuralNetwork');
                test.parse = stub(JSON, 'parse');
                test.callback = stub();

                test.network = {
                    set_weight_array: function(){},
                    aProperty: 'test'
                }
                test.networkWrapper = {network: test.network};
                test.NeuralNetwork.returns(test.networkWrapper);
            });

            afterEach(function(){
                messages.minification.print = true;

                test.readFile.restore();
                test.NeuralNetwork.restore();
                test.parse.restore();
            });

            it('should not call readFile when the network number is 0 and call the callback with a []', function(){
                test.minification.NETWORKS = 0;
                test.minification.loadNetworks('', test.callback);

                assert.isFalse(test.readFile.called);
                assert.isTrue(test.callback.calledOnce);
                assert.isTrue(test.callback.calledWith([]));
            });

            it('should pass an empty file to readFile when an empty file name was sent in', function(){
                test.minification.loadNetworks('');

                assert.isTrue(test.readFile.calledOnce);
                assert.isTrue(test.readFile.calledWith('', 'utf8'));
            });

            it('should pass readFile with a 0 before .json when a file was sent in and 1 network was specified', function(){
                test.minification.NETWORKS = 1;

                test.minification.loadNetworks('test.json');

                assert.isTrue(test.readFile.calledOnce);
                assert.isTrue(test.readFile.calledWith('test0.json', 'utf8'));
            });

            it('should call the callback with one neural network when 1 was specified', function(){
                setupRead(1);

                test.minification.loadNetworks('test.json', test.callback);

                assert.isTrue(test.callback.calledOnce);
                assert.isTrue(test.callback.calledWith([test.networkWrapper]));
            });

            it('should pass readFile with a 4,3,2,1,0 before .json when a file was sent in and five networks were specified', function(){
                setupRead(5);

                test.minification.loadNetworks('test.json', test.callback);

                assert.equal(test.readFile.callCount, 5);
                for (var i = 0; i < 5; i += 1){
                    assert.equal(test.readFile.args[i][0], 'test.json'.replace('.json', (4 - i)+'.json'));
                    assert.equal(test.readFile.args[i][1], 'utf8');
                };
            });

            it('should send a loaded network message for each file when there is five networks specified', function(){
                test.loadedNetwork = stub(messages.minification, 'loadedNetwork');
                test.loadedNetwork.returns({send: function(){}});
                setupRead(5);

                test.minification.loadNetworks('test.json', test.callback);

                assert.equal(test.loadedNetwork.callCount, 5);
                for (var i = 0; i < 5; i += 1){
                    assert.equal(test.loadedNetwork.args[i][0], 'test.json'.replace('.json', (4 - i)+'.json'));
                };

                test.loadedNetwork.restore();
            });

            it('should call the callback with five different networks when there is five networks specified', function(){
                setupRead(5);

                var newWrappers = [];
                for (var i = 0; i < 5; i += 1){
                    var wrapper = _.cloneDeep(test.networkWrapper);
                    wrapper.aProperty = i;
                    newWrappers.push(wrapper);
                };

                // So multiple calls with the same parameters return a different wrapper each time
                test.NeuralNetwork.restore();
                var index = -1;
                sinon.stub(test.minification, 'NeuralNetwork', function(){
                    index += 1;
                    return newWrappers[index];
                });

                test.minification.loadNetworks('test.json', test.callback);

                assert.equal(test.callback.callCount, 1);
                assert.isTrue(test.callback.calledWith(newWrappers));
            });
        });

        describe('#writeMinifiedFiles()', function(){
            function setupExec(){
                test.writeFile.callsArgWith(2, false);
                test.exec.callsArgWith(1, false);
            }

            function setupMessage(messageObject){
                test[messageObject] = stub(messages.minification, messageObject);
                test[messageObject].returns({send: function(){} });
            }

            beforeEach(function(){
                messages.minification.print = false;

                test.writeFile = stub(fs, 'writeFile');
                test.exec = stub(child_process, 'exec');

                test.aIsB = {// (a = b) is Mozilla parser syntax
                    "type": "Program",
                    "body": [
                        {
                            "type": "ExpressionStatement",
                            "expression": {
                                "type": "AssignmentExpression",
                                "operator": "=",
                                "left": {
                                    "type": "Identifier",
                                    "name": "a"
                                },
                                "right": {
                                    "type": "Identifier",
                                    "name": "b"
                                }
                            }
                        }
                    ]
                }
            });

            afterEach(function(){
                messages.minification.print = true;

                test.writeFile.restore();
                test.exec.restore();
            });

            it('should send in an empty filename and AST to the first writeFile if toMinify or AST or enu', function(){
                helper.dualNullUndefinedTest(function(toMinify, AST){
                    test.minification.writeMinifiedFiles(toMinify, AST);

                    assert.isTrue(test.writeFile.calledOnce);
                    assert.isTrue(test.writeFile.calledWith('', '{\n}'));
                    test.writeFile.callCount -= 1;
                })('', []);
            });

            it('should send in the file name with .js replace with .min.js and the AST parsed', function(){
                test.minification.writeMinifiedFiles('test.js', test.aIsB);

                assert.isTrue(test.writeFile.calledOnce);
                assert.isTrue(test.writeFile.calledWith('test.min.js', 'a = b;'));
            });

            it('should send a message explaining the first file has been unsafely minified and written', function(){
                test.writeFile.callsArgWith(2, false);
                setupMessage('writtenUnsafe');

                test.minification.writeMinifiedFiles('test.js', test.aIsB);

                assert.isTrue(test.writtenUnsafe.calledOnce);
                assert.isTrue(test.writtenUnsafe.calledWith('test.min.js'));

                test.writtenUnsafe.restore();
            });

            it('should run the unsafely minified file through the safe minifier with extension .full.min.js', function(){
                test.writeFile.callsArgWith(2, false);

                test.minification.writeMinifiedFiles('test.js', test.aIsB);

                assert.isTrue(test.exec.calledOnce);
                assert.isTrue(test.exec.calledWith('java -jar safe_minifier/compiler.jar --js=test.min.js --js_output_file=test.full.min.js'));
            });

            it('should send a message explaining the first file has been fully minified and written', function(){
                setupExec();
                setupMessage('writtenFull');

                test.minification.writeMinifiedFiles('test.js', test.aIsB);

                assert.isTrue(test.writtenFull.calledOnce);
                assert.isTrue(test.writtenFull.calledWith('test.full.min.js'));

                test.writtenFull.restore();
            });

            it('should run the first file through the safe minifier with extension .safe.min.js', function(){
                setupExec();

                test.minification.writeMinifiedFiles('test.js', test.aIsB);

                assert.isTrue(test.exec.calledTwice);
                assert.isTrue(test.exec.calledWith('java -jar safe_minifier/compiler.jar --js=test.js --js_output_file=test.safe.min.js'));
            });

            it('should send a message explaining the first file has been fully minified and written', function(){
                setupExec();
                setupMessage('writtenSafe');

                test.minification.writeMinifiedFiles('test.js', test.aIsB);

                assert.isTrue(test.writtenSafe.calledOnce);
                assert.isTrue(test.writtenSafe.calledWith('test.safe.min.js'));

                test.writtenSafe.restore();
            });

            it('should call the callback sent in after everything', function(){
                setupExec();
                test.callback = stub();

                test.minification.writeMinifiedFiles('test.js', test.aIsB, test.callback);

                assert.isTrue(test.callback.calledOnce);
            });
        });
    });
}