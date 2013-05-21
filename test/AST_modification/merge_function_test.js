var _ = require('lodash'),
    chai = require('chai'),
    sinon = require('sinon'),
    assert = chai.assert,
    expect = chai.expect;

var MergeFunction = require('../../AST_modification/merge_function.js');
var mergeFunction = MergeFunction;
module.exports = function(){
	describe('mergeFunction', function() {
		
		describe('#isDuplicateInsert()', function() {
			beforeEach(function(){
				mergeFunction = new MergeFunction();

				sinon.stub(mergeFunction, "mergeFunctions");
				sinon.stub(mergeFunction, "mergeCalls");
			});

			afterEach(function(){
				mergeFunction.mergeFunctions.restore();
				mergeFunction.mergeCalls.restore();
			})

            it('should return false when no functions have been merged', function() {
                assert.isFalse(mergeFunction.isDuplicateInsert());
            });

            it('should return true when only one function set has been sent in', function() {
                mergeFunction.merge({simpleName: 'call 1'}, {simpleName: 'call 2'}, {}, {}, function(){});
                assert.isTrue(mergeFunction.isDuplicateInsert());
            });

            it('should return false when a second second function set sent in is different and merges.push has not been reached', function() {
                mergeFunction.merge({simpleName: 'call 1'}, {simpleName: 'call 2'}, {}, {}, function(){});

                sinon.stub(mergeFunction.merges, "push");

                mergeFunction.merge({simpleName: 'call 1'}, {simpleName: 'call 3'}, {}, {}, function(){});
                assert.isFalse(mergeFunction.isDuplicateInsert());

                mergeFunction.merges.push.restore();
            });

            it('should return true when a second second function set sent in is different and merges.push has been reached', function() {
                mergeFunction.merge({simpleName: 'call 1'}, {simpleName: 'call 2'}, {}, {}, function(){});
                mergeFunction.merge({simpleName: 'call 1'}, {simpleName: 'call 3'}, {}, {}, function(){});
                assert.isTrue(mergeFunction.isDuplicateInsert());
            });

            it('should return true when a second second function set sent matches a later set and merges.push has not been reached', function() {
            	(function merge(callTo, callFrom){
            		mergeFunction.merge(callTo, callFrom, {}, {}, function(){});
            		return merge;
            	})({simpleName: 'call 1'}, {simpleName: 'call 2'})
            	  ({simpleName: 'call 1'}, {simpleName: 'call 3'}),
            	  ({simpleName: 'call 1'}, {simpleName: 'call 4'}),
            	  ({simpleName: 'call 5'}, {simpleName: 'call 6'});

            	sinon.stub(mergeFunction.merges, "push");

                mergeFunction.merge({simpleName: 'call 1'}, {simpleName: 'call 3'}, {}, {}, function(){});
                assert.isTrue(mergeFunction.isDuplicateInsert());

                mergeFunction.merges.push.restore();
            });
        });
	});
}