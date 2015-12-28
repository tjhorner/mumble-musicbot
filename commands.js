var lame = require('lame'),
    request = require('request'),
    config = require('./config.json'),
    admins = config.admins,
    irc = require('irc');

var currentSong = {
  info: {
    scId: 0,
    track: "",
    artist: ""
  },
  stream: undefined,
  playing: false
};

var monstercatMode = false;

var playlist = [ ];

module.exports = function(bot, soundcloud, mumble){
  if(config.twitch.enable){
    var twitchIrc = new irc.Client("irc.twitch.tv", config.twitch.nick, {
      channels: [config.twitch.channel],
      password: config.twitch.token
    });

    twitchIrc.addListener("message", function (fromUser, toChannel, message) {
      if(monstercatMode && fromUser.toLowerCase() === "monstercat"){
        request("https://api.soundcloud.com/tracks.json", {
          qs: {
            q: message.substr(13).split("-")[0] + " monstercat", // to make sure we're getting it from the monstercat profile
            filter: "streamable",
            client_id: config.soundcloud.id
          }
        }, function(err, res, body){
          var res = JSON.parse(body);
          if(res.length === 0){
            mumble.user.channel.sendMessage("The Monstercat stream started playing a new song but I couldn't find it. RIP.");
          }else{
            mumble.user.channel.sendMessage("Added <b>" + res[0].title + "</b> to the playlist (via Monstercat mode).");
            playlist.push({
              id: res[0].id,
              username: "Monstercat Stream"
            });
            if(!currentSong.playing) playNext();
          }
        });
      }
    });
  }

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
    if(!monstercatMode){
      request("https://api.soundcloud.com/tracks.json", {
        qs: {
          q: msg,
          filter: "streamable",
          client_id: config.soundcloud.id
        }
      }, function(err, res, body){
        var res = JSON.parse(body);
        if(res.length === 0){
          user.sendMessage("Sorry, I couldn't find any tracks matching that :(");
        }else{
          user.sendMessage("Added <b>" + res[0].title + "</b> to the playlist.");
          playlist.push({
            id: res[0].id,
            username: user.name
          });
          if(!currentSong.playing) playNext();
        }
      });
    }else{
      user.sendMessage("I can't take song requests while in Monstercat mode.");
    }
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

  bot.addCommand("!monstercat", "Toggle Monstercat mode", function(msg, args, channel, user){
    if(admins.indexOf(user.name) !== -1){
      if(config.twitch.enable){
        if(monstercatMode){
          if(currentSong.stream && currentSong.playing){
            playlist = [];
            currentSong.stream.end();
            currentSong.playing = false;
          }
          monstercatMode = false;
          channel.sendMessage("<b>" + user.name + "</b> has disabled Monstercat mode.");
        }else{
          if(currentSong.stream && currentSong.playing){
            playlist = [];
            currentSong.stream.end();
            currentSong.playing = false;
          }
          monstercatMode = true;
          channel.sendMessage("<b>" + user.name + "</b> has enabled Monstercat mode.");
        }
      }else{
        user.sendMessage("Please enable Monstercat mode before using this command. Please check <a href='horner.tj/p/mumble-musicbot'>the GitHub page</a> for more details.");
      }
    }
  });
}
