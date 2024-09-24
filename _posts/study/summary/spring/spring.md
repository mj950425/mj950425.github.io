# 스프링 autoconfigure

1. 컴포넌트 스캔 범위 안에 들어오는 @Bean, @Configuration 등등 컴포넌트 어노테이션이 붙은 클래스들은 전부 빈으로 등록된다.
2. @Import(클래스명)은 컴포넌트 스캔의 범위가 아니어도 해당 클래스를 빈으로 등록한다.
3. ImportSelector를 구현한 구현체는 @Import 어노테이션에 명시되어있으면 selectImports 메소드의 반환값을 빈으로 등록한다.
4. 스프링부트의 자동구성도 같은 메커니즘이다. @EnableAutoConfiguration의 메타어노테이션인 @Import가 AutoConfigurationImportSelector를 value로 가지고있고,
   여기에서 AutoConfigurationImportSelector가 전부 AutoConfiguration.imports안의 클래스들을 빈 후보로 등록한다.

