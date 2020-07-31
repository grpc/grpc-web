# Overview

This document describes the road-map for gRPC-Web to support different streaming features.
* Server-streaming
* Client-streaming and half-duplex streaming
* Full-duplex streaming over HTTP
* Full-duplex streaming over Web-transport

# Server-streaming

We will keep improving server-streaming in the following areas:
* Finalizing keep-alive support (via Envoy) - 2020
* Performance improvements and whatwg Fetch/streams support, including service workers - 2020
* Addressing runtime behavior gaps between Fetch and XHR - 2020+

# Client-streaming and half-duplex streaming

We are actively involved in the Chrome [Origin Trial](https://developers.chrome.com/origintrials/#/view_trial/3524066708417413121) 
to finalize the fetch/upload stream API spec (whatwg). One of the pending issues that blocks the final spec is to decide whether it is safe to enable
upload-streaming over HTTP/1.1. We believe that upload-streaming should be enabled for both HTTP/2 and HTTP/1.1. Specifically for gRPC-Web, the server can't control 
the client deployment. As a result, if upload-streaming is only enabled over HTTP/2, a gRPC service will have to implement a non-streaming method 
as a fallback for each client-streaming method.

Once the whatwg spec is finalized and upload-streaming is supported by major browsers (2020), we will add client-streaming support
in gRPC-Web (and Envoy) which will also enable half-duplex bidi streaming support.

# Full-duplex streaming over HTTP

We have no plan to support full-duplex streaming over WebSockets (over TCP or HTTP/2). We will not publish any experimental spec for gRPC over WebSockets either.

It is possible to support bidi communication over dual HTTP requests, one for download-streaming and the other for upload-streaming, 
similar to what's implemented by Google to support the [W3C Speech API](https://wicg.github.io/speech-api/). 

Once client-streaming is supported in gRPC-Web, we will publish a spec to enable bidi streaming over dual HTTP requests and implement the complete support in Envoy (2020+).

# Full-duplex streaming over Web-transport

We are working with the Chromium Blink team to evaluate how to leverage this whole new transport and QUIC. Stay tuned. 
