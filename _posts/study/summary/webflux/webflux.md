# Spring WebFlux의 동작 원리와 epoll 분석

평소 Spring MVC만 사용해보아서, Spring Webflux에 대해서 궁금증이 있었는데요. 

관련된 내용들을 공부하면서 정리해봤습니다.

## 목차

1. [WebFlux란 무엇인가?](#1-webflux란-무엇인가)
2. [WebFlux의 전체적인 동작 흐름](#2-webflux의-전체적인-동작-흐름)
3. [epoll의 작동 원리](#3-epoll의-작동-원리)
4. [예시 코드로 이해하는 WebFlux와 epoll](#4-예시-코드로-이해하는-webflux와-epoll)

## 1. WebFlux란 무엇인가?

Spring WebFlux는 Spring 5에서 도입된 논블로킹 리액티브 웹 프레임워크입니다. 

전통적인 Spring MVC와 비교하면 아래와 같습니다.

- 블로킹 vs 논블로킹 
  - Spring MVC는 서블릿 기반의 동기적이고 블로킹 방식의 요청 처리를 합니다. 반면 WebFlux는 논블로킹 방식으로 동작하여, 스레드가 입출력 작업에 블로킹되지 않습니다.
- 동시성 처리 
  - Spring MVC에서는 요청마다 별도의 스레드가 할당되지만, WebFlux는 소수의 이벤트 루프 스레드를 통해 많은 수의 요청을 처리할 수 있습니다.

## 2. WebFlux의 전체적인 동작 흐름

WebFlux의 내부 동작은 다음과 같은 흐름으로 이루어집니다.

### 1. 사용자로부터 요청이 들어옴

클라이언트가 서버로 HTTP 요청을 보냅니다. 

이 요청은 네트워크를 통해 서버에 도착하며, 서버는 이를 새로운 이벤트로 인식합니다.

- 네트워크 인터페이스: 요청은 TCP/IP 프로토콜을 통해 서버의 네트워크 인터페이스에 도착합니다.
- 소켓 생성: 서버는 새로운 연결을 위한 소켓을 생성하거나, 기존 소켓을 통해 데이터를 수신합니다.

### 2. 이벤트 루프 스레드가 `epoll_wait()`에서 깨어나서 요청을 처리한다

서버는 이벤트 루프 스레드를 통해 여러 입출력 이벤트를 감시하고 있습니다.

- `epoll_wait()` 호출: 이벤트 루프 스레드는 `epoll_wait()`를 호출하여 여러 소켓에서 발생하는 이벤트를 감시하며 대기 상태에 있습니다.
- 이벤트 발생 감지: 새로운 연결 또는 데이터 수신 이벤트가 발생하면, `epoll_wait()`는 해당 이벤트를 반환하고 스레드는 깨어납니다.
- 요청 처리 시작: 스레드는 해당 이벤트를 처리하기 위해 애플리케이션 로직을 실행합니다.

### 3. 요청을 처리하는 도중에 입출력 작업을 만난다

요청 처리 과정에서 데이터베이스 조회, 파일 읽기, 외부 API 호출 등 시간이 오래 걸리는 입출력 작업이 필요할 수 있습니다.

- 논블로킹 입출력 시작: 이러한 작업은 논블로킹 방식으로 시작되며, 즉시 제어권을 반환합니다.
- Mono/Flux 반환: 입출력 작업의 결과를 나타내는 `Mono`나 `Flux`를 반환합니다.
- 콜백 등록: 입출력 작업이 완료되었을 때 실행될 콜백이나 Reactor의 연산자 체인을 등록합니다.

### 4. 이벤트 루프 스레드는 입출력 작업을 시작한 후 다시 `epoll_wait()`에 들어간다

스레드는 입출력 작업이 완료될 때까지 기다리지 않고, 다른 이벤트를 처리하기 위해 다시 `epoll_wait()`를 호출하여 대기 상태로 돌아갑니다.

- 효율적인 자원 활용: 스레드가 특정 작업에 블로킹되지 않으므로, 다른 요청을 처리할 수 있습니다.
- 다중 이벤트 감시: 스레드는 여러 소켓에서 발생하는 이벤트를 동시에 감시합니다.

### 5. 이 때 다시 다른 사용자로부터 요청이 들어온다

다른 클라이언트가 새로운 요청을 보냅니다.

- 새로운 이벤트 발생: 이 요청은 서버에서 또 다른 이벤트로 인식됩니다.
- 이벤트 루프 스레드 깨어남: `epoll_wait()`에서 대기 중이던 스레드는 이 이벤트로 인해 깨어나서 처리합니다.

### 6. 이벤트 루프 스레드는 다시 `epoll_wait()`에서 깨어나서 요청을 처리하고, 처리 후 다시 대기 상태로 빠진다

- 요청 처리: 스레드는 새로운 요청을 처리합니다.
- 재귀적인 흐름: 처리 후에는 다시 `epoll_wait()`를 호출하여 대기 상태로 돌아갑니다.
- 높은 동시성 지원: 이 과정을 통해 스레드는 여러 요청을 효율적으로 처리합니다.

### 7. 이 때, 입출력 데이터가 도착했다는 이벤트를 받는다

이전에 시작한 입출력 작업(예: 데이터베이스 조회)이 완료되면, 해당 작업의 완료 이벤트가 발생합니다.

- 입출력 완료 이벤트: 데이터베이스나 외부 서비스로부터 결과가 도착하면, 이에 대한 이벤트가 발생합니다.
- 이벤트 감지: `epoll_wait()`는 이 이벤트를 반환하고, 스레드는 깨어납니다.

### 8. 이벤트 루프는 `epoll_wait()`에서 깨어나서, 데이터 발행 및 구독 콜백을 처리한다

- 콜백 실행: 스레드는 등록된 콜백이나 Reactor 연산자 체인을 실행하여 입출력 작업의 결과를 처리합니다.
- 응답 생성 및 전송: 처리 결과를 기반으로 클라이언트에게 응답을 생성하고 전송합니다.
- 다시 대기 상태로: 작업이 완료되면 스레드는 다시 `epoll_wait()`를 호출하여 다음 이벤트를 기다립니다.

## 3. epoll의 작동 원리

### epoll이란?

epoll은 리눅스 커널에서 제공하는, 많은 수의 파일 디스크립터를 감시하는, 효율적인 다중 I/O 이벤트 감시 메커니즘입니다.

### epoll의 동작 방식

1. epoll 인스턴스 생성 (`epoll_create1`)

   ```c
   int epoll_fd = epoll_create1(0);
   ```

   - 새로운 epoll 인스턴스를 생성합니다.
   - 반환된 `epoll_fd`는 epoll 인스턴스를 나타내는 파일 디스크립터입니다.

2. 파일 디스크립터 등록 (`epoll_ctl`)

   ```c
   struct epoll_event event;
   event.events = EPOLLIN; // 읽기 이벤트 감지
   event.data.fd = socket_fd; // 감시할 소켓의 파일 디스크립터

   epoll_ctl(epoll_fd, EPOLL_CTL_ADD, socket_fd, &event);
   ```

   - 감시하려는 소켓이나 파일 디스크립터를 epoll 인스턴스에 등록합니다.
   - 어떤 이벤트를 감시할지 지정합니다 (예: `EPOLLIN`은 읽기 가능 이벤트).

3. 이벤트 대기 (`epoll_wait`)

   ```c
   struct epoll_event events[MAX_EVENTS];
   int num_fds = epoll_wait(epoll_fd, events, MAX_EVENTS, -1);
   ```

   - 등록된 파일 디스크립터에서 이벤트가 발생할 때까지 대기합니다.
   - 이벤트가 발생하면 이벤트 정보를 `events` 배열에 채워줍니다.
   - `num_fds`는 발생한 이벤트의 수를 나타냅니다.

4. 이벤트 처리

   ```c
   for (int i = 0; i < num_fds; ++i) {
       if (events[i].events & EPOLLIN) {
           int fd = events[i].data.fd;
           // fd에서 데이터 읽기 및 처리
       }
   }
   ```

   - 발생한 이벤트들을 순회하며 처리합니다.
   - 각 이벤트에 대한 적절한 작업을 수행합니다.
### 전체 코드 예시

```c
#include <sys/epoll.h>
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <arpa/inet.h>

#define MAX_EVENTS 10
#define PORT 8080

int main() {
    int server_fd, client_fd, epoll_fd;
    struct sockaddr_in address;
    struct epoll_event event, events[MAX_EVENTS];
    int addrlen = sizeof(address);

    // 1. 소켓 생성
    server_fd = socket(AF_INET, SOCK_STREAM | SOCK_NONBLOCK, 0);

    // 2. 소켓 설정
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(PORT);

    // 3. 소켓 바인딩
    bind(server_fd, (struct sockaddr *)&address, sizeof(address));

    // 4. 리스닝 시작
    listen(server_fd, 10);

    // 5. epoll 인스턴스 생성
    epoll_fd = epoll_create1(0);

    // 6. 서버 소켓을 epoll에 등록
    event.events = EPOLLIN;
    event.data.fd = server_fd;
    epoll_ctl(epoll_fd, EPOLL_CTL_ADD, server_fd, &event);

    while (1) {
        // 7. 이벤트 대기
        int num_fds = epoll_wait(epoll_fd, events, MAX_EVENTS, -1);

        // 8. 이벤트 처리
        for (int i = 0; i < num_fds; ++i) {
            if (events[i].data.fd == server_fd) {
                // 새로운 클라이언트 연결 수락
                client_fd = accept(server_fd, (struct sockaddr *)&address, (socklen_t *)&addrlen);
                // 클라이언트 소켓을 논블로킹으로 설정
                int flags = fcntl(client_fd, F_GETFL, 0);
                fcntl(client_fd, F_SETFL, flags | O_NONBLOCK);

                // 클라이언트 소켓을 epoll에 등록
                event.events = EPOLLIN | EPOLLET;
                event.data.fd = client_fd;
                epoll_ctl(epoll_fd, EPOLL_CTL_ADD, client_fd, &event);
            } else {
                // 클라이언트로부터 데이터 수신
                char buffer[1024] = {0};
                int bytes_read = read(events[i].data.fd, buffer, sizeof(buffer));

                if (bytes_read <= 0) {
                    // 연결 종료
                    close(events[i].data.fd);
                } else {
                    // 받은 데이터 출력
                    printf("Received: %s\n", buffer);
                    // 에코 응답
                    write(events[i].data.fd, buffer, bytes_read);
                }
            }
        }
    }

    close(server_fd);
    return 0;
}
```

### 코드 설명

- 서버 소켓 생성 및 설정:
   - `socket()` 함수를 사용하여 서버 소켓을 생성하고, `bind()`와 `listen()`으로 설정합니다.
   - 소켓을 논블로킹 모드로 설정하기 위해 `SOCK_NONBLOCK` 플래그를 사용합니다.

- epoll 인스턴스 생성:
   - `epoll_create1(0)`을 호출하여 epoll 인스턴스를 생성합니다.

- 서버 소켓을 epoll에 등록:
   - 서버 소켓을 `EPOLLIN` 이벤트로 epoll에 등록하여 새로운 연결 요청을 감시합니다.

- 이벤트 루프:
   - `while` 루프를 통해 지속적으로 `epoll_wait()`를 호출하여 이벤트를 감시합니다.
   - 이벤트가 발생하면 `events` 배열에 이벤트 정보가 저장됩니다.

- 이벤트 처리:
   - 이벤트를 순회하며 처리합니다.
   - 새로운 연결 요청:
      - 이벤트의 파일 디스크립터가 서버 소켓인 경우, `accept()`를 호출하여 새로운 클라이언트 연결을 수락합니다.
      - 새로운 클라이언트 소켓을 epoll에 등록하여 데이터 수신 이벤트를 감시합니다.
   - 데이터 수신:
      - 클라이언트 소켓에서 데이터가 수신되면, `read()`를 통해 데이터를 읽습니다.
      - 받은 데이터를 처리하고, 필요에 따라 응답을 보냅니다.
      - 데이터가 없거나 오류가 발생하면 연결을 종료합니다.

### epoll의 동작 흐름 요약

1. 여러 파일 디스크립터를 epoll에 등록하여 감시합니다.
2. `epoll_wait()`를 호출하여 이벤트가 발생할 때까지 효율적으로 대기합니다.
3. 이벤트가 발생하면 깨어나서 해당 이벤트를 처리합니다.
4. 처리 후 다시 `epoll_wait()`를 호출하여 대기 상태로 돌아갑니다.

## 4. 예시 코드로 이해하는 WebFlux와 epoll

### 간단한 WebFlux 예시

```java
@GetMapping("/data")
public Mono<String> getData() {
    return webClient.get()
        .uri("http://external-service/data")
        .retrieve()
        .bodyToMono(String.class);
}
```

- `WebClient` 사용: 논블로킹 HTTP 클라이언트로 외부 서비스 호출 시 사용합니다.
- 완전한 논블로킹 처리: 블로킹 코드 없이 논블로킹 방식으로 입출력 작업을 수행합니다.

### 전체 흐름과 코드 연계

1. 요청 수신: 클라이언트가 `/data` 엔드포인트로 요청을 보냅니다.
2. 이벤트 감지: Netty의 이벤트 루프 스레드가 `epoll_wait`에서 깨어나서 요청을 처리합니다.
3. 입출력 작업 시작: `WebClient`를 통해 외부 서비스에 대한 논블로킹 입출력 작업을 시작합니다.
4. 스레드 반환 및 대기: 입출력 작업이 진행되는 동안 스레드는 다른 작업을 처리하기 위해 다시 `epoll_wait`로 돌아갑니다.
5. 다른 요청 처리: 다른 클라이언트의 요청이 들어오면 스레드는 이를 처리합니다.
6. 입출력 완료 이벤트 감지: 외부 서비스로부터 응답이 도착하면, 이벤트 루프 스레드는 이를 감지합니다.
7. 콜백 실행: 입출력 작업의 결과를 처리하기 위한 콜백이 실행됩니다.
8. 응답 반환: 최종적으로 클라이언트에게 응답을 반환합니다.
