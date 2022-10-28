[//]: # (GENERATED FILE -- DO NOT EDIT!)
[//]: # (See scripts/release_notes.py for more details.)

## 1.4.2

- [#1289](https://github.com/grpc/grpc-web/pull/1289) Expose getName() in MethodDescriptor and fix TS definitions.
- [#1230](https://github.com/grpc/grpc-web/pull/1230) GrpcWebClientReadableStream: keep falsy data @pro-wh

## 1.4.1

- [#1286](https://github.com/grpc/grpc-web/pull/1286) Fix duplicate dot in enum name (when "package" is specified)

## 1.4.0

### Major Features

- [#1249](https://github.com/grpc/grpc-web/pull/1249) Use Zig to build aarch64 binaries @hronro
- [#1203](https://github.com/grpc/grpc-web/pull/1203) Github Actions (workflows) for building `protoc-gen-grpc-web` plugins

### Other Changes

- [#1279](https://github.com/grpc/grpc-web/pull/1279) Fixes the status codes ordering in typescript definitions @chandraaditya
- [#1278](https://github.com/grpc/grpc-web/pull/1278) Fix Enum with module in generated TS interface.
- [#1254](https://github.com/grpc/grpc-web/pull/1254) Remove Trailing Slashes from Hostname @jkjk822
- [#1252](https://github.com/grpc/grpc-web/pull/1252) Fix Zig setup step in CI @hronro
- [#1231](https://github.com/grpc/grpc-web/pull/1231) Add version flag and version info in generated code @meling
- [#1225](https://github.com/grpc/grpc-web/pull/1225) Improve error message & Internal code sync
- [#1222](https://github.com/grpc/grpc-web/pull/1222) Update envoy version to 1.22 (with config updates) @tomk9
- [#1211](https://github.com/grpc/grpc-web/pull/1211) Upgrade protobuf and grpc deps @aapeliv
- [#1199](https://github.com/grpc/grpc-web/pull/1199) Revert "Expose MethodDescriptor's public methods"


## 1.3.1

- [#1184](https://github.com/grpc/grpc-web/pull/1184) Correctly support proto3 optional fields in commonjs+dts .d.ts output @mattnathan
- [#1173](https://github.com/grpc/grpc-web/pull/1173) Update envoy version to 1.20
- [#1172](https://github.com/grpc/grpc-web/pull/1172) Fix issue where **no RPC is issued when `deadline` is specified.**
- [#1167](https://github.com/grpc/grpc-web/pull/1167) Fix missing TypeScript return type for `serverStreaming` calls. @lukasmoellerch
- [#1166](https://github.com/grpc/grpc-web/pull/1166) Add missing exports from `RpcError` and add test.
- [#1164](https://github.com/grpc/grpc-web/pull/1164) Add missing class exports @tinrab
- [#1160](https://github.com/grpc/grpc-web/pull/1160) Expose MethodDescriptor's public methods @tomferreira

## 1.3.0

### Major Features

- [#1139](https://github.com/grpc/grpc-web/pull/1139) Improve error type with `RpcError` & internal code sync (contributor: @TomiBelan)
  + (experimental) Typescript users need to update type references from `Error` -> `RpcError`

### Other Changes

- [#1140](https://github.com/grpc/grpc-web/pull/1140) Improve `RpcError.code` typing & internal code sync (contributor:  @richieforeman)
- [#1138](https://github.com/grpc/grpc-web/pull/1138) Remove Bazel in Javascript toolchain
- [#1137](https://github.com/grpc/grpc-web/pull/1137) Revamp Closure JsUnit tests runtime and optimize test/build flows.
- [#1115](https://github.com/grpc/grpc-web/pull/1115) Bump Bazel version -> 4.1.0 and Protobuf version -> 3.17.3
- [#1107](https://github.com/grpc/grpc-web/pull/1107) Allow for custom install prefix @06kellyjac
- [#1063](https://github.com/grpc/grpc-web/pull/1063) Also set timeout on HTTP request if deadline for grpc call is set @Yannic
- [#1004](https://github.com/grpc/grpc-web/pull/1004) Bump closure library version to v20201102
- [#1002](https://github.com/grpc/grpc-web/pull/1002) Bump Envoy version to 1.16.1
- [#998](https://github.com/grpc/grpc-web/pull/998) Fix GrpcWebClientBaseOptions types in index.d.ts @acalvo
- [#971](https://github.com/grpc/grpc-web/pull/971) Add grpc.web.ClientOptions to better document options and add type res... @jennnnny
- [#969](https://github.com/grpc/grpc-web/pull/969) Fix non-determinism in code generator
- [#941](https://github.com/grpc/grpc-web/pull/941) Fix Protobuf .d.ts typings for .proto files without package @Yannic


## 1.2.1

- [#910](https://github.com/grpc/grpc-web/pull/910) Add test to show how to access metadata in interceptor
- [#903](https://github.com/grpc/grpc-web/pull/903) Add error handling to a few error conditions
- [#886](https://github.com/grpc/grpc-web/pull/886) Add missing types definitions
- [#885](https://github.com/grpc/grpc-web/pull/885) Bump Envoy to 1.15.0
- [#884](https://github.com/grpc/grpc-web/pull/884) Update protoc plugin to support Proto3 optional
- [#882](https://github.com/grpc/grpc-web/pull/882) Add @interface MethodDescroptorInterface [@Jennnnny](https://github.com/Jennnnny)
- [#880](https://github.com/grpc/grpc-web/pull/880) Update Bazel to 3.3.1 [@Yannic](https://github.com/Yannic)
- [#874](https://github.com/grpc/grpc-web/pull/874) Add removeListener and missing metadata event types [@danielthank](https://github.com/danielthank)
- [#872](https://github.com/grpc/grpc-web/pull/872) [bazel] Introduce grpc_web_toolchain [@Yannic](https://github.com/Yannic)
- [#871](https://github.com/grpc/grpc-web/pull/871) [generator] Refactor dependency management [@Yannic](https://github.com/Yannic)
- [#869](https://github.com/grpc/grpc-web/pull/869) Add scripts to run interop-tests on grpc-web Java connector


## 1.2.0

### Major Features

- [#847](https://github.com/grpc/grpc-web/pull/847) Allow multiple .on() callbacks and fix issue with non-OK status

### Other Changes

- [#859](https://github.com/grpc/grpc-web/pull/859) Fix envoy.yaml deprecated fields [@dmaixner](https://github.com/dmaixner)
- [#858](https://github.com/grpc/grpc-web/pull/858) Refactor error handling in grpcwebclientbase
- [#857](https://github.com/grpc/grpc-web/pull/857) Migrate to ES6 classes
- [#852](https://github.com/grpc/grpc-web/pull/852) Update to use @grpc/grpc-js node package, and update helloworld exampl...
- [#851](https://github.com/grpc/grpc-web/pull/851) Add a ThenableCall base class for the promise-based unaryCall function [@Jennnnny](https://github.com/Jennnnny)
- [#844](https://github.com/grpc/grpc-web/pull/844) Fix code generator bug and add tests
- [#833](https://github.com/grpc/grpc-web/pull/833) Add proper author attribution to release notes / changelog
- [#827](https://github.com/grpc/grpc-web/pull/827) Splitting callback based client and Promise based client into multiple... [@Jennnnny](https://github.com/Jennnnny)
- [#822](https://github.com/grpc/grpc-web/pull/822) use explicit envoy release tag [@xsbchen](https://github.com/xsbchen)
- [#821](https://github.com/grpc/grpc-web/pull/821) Experimental Feature: Add ES6 import style [@Yannic](https://github.com/Yannic)
- [#738](https://github.com/grpc/grpc-web/pull/738) Avoid double slash in url when client hostname has tailing slash [@hanabi1224](https://github.com/hanabi1224)


## 1.1.0

### Major Features

- [#785](https://github.com/grpc/grpc-web/pull/785) grpc-web interceptors implementation [@Jennnnny](https://github.com/Jennnnny)
- [#772](https://github.com/grpc/grpc-web/pull/772) Add interop test spec and interop tests

### Other Changes

- [#818](https://github.com/grpc/grpc-web/pull/818) All java connector interop tests are passing now
- [#804](https://github.com/grpc/grpc-web/pull/804) Fix a bug in test: callback not properly intercepted
- [#801](https://github.com/grpc/grpc-web/pull/801) Trying to speed up tests
- [#797](https://github.com/grpc/grpc-web/pull/797) Split basic tests with interop tests
- [#780](https://github.com/grpc/grpc-web/pull/780) Add missing separator to imports from external files [@tomiaijo](https://github.com/tomiaijo)
- [#777](https://github.com/grpc/grpc-web/pull/777) Add .on(metadata,...) callback to distinguish initial metadata
- [#764](https://github.com/grpc/grpc-web/pull/764) [generator] Move options parsing into dedicated class [@Yannic](https://github.com/Yannic)
- [#761](https://github.com/grpc/grpc-web/pull/761) Update generic client [@Jennnnny](https://github.com/Jennnnny)
- [#756](https://github.com/grpc/grpc-web/pull/756) Add eval test for TypeScript generated code
- [#752](https://github.com/grpc/grpc-web/pull/752) Disable static checkers on generated js files [@IagoLast](https://github.com/IagoLast)
- [#747](https://github.com/grpc/grpc-web/pull/747) Enable builder pattern in Typescript protobuf messages. [@Orphis](https://github.com/Orphis)
- [#746](https://github.com/grpc/grpc-web/pull/746) Generate Promise based overloads for unary calls in Typescript [@Orphis](https://github.com/Orphis)
- [#745](https://github.com/grpc/grpc-web/pull/745) [bazel] Update rules_closure + fix linter warnings [@Yannic](https://github.com/Yannic)
- [#734](https://github.com/grpc/grpc-web/pull/734) Allow GrpcWebStreamParser to accept Uint8Array [@travikk](https://github.com/travikk)
- [#723](https://github.com/grpc/grpc-web/pull/723) Update bazel version
- [#720](https://github.com/grpc/grpc-web/pull/720) Fix grpcwebproxy interop
- [#716](https://github.com/grpc/grpc-web/pull/716) allow_origin is deprecated in latest envoy server [@noconnor](https://github.com/noconnor)
- [#695](https://github.com/grpc/grpc-web/pull/695) Fix issue 632 (double execution of callback) [@hfinger](https://github.com/hfinger)
- [#692](https://github.com/grpc/grpc-web/pull/692) Do not hardcode CXX to g++


## 1.0.7

- [#671](https://github.com/grpc/grpc-web/pull/671) Add metadata to error callback
- [#668](https://github.com/grpc/grpc-web/pull/668) Remove stream_body.proto
- [#665](https://github.com/grpc/grpc-web/pull/665) Add config for Bazel CI [@Yannic](https://github.com/Yannic)
- [#663](https://github.com/grpc/grpc-web/pull/663) nginx example Expose-Headers add Grpc-Message,Grpc-Status [@zsluedem](https://github.com/zsluedem)
- [#657](https://github.com/grpc/grpc-web/pull/657) Ensure that the end callback is called [@vbfox](https://github.com/vbfox)
- [#655](https://github.com/grpc/grpc-web/pull/655) Use closure compiler from npm in build.js [@vbfox](https://github.com/vbfox)
- [#654](https://github.com/grpc/grpc-web/pull/654) Ignore MacOS .DS_Store files [@vbfox](https://github.com/vbfox)
- [#652](https://github.com/grpc/grpc-web/pull/652) Fix error callback
- [#644](https://github.com/grpc/grpc-web/pull/644) Add CallOptions class [@Jennnnny](https://github.com/Jennnnny)
- [#641](https://github.com/grpc/grpc-web/pull/641) Add/update GOVERNANCE.md and CONTRIBUTING.md
- [#635](https://github.com/grpc/grpc-web/pull/635) Fix generated code return type, and remove unused var
- [#628](https://github.com/grpc/grpc-web/pull/628) Added API for simple unary call [@Jennnnny](https://github.com/Jennnnny)
- [#621](https://github.com/grpc/grpc-web/pull/621) Fix output directory name when using import_style=typescript [@asv](https://github.com/asv)
- [#619](https://github.com/grpc/grpc-web/pull/619) Return specific grpc status code on http error [@harmangakhal](https://github.com/harmangakhal)
- [#618](https://github.com/grpc/grpc-web/pull/618) Generate method descriptors into multiple files [@Jennnnny](https://github.com/Jennnnny)
- [#617](https://github.com/grpc/grpc-web/pull/617) Remove `enabled` deprecated field [@gsalisi](https://github.com/gsalisi)
- [#615](https://github.com/grpc/grpc-web/pull/615) Add support in code generator for printing only method descriptors [@Jennnnny](https://github.com/Jennnnny)
- [#608](https://github.com/grpc/grpc-web/pull/608) Fix status and error callbacks


## 1.0.6

- [#604](https://github.com/grpc/grpc-web/pull/604) Add option to set withCredentials to true
- [#603](https://github.com/grpc/grpc-web/pull/603) Adding some groundwork for generic client [@Jennnnny](https://github.com/Jennnnny)
- [#600](https://github.com/grpc/grpc-web/pull/600) Add generated code eval test
- [#599](https://github.com/grpc/grpc-web/pull/599) fix wrong package name of input type [@lqs](https://github.com/lqs)
- [#593](https://github.com/grpc/grpc-web/pull/593) Fix: Helloworld Example - Enabled Deprecation [@gary-lo](https://github.com/gary-lo)


## 1.0.5

- [#582](https://github.com/grpc/grpc-web/pull/582) Ensure credentials are not undefined in typescript [@Globegitter](https://github.com/Globegitter)
- [#579](https://github.com/grpc/grpc-web/pull/579) Uppercase enum keys in TypeScript definitions [@benfoxbotica](https://github.com/benfoxbotica)
- [#578](https://github.com/grpc/grpc-web/pull/578) Fix depset issues with/upgrade to Bazel 0.27.1 [@factuno-db](https://github.com/factuno-db)
- [#567](https://github.com/grpc/grpc-web/pull/567) Introducing MethodDescriptor [@Jennnnny](https://github.com/Jennnnny)
- [#559](https://github.com/grpc/grpc-web/pull/559) Adding new fields to MethodInfo [@Jennnnny](https://github.com/Jennnnny)
- [#556](https://github.com/grpc/grpc-web/pull/556) Add fix for deadline of strings, NaN, Infinity and -Infinity [@CatEars](https://github.com/CatEars)
- [#546](https://github.com/grpc/grpc-web/pull/546) Changes to deserializeBinary API
- [#540](https://github.com/grpc/grpc-web/pull/540) Method Derserializer should take Uint8Array [@pnegahdar](https://github.com/pnegahdar)
- [#519](https://github.com/grpc/grpc-web/pull/519) remove duplicated has$field$ method for oneof [@yangjian](https://github.com/yangjian)
- [#512](https://github.com/grpc/grpc-web/pull/512) Make client args `credentials` and `options` optional [@jonahbron](https://github.com/jonahbron)


## 1.0.4

- [#502](https://github.com/grpc/grpc-web/pull/502) Attempt to fix flakiness of 'bazel test' [@Yannic](https://github.com/Yannic)
- [#497](https://github.com/grpc/grpc-web/pull/497) Remove a return that skip emission of end callback [@tinou98](https://github.com/tinou98)
- [#494](https://github.com/grpc/grpc-web/pull/494) [bazel] Migrate protobuf info provider to new-style one [@Yannic](https://github.com/Yannic)
- [#482](https://github.com/grpc/grpc-web/pull/482) feature: Typings codegen for bytes field type [@shaxbee](https://github.com/shaxbee)
- [#481](https://github.com/grpc/grpc-web/pull/481) Add module alias to enums for Typescript [@rogchap](https://github.com/rogchap)
- [#460](https://github.com/grpc/grpc-web/pull/460) add typescript definition for Oneof fields [@yangjian](https://github.com/yangjian)
- [#452](https://github.com/grpc/grpc-web/pull/452) fix: exclude map entry message from typings, fix optional values [@shaxbee](https://github.com/shaxbee)
- [#448](https://github.com/grpc/grpc-web/pull/448) Export Map types correctly, optional getter/setters for message types [@shaxbee](https://github.com/shaxbee)
- [#444](https://github.com/grpc/grpc-web/pull/444) feature: Messages in typings extending jspb.Message [@shaxbee](https://github.com/shaxbee)
- [#433](https://github.com/grpc/grpc-web/pull/433) Match name nesting and imports in .d.ts with .js files [@shaxbee](https://github.com/shaxbee)
- [#430](https://github.com/grpc/grpc-web/pull/430) Use camelCase in AsObject definition [@johanbrandhorst](https://github.com/johanbrandhorst)
- [#429](https://github.com/grpc/grpc-web/pull/429) Fix type error in serverStreaming method [@johanbrandhorst](https://github.com/johanbrandhorst)
- [#427](https://github.com/grpc/grpc-web/pull/427) Promise function should use ES5 functions rather than fat arrows (IE b... [@rogchap](https://github.com/rogchap)
- [#422](https://github.com/grpc/grpc-web/pull/422) Enable ADVANCED_OPTIMIZATIONS in Closure Compiler [@jjbubudi](https://github.com/jjbubudi)
- [#421](https://github.com/grpc/grpc-web/pull/421) [bazel] Upgrade to 0.22.0 [@Yannic](https://github.com/Yannic)
- [#413](https://github.com/grpc/grpc-web/pull/413) Emit status event on empty stream response [@shaxbee](https://github.com/shaxbee)
- [#409](https://github.com/grpc/grpc-web/pull/409) Fix metadata typings for TS client [@bpicolo](https://github.com/bpicolo)
- [#404](https://github.com/grpc/grpc-web/pull/404) Generate Typescript definition for top level Enums [@rogchap](https://github.com/rogchap)


## 1.0.3

- [#391](https://github.com/grpc/grpc-web/pull/391) A script to compile protoc plugin
- [#385](https://github.com/grpc/grpc-web/pull/385) Codegen: Support nested types and enums [@shaxbee](https://github.com/shaxbee)
- [#368](https://github.com/grpc/grpc-web/pull/368) Make the bazel rules work with current rules_closure. [@factuno-db](https://github.com/factuno-db)
- [#367](https://github.com/grpc/grpc-web/pull/367) update examples to use addService [@mitchdraft](https://github.com/mitchdraft)
- [#365](https://github.com/grpc/grpc-web/pull/365) Fix response header value with colon
- [#362](https://github.com/grpc/grpc-web/pull/362) Fix the method name clashes for generated commonjs files  [@weilip1803](https://github.com/weilip1803)
- [#360](https://github.com/grpc/grpc-web/pull/360) Fix the import path for generated typescript files [@at-ishikawa](https://github.com/at-ishikawa)


## 1.0.2


## 1.0.1

- [#354](https://github.com/grpc/grpc-web/pull/354) [dts] Generate PromiseClient type definitions in d.ts file [@at-ishikawa](https://github.com/at-ishikawa)
- [#352](https://github.com/grpc/grpc-web/pull/352)  Add a max grpc timeout to the echo example.  [@mjduijn](https://github.com/mjduijn)
- [#348](https://github.com/grpc/grpc-web/pull/348) Fix output dts about 'repeated' for --grpc-web_out=import_style=common... [@rybbchao](https://github.com/rybbchao)
- [#345](https://github.com/grpc/grpc-web/pull/345) update typescript generation to work in strict mode [@henriiik](https://github.com/henriiik)
- [#330](https://github.com/grpc/grpc-web/pull/330) Use official rules_closure repository [@Yannic](https://github.com/Yannic)


## 1.0.0

- [#314](https://github.com/grpc/grpc-web/pull/314) Add a unit test for proto with no package
- [#313](https://github.com/grpc/grpc-web/pull/313) Show how deadline can be set
- [#311](https://github.com/grpc/grpc-web/pull/311) Document how to prevent Envoy to timeout streaming [@mitar](https://github.com/mitar)
- [#310](https://github.com/grpc/grpc-web/pull/310) Correctly generate code if package name is empty [@mitar](https://github.com/mitar)
- [#304](https://github.com/grpc/grpc-web/pull/304) Add a simple Hello World Guide
- [#303](https://github.com/grpc/grpc-web/pull/303) Error code should be number
- [#276](https://github.com/grpc/grpc-web/pull/276) Fix plugin compile error
- [#272](https://github.com/grpc/grpc-web/pull/272) Fix cpp warnings


## 0.4.0

- [#263](https://github.com/grpc/grpc-web/pull/263) Make "Quick" start quicker
- [#258](https://github.com/grpc/grpc-web/pull/258) Experimental Typescript support
- [#257](https://github.com/grpc/grpc-web/pull/257) Fix bug with button in example


## 0.3.0

- [#249](https://github.com/grpc/grpc-web/pull/249) Various fixes to codegen plugin
- [#247](https://github.com/grpc/grpc-web/pull/247) Add generated code unit test
- [#240](https://github.com/grpc/grpc-web/pull/240) webpack demo
- [#239](https://github.com/grpc/grpc-web/pull/239) Expose response metadata for unary calls
- [#219](https://github.com/grpc/grpc-web/pull/219) Add bazel rule closure_grpc_web_library [@Yannic](https://github.com/Yannic)
- [#217](https://github.com/grpc/grpc-web/pull/217) Added multiple proxies interoperability


## 0.2.0

- [#212](https://github.com/grpc/grpc-web/pull/212) Added commonjs-example Dockerfile
- [#211](https://github.com/grpc/grpc-web/pull/211) commonjs support with import_style option [@zaucy](https://github.com/zaucy)
- [#210](https://github.com/grpc/grpc-web/pull/210) grpcweb npm runtime module [@zaucy](https://github.com/zaucy)
- [#209](https://github.com/grpc/grpc-web/pull/209) Add bazel integration and tests
- [#206](https://github.com/grpc/grpc-web/pull/206) Surface underlying XHR errors better
- [#185](https://github.com/grpc/grpc-web/pull/185) Support for proto files without packages [@zaucy](https://github.com/zaucy)
