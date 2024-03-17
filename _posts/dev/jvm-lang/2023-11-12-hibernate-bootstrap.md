---
layout: post
title: "JPA EntityManagerFactory가 만들어지는 과정을 알아보자"
date: 2023-11-12 08:46:00 +0900
categories:
  - jvm-lang
---
# JPA EntityManagerFactory가 만들어지는 과정을 알아보자
![img.png](/assets/img/dev/jvm-lang/jpa-bootstrap/img.png)
<br>
이번 포스팅에서는 JPA의 EntityManagerFactory가 만들어지는 과정에 대해서 러프하게 적어봤습니다. 

JPA는 워낙 방대한 코드로 이루어져있어서 모든 코드들을 파악하는것은 상당히 어렵기 때문에, 감을 익히는 정도로 EntityManagerFacotry의 생성 흐름에 대해서 작성해봤습니다.

# EntityManagerFactory가 만들어지는 과정

먼저 스프링 빈의 순서는 컨테이너 _생성 -> 등록 -> 인스턴스화 -> 의존성 주입 -> 초기화 콜백 -> 빈 사용 -> 종료 콜백_ 으로 이뤄집니다.

빈 등록 과정에서 **JPABaseconfiguration** 클래스가 빈으로 등록되면서, **LocalContainerEntityManagerFactoryBean** 클래스를 같이 등록합니다.

![img.png](/assets/img/dev/jvm-lang/jpa-bootstrap/img_4.png)*JPABaseConfiguration 클래스입니다*

![img.png](/assets/img/dev/jvm-lang/jpa-bootstrap/img_7.png)*LocalContainerEntityManagerFactoryBean 클래스입니다*

그리고 **@Entity** 어노테이션이 붙은 패키지를 스캔하고 패키지 이름을 저장합니다.

![img.png](/assets/img/dev/jvm-lang/jpa-bootstrap/img_18.png)*@Entity 어노테이션 스캔 과정입니다*

스프링은 빈 초기화시점에서 아래 사진과 같이 **InitializingBean** 인터페이스를 구현한 클래스드들에 대해서 **afterPropertiesSet** 메소드를 호출하는데요.

이로 하여금, 개발자가 빈의 모든 의존성이 주입된 후에 필요한 추가적인 초기화 작업을 할 수 있습니다. 자세한 내용은 [이곳](https://dev-coco.tistory.com/170)을 확인면 알 수 있습니다.

![img.png](/assets/img/dev/jvm-lang/jpa-bootstrap/img_2.png)*afterPropertiesSet 메소드 호출 부분입니다*
<br>
JPA가 제공하는 **AbstractEntityManagerFactoryBean**가 afterProperties를 실행합니다.

![img.png](/assets/img/dev/jvm-lang/jpa-bootstrap/img_19.png)*AbstractEntityManagerFactoryBean의 afterProperties 호출 부분입니다*

보통 FactoryBean이 postfix로 붙은 클래스들은 빈이 초기화될때 생성을 도와주는 역할을 맡습니다. 

AbstractEntityManagerFactoryBean 클래스는 EntityManagerFactory를 만드는것을 도와줍니다.

아래 코드로 들어오면서 앞에서 빈을 등록할때 저장한 패키지 주소를 통해, 해당 주소 밑의 **@Entity** 어노테이션이 붙은 클래스를 찾습니다. 

그리고 각 엔티티의 경로를 **PersistenceUnitInfoManager**가 **PersistenceUnitInfo**에 저장합니다. 

PersistenceUnitInfo는 데이터베이스 연결 설정, 엔티티 클래스 목록, 매핑 파일 위치, 클래스 로더 설정 등의 데이터를 보관합니다. 이를 기반으로 메타데이터를 생성합니다.

![img.png](/assets/img/dev/jvm-lang/jpa-bootstrap/img_6.png)*PersistenceUnitInfo를 등록하는 부분입니다*

그 이후에, LocalContainerEntityManagerFacotryBean이 nativeEntityManagerFactory를 만들기 시작합니다. 

여기에서 native는 스프링이 아닌 JPA 자체 구현체를 의미합니다.
![img.png](/assets/img/dev/jvm-lang/jpa-bootstrap/img_11.png)

![img.png](/assets/img/dev/jvm-lang/jpa-bootstrap/img_9.png)*AbstractEntityManagerFactoryBean와 LocalContainerEntityManagerFacotryBean가 nativeEntityManagerFactory를 만드는 부분입니다*

그리고 이제 메타데이터를 만듭니다. 여기에서 메타데이터란 ORM에 필요한 엔티티의 데이터들을 따로 JPA가 관리하는 메타성 데이터를 의미합니다.

예를 들어서 테이블 이름이라던가 칼럼 이름이나 PK여부 등등.. 전부 메타데이터에 해당합니다.

이 때, **MetadataBuildingProcess** 메타데이터 수집 과정을 조율하는 주요 책임을 가지고, **InFlightMetadataCollectorImpl**는 수집중인 메타데이터를 관리하는 임시 저장소 역할을 합니다.

![img.png](/assets/img/dev/jvm-lang/jpa-bootstrap/img_10.png)*MetadataBuildingProcess와 InFlightMetadataCollectorImpl입니다*

그리고 여러 **Binder는** 직접적으로 엔티티 클래스 정보를 갖고 메타데이터에 매핑하는 역할을 맡습니다. 아래 사진보다도 더 다양한 바인더들이 존재합니다.

![img.png](/assets/img/dev/jvm-lang/jpa-bootstrap/img_13.png)
*엔티티 바인더*
![img.png](/assets/img/dev/jvm-lang/jpa-bootstrap/img_14.png)
<br>
*어노테이션 바인더*

다음으로는 이제 이벤트 리스너들을 등록합니다.

하이버네이트는 기본적으로 이벤트와 이벤트 리스너를 통해 동작합니다. 아래 사진과같이 인터페이스에 대한 메소드 참조를 넘겨주고, 메소드 참조를 실행하면 등록된 리스너들이 실행됩니다.

인터페이스에 대한 메소드 참조를 넘겨주면, 첫번째 인자가 수신자가되어 해당 메소드를 수행하게됩니다. 

![img.png](/assets/img/dev/jvm-lang/jpa-bootstrap/img_5.png)*이벤트를 호출하는 과정입니다*
<br>
![img.png](/assets/img/dev/jvm-lang/jpa-bootstrap/img_12.png)*이벤트들이 응답하는 과정입니다*

이렇게 사용될 리스너들을 보관하는곳이 **EventListenerGroup**이고 등록을 시작하는 클래스가 아래 **FastSessionServices** 클래스입니다. 

**FastSessionServcies**에서 **EventType**과 **eventListenerRegistry**를 활용해서 **EventGroup** 별로 적절한 리스너들을 등록합니다.
![img.png](/assets/img/dev/jvm-lang/jpa-bootstrap/img_20.png)*이벤트를 부팅시에 미리 등록화는 과정입니다*

이렇게하면 **EntityManagerFactory**가 빈으로 등록되고, 이를 EntityManager 프록시가 사용합니다.

트랜잭션이 시작하면 EntityManager 프록시 객체는 EntityManagerFacotry를 활용해서 EntityManager를 생성하고 스레드로컬에 저장합니다.

