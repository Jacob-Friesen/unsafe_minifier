var _ = require('lodash'),
    chai = require('chai'),
    assert = chai.assert,
    expect = chai.expect,
    sinon = require('sinon'),
    stub = sinon.stub,
    fs = require('fs'),
    esprima = require('esprima');

var helper = new require('../test_helpers.js')(),
    messages = new require('../../messages.js')(),
    MergeFunctions = require('../../AST_modification/merge_functions.js'),
    Generator = require('../../generation/index.js');

module.exports = function(callback){
    describe('Generator', function(){
        var generator = null,
            test = {};
        beforeEach(function(){
            test = {};
            generator = new Generator('/a/directory/', '/b/directory/', {});
        });

        after(function(){
            callback();
        });

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

        describe('#getFileList()', function(){
            it('should return an empty array if the directory is null or undefined', function(){
                helper.nullUndefinedTest(function(){
                    assert.deepEqual(generator.getFileList(), []);
                });
            });

            it('should read the file directory in sync and then reject all temporary files', function(){
                var readDirSync = stub(fs, 'readdirSync');
                readDirSync.returns([
                    'file1.json',
                    'file1.json~',
                    'file2.json'
                ]);

                assert.deepEqual(generator.getFileList('a/directory/'), [
                    'file1.json',
                    'file2.json'
                ]);

                assert.isTrue(readDirSync.calledOnce);
                assert.isTrue(readDirSync.calledWith('a/directory/'));

                readDirSync.restore();
            });
        });

        describe('#clearFileData()', function(){
            it('should return an empty object when null or undefined is sent', function(){
                helper.nullUndefinedTest(function(files){
                    assert.deepEqual(generator.clearFileData(files), {}); 
                });
            });

            it('should return an empty object when files is an array', function(){
                assert.deepEqual(generator.clearFileData(['test1.json', 'test2.json']), {});
            });

            it('should return an empty object when files items are not arrays', function(){
                assert.deepEqual(generator.clearFileData({
                    file1: 'data/file1.json',
                    file2: 'data/file2.json',
                }), {});
            });

            it('should return an object containing the same property names but the property is set to a string instead of an array', function(){
                assert.deepEqual(generator.clearFileData({
                    file1: ['data/file1.json', false],
                    file2: ['data/file2.json', false]
                }), {
                    file1: 'data/file1.json',
                    file2: 'data/file2.json',
                });
            });

            it('should write empty data to a file for each specified true file', function(){
                var writeFileSync = stub(fs, 'writeFileSync');

                generator.clearFileData({
                    file1: ['data/file1.json', true],
                    file2: ['data/file2.json', false],
                    file3: ['data/file3.json', true]
                });

                //assert.isTrue(writeFile.calledTwice);
                assert.isTrue(writeFileSync.calledTwice);
                assert.equal(writeFileSync.args[0][0], 'data/file1.json');
                assert.equal(writeFileSync.args[0][1], '');
                assert.equal(writeFileSync.args[1][0], 'data/file3.json');
                assert.equal(writeFileSync.args[1][1], '');

                writeFileSync.restore();
            });
        });

        describe('#generateData()', function(){
            function doCommonStubs(){
                test.clearFileData = stub(generator, 'clearFileData');
                test.getFileList = stub(generator, 'getFileList');
                test.readFile = stub(fs, 'readFile');
                test.parse = stub(esprima, 'parse');
                test.MergeFunctions = stub(generator, 'MergeFunctions');
                test.writeToMergedFile = stub(generator, 'writeToMergedFile');
            };

            // returns object containing files, parseReturn and filenames
            function prepareForUnderMergeTests(){
                var o = {
                    files: {file1: 'file1.json'},
                    parseReturn: {body: {}},
                    filenames: ['test1.json', 'test2.json', 'test3.json']
                }

                test.clearFileData.returns(o.files);
                test.readFile.callsArg(2);
                test.parse.returns(o.parseReturn);

                test.MergeFunctions.returns({merge: function(){}});

                // merge.merge part
                var createdMerge = new MergeFunctions(o.files, o.parseReturn);
                test.merge = stub(createdMerge, 'merge');
                test.MergeFunctions.returns(createdMerge);

                return o;
            }

            afterEach(function(){
                test.clearFileData.restore();
                test.getFileList.restore();
                test.readFile.restore();
                test.parse.restore();
                test.MergeFunctions.restore();
                test.writeToMergedFile.restore();
            });

            it('should call clearFileData with the given files object to generator', function(){
                generator = new Generator('/a/directory/', '/b/directory/', {file: 'file1.json'});
                
                doCommonStubs();
                test.getFileList.returns([]);

                generator.generateData();
                assert.isTrue(test.clearFileData.calledOnce);
                assert.isTrue(test.clearFileData.calledWith({file: 'file1.json'}));
            });

            it('should call clearFileData when filenames are null or undefined', function(){
                generator = new Generator('/a/directory/', '/b/directory/', {});
                
                doCommonStubs();
                test.getFileList.returns([]);

                helper.nullUndefinedTest(function(filenames){
                    generator.generateData(filenames);
                    assert.isTrue(test.getFileList.calledOnce);
                    assert.isTrue(test.getFileList.calledWith('/a/directory/'));

                    test.getFileList.callCount -= 1;
                })

            });

            it('should not call clearFileData with the filenames are specified', function(){
                doCommonStubs();

                generator.generateData(['test1.json']);
                assert.isFalse(test.getFileList.called);
            });

            it('should call each file of filesnames with the rawdirectory in front using utf8', function(){
                generator = new Generator('/a/directory', '/b/directory/', {});
                doCommonStubs();

                var filenames = ['test1.json', 'test2.json', 'test3.json'];

                generator.generateData(filenames);

                assert.equal(test.readFile.callCount, filenames.length);
                filenames.forEach(function(file, index){
                    assert.equal(test.readFile.args[index][0], '/a/directory' + '/' + filenames[index]);
                    assert.equal(test.readFile.args[index][1], 'utf8');
                });
            });

            it('should construct mergeFunctions with the correct arguments for each file', function(){
                doCommonStubs();
                var o = prepareForUnderMergeTests();

                generator.generateData(o.filenames);

                assert.equal(test.MergeFunctions.callCount, o.filenames.length);
                o.filenames.forEach(function(file, index){
                    assert.equal(test.MergeFunctions.args[index][0], o.files);
                    assert.equal(test.MergeFunctions.args[index][1], o.parseReturn);
                });
            });

            it('should construct mergeFunctions.merge with the correct arguments for each file', function(){
                doCommonStubs();
                var o = prepareForUnderMergeTests();

                generator.generateData(o.filenames);

                assert.equal(test.merge.callCount, o.filenames.length);
                o.filenames.forEach(function(file, index){
                    assert.equal(test.merge.args[index][0], o.filenames[index]);
                    assert.isTrue(_.isFunction(test.merge.args[index][1]));
                    assert.equal(test.merge.args[index][2], null);
                });
            });

            it('should write to merged File with mergedDataDirectory, file and AST', function(){
                generator = new Generator('/a/directory', '/b/directory/', {});
                doCommonStubs();
                var o = prepareForUnderMergeTests();
                test.merge.callsArgWith(1, o.parseReturn);

                generator.generateData(o.filenames);

                assert.equal(test.writeToMergedFile.callCount, o.filenames.length);
                o.filenames.forEach(function(file, index){
                    assert.equal(test.writeToMergedFile.args[index][0], '/b/directory/');
                    assert.equal(test.writeToMergedFile.args[index][1], o.filenames[index]);
                    assert.equal(test.writeToMergedFile.args[index][2], o.parseReturn);
                });
            });

            it('should send to mergeStatsWithValidation only once with mergedDataDirectory, file, AST and the given callback', function(){
                doCommonStubs();
                var o = prepareForUnderMergeTests();
                test.merge.callsArgWith(1, o.parseReturn);
                test.writeToMergedFile.callsArg(3);

                var files = {
                    mergeData: 'test1.json',
                    validMerges: 'test2.json',
                    combinedData: 'test3.json'
                }
                test.clearFileData.returns(files);

                var mergeStatsWithValidation = stub(generator, 'mergeStatsWithValidation');

                var callback = function(){return true};
                generator.generateData(o.filenames, callback);

                assert.isTrue(mergeStatsWithValidation.calledOnce);
                assert.isTrue(mergeStatsWithValidation.calledWith(files.mergeData, files.validMerges, files.combinedData, callback));

                mergeStatsWithValidation.restore();
            });
        });

    });
}