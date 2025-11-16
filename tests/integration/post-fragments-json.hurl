# tests/integration/post-fragments-json.hurl
# Authenticated POST of an application/json fragment should work and be retrievable
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1

`{"hello":"world"}`

HTTP/1.1 201
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "application/json"
# 17 is the length of {"hello":"world"}
jsonpath "$.fragment.size" == 17
[Captures]
url: header "Location"

GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: application/json
Content-Length: 17
[Asserts]
body == "{\"hello\":\"world\"}"