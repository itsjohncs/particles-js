.PHONY: build

build:
	webpack

	mkdir -p build/compressed
	mkdir -p build/compressed/js
	cp index.htm ./build/compressed/index.htm

	node_modules/uglifyjs/bin/uglifyjs \
		build/bundle.js --compress --mangle \
	    --output build/compressed/js/bundle.js

	node_modules/postcss-cli/bin/postcss \
		--use autoprefixer --use cssnano index.css -d ./build/compressed/

	node inline-resources.js > ./build/index.compressed.htm
