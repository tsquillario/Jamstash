// IndexedDB version
var common = require("./common"),
	indexedDB = common.indexedDB,
	bind = common.bind,
	unobtrusiveTableName = common.unobtrusiveTableName,
	keyFieldName = common.keyFieldName,
	valueFieldName = common.valueFieldName,
	$key = common.$key,
	$keys = common.$keys,
	$length = common.$length,
	NULL = common.NULL,
	indexOf = common.indexOf,
	transaction = common.transaction,
	prototype = common.prototype,
	$removeItem = common.$removeItem,
	nothingToDoHere = common.nothingToDoHere,
	$clear = common.$clear,
	$getItem = common.$getItem,
	$setItem = common.$setItem,

	asPrototype,
	setLength,
	checkLength,
	readLength,
	prepareTable,
	executeSql,
	ndexedDB,
	readTransaction,
	onGetComplete,
	onCheckComplete,
	onUpdateComplete,
	onItemCleared,
	onItemsCleared,

	AsynchronousStorage = function AsynchronousStorage(name, callback, errorback) {
      try {
        var
          self = this,
          db = indexedDB.open(self.name = name, 1)
        ;
        self.type = "IndexedDB";
        db[readTransaction]("upgradeneeded", prepareTable, !1);
        db[readTransaction](executeSql, bind.call(readLength, self, callback), !1);
        db[readTransaction](ndexedDB, bind.call(errorback, self), !1);
      } catch(o_O) {
        errorback.call(this, o_O);
      }
    };

    executeSql = "success";
    ndexedDB = "error";
    readTransaction = "addEventListener";

    prepareTable = function (event) {
      event.target.result.createObjectStore(
        unobtrusiveTableName, {
          keyPath: keyFieldName,
          autoIncrement: !1
      }).createIndex(
        valueFieldName,
        valueFieldName,
        {unique: !1}
      );
    };

    readLength = function (callback, event) {
      var self = this;
      self[$keys] = [];
      self._db = event.target.result;
      onGetComplete(self).openCursor()[readTransaction](
        executeSql,
        bind.call(checkLength, self, callback),
        !1
      );
    };

    checkLength = function (callback, event) {
      var
        self = this,
        cursor = event.target.result
      ;
      if (cursor) {
        self[$keys].push(cursor.key);
        cursor["continue"]();
      } else {
        callback.call(self, self, setLength(self));
      }
    };

    setLength = function (self) {
      return self[$length] = self[$keys][$length];
    };

    onCheckComplete = function (key, callback, event) {
      var result = event.target.result;
      callback.call(this, result ? result[valueFieldName] : NULL, key, this);
    };

    onUpdateComplete = function (key, value, callback, event) {
      var
        self = this,
        i = indexOf.call(self[$keys], key)
      ;
      ~i || self[$keys].push(key);
      setLength(self);
      callback.call(self, value, key, self);
    };

    onGetComplete = function (self, write) {
      var
        db = self._db,
        t = db[transaction]
      ;
      return t.apply(db, [unobtrusiveTableName].concat(write ? "readwrite" : [])).objectStore(
        unobtrusiveTableName
      );
    };

    onItemCleared = function (key, callback, event) {
      var
        self = this,
        i = indexOf.call(self[$keys], key)
      ;
      ~i && self[$keys].splice(i, 1);
      setLength(self);
      callback.call(self, key, self);
    };

    onItemsCleared = function (callback) {
      var self = this;
      callback.call(self, self, self[$keys][$length] = self[$length] = 0);
    };

    asPrototype = AsynchronousStorage[prototype];
    asPrototype[$key] = function key(i) {
      return this[$keys][i];
    };
    asPrototype[$removeItem] = function removeItem(key, callback, errorback) {
      var op = onGetComplete(this, 1)["delete"](key);
      op[readTransaction](executeSql, bind.call(
        onItemCleared, this, key, callback || nothingToDoHere
      ), !1);
      op[readTransaction](ndexedDB, bind.call(errorback || nothingToDoHere, this), !1);
    };
    asPrototype[$clear] = function clear(callback, errorback) {
      var op = onGetComplete(this, 1).clear();
      op[readTransaction](executeSql, bind.call(
        onItemsCleared, this, callback || nothingToDoHere
      ), !1);
      op[readTransaction](ndexedDB, bind.call(errorback || nothingToDoHere, this), !1);
    };
    asPrototype[$getItem] = function getItem(key, callback, errorback) {
      var op = onGetComplete(this).get(key);
      op[readTransaction](executeSql, bind.call(
        onCheckComplete, this, key, callback || nothingToDoHere
      ), !1);
      op[readTransaction](ndexedDB, bind.call(errorback || nothingToDoHere, this), !1);
    };
    asPrototype[$setItem] = function setItem(key, value, callback, errorback) {
      var data = {}, op;
      data[keyFieldName] = key;
      data[valueFieldName] = value;
      op = onGetComplete(this, 1).put(data);
      op[readTransaction](executeSql, bind.call(
        onUpdateComplete, this, key, value, callback || nothingToDoHere
      ), !1);
      op[readTransaction](ndexedDB, bind.call(errorback || nothingToDoHere, this), !1);
    };
module.exports = AsynchronousStorage
