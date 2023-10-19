build: npm_install bundle_install
	bundle exec nanoc

clean:
	rm -rf output/*

npm_install:
	npm ci --silent

bundle_install:
	bundle install

start:
	nanoc view
