'use strict';
const isDebug = true;
const SONGKICK_API_KEY = 'YNtS7YGARCxD6b3X';
const SONGKICK_API_LOCATION_URL = 'http://api.songkick.com/api/3.0/search/locations.json'; //http://api.songkick.com/api/3.0/search/locations.json?query=Denver,CO&apikey=ABC
const SONGKICK_API_CALENDAR_URL = 'http://api.songkick.com/api/3.0/metro_areas/~METRO_ID~/calendar.json'; //http://api.songkick.com/api/3.0/metro_areas/6404/calendar.json?apikey=ABC

const SPOTIFY_API_URL = 'https://api.spotify.com/v1/search'

const MAPS_API_KEY = 'AIzaSyCJa2H-XH59JxiczNe0t6G6yZcRIqBMpN8'

const eventsForMap = [];

let map;

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 36.0237614, lng: -107.7637304 },
    zoom: 10
  });

}


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
function updateEventWithMostPopular(mostPopEvent) {

  let bigEvent = eventsForMap.find((item) => {
    return item.name === mostPopEvent.name
  })
  bigEvent.mostPopular = true;
}
function showResults(events) {
  let resultsHTML = '';
  let isEDM = false;
  events.resultsPage.results.event.forEach(item => {
    eventsForMap.push(
      new eventMaker(item.displayName, item.start.datetime, item.location.city, item.location.lat, item.location.lng, item.popularity)
    );
  });

  for (let i = 0; i < eventsForMap.length; i++) {
    resultsHTML += `<p>${eventsForMap[i].name} - Popularity: ${eventsForMap[i].popularity}</p>`;
  }

  let sArray = sortArrayByPopularity();
  updateEventWithMostPopular(sArray[0]);

  $('.js-results').html(resultsHTML);
  $('#frmEventMap').prop('hidden', false);
  $('#frmSearch').prop('hidden', true);
  $('.searchToggle').prop('hidden', true);
  $('#map').addClass('display');
  $('body').addClass('noBox');
  setMarkers();
}

function setMarkers() {
  // Adds markers to the map.
  let bounds = new google.maps.LatLngBounds();
  // Marker sizes are expressed as a Size of X,Y where the origin of the image
  // (0,0) is located in the top left of the image.

  // Origins, anchor positions and coordinates of the marker increase in the X
  // direction to the right and in the Y direction down.

  let pinColorBigEvent = "07CA07";
  let pinImageBigEvent = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColorBigEvent,
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34));
  let pinColor = "FE7569";
  let pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34));

  // Shapes define the clickable region of the icon. The type defines an HTML
  // <area> element 'poly' which traces out a polygon as a series of X,Y points.
  // The final coordinate closes the poly by connecting to the first coordinate.
  var shape = {
    coords: [1, 1, 1, 20, 18, 20, 18, 1],
    type: 'poly'
  };
  for (var i = 0; i < eventsForMap.length; i++) {
    let beach = eventsForMap[i];
    let marker = new google.maps.Marker({
      position: { lat: eventsForMap[i].lat, lng: eventsForMap[i].lng },
      map: map,
      icon: (eventsForMap[i].mostPopular) ? pinImageBigEvent : pinImage,
      shape: shape,
      title: eventsForMap[i].name,
      zIndex: 9999
    });
    let infowindow = new google.maps.InfoWindow({
      content: eventsForMap[i].name
    }); 
    marker.addListener('click', function() {
      infowindow.open(map, marker);
    });

    bounds.extend(marker.position);
  }

  var infowindow = new google.maps.InfoWindow();
  map.fitBounds(bounds);

  var listener = google.maps.event.addListener(map, "idle", function () {
    map.setZoom(9);
    google.maps.event.removeListener(listener);
  });
}



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
      alert('more cases');
      break;
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