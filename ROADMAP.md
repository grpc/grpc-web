# Overview

The purpose of this document is to list all the features that we believe are
useful for gRPC users.

We would like your feedback! Please tell us which features you would most want
to see, so that we can prioritize the work to either publish Google's existing
solutions or develop some of the features directly in the open-source repo. For
the latter case, please mention if you are interested in contributing to any of
the road-map features :)

[Survey link](https://docs.google.com/forms/d/1NjWpyRviohn5jaPntosBHXRXZYkh_Ffi4GxJZFibylM/edit)

# Background

gRPC-Web has been developed internally at Google as part of the future front-end
stacks for Google's Web applications and cloud services. Over time we plan to
open-source and publish most of the features and make them available to gRPC
users.

Like everywhere, Web platforms and technologies are constantly evolving, often
with many inter-dependent ecosystems. As much as we like to open-source
everything, we also need keep the balance bewteen creating a reusable and stable
open-source solution and meeting those requirements unique to Google's Web
ecosystems or their applications (such as search). 

# Roadmap Features (in no particular order)

## Non-Binary Message Encoding

The binary protobuf encoding format is not most CPU efficient for browser
clients. Furthermore, the generated code size increases as the total protobuf
definition increases.

For Google's Web applications (e.g. gmail), we use a JSON like format which is
comparable to JSON in efficiency but also very compact in both the message size
and code size.

## Streaming-Friendly Transport Implementation

Currently the gRPC-Web client library uses XHR to ensure cross-browser support
and to support platforms such as React-Native.

We do plan to add fetch/streams support at some point, which is more efficient
for binary streams and incurs less memory overhead on the client-side.

However, fetch still has certain gaps compared to XHR, most notably the lack of
cancellation support. Progressing events, I/O event throttling are other
concerns.

## Bidi Support

As WebSocket over HTTP/2 becomes more available, we may add bidi support over
WebSockets.

At the same time, please tell us your exact use case, and maybe explain why
server-streaming is insufficient.

## Security

We plan to publish a comprehensive guideline doc on how to create secure Web
applications.

Native support such as XSRF, XSS prevention may also be added to the gRPC-Web
protocol.

## Compression

Do you need request compression? Brotli? 

## CORS 

We plan to support CORS preflight as specified in
[PROTOCOL-WEB.md](https://github.com/grpc/grpc-web/blob/master/PROTOCOL-WEB.md).

## Local Proxies

In-process proxies will eliminate the need to deploy an extra proxy such as
Nginx. 

We have plans to add proxy support in Python, Java, Node, C++ etc. Let us know
if you are interested in implementatin any language-specific in-process
gRPC-Web proxy.

To minimize maintenance overhead, we don't have any plan to add gRPC-Web support
to any new HTTP reverse proxies other than Nginx and Envoy.

## Web Framework Integration

This is to provide first-class support for gRPC API and gRPC-Web in popular Web
frameworks such as Angular. 

Note Dart gRPC will be using gRPC-Web as the underlying implementation on the
Dart Web platform.

## TypeScript Support

We now have experimental TypeScript Support! See the main README for more
information.

## Non-Closure compiler support

With the addition of CommonJS style imports, gRPC-Web client stubs can now be
compiled with various tools such as Browserify, Webpack, etc. Let us know
what else we should try!

## Web UI Support

This allows the user to construct and submit a gRPC request directly using the
browser.

We need define a standard look & feel for creating and rendering nested protobuf
messages.
