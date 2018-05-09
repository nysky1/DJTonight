'use strict';
const isDebug = true;
const SONGKICK_API_KEY = 'jwzmbEyCAIwD7HCy';
const SONGKICK_API_LOCATION_URL = 'http://api.songkick.com/api/3.0/search/locations.json'; //http://api.songkick.com/api/3.0/search/locations.json?query=Denver,CO&apikey=ABC
const SONGKICK_API_CALENDAR_URL = 'http://api.songkick.com/api/3.0/metro_areas/~METRO_ID~/calendar.json'; //http://api.songkick.com/api/3.0/metro_areas/6404/calendar.json?apikey=ABC

const SPOTIFY_API_URL = 'https://api.spotify.com/v1/search'

const eventsForMap = [];
let metroId = ''

function prepareSongKickAPIURL(metroId) {
  return SONGKICK_API_CALENDAR_URL.replace('~METRO_ID~', metroId);
}

function eventMaker(name, eventDate, city, lat, lng, popularity) {
  let thisEvent = {
    name: name,
    eventDate: eventDate,
    city: city,
    lat: lat,
    lng: lng,
    popularity: popularity
  }
  return thisEvent;
}

function getSongKickLocation() {
  dWrite('Calling SongKick API Location');

  let location = $('#city').val() + "," + $("#state").val();

  let request = {
    query: `${location}`,
    apikey: SONGKICK_API_KEY
  };
  return $.ajax({
    url: SONGKICK_API_LOCATION_URL,
    data: request,
    dataType: 'json',
    type: 'GET'
  });
}
function getSongKickEvents() {
  dWrite(`Calling SongKick API Events for metroId: ${metroId}`);
  let myDate = new Date();
  let currDate = formatISODate(myDate);

  let request = {
    apikey: SONGKICK_API_KEY,
    min_date: currDate,
    max_date: currDate
  };
  return $.ajax({
    url: prepareSongKickAPIURL(metroId),
    data: request,
    dataType: 'json',
    type: 'GET'
  });
}

function getGenreFromSpotify(aristName) {
  dWrite('Calling SPOTIFY API');

  let request = {
    q: aristName,
    type: 'artist',
    market: 'US',
    limit: 10
  };
  return $.ajax({
    url: SPOTIFY_API_URL,
    data: request,
    type: 'GET',
    beforeSend: function (xhr) { xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage[CONST_ACCESS_TOKEN_KEY]); },
    //success: function () { alert('Success!'); },
    error: function (xhr, textStatus, errorThrown) { alert(errorThrown); }
  })
}
function checkGenres(results, thisEvent) {
  dWrite(results.artists.items[0]);
  thisEvent.isEDM = true;
  eventsForMap.push(thisEvent);
}
function showResults(events) {
  let resultsHTML = '';
  let isEDM = false;
  events.resultsPage.results.event.forEach( item => {
    eventsForMap.push(
      new eventMaker(item.displayName, item.start.datetime, item.location.city, item.location.lat, item.location.lng, item.popularity)
      );
  });

  for (let i = 0; i < eventsForMap.length; i++) {
    resultsHTML += `<p>${eventsForMap[i].name} - Populatiry: ${eventsForMap[i].popularity}</p>`;
  }

  // for (let i = 0; i < events.resultsPage.results.length; i++) {
  //   let artist = events.resultsPage.results[i].re[0].name;
  //   let follower = events[i].artists[0].name;
  //   let thisEvent = eventMaker(artist, events[i].datetime);
  //   // getGenreFromSpotify(artist)
  //   //     .done(function (results) {
  //   //       return checkGenres(results, thisEvent)
  //   //     });
  //     resultsHTML += `<p>${thisEvent.name} - Followers: %{this}</p>`;
  // };
  let sArray = sortArray();
  
  $('.js-results').html(resultsHTML); 
  return resultsHTML;
}
function sortArray() {
  return eventsForMap.sort( (a,b) => {
    return a.popularity - b.popularity
  } )
}
function toggleState(stateIndex) {
  switch (stateIndex) {
    case 1:
      $('#frmSpotify').prop('hidden', true);
      $('#frmSearch').prop('hidden', false);
      $('.lblSpotifyRequired').prop('hidden', true);
      $('.lblSpotifyStatus').html('You are logged in to Spotify').prop('hidden', false);
      break;
    case 2:
      alert('more cases');
      break;
  }
}
function validateLocationSetAndContinue(results, cb) {
  var defer = $.Deferred();
  if (results.resultsPage.totalEntries === 0) {
    return defer.reject();
  }
  metroId = results.resultsPage.results.location["0"].metroArea.id;
  return defer.resolve();
}

function watchSearch() {
  $('.btnSubmit').click((event) => {
    event.preventDefault();
    eventsForMap.length = 0;
    //call API with promise
    $.when(
      getSongKickLocation()
    )
      .done(function (results) {
        $.when(
          validateLocationSetAndContinue(results)
        )
          .done(function (results) {
            $.when(
              getSongKickEvents(results)
            )
            .then(function (results) {
              showResults(results)
              dWrite('finished fetching')
            })
            dWrite('Location is ok, continuing.');
          })
          .fail(function () {
            alert(`Oops, we can't find that location.  Have another look at your location entry!`);
            dWrite('No Geo Results from Location API');
          })
      })
      .fail(function (result) {
        alert(`Oops, the location search failed.  Check the API Key and URL - ${result.statusText} (${result.status})!`);
        dWrite(result.statusText);
      });


  });
}
function loadEventWatchers() {
  watchSearch();
}

function loadApp() {
  loadEventWatchers();
}

/* */
function formatISODate(dt) {
  function pad(number) {
    if (number < 10) {
      return '0' + number;
    }
    return number;
  }
  return dt.getUTCFullYear() + '-' + pad(dt.getUTCMonth() + 1) + '-' + pad(dt.getUTCDate());
}
/* */

/* END VALIDATION */
function dWrite(item) {
  (isDebug) ? console.log(`${item}`) : '';
}

$(loadApp());
//watch the submit button