#### 회사에서 여러 프로젝트를 진행하면서 정해진 컨벤션이 없어서 RESTFUL 하지 않은 코드들이 많이 생겨나는것을 경험했습니다. 

#### 이 참에 한번 정리해봐야겠다 생각이되어 정리하게 되었습니다. 

#### RESETFUL 컨벤션은 확고한 기반이 있고 그 뒤에 유연하게 반응해야 잘 지켜진다고 생각합니다. 따라서 꼭 지켜야하는 컨벤션들만 정의하려고 합니다.

#### 더 필요한 컨벤션이 필요하다면 계속해서 이 포스트를 업데이트할 생각입니다.

# API-convention


## RESTful API 설계 가이드



#### 목차


#### 1. URL Rules

	1.1 마지막에 '/' 포함하지 않는다.
	
	1.2 '_' 대신 '-' 를 사용한다 

	1.3 소문자를 사용한다.

	1.4 행위는 URL에 포함하지 않는다.

	1.5 Control Resoruce의 경우 동사형태를 허용한다.

#### 2. HTTP status code
    
    2.1 HTTP status code 분류
    2.2 2XX
    
#### 3. HTTP Method
	3.1 GET, POST, DELETE, PUT, HEAD
	
#### 4. Response Body
	4.1 code, message, data
---

# URL Rules

## 1.1 마지막에 '/' 포함하지 않는다.
Bad
> http://api.test.com/users/

Good
> http://api.test.com/users

## 1.2 '_' 대신 '-' 를 사용한다.
-를 사용하는 경우는 정확한 의미 전달이나 표현을 위해 단어 결합이 불가피한 경우에 사용한다.

Bad
> http://api.test.com/users/tmax_log

Good
> http://api.test.com/users/tmax-log

## 1.3 소문자를 사용한다.

Bad
> http://api.test.com/users/tmaxLog

Good
> http://api.test.com/users/tmax-log

## 1.4 행위는 URL에 포함하지 않는다.

Bad
> POST http://api.test.com/users/deleteLog

Good
> DELETE http://api.test.com/users/log

## 1.5 Control Resoruce의 경우 동사형태를 허용한다.

HTTP Method(GET, POST, PUT, PATCH, DELETE)로 표현되는 행위들인, 조회, 생성, 전체 수정, 단일 수정, 삭제 관련 행위 외에 다른 행위를 표현해야 하는 경우 동사 형태를 허용한다.

Bad
> http://api.test.com/posts/duplicating

Good
> http://api.test.com/posts/duplicate

## 1.6 Query String이 길어질 경우
Query String이 길어져도 data body를 사용하지 않는 것을 원칙으로 한다. 단, Query String 길이 제한 2,048 를 넘는 경우 body에 실어서 보낸다.


## 1.7 파일 확장자는 URI에 포함시키지 않는다.
파일 확장자는 URI에 포함하지 말아야한다. 대신에 Content-Type 이라는 헤더를 통해 전달되는대로 미디어 타입을 사용하여 body의 콘텐츠를 처리하는 방법을 결정한다.

Rest API클라이언트는 HTTP에서 제공하는 형식 선택 메커니즘인 Aceept 요청 헤더를 활용하도록 권장해야 한다.

Bad
> http://api.test.com/posts/paper.wrod

Good
> http://api.test.com/posts/paper

## 1.8 Query String 과 Path Parameter 구분

QueryString은 필터링을 위한 용도로 활용하는 것을 원칙으로 한다.

Bad
> http://api.test.com/students/gender

Good
> http://api.test.com/students?gender=male


PathParameter는 key를 통한 검색의 용도로 활용하는 것을 원칙으로 한다.

Bad
> http://api.test.com/students?id=1

Good
> http://api.test.com/students/1
 

---

# HTTP status code

## 2.1 HTTP status code 분류

     1xx: informational  Protocol 레벨의 정보를 제공한다.
     2xx: Success    Client의 요청을 성공적으로 받았다.
     3xx: Redirection    요청을 완료하기 위해서 Client가 추가적인 작업을 해야 한다.
     4xx: Client Error   Client 쪽의 실수를 나타낸다.
     5xx: Server Error   Server 쪽에서 error를 처리해줘야 한다.

여러 개의 response code를 사용하면 명시적이긴 하지만, 코드 관리가 어렵기 때문에 아래와 같이 몇가지 response code만을 사용한다.

## 2.2 2XX

  

-   200(OK): 서버가 요청을 제대로 처리했다는 뜻
-   201(Created): 새로운 리소스를 이용하여 컬렉션에 생성했거나 스토어에 추가했을 때 201 상태 코드로 응답한다. POST 시 거의 대부분 201 코드가 사용된다고 생각하면 된다.

-   202(Accepted): 서버가 요청을 접수했지만 아직 처리하지 않았다. 일반적으로 비동기에 이용된다.
-   203(Non-Authoritative Information): 응답은 클라이언트의 요청이 비동기적으로 처리될 것임을 나타낸다. 이 응답상태 코드는 유효한 요청이었지만, 최종적으로 처리되기 까지는 문제가 생길 수도 있다는 것을 클라이언트에게 알려준다. 보툥 202 응답은 처리 시간이 오래 걸리는 액션에 사용된다.

-   204(No Content): 상태 코드는 보통 PUT, POST, DELETE 요청에 대한 응답으로 이용하는데, REST API가 응답 메시지의 바디에 어떠한 상태 메시지나 표현을 포함해서 보내지 않을 때 사용한다. API는 GET 요청에 204로 응답할 수 있는데, 요청된 리소스는 존재하나 바디에 포함시킬 어떠한 상태 표현도 가지고 있지 않다는 것을 나타낸다.

## 2.3 3XX
- 301(“Moved Permanently”): 리소스를 이동시켰을 때 사용한다. REST API 리소스 모델이 상당 부분 재설계되었거나 계속 사용할 새로운 URI를 클라이언트가 요청한 리소스에 할당하였다는 것을 나타낸다. REST API는 응답의 Location 헤더에 새로운 URI를 기술해야 한다. 

- 303  (“See Other”) : 다른 URI를 참조하라고 알려줄 때 사용한다. 클라이언트가 요청한 리소스를 다른 URI에서 GET 요청을 통해 얻어야 할 때 사용하는 상태 코드. 303 상태 코드는 일반적으로  REST API가 클라이언트에 상태 다운로드를 강요하지 않으면서 참조 리소스를 보내는 것을 허용한다. 대신 클라이언트는 응답  Location 헤더에 있는 값으로  GET 요청을 보낼 수 있다.

- 307 (“Temporary Redirect”) : 클라이언트가 다른 URI로 요청을 다시 보내게 할 때 사용해야 한다. 307 응답은 REST API 가 클라이언트의 요청을 처리하지 않을 것임을 나타낸다. 클라이언트는 응답 메시지의 Location 헤더에 지정된 URI로 요청을 다시 보내야한다.  

  
## 2.4 4XX

- 400 (“Bad Request”) : 일반적인 요청 실패에 사용해야 한다. 기본적으로 다른 4xx 응답들과 매칭되는게 없는 REST API 고유의 에러 정보를 응답 바디에 포함하여 더 자세하게 에러 정보를 표시할 수 있다.  

- 401 (“Unauthorized”) : 클라이언트 인증에 문제가 있을 때 사용해야 한다. 401 오류 응답은 클라이언트가 적절한 인증 없이 보호된 리소스를 사용하려고 할 때 발생한다. 인증을 잘못하거나 아예 인증하지 못할 경우 발생한다.

- 402 (“Payment_required”) : 요금에 대한 오류 반환이다.

- 403 (“Forbidden”) : 인증 상태에 상관없이 액세스를 금지할 때 사용해야 한다.403 오류 응답은 클라이언트의 요청은 정상이지만, REST API가 요청에 응하지 않는 경우를 나타낸다. 즉  403 응답은 인증에 문제가 있어서가 아니다. 만약 인증에 문제가 있다면  401를 사용해라. REST API에서 어플리케이션 수준의 접근 권한을 적용하고자 할 때  403을 사용한다. 예를 들어 클라이언트는  REST API 리소스의 전체가 아니라 일부에 대한 접근만 허가된 경우가 있다. 클라이언트가 허용된 범위 외의 리소스에 접근하려고 할 때  REST API는  403으로 응답해야 한다.

- 404 (“Not Found”) : 요청  URI에 해당하는 리소스가 없을 때 사용한다.

- 405 (“Method Not Allowed”) : HTTP 메서드가 지원되지 않을 때 사용해야 한다.클라이언트가 허용되지 않는  HTTP 메서드를 사용하려 할 때, API는  405 오류 응답을 한다. 읽기 전용 리소스는  GET 메소드와  HEAD 메서드만 지원하며, 컨트롤러 리소스는  PUT 메서드와  DELETE메서드를 제외한  GET 메서드와  POST 메서드만 허용할 것이다.

- 406 (“Not Acceptable”) : 요청된 리소스 미디어 타입을 제공하지 못 할 때 사용해야 한다. 406 오류 응답은 클라이언트의  Accept 요청 헤더에 있는 미디어 타입중 해당하는 것을 만들지 못할 때 발생한다. 예를 들어, API가  json(application/json) 데이터 포맷만 지원한다면  xml(application/xml) 포맷 데이터를 요청한 클라이언트는  406 응답을 받는다.

- 409 (“Conflict”) : 리소스 상태에 위반되는 행위를 했을 때 사용해야 한다. 예를 들어 사용자의 게시물이 존재하는 경우 사용자를 삭제할 수 없다는 비지니스 로직에 이용된다.

- 410 (“Gone”) : 존재 하지 않는 리소스에 대한 삭제 요청 시 사용해야 한다.  

 - 412 (“Precondition Failed”) : 조건부 연산을 지원할 때 사용한다. 412 오류 응답은 특정한 조건이 만족될 때만 요청이 수행되도록  REST API로 알려준다. 클라이언트가 요청 헤더에 하나 이상의 전제 조건(If-Match , If-None_match 등)을 지정할 경우 발생하며, 이러한 조건이 만족되지 않으면  412응답은 요청을 수행하는 대신에 이 상태 코드를 보낸다.
 
- 413 (“Request_entity_too_large”) : 413 오류 응답은 요청의 크기가 너무 클 때 사용한다.  

- 415 (“Unsupported Media Type”) : 요청의 페이로드에 있는 미디어 타입이 처리되지 못했을 때 사용해야 한다. 415 오류 응답은 요청 헤더의  Content-Type에 기술한 클라이언트가 제공한 미디어 타입을 처리하지 못할 때 발생한다. 예를 들어  API 가  json(application/json)으로 포맷된 데이터만 처리할 수 있을 때, 클라이언트가  xml(application/xml)로 포맷된 데이터로 요청하면  415응답을 받는다.

- 416 (“Requested Range Not Satisfiable”)  : 요청이 만족될 수 없는 범위를 지정할 때 사용한다.
   
- 429 (“Too Many Requests”) : 너무 많은 요청이 같은 시간에 발생 했을 경우 사용한다.  
  
## 2.5 5XX

#### API를 사용하는 클라이언트에게 `5XX` 상태 코드는 나타내지 말아야 한다!  
  
- 500 (“Internal Server Error”) : API가 잘못 작동할 때 사용해야 한다. 500 오류 응답은 일반적인  REST API오류 응답이다. 웹 프레임워크는 대부분 예외 사항을 발생시키는 요청 핸들러 코드가 실행 될 경우 자동적으로 이 응답 코드를 발생시킨다. 500 오류는 클라이언트의 잘못으로 발생한 것이 아니기 때문에 클라이언트가 이 응답을 발생시킨 것과 동일한 요청을 다시 시도하면 다른 응답을 받을 수도 있다.

- 501 (“Not Implemented”) : REST API 가 아직 구현되지 않았을 때 이 응답을 사용한다. 설계에서부터 없던 API가 아닌 지원할 것이지만 아직 구현하지 않았을 때 사용한다.  
  
- 503 (“Service Unavailable”) : RESTFUL 서버가 점검중이거나 장애발생시 서비스에 연결 되지 않을 때 사용한다.

# HTTP Method

## 3.1 GET, POST, DELETE, PUT, HEAD
#### GET, POST, DELETE, PUT, HEAD 를 사용하는 것을 원칙으로 한다.

| Method | 특징 | 
|---|---|
|GET| 요청하는 내용이 URL에 노출되는 형태로 요청을 보내고 응답을 받는 형태로 검색 등에 사용한다.|
|POST|Request body 내용에 데이터를 담아 전송하는데 사용하며, 생성이나 수정 용도로 사용된다.|
|PUT|POST 방식과 유사하게 데이터를 전송하는 용도이지만, Update의 성격이 더 강하다.|
|DELETE|요청하는 대상에 대해 삭제하도록 하는 메소드|
|HEAD|GET과 유사하지만, Response로 BODY를 반환하지 않고, 응답 코드만 있다. 서버 헬스 체크와 같은 응답 내용이 필요 없이 정상 호출 여부를 확인할 때 사용한다.|


# Response 형식

## 4.1 code, message, data

Response의 형태는 아래와 같이 통일한다.
   
```
{ 
	"success": true,
	"data": {
		"tmax":{}
		"somethings":[{},{}]
	}
}
{ 
	"success": false,
	"error": {
		"code": "E1101",
		"message": "login fail"
	}
}
