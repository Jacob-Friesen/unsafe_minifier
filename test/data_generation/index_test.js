var chai = require('chai'),
    assert = chai.assert,
    expect = chai.expect;

var helper = new require('../test_helpers.js')(),
	messages = new require('../../messages.js')(),
	Generator = require('../../data_generation/index.js');


module.exports = function(callback){
    describe('Generator', function(){

    	var generator = null;
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

    });
}