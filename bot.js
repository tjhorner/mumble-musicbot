function Bot(){
  this.commands = [];

  this.triggers = [];

  this.intents = {};

  this.sendMessage = function(){
    console.warn("Message sending not set up!");
  }

  this.handleError = function(err){
    console.warn("Error handling not set up! Error in command: " + err);
  }

  this.unknownResponse = function(){
    console.log("Unknown responses not set up!");
  }

  this.setIntent = function(user, channel, callback){
    this.intents[user.name] = {channel: channel, callback: callback};
  };

  this.processMessage = function(message, channel, user, extra){
    // intents are prioritized
    if(this.intents[user] && this.intents[user.name].channel === channel){
      var intent = this.intents[user.name];

      // callback success
      if(intent.callback(message, channel, user) === true){
        this.intents[user.name] = undefined;
      }
    }else{
      var command = false;

      this.commands.forEach(function(c){
        var regex = RegExp("^" + c.trigger + "\\b");
        if(regex.test(message)){
          command = true;
          message = message.substr(c.trigger.length+1);
          var args = message.split(" ");
          try{
            c.action(message, args, channel, user, extra);
          }catch(e){
            this.handleError(e, channel, c.trigger);
          }
        }
      });

      if(!command){
        this.triggers.forEach(function(t){
          if(t.trigger.test(message)){
            command = true;
            var matches = new RegExp(t.trigger).exec(message);
            t.action(message, matches, channel, user, extra);
          }
        });
      }

      if(!command){
        this.unknownResponse(message, channel, user, extra);
      }
    }
  }

  this.on = function(action, callback){
    switch(action){
      case 'sendMessage':
        this.sendMessage = callback;
        break;
      case 'handleError':
        this.handleError = callback;
        break;
      case 'unknownResponse':
        this.unknownResponse = callback;
        break;
    }
  }

  this.addCommand = function(trigger, help, action){
    this.commands.push({trigger: trigger, action: action, help: help});
    console.log("Command registered: " + trigger);
    return this.commands;
  }

  this.addTrigger = function(trigger, action){
    this.triggers.push({trigger: trigger, action: action});
    return this.triggers;
  }

  return this;
}

module.exports = Bot;
