var _ = require('lodash'),
    chai = require('chai'),
    assert = chai.assert,
    expect = chai.expect,
    sinon = require('sinon'),
    stub = sinon.stub,
    fs = require('fs');

var helper = new require('../test_helpers.js')(),
	messages = new require('../../messages.js')(),
	Generator = require('../../data_generation/index.js');



module.exports = function(callback){
    describe('Generator', function(){

        after(function(){
            callback();
        });

    	var generator = null,
            test = {};
    	describe('#constructor()', function(){
            it('should throw an error when the raw or merged directories sent in is null or undefined', function(){
                helper.dualNullUndefinedTest(function(rawDataDirectory, mergedDataDirectory){
                    expect(function(){
                    	generator = new Generator(rawDataDirectory, mergedDataDirectory);
                    }).to.throw(messages.generation.rawMergedDirectories());
                });
            });

             it('should throw an error when files is null or undefined', function(){
                helper.nullUndefinedTest(function(files){
                    expect(function(){
                    	generator = new Generator('/a/directory/', '/b/directory/', files);
                    }).to.throw(messages.generation.filesNotSpecified());
                });
            });

            it('should have the correct variables set', function(){
                generator = new Generator('/a/directory/', '/b/directory/', {});

                assert.isNull(generator.once_done);
            });
        });

        describe('#mergeStatsWithValidation()', function(){
            // Extra stubbing work needed to ensure functions call through. Arguments specify what the callback non error argument is for readFile 
            // are set to for mergeData and validMerges respectively.
            function callThrough(callArg1, callArg2){
                test.readFile.callsArg(2);
                test.readFile.withArgs(test.mergeData).yields(false, callArg1);
                test.readFile.withArgs(test.validMerges).yields(false, callArg2);
                test.writeFile.callsArg(2);
            }

            beforeEach(function(){
                test.readFile = stub(fs, 'readFile');
                test.writeFile = stub(fs, 'writeFile');

                test.mergeData = 'test1.json';
                test.validMerges = 'test2.json';
                test.combinedData = 'test3.json';

                generator = new Generator('/a/directory/', '/b/directory/', {});
            });

            afterEach(function(){
                fs.readFile.restore();
                fs.writeFile.restore();
            });

            it('should do nothing if the mergeData file name was enu and call the callback', function(){
                helper.ENUTest(function(mergedData){
                    generator.mergeStatsWithValidation(mergedData, test.validMerges, test.combinedData, function(){
                        assert.isFalse(test.readFile.called);
                        assert.isFalse(test.writeFile.called);
                    });
                });
            });

            it('should throw an error if validMerges or combinedData file names are null or undefined and call the callback', function(){
                helper.dualNullUndefinedTest(function(validMerges, combinedData){
                    expect(function(){
                        generator.mergeStatsWithValidation(test.mergeData, validMerges, combinedData, function(){});
                    }).to.throw(messages.generation.noValidMergesCombinedData());

                    assert.isFalse(test.readFile.called);
                    assert.isFalse(test.writeFile.called);
                });
            });

            // No done is needed for the following functions because their asynchronous nature is stubbed out
            it('should call readFile with the mergeData file name and utf8 string as arguments and validData', function(){
                callThrough('[]', '[]');
                generator.mergeStatsWithValidation(test.mergeData, test.validMerges, test.combinedData, function(){
                    assert.isTrue(test.readFile.calledTwice);

                    assert.equal(test.readFile.args[0][0], test.mergeData);
                    assert.equal(test.readFile.args[0][1], 'utf8');
                    assert.equal(test.readFile.args[1][0], test.validMerges);
                    assert.equal(test.readFile.args[1][1], 'utf8');
                });
            });

            // Note that the previous test also tested the functions getting empty data from a file
            it('should do writeFile with combinedData as the file and with merged functionData', function(){
                var functionData1 = {
                        name: 'f9-outObjectBothReturnMerge',
                        toChar1: 'o'
                        // All properties beyond name are irrelevant so I have just included one
                }
                var functionData2 = _.cloneDeep(functionData1);
                functionData2.name = 'f5-fromToMerge';

                callThrough('[' + JSON.stringify(functionData1) + ',' + JSON.stringify(functionData2) + '],['
                                + JSON.stringify(functionData2) + ',' + JSON.stringify(functionData1) + '],',
                            '{"' + functionData1.name + '": "yes", "' + functionData2.name + '": "no"}');

                generator.mergeStatsWithValidation(test.mergeData, test.validMerges, test.combinedData, function(){
                    assert.isTrue(test.writeFile.calledOnce);

                    // Make the combined info so it can be checked
                    functionData1.valid = 'yes';
                    functionData2.valid = 'no';
                    var combined = JSON.stringify([functionData1, functionData2, functionData2, functionData1]);

                    assert.isTrue(test.writeFile.calledWith(test.combinedData, combined));
                });
            });
        });

        describe('#writeToMergedFile()', function(){
            // Verify that such a serious error would happen, specific error message is irrelevant, it just should error
            it('should throw an error if the data couldn\'t be parsed', function(){
                var writeFile = stub(fs, 'writeFile');
                generator = new Generator('/a/directory/', '/b/directory/', {});

                helper.ENUTest(function(AST){
                    expect(function(){
                        generator.writeToMergedFile('/a/directory', 'test.json', '', function(){})
                    }).to.throw();
                })('');

                writeFile.restore();
            });

            it('should call writeFile with the directory mixed with name passing it the generated JS of the data in AST form', function(){
                var writeFile = stub(fs, 'writeFile');

                generator = new Generator('/a/directory/', '/b/directory/', {});
                generator.writeToMergedFile('/a/directory', 'test.json', {
                    "type": "Program",
                    "body": [
                        {
                            "type": "VariableDeclaration",
                            "declarations": [
                                {
                                    "type": "VariableDeclarator",
                                    "id": {
                                        "type": "Identifier",
                                        "name": "a"
                                    },
                                    "init": {
                                        "type": "Literal",
                                        "value": 5,
                                        "raw": "5"
                                    }
                                }
                            ],
                            "kind": "var"
                        }
                    ]
                }, function(){
                    assert.isTrue(readFile.calledOnce);
                    assert.isTrue(readFile.calledWith('/a/directory/test.json'), 'var a = 5');
                });

                writeFile.restore();
            });
        });

    });
}