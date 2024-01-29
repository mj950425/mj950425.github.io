---
layout: post
title: "재고 시스템을 개발하면서 만난 엔티티 매니저와 DBCP 관련 이슈"
date: 2024-01-23 08:46:00 +0900
categories:
  - experience
  - project
description: >
  '재고 시스템을 개발하면서 만난 엔티티 매니저와 DBCP 관련 이슈를 해결한 기록입니다.'
---

# 재고 시스템을 개발하면서 만난 엔티티 매니저와 DBCP 관련 이슈
![img.png](/assets/img/experience/project/dbcp-problem/img_7.png)

## 개요

최근 밤 늦게까지 회사 프로젝트를 진행하면서 정말 바쁘게 살아가고 있는데요. ~~개인적으로는 즐겁습니다?~~ 

저는 역시 무언가 생산적인 일을 하면 행복한 것 같습니다.

현재 투어 티켓의 재고 시스템을 구축하는 프로젝트를 맡았는데요.

해당 시스템의 기능중에 락을 점유하고 재고를 차감하는 로직을 개발하다가, 마주한 아래 두 가지 장애 상황을 기록해보려고 합니다.

1. **OSIV로 인한 엔티티 매니저 공유**
2. **긴 트랜잭션으로 인한 DBCP의 커낵션 고갈** 

## 첫번째 장애 원인 : OSIV로 인한 엔티티 매니저 공유 

락을 어떻게 점유할지에 대해 깊게 논의한 적이 있습니다.

결론적으로, 현재 상황을 고려하여 데이터베이스의 CPU 사용률이 불안정하므로 데이터베이스 부하를 최소화하기 위해 레디스에서 락을 최대한 관리하는 방식으로 결정되었습니다.

레디스 클라이언트로는 Redisson을 활용했습니다. Redisson은 Lettuce보다 성능이 우수하고 락을 쉽게 점유할 수 있도록 제공하기 때문에 이를 선택했습니다.

레디스의 락 점유에 대한 내부 동작은 [여기](https://mj950425.github.io/db/redisson-lock/)에서 확인하실 수 있습니다.

특정 어노테이션이 붙은 메소드가 실행될 때, AOP가 이를 감지하고 런타임에 SpringEL을 통해 여러 키를 기준으로 락을 점유한 뒤 실제 재고 차감 메소드를 실행하도록 구성했습니다.

또한, 애플리케이션에서 데이터 정합성을 유지하는 것 외에도, 데이터베이스에서도 정합성을 유지하기 위해 낙관적 락을 사용했습니다.

간단한 POC 코드는 아래 개인 [깃헙](https://github.com/mj950425/lock-performance-test)에서 확인하실 수 있습니다.

### 도메인 로직 흐름
먼저, 재고 차감에 대한 도메인 로직 흐름은 다음과 같습니다.

1. 옵션 아이디를 기준으로 재고 차감 요청을 받습니다.
2. 옵션 아이디를 기준으로 해당 재고를 찾습니다.
3. 찾은 재고를 기반으로 재고 ID를 추출하여 락을 점유합니다.
4. 재고를 차감합니다.

### 객체 레벨에서의 흐름
객체 레벨에서 런타임 흐름은 아래와 같습니다. 

1. FacadeService가 재고 차감 요청을 받습니다. (FacadeService는 트랜잭션 분리를 위한 관리 클래스입니다)
2. FacadeService는 **1번 트랜잭션**을 시작하고, ExtractService에게 옵션 아이디를 기준으로 재고를 조회하도록 요청한 후 재고 ID를 결과를 받습니다.
3. FacadeService는 받은 재고 ID를 기반으로 StockService에게 재고 차감을 요청합니다.
4. DistributionLockAroundAspect가 이 요청을 가로챕니다. (DistributionLockAroundAspect는 AOP입니다)
5. DistributionLockAroundAspect는 락을 점유하고, 락을 획득하면 **2번 트랜잭션**을 시작하여 StockService에게 재고 차감을 요청합니다.
6. StockService는 재고 ID를 기반으로 **재고를 다시 조회**하고 차감합니다.

### 기대했던 시나리오
특정 옵션에 대한 남은 재고량이 10개이고, 2개의 스레드가 각각 5개씩 재고를 차감하는 상황을 가정해봅시다. 

기대한 바대로 동작한다면, 멀티 스레드 환경에서 데이터 정합성이 아래와 같이 유지되어야 합니다:

- <span style="color:blue"> 1번 스레드 </span> : FacadeService가 재고 차감 요청을 받습니다.
- <span style="color:blue"> 1번 스레드 </span> : FacadeService는 1번 트랜잭션을 시작하고, ExtractService에게 재고를 조회하도록 요청한 후 재고 ID를 받습니다.
- <span style="color:red"> 2번 스레드 </span> : FacadeService가 재고 차감 요청을 받습니다.
- <span style="color:red"> 2번 스레드 </span> : FacadeService는 1번 트랜잭션을 시작하고, ExtractService에게 재고를 조회하도록 요청한 후 재고 ID를 받습니다.
- <span style="color:blue"> 1번 스레드 </span> : FacadeService는 받은 재고 ID를 기반으로 StockService에게 재고 차감을 요청합니다.
- <span style="color:blue"> 1번 스레드 </span> : DistributionLockAroundAspect가 이 요청을 가로챕니다.
- <span style="color:blue"> 1번 스레드 </span> : DistributionLockAroundAspect는 락을 점유하고, 락을 획득하면 2번 트랜잭션을 시작하여 StockService에게 재고 차감을 요청합니다.
- <span style="color:blue"> 1번 스레드 </span> : StockService는 재고 ID를 기반으로 재고를 다시 조회하고 차감합니다. 결과적으로 10개에서 5개를 차감하여 5개가 남습니다.
- <span style="color:red"> 2번 스레드 </span> : FacadeService는 받은 재고 ID를 기반으로 StockService에게 재고 차감을 요청합니다.
- <span style="color:red"> 2번 스레드 </span> : DistributionLockAroundAspect가 이 요청을 가로챕니다.
- <span style="color:red"> 2번 스레드 </span> : DistributionLockAroundAspect는 락을 점유하고, 락을 획득하면 2번 트랜잭션을 시작하여 StockService에게 재고 차감을 요청합니다.
- <span style="color:red"> 2번 스레드 </span> : StockService는 재고 ID를 기반으로 재고를 다시 조회하고 차감합니다. 1번 스레드가 이미 차감했기 때문에 남은 재고량은 5개이고, 이를 차감하면 0개가 남습니다.

그림으로 보면 아래와 같습니다.
![img.png](/assets/img/experience/project/dbcp-problem/img_1.png)

하지만 실제 멀티스레드 환경에서는 OptimisticLockingFailException이 발생했으며, 이는 데이터베이스 레벨에서 정합성 체크에 실패한 결과입니다. 이는 서버 장애로 이어졌습니다.

## 장애의 근본적인 원인은?
장애 원인을 분석한 결과, 도메인 로직 흐름에서 생성된 두 개의 트랜잭션이 같은 엔티티 매니저를 사용한다는 것을 알게 되었습니다. 

즉, 두 개의 트랜잭션이 같은 SessionImpl의 메모리 주소를 사용하고 있었습니다.

이로 인해 데이터 정합성이 깨지는 현상을 'lost update'로 추측할 수 있었습니다. 자세한 현상은 아래와 같습니다:

- <span style="color:blue"> 1번 스레드 </span> : FacadeService가 재고 차감 요청을 받습니다.
- <span style="color:blue"> 1번 스레드 </span> : FacadeService는 1번 트랜잭션을 시작하고, ExtractService에게 재고를 조회하도록 요청한 후 재고 ID를 받습니다.
- <span style="color:red"> 2번 스레드 </span> : FacadeService가 재고 차감 요청을 받습니다.
- <span style="color:red"> 2번 스레드 </span> : FacadeService는 1번 트랜잭션을 시작하고, ExtractService에게 재고를 조회하도록 요청한 후 재고 ID를 받습니다. (사실 이때 엔티티 매니저의 1차 캐시에 값이 캐싱됩니다)
- <span style="color:blue"> 1번 스레드 </span> : FacadeService는 받은 재고 ID를 기반으로 StockService에게 재고 차감을 요청합니다.
- <span style="color:blue"> 1번 스레드 </span> : DistributionLockAroundAspect가 이 요청을 가로챕니다.
- <span style="color:blue"> 1번 스레드 </span> : DistributionLockAroundAspect는 락을 점유하고, 락을 획득하면 2번 트랜잭션을 시작하여 StockService에게 재고 차감을 요청합니다.
- <span style="color:blue"> 1번 스레드 </span> : StockService는 재고 ID를 기반으로 재고를 다시 조회하고 차감합니다.
- <span style="color:red"> 2번 스레드 </span> : FacadeService는 받은 재고 ID를 기반으로 StockService에게 재고 차감을 요청합니다.
- <span style="color:red"> 2번 스레드 </span> : DistributionLockAroundAspect가 이 요청을 가로챕니다.
- <span style="color:red"> 2번 스레드 </span> : DistributionLockAroundAspect는 락을 점유하고, 락을 획득하면 2번 트랜잭션을 시작하여 StockService에게 재고 차감을 요청합니다.
- <span style="color:red"> 2번 스레드 </span> : [핵심 부분] StockService는 엔티티 매니저가 1번 트랜잭션과 공유되므로 재고 조회 시 캐싱된 값을 가져옵니다. 이때 캐싱된 값에는 재고량이 10개이므로, 10개에서 5개를 차감하여 5개가 남습니다. 결과적으로 1번 스레드의 업데이트 결과가 사라집니다.

그림으로 보면 아래와 같습니다.
![img.png](/assets/img/experience/project/dbcp-problem/img.png)

## 엔티티 매니저가 재사용된 원인은?
엔티티 매니저가 재사용되었던 원인은 OSIV (Open Session In View) 때문이었습니다. 

JPA의 EntityManager는 Hibernate에서 Session이라고 불리며, Open Session In View를 해석하면 엔티티 매니저를 열어두겠다는 의미입니다. 

즉, 트랜잭션이 끝나도 엔티티 매니저를 유지하겠다는 것입니다.

![img.png](/assets/img/experience/project/dbcp-problem/img_2.png)

OSIV 설정이 기본값으로 true로 설정되어 있어, 1번 트랜잭션의 엔티티 매니저가 2번 트랜잭션까지 유지되고 있었습니다. 

프로젝트의 다른 서비스 코드에서 이 값에 의존하는 로직은 없었고, OSIV 값을 false로 설정하자 해당 에러가 사라졌습니다.

더 근본적인 원인은, 재고 ID를 기반으로 분산락을 걸기 위해 재고 조회 시점을 두 번으로 분리한 것입니다. 

사실 비관적 락을 사용하면 MySQL에서는 재고 ID를 조회하는 시점부터 X-Lock을 걸어 다른 스레드에서의 재고 조회를 불가능하게 만듭니다.

이로 인해 lost update 현상은 발생하지 않지만, 동시성 제어가 떨어지는 단점이 있습니다.

## 두번째 장애 원인 : 긴 트랜잭션으로 인한 DBCP의 커낵션 고갈

lost update 현상은 더 이상 발생하지 않았습니다. 

하지만 새로운 문제에 직면했습니다. 

POC에서는 어느 정도 성능을 보장했던 코드가 실 서비스로 옮기며 비즈니스 로직 추가와 아키텍처에 맞게 조정하자 성능이 크게 저하되었습니다.

변인 통제를 통해 POC 코드와 실 서비스 코드를 성능 테스트하며 비교했습니다. 

결론적으로 문제의 원인은 실 서비스 코드 내 응용 계층의 @Transactional 어노테이션이었습니다.

이 프로젝트의 구조에서 응용 계층과 도메인 계층은 물리적으로 분리되어 있습니다. 

다른 도메인과 통신하며 흐름을 제어하는 응용 서비스와 도메인 로직을 실행하는 도메인 서비스가 분리되어 있죠. 

프로세스 흐름은 다음과 같습니다.

- 예약 도메인에서 재고 차감 요청 -> StockApplication이 요청을 받아 전달 -> FacadeService가 요청을 받아 앞서 언급된 흐름으로 재고 차감

응용 서비스인 StockApplication에 붙어있던 @Transactional 어노테이션을 제거하니 POC와 비슷한 성능을 보여주는것을 확인했습니다.

## 두번째 장애의 원인은?

응용 서비스에 @Transactional 어노테이션이 있을 때와 없을 때의 상황을 다음 설정을 통해 로그로 남겨 분석했습니다.

```
logging:
    level:
        com.zaxxer.hikari: DEBUG
        com.zaxxer.hikari.HikariConfig: DEBUG
        org.springframework: DEBUG
```

### 먼저 응용 서비스에 트랜잭션이 없는 경우입니다

아래는 트랜잭션 어노테이션이 없는 경우의 특정 요청에 대한 로그입니다.
```
2024-01-23 20:17:28 | DEBUG | DispatcherServlet                  :120  | [http-nio-8080-exec-2] POST "/test/1", parameters={}
2024-01-23 20:17:28 | DEBUG | RequestMappingHandlerMapping       :522  | [http-nio-8080-exec-2] Mapped to com.myrealtrip.traveler.api.TestStockController#testOne()
2024-01-23 20:17:28 | INFO  | RequestLoggingInterceptor          :24   | [http-nio-8080-exec-2] POST /test/1 request start  
2024-01-23 20:17:28 | DEBUG | JpaTransactionManager              :370  | [http-nio-8080-exec-2] Creating new transaction with name [com.myrealtrip.domain.stock.service.ExtractStockDeltaAggregateService.extractStockDelta]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
2024-01-23 20:17:28 | DEBUG | JpaTransactionManager              :412  | [http-nio-8080-exec-2] Opened new EntityManager [SessionImpl(427481601<open>)] for JPA transaction
2024-01-23 20:17:28 | DEBUG | DataSourceUtils                    :188  | [http-nio-8080-exec-2] Setting JDBC Connection [HikariProxyConnection@858364735 wrapping com.mysql.cj.jdbc.ConnectionImpl@31d791c0] read-only
2024-01-23 20:17:28 | DEBUG | JpaTransactionManager              :440  | [http-nio-8080-exec-2] Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@711e899f]
2024-01-23 20:17:28 | DEBUG | JpaTransactionManager              :740  | [http-nio-8080-exec-2] Initiating transaction commit
2024-01-23 20:17:28 | DEBUG | JpaTransactionManager              :557  | [http-nio-8080-exec-2] Committing JPA transaction on EntityManager [SessionImpl(427481601<open>)]
2024-01-23 20:17:28 | DEBUG | DataSourceUtils                    :252  | [http-nio-8080-exec-2] Resetting read-only flag of JDBC Connection [HikariProxyConnection@858364735 wrapping com.mysql.cj.jdbc.ConnectionImpl@31d791c0]
2024-01-23 20:17:28 | DEBUG | JpaTransactionManager              :648  | [http-nio-8080-exec-2] Closing JPA EntityManager [SessionImpl(427481601<open>)] after transaction
2024-01-23 20:17:28 | DEBUG | JpaTransactionManager              :370  | [http-nio-8080-exec-2] Creating new transaction with name [com.myrealtrip.infra.stock.DistributionLockTransactionProxy.proceed]: PROPAGATION_REQUIRES_NEW,ISOLATION_DEFAULT
2024-01-23 20:17:28 | DEBUG | JpaTransactionManager              :412  | [http-nio-8080-exec-2] Opened new EntityManager [SessionImpl(1585616902<open>)] for JPA transaction
2024-01-23 20:17:28 | DEBUG | JpaTransactionManager              :440  | [http-nio-8080-exec-2] Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@7b2a5cce]
2024-01-23 20:17:28 | DEBUG | JpaTransactionManager              :375  | [http-nio-8080-exec-2] Found thread-bound EntityManager [SessionImpl(1585616902<open>)] for JPA transaction
2024-01-23 20:17:28 | DEBUG | JpaTransactionManager              :470  | [http-nio-8080-exec-2] Participating in existing transaction
2024-01-23 20:17:28 | DEBUG | AuditingHandlerSupport             :144  | [http-nio-8080-exec-2] Touched com.myrealtrip.domain.stock.entity.StockHistory@63d1fab9 - Last modification at 2024-01-23T20:17:28.701489 by UNKNOWN
2024-01-23 20:17:28 | DEBUG | JpaTransactionManager              :740  | [http-nio-8080-exec-2] Initiating transaction commit
2024-01-23 20:17:28 | DEBUG | JpaTransactionManager              :557  | [http-nio-8080-exec-2] Committing JPA transaction on EntityManager [SessionImpl(1585616902<open>)]
2024-01-23 20:17:28 | DEBUG | AuditingHandlerSupport             :144  | [http-nio-8080-exec-2] Touched com.myrealtrip.domain.stock.entity.Stock@515c92b - Last modification at 2024-01-23T20:17:28.747252 by UNKNOWN
2024-01-23 20:17:28 | DEBUG | JpaTransactionManager              :648  | [http-nio-8080-exec-2] Closing JPA EntityManager [SessionImpl(1585616902<open>)] after transaction
2024-01-23 20:17:28 | DEBUG | RequestResponseBodyMethodProcessor :268  | [http-nio-8080-exec-2] Using 'application/json', given [*/*] and supported [application/json, application/*+json, application/json, application/*+json, application/cbor]
2024-01-23 20:17:28 | DEBUG | RequestResponseBodyMethodProcessor :298  | [http-nio-8080-exec-2] Nothing to write: null body
2024-01-23 20:17:28 | DEBUG | DispatcherServlet                  :1131 | [http-nio-8080-exec-2] Completed 200 OK
```

정리해보면 아래와 같습니다.

1. 응용 서비스 시작
2. FacadeService에 요청을 전달
3. ExtractService 재고 아이디 조회 시작(1번 트랜잭션 시작)
    - 2024-01-23 20:17:28 | DEBUG | JpaTransactionManager              :370  | [http-nio-8080-exec-2] Creating new transaction with name [com.myrealtrip.domain.stock.service.ExtractStockDeltaAggregateService.extractStockDelta]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
4. 재고 아이디 조회 종료(1번 트랜잭션 종료)
   - 2024-01-23 20:17:28 | DEBUG | JpaTransactionManager              :557  | [http-nio-8080-exec-2] Committing JPA transaction on EntityManager [SessionImpl(427481601<open>)]
5. AOP 클래스 락 점유 시작(2번 트랜잭션 시작)
   - 2024-01-23 20:17:28 | DEBUG | JpaTransactionManager              :370  | [http-nio-8080-exec-2] Creating new transaction with name [com.myrealtrip.infra.stock.DistributionLockTransactionProxy.proceed]: PROPAGATION_REQUIRES_NEW,ISOLATION_DEFAULT
6. 재고 차감 및 히스토리 기록 후 종료(2번 트랜잭션 종료)
   - 2024-01-23 20:17:28 | DEBUG | JpaTransactionManager              :557  | [http-nio-8080-exec-2] Committing JPA transaction on EntityManager [SessionImpl(1585616902<open>)]

### 다음으로 응용 서비스에 트랜잭션이 있는 경우입니다

아래는 트랜잭션 어노테이션이 있는 경우의 특정 요청에 대한 로그입니다.
```
2024-01-23 20:12:26 | DEBUG | DispatcherServlet                  :120  | [http-nio-8080-exec-40] POST "/test/1", parameters={}
2024-01-23 20:12:26 | DEBUG | RequestMappingHandlerMapping       :522  | [http-nio-8080-exec-40] Mapped to com.myrealtrip.traveler.api.TestStockController#testOne()
2024-01-23 20:12:26 | INFO  | RequestLoggingInterceptor          :24   | [http-nio-8080-exec-40] POST /test/1 request start  
2024-01-23 20:12:26 | DEBUG | JpaTransactionManager              :370  | [http-nio-8080-exec-40] Creating new transaction with name [com.myrealtrip.traveler.application.stock.service.InternalStockReservationApplication.reduceStock]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
2024-01-23 20:12:26 | DEBUG | JpaTransactionManager              :412  | [http-nio-8080-exec-40] Opened new EntityManager [SessionImpl(1805152885<open>)] for JPA transaction
2024-01-23 20:12:26 | DEBUG | JpaTransactionManager              :440  | [http-nio-8080-exec-40] Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@120500ba]
2024-01-23 20:12:26 | DEBUG | JpaTransactionManager              :375  | [http-nio-8080-exec-40] Found thread-bound EntityManager [SessionImpl(1805152885<open>)] for JPA transaction
2024-01-23 20:12:26 | DEBUG | JpaTransactionManager              :470  | [http-nio-8080-exec-40] Participating in existing transaction
2024-01-23 20:12:26 | DEBUG | JpaTransactionManager              :375  | [http-nio-8080-exec-40] Found thread-bound EntityManager [SessionImpl(1805152885<open>)] for JPA transaction
2024-01-23 20:12:26 | DEBUG | JpaTransactionManager              :429  | [http-nio-8080-exec-40] Suspending current transaction, creating new transaction with name [com.myrealtrip.infra.stock.DistributionLockTransactionProxy.proceed]
2024-01-23 20:12:26 | DEBUG | JpaTransactionManager              :412  | [http-nio-8080-exec-40] Opened new EntityManager [SessionImpl(1206978763<open>)] for JPA transaction
2024-01-23 20:12:26 | DEBUG | JpaTransactionManager              :440  | [http-nio-8080-exec-40] Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@47046fd3]
2024-01-23 20:12:26 | DEBUG | JpaTransactionManager              :375  | [http-nio-8080-exec-40] Found thread-bound EntityManager [SessionImpl(1206978763<open>)] for JPA transaction
2024-01-23 20:12:26 | DEBUG | JpaTransactionManager              :470  | [http-nio-8080-exec-40] Participating in existing transaction
2024-01-23 20:12:26 | DEBUG | AuditingHandlerSupport             :144  | [http-nio-8080-exec-40] Touched com.myrealtrip.domain.stock.entity.StockHistory@76ee40c5 - Last modification at 2024-01-23T20:12:26.704887 by UNKNOWN
2024-01-23 20:12:26 | DEBUG | JpaTransactionManager              :740  | [http-nio-8080-exec-40] Initiating transaction commit
2024-01-23 20:12:26 | DEBUG | JpaTransactionManager              :557  | [http-nio-8080-exec-40] Committing JPA transaction on EntityManager [SessionImpl(1206978763<open>)]
2024-01-23 20:12:26 | DEBUG | AuditingHandlerSupport             :144  | [http-nio-8080-exec-40] Touched com.myrealtrip.domain.stock.entity.Stock@5a0e0e8c - Last modification at 2024-01-23T20:12:26.711958 by UNKNOWN
2024-01-23 20:12:26 | DEBUG | JpaTransactionManager              :648  | [http-nio-8080-exec-40] Closing JPA EntityManager [SessionImpl(1206978763<open>)] after transaction
2024-01-23 20:12:26 | DEBUG | JpaTransactionManager              :996  | [http-nio-8080-exec-40] Resuming suspended transaction after completion of inner transaction
2024-01-23 20:12:26 | DEBUG | JpaTransactionManager              :740  | [http-nio-8080-exec-40] Initiating transaction commit
2024-01-23 20:12:26 | DEBUG | JpaTransactionManager              :557  | [http-nio-8080-exec-40] Committing JPA transaction on EntityManager [SessionImpl(1805152885<open>)]
2024-01-23 20:12:26 | DEBUG | JpaTransactionManager              :648  | [http-nio-8080-exec-40] Closing JPA EntityManager [SessionImpl(1805152885<open>)] after transaction
2024-01-23 20:12:26 | DEBUG | RequestResponseBodyMethodProcessor :268  | [http-nio-8080-exec-40] Using 'application/json', given [*/*] and supported [application/json, application/*+json, application/json, application/*+json, application/cbor]
2024-01-23 20:12:26 | DEBUG | RequestResponseBodyMethodProcessor :298  | [http-nio-8080-exec-40] Nothing to write: null body
2024-01-23 20:12:26 | DEBUG | DispatcherServlet                  :1131 | [http-nio-8080-exec-40] Completed 200 OK
```

정리해보면 아래와 같습니다.

1. 응용 서비스 시작(1번 트랜잭션 시작)
   - 2024-01-23 20:12:26 | DEBUG | JpaTransactionManager              :370  | [http-nio-8080-exec-40] Creating new transaction with name [com.myrealtrip.traveler.application.stock.service.InternalStockReservationApplication.reduceStock]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
2. FacadeService에 요청을 전달
3. ExtractService 시작(1번 트랜잭션에 참여)
   - 2024-01-23 20:12:26 | DEBUG | JpaTransactionManager              :470  | [http-nio-8080-exec-40] Participating in existing transaction
4. 재고 아이디 조회 종료
5. AOP 클래스 락 점유 시작(1번 트랜잭션 일시중지 및 2번 트랜잭션 시작)
   - 2024-01-23 20:12:26 | DEBUG | JpaTransactionManager              :429  | [http-nio-8080-exec-40] Suspending current transaction, creating new transaction with name [com.myrealtrip.infra.stock.DistributionLockTransactionProxy.proceed]
6. 재고 차감 및 히스토리 기록 후 종료(2번 트랜잭션 종료)
   - 2024-01-23 20:12:26 | DEBUG | JpaTransactionManager              :557  | [http-nio-8080-exec-40] Committing JPA transaction on EntityManager [SessionImpl(1206978763<open>)]
7. 응용 서비스 종료(1번 트랜잭션 종료)
   - 2024-01-23 20:12:26 | DEBUG | JpaTransactionManager              :648  | [http-nio-8080-exec-40] Closing JPA EntityManager [SessionImpl(1805152885<open>)] after transaction

트랜잭션 어노테이션이 있는 경우, 1번과 2번 트랜잭션이 짧게 끊어집니다. 

하지만 트랜잭션 어노테이션이 없는 경우, 1번 트랜잭션이 상대적으로 길게 잡힙니다.

jmeter로 테스트해본 결과로 아래와 같았습니다. (개인 로컬에서 진행한 테스트로 tps와 같은 단위는 측정하지 않았고, 단순히 감으로만 봐주시면 됩니다)

트랜잭션을 짧게 가져간 경우 
**유저 100, loop count 5, lamp up second 1**
그냥 아무런 문제 없이 정상동작합니다.

트랜잭션을 길게 가져간 경우
**유저 50, loop count 1, lamp up second 1**

레디스 락을 얻는데 실패하고, 아래와 같이 커낵션 풀에 대한 로그가 다수 등장합니다.
java.sql.SQLTransientConnectionException: HikariPool-1 - Connection is not available, request timed out after 30005ms.
Wrapped by: org.hibernate.exception.JDBCConnectionException: Unable to acquire JDBC Connection
...

작은 액티브 유저로 요청 시 트랜잭션을 길게 가져가도 성공합니다. 

로그에서도 문제될 만한 부분이 보이지 않았습니다. 

결국, DBCP에 누수가 있거나 비지니스 로직은 이상이 없고, 원인은 트랜잭션이 길게 잡히는 것으로 결론 내렸습니다.

## 마무리
개인적으로 개발하면서 딥다이브하는것을 좋아하는데요.

웹 서비스를 운영하면서 이렇게 딥다이브할 수 있는 경험이 자주 오는것은 아니다보니, 개인적으로 재미있었습니다.

사실 아직 DBCP에 대한 설정 튜닝이나 이러한 부분들이 후행 작업으로 남아있는데요.

마무리까지 잘 진행해서 성공적인 서비스 오픈을 기대해보겠습니다.

![img.png](/assets/img/experience/project/dbcp-problem/img_3.png)
![img.png](/assets/img/experience/project/dbcp-problem/img_4.png)
![img.png](/assets/img/experience/project/dbcp-problem/img_5.png)
![img.png](/assets/img/experience/project/dbcp-problem/img_6.png)




