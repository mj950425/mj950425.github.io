# IAM

# 정책

* AWS Managed
* Customer Managed
* Inline Policies

AWS 관리형 정책: 보편적으로 사용되는것들을 모아서, AWS가 관리하는 정책입니다.
고객 관리형 정책: 사용자가 직접 생성하고 관리하는 정책입니다. 특정 조직의 필요에 맞춘 맞춤형 권한을 설정하고자 할 때 사용됩니다.
인라인 정책은 정책: 이 정책들은 특정 IAM 엔터티(사용자, 그룹, 역할)에 직접 포함되어 있습니다. 인라인 정책은 해당 IAM 엔터티에만 적용되며, 그 엔터티가 삭제될 때 함께 제거됩니다. 재사용이 불가능하고,
한 엔터티에만 연결됩니다. 엔터티에 고유한 권한을 부여하고자 할 때 유용합니다.

정책은 JSON으로 이뤄져 있으며 크게 effect, action, resource, conditions, policy variables로 구성됩니다.

명시적으로 Deny라고 적혀있다면 항상 Allow보다 우선적으로 동작합니다.

정책에는 보안을 위해서 딱 필요한 정도의 권한만 부여하는게 좋습니다.

명시적으로 Deny를 선언하면 모든 기능을 이용할 수 없으므로, 아래와 같이 Allow와 NotAction을 조합한 뒤에 허용해주고 싶은 일부 기능들을 Allow해주는 방법도 있습니다.

```
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "NotAction": [
        "iam:*",
        "organizations:*",
        "account:*"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:CreateServiceLinkedRole",
        "iam:DeleteServiceLinkedRole",
        "iam:ListRoles",
        "organizations:DescribeOrganization",
        "account:ListRegions"
      ],
      "Resource": "*"
    }
  ]
}
```

Condition은 아래처럼 구성되는데요.

```
"Condition": { "{condition-operator}" : { "{condition-key}" : "{condition-value}" } }
```

예를 들어서 MFA를 인증한 유저에게만 접근을 허용할 수 있고, IP주소 기반으로 허용할 수도 있습니다. 이외에도 다양한 기능들이 존재합니다.

```
"Condition": { "Bool": { "aws:MultiFactorAuthPresent": "true" } }
"Condition": { "IpAddress": { "aws:SourceIp": "203.0.113.0/24" } }
```

Policies Variables와 Tags를 활용해서 동적으로 권한을 허용해줄수도 있습니다.

예를 들어서 아래처럼 사용하면 접근자의 username에 따른 버킷 경로에만 접근이 가능합니다.

```
"Resource": ["arn:aws:s3:::mybucket/${aws:username}/*"]
```

Access Advisior를 통해서 가장 최근에 권한을 부여받은게 언제인지 확인할 수 있습니다.

Access Analyzer를 통해서 외부에서 접근한적 있는 리소스를 분석할 수 있습니다.

## 리소스 기반 정책

## USER, GROUP

IAM USER, GROUP은 장기 자격증명입니다.

## IAM ROLE

반면에 IAM ROLE은 단기자격증명이며 STS를 통해서 제공받을 수 있습니다. 한번에 하나의 역할만 가질 수 있습니다.

IAM ROLE에 대한 종류를 나눠보면 아래와 같습니다.

* EC2 인스턴스 역할
* AWS 서비스 역할
* 교차 계정 역할

**EC2 인스턴스 역할**은 EC2 인스턴스에서 실행되는 애플리케이션, 소프트웨어 또는 서비스에 권한을 부여하는 IAM 역할의 한 유형입니다.

1. 애플리케이션에 부여할 권한을 가지는 IAM 역할을 생성합니다.
2. EC2 인스턴스에 IAM 역할을 연결합니다.
3. EC2는 STS를 통해서 역할을 assume합니다. 역할을 assume한다는것은 임시자격증명을 받아온다는 의미입니다.
3. 애플리케이션의 SDK가 자동으로 ec2 metadata service를 활용해서 EC2 임시자격증명을 사용합니다.

**서비스 역할**은 다른 AWS 리소스와 상호 작용할 수 있도록 AWS 서비스에 권한을 부여하는 IAM 역할입니다.

역할을 부여하면 AWS 서비스가 알아서 단기자격증명을 받아오고 이를 통해서 다른 서비스와 상호작용하게 됩니다.

**교차계정 역할**은 다른 계정의 리소스에 접근해야할 때 사용됩니다.

# IAM Role vs Resource Based Policies

만약에 A계정이 B계정의 자원에 접근해야할 때, 아래 그림과 같이 2가지 방법이 있습니다.

![그림1](/assets/img/network/aws/iam/img.png)

한가지는 assume role을 통해서 A가 B의 역할을 사용하는 방법이고, 나머지는 resource based policy를 통해서 B에서 A의 접근을 허용해주는 것 입니다.

A계정이 B계정의 역할을 가정하면, A에게 주어진 기존의 권한을 포기해야합니다.

반면에 리소스기반정책을 통해서 접근하면 A에게 주어진 기존 권한을 포기하지않아도 됩니다.

예를 들어서 계정A의 user가 다이나모디비를 스캔한 뒤에 계정B의 S3에 덤프를 떠야한다면, 두가지 계정에 대한 권한이 필요합니다.

이런 경우에는 리소스기반정책을 통해서 B계정의 S3에 접근해야합니다.

# IAM Access Ananlyzer

Zone of Trust는 AWS의 계정 또는 조직 내부를 의미합니다.

IAM Access Ananlyzer 서비스는 trust zone에서 벗어난 자원들에 대해서 검사할 수 있다.

아래 그림과 같이 S3 버킷에 대한 Zone of trust를 정의하고 다른 계정과 외부 클라이언트로부터 접근을 모니터링할 수 있습니다.

![그림1](/assets/img/network/aws/iam/img_1.png)

아래 그림과 같이 lambda function이 사용하는 API에 대한 로그를 CloudTrail 서비스에 남기고, 이를 IAM Acess Analzyer가 분석해서 적절한 IAM role을 생성하는 IAM
Acess Analzyer Policy Generation이라는 기능도 존재합니다.

![그림1](/assets/img/network/aws/iam/img_2.png)

# STS

STS의 AssumeRole API를 사용하면 부여된 역할에 해당하는 임시자격증명을 받아올 수 있습니다.

아래 그림을 통해서 전체적인 구성이 어떻게 이뤄지는지 알아보겠습니다.

관리 계정 생성 및 구성:
AWS에 가입하여 AWS 조직을 설정할 때 관리 계정이 될 계정을 생성합니다. 이는 자동적으로 루트 유저가 됩니다.
관리 계정에서 AWS 조직을 설정하여 여러 계정을 관리합니다.

관리 계정에서 관리자 IAM 사용자를 생성합니다:
관리 계정에서 관리 권한이 있는 IAM 사용자를 생성합니다.
루트 사용자 자격 증명을 사용하는 대신, 일상적인 관리 작업에 이 관리자 IAM 사용자를 사용합니다.

개발 및 프로덕션 계정을 생성합니다:
AWS 조직 내에서 개발 및 프로덕션 환경을 위한 새 AWS 계정을 만듭니다.
이러한 계정은 자동으로 조직의 일부가 되며, 관리 계정에서 관리할 수 있습니다.

개발 및 프로덕션 계정에서 관리자 액세스 권한을 부여합니다:
각 계정(개발 및 프로덕션)에 로그인하여 관리 권한이 있는 IAM 사용자 또는 관리 목적의 IAM 역할을 만듭니다.
이 관리자 IAM 사용자 또는 역할은 관리 계정의 관리자 사용자와는 별개입니다.

프로덕션 계정에서 교차 계정 역할 만들기:
관리자는 프로덕션 계정 내에서 개발 계정에 특정 권한을 부여하는 IAM 역할을 만듭니다.
이 역할에는 개발 계정의 엔터티가 해당 역할을 맡을 수 있도록 허용하는 신뢰 관계가 있습니다.

역할을 맡도록 개발 계정을 구성합니다:
개발 계정에서 프로덕션 계정에서 만든 교차 계정 역할을 맡도록 IAM 사용자 또는 서비스를 구성합니다.
여기에는 일반적으로 역할의 ARN에 대해 sts:AssumeRole을 호출할 수 있는 권한을 부여하는 것이 포함됩니다.

![그림1](/assets/img/network/aws/iam/img_3.png)

아래는 혼동된 대리인 현상을 막는 방법에 대한 이미지입니다.

혼동된 대리인 현상은 아래와 같습니다.

외부 업체(서비스 제공자)에게 서비스를 받기 위해 특정 IAM 역할을 제공합니다. 이 역할은 외부 업체가 나의 AWS 리소스에 접근할 수 있도록 설정되어 있습니다.

동일한 외부 업체를 사용하는 다른 고객이 외부 업체에 내가 제공한 역할과 같은 ARN을 제공합니다.

외부 업체는 다른 고객의 요청을 처리하는 과정에서, 다른 고객이 제공한 역할이 사실 내가 만든 역할이기 때문에 나의 리소스에 접근합니다.

이렇게 되면, 외부 업체는 다른 고객의 요청을 처리하면서 실제로는 나의 리소스를 사용하게 됩니다. 이로 인해 나의 데이터 또는 리소스가 무단으로 사용되거나 변경될 수 있습니다.

이를 해결하기 위해서 external id라는 추가 키를 통해서 추가 검증하는 작업을 거칩니다.

![그림1](/assets/img/network/aws/iam/img_4.png)

# Session Tags in STS

아래 이미지의 json과 같이 HR테그를 같이 보내줬을 때만 Assume Role을 할 수 있도록 설정이 가능합니다.

![그림1](/assets/img/network/aws/iam/img_5.png)

이외에도 AssumeRole을 하는 다양한 방법이 있습니다.

AssumeRole, AssumeRoleWithSAML, AssumeRoleWithWebIdentity...

# Identity Federation

Identity Federation 과정을 살펴보면 아래와 같습니다.

먼저 유저는 Idp에 로그인합니다.

사전에 Idp는 AWS의 신뢰정책에 연결되어있으므로 AWS의 자원에 접근할 수 있는데, 유저의 정보를 바탕으로 credentials를 제공 받습니다.

그리고 이것을 유저에게 전달하면, 유저는 해당 credentials를 가지고 aws 자원에 접근합니다.

![그림1](/assets/img/network/aws/iam/img_6.png)

identity federation에는 SAML2.0, Custom Identity Broker, Web Identity Federation, SSO ..등등 다양한 방법이 존재합니다.

## SAML2.0
먼저 SAML2.0은 Security Assertion Markup Language 2.0의 약자입니다.

다양한 Idp에서 사용하는 표준 규격입니다. 

SAML 2.0 Federation은 옛날 방식이고 Amazon SSO가 훨씬 간단하고 최신 방법입니다.

![그림1](/assets/img/network/aws/iam/img_7.png)







-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= 2024-01-06 -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

하나의 iam role은 여러개의 정책을 가질 수 있다.

예를 들어서 MyEC2Role 이라는 IAM역할에는 S3AccessPolicy, DynamoDBAccessPolicy 아래 2개의 정책이 붙을 수 있다.

이 경우 or 조건으로 allow를 판단한다. 즉 여러 정책중에 하나라도 특정 액션을 허용하는경우 그 액션은 허용한다

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject"
            ],
            "Resource": "arn:aws:s3:::mybucket/*"
        }
    ]
}
```

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem"
            ],
            "Resource": "arn:aws:dynamodb:us-west-2:123456789012:table/MyTable"
        }
    ]
}
```

iam policy boundaries 권한 경계는 주니어 개발자에게 개발자 역할을 부여한뒤에 특정 버킷에 접근 가능한 권한 경계를 아래처럼 부여할수 있다.

그러면 주니어는 개발자 역할이 있어도 특정 버킷에만 접근이 가능하다.

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "s3:*",
            "Resource": "arn:aws:s3:::my-company-bucket/*"
        },
        {
            "Effect": "Allow",
            "Action": "s3:ListBucket",
            "Resource": "arn:aws:s3:::my-company-bucket"
        }
    ]
}

```

----
The confused deputy
물론이죠, "혼동된 대리인" 문제에 대한 예시를 들어 설명드리겠습니다.

예를 들어, 당신의 AWS 계정에는 MySensitiveData라는 중요한 S3 버킷이 있습니다. 이 데이터에 접근하기 위해 당신은 DataAccessRole이라는 IAM 역할을 만들었습니다. 이 역할은
Example Corp의 AWS 계정(ExampleCorpAccount)에 대한 신뢰 관계를 설정하여, Example Corp의 직원이 역할을 가정할 수 있도록 허용합니다.

일반적인 상황:

ExampleCorpAccount의 IAM 사용자는 DataAccessRole 역할을 가정하여 MySensitiveData S3 버킷에 접근할 수 있습니다.
이 때, DataAccessRole의 정책은 외부 ID를 요구하지 않기 때문에, IAM 사용자는 역할을 가정할 때 이 외부 ID를 제공할 필요가 없습니다.
문제 상황:

MaliciousAccount라고 하는 다른 AWS 계정이 있습니다. 이 계정의 사용자가 어떤 방식으로든 ExampleCorpAccount의 IAM 사용자의 자격 증명을 얻게 되었다고 가정해봅시다.
MaliciousAccount의 사용자는 이제 ExampleCorpAccount를 통해 DataAccessRole 역할을 가정할 수 있게 됩니다.
외부 ID가 없기 때문에, AWS는 ExampleCorpAccount의 요청이 신뢰할 수 있는지 여부를 확인할 수 없습니다.
결과적으로 MaliciousAccount는 DataAccessRole을 통해 MySensitiveData S3 버킷에 접근할 수 있게 됩니다.
보안 해결책:

역할 가정 시 외부 ID를 요구하도록 DataAccessRole의 신뢰 정책을 수정합니다.
이제 ExampleCorpAccount의 IAM 사용자는 역할을 가정할 때 반드시 외부 ID를 제공해야 합니다.
MaliciousAccount는 이 외부 ID를 모르기 때문에, 심지어 ExampleCorpAccount의 자격 증명을 얻었다 하더라도 DataAccessRole을 가정할 수 없습니다.
따라서 외부 ID를 사용함으로써, 당신의 MySensitiveData S3 버킷에 대한 무단 접근을 효과적으로 방지할 수 있습니다.
이 예시에서 외부 ID는 추가적인 보안 수준을 제공하여, 신뢰할 수 있는 엔티티만이 역할을 가정할 수 있도록 합니다. 이는 특히 여러 조직 간의 협업이나 서드파티 서비스와의 통합에서 중요한 보안 메커니즘입니다.

User
아 신뢰관계가없으므로 MaliciousAccount 가 직접적으로 DataAccessRole를 가정할수는 없지만, ExampleCorpAccount 사용자 장기자격증명을 얻어서는 DataAccessRole를 가정할
수 있다는거네?
ChatGPT
맞습니다. 만약 MaliciousAccount가 ExampleCorpAccount의 사용자 자격 증명을 어떤 방법으로든 획득했다면, ExampleCorpAccount가 가지고 있는 권한을 이용해
DataAccessRole을 가정할 수 있게 됩니다. 이 경우, DataAccessRole이 ExampleCorpAccount와 신뢰 관계를 가지고 있고, 외부 ID를 요구하지 않기 때문에,
MaliciousAccount는 DataAccessRole을 통해 당신의 AWS 리소스에 접근할 수 있습니다.

서드파티는 externalid를 아래처럼 같이 보내야한다.

aws sts assume-role --role-arn "arn:aws:iam::123456789012:role/ExampleRole" --role-session-name "ExampleSession"
--external-id "YourExternalId"
