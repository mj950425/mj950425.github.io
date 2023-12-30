물론입니다. 웹 브라우저에서 자바스크립트 API가 원래의 출처(origin)와 다른 곳으로 요청을 보낼 때, 브라우저는 실제 API 요청 전에 "preflight"라고 불리는 HTTP OPTIONS 요청을 먼저 보낼 수 있습니다. 이는 CORS(Cross-Origin Resource Sharing, 교차 출처 리소스 공유) 규격에 정의된 조건 하에 발생합니다:

아 무조건 다른 오리진이라고 prefilght를 보내는게 아니라 단순 요청이 아닌 경우에만 보내는거야? 그런데 적어도 post요청은 막아줘야하는거아니야?

ChatGPT
네, 맞습니다. 모든 다른 출처(cross-origin) 요청에 대해 브라우저가 preflight 요청을 보내는 것은 아니며, 단순 요청이 아닐 경우에만 preflight 요청을 보냅니다. 단순 요청은 특정 조건을 만족해야 하며, 그 중에는 POST 요청도 포함됩니다.

POST 요청이 단순 요청으로 간주되기 위해서는 다음과 같은 조건을 만족해야 합니다:

POST 요청의 Content-Type 헤더는 반드시 application/x-www-form-urlencoded, multipart/form-data, 또는 text/plain 중 하나여야 합니다.
요청에 사용자 정의 헤더가 포함되지 않아야 합니다.
단순 요청에 해당되는 POST 요청은 preflight를 거치지 않고 바로 서버에 전송됩니다. 그러나 Content-Type이 위의 세 가지 유형 중 하나가 아니거나 사용자 정의 헤더를 사용하는 경우, 그리고 다른 HTTP 메소드(예: PUT, DELETE)를 사용하는 경우 preflight 요청을 먼저 보내야 합니다.

아 그러면 헤더에 아무 값을 안넣고 그냥 바디만 json으로 담아서 보내는 post요청은 서버에서 cors 허용을 안해도 통과되는거네/
ChatGPT
아닙니다, 그렇지 않습니다. JSON 형식의 데이터를 포함하는 POST 요청은 "단순 요청(simple request)"에 해당되지 않습니다. "단순 요청"에서 허용하는 Content-Type은 application/x-www-form-urlencoded, multipart/form-data, 또는 text/plain입니다. JSON을 사용하는 경우 Content-Type이 application/json이 되며, 이는 CORS 사양에 따라 "단순 요청"이 아니기 때문에 preflight 요청이 필요합니다.

따라서 JSON 형식의 바디를 사용하여 POST 요청을 보내면, 브라우저는 다음과 같은 절차를 따릅니다:

브라우저는 실제 POST 요청을 보내기 전에 서버에 OPTIONS 메소드를 사용하여 preflight 요청을 보냅니다.
서버는 이 preflight 요청에 대해 Access-Control-Allow-Origin 헤더를 포함한 CORS 헤더를 응답해야 합니다. 여기서 서버는 자신의 리소스에 대한 접근을 허용하는 출처를 지정합니다.
서버가 적절한 CORS 헤더를 반환하면 브라우저는 실제 POST 요청을 보내고, 그렇지 않으면 요청을 차단합니다.
즉, JSON 바디를 포함하는 POST 요청에 대해서는 서버가 CORS를 명시적으로 허용해 주어야 하며, 그렇지 않으면 브라우저는 요청을 차단합니다.

아 그러면 json이 아니라 urlencoded로 보내면 cors에 안걸리는거네?
ChatGPT
application/x-www-form-urlencoded 형식으로 POST 요청을 보낼 경우, 그리고 다른 조건들(사용자 정의 헤더를 사용하지 않는 등)이 "단순 요청"의 조건에 부합한다면, 해당 요청은 CORS 정책의 preflight 절차 없이 보낼 수 있습니다. 그러나 이것은 preflight가 필요하지 않다는 의미이지, CORS 정책에 걸리지 않는다는 것을 의미하지는 않습니다.

단순 요청이라도, 요청이 다른 출처로부터 이루어진다면 (즉, 웹 페이지의 도메인과 API 서버의 도메인이 다를 경우) 서버 측에서는 여전히 Access-Control-Allow-Origin 헤더를 포함한 적절한 CORS 헤더를 응답해야 합니다. 만약 서버가 이러한 헤더를 포함하지 않는다면, 브라우저는 여전히 이 요청을 차단할 것입니다.

요약하자면, application/x-www-form-urlencoded 형식의 POST 요청은 preflight 요청 없이 서버로 직접 전송될 수 있지만, 서버가 적절한 CORS 헤더를 반환하지 않으면 브라우저는 요청을 차단할 것입니다. CORS는 브라우저가 서버로부터 받는 응답을 처리하는 방법을 결정하는 데 사용되며, 이는 단순 요청에도 적용됩니다.

---
cors는 브라우저에서 동작하는 보안이다.

javscript를 제공해준 origin과 api 가 향하는 곳의 origin이 다른 경우에 동작한다.

먼저 단순요청인지 확인한다. 단순요청이면 preflight과정이 없지만 단순요청이 아닌 경우 prefilght요청을 보낸다.

백앤드 서버는 그냥 내가 cors를 허용하고 있는 origin을 담아서 넘겨준다.

즉 백앤드는 어떤 요청이 오던 전부 필터없이 처리하는데 return하는 응답값에 ccess-Control-Allow-Origin를 담아서 돌려주고 브라우저가 이걸 보고 아 해당 백앤드는 내 자바스크립트의 origin을 허용하는게 아니네? 그러면 응답값을 클라이언트에게 보여주지말아야지! 라고 판단하는것

