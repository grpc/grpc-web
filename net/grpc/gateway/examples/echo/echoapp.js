const echoapp = {};

/**
 * @param {Object} echoService
 * @param {Object} ctors
 * @param {Object} handlers
 */
echoapp.EchoApp = function(echoService, ctors, handlers) {
  this.echoService = echoService;
  this.ctors = ctors;
  this.handlers = handlers;
};

echoapp.EchoApp.INTERVAL = 500; // ms
echoapp.EchoApp.MAX_STREAM_MESSAGES = 50;

/**
 * @param {string} message
 * @param {string} cssClass
 */
echoapp.EchoApp.addMessage = function(message, cssClass) {
  $("#first").after(
    $("<div/>").addClass("row").append(
      $("<h2/>").append(
        $("<span/>").addClass("label " + cssClass).text(message))));
};

/**
 * @param {string} message
 */
echoapp.EchoApp.addLeftMessage = function(message) {
  this.addMessage(message, "label-primary pull-left");
};

/**
 * @param {string} message
 */
echoapp.EchoApp.addRightMessage = function(message) {
  this.addMessage(message, "label-default pull-right");
};

/**
 * @param {string} msg
 */
echoapp.EchoApp.prototype.echo = function(msg) {
  echoapp.EchoApp.addLeftMessage(msg);
  var unaryRequest = new this.ctors.EchoRequest();
  unaryRequest.setMessage(msg);

  var standaloneFoo = new this.ctors.Foo();
  standaloneFoo.setVal(msg+"@standaloneFoo");
  unaryRequest.setStandaloneFoo(standaloneFoo);
  
  var foo1 = new this.ctors.Foo();
  foo1.setVal(msg+"@foo1");
  var foo2 = new this.ctors.Foo();
  foo2.setVal(msg+"@foo2");
  
  if (isNaN(msg)) {
    var username = new this.ctors.Foo();
    username.setVal(msg+"@username");
    unaryRequest.setUsername(username);
    var bar1 = new this.ctors.Bar();
    var bar2 = new this.ctors.Bar();
    bar1.setName(msg+"@foo1.bar");
    bar2.setName(msg+"@foo2.bar");
    foo1.setBar(bar1);
    foo2.setBar(bar2);
  } else {
    unaryRequest.setUserid(msg*1000+999);
    var baz1 = new this.ctors.Baz();
    var baz2 = new this.ctors.Baz();
    baz1.setId(msg*1000+111);
    baz2.setId(msg*1000+222);
    foo1.setBaz(baz1);
    foo2.setBaz(baz2);
  }
  unaryRequest.setFoosList([foo1, foo2]);
  this.echoService.echo(unaryRequest, {"custom-header-1": "value1"},
                        function(err, response) {
    if (err) {
      echoapp.EchoApp.addRightMessage('Error code: '+err.code+' "'+
                                      err.message+'"');
    } else {
      setTimeout(function () {
        echoapp.EchoApp.addRightMessage(response.getMessage());

        console.log('standaloneFoo = '+response.getStandaloneFoo().getVal());
        
        var resp_foo1 = response.getFoosList()[0];
        var resp_foo2 = response.getFoosList()[1]
        console.log('foo1.val = '+resp_foo1.getVal());
        console.log('foo2.val = '+resp_foo2.getVal());
        
        if (resp_foo1.hasBar()) {
          console.log("foo1.bar = "+resp_foo1.getBar().getName());
        } else {
          console.log("foo1.baz = "+resp_foo1.getBaz().getId());
        }
        if (resp_foo2.hasBar()) {
          console.log("foo2.bar = "+resp_foo2.getBar().getName());
        } else {
          console.log("foo2.baz = "+resp_foo2.getBaz().getId());
        }

        if (response.hasUsername()) {
          console.log('username = '+response.getUsername().getVal());
        } else {
          console.log('userid = '+response.getUserid());
        }
      }, echoapp.EchoApp.INTERVAL);
    }
  });
};

/**
 * @param {string} msg
 */
echoapp.EchoApp.prototype.echoError = function(msg) {
  echoapp.EchoApp.addLeftMessage(msg);
  var unaryRequest = new this.ctors.EchoRequest();
  unaryRequest.setMessage(msg);
  this.echoService.echoAbort(unaryRequest, {}, function(err, response) {
    if (err) {
      echoapp.EchoApp.addRightMessage('Error code: '+err.code+' "'+
                                      err.message+'"');
    }
  });
};

/**
 * @param {string} msg
 * @param {number} count
 */
echoapp.EchoApp.prototype.repeatEcho = function(msg, count) {
  echoapp.EchoApp.addLeftMessage(msg);
  if (count > echoapp.EchoApp.MAX_STREAM_MESSAGES) {
    count = echoapp.EchoApp.MAX_STREAM_MESSAGES;
  }
  var streamRequest = new this.ctors.ServerStreamingEchoRequest();
  streamRequest.setMessage(msg);
  streamRequest.setMessageCount(count);
  streamRequest.setMessageInterval(echoapp.EchoApp.INTERVAL);

  var stream = this.echoService.serverStreamingEcho(
    streamRequest,
    {"custom-header-1": "value1"});
  var self = this;
  stream.on('data', function(response) {
    echoapp.EchoApp.addRightMessage(response.getMessage());
  });
  stream.on('status', function(status) {
    self.handlers.checkGrpcStatusCode(status);
    if (status.metadata) {
      console.log("Received metadata");
      console.log(status.metadata);
    }
  });
  stream.on('error', function(err) {
    echoapp.EchoApp.addRightMessage('Error code: '+err.code+' "'+
                                    err.message+'"');
  });
  stream.on('end', function() {
    console.log("stream end signal received");
  });
};

/**
 * @param {Object} e event
 * @return {boolean} status
 */
echoapp.EchoApp.prototype.send = function(e) {
  var msg = $("#msg").val().trim();
  $("#msg").val(''); // clear the text box
  if (!msg) return false;

  if (msg.indexOf(' ') > 0) {
    var count = msg.substr(0, msg.indexOf(' '));
    if (/^\d+$/.test(count)) {
      this.repeatEcho(msg.substr(msg.indexOf(' ') + 1), count);
    } else if (count == 'err') {
      this.echoError(msg.substr(msg.indexOf(' ') + 1));
    } else {
      this.echo(msg);
    }
  } else {
    this.echo(msg);
  }

  return false;
};

/**
 * Load the app
 */
echoapp.EchoApp.prototype.load = function() {
  var self = this;
  $(document).ready(function() {
    // event handlers
    $("#send").click(self.send);
    $("#msg").keyup(function (e) {
      if (e.keyCode == 13) self.send(); // enter key
      return false;
    });

    $("#msg").focus();
  });
};

module.exports = echoapp;
