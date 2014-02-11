var common = require("./common"),
	nothingToDoHere = common.nothingToDoHere,
	openDatabase = common.openDatabase,
	localStorage = common.localStorage,
	AsynchronousStorage,
	create = function create(name, callback, errorback, size) {
		return new AsynchronousStorage(name, callback || nothingToDoHere, errorback || nothingToDoHere, size || 1 << 20);
	}

  // the circus ... hopefully a bloody fallback will always be available
  if (openDatabase in global) {
    AsynchronousStorage = require('./WebSQL')
  } else if (common.indexedDB) {
    AsynchronousStorage = require('./IndexedDB')
  } else if (localStorage in global) {
    AsynchronousStorage = require('./localStorage')
  } else {
    AsynchronousStorage = require('./cookie')
  }

module.exports = {create: create}
