var _ = require('lodash'),
    chai = require('chai'),
    assert = chai.assert;

var u = require('../utility_functions.js'),
    DataGeneration = require('../generation'),
    Training = require('../training'),
    Minification = require('../minification'),
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

            it('should give the object versions of objects with constructors', function(){
                assert.deepEqual(DataGeneration, test.app.DataGeneration);
                assert.deepEqual(Training, test.app.Training);
                assert.deepEqual(Minification, test.app.Minification);
            });
        });

        describe('#generateTrainingData()', function(){
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

            it('should call DataGeneration.generateData with null and the callback', function(){
                var callback = stub();
                test.app.generateTrainingData(callback);

                assert.isTrue(test.generateData.calledOnce);
                assert.isTrue(test.generateData.calledWith(null, callback));
            });
        });

        describe('#trainSystem()', function(){
            beforeEach(function(){
                test.Training = stub(test.app, 'Training');

                test.train = stub();
                test.Training.returns({train: test.train});
            });

            afterEach(function(){
                test.Training.restore();
            });

            it('should call the Training constructor with the files', function(){
                test.app.trainSystem();

                assert.isTrue(test.Training.calledOnce);
                assert.isTrue(test.Training.calledWith(test.app.LOCS.files));
            });

            it('should call DataGeneration.train with the callback', function(){
                var callback = stub();
                test.app.trainSystem(callback);

                assert.isTrue(test.train.calledOnce);
                assert.isTrue(test.train.calledWith(callback));
            });
        });

    });
}