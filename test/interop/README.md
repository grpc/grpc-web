gRPC-Web Interop Tests
======================

See the
[main doc](https://github.com/grpc/grpc-web/blob/master/interop-test-descriptions.md)
for details about gRPC interop tests in general and the list of test cases.


Run interop tests
-----------------

### Run the Node interop server

An interop server implemented in Node is hosted in the `grpc/grpc-node` repo.
There might be a bit of set up you need to do before running the command below.

```sh
$ cd grpc-node/test
$ node --require ./fixtures/native_native interop/interop_server.js --port=7074
```


### Run the Envoy proxy

An `envoy.yaml` file is provided in this directory to direct traffic for these
tests.

```sh
$ cd grpc-web
$ docker run -it --rm -v $(pwd)/test/interop/envoy.yaml:/etc/envoy/envoy.yaml:ro \
  --network=host -p 8080:8080 envoyproxy/envoy:latest
```


### Run the gRPC-Web browser client


```sh
$ cd grpc-web
$ docker-compose -f advanced.yml build common prereqs interop
$ docker-compose -f advanced.yml up interop
```

Open up the browser and go to `http://localhost:8081/index.html` and open up
the console.
