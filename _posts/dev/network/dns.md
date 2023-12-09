1. 직접 'mj950425.github.io'를 브라우저에 입력했을 때:
   브라우저 요청: 사용자가 브라우저에 'mj950425.github.io'를 입력하고 엔터를 누릅니다.
   DNS 조회: 브라우저는 DNS 시스템을 통해 'mj950425.github.io'의 IP 주소를 찾습니다.
   서버 요청: 찾은 IP 주소로 HTTP 요청을 보냅니다. 이 요청의 'Host' 헤더에는 'mj950425.github.io'가 포함됩니다.
   GitHub Pages 처리: GitHub Pages는 'Host' 헤더를 확인하고, 'mj950425.github.io'에 해당하는 컨텐츠를 반환합니다.
   브라우저에서 컨텐츠 표시: 브라우저는 받은 컨텐츠를 사용자에게 보여줍니다.
2. 'www.minj-blog.com'을 CNAME으로 'mj950425.github.io'에 매핑했을 때:
   브라우저 요청: 사용자가 브라우저에 'www.minj-blog.com'을 입력하고 엔터를 누릅니다.
   DNS 조회: 브라우저는 DNS 시스템을 통해 'www.minj-blog.com'의 IP 주소를 찾습니다. DNS 시스템은 'www.minj-blog.com'이 'mj950425.github.io'로 매핑되어 있음을 알려줍니다.
   다시 DNS 조회: 브라우저는 'mj950425.github.io'의 IP 주소를 찾기 위해 다시 DNS 조회를 합니다.
   서버 요청: 찾은 IP 주소로 HTTP 요청을 보냅니다. 이 요청의 'Host' 헤더에는 여전히 'www.minj-blog.com'이 포함됩니다.
   GitHub Pages 처리: GitHub Pages는 'Host' 헤더를 확인합니다. 여기서 'www.minj-blog.com'을 사용자 지정 도메인으로 설정해 두었다면, 해당 도메인에 매핑된 컨텐츠를 반환합니다. 설정되지 않았다면, 오류 페이지나 기본 페이지를 반환할 수 있습니다.
   브라우저에서 컨텐츠 표시: 브라우저는 받은 컨텐츠를 사용자에게 보여줍니다.
   이 두 상황의 주요 차이점은 'Host' 헤더의 값입니다. 첫 번째 상황에서는 'mj950425.github.io'가, 두 번째 상황에서는 'www.minj-blog.com'이 'Host' 헤더에 포함되어 GitHub Pages 서버에 전달됩니다. GitHub Pages는 이 'Host' 헤더 값을 기반으로 어떤 사이트의 컨텐츠를 제공할지 결정합니다. 따라서 CNAME 레코드로 매핑을 설정하는 것뿐만 아니라 GitHub Pages 설정에서도 'www.minj-blog.com'을 등록해야 합니다.