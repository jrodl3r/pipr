'use strict';

const app = require('electron').remote.require('./app');
let ipc = require('electron').ipcRenderer;
let $ = require('jquery');

const defaultMsg = 'Drop YouTube or Vimeo Links Here <span class="sub-splash">(or the menubar icon)</span>';
const invalidID = 'Invalid YouTube / Vimeo Link ID';
const invalidURL = 'Invalid YouTube / Vimeo URL';


// events
ipc.on('window-blur', () => { $('body').addClass('isBlurred'); });
ipc.on('window-focus', () => { $('body').removeClass('isBlurred'); });
ipc.on('start-loading', () => { $('body').addClass('isLoading'); });
ipc.on('stop-loading', () => { $('body').removeClass('isLoading'); });

ipc.on('toggle-prefs', () => {
  if ($('body').hasClass('prefsActive')) { $('body').removeClass('prefsActive'); }
  else { $('body').addClass('prefsActive'); }
});

ipc.on('hide-prefs', () => { $('body').removeClass('prefsActive'); });

ipc.on('dropped-text', (e, text) => {
  if (/youtu/.test(text) || /vimeo/.test(text)) {
    let id = /youtu/.test(text) ? getYouTubeId(text) : getVimeoId(text);
    if (id && !/(\/)/.test(id)) {
      let link = /youtu/.test(text)
        ? `https://www.youtube.com/embed/${id}?autoplay=1`
        : `https://player.vimeo.com/video/${id}?autoplay=1`;

      if ($('#video iframe').length) { $('#video iframe').remove(); }
      $('#drop-splash').addClass('isHidden');
      $(`<iframe src="${link}" frameborder="0" scrolling="no" allowFullScreen></iframe>`).appendTo('#video');
      $('#video').removeClass('isHidden');
      $('body').addClass('hasVideo');
    } else {
      showWarning(invalidID);
    }
  } else {
    showWarning(invalidURL);
  }
  $('body').removeClass('prefsActive');
});

$('#control-bar').on('dblclick', (e) => {
  if ($('body').hasClass('hasVideo')) { ipc.send('toggle-fullscreen'); }
});

$('#close-button').on('click', (e) => {
  if ($('body').hasClass('prefsActive')) {
    $('body').removeClass('prefsActive');
  } else {
    if (app.getFullscreen()) { ipc.send('toggle-fullscreen'); }
    ipc.send('close-window');
  }
});

$('#prefs-button').on('click', (e) => { $('body').toggleClass('prefsActive'); });
$('#prefs-button').on('dblclick', (e) => { stopClick(e); });

$('#fullscreen-button').on('click', (e) => {
  stopClick(e);
  ipc.send('toggle-fullscreen');
});

$('#click-sheild').on('click', (e) => { stopClick(e); });
$('#prefs').on('click', () => { $('body').removeClass('prefsActive'); });
$('#prefs .inner').on('click', (e) => { e.stopPropagation(); });


// prefs
const rememberWinSize = app.getPref('rememberWinSize');
const rememberWinPos = app.getPref('rememberWinPos');
const alwaysOnTop = app.getPref('alwaysOnTop');
const autohide = app.getPref('autohide');

if (rememberWinSize) { $('#remembersize-switch').attr('checked', true); }
$('#remembersize-switch').on('click', () => {
  app.toggleRememberWinSize();
});

if (rememberWinPos) { $('#rememberpos-switch').attr('checked', true); }
$('#rememberpos-switch').on('click', () => {
  app.toggleRememberWinPos();
});

if (alwaysOnTop) { $('#alwaysontop-switch').attr('checked', true); }
$('#alwaysontop-switch').on('click', () => {
  app.toggleAlwaysOnTop();
});

if (autohide) {
  $('#autohide-switch').attr('checked', true);
  $('.alwaysontop').addClass('isDisabled');
}
$('#autohide-switch').on('click', () => {
  if (!$('#autohide-switch').is(':checked')) { $('.alwaysontop').removeClass('isDisabled'); }
  else {
    if ($('#alwaysontop-switch').is(':checked')) { $('#alwaysontop-switch').prop('checked', false); }
    $('.alwaysontop').addClass('isDisabled');
  }
  app.toggleAutohide();
});


// helpers
function showWarning(msg) {
  $('#drop-splash span').html(msg);
  $('#drop-splash').removeClass('isHidden');
  setTimeout(() => {
    if ($('body').hasClass('hasVideo')) { $('#drop-splash').addClass('isHidden'); }
    $('#drop-splash span').html(defaultMsg);
  }, 2000);
}

function stopClick(e) {
  e.preventDefault();
  e.stopPropagation();
}

// video URL helpers
function getVideoId(str, prefixes) {
  var cleaned = str.replace(/^(https?:)?(\/\/)(www\.)?/, '');
  for(var i = 0; i < prefixes.length; i++) {
    if (cleaned.indexOf(prefixes[i]) === 0) {
      let id = cleaned.substr(prefixes[i].length);
      id = id.match(/[^?]*/i)[0];
      return id.match(/[^&]*/i)[0];
    }
  }
  return false;
}

function getYouTubeId(url) {
  return getVideoId(url, [
    'youtube.com/watch?v=',
    'youtu.be/',
    'youtube.com/embed/'
  ]);
}

function getVimeoId(url) {
  return getVideoId(url, [
    'vimeo.com/',
    'player.vimeo.com/video/',
    'player.vimeo.com/'
  ]);
}
