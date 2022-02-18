(On Hold) Java gRPC-web in-process proxy
====================================================

### _(Development on the Java in-process proxy is On Hold. No active development or bug fixes is being done at this moment.)_

### Background & Motivation
This project enables gRPC-web support in a Java Service that currently
serves only gRPC clients but not equipped to handle gRPC-web clients.
This project provides a java jar file that can be added to the Java Service
when it is deployed. There are minimal changes to be made to the Java Service
before linking the jar file provided by this project and re-deploying the
Java Service.

### How to use it in your Java Service
Here are the steps needed to use this project to add gRPC-web client serving
capability to your existing Java Service (that only serves gRPC clients but not
gRPC-web clients)

Examine the code in the following
[dir](../../net/grpc/gateway/examples/grpc-web-java/greeter-service)

- A Java Service specified by
[this proto](../../net/grpc/gateway/examples/grpc-web-java/greeter-service/src/main/proto/greeter.proto) is implemented
[here](../../net/grpc/gateway/examples/grpc-web-java/greeter-service/src/main/java/grpcweb/examples/greeter/GreeterService.java)

- [This](../../net/grpc/gateway/examples/grpc-web-java/greeter-service/src/main/java/grpcweb/examples/greeter/StartServiceAndGrpcwebProxy.java)
code starts the above gRPC-Service and a gRPC-web in-process proxy
provided by this project.

- Since you will already have implemented code to start your gRPC-Service,
add code to start gRPC-web in-process proxy, as demonstrated by
the above.

- The only critical piece of info needed by the gRPC-web in-process proxy is the port
to listen on, for gRPC-web requests.
[This file](../../net/grpc/gateway/examples/grpc-web-java/greeter-service/src/main/java/grpcweb/examples/greeter/Util.java)
 externalizes grpc-web port# thru a static member.

Rebuild your Service with the Java jar file provided by this project and re-deploy.

Voila! Your service can now service gRPC and gRPC-web clients!

### How to run the [Interop tests](https://github.com/grpc/grpc-web/blob/master/test/interop/README.md) with this code

- Install "grpc-web java" jar locally
```shell script
$ cd src/connector
$ mvn install
```
- Bring up a Test Service with this code as "grpc-web in-process proxy"
```shell script
       $ cd net/grpc/gateway/examples/grpc-web-java/interop-test-service
       $ mvn package
       $ java -jar target/interop-test-0.1-jar-with-dependencies.jar
```
- Run the interop tests from browser
```shell script
$ cd test/interop
$ docker-compose up interop-client
```
Open browser at http://localhost:8081/index.html and
check the console for messages like the following:
```shell script
EmptyUnary: passed
LargeUnary: passed
etc..
```
