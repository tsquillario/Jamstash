require(["jquery", "sm/soundmanager2-jsmin", "jquery.scrollTo-1.4.2-min", "jquery.disable.text.select.pack",
         "jquery.cookie", "jquery.base64", "jquery.dateFormat-1.0", "jquery.periodic", "jquery.shuffle",
         "fancybox/jquery.fancybox-1.3.4.pack",
         "jquery.linkify-1.0-min", "utils", "api", "generators", "app", "ui-load", "ui-ready"
        ], function($) {

        $(function() {
            //Sound manager
            soundManager.url = 'js/sm/swf';
            soundManager.preferFlash = false;
            soundManager.debugMode = false; 
            //soundManager.flashVersion = 9; // optional: shiny features (default = 8)
            //soundManager.useFlashBlock = false; // optionally, enable when you're ready to dive in

            //User config staff
            $('#Username').val($.cookie('username'));
            $('#Password').val($.cookie('password'));
            $('#AutoAlbumSize').val($.cookie('AutoAlbumSize'));
            $('#AutoPlaylistSize').val($.cookie('AutoPlaylistSize'));
            $('#Server').val($.cookie('Server'));
            $('#ApplicationName').val($.cookie('ApplicationName'));

            if ($.cookie('HideAZ')) {
                $('#HideAZ').attr('checked', true);
            } else {
                $('#HideAZ').attr('checked', false);
            }
            if ($.cookie('EnableNotifications')) {
                $('#EnableNotifications').attr('checked', true);
            } else {
                $('#EnableNotifications').attr('checked', false);
            }
            if ($.cookie('ScrollTitle')) {
                $('#ScrollTitle').attr('checked', true);
            } else {
                $('#ScrollTitle').attr('checked', false);
            }
    });
});
