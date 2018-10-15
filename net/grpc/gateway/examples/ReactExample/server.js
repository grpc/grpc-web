var PROTO_PATH = __dirname + '/todo.proto';

var grpc = require('grpc');
var _ = require('lodash');
var async = require('async');
var protoLoader = require('@grpc/proto-loader');
var packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });
var protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
var todoPackage = protoDescriptor.todoPackage;

function addTodo(call, callback) {
  // call.request.id and call.request.todo are coming from React-Client
  callback(null, {id: call.request.id,todo:call.request.todo});
  console.log('Request',call.request)
}

function getServer() {
  var server = new grpc.Server();
  server.addProtoService(todoPackage.Greeter.service, {
    Todo: addTodo,
  });
  return server;
}

if (require.main === module) {
  var server = getServer();
  server.bind('0.0.0.0:9090', grpc.ServerCredentials.createInsecure());
  server.start();
}

exports.getServer = getServer;