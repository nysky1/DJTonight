
function getBearerToken() {
    let expirDate = new Date();
    let hashes = getUrlVars();
    localStorage.setItem(CONST_ACCESS_TOKEN_KEY, hashes['access_token']);
    dWrite(expirDate);
    expirDate.setSeconds(expirDate.getSeconds() + (hashes['expires_in']*1));
    dWrite(hashes['expires_in']);
    dWrite(expirDate);
    localStorage.setItem(CONST_ACCESS_TOKEN_KEY_EXPIRATION, expirDate);

    console.log(localStorage.access_token);
    window.location.href = '/';
}
function getUrlVars() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('#') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}
function dWrite(item) {
    (isDebug) ? console.log(`${item}`) : '';
}
$(getBearerToken());