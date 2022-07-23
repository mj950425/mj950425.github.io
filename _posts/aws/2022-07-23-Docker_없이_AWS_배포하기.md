---
title: '2022-07-23-Docker 없이 AWS CICD 구성하기'
excerpt: ' '
categories:
    - java
tag:
    - java
toc: false
---


# Docker 없이 AWS CICD 구성하기

## CI/CD 란 무엇인가?
로컬에서 프로젝트를 만들고 `./gradlew build` 명령어를 입력하면 **테스트**를 진행하고 프로젝트를 **실행 파일**로 바꿔줍니다.  여기서 실행 파일은 jar 파일입니다.

즉 `./gradlew build` 는 **`테스트 + 빌드`** 를 같이 동작 시킵니다. 

엘라스틱 빈 스톡은 생성 시에 셋팅을 통해서 OS, JAVA 가 자동으로 설치되어있습니다. 

실행 파일을 옮기기만 하면 실행 또한 생략이 됩니다. 즉 해야 할 일은 **실행 파일 옮기기** 입니다. 

그런데 엘라스틱 빈 스톡(Linux)과 로컬(Window)에서의 환경이 다르므로 실행을 하면 실패할 수 도 있습니다. 

즉 **테스트와 실행**의 환경이 다른 것이 문제입니다.

그래서 로컬에서 테스트를 하지 않고 깃헙에 배포를 합니다. 

이 때  깃헙을 바라보고 있는 서버가 존재합니다. 

이 서버는 깃헙으로 소스 코드가 푸시 되는 것을 지속적으로 polling 할 수 도 있고 hook 을 통해 이벤트를 전달 받을 수 있습니다. 

Travis 는 polling 기법을 사용하고 Jenkins 는 hook 을 사용합니다. 

이번 포스트에서는 깃헙 액션을 사용했습니다.

그러면 깃헙 액션에서 CI(Continuous Integration) 서버를 만들어서 CI 서버에서 테스트를 하고 빌드를 해서 실행 파일을 생성합니다. 

당연히 테스트와 실행 환경을 같게 만들어야 하므로 AWS 의 환경과 똑같이 만들어줍니다.

그 결과로 CI 서버에서 실행에 성공했으면 AWS 에서도 실행이 성공하는 것을 보장합니다. 

그 다음 CI 서버에서 만들어진 실행 파일을 AWS에 자동 배포합니다. 

깃헙에서 **CI 서버에 소스를 제공**하고 CI 서버에서 **AWS 로 배포**하는 것을 **`CD(Continuous Deploy)`** 라고 하고 CI 서버에서 AWS 와 **동일한 환경에서 테스트** 하는 것을 **`CI(Continuous Integration)`** 라고 합니다.

이것을 묶어서 CI/CD 라고 합니다.

## IAM 이란?

> Identity and Access Management

우리가 직접 AWS 웹 콘솔 로그인하고 들어가서 배포하는 것은 큰 문제가 없습니다만 CI/CD 에서는 CI 서버에서 AWS 에 로그인하고 배포를 해야 하는데 이 때 IAM 이라는 개념을 알아야 합니다.  

IAM 을 활용하면 AWS 서비스와 리소스에 대한 엑세스를 안전하게 관리할 수 있고 그룹을 만들어서 엑세스를 관리할 수 도 있습니다.

IAM 의 구성은 아래 4가지로 이루어집니다.
- **사용자** : 실제 AWS 를 사용하는 사람 혹은 **어플리케이션**을 의미
- **그룹** : 사용자의 집합, 그룹에 속한 사용자는 그룹에 부여된 권한을 행사
- **정책** : 사용자나 그룹, 역할이 무엇을 할 수 있는지에 관한 문서
- **역할** : AWS 리소스에 부여하여 AWS 리소스가 무엇을 할 수 있는지를 정의, 혹은 다른 사용자가 역할을 부여 받아 사용

아래의 그림에서 확인할 수 있는데 사용자가 AWS 가 제공해주는 S3 스토리지 에 접근할 수 있는 지를 판단하는 플로우 차트 입니다. 먼저 나에게 정책이 부여 되었는가 를 확인하고 내 그룹을 확인한 뒤, 내 역할을 판단합니다.

![image](https://user-images.githubusercontent.com/52944973/180346889-1d260c47-814d-4473-b11d-4a13290844d1.png)


## RDS

> Amazon Relational Database Service
> 
Amazon Relational Database Service(RDS)는 클라우드에서 간편하게 데이터베이스를 설치, 운영 및 확장할 수 있는 관리형 서비스 모음입니다.

우선 RDS가 사용할 보안 그룹을 아래와 같이 만들어줍니다. 

**나중에 엘라스틱빈스톡의 그룹이 추가 될 것입니다.**

![image](https://user-images.githubusercontent.com/52944973/180348847-f7ced19e-337d-46bd-b761-7ad231004d0d.png)

이제 RDS 를 생성해줍니다. 이번에는 MariaDB 를 사용하고 템플릿은 프리티어로 정해줍니다.

![image](https://user-images.githubusercontent.com/52944973/180350371-d2d78b28-cd95-4867-ba9b-9cebe93c6db6.png)

그리고 DB 커넥션 정보들을 입력합니다.

![image](https://user-images.githubusercontent.com/52944973/180350574-0e65f71e-2134-41a1-be82-85cfd51ba94d.png)

보안그룹을 아까 설정한 것으로 등록하고 퍼블릭 엑세스에 예를 클릭해줍니다.

![image](https://user-images.githubusercontent.com/52944973/180350688-e1e89c7d-9d20-4719-91fc-43bb674d47dd.png)

그리고 데이터베이스 생성을 눌러줍니다.

그 다음 엔드포인트를 복사합니다.

![image](https://user-images.githubusercontent.com/52944973/180362001-013ce53e-8a0f-4a12-8d64-23875c8f6b9f.png)

그 다음 HeidiSQL 를 켜서 엔드포인트를 host 에 입력하고 ID/PASSWORD 를 입력해서 접속합니다.

그리고 아래의 쿼리문을 작성합니다.

```sql
CREATE DATABASE metadb;

USE metadb;
```
그 다음 UTF-8 을 설정해줘야하는데

```sql
SHOW VARIABLES LIKE 'c%';
```

![image](https://user-images.githubusercontent.com/52944973/180363188-dd605795-4116-4e7a-99fd-511b1e2a8aa5.png)

latin 을 utf8mb4 로 바꿔줘야 합니다. 

AWS 웹 콘솔에서 RDS 의 파라미터 그룹에서 파라미터 그룹을 만들어 줍니다.

그 다음 char 로 검색해서 전부 utf8mb4 로 바꿔줍시다.

![image](https://user-images.githubusercontent.com/52944973/180596655-29cd7db1-0d4f-4e3b-81fd-7b0b9daf8195.png)

그 다음으로 한국 시간을 맞춰줘야 합니다.

zone 으로 검색해서 time zone 을 Asia/Seoul 로 변경하고 저장해줍시다.

![image](https://user-images.githubusercontent.com/52944973/180364612-28576906-160a-4557-b5a7-30dd1e60093b.png)

디폴트 그룹은 수정이 안되기 때문에 새로운 파라미터 그룹을 만들어줘야 합니다.

RDS 에 접속해서 수정을 누른 뒤에 파라미터 그룹을 방금 설정한 파라미터 그룹으로 변경해줍니다.

![image](https://user-images.githubusercontent.com/52944973/180364818-806371af-9e43-49b5-9ed5-0b3db0fb91e3.png)

그 다음 RDS 를 재부팅하고 DB 세션을 종료하고 재접속 해보면 한국 시간이 잘 뜹니다.

```sql
SELECT @time_zone, NOW();
```

![image](https://user-images.githubusercontent.com/52944973/180379787-7d1c7b4b-97d8-4366-ab70-154f4b1ac285.png)

## 엘라스틱빈스톡

### 기본 설정
Application 생성을 누른 다음 아래와 같이 이름을 입력합니다.

그리고 플랫폼은 Java 를 사용하겠습니다.

![image](https://user-images.githubusercontent.com/52944973/180349499-83a1ced1-aaba-47b1-9c55-6b01a8aa53f5.png)

그 다음 추가 옵션 구성을 클릭합니다.

엘라스틱빈스톡을 통해 여러 대의 EC2 를 운영할 계획이므로 사용자 지정 구성을 클릭합니다.

NginX 가 요청하는 Java 서버의 포트는 기본 5000번으로 설정됩니다.


![image](https://user-images.githubusercontent.com/52944973/180349784-f05d3e32-908e-4d8e-82f7-88ceb22f8c9a.png)

### 환경 변수

그 다음 소프트웨어의 편집을 클릭하고 아래와 같이 환경 변수를 채워줍니다.

아래 환경 변수는 애플리케이션의 환경 변수 입니다. (OS가 아니라)

![image](https://user-images.githubusercontent.com/52944973/180380742-185f0115-da16-4f8d-b55c-cefd6aae420c.png)


### 용량

용량을 클릭하고 아래와 같이 설정합니다. 

우리는 인스턴스를 2대 사용할 것 이므로 2대로 늘려줍니다.

![image](https://user-images.githubusercontent.com/52944973/180380876-219040b9-931a-4ff3-be45-4667bf897674.png)

Application Load Balance 가 알아서 부하가 몰렸을 때 오토 스케일링을 해주고 요청을 골고루 뿌려줍니다.

최대 4개까지 늘릴 수 있고 기본 2대로 동작합니다.

즉 OSI 7 계층에서 부하 분산의 역할을 수행합니다.

### 로드 밸런서

이제 **로드 밸런서**를 알아봅니다. 
예전에는 Nginx 에서 리버스 프록시로 뿌려줬지만, 굳이 그럴 필요 없이 Application Load Balance 를 사용하면 됩니다.

![image](https://user-images.githubusercontent.com/52944973/180383057-a56847ee-2a8f-44ea-9069-c24c7ace342a.png)

로드 밸런서는 Application Load Balancer 와 Network Load Balancer 가 존재합니다.

가운데 클래식은 레거시라 신경 안 써도 됩니다.

로드 밸런서의 **리스너**는 80 포트를 바라보고 있고 클라이언트의 80 포트로의 접근 만을 바라본다는 의미입니다.

그리고 **프로세스** 탭은 ec2 에서 실행 중인 프로그램 라우팅 설정입니다.

**80 포트로 들어올 때만** 라우팅을 해준다는 의미입니다. 

그리고 상태 검사 경로의 의미는 ec2 의 `/` url 요청에서 `200 OK response` 가 잘 받아지는 지를 체크하는 것 입니다.

### 롤링 업데이트와 배포 수정

롤링 탭에 들어와서 아래와 같이 **배포 방식**을 **변경 불가능**으로 설정해줍니다.


![image](https://user-images.githubusercontent.com/52944973/180384216-64f19765-76f0-44cd-9309-3440ba9b5d82.png)


> 롤링이란 배포 전략입니다

배포를 할 때 서버를 내리고 업데이트하고 다시 가동하는 과정을 거치면 서버가 내려가 있는 동안 클라이언트의 요청이 동작하지 않습니다.

따라서 무중단 배포가 필요합니다.

배포에는 크게 보통 3가지 방법이 존재합니다. 

- 한번에 모두 배포
운영 중인 서버를 전부 내리고 한번에 업데이트 된 서버를 다시 배포합니다.

- 추가 배치
업데이트한 서버를 하나 새롭게 배포하고 잘 동작하는 것을 확인한 다음 로드 밸런서에 이어주고 예전 버전의 서버를 내립니다. 
이 방식을 반복해서 모든 서버들을 업데이트 합니다.
이렇게 할 경우 무중단 배포는 가능하지만, 추가 배치를 위해 새로운 서버를 배포했는데 갑자기 에러가 터지면 롤백을 해야 합니다. 그런데 이러한 과정들이 엄청 오래 걸립니다. 그래도 장점은 자원 소모가 적다는 점 입니다. 

- 블루 그린 (AWS 에서는 변경 불가능)
실행 중인 기존의 서버를 블루라고 합니다.
그리고 새로운 버전의 서버를 그린이라고 하는데 새로운 서버를 한번에 다 띄웁니다.

장점으로는  롤백을 할 때 그냥 그린들을 전부 제거하면 됩니다.
단점으로는 한번에 EC2 를 가용 서버 개수의 2배를 띄워야 하므로 자원의 소모가 크다는 점 입니다.

### RDS 보안 그룹 수정

엘라스틱 빈 스톡으로 ec2 를 생성하면 ec2 들이 같은 보안 그룹에 속하게 됩니다. 

RDS 보안그룹에서 ec2의  보안그룹에서 접근할 때 엑세스를 허용해주도록 인바운드 규칙을 수정합니다.
 ![image](https://user-images.githubusercontent.com/52944973/180399183-689081a8-f5db-43f9-b485-f2a9d7a6f784.png)
 ![image](https://user-images.githubusercontent.com/52944973/180399482-1793b13e-5f78-436f-bc77-314a9f5284a6.png)


## Network Load Balance

현재 구성도 아래 그림과 같습니다.

![image](https://user-images.githubusercontent.com/52944973/180399688-d2252d7e-82b1-4be8-99ca-4c58242a4e38.png)

그리고 현재 ALB 의 엔드 포인트로 접속하면 아래와 같은 웹 페이지가 뜨게 됩니다.

![image](https://user-images.githubusercontent.com/52944973/180400469-ccb33d19-e7ba-47c4-b1c4-e6a26889909d.png)

그런데 엔드포인트의 도메인 주소는 AWS 웹 콘솔에서 제공해주는데 IP 주소는 제공해주지 않습니다. (물론 개발자 도구에서 확인할 수 는 있습니다.)

그 이유는 IP 주소가 **계속해서 바뀌기 때문**입니다.

심지어 엔드포인트로 제공해주는 도메인도 무척 복잡합니다. 

그래서 **변경되지 않는 IP**가 필요합니다.

그래서 ALB 앞에 **`NetWork Load Balance`** 가 필요합니다.

AWS 에서 제공해주는 아래의 표를 살펴봅니다.

![image](https://user-images.githubusercontent.com/52944973/180403107-ec65b022-ea49-446f-8b48-084480c244ae.png)

ALB 는 HTTP, HTTPS 를 지원하지만 고정 IP 를 지원하지 않습니다.

따라서 Network Load Balancer 를 통해서 앞에서 고정 IP 를 설정하고 ALB 로 요청을 넘겨줍니다.

그림으로 보면 아래와 같습니다.

![image](https://user-images.githubusercontent.com/52944973/180404862-2f69548f-8d65-4fdf-b14f-bc8576bbae8d.png)

## 탄력적 IP

ec2 탭에서 탄력적 IP에 들어가서 하나 만들어줍니다.

그 다음 로드밸런서에 들어가서 Network Load Balancer 를 만듭니다.

그리고 아래와 같이 zone 하나를 체크해주고 셋팅에서  **`Use an Eleastic IP address`** 로 바꿔줍니다.

그리고 **탄력적 IP** 를 선택해줍니다.

![image](https://user-images.githubusercontent.com/52944973/180407321-d56dac2e-a045-45e0-a1ba-3a7cd42311b2.png)


그 다음 아래의 create target group 을 클릭합니다.

![image](https://user-images.githubusercontent.com/52944973/180406384-26a91f27-535b-4640-835c-b2f591740a52.png)

해당 설정은 NLB 에서 어디로 라우팅 할 지 에 대한 설정인데 들어가서 Application Load Balancer 를 클릭하고 Target group name 을 설정해줍니다. 


![image](https://user-images.githubusercontent.com/52944973/180406771-b67061af-6dc4-423e-bb5d-51dc9061fa10.png)

Next 를 누르고 ALB 를 골라주고 생성합니다.

![image](https://user-images.githubusercontent.com/52944973/180406803-d65f5181-4eac-4eb0-90a4-c7ae8c4fda5d.png)

그 다음 다시 돌아와서 새로 고침을 누르면 아래와 같이 설정할 수 있습니다.

![image](https://user-images.githubusercontent.com/52944973/180407019-0828da45-fcfe-4277-9240-4f8b8d108356.png)

설정하고 NLB 를 생성합니다.

잠시 기다렸다가 탄력적 IP로 접속해보면 ALB 까지 잘 넘어가는 것을 볼 수 있습니다.

![image](https://user-images.githubusercontent.com/52944973/180408868-9b31af1d-6537-4777-b516-16ead23f9ee3.png)

## Github Action

> https://github.com/mj950425/aws-v5

위의 소스에 Github Action 이 설정되어 있습니다.

해당 소스를 기준으로 작성했습니다.

처음 서두에서 말했던 CI 플로우를 아래 그림으로 한번 다시 알아봤습니다.

로컬에서 깃으로 코드를 푸시하면 깃헙 액션이 이를 낚아 챕니다.

그 다음 CI 서버에서
1. OS 설치
2. JDK 설치
3. 소스 다운로드
4. 테스트 코드 실행
5. 실행 파일 생성 (빌드)

의 과정을 거칩니다.

![image](https://user-images.githubusercontent.com/52944973/180584906-a575457a-bd67-4247-854e-2c1d797a382b.png)

CI 서버에 요청하는 내용은 **`.github/workflows/*.yml`** 파일에서 설정이 되어있어야 합니다.

![image](https://user-images.githubusercontent.com/52944973/180585022-a46b8156-a946-4c79-b907-c20173096b17.png)

그러면 deploy.yml 을 살펴봅니다.

### CI

```yml
name: aws-v5  
on:  
  push:  
    branches:  
      - main    
jobs:  
  build:
  runs-on: ubuntu-18.04  
    steps:  
      - name: Checkout  
        uses: actions/checkout@v2  
      - name: Set up JDK 11  
        uses: actions/setup-java@v1  
        with:  
          java-version: 11  
      - name: Grant execute permission for gradlew  
        run: chmod +x ./gradlew  
        shell: bash  
      - name: Build with Gradle  
        run: ./gradlew clean build  
        shell: bash
```

가장 상단의 on push branches main 은 **main** 브랜치에 코드가 push 되었을 때 아래 jobs 를 실행한다는 의미 입니다.

**`build`** 는 제가 임의로 job 의 이름을 정한 것 입니다.

**`runs-on`** 은 도커를 통해서 OS 를 설치합니다.

**`steps`** 는 일련의 과정을 나타냅니다. 현재는 총 **4가지** 과정을 거칩니다.

> **action** 은 라이브러리 입니다. **action** 은 script 의 모임입니다. 
1. **`actions/checkout@v2`**  는 코드를 다운로드 하는 것 입니다. https://github.com/actions/checkout 에서 확인할 수 있습니다.
2. **`actions/setup-java@v1`** 는 JDK 를 셋팅합니다. https://github.com/actions/setup-java 에서 확인할 수 있습니다.
3. **`chmod +x ./gradlew`** gradlew 에게 실행권한을 주는 것입니다.
4. **`./gradlew clean build`** 실행 파일을 만들기 전에 깔끔하게 관련 파일들을 지우고 새롭게 만드는 것 입니다.

**build 할 때 실행 파일 생성과  테스트를 같이 확인합니다.**

이제 깃헙에 푸시를 해봅니다.

![image](https://user-images.githubusercontent.com/52944973/180585841-bfae23c6-40be-4c72-b2c4-e271f65147e3.png)

그러고 깃헙 액션에서 확인해보면 CI 가 잘 된 것을 확인할 수 있습니다.

![image](https://user-images.githubusercontent.com/52944973/180585859-9bdac3da-19e3-4377-9029-f5dbe1e3fb77.png)

여기까지 진행하면 CI 가 완성되었습니다.



### CD

yaml 파일을 아래와 같이 수정해봅니다.

이제 CD 를 진행합니다.

```yaml
name: aws-v5  
on:  
  push:  
    branches:  
      - main  
  
# actions/setup-java@v2는 사용자 정의 배포를 지원하고 Zulu OpenJDK, Eclipse Temurin 및 Adopt OpenJDK를 기본적으로 지원합니다. v1은 Zulu OpenJDK만 지원합니다.  
jobs:  
  build: # 마음대로 적어도됨.  
  runs-on: ubuntu-18.04  
    steps:  
      - name: Checkout  
        uses: actions/checkout@v2  
      - name: Set up JDK 11  
        uses: actions/setup-java@v1  
        with:  
          java-version: 11  
      - name: Grant execute permission for gradlew  
        run: chmod +x ./gradlew  
        shell: bash  
      - name: Build with Gradle  
        run: ./gradlew clean build  
        shell: bash  
    # UTC가 기준이기 때문에 한국시간으로 맞추려면 +9시간 해야 한다.  
  - name: Get current time  
        uses: 1466587594/get-current-time@v2  
        id: current-time  
        with:  
          format: YYYY-MM-DDTHH-mm-ss  
          utcOffset: "+09:00"  
  - name: Show Current Time  
        run: echo "CurrentTime=${{steps.current-time.outputs.formattedTime}}"  
        shell: bash  
  
      # EB에 CD 하기 위해 추가 작성  
  - name: Generate deployment package  
        run: |  
          mkdir -p deploy  
          cp build/libs/*.jar deploy/application.jar  
          cp Procfile deploy/Procfile  
          cp -r .ebextensions deploy/.ebextensions  
          cd deploy && zip -r deploy.zip .  
      - name: Deploy to EB  
        uses: einaregilsson/beanstalk-deploy@v20  
        with:  
          aws_access_key: ${{ secrets.AWS_ACCESS_KEY }}  
          aws_secret_key: ${{ secrets.AWS_SECRET_KEY }}  
          application_name: aws-v5-beanstalk # 엘리스틱 빈스톡 애플리케이션 이름  
  environment_name: Awsv5beanstalk-env # 엘리스틱 빈스톡 환경 이름  
  version_label: aws-v5-${{steps.current-time.outputs.formattedTime}}  // 현재 시간으로 라벨링
          region: ap-northeast-2
          deployment_package: deploy/deploy.zip
```

**`get-current-time@v2`** action 라이브러리를 통해서 시간을 한국 시간으로 맞춰줍니다. 그 다음 echo 를 통해서 현재 시간을 출력합니다.

**`run:  |`** 와 같이 작성하면 명령어를 여러 줄 작성할 수 있습니다. 

```yml
run:  |
	mkdir -p deploy # deploy 디렉토리 생성
	cp build/libs/*.jar deploy/application.jar  # 실행 파일을 deploy로 옮기고 이름을 application.jar 로 변경 이 때 plain.jar 를 안만들도록 application.yaml 에 설정해줘야함
	cp Procfile deploy/Procfile # Procfile 을 deploy 로 옮김
	cp -r .ebextensions deploy/.ebextensions # ebextensions 의 모든 파일을 deploy 로 옮김
	cd deploy && zip -r deploy.zip . # deploy 로 이동 및 deploy.zip 으로 application.jar, ebextensions, Procfile 파일을 압축
```

**`einaregilsson/beanstalk-deploy@v20`** 
엘라스틱빈스톡으로 배포하는 라이브러리 입니다.
>https://github.com/einaregilsson/beanstalk-deploy
>
 AWS 의 S3 에 deploy.zip 을 보내줘야 합니다. 그런데 Github Action 은 S3 에 접근할 권한이 없습니다. 

그래서 IAM 사용자를 하나 생성해서 여기에 접근할 권한을 줘야 합니다. 

그리고 나서 access key 와 secret key 를 줘야 합니다. 

그런데 직접 적기에는 보안 상 위험하므로 환경 변수로 설정해줍니다. 

마지막으로 지역 설정, 엘라스틱빈스톡 이름과 환경 변수 이름을 입력해주고 deploy.zip 파일만 aws s3로 보내줍니다.

그렇다면 .jar 가 아니라 .zip 을 배포하는 이유는 무엇일까요?

jar 파일만 엘라스틱빈스톡으로 보내면 **/var/app/current/** 디렉토리에 **application.jar** 와 **Procfile** 를 생성합니다. 

그리고 Procfile 에서는 단순하게 jar 파일을 실행시키는 스크립트가 들어 있습니다.

그런데 deploy.zip 안에는 **application.jar**, **Procfile**, **ebextensions/00-makeFiles.config** 가 들어있는데

**`00-makeFiles.config`** 를 살펴보면 아래와 같습니다.

```
files:  
    "/sbin/appstart":  
        mode: "000755"  
        owner: webapp  
        group: webapp  
        content: |  
            #!/usr/bin/env bash  
  JAR_PATH=/var/app/current/application.jar  
  
  # run app  
  java -Dspring.profiles.active=prod -Dfile.encoding=UTF-8 -jar $JAR_PATH
```


mode: "000755" 는 755 권한을 준 다는 의미입니다. 
**read 가 4 write 가 2 execute 가 1** 이므로 유저는 모든 기능, 그룹은 읽기와 실행, 외부는 실행만 권한을 준다는 의미입니다.
그룹과 주인을 webapp 으로 줍니다.
그리고 자바를 실행시키는 스크립트가 적혀있습니다.

이런 스크립트 파일을 만들어냅니다.

그리고 Procfile 에서 이를 기반으로 앱을 띄우는 역할을 합니다.

### IAM

AWS 웹 콘솔에서 IAM 에 들어가서 사용자를 클릭합니다.

그 다음 **`사용자 추가`** 를 누릅니다.

아래와 같이 만들어줍니다.

![image](https://user-images.githubusercontent.com/52944973/180595825-9ae93f3b-1ec9-4256-8a38-5b1eb9ba5c29.png)

그리고 권한 설정을 기존 정책 직접 연결에 **`AdministartorAccess-AWSElasticBeanstalk`** 을 클릭합니다.

![image](https://user-images.githubusercontent.com/52944973/180595856-ce281aec-bed6-474f-a23d-f678f9bddb8f.png)

그 다음 5단계 까지 쭉 다음을 누르고 마지막에 access key 와 scret key 에 대한 csv 파일을 저장합니다.

![image](https://user-images.githubusercontent.com/52944973/180595913-3d8b7a73-0d97-4332-bd63-645286273cec.png)

그 다음 이제 CI 서버에서 해당 access key 와 secret key 를 환경 변수로 등록해야 합니다.

![image](https://user-images.githubusercontent.com/52944973/180595981-43ad27b0-8c5a-496f-aac7-8ed8051ad470.png)

그 다음 소스파일에 입력했던 환경변수 이름과 맞춰서 access key 와 secret key 를 입력해줍니다.

![image](https://user-images.githubusercontent.com/52944973/180596031-4729055d-b705-4fe1-9d57-ab5125048329.png)

 
그리고 다시 코드를 push 해봅니다.

AWS 웹 콘솔에서 확인해보면 **`블루 그린 배포 전략`** 이기 때문에 인스턴스가 4대가 뜨는 것을 확인할 수 있습니다. 

4대가 정상 동작하면 기존의 인스턴스 2대가 사라집니다.

![image](https://user-images.githubusercontent.com/52944973/180596332-9d2098bb-ec9a-4f1b-8d30-0ef2820705ba.png)

