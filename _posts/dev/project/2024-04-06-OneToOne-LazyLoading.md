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
![img.png](/assets/img/dev/jvm-lang/onetoone-lazyloading/img_1.png)

이는 JPA가 OneToOne 관계에서 지연 로딩을 기본적으로 활성화하지 않기 때문이었습니다.
![img.png](/assets/img/dev/jvm-lang/onetoone-lazyloading/img.png)

# OneToOne 관계에서 지연로딩의 기술적인 제약

그렇다면 왜 JPA는 OneToOne 관계에서 지연로딩을 지원하지 않을까요?

JPA에서 OneToOne 관계의 지연 로딩이 제대로 작동하지 않는 근본적인 이유는, 연관 관계의 주인이 아닌 엔티티가 연관 엔티티의 실제 존재 여부를 즉각 알 수 없기 때문입니다.

반면 연관관계의 주인인 엔티티는 포링키를 기반으로 연관 엔티티에 대한 실제 존재 여부를 즉각적으로 알 수 있습니다.

예를 들어, 아래와 같은 상황입니다.

상품에는 상품 소개가 존재하는데, 상품 소개의 데이터 사이즈가 매우 크고 상품과 생명주기가 완벽하게 일치하지 않아 OneToOne 관계로 엔티티를 분리한 상황입니다.

```kotlin
@Entity
@Table(name = "products")
class Product(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long,
    
    @OneToOne(fetch = FetchType.LAZY, mappedBy = "product", cascade = [CascadeType.PERSIST])
    var introduction: ProductIntroduction,
)
```

```kotlin
@Entity
@Table(name = "product_introductions")
class ProductIntroduction(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "product_id",
        foreignKey = ForeignKey(ConstraintMode.NO_CONSTRAINT),
        nullable = false,
        columnDefinition = "bigint"
    )
    var product: Product? = null,
)
```

상품소개는 포링키의 존재여부로 상품의 존재여부를 파악할 수 있습니다.

반면 상품은 상품소개에 대한 어떠한 정보도 없기 때문에 스스로 상품소개의 존재 여부를 파악할 수 없고, 부가적인 쿼리가 필요합니다.

그렇다면 _**상품 조회시에 상품소개를 프록시 객체로 만들어두고, 실제 상품소개 데이터에 접근할 때 해당 데이터가 없으면 null을 반환할 수는 없을까?**_ 라는 생각이 듭니다.

결론부터 말씀드리면 기술적으로 어렵습니다.

JPA에서 지연 로딩에 사용되는 프록시 객체는 원본 클래스를 상속 받으며, 실제 객체를 참조하는 방식으로 작동합니다.

예를 들어, 아래 코틀린 코드에서 loadRealUser 메소드는 데이터베이스에서 실제 데이터를 가져와 타겟 클래스에 매핑하고 있습니다. (실제로는 CGLIB을 통해서 객체에 접근할 때 프록시를 반환하도록
구성되어있습니다.)

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

하지만 이 때 받아온 실제 데이터가 null인 경우, 프록시 자기 자신을 null로 교체하는것이 불가능합니다.

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

그렇다면 OneToMany 관계에서는 어떻게 지연로딩이 적절하게 동작하는것일까요?

JPA에서 OneToMany 관계에서는 연관된 객체들을 리스트 타입의 프록시로 설정하며, 실제 데이터베이스로부터 값을 로딩했을 때 해당 값이 없다면 프록시는 empty list를 반환합니다.

이는 연관된 객체들의 수를 미리 알 수 없어도, 리스트 자체가 프록시로 생성되고 관리될 수 있기 때문에 가능합니다. 이렇게 하면 관계된 모든 데이터를 효율적으로 관리할 수 있습니다.

```kotlin
@Entity
@Table(name = "courses")
class Course(
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
val id: Long,

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "course")
    var students: List<Student> = mutableListOf()
)
```

```kotlin
@Entity
@Table(name = "students")
class Student(
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
val id: Long,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    var course: Course
)
```

이 경우, Course 엔티티를 조회할 때 관련된 Student 엔티티들이 즉시 로드되지 않고, 실제로 해당 데이터에 접근할 때만 데이터베이스에서 로드되어 리스트에 추가됩니다.

# 해결 방법

지연로딩이 동작하지않는 이슈를 해결하기 위해 고민한 방법은 크게 아래와 같습니다.

1. 연관관계의 주인을 변경
2. 객체 참조 분리
3. lazyToOne 어노테이션을 활용하고 추가적인 gradle plugin을 통해서 바이트 코드를 조작
4. OneToOne 관계를 OneToMany로 변경

결과적으로 저희는 OneToOne관계를 OneToMany로 변경하는 방법을 사용했습니다.

하나씩 어떤 장단점들이 있는지 알아보겠습니다.

## 연관관계의 주인을 변경

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

## 객체 참조의 분리

필요한 데이터는 eager loading을 통해서 라이프사이클을 상품과 동일하게 맞춰주고, 그렇지 않다면 객체 참조를 분리하는것을 고민했습니다.

객체 참조 분리에 대한 기준은 아래와 같이 정했습니다.

1. 상품의 핵심 정보
2. 성능과 요구 사항을 고려한 결정

### 상품의 핵심 정보

객체지향 관점에서 상품의 핵심 정보를 중심으로 연관관계를 설정하는 것이 합리적인 접근 방법이라 생각 했습니다.

상품의 핵심 정보를 기준으로 비즈니스의 발전가 발전할텐데, 연관관계를 연결해두어야 객체지향의 장점을 살릴 수 있다고 생각했습니다.

### 성능과 요구 사항을 고려한 결정

실제로 조회와 수정 작업에서 완벽하게 라이프사이클이 일치하는 경우는 없습니다. 하지만, 라이프사이클이 대체로 비슷한 엔티티들은 같은 애그리거트로 묶어서 관리하는 것이 성능 최적화에 유리하다고 생각했습니다.

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

![img.png](/assets/img/dev/jvm-lang/onetoone-lazyloading/img_3.png)

하지만 이 방법은 코틀린에서 지원되지않습니다. 코틀린와 자바의 코드를 컴파일하는 방식의 차이에서 어려움이 존재하다고 합니다.
(https://hibernate.atlassian.net/browse/HHH-15314 를 참고)

## OneToOne 관계를 OneToMany로 변경

결과적으로 이슈를 해결하기위해 선택한 방식입니다.

먼저, 데이터베이스 변경에 대한 내부적인 제약으로 인해 외래 키 위치 변경은 실행할 수 없었습니다.

또한, Kotlin에서 바이트 코드 조작을 통한 엔티티 강화 지원이 되지 않는 문제가 있었습니다.

연관관계를 해제하는 것도 이미, 끊을 수 있는 관계들은 이미 끊어둔 상태여서 적절한 해결책이 되지 못했습니다.

그래서 **OneToOne관계를 OneToMany로 변경하면서 Embedded클래스로 만들어서 사용하는곳에서는 차이점을 모르게 하자** 로 결론지었습니다.

이는 비즈니스 로직에 가장 적은 변경을 요구하면서도 데이터베이스 구조를 그대로 유지할 수 있는 실질적인 솔루션이었습니다.

먼저 아래의 추상클래스를 만들어줬습니다.

OneToOne관계가 not null인 경우 getSingleValue()를 사용해서 하나의 원소를 가져올 수 있도록 보장해주고, nullable한 경우에는 getSingleValueOrNull()를 사용해서 하나
또는 null을 가져올 수 있도록 만들었습니다.

OneToOne관계의 엔티티에는 OneToOneRelationWithProduct 인터페이스를 강제하도록 설정했고, 이로 하여금 link()를 재사용할수도있고, 좀 더 명시적으로 의도를 나타낼 수 있다고
판단했습니다.

주의해야할 점으로는 JPA 로딩 시점에는 리플랙션을 통해서 기본 생성자로 인스턴스를 만들기 때문에, 하나의 원소를 체크하는 벨리데이션을 init 구문에 걸어두면 런타임에 에러가 발생합니다.

```kotlin
abstract class OneToOneRelationWrapper<T : OneToOneRelationWithProduct> {

    protected abstract val elements: MutableSet<T>

    fun getSingleValue(): T {
        validateSingleElement()
        return elements.first()
    }

    fun getSingleValueOrNull(): T? {
        validateSingleOrNoElement()
        return elements.firstOrNull()
    }

    fun setValue(element: T) {
        elements.clear()
        elements.add(element)
        validateSingleElement()
    }

    fun isExist(): Boolean {
        return elements.isNotEmpty()
    }

    fun link(product: Product) {
        getSingleValue().link(product)
    }

    // JPA는 기본 생성자로 엔티티를 생성하기때문에 벨리데이션시에 런타임 에러를 조심
    private fun validateSingleElement() {
        check(elements.size == 1) {
            throw ExperiencesErrorCode.NOT_VALID_STATE.newException("콜랙션의 원소가 무조건 1개이어야 합니다.")
        }
    }

    fun validateSingleOrNoElement() {
        check(elements.size <= 1) {
            throw ExperiencesErrorCode.NOT_VALID_STATE.newException("콜랙션의 원소가 무조건 1개 이하이어야 합니다.")
        }
    }
}
```

아래와 같이 사용했습니다.

```kotlin
@Embeddable
class ProductIntroductionWrapper(
    @OneToMany(fetch = FetchType.LAZY, mappedBy = "product", cascade = [CascadeType.PERSIST])
    override val elements: MutableSet<ProductIntroduction> = mutableSetOf(),
) : OneToOneRelationWrapper<ProductIntroduction>() {

    companion object {
        fun create(content: String): ProductIntroductionWrapper {
            ...
        }
    }

    init {
        validateSingleOrNoElement()
    }

    fun update(introduction: String) {
        ...
    }
}
```

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