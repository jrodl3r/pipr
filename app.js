'use strict';

const fs = require('fs');
const Menubar = require('menubar');
const Menu = require('electron').Menu;
const ipc = require('electron').ipcMain;
const localShortcut = require('electron-localshortcut');
const storage = require('./storage');
const config = require('./config');
const utils = require('./utils');

let prefs = {};
let mb = Menubar({
  dir: __dirname + '/app',
  alwaysOnTop: true,
  showOnAllWorkspaces: true,
  preloadWindow: true,
  transparent: true
});

mb.on('ready', () => {
  loadPrefs();
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
  mb.window.setMinimumSize(config.minWidth, config.minHeight);
  mb.window.setAspectRatio(16/9, { height: 0, width: 0 });
  mb.window.setVibrancy('ultra-dark');

  mb.on('show', () => {
    let { x, y, height, width } = storage.getBounds();

    if (prefs.rememberWinSize && !isNaN(height) && !isNaN(width)) {
      mb.window.setSize(width, height);
    } else {
      mb.window.setSize(config.defaultWidth, config.defaultHeight);
    }

    if (prefs.rememberWinPos) {
      if (!isNaN(x) && !isNaN(y)) {
        mb.setOption('x', x);
        mb.setOption('y', y);
      }
    } else {
      let pos = mb.positioner.calculate('trayCenter', mb.tray.getBounds());
      mb.setOption('x', pos.x);
      mb.setOption('y', config.defaultY);
    }
  });

  mb.window.on('resize', () => {
    let { width, height } = mb.window.getBounds();
    let pos = mb.window.getPosition();
    storage.saveBounds(pos[0], pos[1], height, width);
  });

  mb.window.on('moved', () => {
    let pos = mb.window.getPosition();
    storage.saveBounds(pos[0], pos[1]);
  });

  mb.window.on('focus', () => { wc.send('window-focus'); });
  mb.on('focus-lost', () => { wc.send('window-blur'); });
  mb.on('after-show', () => { mb.tray.setHighlightMode('never'); });
  wc.on('did-start-loading', () => { wc.send('start-loading'); });
  wc.on('did-stop-loading', () => { wc.send('stop-loading'); });

  wc.on('will-navigate', (e, text) => {
    e.preventDefault();
    wc.send('dropped-text', text);
  });

  wc.on('new-window', (e, text) => {
    e.preventDefault();
    if (utils.checkLinkText(text)) { wc.send('dropped-text', text); }
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


// prefs
function loadPrefs() {
  prefs = storage.init(mb.app.getPath('userData') + '/prefs');

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
  storage.saveItem('autohide', prefs.autohide);

  if (prefs.autohide) {
    prefs.alwaysOnTop = false;
    mb.window.setAlwaysOnTop(false);
    storage.saveItem('alwaysOnTop', false);
    mb.setOption('alwaysOnTop', false);
    mb.setOption('showOnAllWorkspaces', false);
  } else {
    mb.setOption('alwaysOnTop', true);
    mb.setOption('showOnAllWorkspaces', true);
  }
}

exports.toggleAlwaysOnTop = () => {
  prefs.alwaysOnTop = !prefs.alwaysOnTop;
  storage.saveItem('alwaysOnTop', prefs.alwaysOnTop);
  mb.window.setAlwaysOnTop(prefs.alwaysOnTop, 'floating');
}

exports.toggleRememberWinPos = () => {
  prefs.rememberWinPos = !prefs.rememberWinPos;
  storage.saveItem('rememberWinPos', prefs.rememberWinPos);
}

exports.toggleRememberWinSize = () => {
  prefs.rememberWinSize = !prefs.rememberWinSize;
  storage.saveItem('rememberWinSize', prefs.rememberWinSize);
}
