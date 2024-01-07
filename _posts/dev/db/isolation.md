# MVCC

## Transaction이란 무엇인가?
Transaction의 정의
Transaction이란, 데이터베이스의 데이터를 조작하는 작업의 단위입니다.

transaction은 흔히 이론적으로 ACID 원칙을 보장해야 한다고 합니다.

ACID는 각각 Atomicity(원자성), Consistency(일관성), Isolation(독립성), Durability(영구성)를 의미하는데요.

은행의 송금(보내는 사람의 계좌에서 돈을 차감하고 받는 사람의 계좌에 돈을 추가)을 예시로 ACID에 대해서 설명하면 아래와 같습니다.

* Atomicity: transaction의 작업이 부분적으로 성공하는 일이 없도록 보장하는 성질입니다.
    * 보내는 사람의 계좌에서 돈을 차감만하고, 받는 사람의 계좌에 돈을 추가하지 않는 일은 없어야합니다.
* Consistency: transaction이 끝날 때 DB의 여러 제약 조건에 맞는 상태를 보장하는 성질입니다.
    * 송금하는 사람의 계좌 잔고가 0보다 작아지면 안 됩니다.
* Isolation: transaction이 진행되는 중간 상태의 데이터를 다른 transaction이 볼 수 없도록 보장하는 성질입니다.
    * 송금하는 사람의 계좌에서 돈은 빠져나갔는데 받는 사람의 계좌에 돈이 아직 들어가지 않은 DB 상황을 다른 transaction이 읽으면 안됩니다.
* Durability: transaction이 성공했을 경우 해당 결과가 영구적으로 적용됨을 보장하는 성질입니다.
    * 한 번 송금이 성공하면 은행 시스템에 장애가 발생하더라도 송금이 성공한 상태로 복구할 수 있어야 합니다.

## ACID 원칙은 완벽하게 지켜지지 않는다.
하지만 실제로 ACID 원칙은 엄격하게 지켜지지 않습니다. 성능이 매우 떨어지기 때문인데요.  