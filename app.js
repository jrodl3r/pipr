"use strict";

const Menubar = require('menubar');
let ipc = require('electron').ipcMain;
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
  let wc = mb.window.webContents;

  // mb.window.openDevTools();
  mb.window.setMinimumSize(260, 146);
  mb.window.setMaximumSize(960, 540);
  mb.window.setAspectRatio(16/9, { height: 0, width: 0 });
  mb.window.loadURL(`file://${__dirname}/index.html`);

  mb.window.on('focus', () => {
    wc.send('window-focus');
  });

  mb.on('focus-lost', () => {
    wc.send('window-blur');
  });

  wc.on('will-navigate', (e, text) => {
    e.preventDefault();
    wc.send('dropped-text', text);
  });

  mb.tray.on('drop-text', (e, text) => {
    wc.send('dropped-text', text);
    mb.showWindow();
  });
});

ipc.on('close-window', () => {
  mb.hideWindow();
});
