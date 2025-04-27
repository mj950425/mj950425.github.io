---
layout: post
title: “테스트 더블”
date: 2025-04-27 08:46:00 +0900
categories:
  - jvm-lang
description: >
  ‘Spring WebFlux와 Reactive Streams의 관계 정리’
---

# Spring WebFlux와 Reactive Streams의 관계 정리

최근 WebFlux에 대해서 공부하려고하는데, Reactive Streams라는 개념이 필수적으로 나온다.

두 개념은 비슷해 보이지만, 정확히 어떤 역할을 하는지 구분할 필요가 있다.

Reactive Streams는 무엇이고, WebFlux는 어떤 위치에 있으며, 둘이 어떻게 연결되는지 깔끔하게 정리해봤다.

# Reactive Streams란 무엇인가?

Reactive Streams는 간단히 말하면, 비동기 데이터 흐름을 표준화한 인터페이스 스펙이다.

Reactive Streams가 정의하는 것은 크게 4가지다.
- **Publisher**: 데이터를 발행하는 주체
- **Subscriber**: 발행된 데이터를 받아 처리하는 주체
- **Subscription**: Publisher와 Subscriber 간의 연결과 흐름 제어
- **Backpressure**: 소비자가 감당할 수 있는 데이터 양만 요청할 수 있게 하여 과부하를 방지하는 메커니즘

중요한 점은, Reactive Streams는 **구현체가 아니라, 인터페이스만 제공하는 스펙**이라는 것이다.

즉, “데이터를 어떻게 보내고 받을 것인가”를 정리해놓은 스펙일 뿐이다.

```

public interface Publisher<T> {
    void subscribe(Subscriber<? super T> s);
}

```

```

public interface Subscriber<T> {
    void onSubscribe(Subscription s);
    void onNext(T t);
    void onError(Throwable t);
    void onComplete();
}
```

# 그렇다면 WebFlux는 무엇인가?

Spring WebFlux는 이 Reactive Streams 스펙을 웹 애플리케이션 레벨에 적용한 프레임워크다.

WebFlux는 기본적으로 HTTP 요청과 응답을 Reactive Streams 방식으로 처리한다.

즉, 모든 요청/응답을 Publisher-Subscriber 모델로 다루고, 필요시 Backpressure도 적용할 수 있다.

그리고 WebFlux가 Reactive Streams를 실제로 사용하기 위해 내부적으로 활용하는 구현체가 있다.

바로 Project Reactor다. (Mono, Flux를 제공하는 라이브러리)

WebFlux는 데이터 스트림을 처리할 때 Project Reactor를 기반으로 하고,

HTTP 서버 동작 자체는 Netty 같은 논블로킹 서버 엔진을 이용한다.

# Non-blocking은 어떻게 연결되는가?

WebFlux는 또한 논블로킹 모델을 기반으로 동작한다.

이 말은, HTTP 요청을 처리하는 스레드가 **I/O 작업(DB, 외부 API, 파일 처리 등)**을 기다리면서 멈춰 있지 않고, 즉시 다른 작업을 처리할 수 있도록 구성된다는 것이다.

여기서 논블로킹 처리를 실제로 가능하게 하는 것이 Netty 같은 네트워크 라이브러리다.

Netty는 내부적으로 epoll 같은 커널 레벨 논블로킹 이벤트 처리를 사용한다.

정리하면, 아래와 같다.

- Reactive Streams → 데이터 흐름 스펙
- Project Reactor → Reactive Streams 구현체 (Flux, Mono)
- Netty/Epoll → 논블로킹 네트워크 I/O 엔진
- WebFlux → 위 모두를 조합해서 HTTP 요청/응답 논블로킹 처리
