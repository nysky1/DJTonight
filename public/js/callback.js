
function getBearerToken() {
    let hashes = getUrlVars();
    localStorage.setItem(CONST_ACCESS_TOKEN_KEY, hashes['access_token']);
    console.log(localStorage.access_token);
    window.location.href = '/';
}
function getUrlVars()
    {
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('#') + 1).split('&');
        for(var i = 0; i < hashes.length; i++)
        {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    }
 $( getBearerToken() );