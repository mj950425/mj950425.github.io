---
layout: post
title: "Redisson의 tryLock 메소드 내부 구현 살펴보기"
date: 2024-01-12 08:46:00 +0900
categories:
  - db
description: >
  'redisson의 tryLock 메소드에 대해서 알아봤습니다.'
---

# Redisson의 tryLock 메소드 내부 구현 살펴보기
![그림2](/assets/img/db/redisson/img_13.png)

Redisson은 자바용 레디스 클라이언트로, 분산 락을 쉽게 구현할 수 있도록 지원합니다.

rLock.tryLock(...) 메소드 하나로 손쉽게 분산 락을 사용할 수 있습니다.

또한 공식 문서에 따르면 Redisson은 lettuce보다 더 나은 성능을 보여줍니다.

자세한 내용은 아래 링크를 참조하시기 바랍니다.

[공식 문서 링크](https://redisson.org/feature-comparison-redisson-vs-lettuce.html)

# AOP를 활용한 Redisson 분산락
먼저 아래는 개발자가 작성해야하는 코드 입니다. 

Spring의 AOP를 활용해서 어노테이션 기반으로, 도메인 로직과 락에 대한 코드를 분리했습니다.

락은 Redisson을 사용해서 간단하게 점유하는 코드를 만들어봤습니다.

코드를 조금 더 자세하게 살펴보면, Spring AOP를 사용하여 DistributeLock 어노테이션이 적용된 메소드의 클래스를 가로채서 프록시를 생성합니다.

프록시의 부가기능은 아래와 같습니다.

먼저, DistributeLock 어노테이션의 키 값을 사용하여 redissonClient.getLock(distributeLock.key) 메소드를 호출하고 rLock이라는 객체를 생성합니다.

다음으로, DistributeLock 어노테이션의 waitTime(락을 얻기 위해 대기하는 시간)과 leaseTime(락을 유지할 수 있는 시간)을 사용하여 redisson의 tryLock을 사용하여 락에 대한 점유를 시도합니다.

만약 락을 획득하는데 성공하면 새로운 트랜잭션을 시작하고 대상 메소드를 실행합니다.

인터럽트 예외가 발생한다면, 현재 스레드를 다시 인터럽트 상태로 설정하고 예외를 다시 던집니다.

마지막으로 해당 스레드에서 락을 소유하고 있다면, 락을 해제하고 종료합니다.

### AOP 코드
```
@Around("@annotation(com.example.stockstudy.annotation.DistributeLock)")
    fun acquireDistributeLockAndCallMethod(joinPoint: ProceedingJoinPoint): Any? {
        val signature = joinPoint.signature as MethodSignature
        val distributeLock = signature.method.getAnnotation(DistributeLock::class.java)

        val rLock = redissonClient.getLock(distributeLock.key)
        return try {
            if (!rLock.tryLock(distributeLock.waitTime, distributeLock.leaseTime, distributeLock.timeUnit)) {
                throw IllegalStateException("redis lock 획득에 실패했습니다")
            }
            distributeLockTransaction.proceed(joinPoint)
        } catch (e: InterruptedException) {
            e.printStackTrace()
            Thread.currentThread().interrupt()
            throw InterruptedException()
        } finally {
            if(rLock.isHeldByCurrentThread) {
                rLock.unlock()
            }
        }
    }
```

### 어노테이션
```
@Component
class DistributeLockTransactionProxy {

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun proceed(
        joinPoint: ProceedingJoinPoint
    ): Any? {
        return joinPoint.proceed()
    }
}
```

# Redisson 락 내부 동작 분석
## getLock 메소드
먼저, redissonClient.getLock(distributeLock.key)에 대해서 알아보겠습니다.

RedissonLock은 자바의 Lock 인터페이스 구현체이면서 RedissonBaseLock, RedissonExpirable, RedissonObject의 자식 클래스입니다.

RedissonLock의 상속 구조는 아래와 같습니다.
![그림2](/assets/img/db/redisson/img_5.png)

RedissonLock은 생성 과정에서 커맨드 실행기, 퍼블릭 서비스 등 여러 가지 정보를 등록합니다.

또한 distributeLock.key 값을 기반으로 부모의 상태인 entryName과 name을 생성합니다.

entry는 락 객체의 메타데이터를 담는 객체이며, name은 나중에 채널(pub/sub 토픽) 이름과 락 키값으로 쓰입니다.

![그림2](/assets/img/db/redisson/img_1.png)

![그림2](/assets/img/db/redisson/img_2.png)

## tryLock 메소드
이렇게 만들어진 RedissonLock이 tryLock 코드를 실행하면서 락을 얻으려고 시도하기 시작합니다.

아래는 위에서 알아본 AOP 코드의 일부분입니다.
```
return try {
            if (!rLock.tryLock(distributeLock.waitTime, distributeLock.leaseTime, distributeLock.timeUnit)) {
                throw IllegalStateException("redis lock 획득에 실패했습니다")
            }
            distributeLockTransaction.proceed(joinPoint)
        }
```

이제 redisson이 지원해주는 tryLock 메소드의 내부를 살펴보겠습니다.

먼저, 쓰레드를 얼마나 대기시킬지 결정하기 위해 현재 시간을 얻습니다.

그리고 현재 스레드의 아이디를 변수에 저장한 후, tryAcquire 메소드를 실행합니다.

![그림2](/assets/img/db/redisson/img_15.png)

타고 들어가보면, RedissonLock의 tryAcquireAsync(long waitTime, long leaseTime, TimeUnit unit, long threadId) 메소드를 실행합니다.

여기에서 leaseTime(락을 잡고 있는 시간)이 0보다 크므로 tryLockInnerAsync(waitTime, leaseTime, unit, threadId, RedisCommands.EVAL_LONG) 메소드를 실행합니다.

![그림2](/assets/img/db/redisson/img.png)

tryLockInnerAsync에 들어와보면 루아 스크립트를 확인할 수 있습니다. Redisson은 내부적으로 루아 스크립트를 사용합니다.

![그림2](/assets/img/db/redisson/img_16.png)

조금 이쁘게 정리해보면 아래와 같습니다.

```
if ((redis.call('exists', KEYS[1]) == 0) or (redis.call('hexists', KEYS[1], ARGV[2]) == 1)) then
    redis.call('hincrby', KEYS[1], ARGV[2], 1);
    redis.call('pexpire', KEYS[1], ARGV[1]);
    return nil;
end;
return redis.call('pttl', KEYS[1]);

```

루아 스크립트는 단일 요청으로 레디스에서 여러 동작들을 효율적으로 수행할 수 있고, 주로 이를 통해 네트워크 오버헤드를 최소화하기 위해 사용됩니다. 

또한 복잡한 연산이 필요하거나, 원자성이 보장되어야 하는 경우에 루아 스크립트는 매우 유용합니다.

스크립트의 내용을 분석을 진행해 보겠습니다.

먼저 KEYS는 Collections.singletonList(getRawName()), unit.toMillis(leaseTime), getLockName(threadId)를 참조합니다. 여기서 KEYS[1]은 getRawName()을 의미하며, 이는 RLock 생성 시 사용된 키 값입니다.
ARGV[2]는 getLockName(threadId)로, 쓰레드 식별자를 나타냅니다.

주요 동작은 다음과 같습니다.

* if(redis.call('exists', KEYS[1]) or redis.call('hexists', KEYS[1], ARGV[2])) :
  * 키가 KEYS[1]인 값이 존재하지않거나
  * 키가 KEYS[1]인 해시들중에 키가 ARGV[2]인 값이 있는지 확인합니다. 
* then redis.call('hexists', KEYS[1], ARGV[2])
  * 키가 KEYS[1]인 해시들중에 키가 ARGV[2]인 값을 1 올립니다.
* redis.call('pexpire', KEYS[1], ARGV[1])
  * 만료 시간을 설정합니다.
* return nil; end;
  * 성공적으로 락을 획득하고 null값을 반환하면서 종료합니다. 
* return redis.call('pttl', KEYS[1]);
  * if문을 충족시키지 못하면, lock의 ttl을 반환합니다.

위 동작을 간단하게 요약해보면 아래와 같습니다.
* 두가지 자료구조에서 락이 점유중인지 체크하고 락이 잡혀있으면 ttl을 반환

안으로 한번 더 들어오면, 마스터 슬레이브 환경에서 어떤 노드가 해당 키를 담당하는지 등.. 에 대한 설정들을 담고 있습니다.

그리고 위의 루아 스크립트 코드를 실행시킵니다.
![그림2](/assets/img/db/redisson/img_6.png)

그러고는 결과값을 가지고 stack trace를 타고 다시 바깥으로 돌아갑니다.

만약 ttl이 null로 반환되면, 이는 락이 성공적으로 획득되었음을 의미하며, 함수는 true를 반환하고 종료됩니다.

반면에 다른 스레드가 이미 락을 보유하고 있어 ttl이 null이 아닌 값을 반환하는 경우, 해당 함수는 subscribe 메소드로 이동합니다.

로컬에서 단건의 요청을 디버깅 모드로 트래킹하기에는 어려우니, jmeter와 같은 테스트 도구를 사용하면 손쉽게 진입할 수 있습니다.

![그림2](/assets/img/db/redisson/img_7.png)

subscribe 내부로 진입해보면 아래와 같습니다.

![그림2](/assets/img/db/redisson/img_14.png)

먼저 특정 채널을 구독하는 세마포어를 만듭니다. 해당 채널 이름은 lock key값을 기반으로 만들어집니다.

![그림2](/assets/img/db/redisson/img_17.png)

그리고 구독의 결과 값을 담을 CompletableFuture 객체의 newPromise를 생성합니다.

semaphore.acquire() 메소드를 통해서 비동기로 세마포어를 얻습니다. 그리고 thenAccept() 메소드를 통해서 콜백을 등록합니다. 

세마포어를 얻어왔을 때, 이를 통해서 쓰레드풀의 또 다른 스레드가 콜백 안쪽의 로직을 수행합니다.

콜백 안쪽의 로직은 메인 쓰레드의 코드가 실패했으면 세마포어를 반환하는 등 entry에 대한 작업이 존재합니다.

![그림2](/assets/img/db/redisson/img_8.png)

여기에서 중요한것은 해당 세마포어를 얻어왔다고 락을 획득한게 아니라는 것 입니다.

세마포어는 단순히 제한된 숫자의 스레드가 경쟁할 수 있도록 관리해주는 역할입니다.

기존의 애플리케이션 로직을 실행하던 메인 스레드는 블락되지않기 때문에, 바로 newPromise를 반환합니다.

![그림2](/assets/img/db/redisson/img_9.png)

메인 스레드는 곧바로 timedGet() 메소드를 실행합니다. 이는 개발자가 정한 시간만큼 세마포어를 얻어오도록 기다립니다.

정해진 시간동안 세마포어를 얻어오지 못한다면 TimeoutException을 반환합니다.

![그림2](/assets/img/db/redisson/img_10.png)

정해진 시간안에 세마포어를 얻어온 스레드는 subscribeFuture.get(…) 코드를 넘어서, 다음 코드라인으로 이동합니다.

이제는 정해진 N개의 스레드들이 스핀락을 돌며 락을 획득하기 위해 경쟁합니다.

![그림2](/assets/img/db/redisson/img_11.png)

그러다가 개발자가 입력한 대기 시간보다, 더 오래 걸리면 여기에서도 역시 락을 획득하지 못하고 실패합니다.

마지막으로는 점유하고있는 세마포어를 반환합니다.

![그림2](/assets/img/db/redisson/img_12.png)

# 결론
여기까지 Redisson의 Lock 점유 내부 구현에 대해서 알아봤습니다.

Redisson을 보통 pub sub 모델이라고 많이들 이야기하지만, 실제로는 pub sub 기반으로 spin lock을 통해서 락을 획득하는 구조를 갖고 있었습니다.

아무래도 정해진 N개의 스레드 끼리는 빠르게 락을 획득할 가능성이 높으므로, 컨택스트 스위칭 비용보다 sping lock을 돌면서 CPU를 지속적으로 점유해서 락을 획득하는게 더 이득이라고 판단한 것 같습니다.
