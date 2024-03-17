# 개발자 코드

# 테스트 방법
테스트 방법은 아래와 같습니다.

1. docker compose를 통해서 먼저 데이터베이스와 레디스를 실행한다. 
2. springboot 앱을 실행한다. 
3. 자동으로 flyway로 데이터 마이그레이션이 이뤄진다. 
4. jmeter를 설치하고 실행한다. 
5. jmeter 디렉토리의 Thread Group.jmx를 open한다. 
6. 테스트 환경을 설정하고, 원하는 쓰레드 그룹만을 enable한 뒤 실행시킨다. 
7. aggregation result를 확인한다.


# 성능 테스트 결과

| 종류                                   | 요청 방식                                    | 사양                                                                                                                                                                                                      | 첫번째 테스트                                                                                                                                  | 두번째 테스트                                                                                                                                        | 특이점                                            |
|--------------------------------------|------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------|
| Redisson Multi Lock과 Optimisitc Lock | ids [1,2]에 대한 재고 차감과 ids [1,3]에 대한 재고 차감 | **사양**: MacBook Pro(16인치, 2021년)<br>**플랫폼**: macOS (ARM64 아키텍처)<br>**CPU 사용률**: 12.58%<br>**메모리 사용률**: 32.00GB 중 20.92GB 사용<br>**MYSQL 설정**: mysql 8.0.32, REPEATABLE-READ<br>**REDIS 설정**: redis 7.0.8 | **설정**<br>users: 200명, ramp-up: 10초, loop: 100회<br>**결과**<br>에러율 : 10번의 락 획득 실패. [1,2] 2번 실패, [1,3] 8번 실패<br>성능 결과 : throughput 122.3개/초 | **설정**<br>users: 1000명, ramp-up: 10초, loop: 100회<br>**결과**<br>에러율 : 722번의 락 획득 실패. [1,2] 349번 실패, [1,3] 373번 실패<br>성능 결과 : throughput 108.7개/초 | x                                              |
| Pessmistic Lock                      | ids [1,2]에 대한 재고 차감과 ids [1,3]에 대한 재고 차감 | **사양**: MacBook Pro(16인치, 2021년)<br>**플랫폼**: macOS (ARM64 아키텍처)<br>**CPU 사용률**: 11.08%<br>**메모리 사용률**: 32.00GB 중 21.45GB 사용<br>**MYSQL 설정**: mysql 8.0.32, REPEATABLE-READ<br>**REDIS 설정**: redis 7.0.8 | **설정**<br>users: 200명, ramp-up: 10초, loop: 100회<br>**결과**<br>에러율 : 0.00%<br>성능 결과 : throughput 320.6개/초                                  | **설정**<br>users: 1000명, ramp-up: 10초, loop: 100회<br>**결과**<br>에러율 : 0.00%<br>성능 결과 : throughput 266.8개/초                                       | 두번째 테스트에서 데이터 정합성이 1개 안맞음(1~3개씩 안맞는 경우가 종종 있음) |

## Redisson Multi Lock과 Optimisitc Lock
* 사양 : MacBook Pro(16인치, 2021년)
* 플랫폼 : macOS (ARM64 아키텍처)
* CPU 사용률 : 12.58% 
* 메모리 사용률 : 32.00GB 중 20.92GB 사용 
* MYSQL 설정 : mysql 8.0.32, REPEATABLE-READ 
* REDIS 설정 : redis 7.0.8

![img.png](/assets/img/dev/db/lock-test/img_1.png)
![img.png](/assets/img/dev/db/lock-test/img.png)

### 첫번째 테스트

설정
* users: 200명, ramp-up: 10초, loop: 100회

결과
* 에러율 : 10번의 락 획득 실패. [1,2] 2번 실패, [1,3] 8번 실패 
* 성능 결과 : throughput 122.3개/초

![img.png](/assets/img/dev/db/lock-test/img_2.png)
![img.png](/assets/img/dev/db/lock-test/img_3.png)

### 두번째 테스트
설정
* users: 1000명, ramp-up: 10초, loop: 100회

결과
* 에러율 : 722번의 락 획득 실패. [1,2] 349번 실패, [1,3] 373번 실패
* 성능 결과 : throughput 108.7개/초

## Pessmistic Lock
* 사양 : MacBook Pro(16인치, 2021년)
* 플랫폼 : macOS (ARM64 아키텍처)
* CPU 사용률 : 11.08% 
* 메모리 사용률 : 32.00GB 중 21.45GB 사용 
* MYSQL 설정 : mysql 8.0.32, REPEATABLE-READ 
* REDIS 설정 : redis 7.0.8

![img.png](/assets/img/dev/db/lock-test/img_4.png)
![img.png](/assets/img/dev/db/lock-test/img_5.png)

### 첫번째 테스트
설정
* users: 200명, ramp-up: 10초, loop: 100회

결과
* 에러율 : 0.00%
* 성능 결과 : throughput 320.6개/초

![img.png](/assets/img/dev/db/lock-test/img_6.png)

### 두번째 테스트

설정
* users: 1000명, ramp-up: 10초, loop: 100회

결과
* 에러율 : 0.00%
* 성능 결과 : throughput 266.8개/초

특이점
* 특이점 : 데이터 1개가 정합성이 안맞음

![img.png](/assets/img/dev/db/lock-test/img_7.png)
![img.png](/assets/img/dev/db/lock-test/img_8.png)

# 결론
클라우드 운영 환경에서는 어떨지 모르겠지만 개인 로컬에서의 성능은 데이터베이스의 비관적락이 가장 좋았음.

하지만 이상하게 십만건중에 몇개의 데이터가 정합성이 맞지않는 상황이 발생함. 또한 비관적락은 데드락 관리를 잘해야한다.

# 깃 주소
https://github.com/myrealtrip/stock-poc