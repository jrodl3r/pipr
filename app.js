"use strict";

const Menubar = require('menubar');
const { Menu } = require('electron');

let ipc = require('electron').ipcMain;
let links = ['youtube.com/watch?v=', 'youtu.be/', 'youtube.com/embed/', 'vimeo.com/', 'player.vimeo.com/video/', 'player.vimeo.com/'];
let blocked = ['/login/like', '/login/watch-later', '/share/facebook', '/share/twitter', '/share/tumblr', 'twitter.com/'];

let mb = Menubar({
  alwaysOnTop: true,
  preloadWindow: true,
  transparent: true
  // tooltip: 'Drop YouTube + Vimeo Links Here'
});

mb.on('create-window', () => {
  mb.setOption('y', 25);
  mb.setOption('width', 500);
  mb.setOption('height', 280);
});

mb.on('after-create-window', () => {
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Preferences', type: 'normal' },
    { label: 'Quit', type: 'normal', click () { mb.app.quit(); } }
  ]);

  let wc = mb.window.webContents;

  // mb.window.openDevTools();
  // mb.window.setMaximumSize(960, 540);
  mb.window.setMinimumSize(260, 146);
  mb.window.setAspectRatio(16/9, { height: 0, width: 0 });
  mb.window.loadURL(`file://${__dirname}/index.html`);

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
    for (let x = 0; x < links.length; x++) {
      if (text.indexOf(links[x]) > -1) {
        for (let y = 0; y < blocked.length; y++) {
          if (text.indexOf(blocked[y]) !== -1) {
            break;
          } else if (y === (blocked.length - 1)) {
            console.log('> ' + text);
            wc.send('dropped-text', text);
          }
        }
        break;
      }
    }
  });

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
});

ipc.on('close-window', () => {
  mb.hideWindow();
});
