try{
  var config = require('./config.json');
}catch(e){
  var config = JSON.parse(process.env.config);
}

var Mumble = require('mumble'),
    fs = require('fs'),
    bot = require("./bot")();

if(config.useEnv){
  var mumbleCert = process.env.cert;
  var mumbleKey = process.env.key;
}else{
  var mumbleCert = fs.readFileSync("./cert/cert.pem");
  var mumbleKey = fs.readFileSync("./cert/key.pem");
}

Mumble.connect(config.mumble.server, {
  cert: mumbleCert,
  key: mumbleKey
}, function(err, conn){
  conn.authenticate(config.mumble.username);

  conn.on("initialized", function(){
    // bot.on("sendMessage", function(message, channel){
    //   channel.sendMessage(message);
    // });

    conn.user.moveToChannel(conn.channelByPath("/Music"));

    // conn.connection.sendMessage("UserState",
    //   {
    //     session: conn.user.session,
    //     actor: conn.user.session,
    //     comment: "<b>I play music!</b> Here are my commands:<br><br>" +
    //              "<b>!request [song]</b> - Request a song. I will search SoundCloud for your request then add it to the playlist if I find it.<br>" +
    //              "<b>!stop</b> - (only admins may use this command) Stop the currently playing song and skip to the next one."
    //   }
    // );
  });

  conn.on("message", function(msg, user){
    bot.processMessage(msg, user.channel, user);
  });

  bot.on("unknownResponse", function(msg, channel, user){
    // channel.sendMessage("no");
  });

  require('./commands')(bot, conn);
});
