
# RDB와 MongoDB의 기능 차이
1. 데이터 모델
RDB: RDB는 정형화된 테이블 기반 데이터 모델을 사용합니다. 
데이터는 행과 열로 구성된 테이블에 저장되며, 테이블 간의 관계는 외래 키(foreign key)를 통해 정의됩니다. 
각 행은 고정된 스키마에 따라 특정 필드(열)를 가집니다.
예시: 은행 시스템에서 고객 정보와 거래 내역을 관리할 때, 고객 테이블과 거래 테이블이 관계를 맺으며, 거래 테이블에는 고객 테이블의 외래 키가 포함됩니다.

MongoDB: MongoDB는 문서 지향 데이터 모델을 사용하며, 데이터는 BSON(Binary JSON) 형식의 문서로 저장됩니다. 
각 문서는 고유한 구조를 가질 수 있으며, 동일한 컬렉션(테이블과 유사) 내에서도 문서의 필드가 서로 다를 수 있습니다.
예시: 소셜 미디어 플랫폼에서 사용자 프로필과 게시물 정보를 관리할 때, 사용자 프로필과 게시물이 각각의 문서로 저장되며, 각 문서에 다양한 구조의 데이터를 포함할 수 있습니다.
2. 스키마 및 유연성

   •	RDB: RDB는 고정된 스키마를 요구합니다. 테이블을 생성할 때 스키마를 명확히 정의해야 하며, 스키마 변경은 테이블의 구조를 변경하는 복잡한 작업을 수반합니다.
   •	예시: 제품 정보 테이블에 새로운 속성(예: product_color)을 추가하려면 테이블 스키마를 수정하고 기존 데이터를 업데이트해야 합니다.
   •	MongoDB: MongoDB는 스키마리스 또는 유연한 스키마 구조를 가지며, 각 문서가 다른 구조를 가질 수 있습니다. 새로운 필드를 추가할 때 기존 문서에 영향을 주지 않고 쉽게 추가할 수 있습니다.
   •	예시: 기존 제품 정보 문서에 product_color 필드를 추가해도 다른 문서에 영향을 주지 않으며, 별도의 스키마 변경 작업이 필요하지 않습니다.
3. 트랜잭션 처리

   •	RDB: RDB는 ACID 트랜잭션을 완벽히 지원하며, 여러 테이블에 걸친 복잡한 트랜잭션을 일관되게 처리할 수 있습니다. 이는 금융 시스템이나 재고 관리 시스템 등에서 매우 중요합니다.
   •	예시: 은행 계좌 간의 자금 이체 시, 한 계좌에서 금액이 출금되고 다른 계좌로 입금되는 모든 작업이 원자적으로 수행되며, 어느 한 작업이 실패하면 전체 트랜잭션이 롤백됩니다.
   •	MongoDB: MongoDB도 최근에는 다중 문서에 걸친 트랜잭션을 지원하기 시작했지만, 전통적으로는 단일 문서 수준에서만 일관성을 보장했습니다. 따라서 복잡한 트랜잭션을 다루는 데 있어서는 RDB에 비해 상대적으로 제한적일 수 있습니다.
   •	예시: 전자상거래 사이트에서 사용자가 상품을 주문하고 재고가 차감되는 과정이 동시에 처리되는 경우, MongoDB는 다중 문서 트랜잭션을 통해 이를 일관성 있게 처리할 수 있지만, 이러한 작업이 RDB만큼 광범위하게 지원되지는 않습니다.

4. 확장성

   •	RDB: RDB는 수직적 확장(Scale-Up)에 적합합니다. 서버의 성능을 높이거나 더 강력한 하드웨어로 업그레이드하여 성능을 향상시킬 수 있지만, 수평적 확장(Scale-Out)은 상대적으로 어려운 편입니다.
   •	예시: 사용자가 급증하는 상황에서 데이터베이스 서버의 성능을 높이기 위해 더 강력한 CPU와 메모리를 가진 서버로 교체하는 방식으로 확장합니다.
   •	MongoDB: MongoDB는 수평적 확장(Scale-Out)에 최적화되어 있습니다. 여러 노드로 데이터를 분산 저장하고, 데이터 샤딩을 통해 대규모 데이터를 효율적으로 관리할 수 있습니다.
   •	예시: 소셜 미디어 플랫폼에서 전 세계 수백만 사용자의 데이터를 처리하기 위해 여러 노드에 데이터를 분산 저장하고, 각 노드에서 데이터를 병렬로 처리합니다.

5. 복잡한 쿼리와 조인

   •	RDB: RDB는 복잡한 SQL 쿼리와 조인 연산에 매우 강력합니다. 여러 테이블에 걸쳐 데이터를 결합하고, 조건에 따라 데이터를 필터링하는 등의 작업이 매우 효율적입니다.
   •	예시: 고객 주문 내역을 조회할 때, 고객 테이블과 주문 테이블을 조인하여 특정 고객의 모든 주문 내역을 가져오는 쿼리를 실행할 수 있습니다.
   •	MongoDB: MongoDB는 기본적으로 조인을 지원하지 않지만, $lookup을 통해 제한적인 조인 연산이 가능합니다. 그러나 RDB처럼 복잡한 조인 연산을 수행하는 데는 적합하지 않습니다.
   •	예시: 고객 정보와 주문 정보를 각각의 문서로 저장하고, 특정 상황에서 두 문서를 결합하여 데이터를 조회할 수 있지만, 이는 RDB의 조인 기능만큼 강력하지 않습니다.
   결론

   •	RDB는 고정된 스키마와 강력한 트랜잭션 처리, 복잡한 관계 데이터 관리, 그리고 복잡한 쿼리 및 조인 연산을 필요로 하는 애플리케이션에 적합합니다. 금융 시스템, ERP 시스템, 재고 관리 시스템 등에서 많이 사용됩니다.
   •	MongoDB는 유연한 스키마 구조와 수평적 확장성, 그리고 비정형 데이터 처리에 강점을 가지고 있으며, 자주 변경되는 데이터나 비정형 데이터가 많은 애플리케이션에 적합합니다. 소셜 미디어, IoT 데이터 수집, 콘텐츠 관리 시스템 등에서 자주 사용됩니다.



# MongoDB와 ElasticSearch의 기능 차이

1. 복잡한 트랜잭션 관리
MongoDB: MongoDB는 ACID 트랜잭션을 지원합니다. 
이는 다중 문서에 걸친 복잡한 트랜잭션을 일관성 있게 처리할 수 있도록 보장합니다. 
예를 들어, 은행 시스템에서 여러 계좌 간의 자금 이체와 같은 작업을 수행할 때, 모든 관련 작업이 하나의 트랜잭션으로 처리되며, 어느 한 작업이 실패하면 전체 트랜잭션이 롤백됩니다.

ElasticSearch: ElasticSearch는 ACID 트랜잭션을 지원하지 않으며, 단일 문서 수준에서만 일관성을 보장합니다. 
이는 다중 문서 또는 인덱스 간의 복잡한 트랜잭션 처리가 필요한 비즈니스 로직에서는 적합하지 않습니다. 
예를 들어, 여러 인덱스에 걸친 데이터의 일관된 업데이트가 필요한 경우 ElasticSearch는 부적합합니다.

2. 관계형 데이터 모델 및 조인 연산
MongoDB: MongoDB는 기본적으로 비관계형 데이터베이스지만, $lookup과 같은 기능을 통해 기본적인 조인 연산을 수행할 수 있습니다. 
ElasticSearch: ElasticSearch는 관계형 조인 연산을 지원하지 않습니다. 

3. 복잡한 집계 및 데이터 분석
MongoDB: MongoDB는 강력한 집계 파이프라인을 제공합니다. 
이를 통해 데이터를 여러 단계로 처리하고, 필터링, 그룹화, 정렬, 변환 등의 복잡한 분석 작업을 수행할 수 있습니다. 
예를 들어, 전자상거래 플랫폼에서 특정 기간 동안의 매출 데이터를 집계하고, 카테고리별로 분석하는 등의 복잡한 분석이 가능합니다.

ElasticSearch: ElasticSearch는 주로 검색과 실시간 분석에 최적화되어 있으며, MongoDB와 같은 복잡한 집계 작업에서는 성능이 떨어질 수 있습니다. 
ElasticSearch의 집계 기능은 주로 텍스트 분석이나 단순 통계에 적합하며, 복잡한 데이터 변환이나 연속적인 집계 작업을 처리하는 데는 MongoDB보다 적합하지 않을 수 있습니다.

4. 데이터 수정 및 업데이트 효율성
MongoDB: MongoDB는 특정 필드의 업데이트, 문서의 부분적인 수정 등 유연한 데이터 수정 작업을 효율적으로 처리할 수 있습니다. 
예를 들어, 특정 필드만 업데이트하거나, 문서의 일부분만 수정하는 작업이 빈번한 경우, MongoDB는 이를 매우 효율적으로 처리합니다.

5. ElasticSearch: ElasticSearch는 인덱싱된 데이터의 업데이트가 복잡하며, 일반적으로 전체 문서를 재인덱싱해야 합니다. 
이는 수정 작업이 빈번히 발생하는 경우 비효율적이며, 대규모 데이터 세트에서 성능이 크게 저하될 수 있습니다. 
특히, 문서의 일부만 수정하는 경우에도 전체 문서를 재인덱싱해야 하므로, 업데이트 비용이 큽니다.

결론

MongoDB는 데이터 저장 및 관리, 복잡한 트랜잭션, 관계형 데이터 모델링, 집계 및 분석, 데이터 업데이트와 같은 작업에서 강점을 가지고 있습니다. 
반면, ElasticSearch는 주로 텍스트 기반 검색과 실시간 분석에 최적화되어 있으며, MongoDB와 같은 복잡한 트랜잭션 처리나 데이터 관계 관리, 효율적인 업데이트 작업에 적합하지 않습니다. 
