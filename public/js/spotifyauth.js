'use strict';
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_AUTH_SCOPE = 'user-modify-playback-state'
//const SPOTIFY_AUTH_STATE_KEY = 'spotify_auth_state' //for localstorage
const SPOTIFY_CLIENT_ID = 'b43719f00c1248cda82e9ef99c537d9a'

let SPOTIFY_AUTH_REDIRECT_URI = (isDebug) ? 'http://localhost:3000/callback' : 'CHANGE_TO_PRODUCTION_URL';

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
        toggleState(STATE_CITY_SEARCH);
        dWrite('Toggle State to next Form');
    }
}

function watchLogin() {
    $('.btnLoginSpotify').click((event) => {
        event.preventDefault();
        loginToSpotify();           
    })
}

function loadLoginSpotifyEventWatchers() {
    checkToken();
    watchLogin();
}

$(loadLoginSpotifyEventWatchers());