---
layout: post
title: "투어&티켓 전체 리뉴얼 프로젝트 회고"
date: 2024-09-01 08:46:00 +0900
categories:
  - dev
  - project
description: >
  '투어&티켓 전체 리뉴얼 프로젝트'
---

# 투어&티켓 전체 리뉴얼 프로젝트
![그림1](/assets/img/experience/project-review/tna3-project/img_8.png)
<br/>

작년 하반기부터 올해 상반기까지, 기존 루비 기반의 시스템을 코틀린으로 전환하는 T&A 3.0 프로젝트를 진행했습니다. 

이번 회고에서는 그 과정에서 느꼈던 경험과 배운 점을 기록하고자 합니다.

# 프로젝트 개요

저는 투어&티켓 개발팀에서 일하고 있으며, 해당 팀은 회사 내 가장 큰 영업 이익을 창출하는 중요한 부서입니다.

시스템은 10년 전 루비로 개발되어 운영되었으나, 시간이 지나면서 다양한 요구사항을 수용하지 못하고, 레거시 코드로 인해 불안정한 부분이 많아졌습니다.

결국 코틀린을 활용해 시스템을 재구축하는 T&A 3.0 프로젝트를 시작했습니다.

프로젝트는 2023년 10월에 시작해, 2024년 5월 정식 오픈에 성공했습니다. 

현재는 안정화를 위해 지속적으로 운영 중입니다. 

저는 초기 설계부터 참여해 루비 개발자들과 함께 아키텍처 설계를 담당했고, 이후 재고와 상품 등의 다양한 도메인 개발을 맡았습니다. 

설계 과정에서 경험한 다양한 트레이드 오프들을 글로 기록합니다.

# 도메인 설계

도메인은 크게 캘린더, 상품, 옵션, 재고, 예약으로 구성되어 있으며, 파트너, 매니저, 여행자라는 바운디드 컨텍스트에 따라 설계되었습니다.

초반 설계시에 바운디드 컨택스트에 따라 파트너, 매니저, 여행자로 레포지토리를 분리하는 방식을 제안했습니다. 

하지만 팀 내에 중복 코드에 대한 우려가 있었고, 이에 따라 단일 레포에서 코드를 구성하게됐습니다.

그러나 여행자와 파트너, 매니저의 서버가 달라야한다는 기술적 요구사항은 존재했습니다.

파트너, 매니저 서버의 장애가 여행자 서버까지 장애가 전파되면 안되기 때문입니다.

이에 따라, 단일 레포로 관리하면서 호스팅 서버를 분리했습니다.

멀티 모듈 아키텍처를 채택했고, api, application, domain, infra 모듈로 나누어 관리했습니다.

# 모듈 및 패키지 구조
각 모듈은 기능에 따라 분리했으며, 가장 바깥 패키지는 도메인에 따라 분리했습니다.

도메인간의 로직이 뒤섞이는것을 방지하고, 나중에 도메인별로 코드를 쉽게 분리하기 위해서는, 도메인별로 모듈을 분리하는것이 올바른 의사결정일 수 있습니다.

하지만 팀 내에서는 레이어를 기준으로 모듈을 나누는것이 익숙한 상태였기 때문에 레이어를 기준으로 나누게 되었습니다.

- **api** 모듈은 실행 포인트를 담당하며, 여행자 서버와 파트너/매니저 서버를 분리하여 각각 독립적으로 운영되도록 했습니다.
- **application** 모듈은 응용 계층으로, 기술적 설정과 스레드풀 설정 등도 서버별로 분리하여 구현했습니다.
- **domain** 모듈은 핵심 비즈니스 로직을 담당하며, 여행자와 매니저/파트너가 공유할 수 있도록 공통 모듈로 관리했습니다.
- **infra** 모듈은 외부 서비스와의 직접적인 연결을 담당하는 구현체들이 포함된 모듈입니다.

# 프로젝트를 진행하면서 얻은 교훈들
프로젝트를 거치면서 얻은 여러가지 경험들을 정리해봤습니다.

## 소통의 방법
개인적으로 프로젝트를 진행하면서 소통하는 방법을 제일 크게 배웠습니다.

일단 기술적인 미팅에서는 대부분 정답이 없습니다.

왜냐하면 미팅을 진행할 정도의 아젠다라면 트레이드 오프 관계가 있기 때문이죠.

즉 정답은 없고, 각각의 아젠다에 장단점이 존재하는것인데요.

이러한 경우, 위키를 활용해서 글로 적는것이 매우 도움이 된다는 사실을 알았습니다.

이야기로 주고 받을 경우, 각 아젠다의 장점에만 집중하거나 단점에만 집중하는 경우가 자주 있습니다.

이렇게되면 우리가 비지니스 임팩트를 위해 현재 무엇을 해야하는지 까먹기 쉽더군요.

그래서 글로 각 아젠다의 트레이드 오프로 얻는것과 잃는것 그리고 임팩트를 내기 위한 나의 의견을 정리하는 습관을 길렀습니다.  

또한 사업부와의 소통에서는 문제의 근본에 접근하는 것이 중요합니다.

예를 들어서 특정 문제를 해결해는것을 요구했을때, 시스템 상에서 이를 받아줄 수 없는 경우가 자주 존재했습니다.

이 경우, 무조건 안된다라고 말하는것을 지양하며 문제의 근본에 접근해야합니다.

만약 정말로 어떻게해도 시스템에서 받아줄 수 없는 상황이라면, 문제의 근본에서부터 접근해서 다른 방법이 어떤것이 있을 수 있는지 제시해야합니다.

꼭 코드를 수정해서 해결하는 방법이 아니어도, 다른 해결 방법이 있는 경우가 실제로 매우 많았습니다.

## DDD 방법론은 코드 레벨의 아키텍처가 아니다.

최범균님의 "도메인 주도 개발 시작하기"를 스터디하면서 팀내에서도 DDD에 대한 관심은 항상 있었습니다. 

하지만 대부분의 관심은 전술적 설계에 집중되어있습니다.

DDD는 전술적 설계 뿐만 아니라, 이해관계자들간의 도메인 지식을 공유하는것이 더 값어치 있는 행위라는것을 알았습니다.

이러한 본질을 팀원분들과 계속해서 상기할 수 있도록 위키로 공유했던 기억이 납니다. 

- 에릭 에반스가 말하는 DDD 방법론에서 코드 레벨의 아키텍처는 핵심이 아니다. 
- 이러한 이유로 코드 레벨의 아키텍처를 micro ddd라고도 부르는 사람도 있다. 
- DDD의 본질은 도메인에 대한 이해관계자의 공통된 이해와 도메인 모델과 코드의 일치와 공통된 언어이다.

## 바운디드 컨택스트에 따라서 패키지를 나눈다.

프로젝트 초기에 바운디드 컨택스트에 따른 논리적 코드 분리 의견을 제시했었습니다.

하지만, 이 때에는 팀 내에서 중복 코드에 대한 우려가 컸고 저 또한 트레이드 오프에 대한 실질적 경험이 없어 자신감있게 말하지못했었는데요.

프로젝트 과정중에 장단점을 느끼게 되었고, 적당한 사이즈에서는 바운디드 컨택스트에 따른 논리적 코드 분리가 필요하다고 생각했습니다.

정리하면 아래와 같습니다.
- 매니저와 파트너가 다른 바운디드 컨택스트인데, 같은 도메인 모델로 묶으려고하니깐 분기 로직이 계속해서 늘어났다. 
- 하나의 모델이 변경의 이유가 여러개가된다. 단일 책임 원칙에 위배된다. 
- 데이터가 비슷하며 중복된 로직이 있는 모델이 생길 수 있지만, 개인적으로 이정도의 중복은 개발 생산성에 큰 영향이 없다고 생각한다.

## 도메인 패키지에는 뭐가 들어가야할까?

도메인 패키지에 어떤 값이 들어가야하는지 종종 헷갈립니다.

이 때, 도메인의 정의에 대해서 고민해보면 좋습니다.

도메인이란 일단 우리가 소프트웨어로 해결하고자 하는 주제 영역을 의미합니다.

- DDD에서 도메인은 불변식(정책)과 요구사항을 의미한다. 
- 상품 도메인이라면 당연하게 도메인 패키지안에 상품 엔티티, 상품 가격 값 객체, 상품 이름 값 객체, 상품 레포지토리 등등이 들어간다. 
- 헷갈리는 부분은 아래와 같다.
  - 예를 들어서 상품을 만드는데 비속어 검사를 해야한다라는 정책이 있다고 해본다.
  - 상품의 비속어 검사는 상품과는 관계가 없어 보인다.
  - 하지만 비속어가 들어가있는 상품은 등록될 수 없다는게 정책이므로, 상품의 비속어 검사 클라이언트(구현체 x)도 도메인에 들어가야한다.

## 레이어별로 잘게 쪼갠 모듈 구조의 단점 
사실 초기 설계시에는, 사내에서 대부분 사용하는 구조라는 이유로 큰 생각없이 멀티모듈 구조를 선택했었습니다.

하지만 개발을 진행할수록, 초반에 레이어별로 잘게 나눈 모듈들이 원망스러웠습니다. 

모듈별로 테스트 코드의 의존성 관리도 복잡해지고, 레이어를 옮겨갈수록 dto가 중복되어서 생성되므로 개발 생산성이 떨어진다는것을 알았기 때문이죠.

사실상 domain 레이어에서 클라이언트에게 필요한 dto를 만들어서 내리는 경우가 대부분이었는데, application, api 레이어를 옮겨가면서 dto를 두벌씩 만들어줬습니다.

여기에서 생성되는 버그도 많고, 개발 생산성도 매우 떨어졌습니다.

또한 어느정도 사이즈가 있는 프로젝트에서는 의존성의 방향을 강제할 수 있기 때문에 장점이 있습니다만, MSA에서의 작은 단위의 프로젝트에서는 큰 의미 없다고 생각이 들었습니다.

그리고 레이어별로 모듈을 나눈것이 DDD의 사상과 충돌이 발생하면서 오는 혼란스러움도 프로젝트 중간 중간에 느꼈습니다.

다시 프로젝트를 구성한다면 초기에는 단일 모듈로 프로젝트를 구성하거나, 도메인별로 모듈을 분리할 것 같습니다. 

## ACL 설계 패착
상품, 캘린더, 옵션 등 여러 도메인들이 존재하는데, 각각의 로직이 뒤섞이는게 바람직하지 않다고 생각했습니다.

그래서 "domain 모듈에서는 각자의 도메인 로직만 가져가고, 타 도메인의 데이터가 필요하면 application layer를 통해서 제공받자" 라고 팀 내에서 규칙을 정했는데요.

즉, application layer를 ACL(anti corruption layer)로 가져려고 했던것입니다.

이렇게 진행했더니 상품의 domain 로직 중간에서 옵션이 필요하다면 domain layer에서 application layer로 나갔다가 옵션의 데이터를 받아서 다시 상품 domain으로 들어가야합니다.

이러한 구조로 양산되는 보일러 플레이트가 존재했고, domain 로직에서 client를 호출하고, client에 대한 구현체를 주입해주는 acl을 별도로 만들어야한다는것을 깨달았습니다.

## 엔티티와 VO
해당 프로젝트에서는 VO의 활용이 거의 없었습니다.

엔티티를 하나씩 VO로 변경하는 리팩토링을 진행할 예정입니다.

## CQRS
CQRS의 장점은 도메인 로직(보통 업데이트)에서 단순 조회를 분리할 수 있다는 것과 더 높은 트래픽을 감당할 수 있다는 점입니다.

현재는 쿼리 로직이 전부 JPA로 구현되어있어서 쿼리가 비효율적으로 발생하는 경우가 많은데, 나중에 성능이 문제가 된다면 CQRS를 도입해볼 수 있을 것 같습니다. 

## Fake 객체를 활용한 테스트코드
mockk을 통해서 every{…}로 테스트코드를 작성하는것은 이미 내부 구현을 자세하게 들여다보는 화이트 박스 테스트에 해당합니다.

하지만 해당 테스트에서 내부 구현에 대한 과정을 감추는게 단위 테스트의 의의에 더 적합하다고 생각합니다.

## 비대한 상품 도메인 모델
이커머스에서 가장 핵심인 도메인은 상품입니다.

그러다보니깐 상품에 너무 많은 필드들이 달라붙게됩니다.

그러다보니 상품 테이블의 필드가 30개가 넘어가고 매우 비대해지는 현상이 발생합니다.

당연히 상품 수정의 원인이 여러가지가되며 단일 책임 원칙을 위배합니다.

또한 kotlin에서는 JPA에서 one to one 관계에서 lazy loading을 지원하지않는 이슈가 있는데요.
(이에 대한 포스팅은 [여기에서](https://mj950425.github.io/jvm-lang/project/dev/OneToOne-LazyLoading/) 확인이 가능합니다.)

상품 단일 객체에 붙어있는 지연 로딩의 일대일 관계만 10개가 넘다보니, 자칫하면 10번의 쿼리가 추가 발생할 수 있었습니다.

지금에서는 차라리 책임을 잘 분리해서 eager 로딩을 걸어두는게 더 좋은 설계였을 것 같다는 생각을 해봅니다.

안타깝게도 못 박힌 일정을 맞추기 위해서 달리는 기차를 리팩토링할 수는 없었습니다.

# 결론

![상반기 평가](/assets/img/experience/project-review/tna3-project/img_12.png)

모든 이해관계자가 매일 11시까지 근무하면서 성공적으로 서비스를 오픈할 수 있었습니다.

팀원 단 한명이라도 없었다면 불가능했을 정도로 일정이 타이트한 프로젝트였고 그 만큼 배운것도 많고 뿌듯함도 큰 프로젝트였습니다.

제가 개발자로써 길을 걸으면서 진행했던, 반년 이상의 기간을 가지는 첫 프로젝트이었는데요.

미래에 제가 해당 포스팅을 보면서 추억에 빠질 수 있었으면 좋겠네요 .