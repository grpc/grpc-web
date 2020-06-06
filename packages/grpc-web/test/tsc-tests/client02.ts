import * as grpcWeb from 'grpc-web';

import {Integer} from './generated/test03_pb';
import {MyServiceClient} from './generated/Test02ServiceClientPb';

const service = new MyServiceClient('http://mydummy.com', null, null);
const req = new Integer();

service.addOne(req, {}, (err: grpcWeb.Error, resp: Integer) => {
});
