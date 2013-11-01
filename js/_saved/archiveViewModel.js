define(['knockout', 'postbox', 'mapping', 'global', 'utils', 'model', 'player', 'jquery.layout', 'jquery.dateFormat'], function (ko, postbox, mapping, global, utils, model, player) {
    return function () {
        
        self.selectSong = function (data, event) {
            if (self.selectedSongs.indexOf(this) >= 0) {
                self.selectedSongs.remove(this);
                this.selected(false);
            } else {
                self.selectedSongs.push(this);
                this.selected(true);
            }
        }
        self.addSongsToQueue = function (data, event) {
            ko.utils.arrayForEach(self.selectedSongs(), function (item) {
                self.queue.push(item);
                item.selected(false);
            });
            utils.updateMessage(self.selectedSongs().length + ' Song(s) Added to Queue', true);
        }


        
        self.openLink = function (data, event) {
            return true;
        }
        
        
        
        
        self.selectAll = function (data, event) {
            ko.utils.arrayForEach(self.song(), function (item) {
                self.selectedSongs.push(item);
                item.selected(true);
            });
        }
        self.selectNone = function (data, event) {
            ko.utils.arrayForEach(self.song(), function (item) {
                self.selectedSongs([]);
                item.selected(false);
            });
        }
    }
});