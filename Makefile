# Follows target semantics from Mocha: https://github.com/visionmedia/mocha/blob/master/Makefile
REPORTER = spec

install:
	bash install.sh

.PHONY: install

all: 
	node app.js -g -t

run-generate:
	node app.js -g

run-train:
	node app.js -t

.PHONY: all, run-generate, run-train
 
test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--ui bdd \
		test \
		---u
test-unit: test
test-u: test-unit
 
test-watch:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--growl \
		--ui bdd \
		--watch \
		test \
		---u
test-w: test-watch

test-integration:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--ui bdd \
		test \
		---i
test-i: test-integration

test-all:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--ui bdd \
		test \
		---u \
		---i
test-a: test-all

test-debug:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--ui bdd \
		--debug-brk \
		test \
		---u \
		---i
test-d: test-debug


.PHONY: test test-watch test-integration test-all test-debug
