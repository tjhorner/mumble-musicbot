# Musicbot for Mumble

This bot plays music from SoundCloud on Mumble. It's not really feature packed like MumbleDJ quite yet, but it has a few basic commands that will be substantial for the time being.

**Musicbot is probably live on my server [here](http://mumble.horner.tj/#join).**

## Commands

- `!request [song]` - The `song` parameter will be searched for on SoundCloud and, if found, will be added to the bot's playlist.
- `!stop` - (admins only) Stop the current song and skip to the next one if available.
- `!stopclear` (admins only) Clear the playlist and stop the current song.

## Setup

So you want Musicbot on your own server, eh? Follow these steps and you'll be up in no time.

### Step 0: Zero-indexed arrays are cool!

First, you'll want to `npm install` to get all of the dependencies.

### Step 1: `config.json`

Copy `config.default.json` to `config.json`. Set up those values accordingly.

- `soundcloud`
  - `id` - The client id retrieved from https://soundcloud.com/you/apps
  - `secret` - The client secret retrieved from https://soundcloud.com/you/apps
- `mumble`
  - `server` - The server you want the bot to connect to
  - `username` - The username you want the bot to have
- `twitch`
  - `enable` - Enable Monstercat mode ([explained below](#Setting_up_Monstercat_mode))
  - `channel` - The channel you want the bot to join
  - `nick` - The bot's nick
  - `token` -The bot's Twitch OAuth2 token
- `admins` - An array of usernames that you want to be able to use admin-level commands

### Step 2: Generate certificate

If you have the `openssl` binary installed on your system, this is super easy:

```bash
# make sure you're in the bot directory first though
openssl req -x509 -newkey rsa:2048 -nodes -keyout ./cert/key.pem -out ./cert/cert.pem
```

Follow the steps from that command and you're done. You can fill in whatever you want, Mumble doesn't really care. Oh, you also might want to register your bot on the server by right-clicking its name and pressing "Register".


### Step 3: I think that's it maybe?

That's all you need to do to get the bot configured. Now it's time to actually run it. Use `node index` to start the bot. By default, it will look for a channel called "Music" in the root and join it. I'll add a configuration option later maybe.

As for hosting, that's your problem ;)

## Setting up Monstercat mode

This bot includes a mode to get a constant stream of Monstercat music (from their Twitch stream). If you want to enable this mode, you'll need a Twitch OAuth2 token from [here](http://www.twitchapps.com/tmi/). Make your bot join the `#Monstercat` channel by setting `channel` in the config to `"#Monstercat"`. Then set the `enable` variable to `true` to enable Monstercat mode. Now whenever a new song plays on the Monstercat Twitch stream, it will look that song up and add it to the playlist.

To enable/disable it, simply type `!monstercat` to the bot.

Oh, it also disables requesting songs so people can't override the stream playlist.
