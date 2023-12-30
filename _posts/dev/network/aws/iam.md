하나의 aws 서비스에 하나의 iam role만 붙일 수 있다.

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

--------------
IAM Access Analzyer 
trust zone 을 정하고 trust zone 에서 벗어난 자원들에 대해서 검사할 수 있다.
----
The confused deputy
물론이죠, "혼동된 대리인" 문제에 대한 예시를 들어 설명드리겠습니다.

예를 들어, 당신의 AWS 계정에는 MySensitiveData라는 중요한 S3 버킷이 있습니다. 이 데이터에 접근하기 위해 당신은 DataAccessRole이라는 IAM 역할을 만들었습니다. 이 역할은 Example Corp의 AWS 계정(ExampleCorpAccount)에 대한 신뢰 관계를 설정하여, Example Corp의 직원이 역할을 가정할 수 있도록 허용합니다.

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
아 신뢰관계가없으므로 MaliciousAccount 가 직접적으로 DataAccessRole를 가정할수는 없지만, ExampleCorpAccount 사용자 장기자격증명을 얻어서는 DataAccessRole를 가정할 수 있다는거네?
ChatGPT
맞습니다. 만약 MaliciousAccount가 ExampleCorpAccount의 사용자 자격 증명을 어떤 방법으로든 획득했다면, ExampleCorpAccount가 가지고 있는 권한을 이용해 DataAccessRole을 가정할 수 있게 됩니다. 이 경우, DataAccessRole이 ExampleCorpAccount와 신뢰 관계를 가지고 있고, 외부 ID를 요구하지 않기 때문에, MaliciousAccount는 DataAccessRole을 통해 당신의 AWS 리소스에 접근할 수 있습니다.

서드파티는 externalid를 아래처럼 같이 보내야한다.

aws sts assume-role --role-arn "arn:aws:iam::123456789012:role/ExampleRole" --role-session-name "ExampleSession" --external-id "YourExternalId"
