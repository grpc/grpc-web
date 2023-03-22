# Streaming Roadmap

This document describes the road-map for gRPC-Web to support different streaming features.
* Server-streaming
* Client-streaming and half-duplex streaming
* Full-duplex streaming over WebTransport

## Server-streaming

We will keep improving server-streaming in the following areas:
* Fetch cancellation support - 2023
* Finalizing keep-alive support (via Envoy) - 2023+
* Performance improvements and whatwg Fetch/streams support, including service workers - 2023+
* Addressing runtime behavior gaps between Fetch and XHR - 2023+

## Client-streaming and half-duplex streaming

We don’t plan to support client-streaming via Fetch/upload-streams (See [Appendix](#chrome-origin-trial-on-upload-streaming) on backgrounds on the Chrome Origin Trial). As a result, half-duplex bidi streaming won’t be supported via Fetch/streams either.

Client-streaming and half-duplex bidi streaming will be addressed when Full-duplex streaming is supported via WebTransport (see below).

## Full-duplex streaming over WebTransport

We will be leveraging [WebTransport](https://web.dev/webtransport/) to enable full-duplex (bi-directional) streaming. Planned for 2023+.

## Issues with WebSockets

We have no plan to support full-duplex streaming over WebSockets (over TCP or HTTP/2). We will not publish any experimental spec for gRPC over WebSockets either.

The main issue with WebSockets is its incompatibility with HTTP, i.e. the ubiquitous Web infrastructure. This means HTTP fallback is always needed. Recent IETF proposal to tunnel WebSockets over HTTP/2 is not widely implemented either.

## Appendix

### Chrome Origin Trial on `upload-streaming`

We worked on a Chrome [Origin Trial](https://developers.chrome.com/origintrials/#/view_trial/3524066708417413121) 
to finalize the fetch/upload stream API spec (whatwg). One of the pending issues that blocks the final spec is to decide whether it is safe to enable
upload-streaming over HTTP/1.1. We believe that upload-streaming should be enabled for both HTTP/2 and HTTP/1.1. Specifically for gRPC-Web, the server can't control the client deployment. As a result, if upload-streaming is only enabled over HTTP/2, a gRPC service will have to implement a non-streaming method 
as a fallback for each client-streaming method.