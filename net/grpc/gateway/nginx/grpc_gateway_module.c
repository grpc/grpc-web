// The Nginx module for GRPC gateway.
// It proxies the HTTP requests (follows go/http-api) to GRPC backends.
// Usage:
//   location / {
//     grpc_pass <host>:<port>
//     grpc_channel_reuse on|off
//     grpc_client_liveness_detection_interval <ms>
//   }
// Example:
//   location / {
//     grpc_pass localhost:8090
//     grpc_channel_reuse on
//     grpc_client_liveness_detection_interval 60000
//   }

#include <stdbool.h>
#include <stddef.h>
#include <stdlib.h>
#include <string.h>

#include <ngx_core.h>
#include <ngx_http.h>
#include "net/grpc/gateway/frontend/nginx_bridge.h"
#include "third_party/grpc/include/grpc/byte_buffer.h"
#include "third_party/grpc/include/grpc/byte_buffer_reader.h"
#include "third_party/grpc/include/grpc/grpc.h"
#include "third_party/grpc/include/grpc/slice.h"
#include "third_party/grpc/include/grpc/status.h"
#include "third_party/grpc/include/grpc/support/thd.h"
#include "third_party/grpc/include/grpc/support/time.h"

// Tag for requests to GRPC backend. It contains the content and will be send
// back to the grpc_event_callback once the GRPC event comes from the completion
// queue.
typedef struct grpc_event_tag grpc_event_tag;
struct grpc_event_tag {
  ngx_http_request_t *ngx_http_request;
  grpc_metadata_array recv_init_metadata;
  grpc_byte_buffer *recv_message;
  grpc_status_code recv_status;
  char *recv_status_details;
  size_t recv_status_details_capacity;
  grpc_metadata_array recv_trailing_metadata;
  void (*grpc_event_callback)(grpc_event_tag *, bool);
};

extern ngx_int_t grpc_gateway_init_process(ngx_cycle_t *cycle);

extern void grpc_gateway_exit_process(ngx_cycle_t *cycle);

// Initiates the ngx_grpc_gateway module.
static char *grpc_gateway(ngx_conf_t *cf, ngx_command_t *cmd, void *conf);

// Callback when receiving a new HTTP request.
extern ngx_int_t grpc_gateway_handler(ngx_http_request_t *r);

// Creates the local configure.
static void *grpc_gateway_create_loc_conf(ngx_conf_t *cf);

// Merges the local configure.
static char *grpc_gateway_merge_loc_conf(ngx_conf_t *cf, void *parent,
                                         void *child);

// Commands for grpc_gateway module.
static ngx_command_t grpc_gateway_commands[] = {
    {ngx_string("grpc_pass"), NGX_HTTP_LOC_CONF | NGX_CONF_TAKE1, grpc_gateway,
     NGX_HTTP_LOC_CONF_OFFSET, 0, NULL},
    {ngx_string("grpc_channel_reuse"), NGX_HTTP_LOC_CONF | NGX_CONF_FLAG,
     ngx_conf_set_flag_slot, NGX_HTTP_LOC_CONF_OFFSET,
     offsetof(ngx_grpc_gateway_loc_conf_t, grpc_channel_reuse), NULL},
    {ngx_string("grpc_client_liveness_detection_interval"),
     NGX_HTTP_LOC_CONF | NGX_CONF_TAKE1, ngx_conf_set_msec_slot,
     NGX_HTTP_LOC_CONF_OFFSET,
     offsetof(ngx_grpc_gateway_loc_conf_t,
              grpc_client_liveness_detection_interval),
     NULL},
    ngx_null_command};

// Module context for grpc_gateway module.
static ngx_http_module_t grpc_gateway_module_ctx = {
    NULL, /* pre-configuration */
    NULL, /* post-configuration */

    NULL, /* create main configuration */
    NULL, /* init main configuration */

    NULL, /* create server configuration */
    NULL, /* merge server configuration */

    grpc_gateway_create_loc_conf, /* create location configuration */
    grpc_gateway_merge_loc_conf   /* merge location configuration */
};

// Nginx module definition for grpc_gateway module.
ngx_module_t grpc_gateway_module = {
    NGX_MODULE_V1,
    &grpc_gateway_module_ctx,  /* module context */
    grpc_gateway_commands,     /* module directives */
    NGX_HTTP_MODULE,           /* module type */
    NULL,                      /* init master */
    NULL,                      /* init module */
    grpc_gateway_init_process, /* init process */
    NULL,                      /* init thread */
    NULL,                      /* exit thread */
    grpc_gateway_exit_process, /* exit process */
    NULL,                      /* exit master */
    NGX_MODULE_V1_PADDING};

char *grpc_gateway(ngx_conf_t *cf, ngx_command_t *cmd, void *conf) {
  ngx_conf_set_str_slot(cf, cmd, conf);
  ngx_http_core_loc_conf_t *clcf =
      ngx_http_conf_get_module_loc_conf(cf, ngx_http_core_module);
  clcf->handler = grpc_gateway_handler;
  return NGX_CONF_OK;
}

void *grpc_gateway_create_loc_conf(ngx_conf_t *cf) {
  ngx_grpc_gateway_loc_conf_t *conf;
  conf = ngx_pcalloc(cf->pool, sizeof(ngx_grpc_gateway_loc_conf_t));
  if (conf == NULL) {
    return NGX_CONF_ERROR;
  }
  conf->grpc_channel_reuse = NGX_CONF_UNSET;
  conf->grpc_client_liveness_detection_interval = NGX_CONF_UNSET_MSEC;
  return conf;
}

char *grpc_gateway_merge_loc_conf(ngx_conf_t *cf, void *parent, void *child) {
  ngx_grpc_gateway_loc_conf_t *conf = child;
  ngx_grpc_gateway_loc_conf_t *p = parent;

  ngx_conf_merge_msec_value(conf->grpc_client_liveness_detection_interval,
                            p->grpc_client_liveness_detection_interval, 0);
  ngx_conf_merge_value(conf->grpc_channel_reuse, p->grpc_channel_reuse, 1);
  ngx_conf_merge_str_value(conf->grpc_pass, p->grpc_pass, "");
  return NGX_CONF_OK;
}
