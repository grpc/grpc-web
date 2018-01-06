git submodule update --init
cd third_party/closure-library && git checkout tags/v20160911 -f && cd ../..
cd third_party/openssl && git checkout tags/OpenSSL_1_0_2h -f && cd ../..
cd third_party/grpc && git checkout 2b0ab320c12cb807cf05b3295b7017d0ccbf66f5 -f && git submodule update --init && cd ../..
