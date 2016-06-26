#ifndef NET_GRPC_GATEWAY_LOG_H_
#define NET_GRPC_GATEWAY_LOG_H_

#include "third_party/grpc/include/grpc/support/log.h"

#define INFO_0(f) gpr_log(GPR_INFO, f);
#define INFO_1(f, v1) gpr_log(GPR_INFO, f, v1);
#define INFO_2(f, v1, v2) gpr_log(GPR_INFO, f, v1, v2);
#define INFO_3(f, v1, v2, v3) gpr_log(GPR_INFO, f, v1, v2, v3);
#define INFO_4(f, v1, v2, v3, v4) gpr_log(GPR_INFO, f, v1, v2, v3, v4);
#define INFO_X(x, f, v1, v2, v3, v4, func, ...) func
#define INFO(f, ...) INFO_X(, f, ##__VA_ARGS__, \
                            INFO_4(f, __VA_ARGS__), \
                            INFO_3(f, __VA_ARGS__), \
                            INFO_2(f, __VA_ARGS__), \
                            INFO_1(f, __VA_ARGS__), \
                            INFO_0(f))

#define DEBUG_0(f) gpr_log(GPR_DEBUG, f);
#define DEBUG_1(f, v1) gpr_log(GPR_DEBUG, f, v1);
#define DEBUG_2(f, v1, v2) gpr_log(GPR_DEBUG, f, v1, v2);
#define DEBUG_3(f, v1, v2, v3) gpr_log(GPR_DEBUG, f, v1, v2, v3);
#define DEBUG_4(f, v1, v2, v3, v4) gpr_log(GPR_DEBUG, f, v1, v2, v3, v4);
#define DEBUG_X(x, f, v1, v2, v3, v4, func, ...) func
#define DEBUG(f, ...) DEBUG_X(, f, ##__VA_ARGS__, \
                            DEBUG_4(f, __VA_ARGS__), \
                            DEBUG_3(f, __VA_ARGS__), \
                            DEBUG_2(f, __VA_ARGS__), \
                            DEBUG_1(f, __VA_ARGS__), \
                            DEBUG_0(f))

#define ERROR_0(f) gpr_log(GPR_ERROR, f);
#define ERROR_1(f, v1) gpr_log(GPR_ERROR, f, v1);
#define ERROR_2(f, v1, v2) gpr_log(GPR_ERROR, f, v1, v2);
#define ERROR_3(f, v1, v2, v3) gpr_log(GPR_ERROR, f, v1, v2, v3);
#define ERROR_4(f, v1, v2, v3, v4) gpr_log(GPR_ERROR, f, v1, v2, v3, v4);
#define ERROR_X(x, f, v1, v2, v3, v4, func, ...) func
#define ERROR(f, ...) ERROR_X(, f, ##__VA_ARGS__, \
                            ERROR_4(f, __VA_ARGS__), \
                            ERROR_3(f, __VA_ARGS__), \
                            ERROR_2(f, __VA_ARGS__), \
                            ERROR_1(f, __VA_ARGS__), \
                            ERROR_0(f))

#endif  // NET_GRPC_GATEWAY_LOG_H_
