all:
	@mkdir -p build
	@npm install
	./node_modules/.bin/wrup  -c -r asyncStorage ./src/asyncStorage.js > ./build/asyncStorage.js
	./node_modules/.bin/wrup  -r asyncStorage ./src/asyncStorage.js > ./build/asyncStorage.max.js

