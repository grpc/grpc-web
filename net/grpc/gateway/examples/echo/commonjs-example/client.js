const {Node, List, EchoRequest,
       ServerStreamingEchoRequest} = require('./echo_pb.js');
const {EchoServiceClient} = require('./echo_grpc_pb.js');
const {EchoApp} = require('../echoapp.js');
const grpc = {};
grpc.web = require('grpc-web');

var echoService = new EchoServiceClient('http://localhost:8080', null, null);

var node1 = new Node();
node1.setVal("node1");

var list = new List();
list.setNodesList([node1]);

var node2 = new Node();
node2.setList(list);

console.log("node1.val = "+node2.getList().getNodesList()[0].getVal());

var echoApp = new EchoApp(
  echoService,
  {
    EchoRequest: EchoRequest,
    ServerStreamingEchoRequest: ServerStreamingEchoRequest
  },
  {
    checkGrpcStatusCode: function(status) {
      if (status.code != grpc.web.StatusCode.OK) {
        EchoApp.addRightMessage('Error code: '+status.code+' "'+
                                status.details+'"');
      }
    }
  }
);

echoApp.load();
