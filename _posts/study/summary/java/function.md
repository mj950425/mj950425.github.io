# 자바 코틀린
자바에서 함수형 인터페이스를 구현하는 두 가지 방법은 익명 클래스와 람다식입니다.

```java
@FunctionalInterface
public interface MyFunctionalInterface {
    void singleMethod();
}

// 익명 클래스 구현
MyFunctionalInterface obj = new MyFunctionalInterface() {
    @Override
    public void singleMethod() {
        System.out.println("Single Method Executed");
    }
};

obj.singleMethod();  // 출력: Single Method Executed

```

```java
@FunctionalInterface
public interface MyFunctionalInterface {
    void singleMethod();
}

// 람다식 구현
MyFunctionalInterface obj = () -> System.out.println("Single Method Executed");

obj.singleMethod();  // 출력: Single Method Executed
```
코틀린에서는 함수형 인터페이스 없이도 람다식을 사용하여 함수를 정의하고 사용할 수 있습니다.

이는 자바보다 더욱 간단하게 람다식을 활용할 수 있도록 합니다.

코틀린에서 람다식 사용
코틀린에서는 함수형 인터페이스의 메서드명을 생략하고 변수명으로 지정하여 사용할 수 있습니다.

```kotlin
// 두 숫자를 더하는 람다식
val add = { x: Int, y: Int -> x + y }

// 람다식 호출
val result = add(3, 4)
println(result)  // 출력: 7
```

함수가 일급 객체(First-Class Citizen)일 때의 장점 중 하나는, 함수가 시그니처만 맞다면 다른 함수와 자유롭게 교체될 수 있다는 점입니다.

이를 통해 코드의 유연성과 재사용성이 크게 향상됩니다.
