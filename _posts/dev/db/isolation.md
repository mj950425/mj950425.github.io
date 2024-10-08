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

## Isolation 원칙은 완벽하게 지켜지지 않는다.
하지만 실제로 Isolation 원칙은 엄격하게 지켜지지 않습니다. 성능이 매우 떨어지기 때문인데요.

격리성과 동시성은 트레이드 오프 관계를 가집니다.

이러한 격리성과 동시성의 정도를 단계로 나누었다.

반복 불가능한 리드 (Non-repeatable Read)

반복 불가능한 리드는 한 트랜잭션이 같은 쿼리를 여러 번 실행할 때, 그 사이에 다른 트랜잭션이 데이터를 변경하여 두 번째 쿼리 결과가 첫 번째 쿼리 결과와 다른 경우 발생합니다. 즉, 같은 행을 두 번 읽을 때 결과가 다르게 나오는 상황입니다.

예시:

	1.	트랜잭션 A: 특정 조건에 맞는 데이터를 조회합니다.
	2.	트랜잭션 B: 그 데이터를 수정합니다.
	3.	트랜잭션 A: 같은 조건으로 다시 데이터를 조회합니다. 이때 조회 결과가 처음과 다릅니다.

이 상황은 데이터가 일관성 없이 읽히게 되므로, 트랜잭션의 격리 수준이 낮을 때 발생할 수 있습니다.

팬텀 리드 (Phantom Read)

팬텀 리드는 한 트랜잭션 내에서 동일한 쿼리를 여러 번 실행할 때, 그 사이에 다른 트랜잭션이 새로운 행을 삽입하거나 기존 행을 삭제하여, 두 번째 쿼리의 결과에 추가 또는 삭제된 행이 나타나는 경우 발생합니다. 즉, 새로운 행(팬텀)이 나타나거나 사라지는 상황입니다.

예시:

	1.	트랜잭션 A: 특정 조건에 맞는 모든 행을 조회합니다.
	2.	트랜잭션 B: 그 조건에 맞는 새로운 행을 삽입합니다.
	3.	트랜잭션 A: 같은 조건으로 다시 데이터를 조회합니다. 이번에는 처음에 없던 새로운 행이 결과에 나타납니다.

팬텀 리드는 행의 삽입 또는 삭제와 관련된 문제로, 특정 격리 수준에서만 발생할 수 있습니다.
