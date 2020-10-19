[![Dependency Status](https://www.versioneye.com/user/projects/55545c4c774ff250e20000ba/badge.svg?style=flat)](https://www.versioneye.com/user/projects/55545c4c774ff250e20000ba)

Jamstash - HTML5 Music Streamer
-------------------------------

Imagine you can stream all your music from home, to any device, where ever you are. That is
Subsonic! Now imagine having a Web App to stream your music that is as beautiful and well designed
as it is functional, that is Jamstash!

What?

* HTML5 Music Streaming App for your Subsonic server
* Archive.org Browsing and Streaming of Live Music

## Features

* HTML5 Audio with Flash fallback (provided by the jPlayer library)
* HTML5 Notifications
* Flexible Layout (will scale to whatever size your browser window is)
* Keyboard shortcuts (back, forward, play/pause, skip to artist, media keys)
* Playlist support (create new, add to existing, delete)
* Podcast support (includes description field on hover)
* Favorite/Starred support for Albums & Songs
* Shortcuts supported
* Easy installation (Chrome App or manual install)
* FF/Chrome support (IE9 works but is a little rough around the edges)
* Light/Dark Theme
* Last.fm support
* Autopilot Mode (click one button and songs continue to play)
* AutoSave Mode (saves position and current playlist if you close or refresh your browser)
* Built with AngularJS

**Please submit all bug reports & feature requests via the GitHub page**
https://github.com/tsquillario/Jamstash/issues

You will need a Subsonic server to be able to play your own music. Subsonic is a free, web-based
media streamer, providing ubiquitous access to your music. Use it to share your music with friends,
or to listen to your own music while at work. Please see http://www.subsonic.org

* Hosted version: https://jamstash.com
* Getting Started https://github.com/tsquillario/Jamstash/wiki/Getting-Started
* Twitter (Release Announcements): https://twitter.com/JamstashApp
* Github Repo: https://github.com/tsquillario/Jamstash
* Chrome App: https://chrome.google.com/webstore/detail/minisub/jccdpflnecheidefpofmlblgebobbloc
* Forum: http://forum.subsonic.org/forum/viewforum.php?f=12
* Donations: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=VMTENRSJWQ234
Change Log inside...

## Permissions

* You will have to allow Jamstash to "Access your data on all websites". This is required because
  your Subsonic server could be at any URL `http://*/*` or `https://*/*`. This is somewhat
  misleading, we ask for `*://*/*` access so that developers can make API calls to ANY URL ...

We don't collect any personal data and we don't want access to your data on all websites, we simply
have to use that permission so developers can use the App on all urls.

* I NEVER access, read, modify, store, or transmit your personal data.

* If you want to help star this issue: http://code.google.com/p/chromium/issues/detail?id=158004

License: GNU General Public License version 2 (GPLv2)
https://github.com/tsquillario/Jamstash/blob/master/gpl-2.0.txt

## Contributing

Help us improve Jamstash!

### Setting up your environment
In order to build Jamstash, `npm` is  required. For help installing `npm`, see
<https://www.npmjs.com/get-npm>.

Once `npm` is installed, clone the project to your local machine using `git`.

Install the project's dependencies by running `npm install && npx bower install`.

### Development and testing
To start a server that will continuously build and test your code as you work, run `npx grunt
serve`. This will open up a browser window with the built app running in it, as well as a Chrome
browser window that runs unit tests. Whenever you change a file, the application is rebuilt and unit
tests are run. Stop the server with CTRL+C.

To generate test coverage reports, run `npx grunt coverage`. This will run unit tests as you work
and generate a code coverage report. Stop it with CTRL+C.

To do a one-off build of the code, run `npx grunt build`. This will also minify the files for use in
production. At this point, the files in `dist/` can be served up via Apache, Nginx, or any other web
server to provide access to the Jamstash application.

### Version bumps and deployment to GitHub Pages
Typically these tasks will be done by a project maintainer.

Jamstash uses [Semantic Versioning](http://semver.org/). The following commands can be used to
increment the project version across `package.json`, `bower.json`, and `manifest.json`:
```
npx grunt bump:major
npx grunt bump:minor
npx grunt bump:patch
```

The public changelog is located in `app/common/json_changelog.json`. When bumping the version, make
sure to add any notable user-facing changes in this file.

After bumping the version, modifying the changelog, and committing the updated files, use `git tag
<version>` to tag the commit with the current version.

Once this tag is pushed to GitHub, GitHub Actions should automatically build it, release it, and
deploy it to the 'gh-pages' branch (which is served by GitHub Pages).

If this automated process fails, or GitHub Actions is not available, updating the 'gh-pages' branch
can be done locally. The `build-commit.sh` script has been provided to automate this process. Run
`./build-commit.sh --help` for more information.

An example of the entire release process:
```
# bump the version
npx grunt bump:patch

# note changes in the changelog
vim app/common/json_changelog.json

# commit the files
git commit -am "Bump version to v1.2.3"

# tag the commit
git tag v1.2.3

# push the commit and tag to the repo
git push origin master --tags

```
Extra steps required if not using GitHub Actions:
```
# update the gh-pages branch with the current release
./build-commit.sh v1.2.3

# push the newly-released version to GitHub Pages to deploy it
git push origin gh-pages
```
