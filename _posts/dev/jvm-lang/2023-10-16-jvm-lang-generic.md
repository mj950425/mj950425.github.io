---
layout: post
title: "제네릭과 코틀린 in, out에 대해서 알아보자"
date: 2023-10-16 08:46:00 +0900
categories:
  - jvm-lang
---

# 제네릭과 코틀린 in, out에 대해서 알아보자

자바와 코틀린에는 JDK 1.5 부터 만들어진 generic 이라는 기능이 존재합니다.

사전적 정의로는 클래스 내부에서 사용할 데이터 타입을 외부에서 지정하는 기법 을 의미합니다.

자바와 조금 다르게, 코틀린에서 와일드카드가 사라지고 in, out 이라는 키워드가 새롭게 생겨났습니다. 코틀린을 사용하는 입장에서 정리하면서 공부할 필요가 있음을 느꼈습니다.

제네릭의 사전적 정의의 의미가 어떤 것인지 다시 정리하고, 나아가서 kotlin 의 in, out 에 대해서 공부한 내용을 정리해봤습니다.

# 제네릭이란?

코틀린의 in, out 키워드에 대해서 알아보기 전에, 먼저 제네릭이란 무엇이며 왜 사용하는지 알아보겠습니다.

먼저 제네릭이 없었을 때 어떤 불편함이 있었는지 알아보고, 제네릭을 통해서 어떻게 해소했는지 살펴보겠습니다.

아래 favoriteFruit을 필드로 들고 있는 Person 클래스가 있습니다. 사람들마다 가장 좋아하는 과일은 다르므로, 초기에 다양한 과일 클래스가 들어올 수 있도록 데이터 타입을 Any로 설계했습니다.

```kotlin
class Person(val favoriteFruit: Any)
```

과일 클래스로는 Apple, Banana 가 존재하고, 각자 필드로 color를 갖고 있으며 color를 출력하는 함수가 존재합니다.
```kotlin
class Apple(val color: String) {
    fun printAppleColor() {
        println(color)
    }
}
```

```kotlin
class Banana(val color: String) {
    fun printBananaColor() {
        println(color)
    }
}
```
이제 main 함수에서 personA 인스턴스를 만들고 favoriteFruit의 color를 출력해봅니다.

```java
fun main() {
    val personA = Person(Apple("red"))
    personA.favoriteFruit.printAppleColor()
}
```
하지만 안타깝게도 컴파일에러로 인해서 실행할 수 없습니다. 앞서서 favoritFruit에 사과와 바나나 등등 다양한 클래스를 받을 수 있도록 Any 타입으로 추상화했기 때문입니다.

Any 타입은 printAppleColor 함수가 존재하지 않기때문에, Apple 클래스로 타입 캐스팅을해줘야 컴파일 에러가 발생하지 않습니다. 

아래와 같이 타입 캐스팅을 수행하면 실행이 가능하게 변경됩니다.

```java
fun main() {
    val personA = Person(Apple("red"))
    personA.favoriteFruit.printAppleColor() //compile error
    
    val apple = personA.favoriteFruit as Apple
    apple.printAppleColor()
}
```

만약에 위 코드에서 개발자의 실수로 타입 캐스팅을 Apple이 아니라 Banana로 한다면, 런타임에 예외가 발생합니다.

실제 favoriteFruit은 Apple 클래스의 인스턴스이기 때문입니다. 이는 컴파일에 잡히지 않으므로, 최대한 지양해야하는 부분입니다.

이러한 문제를 제네릭을 사용하면 깔끔하게 해결할 수 있습니다. 제네릭은 클래스 내부에서 사용할 데이터의 타입을 외부에서 정해주는 기법입니다.

또한 타입에 대한 체크가 런타임이 아니라, 컴파일 타임에 이뤄집니다. 그래서 런타임에 발생할 수 있는 타입 에러를 미리 컴파일 타임에 잡을 수 있습니다.

제네릭을 사용해서 Person 클래스를 다시 선언해보겠습니다.
```java
class Person<T>(val favoriteFruit: T)
```

제네릭을 써서 컴파일 에러가 났던 코드를 다시 실행해보겠습니다. 

```kotlin
fun main() {
    val personA = Person<Apple>(Apple("red"))
    personA.favoriteFruit.printAppleColor()
}
```

위 코드를 보면, Person 클래스가 사용할 제네릭 타입을 외부에서 정의해주고 있고 컴파일시에 미리 타입 체크가 되기 때문에 명시적인 다운 캐스팅 없이도 printAppleColor 함수가 정상 동작합니다.

또한 해당 personA의 favoriteFruit를 바나나로써 사용하려고하면 컴파일시에 에러가 발생해서 개발자로 하여금 실수를 방지합니다.

즉 아래와 같습니다.
* 명시적인 타입 캐스팅 제거
* 런타임 예외 제거

이번에는 조금 다른 예시를 살펴보겠습니다.

먼저 Person 클래스에 가장 좋아하는 과일을 바구니에 담는 addFavoriteFruit이라는 함수를 추가했습니다.

```kotlin
class Person(val favoriteFruit: Any) {
    val favoriteFruits = mutableListOf<Any>()
    fun addFavoriteFruitInBasket(fruit: Any) {
        favoriteFruits.add(fruit)
    }
}
```

위 코드에서는 조금 문제점이 있는데요. addFavoriteFruit의 함수 이름에서 알 수 있듯이 과일만 살 수 있게 하고싶지만, 다른 클래스가 들어오는것을 막을 수 없습니다. 

즉, 뜬금없이 과일이 아니라 과자 클래스가 들어올 수도 있습니다.

하지만 위에서 알아본것과 같이, 제네릭을 사용한다면 충분히 막을 수 있습니다.

먼저 제네릭을 통해서 Person 클래스를 아래처럼 변경합니다. 
```kotlin
class Person<T>(var favoriteFruit: T) {
    val favoriteFruits = mutableListOf<T>()
    fun buyFavoriteFruit(fruit: T) {
        favoriteFruits.add(fruit)
    }
}
```

그리고 personA 인스턴스와 personB 인스턴스를 만들어주면, 둘은 이제 각각 Apple과 Banana만 받을 수 있습니다. 

이것은 위에서 알아본것과 같이 외부에서 함수 내부의 제네릭 타입을 컴파일시점에 미리 정해버리기때문에 가능해집니다.


```kotlin
fun main() {
    val personA = Person(Apple("red"))
    val personB = Person(Banana("yellow"))

    // personA.addFavoriteFruitInBasket(Snack("brown")) // compile error
    // personB.addFavoriteFruitInBasket(Snack("brown")) // compile error
}
```

하지만 여전히 아래와 같이 생성자에 Snack 인스턴스를 넣어버리면, 과자를 과일바구니에 담아버리는 상황이 연출됩니다.
```kotlin
fun main() {
    val personC = Person(Snack("brown"))
}
```

이것은 과일 인터페이스를 만들고, 제네릭에 부모 클래스를 명시해줌으로써 해결이 가능합니다.

먼저 과일 인터페이스를 만들고 각 과일에 씌워줍니다.
```kotlin
interface Fruit {
    fun printColor()
}

class Apple(val color: String) : Fruit {
    override fun printColor() {
        println(color)
    }

}

class Banana(val color: String) : Fruit {
    override fun printColor() {
        println(color)
    }
}
```

그리고 아래와 같이 Person 클래스 제네릭 변수에 T 에 Fruit 이라는 부모를 명시해줍니다.
```kotlin
class Person<T : Fruit>(var favoriteFruit: T) {
    val favoriteFruits = mutableListOf<T>()
    fun buyFavoriteFruit(fruit: T) {
        favoriteFruits.add(fruit)
    }
}
```

그러면 이제 Person의 제네릭은 외부에서 정해주는데 아무 값이 아니라 Fruit 인터페이스를 상속받은 값만 가능해집니다.

여기까지 제네릭의 기초에 대해서 다시 파악해봤습니다.

# 변성, 무변성, 공변성, 반공변성
이제 본격적으로 in, out 키워드에 대해서 알아봅니다.

먼저 변성, 무변성, 공변성, 반공변성 이라는 개념을 이해해야합니다.

변성이란?
* 기저타입(래핑 타입)이 같고, 타입 인자(제네릭 인자)가 다른경우 가지는 관계

무변성이란?
* 기저타입(래핑 타입)이 같고, 타입 인자(제네릭 인자)가 다른경우 아무런 관계가 없다는 개념

공변성이란?
* A가 B의 하위 자료형이라면 Class<A>도 Class<B>의 하위자료형이라는 개념

반공변성이란?
* A가 B의 하위 자료형이라면 Class<B>가 Class<A>의 하위자료형이라는 개념

기본적으로 jvm 언어에서는 무변성을 원칙으로 가집니다. 즉, 제네릭이 다르면 같은 기저타입이더라도 두 클래스는 아무런 관계가 없습니다.

결국 관계를 가지려면 같은 기저타입이면서 제네릭도 같아야합니다.

이에 대해서 더 자세하게 알아보겠습니다.

아래와 같이 간단하게 Animal 를 상속하는 Dog 를 만들고 Dog 배열을 Animal 배열로 다루는 코드가 있습니다.
```koltin
open class Animal()
```

```kotlin
class Dog() : Animal()
```

얼핏 보기에는 아래 코드가 가능해보입니다. Dog 배열을 Animal 배열로 다루는것으로 자연스럽게 생각이 들 수도 있지만, 컴파일 에러가 발생합니다.
```kotlin
val animals:Array<Animal> = arrayOf<Dog>()
```

하지만 자바 컴파일러는 무변성을 기본 원칙으로 하기 때문에, Array<Animal>와 Array<Dog>는 아무런 관계가 없습니다.

즉, Array<Animal>이 Array<Dog>의 상위타입이되려면 공변성을 허용해야하지만 그렇지 않습니다.

왜 이렇게 컴파일러를 만들었을까요? 공변성을 허용한다고 가정해보면, 어떤 문제가 발생할 수 있는지 알아봅니다.

먼저 새롭게 Animal클래스를 상속하는 Cat클래스를 만들어줍니다.

```kotlin
class Cat() : Animal(){
}
```

그리고 무변성이 기본 원칙이 아니라고하면, 아래 코드가 컴파일 에러가 발생하지 않을것입니다. 

왜냐하면 Array<Animal>이 Array<Dog>의 상위 자료형이기 때문에 자식을 부모 클래스로 다루는것은 자연스러운 일입니다.
```kotlin
val animals:Array<Animal> = arrayOf<Dog>()
animals.plus(Cat())
```

그리고 이후에 아래 코드도 컴파일시에 에러가 발생하지 않을 것입니다. 왜냐하면 Animal로 다루고 있는 배열에 자식 클래스인 Cat을 원소로 넣는것은 자연스러운 일입니다.
```koltin
animals.plus(Cat())
```

하지만 런타임에 Cat 인스턴스를 실제로 넣는 과정에서 문제가 발생할 것입니다. 왜냐하면 Animal로 다루고는 있었지만 실제로는 강아지 배열이고 여기에 고양이를 넣는다는것은 불가능하기 때문입니다.

개가 고양이가 될 수는 없기 때문에..

공변성을 허용한다면 이러한 런타임 에러를 발생시킬 수 있기 때문에, 컴파일 시점에 에러를 뱉도록 컴파일러가 설계되었습니다.

그렇다고 다형성을 허용하지 않는것은 아닙니다.

Array<Dog>를 Array<Animal>로 다루려고할 때 컴파일 에러가 발생하는것이지 Dog이나 Cat을 Animal로 다루는것은 자연스러운 일입니다.

즉, 아래 코드는 문제가 없습니다.

```kotlin
val animals = arrayOf<Animal>()
animals.plus(Dog())
animals.plus(Cat())
```

# out 키워드
여기까지 이해했으면 이제 out이 무엇인지 이해할 준비가 완료되었습니다.

지금까지 공변성을 왜 허용하지 않는지에 대해서 알아봤는데, 반대로 공변성의 제한을 어느정도 완화해주기를 바라는 니즈도 존재합니다.

그 때 사용되는게 바로 out 키워드입니다. 어떠한 경우에 사용할 수 있는지 알아보겠습니다.

```kotlin
fun copyFromTo(from: Array<Animal>, to: Array<Animal>) {
    for (i in from.indices) {
        to[i] = from[i]
    }
}
```

```kotlin
fun main() {
    val animals: Array<Animal> = arrayOf(Animal(), Animal())
    val cats: Array<Cat> = arrayOf(Cat(), Cat())

    // Error - Type mismatch: inferred type is Array<Cat> but Array<Animal> was expected
    copyFromTo(cats,animals)
}
```

위 코드를 살펴보면, 단순히 다형성을 이용해서 cat 배열에 존재하는 cat들을 animal 배열로 옮기는 코드입니다.

하지만 해당 코드는 컴파일 에러를 뱉는데요. 문제의 원인은 함수의 인자를 받는곳입니다. (참고로 to[i] = from[i] 부분은 다형성을 이용하는 부분으로 컴파일 에러를 일으키지 않습니다)

from 인자의 타입은 Array<Animal>인데 Array<Cat>을 밀어넣으려니 문제가 발생한것입니다. 왜냐하면 무변성 원칙에 따라서 Array<Animal>과 Array<Cat>은 아무런 관계가 없기 때문입니다.

개발자 입장에서는 단순하게 다형성을 이용해서 Animal에 특정 동물을 옮기는 코드인데 컴파일 에러로 인해서 사용이 불가능하니 아쉽습니다.

이러한 이유로 out이 만들어졌고, 아래와 같이 사용하면 컴파일 에러가 발생하지않고 정상적으로 동작합니다.
```kotlin
fun copyFromTo(from: Array<out Animal>, to: Array<Animal>) {
    for (i in from.indices) {
        to[i] = from[i]
    }
}
```

```kotlin
fun main() {
    val animals: Array<Animal> = arrayOf(Animal(), Animal())
    val cats: Array<Cat> = arrayOf(Cat(), Cat())

    copyFromTo(cats,animals)
}
```

함수의 인자에서 제네릭 타입으로 out 키워드가 붙으면 공변성을 허용합니다. 즉 해당 코드에서는 Array<Cat>이 Array<Animal>의 자식이 된다는 뜻입니다.

그렇기때문에 별 문제없이 코드가 잘 동작합니다. 이렇게 허용해줌으로써 copyFromTo 메소드는 강아지 배열을 옮길때도 쓸 수 있게되었고, 고양이 배열을 옮길때도 쓸 수 있게되었습니다.

그런데 이렇게 공변성을 허용해주면 앞에서 알아본 것처럼, from에 Dog을 넣어버린다면 또 다시 런타임 에러가 발생하는것이 아닌지 의심이듭니다.

의심을 구체화해서 적어보면 아래와 같습니다.

out 키워드가 붙어있으므로 Array<Cat>이 Array<Animal>로 다뤄질 수 있도록 공변성의 제한이 완화되었기 때문에, copyFromTo 메소드 안으로 진입하는데는 문제가 없었어.
하지만 from이 실제 데아터 타입이 Array<Cat>이지만 Array<Animal>로 다뤄지면서, Dog 를 집어넣는 코드가 함수 내부에 있다면 런타임 에러가 발생할거야.
컴파일시에는 이를 잡아줄 수 없으므로 제네릭의 장점이 사라지면서 큰 문제로 야기될 수 있겠다.🤔

그렇기 때문에 코틀린 컴파일러는 out 키워드가 붙은 인자에는 아예 쓰기가 불가능하도록 막아뒀습니다. 아래 코드를 보자.
```kotlin
fun copyFromTo(from: Array<out Animal>, to: Array<Animal>) {
    for (i in from.indices) {
        to[i] = from[i]
    }

    from[0] = Dog()
    // Error - Type mismatch: inferred type is Cat but Nothing was expected
}
```

새롭게 추가된 `from[0] = Dog()` 코드라인에서 컴파일 에러가 발생합니다. 그 이유로는 앞에서 말씀드린것처럼 out 키워드가 붙으면 쓰기 작업이 안되므로 고양이에게 강아지가 되라는 명령이 불가능합니다.

**정리해보면, out 키워드가 붙으면 공변성의 제한이 완화되면서 값을 읽는것은 가능해집니다. 덕분에 값을 읽어서 to로 옮기는것이 가능했습니다. 하지만 런타임에 from에 다른 타입의 값이 들어오는것을 방지하기위해서 쓰기는 컴파일시에 막힙니다.**

코틀린에서 List가 불변인 것도 이와 관계가 있습니다. 아래 사진을 보면 라이브러리에서 List를 정의할 때 out 키워드를 붙여준 것을 볼 수 있는데요. 즉 List 로 다뤄지는 것은 쓰는 것이 불가능하다는 의미입니다. list.add("value") 와 같은 행동이 불가능합니다. 
![그림1](/assets/img/dev/jvm-lang/img.png)

# in 키워드
out 키워드가 공변성의 제한을 완화시켜준다고 알아봤는데, 반대로 in 키워드는 반공변성의 제약을 완화시켜주는 키워드입니다.

아래 코드로 알아보겠습니다. 이번에는 Any타입으로 배열을 만들고, Cat타입의 데이터를 Any타입의 배열로 옮기려고 합니다.

즉, 이전에는 Animal배열에 Cat배열을 옮기려고 시도했다면, 지금은 Any배열에 Cat배열을 옮기려는것입니다.
```kotlin
fun copyFromTo(from: Array<out Animal>, to: Array<Animal>) {
    for (i in from.indices) {
        to[i] = from[i]
    }
}
```

```kotlin
fun main() {
    val anys: Array<Any> = arrayOf(Any(), Any())
    val cats: Array<Cat> = arrayOf(Cat(), Cat())

    // Error - Type mismatch: inferred type is Array<Any> but Array<Animal> was expected
    copyFromTo(cats,anys)
}
```

이번에는 from이 문제가 아니라, to가 문제입니다. 기본적으로 반공변성을 허용하지 않으므로 Array<Any>와 Array<Animal>은 아무런 관계가 없습니다.

똑같이 이번에는 in 키워드를 통해서 반공변성 제약을 완화시켜보겠습니다.

```kotlin
fun copyFromTo(from: Array<out Animal>, to: Array<in Animal>) {
    for (i in from.indices) {
        to[i] = from[i]
    }
}
```

```kotlin
fun main() {
    val anys: Array<Any> = arrayOf(Any(), Any())
    val cats: Array<Cat> = arrayOf(Cat(), Cat())

    copyFromTo(cats,anys)
}
```

그러면 이제 반공변성에 따라서, Array<in Animal>은 Array<Any>의 부모 클래스가 됩니다.

그러므로 Array<Animal>에 Array<Any>를 넣어주는것은 자식을 부모로 다루는 자연스러운 일입니다.

또한 Any가 Animal의 부모이므로 `to[i] = from[i]` 도 문제되지 않습니다.

하지만 아래와 같이 반공변성의 제약을 완화시킨상태에서 값을 읽으려고하면 문제가 발생합니다.
```kotlin
fun copyFromTo(from: Array<out Animal>, to: Array<in Animal>) {
    for (i in from.indices) {
        to[i] = from[i]
    }
    val any:Animal = to[0] //Type mismatch.
}
```

컴파일러가 이렇게 만든 이유는 아래와 같습니다.

to에 들어온 값은 Array<Animal>의 부모 클래스만 가능합니다.

실제로 들어왔던 Any에는 Animal이 갖고 있는 기능이 없습니다. 하지만 반공변성을 허용한다면 아래와 같은 코드가 컴파일시에 안잡히겠죠.
```kotlin
fun copyFromTo(from: Array<out Animal>, to: Array<in Animal>) {
    for (i in from.indices) {
        to[i] = from[i]
    }
    val any:Animal = to[0] //Type mismatch.
    any.animalMethod() //Runtime error
}
```

하지만 실제로 Any타입인데 Animal의 메소드를 사용하려고하니깐 런타임 예외가 발생할것입니다.

결국 정리해보면 in은 반공변성을 어느정도 완화해주지만, 해당 함수 안에서 쓰기는 가능하지만 읽기가 불가능합니다.