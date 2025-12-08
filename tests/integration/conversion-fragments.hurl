# tests/integration/conversion-fragments.hurl
# Authenticated GET to /v1/fragments/:id.ext

# 1. Create a markdown fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/markdown
[BasicAuth]
user1@email.com:password1
`# Hello World`

HTTP/1.1 201
[Captures]
url: header "Location"

# 2. Get the fragment as HTML
GET {{url}}.html
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" startsWith "text/html"
body contains "<h1>Hello World</h1>"

# 3. Get the fragment as Text
GET {{url}}.txt
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" startsWith "text/plain"
`# Hello World`

# 4. Create a CSV fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/csv
[BasicAuth]
user1@email.com:password1
```
id,name
1,Test
```

HTTP/1.1 201
[Captures]
csv_url: header "Location"

# 5. Get CSV as JSON
GET {{csv_url}}.json
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" startsWith "application/json"
jsonpath "$" count == 1
jsonpath "$[0].id" == "1"
jsonpath "$[0].name" == "Test"
