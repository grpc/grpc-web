var PROTO_PATH = __dirname + '/helloworld.proto';

var async = require('async');
var grpc = require('grpc');
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
 * @param {function():?} callback
 */
function runSayHelloAfterDelay(callback) {
  var deadline = new Date();
  deadline.setSeconds(deadline.getSeconds() + 1);

  client.sayHelloAfterDelay({name: 'John'}, {deadline: deadline.getTime()},
    (err, response) => {
      console.log('Got error, code = ' + err.code +
                  ', message = ' + err.message);
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
    runSayHelloAfterDelay
  ]);
}

if (require.main === module) {
  main();
}
