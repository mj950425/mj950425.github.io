# 주키퍼
분산 애플리케이션 관리를 위한 안정적인 코디네이션 오픈소스입니다.

분산 애플리케이션이 안정적인 서비스를 할 수 있도록, 분산되어 있는 각 애플리케이션의 정보를 중앙에 집중하고 구성 관리, 그룹 관리 네이밍, 동기화 등의 서비스를 제공합니다.

주키퍼는 여러 서버를 앙상블로 구현합니다. 앙상블을 이루는 서버가 과반수를 넘게 살아있으면 주키퍼는 운영이 가능합니다.

또한 성능적으로도 여러 서버가 존재하므로 이점이 있습니다.

상태 정보들은 주키퍼의 지노드라는곳에 키 벨류 형태로 저장합니다.

주키퍼에 저장되는 모든 데이터는 메모리에 저장되어 처리량이 매우 크고 속도가 빠릅니다.

지노드에 변경사항이 생기면 트랜잭션 로그에 기록하고, 트랜잭션 로그는 일정 크기가 넘어가면 지노드의 상태 스냅샷을 파일 시스템에 저장합니다.

그리고 이 스냅샷은 이전 로그들을 대체합니다.

로컬 환경에서 우분투에서 컨테이너를 3개 띄우고 zoo.cfg를 아래처럼 설정합니다.

tickTime=2000
initLimit=10
syncLimit=5
dataDir=/zookeeper/data
clientPort=2181
server.1=peter-zk001:2888:3888
server.2=peter-zk002:2889:3889
server.3=peter-zk003:2890:3890

각 컨테이너에 전부 zookeeper를 띄우고 
./zkServer status 를 입력하면

아래처럼 나옵니다.
Using config: /zookeeper/bin/../conf/zoo.cfg
Client port found: 2181. Client address: localhost. Client SSL: false.
Mode: follower

만약에 주문 시스템과 재고 시스템이 별도의 카프카 클러스터를 사용한다면 zookeeper.connect에 znode를 명시적으로 분리해서 작성해줘야합니다.

페이지 캐시란?



