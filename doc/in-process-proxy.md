# Overview

In-process proxies allow a browser client to talk to a gRPC server directly without relying on any intermediary process
such as an Envoy proxy. This document provides a high-level design guidelines on how we expect such a "proxy" to work.

# The choice of HTTP stack

We strongly recommend that the gRPC-Web module use the default HTTP stack provided by the language platform, or in the case of Java,
the standard Java Servlet framework. This is to ensure maximum portability and to ease integration between gRPC-Web and existing Web
frameworks.

The actual HTTP version that the HTTP stack supports may include both HTTP/1.1 and HTTP/2. In the runtime, it's up to the user-agent and 
intermediaries to negotiate the HTTP version, which is transparent to the gRPC-Web module.

# Request translation

For most languages, the gRPC-Web module will handle the gRPC-Web request, perform the translation, and then proxy the request using a gRPC client 
to the gRPC server via a local socket. The gRPC-Web support is fully transparent to the gRPC server.

For some languages, such as Swift, .NET, if the gRPC server implementation uses the same HTTP stack that the gRPC-Web module uses, then gRPC-Web may be supported 
directly as part of the gRPC server implementation. The added complexity to the gRPC implementation itself is still a concern.

# HTTP port

We expect that gRPC-Web requests are handled on a separate port. If the HTTP stack supports both HTTP/2 and HTTP/1.1, port sharing could be supported. 
However, since CORS is a mandatory feature for gRPC-Web proxies, port sharing should be optional for in-process proxies.

# Core features

The gRPC-Web module should implement only the [core gRPC-Web features](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md) and leave to the HTTP/Web stack provided by the language platform to handle [Web-framework-level features](https://github.com/grpc/grpc-web/blob/master/doc/browser-features.md) such as XSRF, CORS policies. Some of those features may be incompatible with what Envoy supports for gRPC-Web.
