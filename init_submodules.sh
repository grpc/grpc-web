git submodule update --init
cd third_party/closure-library && git checkout tags/v20160911 -f && cd ../..
cd third_party/openssl && git checkout tags/OpenSSL_1_0_2h -f && cd ../..
cd third_party/grpc && git checkout tags/v1.0.0 -f && cd ../..
cd third_party/protobuf && git checkout tags/v3.0.2 -f && cd ../..
