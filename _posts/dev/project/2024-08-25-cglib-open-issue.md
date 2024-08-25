# CGLIB 사용시 발생하는 NPE

저는 현재 회사에서 Klook, 야놀자 등 20여 개의 공급사와 API를 통해 상품과 예약 정보를 연동하는 시스템을 운영하고 있습니다. 

이 시스템은 시간이 지남에 따라 여러 번의 문제를 겪으며 발전해 온 레거시 시스템입니다.

최근, 이 연동 시스템을 다시 설계하여 다양한 요구사항을 수용할 수 있는 새로운 시스템으로 개편하는 연동 3.0 프로젝트를 맡게 되었습니다. 

기존 레거시 시스템에서는 여러 차례 장애가 발생했는데, 그중 하나의 사례는 다음과 같습니다.

•	상황: 공급사 API를 호출하는 메서드에 @Transactional 어노테이션이 적용되어 있었습니다.
•	문제 발생: 공급사 API 서버의 응답이 지연되면서, 트랜잭션 시작 시 획득한 커넥션을 반납하는 데 시간이 오래 걸렸습니다.
•	결과: 이로 인해 DBCP 커넥션 풀이 고갈되었고, 시스템 전체 장애로 이어졌습니다.

이러한 문제를 해결하고자, 새로운 연동 시스템에서는 공급사 API를 호출할 때 트랜잭션 전파를 방지하는 구조를 도입하기로 결정했습니다. 

# 문제의 코드

CGLIB을 사용하여 @NonTransactional 어노테이션이 붙은 클래스의 바이트 코드를 조작해 프록시를 만들고, @Transactional(propagation = Propagation.NEVER)를 통해 트랜잭션이 전파되지 않도록 구성했습니다.

```kotlin
@Target(AnnotationTarget.FUNCTION, AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class NonTransactional
```

```kotlin
@Aspect
@Component
class SupplierApiTransactionAop(
    private val supplierApiTransactionProxy: SupplierApiTransactionProxy,
) {
    @Pointcut("@annotation(com.myrealtrip.connector.product.domain.support.NonTransactional)")
    fun nonTransactionalMethods() {}   

    @Around("nonTransactionalMethods()")
    fun aroundNonTransactionalMethods(joinPoint: ProceedingJoinPoint): Any? = supplierApiTransactionProxy.proceed(joinPoint)
}
```

```kotlin
@Component
class SupplierApiTransactionProxy {
@Transactional(propagation = Propagation.NEVER)
fun proceed(joinPoint: ProceedingJoinPoint): Any? = joinPoint.proceed()
}
```

연동 시스템에서는 계약을 맺은 공급사가 매우 많습니다. 

OCP 원칙에 맞게 확장 가능한 구조를 설계하고자했고, 추상클래스를 만들었습니다.

```kotlin
abstract class OptionService<T : ExpOptions>(
    private val publisher: ApplicationEventPublisher,
) {
    fun getSupplierCode(): SupplierCode

    @NonTransactional
    fun findOptions(
        command: ExpOptionsCommand,
        supplierProductId: String,
    ): ExpOptions {
        val options =
            findOptions(
                getExpOptions(command),
                supplierProductId,
            )

        publishOptionsQueriedEvent(options)

        return custom(options)
    }

    fun findOptions(
        expOptions: T,
        supplierProductId: String,
    ): ExpOptions

    ...
}
```

아래는 추상 클래스에 대한 실제 구현체입니다.

```kotlin
@Service
class KlookOptionService(
    private val klookClient: KlookClient,
    private val klookReservationExtraInfoService: KlookReservationExtraInfoService,
    private val objectMapper: ObjectMapper,
    publisher: ApplicationEventPublisher,
) : OptionService<KlookExpOptions>(publisher) {
    companion object {
        const val MAX_SKU_QUERY_COUNT_AT_ONCE = 20
    }

    override fun getSupplierCode(): SupplierCode = SupplierCode.KLOOK

    override fun findOptions(
        expOptions: KlookExpOptions,
        supplierProductId: String,
    ): ExpOptions {
        ...
```

KlookOptionService 생성자에서 부모 추상클래스인 OptionService 생성자로 publisher를 넘겨주고 있습니다.

별다른 이상한 부분은 안보였고 컴파일 에러도 발생하지 않았기 때문에, 정상 동작을 할 것으로 기대했는데요. 

실제로 코드를 실행하자 런타임에 NullPointerException이 발생했습니다. 

디버거 모드로 확인해보니 publisher가 null로 주입되었습니다.
![img](/assets/img/dev/jvm-lang/cglib-open/img.png)

# 문제의 원인

문제의 원인은 아래와 같습니다.

CGLIB은 프록시를 생성할 때 원본 클래스를 상속하는 서브클래스를 동적으로 생성하고, 이 서브클래스에서 원본 클래스의 메서드를 오버라이딩합니다.

하지만 코틀린에서는 클래스와 메서드가 기본적으로 final로 선언되기 때문에, CGLIB은 이러한 메서드를 오버라이딩할 수 없습니다.

CGLIB이 메서드를 오버라이딩할 수 없을 때 에러를 발생시키지 않고, 단순히 메서드를 오버라이딩하지 않습니다. 

이 경우 프록시 클래스는 부모 클래스(즉, 원본 클래스)의 메서드를 그대로 사용하게 됩니다.

결국 프록시 클래스는 OptionService 추상 클래스의 추상 메소드를 구현하지 못하기때문에, 추상 클래스트 타입의 프록시를 만드는 대신 자식 클래스인 KlookOptionService 타입의 프록시를 생성합니다.

프록시 객체는 원본 객체의 메서드 호출을 감싸고 타겟 객체의 메서드를 호출하는 역할만 하기 때문에, 자신의 필드들을 관리할 필요가 없습니다. 

따라서, 프록시 객체의 필드는 초기화되지 않고 null 상태로 남게 됩니다.

메서드가 호출될 때, 프록시 객체는 부모 클래스의 메서드를 사용하게 되는데, 이 메서드는 초기화되지 않은 필드를 참조하기 때문에 NPE가 발생합니다.

# 여전한 궁금증

그렇다면 추상 클래스가 아닌 다른 클래스에서는 이러한 문제가 발생하지않는것이 이상합니다.

다른 클래스에서도 @Transactional 어노테이션을 기반으로 CGLIB이 프록시 객체를 생성하는데, open이 없음에도 정상동작하고 있기 때문입니다.

이는 kotlin("plugin.spring") version "1.8.10" 덕분입니다.

코틀린은 기본적으로 final이 기본 접근 지정자이지만, 해당 플러그인을 gradle에 명시하면 스프링에서 사용하는 특정 어노테이션이 붙어있는 경우 all-open으로 만들어줍니다.

all-open 클래스로 만들어주는 어노테이션은 아래와 같습니다.

- @Component와 @Component를 상속받는 어노테이션(@Configuration, @Controller, @RestController, @Service, @Repository)
- @Async
- @Transactional
- @Cacheable
- @SpringBootTest

