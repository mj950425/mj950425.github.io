---
layout: post
title: "T&A 3.0 프로젝트 설계 및 구축"
date: 2024-01-08 08:46:00 +0900
categories:
  - dev
  - project
description: >
  '투어&티켓 전체 리뉴얼 프로젝트'
---

# T&A 3.0 프로젝트 설계 및 구축

![그림1](/assets/img/experience/project-review/tna3-project/img_8.png)

T&A 3.0 프로젝트 설계 및 구축에 대한 정리 글입니다.

# 개요

제가 재직중인 회사의 주요 사업 모델은 투어와 티켓인데요. 바로 투어와 티켓이 제가 속해있는 팀입니다.

해당 시스템은 루비로 만들어져있습니다.

2023년도 9월부터 지금까지 코틀린으로 시스템을 전면 개편하는 프로젝트를 진행하고 있습니다.

주도적으로 프로젝트의 아키텍처를 구상과 인프라를 셋팅하는 업무를 맡았고, 그 과정에서 다양한 경험을 할 수 있었습니다.

그리고 코드 레벨의 아키텍처 구상에 대한 내용을 기록하고자 합니다.

# 기존의 구조

T&A 3.0 프로젝트의 도메인은 크게 캘린더, 상품, 옵션, 재고, 예약으로 나누어집니다.

다양한 도메인을 다루고있고, 프로젝트의 규모가 크다고 느껴 단일 레포가 아닌 시스템을 분리하는것으로 팀 내에서 의견을 냈었는데요.

일전에 해당 과정을 [여기](https://mj950425.github.io/experience/project/tna3-system-seperate/)에 기록한 적 있습니다.

시스템 분리에 대한 제 의견은 **여행자와 백오피스 파트** 로 분리하자 였습니다.

이에 대한 근거는 아래와 같았습니다.

1. DDD 관점에서 여행자에서 사용하는 상품이나 옵션이 백오피스에서 사용하는 상품이나 옵션과는 다른 도메인이다.
2. CQRS 관점에서 여행자에서 사용하는 기능은 대부분 쿼리 기능이며, 백오피스에서는 대부분 커맨드 기능이다.
3. 여행자와 백오피스로 서버가 분리되는것은 회사의 요구사항인데, 서버에 따라 레포가 분리되는게 맞다.

초기에 이를 기반으로 구축한 멀티모듈 프로젝트의 구조는 아래와 같았습니다.

![그림1](/assets/img/experience/project-review/tna3-project/img.png)

하지만 개발을 진행하면서 레포지토리를 분리하는것이 오버 엔지니어링이라는 판단했고, 단일 레포지토리로 변경하는 의사결정이 이뤄졌습니다.

이후에 저는 다시 프로젝트 구조를 설계했습니다.

# 변경된 단일 레포지토리 구조

사실 각 모듈의 역할과 의존 방향은 크게 달라지지 않았습니다.

다만 도메인, 코어, 인프라를 공유하는 단일 레포지토리에 api, application의 모듈만 분리했습니다.

그림으로 보면 아래와 같습니다.

![그림1](/assets/img/experience/project-review/tna3-project/img_1.png)

실제로는 아래 사진처럼 buildSrc와 jar 형태로 제공하기위한 client-admin, client-traveler 모듈이 추가로 존재합니다.

![그림1](/assets/img/experience/project-review/tna3-project/img_2.png)

# 각 모듈의 책임

각 모듈들의 책임에 대해서 자세하게 알아보겠습니다.

## api 모듈

먼저 api 모듈은 표현 계층입니다.

![그림1](/assets/img/experience/project-review/tna3-project/img_3.png)

컨트롤러, 인터셉터, 리졸버 등등이 존재하며 클라이언트와 통신하는 창구 역할을 맡습니다.

가장 바깥 패키지는 도메인을 기준으로 분리했습니다.

도메인 안쪽에는 controller, dto, mock으로 나뉩니다.

그리고 dto안에는 extensions, request, response로 나뉩니다.

여기에는 몇가지 새로운 시도가 존재합니다.

제가 입사하고 운영을 담당했던 다른 프로젝트에서 비지니스 로직이 DTO와 도메인 여기저기에 흩어져있어서 개인적으로 어려움이 있었는데요.

이번 프로젝트에서는 각 모듈들의 dto는 로직을 담고있지 않으며, 정말 단순히 데이터만 갖고 있도록 규칙을 정했습니다.

하지만 레이어를 옮기면서 DTO 끼리의 단순한 매핑 코드는 필요한데요. 이것을 extensions으로 분리했고 DTO 클래스에는 정말 단순 데이터를 보관하는 코드만 남게 되었습니다.

또한 inner 클래스를 활용해서 하나의 클래스파일에 api에 필요한 여러 dto들을 아래처럼 몰아 넣으면서 생산성을 높였습니다.

```
data class A(
    ...
) {
    data class B(
        ...
    ) {
        data class C(
            ...
        )
    }
}
```

네이밍은 요청은 request를 postfix로, 응답은 response를 postfix로 붙여줬습니다. 예를 들어서 CreateProductRequest, GetProductResponse와 같습니다.

## application 모듈

application 모듈은 응용 계층입니다. api 모듈로부터 받은 요청을 domain 모듈에게 전달하거나 다른 도메인과 통신할 수 있게 흐름을 제어하는 역할을 맡습니다.

![그림1](/assets/img/experience/project-review/tna3-project/img_4.png)

application도 가장 바깥 패키지는 도메인을 기준으로 나누었습니다.

api와 비슷하게 dto는 단순히 데이터를 보관하는 코드만 가지고 있으며, dto간에 단순하게 매핑하는 코드는 extensions로 분리했습니다.

네이밍 규칙은 트랜잭션 요청은 command로 쿼리 요청은 query로 postfix를 붙였습니다. 예를 들어서 CreateProductCommand, FindProductQuery와 같습니다.

그리고 반환하는 값은 result로 통일했습니다. 예를 들어서 FindProductResult와 같습니다.

응용 계층은 아래와 같이 a, b, c 도메인에 대한 통신 흐름을 관리하는 역할을 맡습니다.

```
@Service
@Transactional
class A(
    val a: A,
    val b: B,
    val c: C,
) {
    fun create(command: UpdateStocksCommand) {
        a...
        b...
        c...
    }
```

또한 같은 프로젝트의 다른 도메인에게 기능을 제공해야하는 경우가 있습니다.

이런 경우는 구현체가 하나여도 인터페이스를 만들어서 다른 도메인이 쓸 수 있도록 제공해줍니다. 

이렇게하면 타 도메인의 개발자가 해당 서비스가 어떤 스펙으로 동작하는지 더 쉽게 확인할 수 있습니다.

## domain 모듈

domain 모듈은 핵심 비지니스 로직들을 담고 있습니다.

![그림1](/assets/img/experience/project-review/tna3-project/img_5.png)

도메인도 가장 바깥 패키지는 도메인 기준으로 분리했습니다.

이전 프로젝트에서는 domain을 순수한 자바 클래스로 만들었는데, entity를 domain으로 매핑해줘야하는 의미 없는 코드가 다수 생겨나야했고, 레이지 로딩에 대한 컨트롤이 어려웠습니다.

예를 들어서 db에서 a entity를 로딩하고, a domain으로 데이터를 매핑하는데, b와 연관관계가 맺어져있다면 b를 같이 domain으로 매핑하는 코드가 필요합니다.

또한 레이지 로딩을 사용하는 api를 위해서 a entity만 로딩하고 b entity는 매핑하지 않는 코드를 각각 만들어야했습니다.

물론 domain을 POJO로 만들면, 기획자도 이해할 수 있는 깔끔한 비지니스 코드가 만들어지며, 외부 기술로부터 자유로워질 수 있다는 장점이 있습니다.

하지만 실무에서 JPA를 사용하다가 기술 스택을 변경하는 경우는 거의 없습니다.

또한 JPA가 런타임에 interface를 repository 구현체로 변경해주기 때문에 사실상 IOC를 활용한 DIP가 이뤄지고 있다고 보는게 맞습니다.

그리고 엔티티와 관련된 대부분의 기능을 어노테이션으로 지원하고 있기 때문에, 만약에 JPA를 버리고 다른 기술로 변경이 필요하다면 어노테이션을 제거하고 repository에 대한 구현체만 변경해주면 됩니다.

그래서 JPA entity를 도메인으로 사용하는것이 개발 생산성을 높일 수 있고 구조상에 큰 문제가 없다고 판단했습니다.

여러 모듈에서 데이터베이스에 대한 접근이 가능하면 어디에서 데이터 변경이 이루어졌는지 추적이 어렵기 때문에, 도메인 모듈만이 JPA에 대한 의존성을 가지게 데이터베이스에 대한 접근이 가능하도록 설계했습니다.

추가로 interface만으로는 repository로 사용하기 어려운 queryDSL이나 jsonString을 List<String> 타입으로 로딩시에 컨버팅해주는 JPA 컨버터는 도메인으로 보기가 애매합니다.

이러한 클래스들은 도메인 모듈 하위에 infra라는 패키지를 만들어서 보관했습니다.

해당 계층에서 <span style="color:red">주의해야할점</span>은 아래와 같습니다.

* 같은 도메인의 코드는 데이터 일관성을 지켜주기 위해서 최대한 같은 도메인 로직 안에 녹여낸다. 

상품도메인에서 상품의 상태를 변경하는 서비스를 가정해보면, 상품 응용 계층에서 상품 도메인 계층에게 상품 정보를 받아오도록 지시하고, 다시 상품 응용 계층에서 상품 정보를 바탕으로 상품의 상태를 변경해달라고 상품 도메인 계층에 요청할 수 있습니다. 

하지만 이러한 흐름은 안티패턴으로 판단했고, 도메인 계층안에서 상품을 찾고 상태를 변경하는 로직들이 전부 캡슐화되어 데이터 일관성을 지켜주도록 규칙을 정했습니다.

![그림1](/assets/img/experience/project-review/tna3-project/img_6.png)

그리고 가장 바깥에 있는 infra 패키지는 각 도메인이 공통으로 사용하는 infra 기능을 담아뒀습니다.

엔티티는 최대한 양방향 매핑이 없이 단방향으로 설게했으며 라이프 사이클이 다르거나 애그리거트를 벗어난 단위에서는 무조건 객체 참조를 끊어뒀습니다.

비지니스 로직은 최대한 도메인 모듈의 서비스 안에서 동작하도록 설계하면서 애그리거트 단위로 데이터 일관성을 최대한 지켜줍니다.

다만 다른 도메인의 데이터가 필요하면 응용계층으로부터 받아옵니다.

## core

코어 모듈은 domain이나 application이 사용할 외부 기술에 대한 interface나 전체 프로젝트에서 사용하는 enum과 util클래스를 담고 있습니다.

![그림1](/assets/img/experience/project-review/tna3-project/img_7.png)

클린 아키텍처 구조에서 가장 안쪽에 존재하므로 core라는 이름을 붙여줬습니다.

adpater가 외부 기술과 이어주는 interface를 의미합니다. 옛날에 읽었던 핵사고날 구조관련 서적에서 adpater라는 이름을 사용하는것을 보고 차용해봤습니다.

예를 들어서 재고를 차감시에 이벤트를 발행해줘야하는 비지니스 로직이 있습니다.

해당 모듈의 핵심은 domain과 application에서 외부 기술을 사용하기 위한 인터페이스를 제공해주는것 입니다.

예를 들어서 재고 도메인에서 재고량의 변화에 따른 이벤트를 발행해야한다면 재고 도메인에서는 코어에 있는 stockPublisher 인터페이스에 재고량 변화 이벤트 발행을 요청합니다.

그러면 런타임에 infra에 있는 stockPublisherImpl이 실제 메세지를 발행해줍니다.

결과적으로 도메인은 이벤트 발행 기술이 카프카인지, 레빗엠큐인지 몰라도 됩니다.

core 모듈에서 <span style="color:red">주의해야할점</span>으로는 아래와 같습니다.
* 이넘이 모든 모듈에서 참조하는 코어에 있다보니, 각종 로직들을 전부 넣고싶은 욕심이 생깁니다. 
  * 예를 들어서 레이어드 아키텍처의 DTO 매핑 과정이 귀찮아서 core에 DTO를 만들고 모든 레이어에서 해당 DTO를 주고 받을 수 있습니다. 이 또한 안티패턴으로 규정지었습니다.
  * 또한 enum이 모든 레이어를 돌아다닐 수 있다보니, enum에서 다루는 데이터에 해당하지 않는 수많은 로직이 들어갈 수 있게 되는데, 이것도 안티패턴으로 바라봤습니다.
  * 이넘 자신의 데이터가 아니라 다른 데이터를 참조하는 일은 최대한 지양해야합니다. 이넘값은 데이터의 타입 같은 성격이지 객체가 아니기 때문입니다.

## infra 모듈
infra 모듈은 core 모듈에서 선언한 인터페이스에 대한 구현체들이 담겨 있습니다.

예를 들어서 카프카에 대한 프로듀서나 컨수머 또는 레디스나 외부 서버로 요청을 보내는 클라이언트 등등 이 존재합니다.

infra 모듈에서 <span style="color:red">주의해야할점</span>으로는 아래와 같습니다.
* 고수준 모듈은 저수준 모듈의 구현에 의존해서는 안된다. (여기에서 고수준 모듈은 core 모듈과 도메인 모듈 그리고 응용 모듈을 의미하며, 저수준 모듈은 infra 모듈을 의미합니다)

# 의존성 설정
기본적으로 의존성 관리 도구로 gradle을 사용했는데요. 

각 모듈간의 참조를 api로 설정하면 사실상 레이어드 아키택처나 클린 아키텍처와는 거리가 멀어집니다.

레이어드 아키택처란 바로 아래 레이어에만 의존해야하는데, 그 밑에까지 의존하게 되면서 자유로운 접근이 가능해지기 때문이죠.

예를 들어서 A가 B를 참조하고 B가 C를 참조하면 A도 C를 참조할 수 있게 되면서, 계층이라는 개념이 허물어집니다.

또한 api로 설정하면 gradle 빌드시에 A모듈도 C모듈에 대한 의존성을 가져오고 B모듈도 C모듈에 대한 의존성을 가져오게됩니다. 결국 로컬에서 gradle 빌드하는 시간이 매우 오래걸립니다. 

이는 개발 생산성을 크게 저하시킵니다. 그렇기 때문에 의존성은 모두 implementation 으로 작성했습니다.

implementation으로 작성해도 서브 모듈(main 함수가 들어있는 모듈)을 bootJar를 만들 때는 모든 서브 모듈이 참조하는 모듈의 의존성도 같이 가져오게 됩니다.

따라서 서브 모듈 기준으로 jar 만들 때, jar로 같이 패키징이 안되는 경우는 발생하지 않습니다. 

# 인터페이스
너무 무분별한 인터페이스는 개발 생산성을 떨어트립니다. 

클래스 내부 구현을 보기 위해서 한번더 커맨드 + B를 눌러야하는것은 별거 아닌것 처럼 보일 수 있습니다. 

하지만 이러한 작업이 n년동안 여러 개발자들에 의해서 이뤄져야한다면 이는 꽤 큰 개발 생산성 저하를 야기한다고 생각합니다.

그래서 두가지 상황에서만 인터페이스를 사용하기로 했습니다.

* IOC를 활용한 모듈 사이의 의존성 역전이나, 디자인 패턴을 활용하기 위한 의존성 역전에서 인터페이스를 사용한다.
* 같은 프로세스의 내부 도메인간의 요청을 응용 계층에서 주고받을때 스펙만을 추상화해서 드러내기 위해 인터페이스를 사용한다.

# 그 외

http를 통해서 기본적으로 각 api를 만들었고, flyway는 로컬에서만 동작하도록 설정했습니다.

로컬이 아니라 다른 프로파일에서도 설정을 킨다면, 로컬에서 다른 환경으로 앱을 부팅시키면서 다른 환경의 디비에 문제가 발생할 수 있습니다.

또한 다른 서버에 제공해주는 응답값에는 이넘값을 전부 스트링 타입으로 제공해줬습니다. 그 이유는 이넘값이 변경했을 때, 수많은 내 jar를 사용하는 서버들이 reponse에서 엉뚱한 값을 받게될 수 있습니다.

이 경우에 시스템에서 팅겨내는것이기 떄문에 디버깅이 어렵습니다.

이러한 이유로 전부 jar로 제공하는 파일은 enum을 전부 제거했습니다.
