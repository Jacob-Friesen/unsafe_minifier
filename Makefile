REPORTER = spec

install:
	bash install.sh
 
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


.PHONY: install test test-watch test-integration test-all test-debug
