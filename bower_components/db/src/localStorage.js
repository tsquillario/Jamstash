var common = require("./common"),
	localStorage = common.localStorage,
	unobtrusiveTableName = common.unobtrusiveTableName,
	EOF = common.EOF,
	$keys = common.$keys,
	setTimeout = common.setTimeout,
	bind = common.bind,
	$length = common.$length,
	$key = common.$key,
	$removeItem = common.$removeItem,
	indexOf = common.indexOf,
	$getItem = common.$getItem,
	$setItem = common.$setItem,
	prototype = common.prototype,
	NULL = common.NULL,
	nothingToDoHere = common.nothingToDoHere,
	$clear = common.$clear,

	setLength,
	clearOneItem,
	clearAllItems,
	checkIfPresent,
	prepareUpdate,
	readLength,
	asPrototype,

	AsynchronousStorage = function AsynchronousStorage(name, callback, errorback) {
      var self = this;
      self.name = name;
      self.type = localStorage;
      self._db = global[localStorage];
      self._prefix = escape(unobtrusiveTableName + EOF + self.name + EOF);
      self[$keys] = [];
      setLength.call(self);
      setTimeout(bind.call(callback, self, self, self[$length]), 0);
    };

    setLength = function () {
      for (var
        self = this,
        prefix = self._prefix,
        keys = self[$keys],
        db = self._db,
        l = 0, i = 0, length = db[$length],
        key;
        i < length; ++i
      ) {
        if (!(key = db[$key](i) || "").indexOf(prefix)) {
          keys[l++] = key;
        }
      }
      self[$length] = l;
    };

    clearOneItem = function (key, callback, errorback) {
      var
        self = this,
        keys = self[$keys],
        db_key = self._prefix + key,
        i = indexOf.call(keys, db_key)
      ;
      if (~i) {
        keys.splice(i, 1);
        self._db[$removeItem](db_key);
      }
      callback.call(self, key, self);
    };

    clearAllItems = function (callback, errorback) {
      for (var self = this, keys = self[$keys], i = 0, length = keys[$length]; i < length; ++i) {
        self._db[$removeItem](keys[i]);
      }
      callback.call(self, self, self[$length] = self[$keys][$length] = 0);
    };

    checkIfPresent = function (key, callback, errorback) {
      var self = this;
      callback.call(self, self._db[$getItem](self._prefix + key), key, self);
    };

    prepareUpdate = function (key, value, callback, errorback) {
      var
        self = this,
        db_key = self._prefix + key
      ;
      try {
        self._db[$setItem](db_key, value);
        if (!~indexOf.call(self[$keys], db_key)) {
          self[$length] = self[$keys].push(db_key);
        }
        callback.call(self, value, key, self);
      } catch(e) {
        errorback.call(self, e);
      }
    };

    readLength = function (self) {
      if (self._db[$length] < self[$keys][$length]) {
        throw "unobtrusive attempt to manipulate the localStorage";
      }
      return self;
    };

    asPrototype = AsynchronousStorage[prototype];
    asPrototype[$key] = function key(i) {
      var key = readLength(this)[$keys][i];
      return key == NULL ? key : key.slice(this._prefix[$length]);
    };
    asPrototype[$removeItem] = function removeItem(key, callback, errorback) {
      setTimeout(bind.call(clearOneItem, readLength(this), key, callback || nothingToDoHere, errorback || nothingToDoHere), 0);
    };
    asPrototype[$clear] = function clear(callback, errorback) {
      setTimeout(bind.call(clearAllItems, readLength(this), callback || nothingToDoHere, errorback || nothingToDoHere), 0);
    };
    asPrototype[$getItem] = function getItem(key, callback, errorback) {
      setTimeout(bind.call(checkIfPresent, readLength(this), key, callback || nothingToDoHere, errorback || nothingToDoHere), 0);
    };
    asPrototype[$setItem] = function setItem(key, value, callback, errorback) {
      setTimeout(bind.call(prepareUpdate, readLength(this), key, value, callback || nothingToDoHere, errorback || nothingToDoHere), 0);
    };

module.exports = AsynchronousStorage
    