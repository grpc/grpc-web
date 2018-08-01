const {EchoRequest} = require('./echo_pb.js');
const {EchoServiceClient} = require('./echo_grpc_pb.js');
const {ServerStreamingEchoRequest} = require('./echo_pb.js');
const grpc = {};
grpc.web = require('grpc-web');

const INTERVAL = 500; // ms
const MAX_STREAM_MESSAGES = 50;
var echoService;

var addMessage = function(message, cssClass) {
  $("#first").after(
    $("<div/>").addClass("row").append(
      $("<h2/>").append(
        $("<span/>").addClass("label " + cssClass).text(message))));
};

var addLeftMessage = function(message) {
  addMessage(message, "label-primary pull-left");
};

var addRightMessage = function(message) {
  addMessage(message, "label-default pull-right");
};

var echo = function(msg) {
  addLeftMessage(msg);
  var unaryRequest = new EchoRequest();
  unaryRequest.setMessage(msg);
  echoService.echo(unaryRequest, {"custom-header-1": "value1"},
                   function(err, response) {
    if (err) {
      addRightMessage('Error code: '+err.code+' "'+err.message+'"');
    } else {
      setTimeout(function () {
        addRightMessage(response.getMessage());
      }, INTERVAL);
    }
  });
};

var echoError = function(msg) {
  addLeftMessage(msg);
  var unaryRequest = new EchoRequest();
  unaryRequest.setMessage(msg);
  echoService.echoAbort(unaryRequest, {}, function(err, response) {
    if (err) {
      addRightMessage('Error code: '+err.code+' "'+err.message+'"');
      console.log('Error code: ' + err.code +
                  (err.code == grpc.web.StatusCode.ABORTED ?
                   ' is ' : ' is not ') +
                  'StatusCode.ABORTED');
    }
  });
};

var repeatEcho = function(msg, count) {
  addLeftMessage(msg);
  if (count > MAX_STREAM_MESSAGES) count = MAX_STREAM_MESSAGES;
  var streamRequest = new ServerStreamingEchoRequest();
  streamRequest.setMessage(msg);
  streamRequest.setMessageCount(count);
  streamRequest.setMessageInterval(INTERVAL);

  var stream = echoService.serverStreamingEcho(streamRequest,
                                               {"custom-header-1": "value1"});
  stream.on('data', function(response) {
    addRightMessage(response.getMessage());
  });
  stream.on('status', function(status) {
    if (status.code != grpc.web.StatusCode.OK) {
      addRightMessage('Error code: '+status.code+' "'+status.details+'"');
    }
    if (status.metadata) {
      console.log("Received metadata");
      console.log(status.metadata);
    }
  });
  stream.on('error', function(err) {
    addRightMessage('Error code: '+err.code+' "'+err.message+'"');
  });
  stream.on('end', function() {
    console.log("stream end signal received");
  });
};

var send = function(e) {
  var msg = $("#msg").val().trim();
  $("#msg").val(''); // clear the text box
  if (!msg) return false;

  if (msg.indexOf(' ') > 0) {
    var count = msg.substr(0, msg.indexOf(' '));
    if (/^\d+$/.test(count)) {
      repeatEcho(msg.substr(msg.indexOf(' ') + 1), count);
    } else if (count == 'err') {
      echoError(msg.substr(msg.indexOf(' ') + 1));
    } else {
      echo(msg);
    }
  } else {
    echo(msg);
  }

  return false;
};

$(document).ready(function() {
  echoService = new EchoServiceClient('http://localhost:8080', null, null);

  // event handlers
  $("#send").click(send);
  $("#msg").keyup(function (e) {
    if (e.keyCode == 13) send(); // enter key
    return false;
  });

  $("#msg").focus();
});
