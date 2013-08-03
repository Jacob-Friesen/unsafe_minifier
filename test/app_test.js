var _ = require('lodash'),
    chai = require('chai'),
    assert = chai.assert;

var u = require('../utility_functions.js'),
    App = require('../app.js');

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
        });

    });
}