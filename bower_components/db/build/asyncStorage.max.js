/*!
(C) Andrea Giammarchi, @WebReflection - Mit Style License
*/
/**@license (C) Andrea Giammarchi, @WebReflection - Mit Style License
*/
(function (asyncStorage, window) {"use strict";

  if (asyncStorage in window) return;

  // node.js exports
  if (typeof __dirname != "undefined") {
    window.create = create;
    window = global;
  } else {
    window[asyncStorage] = {create: create};
  }

  // exported function
  function create(name, callback, errorback, size) {
    return new AsynchronousStorage(name, callback || nothingToDoHere, errorback || nothingToDoHere, size || 1 << 20);
  }

  // utility
  function concat() {
    return "".concat.apply("", arguments);
  }

  function nothingToDoHere() {
    //^ for debug only
    console.log("[ERROR]", arguments);
    //$
  }

  var
    // fast + ad-hoc + easy polyfills
    bind                  = create.bind || function (self) {
                            var
                              callback = this,
                              args = [].slice.call(arguments, 1)
                            ;
                            return function () {
                              return callback.apply(self, args.concat.apply(args, arguments));
                            };
                          },
    indexOf               = [].indexOf || function (value) {
                            for (var i = this.length; i-- && this[i] !== value;);
                            return i;
                          },
    setTimeout            = window.setTimeout,
    // strings shortcuts
    EOF                   = "\x00",
    ndexedDB              = "ndexedDB",
    openDatabase          = "openDatabase",
    executeSql            = "executeSql",
    transaction           = "transaction",
    readTransaction       = "readTransaction",
    localStorage          = "localStorage",
    prototype             = "prototype",
    unobtrusiveTableName  = asyncStorage + "_data",
    keyFieldName          = asyncStorage + "_key",
    valueFieldName        = asyncStorage + "_value",
    $keys                 = "_keys",
    $length               = "length",
    $key                  = "key",
    $getItem              = "getItem",
    $setItem              = "setItem",
    $removeItem           = "removeItem",
    $clear                = "clear",
    // original IndexedDB ... unfortunately it's not usable right now as favorite choice, actually dropped later on
    indexedDB             = window["i" + ndexedDB] ||
                            window["webkitI" + ndexedDB] ||
                            window["mozI" + ndexedDB] ||
                            window["msI" + ndexedDB],
    // other shortcuts
    NULL                  = null,
    max                   = window.Math.max,
    // lazily assigned variables
    AsynchronousStorage, asPrototype,
    prepareTable, readLength, checkLength, setLength,
    prepareUpdate, checkIfPresent, clearAllItems, clearOneItem,
    onUpdateComplete, onCheckComplete, onGetComplete, onItemsCleared, onItemCleared
  ;

  // the circus ... hopefully a bloody fallback will always be available
  if (openDatabase in window) {
    AsynchronousStorage = // WebSQL version
    function AsynchronousStorage(name, callback, errorback, size) {
      var self = this;
      errorback = bind.call(errorback, self);
      self.name = name;
      self.type = "WebSQL";
      try {
        (self._db = window[openDatabase](
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
  } else if (indexedDB) {
    AsynchronousStorage = // IndexedDB version
    function AsynchronousStorage(name, callback, errorback) {
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
  } else if (localStorage in window) {
    AsynchronousStorage = // localStorage version
    function AsynchronousStorage(name, callback, errorback) {
      var self = this;
      self.name = name;
      self.type = localStorage;
      self._db = window[localStorage];
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
  } else {
    AsynchronousStorage = // cookie based version
    function AsynchronousStorage(name, callback, errorback) {
      var self = this;
      self.name = name;
      self.type = "cookie";
      self._db = window.document;
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
  }

}("asyncStorage", this));
// var db = asyncStorage.create("db", function () {console.log(arguments)});