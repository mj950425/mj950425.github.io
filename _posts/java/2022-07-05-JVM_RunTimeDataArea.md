---
title: '2022-07-05-JVM_RunTimeDataArea'
excerpt: ' '
categories:
    - java
tag:
    - java
toc: false
---
# JVM 이란?
JVM 은 Java Virtual Machine 의 약자입니다. 컴퓨터의 세상에서 Virtual 이 들어가면 전부 소프트웨어로 생각하면 편합니다. 각 벤더들이 정해진 스펙에 맞춰서 자신들의 JVM 을 구현해서 사용하고 하나의 독자적인 프로세스 형태로 구동되는 런타임 인스턴스 입니다. 

자바에서 프로그램을 실행한다는 것은 javac 를 통해서 생긴 Class 파일을 JVM 으로 클래스로딩하고 바이트 코드를 해석하는 과정을 거쳐 메모리 등의 리소스를 할당하고 관리하는 일련의 작업을 포함합니다.

즉 그림으로 확인해보면 아래와 같습니다.
![image](https://user-images.githubusercontent.com/52944973/177257141-e594fb81-683e-410b-bcb2-95d210fb5039.png)

```
 **- Java Source:** 사용자가 작성한 Java 코드이다
 **- Java Compiler:** Java Source 파일을 JVM이 해석할 수 있는 Java Byte Code로 변경한다.
 **- Java Byte Code:** Java Compiler에 의해 수행될 결과물이다(확장자 .class 파일)
  
 **- Class Loader:** JVM 내로 .class 파일들을 Load하여 Loading된 클래스들을 Runtime Data Area에 배치된다.
 **- Execution Engine:** Loading된 클래스의 Bytecode를 해석(interpret)한다.
 **- Runtime Data Area:** JVM이라는 프로세스가 프로그램을 수행하기 위해 OS에서 할당받은 메모리 공간이다.
```

**Hotspot JVM** 은 미국의 LLC 라는 회사에서 만든 JVM입니다. JVM 은 각 벤더들이 만들지만 대부분 Hotspot JVM 을 사용합니다. 많이 사용되는 WAS에서 IBM사의 WebSphere 만 IBM JVM 을 사용하고 나머지는 대부분 Hotspot JVM 을 사용한다 보면 될 것 같습니다.

JVM에는 Run-Time Data Area 에는 크게 Method Area, Heap, Stacks, PC registers 그리고 Native Method Stacks 가 존재합니다. 
그림으로 보면 아래와 같습니다.
![image](https://user-images.githubusercontent.com/52944973/177255287-a9628850-48c5-4c6e-b20c-327115c294b0.png)

## Metohd Area(Class Area)
Method Area 에는 인스턴스 생성을 위한 객체 구조, **생성자**, **필드** 등이 저장됩니다. Runtime Constant Pool 과 static 변수, 그리고 클래스 같은 데이터들도 이곳에서 관리가 됩니다. 더 구제적으로는 Heap의 PermGen이라는 영역에 속한  영역인데 Java 8 이후로는  Metaspace라는 OS가 관리하는 영역으로 옮겨지게 됩니다. 
이 영역은 JVM 당 **하나만** 생성이 됩니다. 인스턴스 생성에 필요한 정보도 존재하기 때문에 JVM 의 ***모든 스레드들이 이 영역을 공유하게 됩니다.*** JVM 의 다른 메모리 영역에서 해당 정보에 대한 요청이 오면, 실제 물리 메모리 주소로 변환해서 전달해줍니다. 기초 역할을 하므로 JVM 구동시에 생성되며 종료 시 까지 유지되는 공통 영역입니다.

## Heap
Heap 영역은 코드 실행을 위한 자바로 구성된 객체 및 JRE 클래스들이 탑재됩니다. 이곳에서는 문자열에 대한 정보를 가진 String Pool 뿐만이 아니라 실제 데이터를 가진 인스턴스, 배열등이 저장 됩니다. JVM 당 역시 하나만 생성이 되고, 해당 영역이 가진 데이터는 모든 자바 스택 영역에서 참조되어 스레드 간 공유가 됩니다. Heap 영역이 가득 차게 되면 OutOfMemoryError 를 발생시킵니다.
Heap 에서는 참조되지 않는 인스턴스와 배열에 대한 정보 또한 얻을 수 있기 때문에 GC 의 주 대상이기도 합니다. 이 때, 인스턴스가 생성된 후 시간에 따라서 Young Generation 과 Old Generation 으로 나눌 수 있습니다. 

### Minor GC, Full GC
**Young Generation** 은 **Eden** 영역과 **Survivor** 영역으로 구성되는데 Eden 영역은 Object  가 Heap 에 최초로 할당되는 장소이며, Eden 영역이 꽉 차게 되면 Object 의 참조 여부를 따져 Live Object 면 Survivor 영역으로 넘기고, 참조가 끊어진 Garbage Object 이면 그냥 남겨 놓습니다. 
Survivor 영역은 말 그대로 Eden 영역에서 살아남은 Object 들이 잠시 머무르는 곳 입니다. 이 Survivor 영역은 두 개로 구성되는데 Live Object 를 대피시킬 때는 하나의 Survivor 영역만 사용하게 됩니다. 
Young Generation 에서 이루어지는 과정을 ***Minor GC*** 합니다. 
과정을 살펴보면 
1. Minor GC 가 일어나면 Survivor1에 살아있는 객체를 Survivor2로 복사합니다. 그리고 Survivor1 과 Eden 을 클리어 합니다. 
결과적으로 한번의 Minor GC 에서 살아남은 객체만 Survivor2 영역에서 살아납니다. 
2. 그리고 다음번에 Minor GC 가 다시 발생하면 같은 방식으로 Eden 과 Survivor2 영역에서 살아있는 객체를 Survivor1로 복사하고 클리어 합니다. 결과적으로 Survivor1 에만 살아있는 객체가 남게 됩니다.
3. 이렇게 반복적으로 Survivor1, Survivor2 를 왔다갔다 하다가, 오래 살아남은 객체는 Old 영역으로 옮겨지게 됩니다.
=> Survivor 두 영역중 하나는 반드시 비어있는 상태입니다. 만약 두 영역에 모두 데이터가 존재하거나, 사용량이 0 이라면 정상적인 상황이 아닙니다.

이렇게 Old 영역으로 옮겨가는 객체들은 일정 회수 이상 참조된 객체들인데 이러한 과정 중 Old Generation 의 메모리도 충분하지 않으면 해당 영역에서도 GC 가 발생하는데 이를 ***Full GC(Major GC)*** 라고 합니다.  
Full GC 에는 여러가지 알고리즘이 존재합니다. 
Serial GC, Parallel GC, Mark & Compact 알고리즘 등등.. 대표적으로 Mark & Compact 알고리즘을 살펴보면 이 알고리즘은 말 그대로 객체들의 래퍼런스를 한번 쭉 따라가면서 사용하지 않는 객체들을 Mark 한 뒤, 다음번 작업에서 사용하는 객체들만 압축해서 모아놓고 나머지는 클리어 시킵니다.

**Full GC 의 수행시간은 상대적으로 깁니다. 그리고 Full GC 실행에 시간이 오래 소요되면 연계된 여러 부분에서 타임아웃이 발생할 수 있습니다. 따라서 GC 를 관리하는 작업은 중요합니다.**

Perm 영역은 보통 **Class Mata, Method Meta, static 변수와 상수 정보**들이 저장되는 공간으로 메타데이터 저장 영역이라고 불립니다.

### **GC 관련 파라미터**
1. Heap 사이즈 조절
Xms : 최소 힙 사이즈/ Xmx : 최대 힙 사이즈

2. Perm 사이즈 조절
자바 어플리케이션 클래스가 로딩되는 영역이다.
-XX:MaxPermSize=128m 식으로 지정이 가능합니다.
3. New, Old 영역 크기 비율 조정
4. Survivor 영역 조정
5. -server/-client 옵션
서버는 서버용 어플리케이션에 적합한 jvm 옵션입니다. 부팅 시간보다는 요청에 대한 응답시간을 중요시 합니다. 세션이 끊기면 특정 사용자에 대한 객체는 사라지므로 상대적으로 Old 영역이 작고 New 영역이 큽니다. 
반면 클라이언트는 빠른 앱 부팅 시간이 장점입니다. 하나의 클라이언트에서는 객체가 오래 살아있으므로 Old 영역이 더 큽니다.
6. GC 알고리즘 선택


### GC 튜닝을 항상 할 필요는 없다
자바의 GC 튜닝은 꼭 필요한 경우에 하는게 좋습니다. 기본적인 메모리 크기 정도만 지정하면 어느정도 사용량이 적당한 시스템에서는 튜닝을 굳이 할 필요가 없습니다.

튜닝을 해야하는 상황은 아래와 같습니다.
* Jvm 의 메모리 크기도 지정하지 않았고,
* TimeOut 이 지속적으로 발생하고 있을 때

이럴 때 튜닝하는 것이 좋습니다. 이 두가지 상황이 아니라면 다른 작업을 하는 것이 더 좋습니다. ***즉 다른 것 부터 건드리고 마지막으로 튜닝을 하는 것 입니다.*** 

String 대신 StringBuilder 를 사용한다던가 로그를 최대한 적게 쌓도록 만들다던가의 작업이 선행되어야 합니다.

마지막으로 GC 튜닝을 하게 되었다면 크게 두가지로 나뉩니다. 
**1. Old 영역으로 넘어가는 객체의 수를 최소화하는 것** 
**2. Full GC의 실행시간을 줄이는 것**

Old 영역은 New 영역에 비해 GC 시간이 상대적으로 오래 소요됩니다. 따라서 Old 객체로 넘어가는 수를 줄이면 Full GC 가 발생하는 빈도를 줄일 수 있습니다. New 영역의 크기를 잘 조절함으로써 튜닝할 수 있습니다.

Old 영역의 크기를 줄이면 Full GC 의 실행 시간은 줄어들지만 OutOfMemoryError 가 발생하거나 Full GC 의 횟수가 늘어납니다. 반대로 Old 영역의 크기를 늘린다면 Full GC 의 횟수는 줄지만 실행 시간이 늘어납니다.

GC 수행 시간의 관계는 다음과 같습니다.

-   메모리 크기가 크면,  
    - GC 발생 횟수는 감소한다.  
    - GC 수행 시간은 길어진다.
    
-   메모리 크기가 작으면,  
    - GC 발생 횟수는 짧아진다.  
    - GC 수행 시간은 증가한다.

## Java Stacks
각 Thread 별로 따로 할당되는 영역입니다. Heap 메모리 영역보다 비교적 빠르다는 장점이 있습니다. 또한 동시성 문제에서 자유롭습니다. 메소드 호출 주소, 매개 변수, 지역 변수가 Frame 이라는 단위로 저장됩니다.

## Native Method Stacks
Java 로 작성된 프로그램을 실행하면서, 순수하게 Java 로 구성된 코드만을 사용할 수 없는 시스템의 자원이나 API 가 존재합니다. 다른 프로그래밍 언어로 작성된 메소드들을 _Native Method_ 라고 합니다. Native Method Stacks 는 Java 로 작성되지 않은 메소드를 다루는 영역입니다.

## PC Register
Java 에서 Thread 는 각자의 메소드를 실행하게 됩니다. 이때, Thread 별로 동시에 실행하는 환경이 보장되어야 하므로 최근에 실행 중인 JVM 에서는 명령어 주소값을 저장할 공간이 필요합니다. 이 부분을 PC Registers 영역이 관리하여 추적해주게 됩니다. Thread 들은 각각 자신만의 PC Registers 를 가지고 있습니다.
