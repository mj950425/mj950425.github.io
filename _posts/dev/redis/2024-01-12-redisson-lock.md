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

자세히 알아보면 rLock.tryLock(...) 메소드 하나로 분산 락을 사용할 수 있습니다.

또한 공식 문서에 따르면 Redisson은 lettuce보다 더 나은 성능을 보여줍니다.

자세한 내용은 아래 링크를 참조하시기 바랍니다.

https://redisson.org/feature-comparison-redisson-vs-lettuce.html

# AOP를 활용한 Redisson 분산락
먼저 아래는 개발자가 작성해야하는 부분입니다.

아래는 Spring AOP와 Redisson을 활용하여 분산락을 구현하는 간단한 코드입니다.

먼저 Spring AOP를 사용하여 DistributeLock 어노테이션이 적용된 메소드를 가로챕니다.

그리고 해당 어노테이션의 키 값을 사용하여 rLock이라는 객체를 생성합니다.

어노테이션의 waitTime(락을 얻기 위해 대기하는 시간)과 leaseTime(락을 유지할 수 있는 시간)을 기반으로 redisson의 tryLock을 사용하여 락을 얻으려 시도합니다.

락을 획득하면 새로운 트랜잭션을 시작하고 대상 메소드를 실행합니다.

만약 인터럽트 예외가 발생한다면, 현재 스레드를 다시 인터럽트 상태로 설정하고 예외를 다시 던집니다.

마지막으로 해당 스레드에서 락을 소유하고 있다면, 락을 해제하고 종료합니다..
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
# Redisson은 어떻게 tryLock 메소드를 구현했을까?

결론부터 말하면 Redisson은 사실 pub sub만으로 구현되어있지는 않고, pub sub 모델과 스핀락을 함께 사용합니다.

그러면 이제 redissonClient의 tryLock이 어떻게 동작하는지 하나하나 자세하게 알아보겠습니다.

먼저, redissonClient.getLock(distributeLock.key)을 통해 락을 얻어옵니다.

RedissonLock은 RedissonBaseLock과 RedissonObject의 자식 클래스로, name을 가지고 entryName과 channelName을 생성합니다.

아래 코드부터 확인해보겠습니다.
```
val rLock = redissonClient.getLock(distributeLock.key)
```

redissonClient.getLock(distributeLock.key) 메소드를 사용하여 간단하게 락 객체를 생성할 수 있습니다.

redisson은 자바의 Lock 인터페이스를 상속받은 RLock 스펙의 구현체인 RedissonLock를 사용합니다.

RedissonLock의 상속 구조는 아래와 같습니다.
![그림2](/assets/img/db/redisson/img_5.png)

rLock은 distributeLock.key 값을 사용하여 락을 획득하며, 생성 과정에서 커맨드 실행기, 퍼블릭 서비스 등 여러 가지 정보를 등록합니다.

중요한 점은 distributeLock.key 값을 RedissonObject의 name에 저장합니다.

해당 name은 나중에 pub sub 모델에서 채널을 구독하거나 락을 획득할 때 사용됩니다.

![그림2](/assets/img/db/redisson/img_1.png)

또한 entryName을 등록합니다. 여기에서 entry는 락에 대한 메타 정보를 담고 있는 객체입니다.

![그림2](/assets/img/db/redisson/img_2.png)

rLock이 tryLock 코드를 실행하면서 락을 얻으려고 시도하기 시작합니다.

```
return try {
            if (!rLock.tryLock(distributeLock.waitTime, distributeLock.leaseTime, distributeLock.timeUnit)) {
                throw IllegalStateException("redis lock 획득에 실패했습니다")
            }
            distributeLockTransaction.proceed(joinPoint)
        }
```

이제 tryLock 메소드의 내부를 살펴보겠습니다.

먼저, 쓰레드를 얼마나 대기시킬지 결정하기 위해 현재 시간을 얻습니다.

그리고 현재 스레드의 아이디를 변수에 저장한 후, tryAcquire 메소드를 실행합니다.
```
        long time = unit.toMillis(waitTime);
        long current = System.currentTimeMillis();
        long threadId = Thread.currentThread().getId();
        Long ttl = tryAcquire(waitTime, leaseTime, unit, threadId);
```

RedissonLock의 tryAcquireAsync(long waitTime, long leaseTime, TimeUnit unit, long threadId) 메소드를 실행합니다.

leaseTime가 0보다 크므로 tryLockInnerAsync(waitTime, leaseTime, unit, threadId, RedisCommands.EVAL_LONG) 메소드를 실행합니다.

tryLockInnerAsync에 들어와보면 루아 스크립트를 확인할 수 있습니다.

루아 스크립트는 네트워크 오버헤드를 최소화하기 위해 사용됩니다. 

이를 통해 단일 요청으로 레디스에서 여러 동작들을 효율적으로 수행할 수 있습니다. 

특히 복잡한 연산이 필요하거나, 원자성이 보장되어야 하는 경우에 루아 스크립트는 매우 유용합니다.

스크립트의 분석을 진행해 보겠습니다.

먼저 KEYS는 Collections.singletonList(getRawName()), unit.toMillis(leaseTime), getLockName(threadId)를 참조합니다. 여기서 KEYS[1]은 getRawName()을 의미하며, 이는 RLock 생성 시 사용된 키 값입니다.
ARGV[2]는 getLockName(threadId)로, 쓰레드 식별자를 나타냅니다.

스크립트의 주요 동작은 다음과 같습니다.

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

```
if ((redis.call('exists', KEYS[1]) == 0) or (redis.call('hexists', KEYS[1], ARGV[2]) == 1)) then
    redis.call('hincrby', KEYS[1], ARGV[2], 1);
    redis.call('pexpire', KEYS[1], ARGV[1]);
    return nil;
end;
return redis.call('pttl', KEYS[1]);

```

![그림2](/assets/img/db/redisson/img_3.png)

안으로 한번 더 들어오면, 마스터 슬레이브 환경에서 어떤 노드가 해당 키를 담당하는지 등.. 에 대한 설정들을 담고 있습니다.

그리고 위의 루아 스크립트 코드를 실행시킵니다.
![그림2](/assets/img/db/redisson/img_6.png)

그러고는 결과값을 가지고 stack trace를 타고 다시 바깥으로 돌아갑니다.

만약 ttl이 null로 반환되면, 이는 락이 성공적으로 획득되었음을 의미하며, 함수는 true를 반환하고 종료됩니다.

반면에 다른 스레드가 이미 락을 보유하고 있어 ttl이 null이 아닌 값을 반환하는 경우, 해당 함수는 subscribe 메소드로 이동합니다.

로컬에서 단건의 요청을 디버깅 모드로 트래킹하기에는 어려우니, jmeter와 같은 테스트 도구를 사용하면 손쉽게 진입할 수 있습니다.

![그림2](/assets/img/db/redisson/img_7.png)

subscribe 내부로 진입해보면 아래와 같습니다.

먼저 특정 채널을 구독하고 있는 세마포어를 만듭니다.

채널의 이름은 아래와 같이 생겼습니다.

```
    String getChannelName() {
        return prefixName("redisson_lock__channel", getRawName());
    }

```

그리고 구독의 결과 값을 담을 newPromise를 생성합니다.

그리고 쓰레드풀의 새로운 스레드에서 비동기로 세마포어를 얻어오도록 동작시킵니다. 

semaphore.acquire() 메소드는 논블락으로 해당 스레드는 바로 다른 자기 할 일을 하러 갑니다.   

덕분에 기존의 애플리케이션 로직을 실행하던 스레드는 블락되지않고 바로 newPromise를 반환합니다.

그리고 세마포어를 얻어왔을 때, 쓰레드풀의 또 다른 스레드가 콜백 안쪽의 로직을 수행합니다. 

해당 로직은 이미 기존의 애플리케이션 코드가 실패했으면 세마포어를 반환하고, 얻어온 세마포어를 쓰레드 세이프하게 보관하며 이외에도 여라가지 시나리오의 동작을 수행합니다.

여기에서 중요한것은 해당 세마포어를 얻어왔다고 락을 획득한게 아니라는 것 입니다.

세마포어는 단순히 제한된 숫자의 스레드가 락을 얻어올 수 있도록 관리해주는 역할입니다.

![그림2](/assets/img/db/redisson/img_8.png)

![그림2](/assets/img/db/redisson/img_9.png)

non blocking으로 곧바로 반환된 애플리케이션의 흐름을 처리하던 스레드는 개발자가 정한 시간만큼 세마포어를 얻어오도록 기다립니다.

정해진 시간동안 세마포어를 얻어오지 못한다면 TimeoutException을 반환합니다.

![그림2](/assets/img/db/redisson/img_10.png)

이 부분이 중요한데, Redisson이 단순히 pub-sub 모델만을 사용하는 것은 아닙니다. 

Redisson은 세마포어를 활용한 pub-sub 모델을 통해 여러 개의 스레드가 동시에 접근할 수 있도록 지원합니다. 

마지막 단계에서는 스레드들이 스핀락을 돌며 락을 획득하기 위해 경쟁합니다.

![그림2](/assets/img/db/redisson/img_11.png)

그러다가 개발자가 입력한 대기 시간보다, 더 오래 걸리면 여기에서도 역시 락을 획득하지 못하고 실패합니다.

마지막으로는 점유하고있는 세마포어를 반환합니다.

![그림2](/assets/img/db/redisson/img_12.png)