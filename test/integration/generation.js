var fs = require('fs'),
    _ = require('lodash'),
    esprima = require("esprima"),
    chai = require('chai'),
    sinon = require('sinon'),
    stub = sinon.stub,
    assert = chai.assert,
    expect = chai.expect;

var main = require('fs');

var tests = 'data/raw_data',
    verification = 'data/merged_data',
    Generator = require('../../generation');

var COMMENT_MARK = 'test:';// Where verification comments are, stripped out of verification cases

module.exports = function(){
    describe('Generation Tests', function(){
        var comments = null;
        var verifyFiles = null;

        before(function(done){
            getData(done);
        })

        it('Must have an non-empty it() to trigger test runs', function(){});

        // Get all the data for testing by opening the specified test and verification directories and reading files in there.
        function getData(callback){
            // Get all the test files
            var filenames = fs.readdirSync(tests);
                filenames = _.reject(filenames, function(name){ return name.slice(-1) === '~'});// Remove temporary files
                filenames = _.reject(filenames, function(name){ return name.search('test') < 0});

            // Write the generated data
            var generator = new Generator(tests, verification, {});

            generator.generateData(filenames, function(){
                // Get all the comments in the unmmerged file
                comments = new CommentsList();
                comments.find(filenames, function(){

                    // Get all the merged file contents
                    verifyFiles = new verifyFileList();
                    verifyFiles.find(filenames, function(){
                        runTests();
                        callback();
                    });
                });
            });
        }

        // Verify all expected comments appear in the verification files
        function runTests(callback){
            verifyFiles.forEach(function(filename, content){
                describe(filename, function(){

                    // Create a test for finding each comment
                    content = sanitize(content);
                    comments.forEachOf(filename, function(comment){
                        it('has matching expectations to code with ' + functionName(comment), function(){
                            assert.isTrue(content.indexOf(
                                sanitize(comment)) >= 0,'Transformation was not found in '+verification+'/'+filename+':\n' + comment
                            );
                        });
                    });
                });
            });

            return true;
        }

        // Getting the name isn't top priority, hence the naive approach.
        function functionName(funct){
            var functionName = funct.replace('function ','').split('(')[0];
            // assuming the most important function is last
            if (functionName.indexOf('{') >= 0){
                functionName = funct.split('function')[0].split('{').pop();
                functionName = functionName.replace(/[:,]/g, "");
            }
            if (functionName.indexOf(';') >= 0)
                functionName = functionName.split(';').pop();
            functionName = functionName.replace('=','')

            return sanitize(functionName);
        }

        // Removes line endings, tabs, and spaces
        function sanitize(string){
            return string.replace(/[\n\r\t ]/g, "");
        }

    });

    return this;
}

var CommentsList = function(){
    var _this = this;
    var comments = {};

    // Find every comment for every file, these will be used to string match into the main files.
    this.find = function(filenames, callback){
        var filesRead = 0;
        filenames.forEach(function(file){
            fs.readFile(tests + "/" + file, 'utf8', function (err, data) {
                if (err) throw err;

                _this.findTestASTComments(file, esprima.parse(data, {loc: true, comment: true}));

                filesRead += 1;
                if (filesRead === filenames.length)
                    callback();
            });
        });
    }

    // Finds all valid test comments in a given AST. filename is used to give a key for the comment values. 
    this.findTestASTComments = function(filename, AST){
        if (AST.comments){
            AST.comments.forEach(function(comment){
                if (comment.value.search(COMMENT_MARK) >= 0){
                    // get rid of test marker and its empty line then add the comment to the appropriate file
                    comment = comment.value.replace(COMMENT_MARK,'').substring(1);
                    comments[filename] = comments[filename] || [];
                    comments[filename].push(comment);
                }
            });
        }

        return true;
    }

    // Makes commentsList easier to use
    this.forEachOf = function(name, callback){
        if (!comments[name])
            return true;

        comments[name].forEach(function(comment){
            callback(comment);
        });

        return true;
    }

    return this;
}

var verifyFileList = function(){
    var contents = {};

    // Finds all the file contents for the listed files and stores them in contents
    this.find = function(filenames, callback){
        var filesRead = 0;
        filenames.forEach(function(file){
            fs.readFile(verification + "/" + file, 'utf8', function (err, data) {
                if (err) throw err;

                contents[file] = data;

                filesRead += 1;
                if (filesRead === filenames.length)
                    callback();
            });
        });
    }

    // Makes commentsList easier to use
    this.forEach = function(callback){
        for (name in contents)
            callback(name, contents[name]);

        return true;
    }

    return this;
}