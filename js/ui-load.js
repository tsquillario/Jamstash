$(window).load(function () {

    if (getCookie('defaultsmwidth')) {
        var width = getCookie('defaultsmwidth');
        smwidth = width;
        resizeSMSection(width);
    }
    if (getCookie('sidebar') && getCookie('username') && getCookie('passwordenc')) {
        $('#SideBar').show();
        updateChatMessages();
        updateNowPlaying();
    }
    if (getCookie('HideAZ')) {
        $('#BottomContainer').hide();
    }
    $('ul#ChangeLog li.log').each(function (i, el) {
        if (i > 3) {
            $(el).hide();
        }
    });
    if (getCookie('SaveTrackPosition')) {
        window.setInterval(function () {
            if (getCookie('SaveTrackPosition')) {
                var sm = soundManager.getSoundById('audio');
                if (sm !== undefined) {
                    saveTrackPosition();
                }
            }
        }, 5000);
    }
    if (getCookie('CurrentSong')) {
        var currentSong = JSON.parse(getCookie("CurrentSong"));
        playSong(null, currentSong.songid, currentSong.albumid, currentSong.position, true);
        loadCurrentPlaylist();
    }
    resizeContent();
});
window.onbeforeunload = function () {
    closeAllNotifications();
};
$(window).resize(function () {
    resizeContent();
});
function resizeContent() {
    var screenwidth = $(window).width();
    $('.tabcontent').css({ 'height': (($(window).height() - 125)) + 'px' });
    $('.smsection').css({ 'height': (($(window).height() - 168)) + 'px' });
    var smheight = $('.smsection').height();
    var smwidth = $('.smsection').width();
    $('#BottomContainer').css({ 'top': smheight + 35 + 'px' });
    if (getCookie('sidebar')) {
        var tabwidth = $(window).width() - 264;
        if (tabwidth >= 700) {
            $('.tabcontent').css({ 'width': tabwidth + 'px' });
        }
        var sbheight = $(window).height() - 152;
        $('#SideBar').css({ 'height': (sbheight + 107) + 'px' });
        $('#ChatMsgs').css({ 'height': (sbheight - 166) + 'px' });
    } else {
        var tabwidth = $(window).width() - 58;
        if (tabwidth >= 300) {
            $('.tabcontent').css({ 'width': tabwidth + 'px' });
        }
    }
    var tabwidth = $('.tabcontent').width();
    $('#AlbumContainer, #TrackContainer, #PodcastContainer, #CurrentPlaylistContainer').css({ 'width': (tabwidth - smwidth - 45) + 'px' });
    $('#CurrentPlaylistContainer').css({ 'width': (tabwidth - 30) + 'px' });
    $('#player').css({ 'width': tabwidth + 'px' });
}
function resizeSMSection(x) {
    var defwidth = 200;
    var smwidth = $('.smsection').width();
    var newsmwidth = smwidth + parseInt(x);
    var newwidth = newsmwidth - defwidth;
    if (smwidth != newsmwidth && newsmwidth > 150 && newsmwidth < 500) {
        $('.smsection').css({ 'width': (newsmwidth) + 'px' });
        $('.actions').css({ 'width': (newsmwidth - 5) + 'px' });
        $('#BottomContainer').css({ 'width': (newsmwidth - 23) + 'px' });
        setCookie('defaultsmwidth', newwidth);
        var ulwidth = newsmwidth + 6;
        $('#AlbumContainer, #TrackContainer, #PodcastContainer').css({ 'margin-left': (ulwidth + 15) + 'px' });
    }
}
