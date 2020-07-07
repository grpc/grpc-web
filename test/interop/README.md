gRPC-Web Interop Tests
======================

See the
[main doc](https://github.com/grpc/grpc-web/blob/master/doc/interop-test-descriptions.md)
for details about gRPC interop tests in general and the list of test cases.


Run interop tests
-----------------

### Build some docker images

```sh
$ cd grpc-web
$ docker-compose build common prereqs node-interop-server interop-client
```


### Run the Node interop server

An interop server implemented in Node is hosted in the `grpc/grpc-node` repo.

```sh
$ docker run -d --network=host grpcweb/node-interop-server
```


### Run the Envoy proxy

An `envoy.yaml` file is provided in this directory to direct traffic for these
tests.

```sh
$ docker run -d -v $(pwd)/test/interop/envoy.yaml:/etc/envoy/envoy.yaml:ro \
  --network=host envoyproxy/envoy:v1.15.0
```


### Run the gRPC-Web browser client

You can either run the interop client as `npm test`, like this:

```sh
$ docker run --network=host --rm grpcweb/prereqs /bin/bash \
  /github/grpc-web/scripts/docker-run-interop-tests.sh
```

Or from the browser:

```sh
$ docker-compose up interop-client
```

Open up the browser and go to `http://localhost:8081/index.html` and open up
the console.
