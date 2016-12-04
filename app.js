const Menubar = require('menubar');

let mb = Menubar({
  // resizable: false,
  alwaysOnTop: true,
  // showDockIcon: true,
  // preloadWindow: true,
  transparent: true
});

mb.on('ready', () => {
  // const screen = electron.screen.getPrimaryDisplay().workArea;
  const width = 500;
  const height = 280;
  // const x = (screen.width - width) - 3;

  // mb.setOption('x', x);
  mb.setOption('y', 25);
  mb.setOption('width', width);
  mb.setOption('height', height);
});

mb.on('after-create-window', () => {
  mb.window.openDevTools();
  let wc = mb.window.webContents;

  mb.window.on('focus', () => {
    wc.send('window-focus');
  });

  mb.on('focus-lost', () => {
    wc.send('window-blur');
  });
});
