Unsafe Minifier
===============
**Note: This is a prototype, the code quality and test converage will significantly increase as I move away from the prototype.**


Welcome to the world's first unsafe minifier (at least I think). Unlike traditional (safe) minifiers this minifier attempts to modify the flow of code but not the fundamental function of the code. It is important to note that due to the inclusion of AI, this minification technique will probably never be 100% accurate on choosing what should be minified. Although, over time I intend to get the accuracy about 90%. Finally, this minifer is intented to be used in combination with safe minification to provide levels of minification not possible by safe minification alone.

The code currently runs as a CLI accepting a file to be minified, outputting four files:
 * file\_name.safe.min.js: File minified just by the traditional minifier (YUI)
 * file\_name.min.js: File unsafely minified
 * file\_name.full.min.js: File unsafely minified
These four outputs should give a clear picture of the limits and potential of the current version unsafe minification. Additonally, I have included a simple file in the top directory of the project demonstrating an optimal case of minification.

More details about the code structure and function can be found in README.txt. Additionally, installation instructions are listed in install.txt. Finally, an analysis and summary of the decisions made can be found in Report.pdf.

Future
======

The goal is to upgrade the minifier to the point where it can correct choose above 90% of minifications and where it provides a minification bonus of 50%.

**Short Term: Simplify installation so it can be done in 1 step.**

Contributions
=============

I am happy to accept any help, but I would suggest those willing to wait until I get much more complete test coverage (for their own sanity). This should happen in the next few weeks.
