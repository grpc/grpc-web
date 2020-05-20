grpc-web Java in-process Proxy code.
Outline of the code at this point.

This is Work-in-Progress.

Current state of the code: All interop-tests work
 (interop-tests are listed here
   https://github.com/stanley-cheung/grpc-web/blob/add-interop/test/interop/README.md

 To run the interop-tests with this code, do the following
 1. mvn package. This brings ip a Test Service + grpc-web in-process proxy 
 2. Run the client as documented here:
    https://github.com/stanley-cheung/grpc-web/blob/add-interop/test/interop/README.md#run-the-grpc-web-browser-client

3. And then Open up the browser and go to http://localhost:8081/index.html
4. Open the browser to go to Console.
5. It should show the following:
      EmptyUnary: passed
      LargeUnary: passed
      etc for all tests

