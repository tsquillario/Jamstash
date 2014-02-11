var common = require("./common"),
	unobtrusiveTableName = common.unobtrusiveTableName,
	EOF = common.EOF,
	$key = common.$key,
	$keys = common.$keys,
	$length = common.$length,
	$removeItem = common.$removeItem,
	$clear = common.$clear,
	$getItem = common.$getItem,
	$setItem = common.$setItem,
	setTimeout = common.setTimeout,
	bind = common.bind,
	indexOf = common.indexOf,
	nothingToDoHere = common.nothingToDoHere,
	NULL = common.NULL,
	concat = common.concat,
	prototype = common.prototype,
	clearOneItem,
	readLength,
	clearAllItems,
	setLength,
	checkIfPresent,
	asPrototype,
	prepareUpdate,

	AsynchronousStorage = function AsynchronousStorage(name, callback, errorback) {
      var self = this;
      self.name = name;
      self.type = "cookie";
      self._db = global.document;
      self._prefix = unobtrusiveTableName + EOF + self.name + EOF;
      self[$keys] = [];
      setLength.call(self);
      setTimeout(bind.call(callback, self, self, self[$length]), 0);
    };

    setLength = function () {
      for (var
        self = this,
        db = self._db.cookie.split(";"),
        prefix = escape(self._prefix),
        keys = self[$keys],
        l = 0, i = 0, length = db[$length],
        db_key, tmp, value;
        i < length; ++i
      ) {
        db_key = db[i];
        if (!~db_key.indexOf(prefix)) {
          keys[l++] = unescape(db_key.slice(0, db_key.indexOf("=")));
        }
      }
      self[$length] = l;
    };

    readLength = function (self) {
      // no idea how to properly prevent other libraries to erase AsynchronousStorage cookies
      // ... oh, well, better than nothing I guess
      if (self._db.cookie[$length] < self[$keys].join(";")[$length]) {
        throw "unobtrusive attempt to manipulate cookies";
      }
      return self;
    };

    clearOneItem = function (key, callback, errorback) {
      var
        self = this,
        keys = self[$keys],
        unescapedKey = self._prefix + key,
        db_key = escape(unescapedKey),
        i = self._db.cookie.indexOf(db_key)
      ;
      if (~i) {
        self._db.cookie = db_key + "=;expires=Thu, 01-Jan-1970 00:00:01 GMT";
        i = indexOf.call(keys, unescapedKey);
        if (~i) {
          keys.splice(i, 1);
          self[$length] = keys.length;
        }
      }
      callback.call(self, key, self);
    };

    clearAllItems = function (callback, errorback) {
      for (var self = this, prefix = self._prefix, keys = self[$keys], i = keys.length; i--; clearOneItem.call(
        self, keys[i].slice(prefix.length), nothingToDoHere, nothingToDoHere
      ));
      callback.call(self, self, self[$length] = self[$keys][$length] = 0);
    };

    checkIfPresent = function (key, callback, errorback) {
      var
        self = this,
        db = self._db.cookie,
        db_key = escape(self._prefix + key),
        cl = db.indexOf(db_key + '=') + db_key[$length],
        result = NULL,
        ce
      ;
      if (++cl > db_key[$length]) {
        ce = db.indexOf(';', cl);
        ce < 0 && (ce = db[$length]);
        result = unescape(db.substr(cl, ce - cl));
      }
      callback.call(self, result, key, self);
    };

    prepareUpdate = function (key, value, callback, errorback) {
      var
        self = this,
        db = self._db.cookie,
        db_key = self._prefix + key,
        escapedKey = escape(db_key)
      ;
      if (!~db.indexOf(escapedKey)) {
        self[$length] = self[$keys].push(db_key);
      }
      self._db.cookie = concat(
        escapedKey, "=", escape(value), ";",
        "expires=", (new Date(+new Date + 365 * 60 * 60 * 24)).toGMTString()
      );
      callback.call(self, value, key, self);
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
