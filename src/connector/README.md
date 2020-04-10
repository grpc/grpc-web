grpc-web Java in-process Proxy code.
Outline of the code at this point.

This is Work-in-Progress.

Current state of the code: Some interop-tests work now.
 (interop-tests are listed here
   https://github.com/stanley-cheung/grpc-web/blob/add-interop/test/interop/README.md

 To ru nthe interop-tests with this code, do the following
 1. mvn test. This brings ip a Test Service + grpc-web in-process proxy 
 2. Run the client as documented here:
    https://github.com/stanley-cheung/grpc-web/blob/add-interop/test/interop/README.md#run-the-grpc-web-browser-client

3. And then Open up the browser and go to http://localhost:8081/index.html
4. Open the browser to go to Console.
5. It should show the following:
      EmptyUnary: passed
      LargeUnary: passed
      (and then some errors on the other tests which are not yet implemented in
      this grpc-web java proxy code.. working on it)

