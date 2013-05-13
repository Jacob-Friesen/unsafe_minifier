// To Run: node main.js <flag(s)>
// To Run All: node main.js -g -t -m <your_file>
// flags:
// -h/help:      Display how to use program (your here currently)
// -g/-generate: Generate the test data
// -t/-train:    Train system on test data
// -m/-minify:   Minify a file using the network trained

var DataGeneration = require('./data_generation');
var Training = require('./training');
var Minification = require('./minification');

var LOCS = {
    rawDataDirectory: 'data/raw_data',
    mergedDataDirectory: 'data/merged_data',
    files: {
        mergeData: ['data/function_data/merge_data.json', true],// second part is clear on test data generate
        validMerges: ['data/function_data/valid_merges.json', false],// second part is clear on test data generate
        combinedData: ['data/function_data/combined.json', true],
        nueralNetwork: ['data/nueral_networks/trained.json', true]
    }
};

var generateTestData = function(callback){
    console.log('\ngenerating data...');
    
    var generator = new DataGeneration(LOCS.rawDataDirectory, LOCS.mergedDataDirectory, LOCS.files);
    generator.generateData(function(){
        console.log('done generating data.\n');
        callback();
    });
};

var trainSystem = function(callback){
    var training = new Training(LOCS.files);
    training.train(callback);
};

var minifyFile = function(callback, file){
    if (typeof file === 'undefined')
        throw('Error: merging file must be specified');
        
    var minification = new Minification(LOCS.files);
    minification.minifyFile(file);
}

var flagToFunction = {
    '-g': generateTestData,
    '-generate': generateTestData,
    '-t': trainSystem,
    '-train': trainSystem,
    '-m': minifyFile,
    '-minify': minifyFile
};

// Currently just creates the test data
(function main(){
    if (process.argv.length === 2 || process.argv[2] === '-h' || process.argv[2] === '-help')
        console.log('\nUsage: ' + process.argv[1].split('/').pop() + ' <flag>\n',
                    'Flags:\n',
                    '-h/help:      Display how to use program (your here currently)\n',
                    '-g/-generate: Generate the test data\n',
                    '-t/-train:    Train system on test data\n',
                    '-m/-minify:   Minify a file using the network trained\n'
                    );
    else
        // Allow more than one consecutive flag so multple steps can be run at once
        flagToFunction[process.argv[2]](function(){
            if (flagToFunction[process.argv[3]])
                flagToFunction[process.argv[3]](function(){
                    if (flagToFunction[process.argv[4]])
                        flagToFunction[process.argv[4]](null, process.argv[5]);
                }, process.argv[4]);
        }, process.argv[3]);
})();