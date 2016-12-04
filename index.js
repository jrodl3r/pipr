let { ipcRenderer } = require('electron');

// events
ipcRenderer.on('window-blur', () => {
  document.body.classList.add('isBlurred');
});
ipcRenderer.on('window-focus', () => {
  document.body.classList.remove('isBlurred');
});

// wrapper
let container = document.createElement('div');
container.className = 'container';

// player
let video = document.createElement('iframe');
video.className = 'video';
video.src = 'http://www.youtube.com/embed/Pi3WGM_iXAQ';
/* video.width = '600';
   video.height = '400'; */
video.setAttribute('frameborder', '0');
video.setAttribute('allowFullScreen', '');

// drag handle / control bar
let drag = document.createElement('div');
drag.className = 'drag-handle';

// update
container.appendChild(video);
document.body.appendChild(container);
document.body.appendChild(drag);
