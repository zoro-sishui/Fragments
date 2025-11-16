# tests/integration/post-fragments-unsupported-type.hurl
# Authenticated POST with an unsupported Content-Type should return 415
POST http://localhost:8080/v1/fragments
Content-Type: application/xml
[BasicAuth]
user1@email.com:password1

`<note><to>You</to><msg>Hello</msg></note>`

HTTP/1.1 415
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 415