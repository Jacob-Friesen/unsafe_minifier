var _ = require('lodash'),
    chai = require('chai'),
    assert = chai.assert;

var u = require('../utility_functions.js'),
    App = require('../app.js');

// These tests only apply to in function/object relationships, they are not integration tests. There are near end to end integration tests in the 
// integration folder.
module.exports = function(callback){
    describe('App', function(){
        var test = {}
        beforeEach(function(){
            test = {};

            test.app = new App();
        })

        after(function(){
            callback();
        });

        describe('#constructor()', function(){
            it('should have a LOCS object with files and directories', function(){
                assert.isString(test.app.LOCS.rawDataDirectory);
                assert.isString(test.app.LOCS.mergedDataDirectory);
                assert.isObject(test.app.LOCS.files);
                assert.isFalse(_.isEmpty(test.app.LOCS.files));
            });

            it('should have a flag to function table with each value pointing to a function', function(){
                for (flag in test.app.flagToFunction){
                    assert.isString(flag);
                    assert.isFunction(test.app.flagToFunction[flag]);
                }
            });
        });

        describe.only('#generateTrainingData()', function(){
            beforeEach(function(){
                test.DataGeneration = stub(test.app, 'DataGeneration');

                test.generateData = stub();
                test.DataGeneration.returns({generateData: test.generateData});

            });

            afterEach(function(){
                test.DataGeneration.restore();
            });

            it('should call the DataGeneration constructor with the raw and merged directories and the files', function(){
                test.app.generateTrainingData();

                var locs = test.app.LOCS;
                assert.isTrue(test.DataGeneration.calledOnce);
                assert.isTrue(test.DataGeneration.calledWith(locs.rawDataDirectory, locs.mergedDataDirectory, locs.files));
            });

            it('should call DataGeneration.generateData with null', function(){
                test.app.generateTrainingData();

                assert.isTrue(test.generateData.calledOnce);
                assert.isTrue(test.generateData.calledWith(null));
            });

            it('should call the callback after generateData', function(){
                var callback = stub();
                test.generateData.callsArg(1);

                test.app.generateTrainingData(callback);

                assert.isTrue(callback.calledOnce);
            });
        });

    });
}