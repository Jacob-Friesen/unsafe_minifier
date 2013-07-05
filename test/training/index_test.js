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
    Generator = require('../../data_generation/index.js');

module.exports = function(callback){
    describe('Generator', function(){
        var generator = null,
            test = {};
        beforeEach(function(){
            generator = new Generator('/a/directory/', '/b/directory/', {});
        });

        after(function(){
            callback();
        });
    });
}