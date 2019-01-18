#!/bin/bash

set -e

if [ $# -lt 1 ] || [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    echo "Does a clean build of a specific git ref and commits to result to the local 'gh-pages' branch."
    echo "Will NOT push the branch to GitHub, this will need to be done manually after the script completes."
    echo ""
    echo "Usage:"
    echo "    $(basename "$0") <ref>"
    exit 1
fi

# Make temp dir and clean it up on exit
tmp="$( mktemp -d )"
function cleanup {
    rm -rf "$tmp"
}
trap cleanup EXIT

resolved="$(git rev-parse "$1")"
repodir=$(dirname "$(readlink -f "$0")")

cd "$tmp"
echo "Cloning repo into a temp directory..."
git clone "$repodir" repo
cd repo
git checkout --detach "$resolved"
rm -rf dist

echo ""
echo "Installing deps..."
npm install
npx bower install

echo ""
echo "Building..."
npx grunt build

# We only want to commit files in the "dist" folder
# To do this, we move the "dist" folder up a level, then move the ".git" folder within it
echo ""
echo "Committing built files"
mv dist ..
if git rev-parse --verify origin/gh-pages 2> /dev/null; then
    git checkout --force gh-pages
else
    git checkout --orphan gh-pages
fi

mv .git ../dist
cd ../dist

# Add the CNAME file for the custom domain
echo "jamstash.com" > CNAME

# Commit the results and push them to the original repo
short="$(git rev-parse --short "$resolved")"
git add .
git commit -m "Deploy commit $short: $(git show -s --format=%s "$resolved")"
git push origin gh-pages

echo ""
echo "Commit '$short' has been built and committed locally to the 'gh-pages' branch"
echo "To publish the commit, push the gh-pages branch to GitHub"
