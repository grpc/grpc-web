import { EchoService, ECHO_SERVICE_CONFIG } from "./echo.service.pb";
import { TestBed, async } from '@angular/core/testing';
import { EchoRequest, ServerStreamingEchoRequest } from './echo_pb';
import { StatusCode } from 'grpc-web';
import { single, count, tap } from 'rxjs/operators';
import XHRMock from 'xhr-mock';


describe('EchoService', () => {
  var service: EchoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EchoService,
        {
          provide: ECHO_SERVICE_CONFIG,
          useValue: { hostname: 'MyHostname' }
        }
      ]
    });
    service = TestBed.get(EchoService);

    XHRMock.setup();
  });

  afterEach(() => {
    XHRMock.teardown();
  });

  it('should send unary request', async(() => {
    const request = new EchoRequest();
    request.setMessage('aaa');
    XHRMock.use((request, response) => {
      expect(request.method()).toBe('POST');
      // a single 'aaa' string, encoded
      expect(request.body()).toBe('AAAAAAUKA2FhYQ==');
      expect(request.url().toString())
        .toBe('MyHostname/grpc.gateway.testing.EchoService/Echo');
      expect(request.headers()).toEqual({
        'accept': 'application/grpc-web-text',
        'content-type': 'application/grpc-web-text',
        'custom-header-1': 'value1',
        'x-grpc-web': '1',
        'x-user-agent': 'grpc-web-javascript/0.1',
      });
      return response;
    });

    service.echo(request, { 'custom-header-1': 'value1' }).subscribe();
  }));

  it('should receive unary response', async(() => {
    const request = new EchoRequest();
    request.setMessage('aaa');
    XHRMock.use((request, response) => {
      return response
        .status(200)
        .headers({ 'Content-type': 'application/grpc-web-text' })
        // a single data frame with 'aaa' message, encoded
        .body('AAAAAAUKA2FhYQ==');
    });

    service.echo(request)
      .pipe(single())
      .subscribe((response) => {
        expect(response.getMessage()).toBe('aaa');
      }, fail);
  }));

  it('should receive streaming response', async(() => {
    const request = new ServerStreamingEchoRequest();
    request.setMessage('aaa');
    request.setMessageCount(3);
    XHRMock.use((request, response) => {
      return response
        .status(200)
        .headers({ 'Content-type': 'application/grpc-web-text' })
        // 3 'aaa' messages in 3 data frames, encoded
        .body('AAAAAAUKA2FhYQAAAAAFCgNhYWEAAAAABQoDYWFh');
    });

    service.serverStreamingEcho(request)
      .pipe(
        tap(request => expect(request.getMessage()).toBe('aaa')),
        count())
      .subscribe(count => expect(count).toBe(3), fail);
  }));

  it('should receive failure', async(() => {
    const request = new EchoRequest();
    request.setMessage('aaa');
    XHRMock.use((request, response) => {
      return response
        .status(200)
        .headers({ 'Content-type': 'application/grpc-web-text' })
        // a trailer frame with content 'grpc-status:10'
        .body('gAAAABBncnBjLXN0YXR1czoxMA0K');
    });

    service.echo(request).subscribe(
      fail,
      error => expect(error.code).toBe(StatusCode.ABORTED),
    );
  }));
});
