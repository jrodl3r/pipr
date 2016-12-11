'use strict';

const fs = require('fs');
const Menubar = require('menubar');
const localShortcut = require('electron-localshortcut');
const ipc = require('electron').ipcMain;
const { Menu } = require('electron');
const { LocalStorage } = require('node-localstorage');
const { links, buttons } = require('./utils');
let prefs = {};
let ls;
let mb = Menubar({
  dir: __dirname + '/app',
  alwaysOnTop: true,
  showOnAllWorkspaces: true,
  preloadWindow: true,
  transparent: true
});

mb.on('ready', () => {
  let prefsPath = mb.app.getPath('userData') + '/prefs';
  ls = new LocalStorage(prefsPath);
  loadPrefs();
});

mb.on('create-window', () => {
  mb.setOption('y', 25);
  mb.setOption('width', 500);
  mb.setOption('height', 280);
});

mb.on('after-create-window', () => {
  let wc = mb.window.webContents;
  let trayMenu = [
    { label: 'Preferences', type: 'normal', accelerator: 'Cmd+,',
      click () {
        if (!mb.window.isVisible()) { mb.showWindow(); }
        wc.send('toggle-prefs');
      }},
    { label: 'Quit', type: 'normal', accelerator: 'Cmd+Q', click () { mb.app.quit(); }}];
  let menu = Menu.buildFromTemplate(trayMenu);

  // require('electron-debug')({ showDevTools: true });
  // mb.window.openDevTools();
  // mb.window.setMaximumSize(960, 540);
  mb.window.setMinimumSize(288, 162);
  mb.window.setAspectRatio(16/9, { height: 0, width: 0 });
  mb.window.setVibrancy('ultra-dark');

  mb.on('show', () => {
    let x = parseInt(ls.getItem('x'));
    let y = parseInt(ls.getItem('y'));
    if (prefs.rememberWinPos && !isNaN(x) && !isNaN(y)) {
      mb.setOption('x', x);
      mb.setOption('y', y);
    } else {
      // TODO: setup fixed-win-pos
    }
  });

  mb.window.on('moved', () => {
    let pos = mb.window.getPosition();
    ls.setItem('x', pos[0]);
    ls.setItem('y', pos[1]);
  });

  mb.window.on('focus', () => { wc.send('window-focus'); });
  mb.on('focus-lost', () => { wc.send('window-blur'); });
  wc.on('did-start-loading', () => { wc.send('start-loading'); });
  wc.on('did-stop-loading', () => { wc.send('stop-loading'); });

  wc.on('will-navigate', (e, text) => {
    e.preventDefault();
    wc.send('dropped-text', text);
  });

  wc.on('new-window', (e, text) => {
    e.preventDefault();
    if (checkLinkText(text)) { wc.send('dropped-text', text); }
  });

  // tray
  mb.tray.on('drop-text', (e, text) => {
    if (!mb.window.isVisible()) { mb.showWindow(); }
    wc.send('dropped-text', text);
  });

  mb.tray.on('right-click', () => { mb.tray.popUpContextMenu(menu); });

  // shortcuts
  localShortcut.register(mb.window, 'Esc', () => {
    if (mb.window.isFullScreen()) {
      mb.window.setAspectRatio(16/9, { height: 0, width: 0 });
      mb.window.setFullScreen(false);
    } else { wc.send('hide-prefs'); }
  });

  localShortcut.register(mb.window, 'Cmd+,', () => { wc.send('toggle-prefs'); });
});


// remotes
ipc.on('toggle-fullscreen', () => {
  if (mb.window.isFullScreen()) {
    mb.window.setAspectRatio(16/9, { height: 0, width: 0 });
    mb.window.setFullScreen(false);
  } else {
    mb.window.setAspectRatio(0);
    mb.window.setFullScreen(true);
  }
});

ipc.on('close-window', () => { mb.hideWindow(); });


// helpers
function checkLinkText(text) {
  for (let x = 0; x < links.length; x++) {
    if (text.indexOf(links[x]) > -1) {
      for (let y = 0; y < buttons.length; y++) {
        if (text.indexOf(buttons[y]) !== -1) {
          return false;
        } else if (y === (buttons.length - 1)) {
          return true;
      } }
      return false;
  } }
}

function loadPrefs() {
  prefs.rememberWinPos = typeof(ls.getItem('rememberWinPos')) === 'string'
    ? JSON.parse(ls.getItem('rememberWinPos')) : true;
  prefs.alwaysOnTop = typeof(ls.getItem('alwaysOnTop')) === 'string'
    ? JSON.parse(ls.getItem('alwaysOnTop')) : true;
  prefs.autohide = typeof(ls.getItem('autohide')) === 'string'
    ? JSON.parse(ls.getItem('autohide')) : false;

  if (prefs.autohide) {
    mb.setOption('alwaysOnTop', false);
    mb.setOption('showOnAllWorkspaces', false);
  }
  mb.window.setAlwaysOnTop(prefs.alwaysOnTop, 'floating');
}

exports.getPref = (pref) => { return prefs[pref]; }
exports.getFullscreen = () => { return mb.window.isFullScreen(); }

exports.toggleAutohide = () => {
  prefs.autohide = !prefs.autohide;
  ls.setItem('autohide', prefs.autohide);

  if (prefs.autohide) {
    prefs.alwaysOnTop = false;
    mb.window.setAlwaysOnTop(false);
    ls.setItem('alwaysOnTop', false);
    mb.setOption('alwaysOnTop', false);
    mb.setOption('showOnAllWorkspaces', false);
  } else {
    mb.setOption('alwaysOnTop', true);
    mb.setOption('showOnAllWorkspaces', true);
  }
}

exports.toggleAlwaysOnTop = () => {
  prefs.alwaysOnTop = !prefs.alwaysOnTop;
  ls.setItem('alwaysOnTop', prefs.alwaysOnTop);
  mb.window.setAlwaysOnTop(prefs.alwaysOnTop, 'floating');
}

exports.toggleRememberWinPos = () => {
  prefs.rememberWinPos = !prefs.rememberWinPos;
  ls.setItem('rememberWinPos', prefs.rememberWinPos);
}
