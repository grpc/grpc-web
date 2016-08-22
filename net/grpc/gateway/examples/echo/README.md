Here is how to run the example:

 - Run a backend grpc service
     - blaze-run net/grpc/gateway/examples/echo/echo_server
 - Set up the nginx gateway
     - blaze-run net/grpc/gateway/nginx/nginx --
       -p $(pwd)/third_party/nginx/src
       -c $(pwd)/net/grpc/gateway/examples/echo/nginx.conf
 - Build the client JS library
     - blaze-run net/grpc/gateway/examples/echo:echo_js_bin_dev
 - Open up browser
     - http://localhost:5200/net/grpc/gateway/examples/echo/echotest.html
 - Both unary call and server streaming call are supported
 - Only base64-encoded binary proto format is supported
