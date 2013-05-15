REPORTER = spec
 
test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--ui bdd
 
test-w:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--growl \
		--ui bdd \
		--watch
 
.PHONY: test test-w