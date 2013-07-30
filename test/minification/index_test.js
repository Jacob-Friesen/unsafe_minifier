var _ = require('lodash'),
    chai = require('chai'),
    assert = chai.assert,
    expect = chai.expect;

var helper = new require('../test_helpers.js')(),
    messages = new require('../../messages.js')(),
    Minification = require('../../minification/index.js'),
    Training = require('../../training/index.js');

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
                assert.isNumber(test.minification.NETWORKS);
                assert.isBoolean(test.minification.PRINT_MERGES);
            });
        });
    });
}