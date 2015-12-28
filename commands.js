var lame = require('lame'),
    request = require('request'),
    config = require('./config.json'),
    admins = config.admins,
    pause = require('pause');

var currentSong = {
  info: {
    scId: 0,
    track: "",
    artist: ""
  },
  stream: undefined,
  playing: false
};

var playlist = [ ];

module.exports = function(bot, soundcloud, mumble){
  function playNext(){
    if(playlist.length > 0){
      var songId = playlist[0].id;

      var decoder = new lame.Decoder();

      decoder.on("format", function(format){
        currentSong.stream.pipe(mumble.inputStream({
          channels: format.channels,
          sampleRate: format.sampleRate,
          gain: 0.25
        }));

        currentSong.stream.on("end", function(){
          playNext();
          currentSong.playing = false;
        });

        currentSong.playing = true;
      });

      request("https://api.soundcloud.com/tracks/" + songId, {
        qs: {
          client_id: config.soundcloud.id
        }
      }, function(err, res, body){
        var res = JSON.parse(body);

        currentSong.stream = request("https://api.soundcloud.com/tracks/" + songId + "/stream?client_id=" + config.soundcloud.id).pipe(decoder);

        mumble.user.channel.sendMessage(
          "<div align='center'>" +
            (res.artwork_url ? "<img src='" + res.artwork_url.replace("large", "t200x200") + "'></img><br>" : "") +
            (res.title ? "<h2>Now Playing: <b>" + res.title + "</b></h2><br>" : "") +
            (res.user.username ? "Uploaded by <b>" + res.user.username + "</b> on SoundCloud<br>" : "") +
            "<b>(Requested by " + playlist[0].username + ")</b>" +
          "</div>"
        );

        currentSong.info = {
          scId: res.id,
          track: res.title,
          artist: res.user.username
        };

        var newPlaylist = [];

        playlist.forEach(function(id, i){
          if(i !== 0) newPlaylist.push(id);
        });

        playlist = newPlaylist;
      });
    }else{
      mumble.user.channel.sendMessage("<div align='center'><h2>No more songs! Why not request one?</h2></div>");
    }
  }

  bot.addCommand("!request", "Request a song", function(msg, args, channel, user){
    request("https://api.soundcloud.com/tracks.json", {
      qs: {
        q: msg,
        filter: "streamable",
        client_id: config.soundcloud.id
      }
    }, function(err, res, body){
      var res = JSON.parse(body);
      if(res.length === 0){
        channel.sendMessage("Sorry, I couldn't find any tracks matching that :(");
      }else{
        channel.sendMessage("Added <b>" + res[0].title + "</b> to the playlist.");
        playlist.push({
          id: res[0].id,
          username: user.name
        });
        if(!currentSong.playing) playNext();
      }
    });
  });

  bot.addCommand("!stop", "Stop the song and go to the next one if available", function(msg, args, channel, user){
    if(admins.indexOf(user.name) !== -1){
      currentSong.stream.end();
      currentSong.playing = false;
    }
  });

  bot.addCommand("!stopclear", "Stop the current song and clear the playlist", function(msg, args, channel, user){
    if(admins.indexOf(user.name) !== -1){
      playlist = [];
      currentSong.stream.end();
      currentSong.playing = false;
    }
  });
}
