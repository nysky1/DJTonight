'use strict';
const isDebug = true;
const BIT_API_KEY = 'AIzaSyA0sGD6XCJl2wcEWMgYHGR8g2UgG-MGN4o';
const BIT_API_URL = 'https://api.bandsintown.com/events/search' //?location=Denver,Co&api_version=2.0&limit=10'

const SPOTIFY_API_URL = 'https://api.spotify.com/v1/search'

const eventsForMap = [];
const deferredCalls = [];

function eventMaker(name, eventDate, isEDM) {
  let thisEvent = {
    name: name,
    eventDate: eventDate,
    isEDM: isEDM
  }
  return thisEvent;
}

function getDataBandsInTown() {
  dWrite('Calling BIT API');

  let location = $('#city').val() + "," + $("#state").val();

  let request = {
    location: `${location}`,
    api_version: '2.0',
    limit: 5,
    app_id: 'supp'
  };
  return $.ajax({
    url: BIT_API_URL,
    data: request,
    dataType: 'jsonp',
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
  for (let i = 0; i < events.length; i++) {
    let artist = events[i].artists[0].name;
    let thisEvent = eventMaker(artist, events[i].datetime);
      //getGenreFromSpotify(artist)
      //  .done(function (results) {
      //    return checkGenres(results, thisEvent)
      //  });
      resultsHTML += `<p>${thisEvent.name}</p>`;
  };

  resultsHTML += 'Done';
  return resultsHTML;
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

function watchSearch() {
  $('.btnSubmit').click((event) => {
    event.preventDefault();

    //call API with promise
    getDataBandsInTown()
    .done(function (results) {
      $('.js-results').html(showResults(results));
    })
    .fail(function () {
      alert("Oops, the search failed!");
    });

  });
}
function loadEventWatchers() {
  watchSearch();
}

function loadApp() {
  loadEventWatchers();
}

/* END VALIDATION */
function dWrite(item) {
  (isDebug) ? console.log(`${item}`) : '';
}

$(loadApp());
//watch the submit button