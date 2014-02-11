var common = require("./common"),
	openDatabase = common.openDatabase,
	transaction = common.transaction,
	bind = common.bind,
	executeSql = common.executeSql,
	unobtrusiveTableName = common.unobtrusiveTableName,
	valueFieldName = common.valueFieldName,
	keyFieldName = common.keyFieldName,
	concat = common.concat,
	readTransaction = common.readTransaction,
	$keys = common.$keys,
	$length = common.$length,
	indexOf = common.indexOf,
	max = common.max,
	prototype = common.prototype,
	$key = common.$key,
	$removeItem = common.$removeItem,
	nothingToDoHere = common.nothingToDoHere,
	$clear = common.$clear,
	$getItem = common.$getItem,
	$setItem = common.$setItem,

	onUpdateComplete,
	setLength,
	checkLength,
	readLength,
	prepareTable,
	prepareUpdate,
	onCheckComplete,
	checkIfPresent,
	onGetComplete,
	onItemsCleared,
	clearAllItems,
	onItemCleared,
	clearOneItem,
	asPrototype,

	AsynchronousStorage = function AsynchronousStorage(name, callback, errorback, size) {
      var self = this;
      errorback = bind.call(errorback, self);
      self.name = name;
      self.type = "WebSQL";
      try {
        (self._db = global[openDatabase](
          name,
          "1.0",
          "",
          size
        ))[transaction](bind.call(prepareTable, self, callback, errorback), errorback);
      } catch(o_O) {
        errorback(o_O);
      }
    };

    prepareTable = function (callback, errorback, t) {
      t[executeSql](concat(
          'CREATE TABLE IF NOT EXISTS ',
            unobtrusiveTableName, ' ',
          '(',
            valueFieldName, ' TEXT NOT NULL,',
            keyFieldName, ' TEXT NOT NULL PRIMARY KEY',
          ')'
        ),
        [],
        bind.call(readLength, this, callback, errorback),
        errorback
      );
    };

    readLength = function (callback, errorback) {
      this._db[readTransaction](
        bind.call(checkLength, this, callback, errorback)
      );
    };

    checkLength = function (callback, errorback, t) {
      t[executeSql](concat(
          'SELECT ',
            keyFieldName,
          ' AS k FROM ',
          unobtrusiveTableName
        ),
        [],
        bind.call(setLength, this, callback),
        errorback
      );
    };

    setLength = function (callback, t, result) {
      for (var keys = this[$keys] = [], rows = result.rows, i = rows[$length]; i--; keys[i] = rows.item(i).k);
      callback.call(this, this, this[$length] = keys[$length]);
    };

    onUpdateComplete = function (key, value, callback, update) {
      if (!update) {
        this[$length] = this[$keys].push(key);
      }
      callback.call(this, value, key, this);
    };

    prepareUpdate = function (key, value, callback, errorback, update, t) {
      t[executeSql](update ?
          concat('UPDATE ', unobtrusiveTableName, ' SET ', valueFieldName, ' = ? WHERE ', keyFieldName, ' = ?') :
          concat('INSERT INTO ', unobtrusiveTableName, ' VALUES (?, ?)')
        ,
        [value, key],
        bind.call(onUpdateComplete, this, key, value, callback, update),
        errorback
      );
    };

    onCheckComplete = function (key, value, callback, errorback, t, result) {
      this._db[transaction](bind.call(
        prepareUpdate, this, key, value,
        callback, errorback,
        !!result.rows.length
      ));
    };

    checkIfPresent = function (key, value, callback, errorback, nextCallback, t) {
      t[executeSql](concat(
        'SELECT ',
          valueFieldName, ' AS v FROM ',
          unobtrusiveTableName,
        ' WHERE ', keyFieldName, ' = ?'
        ),
        [key],
        bind.call(nextCallback, this, key, value, callback, errorback),
        errorback
      );
    };

    onGetComplete = function (key, value, callback, errorback, t, result) {
      var rows = result.rows;
      callback.call(this, rows[$length] ? rows.item(0).v : value, key, this);
    };

    onItemsCleared = function (callback) {
      var self = this;
      callback.call(self, self, self[$keys][$length] = self[$length] = 0);
    };

    clearAllItems = function (callback, errorback, t) {
      t[executeSql](concat(
        'DELETE FROM ', unobtrusiveTableName
      ), [], bind.call(onItemsCleared, this, callback), errorback);
    };

    onItemCleared = function (key, callback, t, result) {
      // be sure meanwhile nobody used db.clear()
      if (this[$length] = this[$length] - max(result.rowsAffected ? 1 : 0)) {
        var i = indexOf.call(this[$keys], key);
        if (~i) { // this should always be true ... anyway ...
          this[$keys].splice(i, 1);
        }
      } else {
        this[$keys][$length] = 0;
      }
      callback.call(this, key, this);
    };

    clearOneItem = function (key, callback, errorback, t) {
      t[executeSql](concat(
        'DELETE FROM ', unobtrusiveTableName, ' WHERE ', keyFieldName, ' = ?'
      ), [key], bind.call(onItemCleared, this, key, callback), errorback);
    };

    asPrototype = AsynchronousStorage[prototype];
    asPrototype[$key] = function key(i) {
      return this[$keys][i];
    };
    asPrototype[$removeItem] = function removeItem(key, callback, errorback) {
      this._db[transaction](bind.call(
        clearOneItem, this, key,
        callback || nothingToDoHere,
        bind.call(errorback || nothingToDoHere, this)
      ));
    };
    asPrototype[$clear] = function clear(callback, errorback) {
      this._db[transaction](bind.call(
        clearAllItems, this,
        callback || nothingToDoHere,
        bind.call(errorback || nothingToDoHere, this)
      ));
    };
    asPrototype[$getItem] = function getItem(key, callback, errorback) {
      this._db[readTransaction](bind.call(
        checkIfPresent, this, key, null,
        callback || nothingToDoHere,
        bind.call(errorback || nothingToDoHere, this),
        onGetComplete
      ));
    };
    asPrototype[$setItem] = function setItem(key, value, callback, errorback) {
      this._db[readTransaction](bind.call(
        checkIfPresent, this, key, value,
        callback || nothingToDoHere,
        bind.call(errorback || nothingToDoHere, this),
        onCheckComplete
      ));
    };

module.exports = AsynchronousStorage
    