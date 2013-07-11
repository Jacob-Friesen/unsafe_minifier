Unsafe Minifier
===============
**Note: This is a prototype, the code quality and test coverage will significantly increase as I move away from the prototype.**

Welcome to the world's first unsafe minifier (at least I think). Unlike traditional (safe) minifiers this minifier attempts to modify the flow of code but not the fundamental function of the code. It is important to note that due to the inclusion of AI, this minification technique will probably never be 100% accurate on choosing what should be minified. Although, over time I intend to get the accuracy about 90%. Finally, this minifer is intented to be used in combination with safe minification to provide levels of minification not possible by safe minification alone.

The code currently runs as a CLI accepting a file to be minified, outputting four files:
 * **file\_name.safe.min.js:** File minified just by the traditional minifier (YUI).
 * **file\_name.min.js:** File unsafely minified.
 * **file\_name.full.min.js:** File unsafely minified.

These four outputs should give a clear picture of the limits and potential of the current version of unsafe minification. Additonally, I have included a simple file in the top directory of the project demonstrating an optimal case of minification.

An analysis and summary of the decisions made can be found in Report.pdf.

Installation
============
These installation instructions are intended for a Debian based OS, though they should apply to most UNIX based OSs.

1. Install Java (If you just want to view training data and data generation this is unnecessary).
2. Install node v0.8.2, not the latest as there is a problem with the node fann bindings library.
 * I suggest using [nvm](https://github.com/creationix/nvm) (node version manager) to do this.
 * **Do not** use NPM to install packages, I have had to quickly modify a few libraries to iron out some of their bugs.
3. Installing FANN (Fast Artificial Nueral Networks):
 * Install [CMAKE](http://www.cmake.org/cmake/resources/software.html) so you can build FANN.
 * Install [FANN](http://leenissen.dk/fann/wp/download/).
   * [Installation instructions](http://leenissen.dk/fann/wp/help/installing-fann/)
4. If running "node main.js" results in an error, run 'ldconfig'. The exact command may vary based on OS.
5. If running "node main.js" still results in an error, you probably need to recompile the Node Fann bindings:
 * Install node-gyp globally (using npm: npm install -g node-gyp).
 * Navigate to node_modules/node-fann.
 * Run: node-gyp configure
 * Run: node-gyp build

Contact me at jacob@jacobfriesen.com if any of these steps don't work on your machine.

Structure Of The Application
============================
Below is an explanation of the main files and directories in this directory. Details on specific directory structure can be found in respective READMEs.

**Directories:**
 * **AST_modification:** Code to transform ASTs, mostly function merging. Includes statistics generation.
 * **data:** where raw, transformed, and statistical data is contained.
 * **generation:** Code used to create data for that the training section trains on.
 * **minification:** Code used to minify a sent in file.
 * **node_modules:** Libraries that were used in my code are stored here.
 * **safe_minifier:** The YUI Compressor, yes it's in Java and no there seems to be no good well known non-Java minifiers.
 * **training:** Code to train and save the nueral networks.
 * **tests:** Tests for all the code, can be run from the top level with: make test-all

**Files:**
 * **Makefile** Defines the commands to test this application.
 * **app.js:** Central file that runs everything.
 * **messages.js:** Central location of all error and console messages.
 * **report.pdf:** Report on why I made the choices I did and some of the data behind those choices.
 * **simple_example.js:** A two function file with 2 calls that can be minified, same example as in report.
 * **simple_example.min.js:** The simple example unsafely minified.
 * **simple_example.full.min.js:** The simple example unsafely minified and then safely minified.
 * **simple_example.safe.min.js:** The simple example just safely minified.
 * **utility_functions.js:** A bunch of functions I wrote (except the custom array remove) for use in the entire program.

Testing
=======
**To run all tests:** make test-all

**Unit Tests:** Covers all lower level code.
 * **Run them once:** make test or make test-u or make test-unit
 * **Run them with every code change:** make test-w or make test-watch

**Integration Tests:** Covers the three main sections of the code; data generation, machine learning, code minification.
 * **Run them once:** make test-i or make test-integration
 * **Generator tests:**
    * All files in data/raw_data ending in "test" will be used.
    * Test by writing two functions to be merged then specify what the result code should be:

---
    function1 (a){ console.log(a); }
    function2 (b){ return b * 2; }
    
    function1('hello');
    var b = function2(b);

    /*test:
    function double(a, b) {
    {
      console.log(a);
    }
    return b * 2;
    }
    var b = double('hello', b);
    */
---

All parts of the code are to be tested although to different degrees. Low level code will have unit tests (in a behavioral style) like in the current utility_function.js tests. The test code is located in
the test directory and is driven by the index.js file there. Tests are run by a Makefile which specifies
mocha to test in a certian way.

Future
======
The goal is to upgrade the minifier to the point where it can correct choose above 90% of minifications and where it provides a minification bonus of 50%.

**Short Term: Simplify installation so it can be done in 1 step and test all the code.**

Contributions
=============
I am happy to accept any help, but I would suggest those willing to wait until I get much more complete test coverage (for their own sanity). This should happen in the next few weeks.
