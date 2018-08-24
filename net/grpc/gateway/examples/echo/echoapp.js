/**
 *
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

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
  var self = this;
  var call = this.echoService.echo(unaryRequest,
                                   {"custom-header-1": "value1"},
                                   function(err, response) {
    if (err) {
      echoapp.EchoApp.addRightMessage('Error code: '+err.code+' "'+
                                      err.message+'"');
    } else {
      setTimeout(function () {
        echoapp.EchoApp.addRightMessage(response.getMessage());
      }, echoapp.EchoApp.INTERVAL);
    }
  });
  call.on('status', function(status) {
    self.handlers.checkGrpcStatusCode(status);
    if (status.metadata) {
      console.log("Received metadata");
      console.log(status.metadata);
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
    $("#send").click(self.send.bind(self));
    $("#msg").keyup(function (e) {
      if (e.keyCode == 13) self.send(); // enter key
      return false;
    });

    $("#msg").focus();
  });
};

module.exports = echoapp;
