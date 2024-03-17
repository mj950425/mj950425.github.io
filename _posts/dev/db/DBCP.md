클라이언트로부터 백엔드 서버가 요청을 받아서 DB서버에게 질의를 하면 DB서버는 결과값을 백앤드 서버로 반환합니다.

그리고 추가적인 로직을 수행한 후에 백엔드 서버가 다시 결과갑을 클라이언트에게 전달합니다.

백엔드 서버와 디비 서버는 TCP를 기반으로 네트워크 통신을 합니다.

TCP 통신은 높은 신뢰성을 특징으로 가집니다.

그리고 연결 지향적인 통신 프로토콜이기 때문에, 커낵션을 맺고 커낵션을 종료하는 과정이 필요합니다.

커낵션을 열때는 3 way hand shake를 진행하고, 닫을때는 4 way hand shake을 진행합니다.

하지만 커낵션을 열고 닫는게 꽤나 비용이 많이 드는 작업입니다.

결국에 레이턴시가 늘어나게됩니다.

이러한 문제점을 줄이기 위해서 탄생한게 DBCP입니다.

미리 데이터베이스와의 커낵션을 만들어두고 pool로 관리하는게 DBCP입니다.

이를 활용해서 요청 마다 데이터베이스와 커낵션을 맺지 않고 DBCP에서 커낵션을 대여해옵니다.

DBCP를 사용하게되면, 애플리케이션은 close connection에서 실제로 커낵션을 종료하는게 아니라 커낵션을 반납하게 됩니다.

먼저 DB 설정중에 max_connections라는게 있습니다.

max_connections : 클라이언트와 맺을 수 있는 최대 커낵션 수

만약 서버 1이 max_connections 만큼의 커낵션을 미리 연결해두었다면, 서버 2가 새롭게 스케일아웃해서 만들어져도 데이터베이스와 연결이 안됩니다.

이미 max_connections만큼 데이터베이스는 서버 1과 커낵션을 맺었기 때문입니다.

wait_timeout : connection이 inactive할 때 다시 요청이 오기까지 얼마의 시간을 기다린 뒤에 close할 것인지를 결정합니다.

커낵션을 최대 몇초까지 기다리는지에 대한 설정입니다. 시간내에 응답이오면 해당 값은 다시 0으로 초기화됩니다.

DBCP 설정

minimumIdle 파라미터 : 커낵션 풀에서 유지하는 최소한의 아무런 일을 안하고 대기하고 있는 커낵션 수

maximumPoolSize 파라미터 : 풀이 가질 수 있는 최대 커낵션 수, idle과 active connection을 합쳐서 최대 수

규칙 : idle 커낵션 수가 minimumIdle보다 작고 전체 connection 수도 maximumPoolSize보다 작다면 신속하게 추가로 connection을 만듭니다.

즉 minimumIdle수가 충족이 안되어도 maximumPoolSize를 넘어간다면 커낵션을 새롭게 만들지 않습니다.

minimumIdle == maximumPoolSize가 같은게 권장된다. 즉 트래픽이 몰릴때마다 커낵션을 새롭게 만들어주지 않기 위해서 connectionPoolSize를 고정하도록 권장한다.

maxLifeTime : 풀에서 커낵션의 최대 수명, maxLifeTime을 넘기면 ideldls ruddn pool에서 바로 제거, active인 경우 pool로 반환이 된 경우 제거

pool로 반환이 안되면 maxLifetime 동작안하기 떄문에 다 쓴 커낵션은 풀로 잘 반환하는게 중요하다.

DB의 connection time limit(wait_timeout) 보다 몇 초 짧게 설정해야합니다.

DBCP에서 max_life_time이 채워지기전에 네트워크로 보냈는데, 네트워크를 타다가 wait_timeout을 넘어섰다면 데이터베이스에서는 커낵션을 끊고 예외를 반환할 것 입니다.

그래서 wait_timeout을 몇 초 더 짧게 가져가는것이 좋습니다.

connectionTimeout : pool에서 connection을 받기 위한 대기 시간

당연하게 클라이언트와 맺는 커낵션보다는 짧게 잡는것이 좋습니다.

적절한 커낵션 수 찾기

백앤드 서버의 DB, CPU, MEM 등등 리소스 사용률 확인

둘 다 리소스 사용률이 적당한데 아래 그래프가 꺾인다면 active 스레드의 수를 확인합니다.

스레드풀의 스레드가 전부 일하고 있어서, 일을 못하는것일수도 있다.

만약 액티브 수가 널널하다면, DBCP의 active connection 수를 확인합니다.

DBCP의 active connection 수가 널널하다면 늘려주고, 점점 늘리다가 DB의 max connection 수 까지 도달하면 DB의 max_connection 수를 늘립니다.

rps -> 부하를 늘릴수록 로그함수
art -> 부하를 늘를수록 지수함수








