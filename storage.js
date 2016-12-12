'use strict';

const { LocalStorage } = require('node-localstorage');
let ls;

const init = (path) => {
  let prefs = {};
  ls = new LocalStorage(path);

  prefs.rememberWinSize = typeof(ls.getItem('rememberWinSize')) === 'string'
    ? JSON.parse(ls.getItem('rememberWinSize')) : true;
  prefs.rememberWinPos = typeof(ls.getItem('rememberWinPos')) === 'string'
    ? JSON.parse(ls.getItem('rememberWinPos')) : true;
  prefs.alwaysOnTop = typeof(ls.getItem('alwaysOnTop')) === 'string'
    ? JSON.parse(ls.getItem('alwaysOnTop')) : true;
  prefs.autohide = typeof(ls.getItem('autohide')) === 'string'
    ? JSON.parse(ls.getItem('autohide')) : false;

  return prefs;
};

const getBounds = () => {
  let x = parseInt(ls.getItem('x'));
  let y = parseInt(ls.getItem('y'));
  let height = parseInt(ls.getItem('height'));
  let width = parseInt(ls.getItem('width'));

  return { x, y, height, width };
};

const saveBounds = (x, y, height, width) => {
  if (x) { ls.setItem('x', x);  }
  if (y) { ls.setItem('y', y);  }
  if (height) { ls.setItem('height', height); }
  if (width) { ls.setItem('width', width); }
};

const saveItem = (item, val) => { ls.setItem(item, val); };

module.exports.init = init;
module.exports.getBounds = getBounds;
module.exports.saveBounds = saveBounds;
module.exports.saveItem = saveItem;
