---
layout: post
title: "JPA OneToOne관계의 N+1 이슈"
date: 2024-04-06 08:46:00 +0900
categories:
  - network
  - aws
comments: true
---

# JPA OneToOne관계의 N+1 이슈

현재 상품 도메인을 개발하고있는데, 상품 엔티티에는 OneToOne 관계를 맺는 자식 엔티티가 11개 있습니다. 

이 관계들은 모두 FetchType.LAZY로 설정되어 있지만, 실제로 Product를 조회할 때 지연 로딩이 동작하지 않았습니다.

아래 사진과 같이 Product의 status 필드 하나만을 조회하고자 해도, OneToOne 관계에 있는 모든 엔티티에 대한 쿼리 11번이 추가적으로 실행됩니다. 

![img.png](/assets/img/experience/onetoone-lazyloading/img_1.png)

이는 JPA가 OneToOne 관계에서 지연 로딩을 기본적으로 활성화하지 않기 때문입니다.

캐시를 효율적으로 사용한다면 이 문제를 어느 정도 완화시킬 수 있겠지만, 실시간으로 데이터를 조회해야 하는 API에서는 결국 문제가 될 거라 예상했습니다.

# OneToOne 관계에서 지연로딩의 기술적인 제약

그렇다면 왜 JPA는 OneToOne 관계에서 지연로딩을 지원하지 않을까요?

JPA에서 OneToOne 관계에서 지연 로딩이 동작하지 않는 근본적인 이유는, 연관관계의 주인이 아닌 엔티티가 연관 엔티티에 대한 실제 존재 여부를 즉각적으로 알 수 없기 때문입니다.

반면 연관관계의 주인인 엔티티는 포링키를 기반으로 연관 엔티티에 대한 실제 존재 여부를 즉각적으로 알 수 있습니다.

그렇다면 프록시 객체를 사용해 지연 로딩을 구현하고, 실제 데이터에 접근할 때 해당 데이터가 없으면 null을 반환할 수는 없을까? 라는 생각이 듭니다.

JPA에서 지연 로딩에 사용되는 프록시 객체는 원본 클래스를 상속 받으며, 실제 객체를 참조하는 방식으로 작동합니다.

예를 들어, 아래 코틀린 코드에서 loadRealUser 메소드는 데이터베이스에서 실제 데이터를 가져와 타겟 클래스에 매핑하고 있습니다. (실제로는 CGLIB을 통해서 객체에 접근할 때 프록시를 반환하도록 구성되어있습니다.)

```kotlin
open class User(val userId: Long, var name: String?) {
}

class UserProxy(private val userId: Long) : User(userId, null) {
    private var realUser: User? = null

    override fun getName(): String {
        if (realUser == null) {
            loadRealUser() // 데이터베이스에서 데이터를 얻어오는 부분
        }
        return realUser!!.name!!
    }

    private fun loadRealUser() {
        // 데이터베이스로부터 값을 가져와서 User 인스턴스 생성
        realUser = User(userId, "Actual User Name")
    }
}

```
loadRealUser 메소드 안에서는 데이터베이스로부터 실제 데이터를 받아오고, 타겟 클래스로 매핑합니다.

하지만 이 때 받아온 실제 데이터가 null인 경우, 프록시 자기 자신을 null로 교체하는것은 자바에서 불가능합니다.

그렇다면 realUser 필드를 null로 설정하는 방법을 생각할수도 있겠지만, 이 역시 존재하지 않는 엔티티의 프록시를 사용하면서 발생할 수 있는 오류로 인해 문제가 됩니다.

예를 들어서 아래코드에서 프록시는 존재하고 타겟 엔티티가 null인 경우에는 `product.getIntroduction() != null` 조건이 만족하면서 예상하지 못한 동작을 발생시킵니다.

```kotlin 
Product product = entityManager.find(Product.class, productId);

if (product.getIntroduction() != null) {
    //실제 데이터베이스의 값이 없어도 introduction 프록시 클래스는 null이 아니므로 if문 안으로 들어옴
} else {
}
```

따라서 JPA 구현체들은 OneToOne 관계에서 연관 엔티티가 존재하지 않는 것을 미리 확인하고, 연관 엔티티가 없는 경우 프록시 객체를 생성하지 않고, 대신 null 자체를 반환하는 방식을 사용하고 있습니다.

# 해결 방법

지연로딩이 동작하지않는 이슈를 해결하기 위한 방법은 아래와 같습니다.

1. 연관관계의 주인을 변경
2. OneToOne 관계를 OneToMany로 변경
3. 객체 참조 분리
4. 필요한 데이터만을 선택하여 DTO로 매핑
5. lazyToOne 어노테이션을 활용하고 추가적인 gradle plugin을 통해서 바이트 코드를 조작
6. 하나의 테이블로 합치기

하나씩 어떤 장단점들이 있는지 알아보겠습니다.

## 연관관계의 주인을 변경
연관관계의 주인을 변경함으로써 포링키 위치를 바꿔줍니다. 

그러면 포링키의 존재 여부에 따라 연관 엔티티 존재여부를 알 수 있기 떄문에 지연 로딩이 가능합니다.

데이터베이스에 대한 변화가 있지만, 코드 레벨에서는 가장 깔끔한 해결책이 될 수 있습니다.

그리고 포링키가 부모 테이블에 있는게 어색할 수 있는데, 사실 OneToMany로 비지니스가 변경될 여지가 있는게 아니라면 크게 문제될것은 없습니다.  

아래 예시에서 이를 확인해볼 수 있습니다.

```kotlin
@Entity
@Table(name = "product_introductions")
class ProductIntroduction(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(name = "content")
    val content: String,

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    val product: Product? = null
)
```

```kotlin
@Entity
@Table(name = "products")
class Product(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(name = "name")
    val name: String,

    @OneToOne(mappedBy = "product", fetch = FetchType.LAZY)
    val introduction: ProductIntroduction
)
```

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

## OneToOne 관계를 OneToMany로 변경

OneToMany 관계에서는 실제 데이터베이스로부터 값을 로딩했을때 값이 없다면 프록시가 empty list일 뿐 입니다. 

그대로 Collection 타입이 유지하기 때문에 앞에서 살펴본 OneToOne 관계에서의 이슈 사항은 발생하지 않습니다.

따라서 OneToOne관계를 OneToMany로 수정하고 애플리케이션 내에서 적절한 벨리데이션과 첫번째 원소를 반환 및 셋팅하는 코드를 만들어주면 해결할 수 있습니다.

아래는 예시입니다.

```kotlin
abstract class SingleElementCollectionWrapper<T> {
    protected abstract val elements: MutableList<T>

    fun getValue(): T? {
        validateSingleElement()
        return elements.firstOrNull()
    }

    fun setValue(element: T) {
        elements.clear()
        elements.add(element)
        validateSingleElement()
    }

    fun isExist(): Boolean = elements.size == 1

    protected fun validateSingleElement() {
        check(elements.size <= 1) {
            throw ExperiencesErrorCode.NOT_VALID_STATE.newException("콜랙션의 원소가 무조건 1개 이하여야 합니다.")
        }
    }
}
```

```kotlin
@Embeddable
class ProductIntroductionWrapper(
    @OneToMany(fetch = FetchType.LAZY, mappedBy = "product", cascade = [CascadeType.PERSIST])
    override val elements: MutableList<ProductIntroduction> = mutableListOf(),
) : SingleElementCollectionWrapper<ProductIntroduction>() {
    init {
        validateSingleElement()
    }
}
```

## 객체 참조의 분리

필요한 데이터는 eager loading을 통해서 라이프사이클을 상품과 동일하게 맞춰주고, 그렇지 않다면 객체 참조를 분리합니다.

객체 참조 분리에 대한 기준은 아래와 같이 정했습니다.

1. 상품의 핵심 정보
2. 성능과 요구 사항을 고려한 결정
3. 상품의 핵심 정보

### 상품의 핵심 정보
객체지향 관점에서 상품의 핵심 정보를 중심으로 연관관계를 설정하는 것이 합리적인 접근 방법이라 생각 했습니다.

상품의 핵심 정보를 기준으로 비즈니스의 발전가 발전할텐데, 연관관계를 연결해두어야 객체지향의 장점을 살릴 수 있다고 생각했습니다.

### 성능과 요구 사항을 고려한 결정

실제로 조회와 수정 작업에서 완벽하게 라이프사이클이 일치하는 경우는 없습니다. 하지만, 라이프사이클이 대체로 비슷한 엔티티들은 같은 애그리거트로 묶어서 관리하는 것이 성능 최적화에 유리하다고 생각했습니다.

### 필요한 데이터만을 선택하여 DTO로 매핑

Mybatis를 사용하는것처럼 필요한 데이터를 모은 DTO를 만들어서 매핑합니다. 예시를 들면 아래와 같습니다.

List<UserSummaryDto> userSummaries = em.createQuery(
"SELECT new package.path.UserSummaryDto(u.name, u.email) FROM User u WHERE u.status = :status", UserSummaryDto.class)
.setParameter("status", UserStatus.ACTIVE)
.getResultList();

## lazyToOne 어노테이션을 활용하고 추가적인 gradle plugin을 통해서 바이트 코드를 조작

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

![img.png](/assets/img/experience/onetoone-lazyloading/img.png)

하지만 이 방법은 코틀린에서 지원되지않습니다. 코틀린와 자바의 코드를 컴파일하는 방식의 차이에서 어려움이 존재하다고 합니다.

https://hibernate.atlassian.net/browse/HHH-15314

### 하나의 테이블로 합치기

상품의 핵심 정보라면 상품 테이블 하나로 합치고, 핵심 정보가 아닌것들은 과감하게 분리하면서 연관관계를 끊습니다.

# 선택한 방법
결과적으로 저는 OneToMany로 애플리케이션 코드를 변경해서 OneToOne에서 지연로딩이 동작하지 않는 방법을 해결했습니다.

먼저, 데이터베이스 변경에 대한 내부적인 제약으로 인해 외래 키 위치 변경은 실행할 수 없었습니다. 

또한, Kotlin에서 바이트 코드 조작을 통한 엔티티 강화 지원이 되지 않는 문제가 있었습니다. 

연관관계를 해제하는 것도 이미 비즈니스 로직이 많이 얽혀있어, 끊을 수 있는 관계들은 이미 끊어둔 상태여서 적절한 해결책이 되지 못했습니다.

따라서 @Embedded 어노테이션을 통해 OneToMany 관계를 래핑하고 단일 엔티티를 갖도록 캡슐화하는 방법을 택했습니다. 

이는 비즈니스 로직에 가장 적은 변경을 요구하면서도 데이터베이스 구조를 그대로 유지할 수 있는 실질적인 솔루션이었습니다.

앞으로 OneToOne 관계를 사용할 때 고려해야 할 점은 아래와 같습니다.

- 먼저 꼭 필요한 경우가 아니라면 1:1 관계는 맺지 않는다.
- 1:N이 될 수 있을 것 같다면 그냥 1:N으로 만든다.
- 1:1 관계가 필요하다면 포링키를 부모에 두어도 괜찮은지 확인한다.

# 관련 래퍼런스
https://yongkyu-jang.medium.com/jpa-%EB%8F%84%EC%9E%85-onetoone-%EA%B4%80%EA%B3%84%EC%97%90%EC%84%9C%EC%9D%98-lazyloading-%EC%9D%B4%EC%8A%88-1-6d19edf5f4d3
https://vladmihalcea.com/maven-gradle-hibernate-enhance-plugin/
https://hibernate.atlassian.net/browse/HHH-15314
https://hibernate.atlassian.net/browse/HHH-15314