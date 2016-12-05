"use strict";

const Menubar = require('menubar');

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

  mb.window.setAspectRatio(16/9, { height: 0, width: 0 });
  mb.window.loadURL(`file://${__dirname}/index.html`);
  // mb.window.openDevTools();

  mb.window.on('focus', () => {
    wc.send('window-focus');
  });

  mb.on('focus-lost', () => {
    wc.send('window-blur');
  });

  mb.tray.on('drop-text', function (e, text) {
    wc.send('dropped-text', text);
    mb.showWindow();
  });  
});
