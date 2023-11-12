---
layout: post
title: "JPA 부팅 순서에 대해서 알아보자"
date: 2023-11-12 08:46:00 +0900
categories:
  - jvm-lang
---
# JPA 부팅 순서에 대해서 알아보자

스프링 부트 애플리케이션의 부팅 과정에서 스프링 빈들의 등록과 초기화는 여러 단계에 걸쳐 이루어집니다.

1. 컴포넌트 스캔 : 애플리케이션 시작 시, 스프링은 @Component, @Service, @Repository ... 등의 어노테이션이 붙은 클래스들을 찾아 빈으로 등록합니다.
   이 과정은 애플리케이션에 포함된 커스텀 빈들을 스프링 컨텍스트에 등록하는 단계입니다.
2. 라이브러리 빈 등록 : 스프링 부트는 Auto Configuration을 통해 클래스패스에 존재하는 라이브러리들에 대한 빈 설정을 자동으로 수행합니다.
   이 단계에서 JPA와 같은 외부 라이브러리의 빈들이 스프링 컨택스트에 등록됩니다.
   이 때 JPA의 경우, 스프링이 등록한 데이터소스를 활용해서 세션 팩토리 등 JPA 작업에 필요한 핵심 빈들을 자동으로 설정하고 등록합니다.

Spring web 과 JPA의 의존성을 같이 추가하고, 아래의 환경설정 코드를 appilication.yaml에 추가한 뒤에 앱을 실행시켜보겠습니다.

application.yaml
```
logging:
  level:
    org:
      hibernate: trace
```

build.gradle.kts
```
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
	id("org.springframework.boot") version "2.7.10"
	id("io.spring.dependency-management") version "1.0.15.RELEASE"
	kotlin("jvm") version "1.6.21"
	kotlin("plugin.spring") version "1.6.21"
	kotlin("plugin.jpa") version "1.6.21"
}

group = "com.example"
version = "0.0.1-SNAPSHOT"
java.sourceCompatibility = JavaVersion.VERSION_11

repositories {
	mavenCentral()
}

dependencies {
	implementation("org.springframework.boot:spring-boot-starter-data-jpa")
	implementation("org.jetbrains.kotlin:kotlin-reflect")
	implementation("com.mysql:mysql-connector-j")
	testImplementation("org.springframework.boot:spring-boot-starter-test")
	implementation("org.springframework.boot:spring-boot-starter-web")
}

tasks.withType<KotlinCompile> {
	kotlinOptions {
		freeCompilerArgs = listOf("-Xjsr305=strict")
		jvmTarget = "11"
	}
}

tasks.withType<Test> {
	useJUnitPlatform()
}
```

실행시켜보면 쭉 로그가 나옵니다. 로그를 따라가면서 어떻게 동작하는지 알아보겠습니다.

아래 로그는 어떤 애플리케이션을 어느 머신과 프로세스에서 실행하는지 그리고 현재 프로파일을 알려줍니다.

```
2023-11-12 16:34:18.736  INFO 21502 --- [           main] c.e.jpastudy.JpaStudyApplicationKt       : Starting JpaStudyApplicationKt using Java 11.0.16.1 on MacBook-Pro-101.local with PID 21502 (/Users/mrt/Desktop/dev/study/inflearn/jpa-study/build/classes/kotlin/main started by mrt in /Users/mrt/Desktop/dev/study/jpa-study)
2023-11-12 16:34:18.742  INFO 21502 --- [           main] c.e.jpastudy.JpaStudyApplicationKt       : No active profile set, falling back to 1 default profile: "default"
2023-11-12 16:34:19.482  INFO 21502 --- [           main] .s.d.r.c.RepositoryConfigurationDelegate : Bootstrapping Spring Data JPA repositories in DEFAULT mode.
2023-11-12 16:34:19.538  INFO 21502 --- [           main] .s.d.r.c.RepositoryConfigurationDelegate : Finished Spring Data repository scanning in 50 ms. Found 2 JPA repository interfaces.
2023-11-12 16:34:20.058  INFO 21502 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8080 (http)
2023-11-12 16:34:20.063  INFO 21502 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
2023-11-12 16:34:20.064  INFO 21502 --- [           main] org.apache.catalina.core.StandardEngine  : Starting Servlet engine: [Apache Tomcat/9.0.73]
2023-11-12 16:34:20.169  INFO 21502 --- [           main] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring embedded WebApplicationContext
2023-11-12 16:34:20.169  INFO 21502 --- [           main] w.s.c.ServletWebServerApplicationContext : Root WebApplicationContext: initialization completed in 1361 ms
2023-11-12 16:34:20.444 DEBUG 21502 --- [           main] o.hibernate.jpa.internal.util.LogHelper  : PersistenceUnitInfo [
```

PersistenceUnitInfo는 JPA에서 영속성 단위에 대한 설정과 정보를 제공하는 인터페이스입니다. EntityManagerFactory를 만들때 해당 데이터 캡슐을 사용하게됩니다.

하이버네이트에서는 persistence.xml을 사용해서 구성하지만, 스프링에서 순수 자바만으로 구성가능하도록 제공합니다.

이 때 데이터로 데이터 소스, 엔티티 클래스 목록, 트랜잭션 타입 등이 포함됩니다.

관련해서는 [이곳을](https://docs.oracle.com/cd/E19798-01/821-1841/bnbrj/index.html)을 살펴보면 됩니다.

뒤에서 살펴보겠지만, InFlightMetadataCollectorImpl클래스가 엔티티의 메타데이터를 분석하고 처리하는 작업을 거치기전에 @Entity 어노테이션이 붙은 클래스들을 자동으로 찾아내
PersistenceUnitInfo의 엔티티 목록에 추가합니다.

```
2023-11-12 16:34:20.444 DEBUG 21502 --- [           main] o.hibernate.jpa.internal.util.LogHelper  : PersistenceUnitInfo [
	name: default
	persistence provider classname: null
	classloader: jdk.internal.loader.ClassLoaders$AppClassLoader@6a6824be
	excludeUnlistedClasses: true
	JTA datasource: null
	Non JTA datasource: HikariDataSource (null)
	Transaction type: RESOURCE_LOCAL
	PU root URL: file:/Users/mrt/Desktop/dev/study/jpa-study/build/classes/kotlin/main/
	Shared Cache Mode: UNSPECIFIED
	Validation Mode: AUTO
	Jar files URLs []
	Managed classes names [
		com.example.jpastudy.isNew.SampleOneEntity
		com.example.jpastudy.isNew.SampleTwoEntity]
	Mapping files names []
	Properties []
```

아래는 JPA스펙을 구현하면서 하이버네이트가 자체적으로 확장한 기능을 보여줍니다. 하이버네이트와 같은 구현체는 JPA 표준에 정의되지 않은 추가 기능이나 성능 최적화 등을 제공하기도 합니다.

```
2023-11-12 21:49:53.501 DEBUG 42610 --- [           main] o.h.i.internal.IntegratorServiceImpl     : Adding Integrator [org.hibernate.cfg.beanvalidation.BeanValidationIntegrator].
2023-11-12 21:49:53.502 DEBUG 42610 --- [           main] o.h.i.internal.IntegratorServiceImpl     : Adding Integrator [org.hibernate.secure.spi.JaccIntegrator].
2023-11-12 21:49:53.503 DEBUG 42610 --- [           main] o.h.i.internal.IntegratorServiceImpl     : Adding Integrator [org.hibernate.cache.internal.CollectionCacheInvalidator]....
```

StrategySelectorImpl 클래스는 하이버네이트의 전략 선택기 구현체로, 특정 인터페이스 또는 기능에 대한 여러 구현체 중 하나를 선택합니다.

```
2023-11-12 17:02:36.761 TRACE 23606 --- [           main] o.h.b.r.s.internal.StrategySelectorImpl  : Registering named strategy selector [org.hibernate.resource.transaction.spi.TransactionCoordinatorBuilder] : [jdbc] -> [org.hibernate.resource.transaction.backend.jdbc.internal.JdbcResourceLocalTransactionCoordinatorBuilderImpl]
...
```

hibernate의 버전과 hibernate.properties 파일 존재 여부 서비스 초기화 및 캐싱 여부를 로그로 남깁니다.

```
2023-11-12 17:02:36.779  INFO 23606 --- [           main] org.hibernate.Version                    : HHH000412: Hibernate ORM core version 5.6.15.Final
2023-11-12 17:02:36.780 DEBUG 23606 --- [           main] org.hibernate.cfg.Environment            : HHH000206: hibernate.properties not found
2023-11-12 17:02:36.849 DEBUG 23606 --- [           main] o.hibernate.service.spi.ServiceBinding   : Overriding existing service binding [org.hibernate.secure.spi.JaccService]
2023-11-12 17:02:36.853 TRACE 23606 --- [           main] o.h.s.i.AbstractServiceRegistryImpl      : Initializing service [role=org.hibernate.engine.config.spi.ConfigurationService]
2023-11-12 17:02:36.855 TRACE 23606 --- [           main] o.h.s.i.AbstractServiceRegistryImpl      : Initializing service [role=org.hibernate.cache.spi.RegionFactory]
2023-11-12 17:02:36.856 DEBUG 23606 --- [           main] o.h.c.internal.RegionFactoryInitiator    : Cannot default RegionFactory based on registered strategies as `[]` RegionFactory strategies were registered
2023-11-12 17:02:36.856 DEBUG 23606 --- [           main] o.h.c.internal.RegionFactoryInitiator    : Cache region factory : org.hibernate.cache.internal.NoCachingRegionFactory
2023-11-12 17:02:36.866  INFO 23606 --- [           main] o.hibernate.annotations.common.Version   : HCANN000001: Hibernate Commons Annotations {5.1.2.Final}
```

아래는 자바 타입과 하이버네이트의 래핑 객체와의 매핑을 설정합니다. 예를 들어서 boolean은 BooleanType라는 클래스로 매핑합니다.

TypeConfiguration에서 아래와 같이 등록합니다. 하이버네이트에서는 자바 타입을 직접 다루는게 아니라 이러한 객체로 다룹니다.
<br/>
![img.png](/assets/img/jvm-lang/jpa-bootstrap/img.png)

```
2023-11-12 17:02:36.878 DEBUG 23606 --- [           main] org.hibernate.type.BasicTypeRegistry     : Adding type registration boolean -> org.hibernate.type.BooleanType@7db40fd5
...
```

PersistenceUnitInfo를 만들 때 추가하지 못한 엔티티들을 잡아내기 위해서 클래스 로더를 주입한 뒤, 다시 제거해줍니다.

```
2023-11-12 17:02:36.919 TRACE 23606 --- [           main] o.h.s.i.AbstractServiceRegistryImpl      : Initializing service [role=org.hibernate.boot.cfgxml.spi.CfgXmlAccessService]
2023-11-12 17:02:36.921 DEBUG 23606 --- [           main] o.h.boot.internal.BootstrapContextImpl   : Injecting JPA temp ClassLoader [org.springframework.instrument.classloading.SimpleThrowawayClassLoader@353e6389] into BootstrapContext; was [null]
2023-11-12 17:02:36.921 DEBUG 23606 --- [           main] o.h.boot.internal.ClassLoaderAccessImpl  : ClassLoaderAccessImpl#injectTempClassLoader(org.springframework.instrument.classloading.SimpleThrowawayClassLoader@353e6389) [was null]
2023-11-12 17:02:36.922 DEBUG 23606 --- [           main] o.h.boot.internal.BootstrapContextImpl   : Injecting ScanEnvironment [org.hibernate.jpa.boot.internal.StandardJpaScanEnvironmentImpl@68631b1d] into BootstrapContext; was [null]
2023-11-12 17:02:36.922 DEBUG 23606 --- [           main] o.h.boot.internal.BootstrapContextImpl   : Injecting ScanOptions [org.hibernate.boot.archive.scan.internal.StandardScanOptions@5a48da4f] into BootstrapContext; was [org.hibernate.boot.archive.scan.internal.StandardScanOptions@a0c5be]
2023-11-12 17:02:36.930 DEBUG 23606 --- [           main] o.h.boot.internal.BootstrapContextImpl   : Injecting JPA temp ClassLoader [null] into BootstrapContext; was [org.springframework.instrument.classloading.SimpleThrowawayClassLoader@353e6389]
2023-11-12 17:02:36.930 DEBUG 23606 --- [           main] o.h.boot.internal.ClassLoaderAccessImpl  : ClassLoaderAccessImpl#injectTempClassLoader(null) [was org.springframework.instrument.classloading.SimpleThrowawayClassLoader@353e6389]
2023-11-12 17:02:36.933 TRACE 23606 --- [           main] o.h.s.i.AbstractServiceRegistryImpl      : Initializing service [role=org.hibernate.id.factory.spi.MutableIdentifierGeneratorFactory]
```

Auto Generated Key에 대한 팩토리를 설정합니다.

```
2023-11-12 17:02:36.933 DEBUG 23606 --- [           main] .i.f.i.DefaultIdentifierGeneratorFactory : Registering IdentifierGenerator strategy [uuid2] -> [org.hibernate.id.UUIDGenerator]
...
```

jdbc 환경설정과 방언과 커낵션에 대한 설정을 제공합니다.

```
2023-11-12 17:02:36.937 TRACE 23606 --- [           main] o.h.s.i.AbstractServiceRegistryImpl      : Initializing service [role=org.hibernate.engine.jdbc.env.spi.JdbcEnvironment]
2023-11-12 17:02:36.937 TRACE 23606 --- [           main] o.h.s.i.AbstractServiceRegistryImpl      : Initializing service [role=org.hibernate.engine.jdbc.dialect.spi.DialectFactory]
2023-11-12 17:02:36.938 TRACE 23606 --- [           main] o.h.s.i.AbstractServiceRegistryImpl      : Initializing service [role=org.hibernate.engine.jdbc.dialect.spi.DialectResolver]
2023-11-12 17:02:36.938 TRACE 23606 --- [           main] o.h.s.i.AbstractServiceRegistryImpl      : Initializing service [role=org.hibernate.engine.jdbc.connections.spi.ConnectionProvider]
2023-11-12 17:02:36.939 TRACE 23606 --- [           main] o.h.s.i.AbstractServiceRegistryImpl      : Initializing service [role=org.hibernate.engine.jndi.spi.JndiService]
```

이제 히카리풀을 셋팅합니다.

```
2023-11-12 21:50:57.891  INFO 42610 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Starting...
2023-11-12 21:50:58.005  INFO 42610 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Start completed.
```

InFlightMetadataCollectorImpl의 주요 역할은 아래와 같습니다.

* 메타데이터 수집: InFlightMetadataCollector는 Hibernate의 구성 정보와 어노테이션, XML 매핑 파일 등을 통해 엔터티 클래스와 데이터베이스 테이블 간의 매핑 정보를 수집합니다. 이
  과정에서 엔터티 클래스의 필드와 데이터베이스 테이블의 칼럼, 관계, 상속 구조 등의 매핑 정보를 수집합니다.
* 메타데이터 유지 관리: 수집된 메타데이터를 관리하고 쿼리 작성, 데이터베이스 매핑, 캐싱 설정 등 다양한 Hibernate 기능을 지원하기 위해 유지 관리합니다.
* 캐싱 설정: 메타데이터를 통해 엔터티와 관련된 캐싱 설정을 구성하고 관리합니다. 이를 통해 캐시 옵션과 캐시 전략을 정의하고 활용할 수 있습니다.
* 쿼리 정의: Hibernate Query Language 쿼리와 Criteria API를 사용하여 쿼리를 정의할 때, InFlightMetadataCollector는 메타데이터를 활용하여 쿼리 작성 및
  파싱을 지원합니다.


InFlightMetadataCollector 밑에 Entity Mapping 와 Query Definition 그리고 Caching Config(2nd Level Cache)가 존재합니다.

```
2023-11-12 17:02:37.137 TRACE 23606 --- [           main] o.h.b.i.InFlightMetadataCollectorImpl    : Import: SampleOneEntity -> com.example.jpastudy.isNew.SampleOneEntity
2023-11-12 17:02:37.137 TRACE 23606 --- [           main] o.h.b.i.InFlightMetadataCollectorImpl    : Import: com.example.jpastudy.isNew.SampleOneEntity -> com.example.jpastudy.isNew.SampleOneEntity
```

InFlightMetadataCollectorImpl은 엔티티 메타데이터의 수집과 초기 처리를 담당하며, EntityBinder는 이러한 메타데이터를 하이버네이트의 매핑 메타모델에 적용하고 실제 데이터베이스 매핑과
연결하는 역할을 합니다.

이 과정은 단순한 값 설정을 넘어서, 복잡한 ORM 매핑 및 관계 처리를 포함한 전체적인 데이터 모델 구축 작업입니다.

```
2023-11-12 21:50:58.094 DEBUG 42610 --- [           main] o.h.cfg.annotations.EntityBinder         : Import with entity name SampleOneEntity
```

정적인 엔티티의 메타정보뿐만 아니라 벨류값도 매핑하는 클래스가 있습니다.

```
2023-11-12 21:50:58.114 DEBUG 42610 --- [           main] o.h.cfg.annotations.SimpleValueBinder    : building SimpleValue for id
```

JPA에서는 엔티티매니저라고 부르고 hibernate에서는 session이라고 부릅니다. 즉, 세션 매니지 팩토리는 엔티티매니저를 만드는 팩토리입니다.

```
2023-11-12 21:50:58.200 DEBUG 42610 --- [           main] o.hibernate.internal.SessionFactoryImpl  : Session factory constructed with filter configurations : {}
```

EntityBinder는 엔티티 클래스의 메타데이터를 하이버네이트의 매핑 메타모델로 변환하는 초기 단계를 담당하며, AbstractEntityPersister는 이 매핑 정보를 사용하여 실제 데이터베이스 작업을
수행하고 엔티티의 상태를 관리하는 역할을 합니다.

아래는 아이디를 가지고 수행하는 정적인 SQL 코드를 미리 만들어둬서 더 빠른 작업이 가능하도록 합니다. 이러한 이유로 아이디로 조회할때 성능상에 장점이 있습니다.
```
2023-11-12 21:50:58.245 DEBUG 42610 --- [           main] o.h.p.entity.AbstractEntityPersister     : Static SQL for entity: com.example.jpastudy.isNew.SampleOneEntity
2023-11-12 21:50:58.245 DEBUG 42610 --- [           main] o.h.p.entity.AbstractEntityPersister     :  Version select: select id from sample_one_entity where id =?
2023-11-12 21:50:58.245 DEBUG 42610 --- [           main] o.h.p.entity.AbstractEntityPersister     :  Snapshot select: select sampleonee_.id, sampleonee_.name as name2_0_ from sample_one_entity sampleonee_ where sampleonee_.id=?
2023-11-12 21:50:58.245 DEBUG 42610 --- [           main] o.h.p.entity.AbstractEntityPersister     :  Insert 0: insert into sample_one_entity (name, id) values (?, ?)
2023-11-12 21:50:58.245 DEBUG 42610 --- [           main] o.h.p.entity.AbstractEntityPersister     :  Update 0: update sample_one_entity set name=? where id=?
2023-11-12 21:50:58.245 DEBUG 42610 --- [           main] o.h.p.entity.AbstractEntityPersister     :  Delete 0: delete from sample_one_entity where id=?
2023-11-12 21:50:58.245 DEBUG 42610 --- [           main] o.h.p.entity.AbstractEntityPersister     :  Identity insert: insert into sample_one_entity (name) values (?)
```


현재 설정이 ddl-auto가 create이므로 아래처럼 로그가 남습니다.
```
2023-11-12 21:50:58.299 DEBUG 42610 --- [           main] org.hibernate.SQL                        : drop table if exists sample_one_entity
Hibernate: drop table if exists sample_one_entity
2023-11-12 21:50:58.337 DEBUG 42610 --- [           main] org.hibernate.SQL                        : drop table if exists sample_two_entity
Hibernate: drop table if exists sample_two_entity
2023-11-12 21:50:58.349 TRACE 42610 --- [           main] .e.j.e.i.NormalizingIdentifierHelperImpl : Normalizing identifier quoting [null]
2023-11-12 21:50:58.350 DEBUG 42610 --- [           main] org.hibernate.SQL                        : create table sample_one_entity (id bigint not null auto_increment, name varchar(255), primary key (id)) engine=InnoDB
Hibernate: create table sample_one_entity (id bigint not null auto_increment, name varchar(255), primary key (id)) engine=InnoDB
2023-11-12 21:50:58.362 DEBUG 42610 --- [           main] org.hibernate.SQL                        : create table sample_two_entity (id binary(255) not null, name varchar(255), primary key (id)) engine=InnoDB
Hibernate: create table sample_two_entity (id binary(255) not null, name varchar(255), primary key (id)) engine=InnoDB
```
