"use strict";

const app = require('electron').remote.require('./app');
let ipc = require('electron').ipcRenderer;
let $ = require('jquery');

// events
ipc.on('window-blur', () => { $('body').addClass('isBlurred'); });
ipc.on('window-focus', () => { $('body').removeClass('isBlurred'); });
ipc.on('start-loading', () => { $('body').addClass('isLoading'); });
ipc.on('stop-loading', () => { $('body').removeClass('isLoading'); });

ipc.on('toggle-prefs', () => {
  if (!$('#prefs').hasClass('isActive')) {
    $('#prefs').addClass('isActive');
  } else {
    $('#prefs').removeClass('isActive');
  }
});

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
    } else {
      $('#drop-splash span').html('Invalid YouTube / Vimeo Link ID');
      $('#drop-splash').removeClass('isHidden');
    }
  } else {
    $('#drop-splash span').html('Invalid YouTube / Vimeo URL');
    $('#drop-splash').removeClass('isHidden');
  }
});

$('#close-button').on('click', () => {
  if ($('#prefs').hasClass('isActive')) {
    $('#prefs').removeClass('isActive');
  } else {
    $('#video').addClass('isHidden');
    if ($('#video iframe').length) { $('#video iframe').remove(); }
    $('#drop-splash').removeClass('isHidden');
    $('#drop-splash span').html('Drop YouTube or Vimeo Links Here<span class="sub-splash">(or the menubar icon)</span>');
    ipc.send('close-window');
  }
});

$('#click-sheild').on('click', (e) => { e.preventDefault(); });

// TODO: Add hide-drop-splash button + event (to clear overlay above already loaded videos)

// prefs
const alwaysOnTop = app.getPref('alwaysOnTop');
const showOnAllWorkspaces = app.getPref('showOnAllWorkspaces');

if (!alwaysOnTop && !showOnAllWorkspaces) { $('#autohide-switch').attr('checked', 'checked'); }
$('#autohide-switch').on('click', () => { app.toggleAutohide(); });

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
