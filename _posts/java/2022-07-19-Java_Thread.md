---
title: '2022-07-19-Java_Thread'
excerpt: ' '
categories:
    - java
tag:
    - java
toc: false
---
# 자바 쓰레드란

java 명령어를 사용하여 클래스를 실행시키는 순간 자바 프로세스가 시작되고, main() 메소드가 수행되면서 하나의 쓰레드가 시작되는 것 입니다.

만약 많은 쓰레드가 필요하다면, 이 main 메소드에서 쓰레드를 생성해주면 됩니다.

WAS 에서도 똑같이 main 메소드에서 생성하는 스레드들이 수행되는 것 입니다.

그렇다면 왜 쓰레드라는 것이 있을까요?

프로세스가 하나 시작하려면 많은 자원이 필요합니다. 하나의 작업을 동시에 수행하려고 여러 개의 프로세스를 띄워서 실행하면 각각 메모리를 할당하여 주어야합니다.

JVM 은 기본적으로 아무런 옵션 없이 실행하면 적어도 **32MB~ 64MB** 의 물리 메모리를 점유합니다.

그에 반해서, 쓰레드를 하나 추가하려면 **1MB** 이내의 메모리를 점유합니다.

그래서 쓰레드를 경량 프로세스라고도 부르고, 멀티 코어 시대인 현재 단일 쓰레드보다 다중 쓰레드로 실행하는 것이 더 빠른 시간에 결과를 제공해줍니다.

## Runnable 인터페이스와 Thread 클래스

쓰레드를 생성하는 방법으로는 크게 2가지가 존재합니다.

1. Runnable 인터페이스
2. Thread 클래스

Thread 클래스 또한 Runnable 인터페이스를  구현한 것입니다.

Runnable 인터페이스에는 run() 메소드 하나만 존재합니다.

Runnable 인터페이스를 구현한 RunnableSample 를 만듭니다.
```java
public class RunnableSample implements Runnable {  
  
  @Override  
  public void run() {  
        System.out.println("This is RunnableSample's run() method ");  
  }  
}
```

Thread 를 상속받은 ThreadSample 을 만듭니다.

```java
public class ThreadSample extends Thread {  
    public void run() {  
        System.out.println("this is ThreadSample1s's run() method");  
  }  
  
}public class ThreadSample extends Thread {  
    public void run() {  
        System.out.println("this is ThreadSample1s's run() method");  
  }  
  
}
```

그 다음 인스턴스를 생성하고 각각 start() 를 호출합니다.

```java
public class RunThreads {  
    public static void main(String[] args) {  
      RunThreads threads = new RunThreads();  
	  threads.runBasic();  
  }  
  
    public void runBasic() {  
        RunnableSample runnable = new RunnableSample();  
		new Thread(runnable).start();  
  
		ThreadSample thread = new ThreadSample();  
		thread.start();  

		System.out.println("RunThreads.runBasic() method is ended.");  
  }  
}
```

- 쓰레드가 수행하는 우리의 코드는 **run()** 메소드 입니다.
- 쓰레드가 시작하는 메소드는 **start()** 입니다.

start() 를 실행하면 알아서 run() 를 실행하도록 되어있습니다.

실행해보면 결과가 아래와 같이 나옵니다.

```
This is RunnableSample's run() method 
RunThreads.runBasic() method is ended.
this is ThreadSample1s's run() method
```

그런데 항상 이렇게 나오는게 아니라 실행할 때 마다 달라집니다.

쓰레드라는 것을 start() 메소드를 통해서 시작했다는 것은, 프로세스가 아닌 하나의 쓰레드를 JVM 에 추가해서 실행한다는 의미입니다.

runnable 객체의 start() 가 실행되면 메소드가 끝날때 까지 기다리는게 아니라 바로 thread 객체의 start() 로 넘어갑니다.

똑같이 run() 메소드가 끝날 때 까지 기다리지 않고 바로 `System.out.println("RunThreads.runBasic() method is ended.");`  라인으로 넘어갑니다.

좀 더 직관적인 이해를 위해서 아래와 같이 배열로 만들어서 실행해봤습니다.

```java
public class RunMultiThreads {  
    public static void main(String[] args) {  
        RunMultiThreads runMultiThreads = new RunMultiThreads();  
  runMultiThreads.runMultiThread();  
  }  
  
    public void runMultiThread() {  
        RunnableSample[] runnable = new RunnableSample[5];  
  ThreadSample[] thread = new ThreadSample[5];  
 for (int i = 0; i < 5; i++) {  
            runnable[i] = new RunnableSample();  
  thread[i] = new ThreadSample();  
  
 new Thread(runnable[i]).start();  
  thread[i].start();  
  }  
  
        System.out.println("RunMultiThreads.runBasic() method is ended.");  
  }  
}
```

결과는 아래와 같습니다.

```
This is RunnableSample's run() method 
This is RunnableSample's run() method 
this is ThreadSample1s's run() method
this is ThreadSample1s's run() method
This is RunnableSample's run() method 
this is ThreadSample1s's run() method
This is RunnableSample's run() method 
this is ThreadSample1s's run() method
This is RunnableSample's run() method 
RunMultiThreads.runBasic() method is ended.
this is ThreadSample1s's run() method
```

## 생성자

모든 쓰레드에는 이름이 있습니다. 아무런 이름을 등록하지 않으면 쓰레드의 이름은 Thread-n 입니다.

쓰레드의 이름은 생성자의 매개변수로 등록할 수 있습니다.

쓰레드의 생성자는 아래와 같이 존재합니다.

밑에서 두번째의 생성자에 있는 stackSize 라는 값은 쓰레드 생성시에 생기는 스택의 크기를 이야기합니다.

![image](https://user-images.githubusercontent.com/52944973/179750093-1dfa3cc0-1d4f-47f7-ae4d-d043466e59ac.png)

#### sleep() 메소드

Thread 클래스에는 sleep() 이라는 대기하는 메소드가 존재합니다.

해당 메소드를 사용할 때에는 반드시 try catch 문으로 감싸주고 InterruptedException 을 캐치해줘야 합니다.

왜냐면 sleep() 메소드는 InterruptedException 을 던질수도 있다고 명시되어 있기 때문입니다.

쓰레드는 main() 메소드의 수행이 끝나더라도, main() 메소드나 다른 메소드에서 시작한 쓰레드가 종료하지 않으면 해당 자바 프로세스는 끝나지 않습니다. 

단 해당 쓰레드가 종료되지 않아도 다른 쓰레드가 실행중인 것이 없다면 해당 쓰레드를 종료 시키는 데몬 쓰레드라는 것도 존재합니다. 

## Synchronized

여러 쓰레드가 한 객체에 선언된 메소드에 접근하여 데이터를 처리하려고 할 때 동시에 연산을 수행하여 값이 꼬이는 경우가 발생할 수 있습니다.

단 메소드에서 인스턴스 변수를 수정하려고 할 때에만 이러한 문제가 발생합니다. 

**매개 변수**나 메소드에서만 사용하는 **지역변수**만 다루는 메소드는 전혀 synchronized 로 선언할 필요가 없습니다.

사용하는데에는 2가지 방법이 있습니다.
- 메소드 자체를 synchronized 로 선언하는 방법
- 메소드 내 특정 문장만 synchronized 로 감싸는 방법


```java
public class CommonCalculate {  
    private int amount;  
  
 public CommonCalculate() {  
        amount = 0;  
  }  
  
    public void plus(int value) {  
        amount += value;  
  }  
  
    public void minus(int value) {  
        amount -= value;  
  }  
  
    public int getAmount() {  
        return amount;  
  }  
}
```

```java
public class ModifyAmountThread extends Thread {  
    private CommonCalculate calc;  
 private boolean addFlag;  
  
 public ModifyAmountThread(CommonCalculate calc, boolean addFlag) {  
        this.calc = calc;  
 this.addFlag = addFlag;  
  }  
  
    @Override  
  public void run() {  
        for (int i = 0; i < 10000; i++) {  
            if (addFlag) {  
                calc.plus(1);  
  } else {  
                calc.minus(1);  
  }  
        }  
    }  
}
```

```java
public class RunSync {  
	public static void main(String[] args) {  
		RunSync runSync = new RunSync();  
		runSync.runCommonCalculate();  
  }  
  
	public void runCommonCalculate() {  
		CommonCalculate calc = new CommonCalculate();  

		ModifyAmountThread thread1 = new ModifyAmountThread(calc, true);  
		ModifyAmountThread thread2 = new ModifyAmountThread(calc, true);  

		thread1.start();  
		thread2.start();  
  
		try {  
			thread1.join();  
			thread2.join();  
			System.out.println("Final value is " + calc.getAmount());  
			
		} catch (InterruptedException e) {  
		            e.printStackTrace();  
		}  
    }  
}
```

여기에서 join 은 종료되는 순서를 지켜줍니다. 즉 thread1 이 종료되고 thread2 가 종료되며 출력문이 종료됩니다. 

결과를 보면 아래와 같습니다.

```
Final value is 13096
```
thread1 에 의해 amount 가 1 이 더해지는 순간에 thread2 에서도 접근해서 1을 더하면서 +2가 아니라 +1 이 되는 경우가 존재합니다.

그 결과로 값이 20000이 나오지 않는 것 입니다.

**join** 은 **종료 시점만** 지켜줄 뿐이지 하나의 데이터에 여러개의 스레드가 동시에 접근한다는 사실은 바뀌지 않습니다.

이러한 문제를 해결하기 위해서 나온게 **synchronized** 입니다.

앞에서의 plus method 앞에 synchronized 예약어를 아래와 같이 추가합니다.

```java
public synchronized void plus(int value) {  
    amount += value;  
}
```

그리고 쓰레드의 run 에서 plus 를 부르는 반복문의 횟수를 아래와 같이 늘렸습니다.

```java
@Override  
public void run() {  
    for (int i = 0; i < 1000000; i++) {  
        if (addFlag) {  
            calc.plus(1);  
  } else {  
            calc.minus(1);  
  }  
    }  
}
```

결과는 아래와 같습니다.

    Final value is 2000000

이렇게 변경하면 어떤 스레드에서 plus() 메소드를 수행하고 있을 때 다른 쓰레드에서 수행하려고 하면, 늦게 온 쓰레드는 앞서 수행하는 메소드가 끝날 때 까지 기다리게 됩니다.

그런데 이렇게 메소드 전체에 sync 를 걸어줄 경우 성능상의 큰 단점이 존재합니다.

만약에 메소드의 길이가 1000줄인데 amount 라는 변수에 접근하는 코드는 단 한줄이라면, 해당 한줄을 동기로 처리하기 위해서 나머지 999줄이 동기로 동작하게 됩니다.

따라서 이러한 경우에는 메소드 전체를 감싸면 안되며 amount 라는 변수를 처리해주는 부분만 sync 를 걸어주면 됩니다.

이러한 경우는 다음과 같이 작성해주면 됩니다.

Object 객체인 addLock 이나 minusLock 과 같은 경우에는 문지기라고 생각하시면 됩니다.

```java
public class CommonCalculate {  
	private int amount;  
	private Object addLock = new Object();  
	private Object minusLock = new Object();
	
	public CommonCalculate() {  
		amount = 0;  
	}  

	public void plus(int value) {  
		synchronized (lock) {  
			amount += value;  
		}  
	}  

	public void minus(int value) {  
		synchronized (minusLock) {  
		    amount -= value;  
		}
	}  

	public int getAmount() {  
		return amount;  
	}  
}
```


실행하면 결과는 예상처럼 아래와 같이 나옵니다.

    Final value is 2000000

