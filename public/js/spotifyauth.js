'use strict';
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_AUTH_SCOPE = 'user-modify-playback-state'
const SPOTIFY_CLIENT_ID = 'b43719f00c1248cda82e9ef99c537d9a'

let SPOTIFY_AUTH_REDIRECT_URI = (isDebug) ? ('http://' + window.location.host + '/callback') : 'https://whatshot2nite.azurewebsites.net/callback';

function generateHashString(length) {
    var text = '';
    var hashChoices = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += hashChoices.charAt(Math.floor(Math.random() * hashChoices.length));
    }
    return text;
};

function loginToSpotify() {
    dWrite('Authenticating to Spotify');

    let state = generateHashString(16);
    let url = 'https://accounts.spotify.com/authorize';
    url += '?response_type=token';
    url += '&client_id=' + encodeURIComponent(SPOTIFY_CLIENT_ID);
    url += '&scope=' + encodeURIComponent(SPOTIFY_AUTH_SCOPE);
    url += '&redirect_uri=' + encodeURIComponent(SPOTIFY_AUTH_REDIRECT_URI);

    window.location = url;
}
function checkToken() {
    let currDate = new Date()
    let expirDate = new Date(localStorage[CONST_ACCESS_TOKEN_KEY_EXPIRATION]);
    if (localStorage[CONST_ACCESS_TOKEN_KEY] !== undefined && expirDate > currDate) {
        toggleFormState(STATE_CITY_SEARCH);
        dWrite('Toggle State to next Form');
        return true;
    }
    return false;
}

function watchSpotifyLogin() {
    $('.btnLoginSpotify').click(function (event) {
        event.preventDefault();
        loginToSpotify();
    })
}
function watchSkipLogin() {
    $('.btnSkipSpotify').click( function (event) {
        event.preventDefault();
        toggleFormState(SKIP_LOGIN_CITY_SEARCH);
    })
}
function loadLoginSpotifyEventWatchers() {
    checkToken();
    watchSpotifyLogin();
    watchSkipLogin();
}
$(loadLoginSpotifyEventWatchers());