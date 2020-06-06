import * as grpcWeb from 'grpc-web';

import {MessageOuter} from './generated/test01_pb';

let inner1 = new MessageOuter.MessageInner();
inner1.setValue(123);
let msgOuter = new MessageOuter();
msgOuter.setSomepropList([inner1]);

export {msgOuter}
