# redisson 이란
redisson은 자바를 위한 레디스 클라이언트입니다.

lettuce보다 더 좋은 성능을 보여준다고 하는데, 자세한 내용은 아래 링크를 참조해도 좋을 것 같습니다.

https://redisson.org/feature-comparison-redisson-vs-lettuce.html

Redisson을 활용해서 손쉽게 분산락을 구현할 수 있습니다.

# Redisson은 어떻게 분산락을 구현했을까?
먼저 아래는 개발자가 작성해야하는 부분입니다.

아래는 간단하게 Spring AOP와 Redisson을 활용해서 분산락을 가져가는 코드입니다.

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
        } catch (e: Exception) {
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

그러면 이제 해당 코드가 어떻게 동작하는지 하나하나 자세하게 알아보겠습니다.

먼저 redissonClient.getLock(distributeLock.key)을 통해서 락을 얻어옵니다.

RedissonLock은 RedissonBaseLock과 RedissonObject의 자식인데 name을 가지고 entryName과 channelName을 만듭니다.

```
    public RedissonBaseLock(CommandAsyncExecutor commandExecutor, String name) {
        super(commandExecutor, name);
        this.commandExecutor = commandExecutor;
        this.id = commandExecutor.getConnectionManager().getId();
        this.internalLockLeaseTime = commandExecutor.getConnectionManager().getCfg().getLockWatchdogTimeout();
        this.entryName = id + ":" + name;
    }
```

```
    public RedissonObject(CommandAsyncExecutor commandExecutor, String name) {
        this(commandExecutor.getConnectionManager().getCodec(), commandExecutor, name);
    }
```

획득하고자 하는 이름의 락을 정의하고 유효 시간까지 락 획득을 시도하게 됩니다.

만약 유효 시간이 지나면 락 획득은 실패하게 됩니다.

단 여기서 주의할 점은 unlock할 경우에, 해당 세션에서 잠금을 생성한 락인지 확인해야 합니다.

그렇지 않으면 다른 세션에서 수행중인 잠금이 해제될수도 있습니다.

isLocked() : 잠금이 되었는지 확인

isHeldByCurrentThread() : 해당 세션에서 잠금을 생성했는지 확인

public CompletableFuture<E> subscribe(String entryName, String channelName) {
AsyncSemaphore semaphore = service.getSemaphore(new ChannelName(channelName));
CompletableFuture<E> newPromise = new CompletableFuture<>();

```
public CompletableFuture<E> subscribe(String entryName, String channelName) {
AsyncSemaphore semaphore = service.getSemaphore(new ChannelName(channelName));
CompletableFuture<E> newPromise = new CompletableFuture<>();

        semaphore.acquire().thenAccept(c -> {
            if (newPromise.isDone()) {
                semaphore.release();
                return;
            }

            E entry = entries.get(entryName);
            if (entry != null) {
                entry.acquire();
                semaphore.release();
                entry.getPromise().whenComplete((r, e) -> {
                    if (e != null) {
                        newPromise.completeExceptionally(e);
                        return;
                    }
                    newPromise.complete(r);
                });
                return;
            }

            E value = createEntry(newPromise);
            value.acquire();

            E oldValue = entries.putIfAbsent(entryName, value);
            if (oldValue != null) {
                oldValue.acquire();
                semaphore.release();
                oldValue.getPromise().whenComplete((r, e) -> {
                    if (e != null) {
                        newPromise.completeExceptionally(e);
                        return;
                    }
                    newPromise.complete(r);
                });
                return;
            }

            RedisPubSubListener<Object> listener = createListener(channelName, value);
            CompletableFuture<PubSubConnectionEntry> s = service.subscribeNoTimeout(LongCodec.INSTANCE, channelName, semaphore, listener);
            newPromise.whenComplete((r, e) -> {
                if (e != null) {
                    s.completeExceptionally(e);
                }
            });
            s.whenComplete((r, e) -> {
                if (e != null) {
                    entries.remove(entryName);
                    value.getPromise().completeExceptionally(e);
                    return;
                }
                value.getPromise().complete(value);
            });

        });

        return newPromise;
    }
```

여기에서 채널은 그냥 구독 토픽 이름입니다.

1. 비동기로 동작하는 세마포어를 만든다.
2. 비동기 결과값을 담을 수 있는 newPromise를 만든다.
3. 세마포어가 acquire().thenAccpet를 메소드를 통해서 세마포어를 얻었을 때 콜백을 수행한다.
4. 디자인적으로 동시성을 좀 더 세부적으로 제어하기 위해서 entry라는 개념이 추가된것 같다.
4. 세마포어의 콜백을 수행하면서 newPromise의 상태를 complete 바꾼다.

다른 스레드에 의해서 interrupt되었다가 블로킹 코드를 만나면 바깥으로 interrupt exception을 던지고, 그 이후에 interrupt 상태를 삭제합니다.

그렇기 떄문에 바깥에서 interrupt exception 캐치했다면 뒤에서 다시 interrupt에 대한 코드가 있을 수 있으므로, 다시 상태를 interrupt로 만들어주는게 best practice 합니다.

------

먼저 spring aop와 redisson을 통해서, DistributeLock 어노테이션이 붙은 메소드에 락을 거는 코드입니다.

```
@Aspect
@Component
class DistributeLockAroundAspect(
    private val redissonClient: RedissonClient,
    private val distributeLockTransaction: DistributeLockTransactionProxy
){
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
            Thread.currentThread().interrupt()
            throw InterruptedException()
        } finally {
            if(rLock.isHeldByCurrentThread) {
                rLock.unlock()
            }
        }
    }
}
```

아래 코드부터 확인해보겠습니다.
```
val rLock = redissonClient.getLock(distributeLock.key)
```

레디슨은 자바의 Lock 인터페이스를 상속받은 RLock이라는 스펙의 구현체인 RedissonLock를 사용합니다.

RedissonLock의 상속구조는 아래와 같이 생겼습니다.
![그림2](/assets/img/db/redisson/img_5.png)


RedissonLock을 생성할 때 먼저 어떤 키값을 가지고 Lock을 설정할 것인지 등록합니다.

![그림2](/assets/img/db/redisson/img.png)

![그림2](/assets/img/db/redisson/img_1.png)

![그림2](/assets/img/db/redisson/img_2.png)

그렇게 만들어진 rLock이 아래 tryLock코드를 실행하면서 락을 잡기 시작합니다.

```
return try {
            if (!rLock.tryLock(distributeLock.waitTime, distributeLock.leaseTime, distributeLock.timeUnit)) {
                throw IllegalStateException("redis lock 획득에 실패했습니다")
            }
            distributeLockTransaction.proceed(joinPoint)
        }
```

tryLock의 매개변수로 waitTime(최대 얼마나 락을 획득하려고 대기할것인지), leaseTime(최대 얼마나 락을 잡고있을것인지), timeUnit(두 변수의 단위가 무엇인지)을 넣어줍니다.

이제 tryLock 메소드의 내부를 보겠습니다.

먼저 언제까지 락을 얻으려고 쓰레드를 대기시킬것인지 결정하기 위해서 현재 시간을 구합니다.

그리고 현재 스레드의 아이디를 변수에 담은 뒤, tryAcquire 메소드를 실행합니다.
```
        long time = unit.toMillis(waitTime);
        long current = System.currentTimeMillis();
        long threadId = Thread.currentThread().getId();
        Long ttl = tryAcquire(waitTime, leaseTime, unit, threadId);
```

RedissonLock의 tryAcquireAsync(long waitTime, long leaseTime, TimeUnit unit, long threadId) 메소드를 실행합니다.

leaseTime가 0보다 크므로 tryLockInnerAsync(waitTime, leaseTime, unit, threadId, RedisCommands.EVAL_LONG) 메소드를 실행합니다.

tryLockInnerAsync에 들어와보면 루아 스크립트를 확인할 수 있습니다.

루아 스크립트는 네트워크 오버헤드를 줄이기 위해서 사용되는데요. 서버의 루아 스크립트를 포함한 단일 요청으로 레디스에서 여러가지의 동작들이 수행됩니다.

보통 복잡한 조작이나, 동작이 원자성을 유지해야할때 유용하게 사용됩니다.

아래 스크립트를 하나씩 분석해보겠습니다.

여기에서 KEYS는 Collections.singletonList(getRawName()), unit.toMillis(leaseTime), getLockName(threadId))를 의미합니다.

결국 KEYS[1]은 getRawName()이며, rLock을 생성할때 매개변수로 넣어준 key값입니다.

ARGV[2]는 getLockName(threadId)로 쓰레드 번호를 의미합니다.

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

ttl을 null로 가져오면 락을 획득했으니 true를 리턴하고 종료합니다.

하지만 다른 스레드가 락을 잡고 있어서, 락을 획득하지 못하고 ttl을 null이 아닌 값으로 가지고 왔다면 아래의 subscribe 코드로 들어갑니다.

로컬에서 단건의 요청을 디버깅 모드로 트래킹하기에는 어려우니 jmeter와 같은 테스트 도구를 사용하면 손쉽게 진입할 수 있습니다.

![그림2](/assets/img/db/redisson/img_7.png)

subscribe 내부로 진입해보면 아래와 같습니다.

먼저 쓰레드 아이디로 만들어진 채널 이름을 갖고 세마포어를 만듭니다.

그리고 subscription의 결과 값을 담을 newPromise를 생성합니다.

그리고 비동기로 새로운 쓰레드풀의 스레드에서 세마포어를 얻어오도록 동작시킵니다.

덕분에 해당 기존의 애플리케이션 로직을 실행하던 스레드는 블락되지않고, 해당 함수는 바로 newPromise를 반환합니다.

그리고 세마포어를 얻어왔을 때, 쓰레드풀의 또 다른 스레드가 콜백 안쪽의 로직을 수행합니다. 

해당 로직은 이미 기존의 애플리케이션 코드가 실패했으면 세마포어를 반환하고, 얻어온 세마포어를 쓰레드 세이프하게 보관하며 이외에도 여라가지 시나리오의 동작을 수행합니다.

여기에서 중요한것은 해당 세마포어를 얻어왔다고 락을 획득한게 아니라는 것 입니다.

세마포어는 단순히 제한된 숫자의 스레드가 락을 얻어올 수 있도록 관리해주는 역할입니다.

![그림2](/assets/img/db/redisson/img_8.png)

![그림2](/assets/img/db/redisson/img_9.png)

non blocking으로 곧바로 반환된 애플리케이션의 흐름을 처리하던 스레드는 개발자가 정한 시간만큼 세마포어를 얻어오도록 기다립니다.

정해진 시간동안 세마포어를 얻어오지 못한다면 TimeoutException을 반환합니다.

![그림2](/assets/img/db/redisson/img_10.png)

time out이 발생하지않고 세마포어를 얻어낸 스레드는 다음 코드 라인으로 이동합니다.

그러고 나서는 스핀락을 돌면서 락을 얻어옵니다.

사실 redisson은 pub sub 모델로만 만들어지지않았습니다.

결국 마지막에는 스핀락을 돌면서 세마포어가 관리해주는 정해진 숫자의 스레드들끼리 락을 획득하려고 경쟁합니다.

![그림2](/assets/img/db/redisson/img_11.png)

그러다가 개발자가 입력한 대기 시간보다, 더 오래 걸리면 여기에서도 역시 락을 획득하지 못하고 실패합니다.

마지막으로는 점유하고있는 세마포어를 반환합니다.
![그림2](/assets/img/db/redisson/img_10.png)