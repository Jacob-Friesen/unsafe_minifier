var chai = require('chai'),
    assert = chai.assert,
    expect = chai.expect,
    sinon = require('sinon'),
    stub = sinon.stub;

var u = require('../utility.js'),
    Messages = new require('../messages.js');

module.exports = function(callback){
    var messages = null;
    beforeEach(function(){
        messages = new Messages();
    });

    after(function(){
        callback();
    });

    describe('#error()', function(){
        it('should throw an error with the given message', function(){
            expect(function(){
                messages.error('test')
            }).to.throw('test');
        })
    });

    describe('#messages()', function(){
        describe('form', function(){
            it('should return an object that toStrings to the given message', function(){
                assert.equal(messages.form('test'), 'test');
            });

            it('should return an object that has all of a strings methods', function(){
                var msg = messages.form('test');

                Object.getOwnPropertyNames(String.prototype).forEach(function(property) {
                    if (property !== 'length')
                        assert.equal(msg[property], String.prototype[property]);
                });
                assert.equal(msg.length, 4);
            });

            it('should have a send call that prints the object if the wrapping object says its OK to print', function(){
                var consoleStub = stub(console, 'log');

                messages.print = true;
                messages.form('test').send();

                assert.isTrue(consoleStub.calledOnce);
                assert.isTrue(consoleStub.calledWith('test'));

                console.log.restore();
            });

            it('should have a error call that calls the message.error function', function(){
                var errorStub = stub(messages, 'error');

                messages.form('test').error();

                assert.isTrue(errorStub.calledOnce);
                assert.isTrue(errorStub.calledWith('test'));

                messages.error.restore();
            });

            it('should not print when the wrapping objects print property is false', function(){
                var consoleStub = stub(console, 'log');

                messages.print = false;
                messages.form('test').send();

                assert.isFalse(consoleStub.called);

                console.log.restore();
            });
        });

        describe('#create()', function(){
            it('should add no properties if the object is null or undefined and return what was sent', function(){
                var test = {};
                assert.equal(messages.create(), test.undefined);
                assert.equal(messages.create(null), null);
            });

            it('it should add properties to the object in any other case and return the modified object', function(){
               assert.deepEqual(messages.create({property1: 1}), {
                    print: true,
                    form: messages.form,
                    property1: 1
               });
            });
        });
    });

}