function auth()
{
    $('#Username').val($.cookie('username'));
    $('#Password').val($.cookie('password'));
    $('#AutoAlbumSize').val($.cookie('AutoAlbumSize'));
    $('#AutoPlaylistSize').val($.cookie('AutoPlaylistSize'));
    $('#Server').val($.cookie('Server'));
    $('#ApplicationName').val($.cookie('ApplicationName'));
}
