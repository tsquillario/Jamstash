var asyncStorage = "asyncStorage",
	concat = function concat() {
		return "".concat.apply("", arguments);
	},
	nothingToDoHere = function nothingToDoHere() {
		console.log("[ERROR]", arguments);
	},
	nop = function nop(){},
	ndexedDB = "ndexedDB"

module.exports = {
	nothingToDoHere : nothingToDoHere,
	concat : concat,
	bind: nop.bind || function (self) {
	var
		callback = this,
		args = [].slice.call(arguments, 1)
		;
	return function () {
		return callback.apply(self, args.concat.apply(args, arguments));
	};
	},
	indexOf : [].indexOf || function (value) {
		for (var i = this.length; i-- && this[i] !== value;);
		return i;
	},
	setTimeout : global.setTimeout,
	// strings shortcuts
	EOF : "\x00",
	openDatabase : "openDatabase",
	executeSql : "executeSql",
	transaction : "transaction",
	readTransaction : "readTransaction",
	localStorage : "localStorage",
	prototype : "prototype",
	unobtrusiveTableName : asyncStorage + "_data",
	keyFieldName : asyncStorage + "_key",
	valueFieldName : asyncStorage + "_value",
	$keys : "_keys",
	$length : "length",
	$key : "key",
	$getItem : "getItem",
	$setItem : "setItem",
	$removeItem : "removeItem",
	$clear : "clear",
	// original IndexedDB ... unfortunately it's not usable right now as favorite choice, actually dropped later on
	indexedDB : global["i" + ndexedDB] ||
		global["webkitI" + ndexedDB] ||
		global["mozI" + ndexedDB] ||
		global["msI" + ndexedDB],
	// other shortcuts
	NULL : null,
	max : global.Math.max
}
