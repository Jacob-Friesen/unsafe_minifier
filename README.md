Unsafe Minifier
===============
**Note: This is a prototype, the code quality and test coverage will significantly increase as I move away from the prototype.**

Welcome to the world's first unsafe minifier (at least I think). Unlike traditional (safe) minifiers this minifier attempts to modify the flow of code but not the fundamental function of the code. It is important to note that due to the inclusion of AI, this minification technique will probably never be 100% accurate on choosing what should be minified. Although, over time I intend to get the accuracy about 90%. Finally, this minifer is intented to be used in combination with safe minification to provide levels of minification not possible by safe minification alone.

The code currently runs as a CLI accepting a file to be minified, outputting four files:
 * **file\_name.safe.min.js:** File minified just by the traditional minifier (Uglify.js).
 * **file\_name.min.js:** File unsafely minified.
 * **file\_name.full.min.js:** File unsafely minified.

These four outputs should give a clear picture of the limits and potential of the current version of unsafe minification. Additonally, I have included a simple file in the top directory of the project demonstrating an optimal case of minification.

An analysis and summary of the decisions made can be found in Report.pdf.

**Run**
* **All**: node app.js -g -t -m <file to minify>
* **Generate and train**: node app.js -g -t or make all
* **Generate**: node app.js -g or make run-generate
* **Train**: node app.js -t or make run-train
* **Train**: node app.js -m <file to minify>

Installation
============
These installation instructions are intended for a Debian based OS, though they should apply to most UNIX based OSs.

**Automatic (Debian OS only):**
 * Run: make install

**Dependencies (automatically resolved with the automatic installer):**
 * For NVM:
  * build-essential
  * libssl-dev
  * curl
  * git-core
 * For Node.js:
  * python
  * g++
  * make
 * For safe minification: UglifyJS (NPM module)

**Manual:**

1. Install Node.js v0.8.2, not the latest as there is a problem with the node fann bindings library.
 * I suggest using [nvm](https://github.com/creationix/nvm) (Node Version Manager) to install Node.js.
2. Install Uglify.js globally: npm install uglify-js -g
3. Installing FANN (Fast Artificial Nueral Networks):
 * Install [CMAKE](http://www.cmake.org/cmake/resources/software.html) so you can build FANN.
 * Install [FANN](http://leenissen.dk/fann/wp/download/).
   * [Installation instructions](http://leenissen.dk/fann/wp/help/installing-fann/)
4. If running "node main.js" results in an error, run 'ldconfig'. The exact command may vary based on OS.

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
 * **training:** Code to train and save the nueral networks.
 * **tests:** Tests for all the code, can be run from the top level with: make test-all

**Files:**
 * **app.js:** Central file that runs everything.
 * **install.sh:** Bash script that runs the installation process automatically.
 * **Makefile** Defines the commands to test this application.
 * **messages.js:** Central location of all error and console messages.
 * **MIT_License:** Document explaining this project's MIT license, nothing special added.
 * **report.pdf:** Report on why I made the choices I did and some of the data behind those choices. This is now becoming out of date as it was done at the start of the project.
 * **simple_example.js:** A two function file with 2 calls that can be minified, same example as in report.
 * **simple_example.min.js:** The simple example unsafely minified.
 * **simple_example.full.min.js:** The simple example unsafely minified and then safely minified.
 * **simple_example.safe.min.js:** The simple example just safely minified.
 * **utility.js:** A bunch of functions I wrote (except the custom array remove) for use in the entire program.

Testing
=======
**To run all tests:** make test-all or make test-a

**Debugging Tests:** One debug listener for unit and integration tests
 * Make sure to have [node-inspector](https://github.com/node-inspector/node-inspector) installed globally
1. **Start the listener:** make test-d or make test-debug
2. **Start the inspector:** node-inspector
3. **Debug in Chrome:** Go to the listed page in Chrome (and only Chrome), probably [http://127.0.0.1:8080/debug?port=5858](http://127.0.0.1:8080/debug?port=5858)

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

**Short Term: Test and improve function finding in the AST analysis.**

Contributions
=============
Apart from unit tests for function finding in ASTs the project is fully tested so contributions are now welcome.
