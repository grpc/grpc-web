// NOTE: This client is used for debugging the node gRPC server WITHOUT the
// Envoy proxy. It does not use the gRPC-Web protocol.

var PROTO_PATH = __dirname + '/helloworld.proto';

var async = require('async');
var grpc = require('@grpc/grpc-js');
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
var helloworld = protoDescriptor.helloworld;
var client = new helloworld.Greeter('localhost:9090',
                                    grpc.credentials.createInsecure());

/**
 * @param {function():?} callback
 */
function runSayHello(callback) {
  client.sayHello({name: 'John'}, {}, (err, response) => {
    console.log(response.message);
    callback();
  });
}

/**
 * @param {function():?} callback
 */
function runSayRepeatHello(callback) {
  var stream = client.sayRepeatHello({name: 'John', count: 5}, {});
  stream.on('data', (response) => {
    console.log(response.message);
  });
  stream.on('end', () => {
    callback();
  });
}


/**
 * Run all of the demos in order
 */
function main() {
  async.series([
    runSayHello,
    runSayRepeatHello,
  ]);
}

if (require.main === module) {
  main();
}
