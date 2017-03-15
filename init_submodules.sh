git submodule update --init
cd third_party/closure-library && git checkout tags/v20160911 -f && cd ../..
cd third_party/openssl && git checkout tags/OpenSSL_1_0_2h -f && cd ../..
cd third_party/grpc && git checkout f1666d48244143ddaf463523030ee76cc0fe691c -f && git submodule update --init && cd ../..
