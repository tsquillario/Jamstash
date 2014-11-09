/*
 * Use this function to create a Unity Music Shim.  To use it, simply call setSupports to tell unity
 * which features you support, give it a callback for actions as documented below,
 * and notify it when your player state changes.
 */
var UnityMusicShim = function() {
  var UnityObj = {};
  /*
   * sendState requires an object with any of the following properties.
   * Call this whenever your player state changes.
   *
   * - playing: Boolean whether or not you are currently playing music
   * - title: String the title of the current song
   * - artist: String the artist of the current song
   * - albumArt: String a URL to the album art of the current song.  This must be a publically accessible url
   * - favorite: Boolean whether or not the current song is marked as a favorite
   * - thumbsUp: Boolean whether or not the current song is marked as thumbs up
   * - thumbsDown: Boolean whether or not the current song is marked as thumbs down
   */
  UnityObj.sendState = function(state) {
    var evt = document.createEvent("CustomEvent");
    evt.initEvent("UnityStateEvent", true, true );
    document.body.setAttribute('data-unity-state', JSON.stringify(state));
    document.body.dispatchEvent(evt, state);
  }
  
  document.body.addEventListener('UnityActionEvent', function(e) {
    var action = JSON.parse(document.body.getAttribute('data-unity-action'));
    if (UnityObj._callbackObject) UnityObj._callbackObject[action]();
  });
  
  /*
   * addCallbackObject requires an object with functions mapping to any features you support.
   * - playpause: Toggle the paused state of your player.
   * - next: Skip to the next song.
   * - previous: Skip to the previous song.
   * - thumbsUp: Mark (or unmark) this song as thumbs up.
   * - thumbsDown: Mark (or unmark) this song as thumbs up.
   * - favorite: Mark (or unmark) this song as a favorite.
   */
  UnityObj.setCallbackObject = function(cbObj) {
    UnityObj._callbackObject = cbObj;
  };
  /*
   * setSupports requires an object with any of the following features that your player supports.
   * Pass true for anything you support, and omit any you don't.
   *
   * - playpause: Whether you support pausing the song.  You must support this to use Unity
   * - next: Whether you support skipping the current song.
   * - previous: Whether you support going back to a previous song.
   * - thumbsUp: Whether you support giving a song a thumbs up.
   * - thumbsDown: Whether you support giving a song a thumbs down.
   * - favorite: Whether you support marking song as a favorite.
   */
  UnityObj.setSupports = function(supports) {
    var evt = document.createEvent("CustomEvent");
    evt.initEvent("UnitySupportsEvent", true, true );
    document.body.setAttribute('data-unity-supports', JSON.stringify(supports));
    document.body.dispatchEvent(evt, supports);
  }
  return UnityObj;
};
