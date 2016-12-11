exports.links = ['youtube.com/watch?v=', 'youtu.be/', 'youtube.com/embed/', 'vimeo.com/', 'player.vimeo.com/video/', 'player.vimeo.com/'];
exports.buttons = ['/login/like', '/login/watch-later', '/share/facebook', '/share/twitter', '/share/tumblr', 'twitter.com/'];

exports.checkLinkText = (text) => {
  for (let x = 0; x < links.length; x++) {
    if (text.indexOf(links[x]) > -1) {
      for (let y = 0; y < buttons.length; y++) {
        if (text.indexOf(buttons[y]) !== -1) {
          return false;
        } else if (y === (buttons.length - 1)) {
          return true;
      } }
      return false;
  } }
};
