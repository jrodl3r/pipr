let container = document.createElement('div');
container.className = 'container';

let video = document.createElement('iframe');
video.className = 'video';
video.src = 'http://www.youtube.com/embed/Pi3WGM_iXAQ';
// video.width = '600';
// video.height = '400';
video.setAttribute('frameborder', '0');
video.setAttribute('allowFullScreen', '');

container.appendChild(video);
document.body.appendChild(container);
