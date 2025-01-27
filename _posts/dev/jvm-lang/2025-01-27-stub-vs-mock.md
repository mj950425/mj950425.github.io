---
layout: post
title: “Mock vs Stub”
date: 2025-01-27 08:46:00 +0900
categories:
  - jvm-lang
description: >
  ‘테스트 더블의 개념과 종류’
---

# 테스트 더블

# 테스트 더블이란?

테스트 더블(Test Double)은 테스트를 위해 실제 객체 대신 사용하는 모든 가짜 객체를 의미합니다.
주로 아래 다섯 가지 유형으로 구분됩니다:

- 더미 (Dummy)
- 스텁 (Stub)
- 목 (Mock)
- 페이크 (Fake)
- 스파이 (Spy)

## 1. 더미 (Dummy)

더미는 메서드 호출을 위해 필요하지만 실제로 사용되지는 않는 객체입니다.
값이 비어 있거나 사용되지 않는 객체로, 주로 컴파일 에러를 방지하기 위해 사용됩니다.

```java
// 예: 더미 객체
User dummyUser = null; // 테스트에서 사용되지 않음
service.register(dummyUser);
```

## 2. 스텁 (Stub)

스텁은 특정 메서드 호출에 대해 고정된 응답값을 반환하도록 설정된 테스트 더블입니다.
스텁은 반환 값이나 내부 상태를 검증하며 호출 여부나 횟수는 중요하지 않습니다.

```java
// 예: 스텁으로 동작하는 Repository
when(repository.findById(1L)).thenReturn(new User("test", "tester"));

// UserService의 로직이 findById 반환 값을 잘 처리하는지 상태만 검증
User user = userService.getUserById(1L);
assertEquals("test", user.getName());
```

## 3. 목 (Mock)

목은 특정 메서드가 호출되었는지, 몇 번 호출되었는지, 어떤 인자로 호출되었는지 등의 행위를 검증하는 데 사용됩니다.

```java
// 예: Mock으로 NotificationService 검증
userService.createUser("tester");

// createUser 로직에서 notificationService.sendNotification()이 정확히 호출되었는지 검증
verify(notificationService, times(1)).sendNotification(any(User.class));
```

## 4. 페이크 (Fake)

페이크는 실제 구현과 비슷하지만, 단순화된 방식으로 동작하는 객체입니다.
외부 시스템 의존성을 제거하면서 실제 동작을 테스트할 때 유용합니다.

```java
// 예: FakeRepository
class FakeUserRepository implements UserRepository {
private Map<Long, User> database = new HashMap<>();

    public User findById(Long id) {
        return database.get(id); // 간단한 in-memory 동작
    }
    
    public void save(User user) {
        database.put(user.getId(), user);
    }
}

// FakeUserRepository로 UserService 테스트
userRepository = new FakeUserRepository();
userService = new UserService(userRepository);
userService.createUser("test");
```

## 5. 스파이 (Spy)

스파이는 실제 객체를 래핑하여 사용하며, 메서드를 그대로 호출하면서도 스텁처럼 특정 메서드를 오버라이딩하거나 목처럼 행위를 검증할 수도 있습니다.

# Mockito의 Mock: 스텁인가, 목인가?

테스트에서 Stub과 Mock이라는 용어는 빈번히 등장합니다.
실무에서는 두 용어의 구분이 크게 중요하지 않을 수 있지만, 두 개념의 차이를 이해하면 다른 참고 자료를 읽을 때 도움이 됩니다.

- Stub: “이 메서드가 호출되면 고정된 값을 반환해야 한다”와 같은 고정 동작을 설정하며, 결과를 검증하는 데 초점이 맞춰져 있습니다.
- Mock: “이 함수가 호출되었는가? 몇 번 호출되었는가? 어떤 파라미터로 호출되었는가?“와 같은 행위 검증에 사용됩니다.

Mockito와 같은 프레임워크에서는 when(...).thenReturn(...)으로 Stub 동작을 설정할 수 있으며, 동시에 verify()를 통해 Mock 동작도 지원합니다.

즉, Mock 객체는 Stub 역할과 행위 검증을 모두 수행할 수 있습니다.

반환 값만 검증한다면 Stub 용도로 사용한 것입니다.

반대로 호출 여부나 횟수, 파라미터를 검증한다면 Mock으로 사용한 것입니다.

# Fake vs Mock/Stub 비교

| **특징**        | **Fake**                                       | **Mock (Stub 포함)**                                        |
|---------------|------------------------------------------------|-----------------------------------------------------------|
| **재사용성**      | ✅ 한 번 작성하면 여러 테스트에서 상태 기반으로 재사용 가능             | ❌ 테스트마다 동작 설정 필요 (설정 반복됨)                                 |
| **구현 비용**     | ❌ 실제 동작과 비슷하게 만들어야 하므로 초기 구현 비용이 높을 수 있음       | ✅ Mock 객체 생성 후 반환 값만 설정하면 되므로 구현 비용이 낮음                   |
| **설정의 복잡성**   | ✅ 상태 기반으로 동작하므로 추가 설정이 필요 없음                   | ❌ 테스트마다 `when(...).thenReturn(...)` 설정이 필요해 가독성이 떨어질 수 있음 |
| **행위 검증**     | ❌ 호출 여부, 횟수 검증 불가능                             | ✅ 특정 메서드 호출 여부나 횟수 검증 가능                                  |
| **상태 변화 검증**  | ✅ 상태를 관리하므로 CRUD 로직이나 상태 변화 검증에 적합             | ❌ 상태 변화보다는 반환 값과 행위 검증에 초점                                |
| **외부 의존성 제거** | ❌ Fake은 실제 객체처럼 동작하므로 외부 시스템의 복잡성을 일부 포함할 수 있음 | ✅ 완전히 격리된 Mock 객체를 사용하므로 외부 의존성을 완벽히 제거                   |
| **유지보수성**     | ✅ 리팩토링 시 코드 변경 영향을 덜 받음                        | ❌ 코드 리팩토링 시 Mock 테스트가 쉽게 깨질 수 있음                          |