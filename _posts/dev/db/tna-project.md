# Redis에서 Lua script를 활용한 재고 차감 구현

저는 여행 도메인의 이커머스에 재직중인 주니어 개발자입니다.

이번에 루비 기반의 시스템을 코틀린으로 컨버팅하면서, 파트너들의 다양한 요구사항을 분석했고, 재고 시스템을 완전 새롭게 만들게 됐습니다.

그 과정에서 경험한 내용들을 기록하고자합니다. 그러면 요구사항을 먼저 정리해보겠습니다.

먼저 상품이 있고, 그 하위에 옵션이 존재합니다. 재고는 옵션에 존재하며, 날짜를 가집니다.

결국 `상품 -> 옵션 -> 재고 -> 날짜` 의 형태를 가집니다. **여기서 더해서, 옵션들이 같은 재고를 공유할수도 있어야합니다.**

이것은 병합하기라는 기능으로, A라는 옵션과 B라는 옵션이 C라는 재고를 공유함으로써 A가 팔리건 B가 팔리건 C재고를 차감해야합니다.

이러한 요구사항을 해결하기 위해서 **재고**라는 개념과 **재고통**이라는 개념을 분리했습니다.

재고통은 각 옵션들이 공유하는 재고묶음입니다. 예를 들어서 상품 밑의 두개의 옵션이 재고를 공유하고 1월 1일에는 재고가 100개 1월 2일에는 재고가 50개 존재한다면 아래와 같이 데이터가 들어갑니다.

```
옵션A, 옵션B는 재고통C에 묶이고, 재고통C는 재고D,E 를 묶는다. 
재고D는 재고량 애트리뷰트를 100개 가지고 날짜F에 매핑된다. 날짜F에는 1월1일 데이터가 존재한다. 
재고E는 재고량 애트리뷰트를 50개 가지고 날짜G에 매핑된다. 날짜G에는 1월 2일에 매핑된다. 
```

여기에서 복잡도를 낮추기 위해서, 하나의 옵션은 하나의 재고통에만 속할 수 있다고 규칙을 정했습니다. 예를 들어서 특정 날짜에 제트 스키와 바나나 보트가 같은 재고통을 사용한다고하면, 다른 날짜에도 제트 스키와 바나나 보트는 같은 재고통을 사용해야합니다.

그리고 옵션들을 묶어주는 재고통이 재고에 매핑됩니다. 재고통은 여러개의 재고를 가질 수 있습니다. 그리고 각 재고들은 재고 시즌이라는 날짜 데이터를 가집니다.

그림으로 보면 아래와 같은 구조입니다.
![그림1](/assets/img/redis/redis-lua/img.png)

# 재고 차감 성능 비교
재고 시스템 관련해서 여러 래퍼런스들을 읽어봤는데, 대부분의 자료들에서 사용하는 구조는 아래와 같이 좁혀지더군요.

* RDBMS에서 지원해주는 비관적락 + RDB에서의 재고 차감
* RDBMS에서 지원해주는 낙관적락과 애플리케이션에서의 재시도 로직 + RDB에서의 재고 차감
* Redis 분산락 + RDB에서의 재고 차감
* Redis에서 지원해주는 atomic 명령어를 통한 redis에서 재고 차감
* Redis에서 지원해주는 lua script를 통한 redis에서 재고 차감

물론 위 케이스보다 더 많은 구조가 존재하겠지만, 대부분의 경우 위와 같았습니다.

어떤 구조가 적합한지 알아보기 위해서 가장 먼저 떠오른것은 성능이었습니다. 아무래도 재고라는게 동시성 이슈를 제거해야하므로 데이터베이스에 부하가 걸릴 수 밖에 없는데, 이로 인해 성능은 꽤 중요한 기준이 될 것 이라고 생각했습니다.

그래서 위 5가지의 경우에 대해서 성능을 비교해봤는데요. 

결과부터 말하면 Redis에서 지원해주는 lua script를 통한 redis에서 재고 차감이 압도적으로 좋았습니다.

아주 간단한 테스트로 진행했으며, 각 프로젝트마다 상황이 다를테니 해당 실험의 결과가 정답이 될 수는 없다는점 참고해주세요.

제가 진행했던 테스트 환경은 아래와 같습니다. 

먼저 스레드풀에 스레드를 10개 생성합니다. 그리고 테스트하고자하는 재고 차감 로직을 호출하는 테스크 1000개를 큐에 추가합니다.

invokeAll을 호출함으로써 여러 테스크들을 동시에 처리하며, 이를 measureNanoTime으로 측정합니다.
```kotlin
        val executor = Executors.newFixedThreadPool(10)
        val tasks = mutableListOf<Callable<Unit>>()

        for (i: Int in 1..1000) {
            tasks.add(Callable {
                stockService.usseStock(1)
            })
        }

        return measureNanoTime {
            executor.invokeAll(tasks)
            executor.shutdown()
        }
```

하지만 복잡도를 줄이기 위해서 하나의 옵션은 여러개의
레디스의 루아 스크립트를 활용했을 때
0.1~0.15초 사이

MySQL의 비관적락을 활용했을 때
3~3.5초 사이


---
정상 동작
fun redisWithLock() {
val lock: RLock = redissonClient.getLock("lock:stock:1")

        try {
            while (!lock.tryLock(100, 100, TimeUnit.SECONDS)) {
                println("레디스 락 획득 실패")
                Thread.sleep(50)
            }

            updateStock()

        } catch (e: Exception) {
            println("예외 발생: ${e.message}")
        } finally {
            if (lock.isHeldByCurrentThread) {
                lock.unlock()
            }
        }
    }

    @Transactional
    fun updateStock() {
        val stock = stockRepository.findById(1).get()
        stock.reduceStock()
        stockRepository.save(stock)
    }
---

---
비정상
@Transactional
fun redisWithLock() {
val lock: RLock = redissonClient.getLock("lock:stock:1")

        try {
            while (!lock.tryLock(100, 100, TimeUnit.SECONDS)) { // (2)
                try {
                    println("레디스 락 획득 실패")
                    Thread.sleep(50)
                } catch (e: InterruptedException) {
                    throw RuntimeException(e)
                }
            }
            println("레디스 락 획득 성공")
            val stock = stockRepository.findById(1).get()
            println("현재 재고: ${stock.remainQuantity}")
            stock.reduceStock()
            println("재고 차감 후: ${stock.remainQuantity}")
            stockRepository.save(stock)
        } catch (e: Exception) {
            println("예외 발생")
        } finally {
            if (lock.isHeldByCurrentThread) {
                lock.unlock()
            }
        }
    }
---


application과 domain 모듈을 분리함으로써 모듈간에 DTO로 통신.
개발생산성 저하
도메인간의 데이터 일관성이 꼭 필요한경우 도메인 서비스에서 로직을 묶어준다.
이는 도메인간의 결합도 상승

한 화면에서 여러 도메인의 정보가 필요 -> 클라이언트에게 여러번 네트워크를 타도록 요청

---
여행자 시스템과 파트너 시스템을 분리
