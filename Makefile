build: npm_install bundle_install
	bundle exec nanoc

clean:
	rm -rf output/*

npm_install:
	npm ci --silent

bundle_install:
	bundle install

start:
	bundle exec nanoc view

watch:
	bundle exec nanoc live

check:
	bundle exec nanoc check

a11y:
	npm run a11y
