define(['knockout', 'postbox', 'mapping', 'global', 'utils', 'model'], function (ko, postbox, mapping, global, utils, model) {
        var self = this;
        self.album = new ko.observableArray([]);
        self.song = new ko.observableArray([]).syncWith("song");
        self.templateToUse = ko.observable();

        self.settings = global.settings;
        self.queue = new ko.observableArray([]).syncWith("queue", true);
        self.selectedArtist = ko.observable();
        self.selectedAlbum = ko.observable();
        self.selectedSongs = new ko.observableArray([]);
        
        
        
        

        return {
            getRandomSongs: self.getRandomSongs,
            updateFavorite: self.updateFavorite
        };
});