---
layout: post
title: "실무에서 만난 JPA OneToOne관계의 N+1 이슈 해결"
date: 2024-04-06 08:46:00 +0900
categories:
  - jvm-lang
  - project
  - dev
comments: true
---

# 실무에서 만난 JPA OneToOne 관계의 N+1 이슈 해결

![img.png](/assets/img/dev/jvm-lang/onetoone-lazyloading/img_2.png)

# OneToOne관계의 N+1 이슈 상황

현재 상품 도메인을 개발하고있는데, OneToOne 관계의 테이블들이 지속적으로 늘어나게됩니다.

결과적으로 Product 엔티티와 엮여있는 OneToOne 관계의 엔티티가 12개나 되었습니다.

열심히 개발을 하다가, 어느날 쿼리가 정상적으로 나가는지 테스트해봤는데, 깜짝 놀랄만한 상황이 벌어집니다.

Product 하나만 조회했을뿐인데 product 뿐만 아니라 OneToOne 관계의 쿼리 12개가 추가되어, 총 13개의 쿼리가 날라가고 있었기 떄문입니다.

이 관계들은 모두 FetchType.LAZY로 설정되어 있지만, 실제로 Product를 조회할 때 지연 로딩이 동작하지 않았습니다.
<br>

이는 JPA가 OneToOne 관계에서 지연 로딩을 기본적으로 활성화하지 않기 때문이었습니다.
![img.png](/assets/img/dev/jvm-lang/onetoone-lazyloading/img.png)

# 해결 방법

지연로딩이 동작하지않는 이슈를 해결하기 위해 고민한 방법은 크게 아래와 같습니다.

1. 연관관계의 주인을 변경
2. 객체 참조 분리
3. lazyToOne 어노테이션을 활용하고 추가적인 gradle plugin을 통해서 바이트 코드를 조작
4. OneToOne 관계를 OneToMany로 변경

결과적으로 저희는 OneToOne관계를 OneToMany로 변경하는 방법을 사용했습니다.

하나씩 어떤 장단점들이 있는지 알아보겠습니다.

## 1. 연관관계의 주인을 변경

연관관계의 주인을 변경함으로써 포링키 위치를 바꿔줍니다.

그러면 포링키의 존재 여부에 따라 연관 엔티티 존재여부를 알 수 있기 떄문에 지연 로딩이 가능합니다.

데이터베이스에 대한 변화가 있지만, 코드 레벨에서는 가장 깔끔한 해결책이 될 수 있습니다.

그리고 포링키가 부모 테이블에 있는게 어색할 수 있는데, 사실 OneToMany로 비지니스가 변경될 여지가 있는게 아니라면 크게 문제될것은 없습니다.

상품을 통해서 상품 소개에 접근할때와, 상품 소개를 통해서 상품에 접근하는 경우의 쿼리 발생횟수를 비교해봅니다.

```kotlin
@SpringBootTest
class OneToOneTest(
    @Autowired
    val entityManager: EntityManager
) {
    @BeforeEach
    fun setUp() {
        val introduction = ProductIntroduction(
            content = "테스트합니다1"
        )
        val product = Product(
            name = "테스트상품1",
            introduction = introduction
        )
        entityManager.persist(introduction)
        entityManager.persist(product)
        entityManager.flush()
        entityManager.clear()
    }

    @Test
    @Transactional
    fun `연관관계 주인을 통해 조회한다`() {
        println("=-=-=-=연관관계 주인을 통해 조회한다 시작선=-=-=-=")
        val introduction = entityManager.find(ProductIntroduction::class.java, 1L)
        println("=-=-=-=연관관계 주인을 통해 조회한다 종료선=-=-=-=")
    }

    @Test
    @Transactional
    fun `연관관계 비주인을 통해 조회한다`() {
        println("=-=-=-=연관관계 비주인을 통해 조회한다 시작선=-=-=-=")
        val introduction = entityManager.find(Product::class.java, 1L)
        println("=-=-=-=연관관계 비주인을 통해 조회한다 종료선=-=-=-=")
    }
}
```

상품소개를 통해서 상품을 조회할때, 즉 연관관계의 주인을 조회할때는 지연로딩이 적절하게 동작하고 select 쿼리가 한번만 나가는것을 확인할 수 있습니다.

반면에 연관관계의 주인이 아닌 엔티티를 조회하면 지연로딩이 동작하지않으면서 select 쿼리가 2번이 호출되는것을 확인할 수 있습니다.

```
=-=-=-=연관관계 주인을 통해 조회한다 시작선=-=-=-=
Hibernate: 
    select
        productint0_.id as id1_0_0_,
        productint0_.content as content2_0_0_,
        productint0_.product_id as product_3_0_0_ 
    from
        product_introductions productint0_ 
    where
        productint0_.id=?
=-=-=-=연관관계 주인을 통해 조회한다 종료선=-=-=-=
```

```
=-=-=-=연관관계 비주인을 통해 조회한다 시작선=-=-=-=
Hibernate: 
    select
        product0_.id as id1_1_0_,
        product0_.name as name2_1_0_ 
    from
        products product0_ 
    where
        product0_.id=?
Hibernate: 
    select
        productint0_.id as id1_0_0_,
        productint0_.content as content2_0_0_,
        productint0_.product_id as product_3_0_0_ 
    from
        product_introductions productint0_ 
    where
        productint0_.product_id=?
=-=-=-=연관관계 비주인을 통해 조회한다 종료선=-=-=-=
```

## 2. 객체 참조의 분리

필요한 데이터는 eager loading을 통해서 라이프사이클을 상품과 동일하게 맞춰주고, 그렇지 않다면 객체 참조를 분리하는것을 고민했습니다.

객체 참조 분리에 대한 기준은 아래와 같이 정했습니다.

1. 상품의 핵심 정보
2. 성능과 요구 사항을 고려한 결정

### 상품의 핵심 정보

객체지향 관점에서 상품의 핵심 정보를 중심으로 연관관계를 설정하는 것이 합리적인 접근 방법이라 생각 했습니다.

상품의 핵심 정보를 기준으로 비즈니스의 발전가 발전할텐데, 연관관계를 연결해두어야 객체지향의 장점을 살릴 수 있다고 생각했습니다.

### 성능과 요구 사항을 고려한 결정

실제로 조회와 수정 작업에서 완벽하게 라이프사이클이 일치하는 경우는 없습니다. 하지만, 라이프사이클이 대체로 비슷한 엔티티들은 같은 애그리거트로 묶어서 관리하는 것이 성능 최적화에 유리하다고 생각했습니다.

## 3. azyToOne 어노테이션을 활용하고 추가적인 gradle plugin을 통해서 바이트 코드를 조작

JPA 표준 스펙은 아니지만, 하이버네이트가 바이트 코드를 조작해서 엔티티를 강화할 수 있게 지원해줍니다.

Proxy 기반으로 지연로딩을 동작시키는게 아니라, 필드 기반으로 지연 로딩을 걸 수 있습니다.

아래와 같이 build.gradle을 만듭니다.

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.2.4'
    id 'io.spring.dependency-management' version '1.1.4'
    id 'org.hibernate.orm' version '6.1.4.Final'
}

hibernate{
    enhancement {
        lazyInitialization(true)
    }
}

group = 'org.example'
version = '0.0.1-SNAPSHOT'

java {
    sourceCompatibility = '17'
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'com.mysql:mysql-connector-j'
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    testAnnotationProcessor 'org.projectlombok:lombok'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    annotationProcessor 'org.springframework.boot:spring-boot-configuration-processor'
}

tasks.named('test') {
    useJUnitPlatform()
}

```

바이트 코드를 확인하면 아래처럼 엔티티가 강화된것을 볼 수 있습니다.

![img.png](/assets/img/dev/jvm-lang/onetoone-lazyloading/img_3.png)

하지만 이 방법은 코틀린에서 지원되지않습니다. 코틀린와 자바의 코드를 컴파일하는 방식의 차이에서 어려움이 존재하다고 합니다.
(https://hibernate.atlassian.net/browse/HHH-15314 를 참고)

## 4. OneToOne 관계를 OneToMany로 변경

먼저, 데이터베이스 변경에 대한 내부적인 제약으로 인해 외래 키 위치 변경은 실행할 수 없었습니다.

또한, Kotlin에서 바이트 코드 조작을 통한 엔티티 강화 지원이 되지 않는 문제가 있었습니다.

연관관계를 해제하는 것은 해당 시점에서 공수가 매우 컸습니다.

결국 관계를 OneToMany로 변경하고 첫번째 원소를 가져오도록 만들었습니다.

# 결론
앞으로 OneToOne관계를 맺을때는 각별한 주의가 필요하다는것을 배웠습니다.

- 먼저 꼭 필요한 경우가 아니라면 1:1 관계는 맺지 않는다.
- 1:N이 될 수 있을 것 같다면 그냥 1:N으로 만든다.
- 1:1 관계가 필요하다면 포링키를 부모에 두어도 괜찮은지 확인한다.

# 관련 래퍼런스

- https://yongkyu-jang.medium.com/jpa-%EB%8F%84%EC%9E%85-onetoone-%EA%B4%80%EA%B3%84%EC%97%90%EC%84%9C%EC%9D%98-lazyloading-%EC%9D%B4%EC%8A%88-1-6d19edf5f4d3
- https://vladmihalcea.com/maven-gradle-hibernate-enhance-plugin/
- https://hibernate.atlassian.net/browse/HHH-15314
- https://hibernate.atlassian.net/browse/HHH-15314