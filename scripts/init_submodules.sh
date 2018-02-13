cd "$(dirname "$0")"
cd ..
git submodule update --init
cd third_party/closure-library && git checkout tags/v20171112 -f && cd ../..
cd third_party/openssl && git checkout tags/OpenSSL_1_0_2h -f && cd ../..
cd third_party/grpc && git checkout 0819ff5 -f && git submodule update --init && cd ../..
cd scripts/

