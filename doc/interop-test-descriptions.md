gRPC-Web Interop Tests
======================

This document describes the set of tests any gRPC-Web clients or proxies need
to implement. The proto definition for the messages and RPCs we are using for
the tests can be found
[here](src/proto/grpc/testing/test.proto).

The canonical set of interop tests was defined in the main
[grpc/grpc repo](https://github.com/grpc/grpc/blob/master/doc/interop-test-descriptions.md).

Here in gRPC-Web, we will only implement a subset of tests that's relevant to
gRPC-Web. For example, we will not be implementing any tests involving
client-streaming or bidi-streaming for now. On the other hand, there are
gRPC-Web specific tests that we will add here.

```
 gRPC-Web Client  <-->  Proxy  <--> gRPC Service
```

The idea is that we should be able to swap out any of the 3 components above
and all the interop tests should still pass.

This repository will provide a canonical implementation of the interop test
suite using the Javascript client, Envoy and a gRPC service implemented in
Node.

For any new gRPC-Web client implementation, you need to swap out the JS
client and make sure all tests still pass.

For any in-process proxies implementation, you need to swap out the proxy
and the service as a unit and make sure the standard JS client will still
pass the tests.


List of Tests
-------------

| Test Name | grpc-web-text Mode | grpc-web Binary mode |
| --------- |:------------------:|:--------------------:|
| empty_unary | &#10003; | &#10003; |
| cacheable_unary | TBD | TBD |
| large_unary | &#10003; | &#10003; |
| client_compressed_unary | &#10003; | &#10003; |
| server_compressed_unary | &#10003; | &#10003; |
| client_streaming | &#10007; | &#10007; |
| client_compressed_streaming | &#10007; | &#10007; |
| server_streaming | &#10003; | &#10007; |
| server_compressed_streaming | &#10003; | &#10007; |
| ping_pong | &#10007; | &#10007; |
| empty_stream | &#10007; | &#10007; |
| compute_engine_creds | TBD | TBD |
| jwt_token_creds | TBD | TBD |
| oauth2_auth_token | TBD | TBD |
| per_rpc_creds | TBD | TBD |
| google_default_credentials | TBD | TBD |
| compute_engine_channel_credentials | TBD | TBD |
| custom_metadata * | &#10003; | &#10003; |
| status_code_and_message * | &#10003; | &#10003; |
| special_status_message | &#10003; | &#10003; |
| unimplemented_method | &#10003; | &#10003; |
| unimplemented_service | &#10003; | &#10003; |
| cancel_after_begin | &#10007; | &#10007; |
| cancel_after_first_response | &#10007; | &#10007; |
| timeout_on_sleeping_server | &#10007; | &#10007; |

\* only need to implement the UnaryCall RPC

gRPC-Web specific considerations
--------------------------------

### Text vs Binary mode

As mentioned in the table above, client needs to be tested in both the text
format `application/grpc-web-text` and the binary mode
`application/grpc-web+proto`. The latter we don't need to test any streaming
methods.

### CORS and other web specific scenarios

We may add specific tests to account for web-related scenarios like CORS
handling, etc. Mostly these are to test the connection between the browser
client and the proxy.
