This dir contains code to exercise the [java grpc-web in-process
proxy](../../../../../../src/connector) with a simple 
[service](src/main/proto/greeter.proto).

To run this example, run this command
```
mvn test
```

This example does the following:
1. Implement a [service](src/main/proto/greeter.proto)
2. Start the service on a **grpc-port**. Service is now ready to accept grpc requests on **grpc-port**
3. Start the grpc-web in-process proxy on another port **grpc-web-port**
4. Service is now ready to accept grpc-web requests on the **grpc-web-port**
