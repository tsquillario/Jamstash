$(window).load(function () {
    if ($.cookie('defaultsmwidth')) {
        var width = $.cookie('defaultsmwidth');
        resizeSMSection(width);
    }
    if ($.cookie('sidebar') && $.cookie('username') && $.cookie('password')) {
        $('#SideBar').show();
        updateChatMessages();
        updateNowPlaying();
    }
    if ($.cookie('HideAZ')) {
        $('#BottomContainer').hide();
    }
    $('ul#ChangeLog li.log').each(function (i, el) {
        if (i > 3) {
            $(el).hide();
        }
    });
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
    $('.tabcontent').css({ 'height': (($(window).height() - 109)) + 'px' });
    $('.smsection').css({ 'height': (($(window).height() - 152)) + 'px' });
    var smheight = $('.smsection').height();
    var smwidth = $('.smsection').width();
    $('#BottomContainer').css({ 'top': smheight + 35 + 'px' });
    if ($.cookie('sidebar')) {
        var tabwidth = $(window).width() - 264;
        if (tabwidth >= 700) {
            $('.tabcontent').css({ 'width': tabwidth + 'px' });
        }
        var sbheight = $(window).height() - 152;
        $('#SideBar').css({ 'height': (sbheight + 108) + 'px' });
        $('#ChatMsgs').css({ 'height': (sbheight - 166) + 'px' });
    } else {
        var tabwidth = $(window).width() - 58;
        if (tabwidth >= 700) {
            $('.tabcontent').css({ 'width': tabwidth + 'px' });
        }
    }
    var tabwidth = $('.tabcontent').width();
    $('#AlbumContainer, #TrackContainer, #CurrentPlaylistContainer').css({ 'width': (tabwidth - smwidth - 30) + 'px' });
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
        $('#BottomContainer').css({ 'width': (newsmwidth - 16) + 'px' });
        $.cookie('defaultsmwidth', newwidth, { expires: 365, path: '/' });
        var ulwidth = newsmwidth + 6;
        $('#AlbumContainer').css({ 'margin-left': ulwidth + 'px' });
        $('#TrackContainer').css({ 'margin-left': ulwidth + 'px' });
    }
}