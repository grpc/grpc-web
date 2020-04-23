gRPC-Web Interop Tests
======================

See the
[main doc](https://github.com/grpc/grpc-web/blob/master/interop-test-descriptions.md)
for details about gRPC interop tests in general and the list of test cases.


Run interop tests
-----------------

### Build some docker images

```sh
$ cd grpc-web
$ docker-compose -f advanced.yml build common prereqs node-interop-server interop-client
```


### Run the Node interop server

An interop server implemented in Node is hosted in the `grpc/grpc-node` repo.

```sh
$ docker run -d --network=host -p 7074:7074 grpcweb/node-interop-server
```


### Run the Envoy proxy

An `envoy.yaml` file is provided in this directory to direct traffic for these
tests.

```sh
$ docker run -d -v $(pwd)/test/interop/envoy.yaml:/etc/envoy/envoy.yaml:ro \
  --network=host -p 8080:8080 envoyproxy/envoy:v1.14.1
```


### Run the gRPC-Web browser client

You can either run the interop client as `npm test`, like this:

```sh
$ cd test/interop
$ npm install
$ npm test
```

Or from the browser:

```sh
$ docker-compose -f advanced.yml up interop-client
```

Open up the browser and go to `http://localhost:8081/index.html` and open up
the console.
