---
layout: post
title: "트랜잭션이 길어지면서 발생할 수 있는 이슈"
date: 2025-02-20 08:46:00 +0900
categories:
  - database
description: >
  '대량의 UPDATE 트랜잭션 시 발생할 수 있는 문제와 해결 방안'
---

## 트랜잭션이 길어지면서 발생할 수 있는 이슈

데이터베이스에서 대량의 레코드를 배치로 업데이트할 때, 트랜잭션을 적절히 관리하지 않으면 예기치 않은 문제가 발생할 수 있습니다.

최근 저희 팀의 특정 서비스에서 10만 개의 레코드를 단일 트랜잭션으로 업데이트하다가 트랜잭션이 장시간 유지되어 오류가 발생했습니다.

이 글에서는 해당 문제의 발생 원인과 관련 내용을 상세히 살펴보겠습니다.

## MySQL InnoDB의 MVCC와 베타락 메커니즘

### MVCC(Multi-Version Concurrency Control)

InnoDB는 MVCC를 통해 데이터베이스의 일관성과 동시성을 관리합니다. MVCC의 핵심 원리는 다음과 같습니다.

1. **데이터 버전 관리**: 원본 데이터를 변경하기 전에 변경 전 데이터를 Undo 로그에 저장합니다. 그 후 실제 테이블 공간의 데이터를 업데이트합니다.
2. **스냅샷 읽기**: 각 트랜잭션은 시작 시점의 일관된 데이터 스냅샷을 보게 됩니다. 이 스냅샷은 Undo 로그에 저장된 이전 버전 데이터를 참조하여 구성됩니다. 다른 트랜잭션이 커밋한 변경 사항이라도, 현재
   트랜잭션 시작 이후에 변경되었다면 보이지 않습니다.

### 베타락(X-lock)과 읽기 작업

베타락은 레코드에 대한 잠금으로, 중요한 특성은 다음과 같습니다.

1. **베타락의 영향**: 베타락이 설정된 레코드는 다른 트랜잭션에서 **읽기는 가능하지만 쓰기는 불가능**합니다.
2. **읽기 작업과 베타락**: InnoDB에서는 일반적인 SELECT 쿼리가 베타락에 의해 차단되지 않습니다. 이는 MVCC 덕분에 가능합니다.
   - 다른 트랜잭션이 레코드를 변경 중이더라도, 읽기 트랜잭션은 Undo 로그에서 이전 버전의 데이터를 참조합니다.
   - 따라서 베타락이 설정되어 있어도 일관된 읽기가 가능합니다.
3. **쓰기 작업과 베타락**: 한 트랜잭션이 베타락을 설정한 레코드에 대해 다른 트랜잭션이 UPDATE를 시도하면, 첫 번째 트랜잭션이 완료될 때까지 대기해야 합니다.

## MySQL의 트랜잭션 격리 수준과 잠금

MySQL에서는 트랜잭션 격리 수준에 따라 레코드 잠금 방식이 달라집니다. 저희 서비스에서는 MySQL의 기본 설정인 `REPEATABLE READ` 격리 수준을
사용하고 있습니다.

`REPEATABLE READ` 격리 수준에서는 UPDATE 쿼리 실행 시 해당 레코드에 베타락을 설정합니다. 이 베타락은 트랜잭션이 완료(COMMIT 또는 ROLLBACK)될 때까지
유지됩니다.

따라서 대량의 레코드를 업데이트하는 트랜잭션이 오래 걸릴 경우, 그 동안 다른 트랜잭션은 해당 레코드에 수정 작업을 할 수 없게 됩니다.

반면, `READ COMMITTED` 격리 수준에서는 UPDATE 작업 후 즉시 잠금을 해제하기 때문에 이러한 문제가 덜 발생할 수 있습니다.

하지만 이 경우 다른 일관성 문제가 발생할 수 있으므로 신중한 선택이 필요합니다.

## InnoDB의 버퍼 풀과 Undo 로그

알아보는김에 InnoDB 엔진의 핵심 구성 요소 두 가지를 더 살펴보겠습니다.

### 버퍼 풀(Buffer Pool)

버퍼 풀은 InnoDB의 메모리 내 캐시로, 데이터베이스 성능에 중요한 역할을 합니다:

1. **메모리 내 데이터 캐싱**: 디스크에서 읽은 테이블과 인덱스 데이터를 메모리에 저장하여 디스크 I/O를 줄입니다.
2. **변경 버퍼링**: 데이터 변경 시 즉시 디스크에 쓰지 않고 버퍼 풀에 변경 사항을 먼저 기록합니다.
3. **지연 쓰기**: 변경된 데이터 페이지(Dirty Page)는 백그라운드 프로세스에 의해 나중에 디스크에 기록됩니다.

### Undo 로그의 역할

Undo 로그는 트랜잭션의 일관성과 격리성을 지원하는 중요한 메커니즘입니다:

1. **데이터 버전 저장**: 레코드가 변경되기 전의 상태를 저장합니다.
2. **트랜잭션 롤백 지원**: 트랜잭션 실패 시 원래 상태로 되돌릴 수 있게 합니다.
3. **MVCC 지원**: 다른 트랜잭션이 변경 중인 데이터에 대해서도 일관된 읽기를 제공합니다.
   - 베타락이 설정된 레코드에 대해 읽기 작업이 가능한 이유는 여기에 있습니다. 읽기 트랜잭션은 Undo 로그의 이전 버전 데이터를 참조하기 때문에 잠금 충돌이 발생하지 않습니다.

## 트랜잭션 리소스 관련 문제

대용량 트랜잭션은 락 문제 외에도 다음과 같은 중요한 리소스 관련 문제를 일으킬 수 있습니다:

1. **트랜잭션 풀 고갈**: MySQL은 동시에 처리할 수 있는 트랜잭션 수가 제한되어 있습니다. 하나의 트랜잭션이 너무 오래 실행되면서 많은 리소스를 점유하면, 트랜잭션 풀이 고갈되어 새로운 트랜잭션을 시작할
   수 없게 될 수 있습니다.
2. **메모리 사용량 증가**:
   - 큰 트랜잭션은 변경된 모든, 많은 레코드에 대한 정보를 메모리에 유지해야 합니다.
   - Undo 로그가 크게 증가하여 시스템 메모리를 과도하게 사용할 수 있습니다.
3. **데드락 가능성 증가**: 많은 레코드를 수정하는 큰 트랜잭션은 데드락 발생 가능성을 높입니다. 특히 여러 대용량 트랜잭션이 동시에 실행될 경우 더욱 그렇습니다.

이러한 이유로 대용량 데이터 처리는 가능한 작은 단위의 트랜잭션으로 나누어 실행하는 것이 바람직합니다.

## 문제 진단 방법

MySQL에서 현재 실행 중인 쿼리와 잠금 상태를 확인하는 방법.

```sql
SHOW
PROCESSLIST;
```

이 명령어를 통해 현재 실행 중인 모든 쿼리를 확인할 수 있으며, 문제가 되는 장기 실행 쿼리를 식별할 수 있습니다.

또한, InnoDB 엔진에서는 잠금 타임아웃을 설정할 수 있습니다. 저희 서비스에서는 이 값이 50초로 설정되어 있었고, 그 이상 대기하면서 에러가 발생했습니다.

## 해결 방안

1. **트랜잭션 크기 제한**: 한 번에 업데이트하는 레코드 수를 제한하고, 여러 작은 트랜잭션으로 나누어 실행합니다. 예를 들어, 10,000개 대신 1,000개씩 10번의 트랜잭션으로 나누는 방식입니다.
2. **격리 수준 조정**: 필요에 따라 격리 수준을 `READ COMMITTED`로 낮추는 것을 검토합니다. 단, 일관성 요구사항을 먼저 확인해야 합니다.
3. **잠금 타임아웃 조정**: 필요한 경우 `innodb_lock_wait_timeout` 값을 조정합니다.

저희 서비스에서 마주한 상황에서 적절한 방법은 1번 입니다.

## 베타락과 트랜잭션 동작 흐름

대용량 UPDATE 작업에서 트랜잭션과 잠금 동작 흐름을 좀 더 상세히 살펴보겠습니다.

1. **UPDATE 작업 시작**:
   - 트랜잭션이 시작되고 해당 레코드에 베타락(X-lock)이 설정됩니다.
   - 원본 데이터는 Undo 로그에 저장됩니다.
   - 변경된 데이터는 버퍼 풀에 있는 페이지에 적용됩니다.
   - 변경 내용은 Redo 로그에 기록됩니다.
2. **다른 트랜잭션의 접근**:
   - **읽기 작업**: 베타락이 걸린 레코드에 대해 SELECT 쿼리는 Undo 로그의 이전 버전을 참조하여 차단 없이 진행됩니다.
   - **쓰기 작업**: 다른 트랜잭션이 동일한 레코드를 변경하려고 하면, 첫 번째 트랜잭션이 완료될 때까지 대기합니다.
   - 이 대기 시간이 `innodb_lock_wait_timeout` 값(저희 서비스는 50초)을 초과하면 에러가 발생합니다.
3. **트랜잭션 완료**:
   - 트랜잭션이 커밋되면 베타락이 해제되고, 다른 대기 중인 트랜잭션이 진행될 수 있습니다.
   - 변경된 데이터 페이지는 시스템 부하에 따라 나중에 디스크에 기록됩니다.

## 결론

대용량 데이터 업데이트 작업은 데이터베이스의 성능과 가용성에 큰 영향을 미칠 수 있습니다.

트랜잭션의 크기를 적절히 관리하고, 데이터베이스의 잠금 메커니즘을 이해하는 것이 중요합니다.