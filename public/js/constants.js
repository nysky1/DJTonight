const isDebug = (location.hostname.toLowerCase().indexOf('localhost') === -1 && location.hostname.toLowerCase().indexOf('dev.whatshot') === -1) ? false : true;
const CONST_ACCESS_TOKEN_KEY = "access_token";
const CONST_ACCESS_TOKEN_KEY_EXPIRATION = "access_token_expiration";

const SKIP_LOGIN_CITY_SEARCH = 0;
const STATE_CITY_SEARCH = 1;
const STATE_RESULTS = 2;
const STATE_BACK_TO_SEARCH = 3;
const SKIP_LOGIN_STATE_BACK_TO_SEARCH = 4; 