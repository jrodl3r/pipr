"use strict";

// const electron = require('electron');
const Menubar = require('menubar');

let mb = Menubar({
  alwaysOnTop: true,
  // showDockIcon: true,
  preloadWindow: true,
  transparent: true
});


mb.on('ready', () => {
  let wc = mb.window.webContents;

  mb.window.setAspectRatio(16/9, { height: 20, width: 0 });

  mb.window.on('focus', () => {
    wc.send('window-focus');
  });

  mb.on('focus-lost', () => {
    wc.send('window-blur');
  });

  mb.tray.on('drop-text', function (e, text) {
    console.log(text);
  });
});


mb.on('create-window', () => {
  // const screen = electron.screen.getPrimaryDisplay().workArea;
  const width = 500;
  const height = 300;
  // const x = (screen.width - width) - 3;

  // mb.setOption('x', x);
  mb.setOption('y', 25);
  mb.setOption('width', width);
  mb.setOption('height', height);
});


mb.on('after-create-window', () => {
  mb.window.openDevTools();
  mb.window.loadURL(`file://${__dirname}/index.html`);
});
