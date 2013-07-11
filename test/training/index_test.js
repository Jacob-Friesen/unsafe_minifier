var _ = require('lodash'),
    chai = require('chai'),
    assert = chai.assert,
    expect = chai.expect,
    sinon = require('sinon'),
    stub = sinon.stub;

var helper = new require('../test_helpers.js')(),
    messages = new require('../../messages.js')(),
    Trainer = require('../../training/index.js');

module.exports = function(callback){
    describe('Train', function(){
        var test = {};
        beforeEach(function(){
            test = {};
            test.trainer = new Trainer('/a/directory/', '/b/directory/', {});
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

                [t.PARTITION, t.ERROR_RATE, t.HIDDEN_SIZE, t.NETWORKS].forEach(function(variable){
                    assert.isTrue(_.isNumber(variable));
                });

                [t.SAVE_NETWORKS, t.PRINT_DATA_STATS, t.PRINT_FANN_OUTPUT, t.PRINT_NETWORK_STATS, t.PRINT_AVERAGE_STATS].forEach(function(variable){
                    assert.isTrue(_.isBoolean(variable));
                });
            });
        });
    });
}