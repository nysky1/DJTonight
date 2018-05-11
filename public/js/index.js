'use strict';
const isDebug = true;
const SONGKICK_API_KEY = 'YNtS7YGARCxD6b3X';
const SONGKICK_API_LOCATION_URL = 'http://api.songkick.com/api/3.0/search/locations.json'; //http://api.songkick.com/api/3.0/search/locations.json?query=Denver,CO&apikey=ABC
const SONGKICK_API_CALENDAR_URL = 'http://api.songkick.com/api/3.0/metro_areas/~METRO_ID~/calendar.json'; //http://api.songkick.com/api/3.0/metro_areas/6404/calendar.json?apikey=ABC

const SPOTIFY_API_SEARCH_URL = 'https://api.spotify.com/v1/search';
const SPOTIFY_API_TOP_TRACKS_URL = 'https://api.spotify.com/v1/artists/~ARTIST_ID~/top-tracks'

const MAPS_API_KEY = 'AIzaSyCJa2H-XH59JxiczNe0t6G6yZcRIqBMpN8'

const MAX_EVENTS = 5;

const eventsForMap = [];

let map;

function prepareSongKickAPIURL(metroId) {
  return SONGKICK_API_CALENDAR_URL.replace('~METRO_ID~', metroId);
}
function prepareSpotifyTopTracksAPIURL(artistId) {
  return SPOTIFY_API_TOP_TRACKS_URL.replace('~ARTIST_ID~', artistId);
}

function eventMaker(name, artist, venue, eventDate, city, lat, lng, popularity) {
  let thisEvent = {
    name: name,
    artist: artist,
    venue: venue,
    eventDate: eventDate,
    city: city,
    lat: lat,
    lng: lng,
    popularity: popularity,
    mostPopular: false
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
function getSongKickEvents(metroId) {
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
function getSpotifyArtistId(aristName) {
  dWrite('Calling SPOTIFY API - Get Artist Id');

  let request = {
    q: aristName,
    type: 'artist',
    market: 'US',
    limit: 10
  };
  return $.ajax({
    url: SPOTIFY_API_SEARCH_URL,
    data: request,
    type: 'GET',
    beforeSend: function (xhr) { xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage[CONST_ACCESS_TOKEN_KEY]); },
    //success: function () { alert('Success!'); },
    error: function (xhr, textStatus, errorThrown) { alert(errorThrown); }
  })
}
function getSpotifyTopTracks(artistList) {
  dWrite('Calling SPOTIFY API - Get Artist Id');
  let artistId = artistList.artists.items[0].id
  let request = {
    country: 'US'
  };
  return $.ajax({
    url: prepareSpotifyTopTracksAPIURL(artistId),
    data: request,
    type: 'GET',
    dataType: 'json',
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
function updateEventWithMostPopular(mostPopEvent) {

  let bigEvent = eventsForMap.find((item) => {
    return item.name === mostPopEvent.name
  })
  bigEvent.mostPopular = true;
}
function showResults(events) {
  let resultsHTML = '';
  let arySortedByPopularity = [];
  let eventLengthMax;

  if (events.resultsPage.totalEntries === 0) { alert('Sorry, there are no events tonight in that area.'); return false; }
  //sort the response, desc by popularity
  arySortedByPopularity = events.resultsPage.results.event.sort((a, b) => {
    return b.popularity - a.popularity;
  });

  let iCounter = 0;
  //ensure we have 5 events
  eventLengthMax = (arySortedByPopularity.length < MAX_EVENTS) ? arySortedByPopularity.length : MAX_EVENTS;
  //loop the top 5
  while (iCounter < eventLengthMax) {
    eventsForMap.push(
      new eventMaker(arySortedByPopularity[iCounter].displayName, arySortedByPopularity[iCounter].performance[0].artist.displayName, arySortedByPopularity[iCounter].venue.displayName, arySortedByPopularity[iCounter].start.datetime, arySortedByPopularity[iCounter].location.city, arySortedByPopularity[iCounter].location.lat, arySortedByPopularity[iCounter].location.lng, arySortedByPopularity[iCounter].popularity)
    );
    iCounter++;
  }
  //build the event results HTML (refactor)
  for (let i = 0; i < eventsForMap.length; i++) {
    resultsHTML += `<div class='js-panel-list-wrapper' aria-artist='${eventsForMap[i].artist}'><div class='eventName'>${eventsForMap[i].name} - (${eventsForMap[i].popularity})</div><div>${eventsForMap[i].venue}</div></div>`;
  }
  let sArray = sortArrayByPopularity();
  updateEventWithMostPopular(sArray[0]);

  $('.js-results').html(resultsHTML).append('<button class="btnBack">Change City</button><div class="spacer"></div><iframe class="embedPlayer" src="" width="0" height="0" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>');

  toggleState(STATE_RESULTS);
  setMarkers();
}
/* BEGIN Map Functions */
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 36.0237614, lng: -107.7637304 },
    zoom: 12
  });
}
// Adds markers to the map.
function setMarkers() {

  let bounds = new google.maps.LatLngBounds();
  //re-use only 1 info window
  let infowindow = new google.maps.InfoWindow();

  // Shapes define the clickable region of the icon. The type defines an HTML
  // <area> element 'poly' which traces out a polygon as a series of X,Y points.
  // The final coordinate closes the poly by connecting to the first coordinate.
  let shape = {
    coords: [1, 1, 1, 20, 18, 20, 18, 1],
    type: 'poly'
  };
  for (var i = 0; i < eventsForMap.length; i++) {
    let beach = eventsForMap[i];
    let marker = new google.maps.Marker({
      position: { lat: eventsForMap[i].lat, lng: eventsForMap[i].lng },
      map: map,
      //icon: (eventsForMap[i].mostPopular) ? pinImageBigEvent : pinImage,

      icon: {
        url: '/images/blank-marker.png',
        labelOrigin: new google.maps.Point(18, 13)
      },
      //shape: shape,
      label: {
        text: "" + (i + 1),
        fontWeight: 'bold'
      },
      title: eventsForMap[i].name,
      zIndex: 9999
    });
    google.maps.event.addListener(marker, 'click', (function (marker, i) {
      return function () {
        infowindow.setContent(`<h3>${eventsForMap[i].name}</h3><h4>${formatDateTime(eventsForMap[i].eventDate)}</h4>`);
        infowindow.open(map, marker);
      }
    })(marker, i));
    bounds.extend(marker.position);
  }
  map.fitBounds(bounds);
}
/* END MAP FUNCTIONS */

function sortArrayByPopularity() {
  return eventsForMap.sort((a, b) => {
    return b.popularity - a.popularity
  })
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

      $('.js-results').prop('hidden', false);
      $('#frmSearch').prop('hidden', true);
      $('.searchToggle').prop('hidden', true);
      $('#map').addClass('display');
      $('body').addClass('noBox');
      break;
    case 3:
      $('.js-results').prop('hidden', true);
      $('#frmSearch').prop('hidden', false);
      $('.searchToggle').prop('hidden', false);
      $('#map').removeClass('display');
      $('body').removeClass('noBox');
  }
}
function validateLocationSetAndContinue(results) {
  let metroId;
  var defer = $.Deferred();
  if (results.resultsPage.totalEntries === 0) {
    return defer.reject();
  }
  metroId = results.resultsPage.results.location["0"].metroArea.id;
  return defer.resolve(metroId);
}
function handleSearchForLocationAndEvents() {
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
          .done(function (metroId) {
            $.when(
              getSongKickEvents(metroId)
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
function handleSpotifySearch(artist) {
  $.when(
    getSpotifyArtistId(artist))
    .done(function (results) {
      $.when (        
        displayPlayer(results)
         .done(function (results) {
           dWrite('Returned with Top Tracks');
         })
         .fail(function (result) {
           alert(`Oops, the Spotify API Top Tracks Lookup failed - ${result.statusText} (${result.status})!`);
           dWrite(result.statusText);
        })
      )
    })
    .fail(function (result) {
      alert(`Oops, the Spotify API Artist Lookup failed - ${result.statusText}!`);
      dWrite(result.statusText);
    })
};
function displayPlayer(results) {
  var deferred = $.Deferred();
  let artistIdURI;
  let embedURI;
  try {
    artistIdURI = results.artists.items[0].uri;
    embedURI = `https://open.spotify.com/embed?uri=${artistIdURI}`;
    $('.embedPlayer').attr("src",embedURI).addClass("display");
    return deferred.resolve();
  }
  catch (e) {
    return deferred.reject( {statusText: e.stack });
  }  
}
function handleBackfromSearch() {
  $('.js-results').on('click', '.btnBack', function (event) {
    toggleState(STATE_BACK_TO_SEARCH);
  })
}
function handleArtistClick() {
  let artist;
  $('.js-results').on('click', '.js-panel-list-wrapper', function (event) {
    artist = $(event.currentTarget).attr('aria-artist');
    handleSpotifySearch(artist);
  });
}
function loadEventWatchers() {
  handleSearchForLocationAndEvents();
  handleBackfromSearch();
  handleArtistClick();
}

function loadApp() {
  loadEventWatchers();
}
/* UTILITIES */
function formatISODate(dt) {
  function pad(number) {
    if (number < 10) {
      return '0' + number;
    }
    return number;
  }
  return dt.getUTCFullYear() + '-' + pad(dt.getUTCMonth() + 1) + '-' + pad(dt.getUTCDate());
}
function formatDateTime(dt) {
  let date = new Date(dt);
  var options = {
    weekday: "long", year: "numeric", month: "short",
    day: "numeric", hour: "2-digit", minute: "2-digit"
  };
  return date.toLocaleTimeString("en-us", options);
}
/* UTILITIES */

/* END VALIDATION */
function dWrite(item) {
  (isDebug) ? console.log(`${item}`) : '';
}

$(loadApp());
//watch the submit button 