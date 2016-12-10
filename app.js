"use strict";

const fs = require('fs');
const storage = require('electron-storage');
const Menubar = require('menubar');
const localShortcut = require('electron-localshortcut');
const { Menu } = require('electron');
const ipc = require('electron').ipcMain;

const links = ['youtube.com/watch?v=', 'youtu.be/', 'youtube.com/embed/',
               'vimeo.com/', 'player.vimeo.com/video/', 'player.vimeo.com/'];
const buttons = ['/login/like', '/login/watch-later', '/share/facebook', '/share/twitter',
                 '/share/tumblr', 'twitter.com/'];

let prefsPath = '';
let activePrefs = {};
let defaultPrefs = {
  alwaysOnTop: true,
  showOnAllWorkspaces: true,
  rememberWinPosition: true,
  window: { alwaysOnTop: true, pos: { x: 'unset', y: 'unset' }}
};

let mb = Menubar({
  alwaysOnTop: true,
  showOnAllWorkspaces: true,
  preloadWindow: true,
  transparent: true
});

// events
mb.on('ready', () => {
  prefsPath = mb.app.getPath('userData') + '/prefs.json';
  storage.isPathExists(prefsPath, (itDoes) => {
    if (itDoes) {
      storage.get(prefsPath)
      .then(data => { setPrefs(data); })
      .catch(err => { console.error(err); });
    } else {
      storage.set(prefsPath, defaultPrefs)
      .then(() => { setPrefs(defaultPrefs); })
      .catch(err => { console.error(err); });
    }
  });
});

mb.on('create-window', () => {
  mb.setOption('y', 25);
  mb.setOption('width', 500);
  mb.setOption('height', 280);
});

mb.on('after-create-window', () => {
  let wc = mb.window.webContents;
  let contextMenu = Menu.buildFromTemplate([
    { label: 'Preferences', type: 'normal', accelerator: 'Cmd+,',
      click () {
        if (!mb.window.isVisible()) { mb.showWindow(); }
        wc.send('toggle-prefs');
      }},
    { label: 'Quit', type: 'normal', accelerator: 'Cmd+Q', click () { mb.app.quit(); }}
  ]);

  require('electron-debug')({ showDevTools: true });
  mb.window.openDevTools();
  // mb.window.setMaximumSize(960, 540);
  mb.window.setMinimumSize(260, 146);
  mb.window.setAspectRatio(16/9, { height: 0, width: 0 });
  mb.window.loadURL(`file://${__dirname}/index.html`);

  mb.window.on('focus', () => { wc.send('window-focus'); });

  mb.window.on('moved', () => {
    let pos = mb.window.getPosition();
    saveWindowPos({ x: pos[0], y: pos[1] });
  });

  mb.on('hide', () => {
    let pos = mb.window.getPosition();
    saveWindowPos({ x: pos[0], y: pos[1] });
  });

  mb.on('show', () => {
    if (activePrefs.rememberWinPosition &&
        activePrefs.window.pos.x !== 'unset' && activePrefs.window.pos.y !== 'unset') {
      mb.setOption('x', activePrefs.window.pos.x);
      mb.setOption('y', activePrefs.window.pos.y);
    } else {
      // TODO: setup fixed-win-pos
    }
  });

  mb.on('focus-lost', () => { wc.send('window-blur'); });

  wc.on('did-start-loading', () => { wc.send('start-loading'); });
  wc.on('did-stop-loading', () => { wc.send('stop-loading'); });

  wc.on('will-navigate', (e, text) => {
    e.preventDefault();
    wc.send('dropped-text', text);
  });

  wc.on('new-window', (e, text) => {
    e.preventDefault();
    for (let x = 0; x < links.length; x++) {
      if (text.indexOf(links[x]) > -1) {
        for (let y = 0; y < buttons.length; y++) {
          if (text.indexOf(buttons[y]) !== -1) {
            break;
          } else if (y === (buttons.length - 1)) {
            wc.send('dropped-text', text);
          }
        }
        break;
      }
    }
  });

  // tray
  mb.tray.on('drop-text', (e, text) => {
    let pos = mb.window.getPosition();
    if (mb.window.isVisible()) {
      mb.setOption('x', pos[0]);
      mb.setOption('y', pos[1]);
    } else {
      let trayPos = mb.positioner.calculate('trayCenter', mb.tray.getBounds());
      mb.setOption('x', trayPos.x);
      mb.setOption('y', 25);
      mb.window.setSize(500, 280);
      mb.showWindow();
    }
    wc.send('dropped-text', text);
  });

  mb.tray.on('right-click', () => { mb.tray.popUpContextMenu(contextMenu); });

  // shortcuts
  localShortcut.register(mb.window, 'Esc', () => {
    if (mb.window.isFullScreen()) {
      mb.window.setAspectRatio(16/9, { height: 0, width: 0 });
      mb.window.setFullScreen(false);
    } else { wc.send('hide-prefs'); }
  });
  localShortcut.register(mb.window, 'Cmd+,', () => { wc.send('toggle-prefs'); });

  mb.app.on('will-quit', () => {
    localShortcut.unregister(mb.window, 'Esc');
    localShortcut.unregisterAll(mb.window);
  });
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

// preferences
function setPrefs(prefs) {
  activePrefs = prefs;
  mb.setOption('alwaysOnTop', prefs.alwaysOnTop);
  mb.setOption('showOnAllWorkspaces', prefs.showOnAllWorkspaces);
  if (prefs.window.alwaysOnTop) { mb.window.setAlwaysOnTop(true); }
  else { mb.window.setAlwaysOnTop(false, 'floating'); }
}

function saveWindowPos(pos) {
  storage.isPathExists(prefsPath, (itDoes) => {
    if (itDoes) {
      storage.get(prefsPath)
      .then(data => {
        data.window.pos.x = pos.x;
        data.window.pos.y = pos.y;
        storage.set(prefsPath, data)
        .then(() => {
          activePrefs.window.pos.x = pos.x;
          activePrefs.window.pos.y = pos.y;
        })
        .catch(err => { console.error(err); });
      })
      .catch(err => { console.error(err); });
    }
  });
};

// helpers
exports.getPref = (pref) => { return mb.getOption(pref); }
exports.getAlwaysOnTop = () => { return mb.window.isAlwaysOnTop(); }
exports.getFullscreen = () => { return mb.window.isFullScreen(); }
exports.getRememberWinPos = () => { return activePrefs.rememberWinPosition; }

exports.toggleAutohide = () => {
  storage.isPathExists(prefsPath, (itDoes) => {
    if (itDoes) {
      storage.get(prefsPath)
      .then(data => {
        data.alwaysOnTop = !mb.getOption('alwaysOnTop');
        data.showOnAllWorkspaces = !mb.getOption('showOnAllWorkspaces');
        if (!data.alwaysOnTop && !data.showOnAllWorkspaces && data.window.alwaysOnTop) {
          data.window.alwaysOnTop = false;
        }
        storage.set(prefsPath, data)
        .then(() => {
          mb.setOption('alwaysOnTop', !mb.getOption('alwaysOnTop'));
          mb.setOption('showOnAllWorkspaces', !mb.getOption('showOnAllWorkspaces'));
          if (!mb.getOption('alwaysOnTop') && !mb.getOption('showOnAllWorkspaces') && mb.window.isAlwaysOnTop()) {
            mb.window.setAlwaysOnTop(false, 'floating');
          }
        })
        .catch(err => { console.error(err); });
      })
      .catch(err => { console.error(err); });
    }
  });
}

exports.toggleAlwaysOnTop = () => {
  storage.isPathExists(prefsPath, (itDoes) => {
    if (itDoes) {
      storage.get(prefsPath)
      .then(data => {
        data.window.alwaysOnTop = !mb.window.isAlwaysOnTop();
        storage.set(prefsPath, data)
        .then(() => {
          if (mb.window.isAlwaysOnTop()) { mb.window.setAlwaysOnTop(false, 'floating'); }
          else { mb.window.setAlwaysOnTop(true); }
        })
        .catch(err => { console.error(err); });
      })
      .catch(err => { console.error(err); });
    }
  });
}

exports.toggleRememberWinPos = () => {
  storage.isPathExists(prefsPath, (itDoes) => {
    if (itDoes) {
      storage.get(prefsPath)
      .then(data => {
        data.rememberWinPosition = !data.rememberWinPosition;
        storage.set(prefsPath, data)
        .then(() => { activePrefs.rememberWinPosition = !activePrefs.rememberWinPosition; })
        .catch(err => { console.error(err); });
      })
      .catch(err => { console.error(err); });
    }
  });
}
