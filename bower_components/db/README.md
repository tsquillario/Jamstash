asyncStorage :: a developer friendly Asynchronous Storage
=========================================================
let's face reality, the status of storages in the Web is a mess.
localStorage is a synchronous API not suitable at all to store data.
WebSQL has been abandoned, still the only option, as non experimental, in Safari, Chrome, and Opera.
Firefox is trying to support IndexedDB which right now is the most messed up API ever: loads of inconsistencies across platforms, included different versions of Firefox itself.
Internet Explorer 10, the one not even out yet, has insignificant market sharing 'till now.
My proposal to bring WebSQL back through Firefox extension has been banned, after approval, due potential securities issues ... so, what the hell we have to do in order to use a proper storage that is not ultra-complicated to understand, learn, and use?

The Problem with the WebStorage API
-----------------------------------
**localStorage** and **sessionStorage** have been around for quite a while and many developers are using these for any sort of task, including any sort of data stored in these synchronous storage without considering that:

  * **your data is not safe**, the first script that will easily perform a `localStorage.clear()` in the page your script is, your whole logic will magically fuck up without any notification (also because the event "storage" is completely randomly implemented)
  * **synchronous means blocking**, but we all agree that synchronous logic is easier to implement and maintain, right? ... well, unless you are not storing a few bytes once a while, you are making the browser potentially stuck ... just stop it, if you find this solution convenient
  * **your data is limited**, from 2mb up to 5mb but most important, the WebStorage API does not provide any way to know how much data is still available
  * **you are doing it wrong** ... and please don't judge me for this sentence, the problem is that 99% of online tutorials on `localStorage` are using direct property access, completely obtrusive for any sort of shimmable solution **you** would like to implement, plus 99% of the time these tutorials are not using a `try{}catch(e){}` statement around every single `localStorage.setItem(key, value)` call, which means your business logic is already broken

A Solution Based On WebStorage API
----------------------------------
What if you have nothing new to learn, using exactly the same API the WebStorage offer, except how to handle callbacks?
This is what is this project about, a basically identical API borrowed directly from the Web Storage one, with a couple of extra arguments per each *asynchronous* method such *callback* and *errorback*, where both are even optional.

The Concept
-----------
First of all, the main purpose of this project is to use any asynchronous possibility available in the browser through a **key/value pairs** based interface where **both keys and values should be strings**.
It is not the purpose of this script to provide any *JSON* shim in your code, but of course as you have probably used *JSON* already to store data in a generic storage, you can do the same with this implementation, remembering to `JSON.stringify(yourDataObject)` before you store it.
Back to the asynchronous concept, Where there is no possibility, the `localStorage` or even `document.cookie` is used as fallback so that even IE6 should work "_without problems_", whenever you decided to harakiri supporting latter browser.
The very first option, if available, is the **WebSQL** storage, the best thing ever destroyed by *W3C*, the most cross platform, for both Desktop and Mobile, storage possibility.
**IndexedDB** would be the other option where WebSQL is not available. This order might change in the future preferring IndexedDB as first option.
All others will fallback into *localStorage* or *document.cookie* and I am not discarding at all the possibility to use a *SharedObject* from the Flash Player world ... but, you know, I have abandoned Flash Player about 6 years ago and if I can make it without it, now that would be cool!
What else? Oh well, it's easy!

So you made the localStorage asynchronous? Tell me how easier it is ...
-----------------------------------------------------------------------

    asyncStorage.create("myDBName", function (db, numberOfEntries) {
        // database created, time to rock'n'roll!
        var callback = function (value, key) {
            if (value === "true") {
                // do amazing stuff for the very first time
            }
            // do whatever you want to
        };
        // check how many values you have stored so far
        if (numberOfEntries === 0) {
            // add some default entry
            db.setItem("neverLoaded", "true", callback);
        } else {
            db.setItem("neverLoaded", "false", callback);
        }
    });

Above is just an example of _easiness_ provided by this asynchronousStorage but here few main pros:

  * **unobtrusive**, you chose your own database name as you would do for any of your _libraries or namespaces_ . This simply means something like `localStorage.clear()`, performed by another library, will not erase your whole data. `db.clear()` aim is to clean only data **you** stored and nobody else.
  * **asynchronous**, since almost every method is made with async in mind. The only two things that are not asynchronous are `db.length` and, since length is synchronous, `db.key(index)` to retrieve the `key` associated to that index.
  * **nothing new to learn** which is the most annoying part of all these _not fully defined yet_ options we have today in the Web scenario

AsynchronousStorage API
-----------------------
  * `create(name, callback)` creates a new database with specific name in order to, somehow, simulate namespaces in the storage itself. `callback(db, numberOfEntries)` will be fired once the database has been created.
  * `create(name, callback, errorback)` does the same, except you might want to handle potential errors during database creation (user denied, not enough space, etc).
  * `create(name, callback, errorback, size)` does the same, except you might want to specify in advance the size of the database. This overload works as expected with WebSQL only.
  * `db.setItem(key, value[, callback[, errorback]])` set an item in the storage and calls `callback(value, key, db)` once the operation is completed. The `errorback` is called if something went wrong during this operation.
  * `db.getItem(key[, callback[, errorback]])` retrieves a value from the storage, `callback(value, key, db)` is called once the operation is completed where the `value` is exactly `null` wherever `key` was not set before
  * `db.removeItem(key[, callback[, errorback]])` remove an item from the storage, calls `callback(key, db)` once succeeded
  * `db.clear([callback[, errorback]])` remove all keys associated to your **database name**, the one used to create the storage at the very beginning. `callback(db, numberOfEntries)` will be triggered once the operation has been completed, same signature of the storage creation for functions reusability.
  * `db.key(index)` returns **synchronously** the associated key for that index. This is necessary to make easier for developers loops over all keys as they do already with the localStorage, i.e.

        function isItLastOne() {
            if (!--i) {
                doAgainAllStuff();
            }
        }
        for (var i = 0; i < db.length; i++) {
            db.removeItem(db.key(i), isItLastOne);
        }

  * `db.length` returns the length of all stored keys **in your database name**
  * `db.name` returns the name you chose for this storage instance
  * `db.type` returns the type of the database you are using such _WebSQL_, _IndexedDB_ (not yet), _localStorage_, and _cookie_

And this is pretty much it ... wanna test? [this page should be green](http://www.3site.eu/db/test/ "test")

How to use it
=============
after cloning the repo from github just type make

How to run the tests
====================
just type ./test.sh

TODOs
-----
  * improve tests to test errorbacks too
  * optionally, consider a fifth fallback through Flash Player shared object (*meh...!*)
  * create a couple of wrappers for node.js (MongoDB,...)
