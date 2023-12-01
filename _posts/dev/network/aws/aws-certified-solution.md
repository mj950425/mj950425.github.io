Q1
Your company policies require encryption of sensitive data at rest. You are considering the possible options for
protecting data while storing it at rest on an EBS data volume, attached to an EC2 instance.
Which of these options would allow you to encrypt your data at rest? (Choose three.)

A. Implement third party volume encryption tools<br>
B. Implement SSL/TLS for all services running on the server<br>
C. Encrypt data inside your applications before storing it on EBS<br>
D. Encrypt data using native data encryption drivers at the file system level<br>
E. Do nothing as EBS volumes are encrypted by default<br>

정답 : A, C, D

---
Q2
A customer is deploying an SSL enabled web application to AWS and would like to implement a separation of roles between
the EC2 service administrators that are entitled to login to instances as well as making API calls and the security
officers who will maintain and have exclusive access to the application's X.509 certificate that contains the private
key.

A. Upload the certificate on an S3 bucket owned by the security officers and accessible only by EC2 Role of the web
servers.<br>
B. Configure the web servers to retrieve the certificate upon boot from an CloudHSM is managed by the security
officers.<br>
C. Configure system permissions on the web servers to restrict access to the certificate only to the authority security
officers<br>
D. Configure IAM policies authorizing access to the certificate store only to the security officers and terminate SSL on
an ELB.<br>

정답 : D
Client -> ELB 까지만 SSL을 유지하고 ELB -> EC2로는 SSL을 적용하지않는다. 그리고 certificate store에 접근할 수 있는 권한을 IAM으로 컨트롤한다.
이렇게함으로써 EC2관리자는 SSL에 대해서 몰라도 앞단에서 보안을 유지해준다.

---
Q3
You have recently joined a startup company building sensors to measure street noise and air quality in urban areas. The
company has been running a pilot deployment of around 100 sensors for 3 months each sensor uploads 1KB of sensor data
every minute to a backend hosted on AWS.
During the pilot, you measured a peak or 10 IOPS on the database, and you stored an average of 3GB of sensor data per
month in the database.
The current deployment consists of a load-balanced auto scaled Ingestion layer using EC2 instances and a PostgreSQL RDS
database with 500GB standard storage.
The pilot is considered a success and your CEO has managed to get the attention or some potential investors. The
business plan requires a deployment of at least 100K sensors which needs to be supported by the backend. You also need
to store sensor data for at least two years to be able to compare year over year
Improvements.
To secure funding, you have to make sure that the platform meets these requirements and leaves room for further scaling.
Which setup win meet the requirements?

A. Add an SQS queue to the ingestion layer to buffer writes to the RDS instance<br>
B. Ingest data into a DynamoDB table and move old data to a Redshift cluster<br>
C. Replace the RDS instance with a 6 node Redshift cluster with 96TB of storage<br>
D. Keep the current architecture but upgrade RDS storage to 3TB and 10K provisioned IOPS<br>

대부분 C가 96TB가 넘어간다는데 3GB * 1000 * 12 * 2 = 72TB로 계산되는데 왜 넘어간다는지 모르겠다..
B, C로 답변이 갈리는 상황이고 GPT는 B를 선택

```
B. DynamoDB로 데이터를 수집하고 오래된 데이터를 Redshift로 이동: DynamoDB는 높은 처리량과 확장성을 제공하는 NoSQL 데이터베이스 서비스이며, Redshift는 대량의 데이터 웨어하우징을 위한 서비스입니다. 이 방법은 데이터 수집 및 장기적인 저장에 적합할 수 있으며, 데이터 분석과 보고에도 유용합니다.

C. RDS 인스턴스를 6노드 96TB 저장 용량의 Redshift 클러스터로 교체: 이 옵션은 현재 RDS 기반의 아키텍처를 대규모 데이터 웨어하우징 솔루션인 Redshift로 전환하는 것을 제안합니다. 이는 대규모 센서 데이터를 효율적으로 처리하고 저장할 수 있는 강력한 해결책이 될 수 있습니다.
```

---
Q4
A web company is looking to implement an intrusion detection and prevention system into their deployed VPC. This
platform should have the ability to scale to thousands of instances running inside of the VPC.
How should they architect their solution to achieve these goals?

A. Configure an instance with monitoring software and the elastic network interface (ENI) set to promiscuous mode packet
sniffing to see an traffic across the VPC.<br>
B. Create a second VPC and route all traffic from the primary application VPC through the second VPC where the scalable
virtualized IDS/IPS platform resides.<br>
C. Configure servers running in the VPC using the host-based 'route' commands to send all traffic through the platform
to a scalable virtualized IDS/IPS.<br>
D. Configure each host with an agent that collects all network traffic and sends that traffic to the IDS/IPS platform
for inspection.<br>

정답 : B
트래픽 흐름 : 기존 브라우저 -> VPC -> 기존의 앱 -> 두 번째 VPC -> IDS/IPS 플랫폼 -> 브라우저

---
Q5
A company is storing data on Amazon Simple Storage Service (S3). The company's security policy mandates that data is
encrypted at rest.
Which of the following methods can achieve this? (Choose three.)

A. Use Amazon S3 server-side encryption with AWS Key Management Service managed keys.<br>
B. Use Amazon S3 server-side encryption with customer-provided keys.<br>
C. Use Amazon S3 server-side encryption with EC2 key pair.<br>
D. Use Amazon S3 bucket policies to restrict access to the data at rest.<br>
E. Encrypt the data on the client-side before ingesting to Amazon S3 using their own master key.<br>
F. Use SSL to encrypt the data while in transit to Amazon S3.<br>

정답 : A, B, E

---
Q6
Your firm has uploaded a large amount of aerial image data to S3. In the past, in your on-premises environment, you used
a dedicated group of servers to oaten process this data and used Rabbit MQ - An open source messaging system to get job
information to the servers. Once processed the data would go to tape and be shipped offsite. Your manager told you to
stay with the current design, and leverage AWS archival storage and messaging services to minimize cost.
Which is correct?

A. Use SQS for passing job messages use Cloud Watch alarms to terminate EC2 worker instances when they become idle. Once
data is processed, change the storage class of the S3 objects to Reduced Redundancy Storage.<br>
B. Setup Auto-Scaled workers triggered by queue depth that use spot instances to process messages in SOS Once data is
processed, change the storage class of the S3 objects to Reduced Redundancy Storage.<br>
C. Setup Auto-Scaled workers triggered by queue depth that use spot instances to process messages in SQS Once data is
processed, change the storage class of the S3 objects to Glacier.<br>
D. Use SNS to pass job messages use Cloud Watch alarms to terminate spot worker instances when they become idle. Once
data is processed, change the storage class of the S3 object to Glacier.<br>

정답 : C

---
Q7
You've been hired to enhance the overall security posture for a very large e-commerce site. They have a well architected
multi-tier application running in a VPC that uses ELBs in front of both the web and the app tier with static assets
served directly from S3. They are using a combination of RDS and DynamoDB for their dynamic data and then archiving
nightly into S3 for further processing with EMR. They are concerned because they found questionable log entries and
suspect someone is attempting to gain unauthorized access.
Which approach provides a cost effective scalable mitigation to this kind of attack?

A. Recommend that they lease space at a DirectConnect partner location and establish a 1G DirectConnect connection to
their VPC they would then establish Internet connectivity into their space, filter the traffic in hardware Web
Application Firewall (WAF). And then pass the traffic through the DirectConnect connection into their application
running in their VPC.<br>
B. Add previously identified hostile source IPs as an explicit INBOUND DENY NACL to the web tier subnet.<br>
C. Add a WAF tier by creating a new ELB and an AutoScaling group of EC2 Instances running a host-based WAF. They would
redirect Route 53 to resolve to the new WAF tier ELB. The WAF tier would their pass the traffic to the current web tier
The web tier Security Groups would be updated to only allow traffic from the WAF tier Security Group<br>
D. Remove all but TLS 1.2 from the web tier ELB and enable Advanced Protocol Filtering. This will enable the ELB itself
to perform WAF functionality.<br>

정답 : C

---
Q8
Your company is in the process of developing a next generation pet collar that collects biometric information to assist
families with promoting healthy lifestyles for their pets. Each collar will push 30kb of biometric data in JSON format
every 2 seconds to a collection platform that will process and analyze the data providing health trending information
back to the pet owners and veterinarians via a web portal. Management has tasked you to architect the collection
platform ensuring the following requirements are met.
✑ Provide the ability for real-time analytics of the inbound biometric data
✑ Ensure processing of the biometric data is highly durable. Elastic and parallel
✑ The results of the analytic processing should be persisted for data mining
Which architecture outlined below win meet the initial requirements for the collection platform?

A. Utilize S3 to collect the inbound sensor data analyze the data from S3 with a daily scheduled Data Pipeline and save
the results to a Redshift Cluster.<br>
B. Utilize Amazon Kinesis to collect the inbound sensor data, analyze the data with Kinesis clients and save the results
to a Redshift cluster using EMR.<br>
C. Utilize SQS to collect the inbound sensor data analyze the data from SQS with Amazon Kinesis and save the results to
a Microsoft SQL Server RDS instance.<br>
D. Utilize EMR to collect the inbound sensor data, analyze the data from EUR with Amazon Kinesis and save me results to
DynamoDB.<br>

정답 : B

---
Q9
You are designing Internet connectivity for your VPC. The Web servers must be available on the Internet.
The application must have a highly available architecture.
Which alternatives should you consider? (Choose two.)

A. Configure a NAT instance in your VPC. Create a default route via the NAT instance and associate it with all subnets.
Configure a DNS A record that points to the NAT instance public IP address.<br>
B. Configure a CloudFront distribution and configure the origin to point to the private IP addresses of your Web
servers. Configure a Route53 CNAME record to your CloudFront distribution.<br>
C. Place all your web servers behind ELB. Configure a Route53 CNMIE to point to the ELB DNS name.<br>
D. Assign EIPs to all web servers. Configure a Route53 record set with all EIPs, with health checks and DNS
failover.<br>
E. Configure ELB with an EIP. Place all your Web servers behind ELB. Configure a Route53 A record that points to the
EIP.<br>

정답 : C, D

---
Q10
Topic 1
Your team has a tomcat-based Java application you need to deploy into development, test and production environments.
After some research, you opt to use
Elastic Beanstalk due to its tight integration with your developer tools and RDS due to its ease of management. Your QA
team lead points out that you need to roll a sanitized set of production data into your environment on a nightly basis.
Similarly, other software teams in your org want access to that same restored data via their EC2 instances in your VPC.
The optimal setup for persistence and security that meets the above requirements would be the following.

A. Create your RDS instance as part of your Elastic Beanstalk definition and alter its security group to allow access to
it from hosts in your application subnets.<br>
B. Create your RDS instance separately and add its IP address to your application's DB connection strings in your code
Alter its security group to allow access to it from hosts within your VPC's IP address block.<br>
C. Create your RDS instance separately and pass its DNS name to your app's DB connection string as an environment
variable. Create a security group for client machines and add it as a valid source for DB traffic to the security group
of the RDS instance itself.<br>
D. Create your RDS instance separately and pass its DNS name to your's DB connection string as an environment variable
Alter its security group to allow access to It from hosts in your application subnets.<br>

정답 : C

---
Q11
Your company has an on-premises multi-tier PHP web application, which recently experienced downtime due to a large burst
in web traffic due to a company announcement Over the coming days, you are expecting similar announcements to drive
similar unpredictable bursts, and are looking to find ways to quickly improve your infrastructures ability to handle
unexpected increases in traffic.
The application currently consists of 2 tiers a web tier which consists of a load balancer and several Linux Apache web
servers as well as a database tier which hosts a Linux server hosting a MySQL database.
Which scenario below will provide full site functionality, while helping to improve the ability of your application in
the short timeframe required?

A. Failover environment: Create an S3 bucket and configure it for website hosting. Migrate your DNS to Route53 using
zone file import, and leverage Route53 DNS failover to failover to the S3 hosted website.<br>
B. Hybrid environment: Create an AMI, which can be used to launch web servers in EC2. Create an Auto Scaling group,
which uses the AMI to scale the web tier based on incoming traffic. Leverage Elastic Load Balancing to balance traffic
between on-premises web servers and those hosted in AWS.<br>
C. Offload traffic from on-premises environment: Setup a CIoudFront distribution, and configure CloudFront to cache
objects from a custom origin. Choose to customize your object cache behavior, and select a TTL that objects should exist
in cache.<br>
D. Migrate to AWS: Use VM Import/Export to quickly convert an on-premises web server to an AMI. Create an Auto Scaling
group, which uses the imported AMI to scale the web tier based on incoming traffic. Create an RDS read replica and setup
replication between the RDS instance and on-premises MySQL server to migrate the database.<br>

정답 : B

---
Q12
You are implementing AWS Direct Connect. You intend to use AWS public service end points such as Amazon S3, across the
AWS Direct Connect link. You want other Internet traffic to use your existing link to an Internet Service Provider.
What is the correct way to configure AWS Direct connect for access to services such as Amazon S3?

A. Configure a public Interface on your AWS Direct Connect link. Configure a static route via your AWS Direct Connect
link that points to Amazon S3 Advertise a default route to AWS using BGP.<br>
B. Create a private interface on your AWS Direct Connect link. Configure a static route via your AWS Direct connect link
that points to Amazon S3 Configure specific routes to your network in your VPC.<br>
C. Create a public interface on your AWS Direct Connect link. Redistribute BGP routes into your existing routing
infrastructure; advertise specific routes for your network to AWS.<br>
D. Create a private interface on your AWS Direct connect link. Redistribute BGP routes into your existing routing
infrastructure and advertise a default route to AWS.<br>

정답 : C

다이나믹 링크의 공개 인터페이스 -> 공개적으로 노출된 서비스에 접근할떄 사용됩니다. 온프레미스에서는 내부선으로 빠르게 접근하면서, 인터넷을 통한 접근도 가능합니다. 반면에 프라이빗 인터페이스는 인터넷에서 접근이
불가능합니다.
BGP -> Direct Connect에서는 BGP를 사용하여 AWS와 고객 네트워크 간에 라우팅 정보를 교환합니다.

---
Q13
Your application is using an ELB in front of an Auto Scaling group of web/application servers deployed across two AZs
and a Multi-AZ RDS Instance for data persistence.
The database CPU is often above 80% usage and 90% of I/O operations on the database are reads. To improve performance
you recently added a single-node
Memcached ElastiCache Cluster to cache frequent DB query results. In the next weeks the overall workload is expected to
grow by 30%.
Do you need to change anything in the architecture to maintain the high availability or the application with the
anticipated additional load? Why?

A. Yes, you should deploy two Memcached ElastiCache Clusters in different AZs because the RDS instance will not be able
to handle the load if the cache node fails.<br>
B. No, if the cache node fails you can always get the same data from the DB without having any availability impact.<br>
C. No, if the cache node fails the automated ElastiCache node recovery feature will prevent any availability impact.<br>
D. Yes, you should deploy the Memcached ElastiCache Cluster with two nodes in the same AZ as the RDS DB master instance
to handle the load if one cache node fails.<br>

정답 : A

---
Q14
An ERP application is deployed across multiple AZs in a single region. In the event of failure, the Recovery Time
Objective (RTO) must be less than 3 hours, and the Recovery Point Objective (RPO) must be 15 minutes. The customer
realizes that data corruption occurred roughly 1.5 hours ago.
What DR strategy could be used to achieve this RTO and RPO in the event of this kind of failure?

A. Take hourly DB backups to S3, with transaction logs stored in S3 every 5 minutes.<br>
B. Use synchronous database master-slave replication between two availability zones.<br>
C. Take hourly DB backups to EC2 Instance store volumes with transaction logs stored In S3 every 5 minutes.<br>
D. Take 15 minute DB backups stored In Glacier with transaction logs stored in S3 every 5 minutes.<br>

정답 : A

RPO (복구 지점 목표):

RPO는 재해가 발생했을 때 손실될 수 있는 데이터의 최대 허용 시간을 의미합니다.
예를 들어, RPO가 1시간이라면, 최근 1시간 이내의 데이터는 손실될 수 있음을 의미합니다.
RPO는 데이터 백업 빈도와 직접적으로 관련이 있으며, 더 짧은 RPO는 더 자주 데이터를 백업해야 함을 의미합니다.

RTO는 재해 발생 후 서비스나 시스템을 정상적으로 복구하는 데 걸리는 시간을 의미합니다.
예를 들어, RTO가 3시간이라면, 시스템이나 서비스가 중단된 후 3시간 이내에 복구되어야 한다는 것을 의미합니다.
RTO는 시스템 복구 속도와 관련이 있으며, 더 짧은 RTO는 더 빠른 복구 메커니즘을 필요로 합니다.

B : 마스터의 잘못된 데이터가 슬레이브까지 전파되면 돌아가는게 불가능합니다.<br>
C : ebs 저장은 영구적이지않습니다.<br>
D : glacier는 조회가 오래걸립니다. 3-5시간이 평균적으로 걸립니다.<br>

---
Q15
You are designing the network infrastructure for an application server in Amazon VPC. Users will access all application
instances from the Internet, as well as from an on-premises network. The on-premises network is connected to your VPC
over an AWS Direct Connect link.
How would you design routing to meet the above requirements?

A. Configure a single routing table with a default route via the Internet gateway. Propagate a default route via BGP on
the AWS Direct Connect customer router. Associate the routing table with all VPC subnets.<br>
B. Configure a single routing table with a default route via the Internet gateway. Propagate specific routes for the
on-premises networks via BGP on the AWS Direct Connect customer router. Associate the routing table with all VPC
subnets.<br>
C. Configure a single routing table with two default routes: on to the Internet via an Internet gateway, the other to
the on-premises network via the VPN gateway. Use this routing table across all subnets in the VPC.<br>
D. Configure two routing tables: on that has a default router via the Internet gateway, and other that has a default
route via the VPN gateway. Associate both routing tables with each VPC subnet.<br>

정답 : B

---
Q16
You control access to S3 buckets and objects with:

A. Identity and Access Management (IAM) Policies.<br>
B. Access Control Lists (ACLs).<br>
C. Bucket Policies.<br>
D. All of the above<br>

정답 : D

---
Q17
The AWS IT infrastructure that AWS provides, complies with the following IT security standards, including:
A. SOC 1/SSAE 16/ISAE 3402 (formerly SAS 70 Type II), SOC 2 and SOC 3
B. FISMA, DIACAP, and FedRAMP
C. PCI DSS Level 1, ISO 27001, ITAR and FIPS 140-2
D. HIPAA, Cloud Security Alliance (CSA) and Motion Picture Association of America (MPAA)
E. All of the above

정답 : E

---
Q18
Auto Scaling requests are signed with a _________ signature calculated from the request and the user's private key.

A. SSL<br>
B. AES-256<br>
C. HMAC-SHA1<br>
D. X.509<br>

정답 : C

---
Q19
The following policy can be attached to an IAM group. It lets an IAM user in that group access a "home directory" in AWS
S3 that matches their user name using the console.

{
"Version": "2012-10-17",
"Statement": [
{
"Action": ["s3:*"],
"Effect": "Allow",
"Resource": ["arn:aws:s3:::bucket-name"],
"Condition":{"StringLike":{"s3:prefix":["home/${aws:username}/*"]}}
},
{
"Action":["s3:*"],
"Effect":"Allow",
"Resource": ["arn:aws:s3:::bucket-name/home/${aws:username}/*"]
}
]
}

A. True<br>
B. False
<br>
정답 : B

아래는 지피티의 답변입니다.

아래처럼 s3에 모든 권한이 부여됐는데 버킷을 볼 수가없어?
"Action":["s3:*"],

ChatGPT
IAM 정책에서 "Action":["s3:*"]로 설정되어 있다면 이론적으로는 모든 S3 관련 작업에 대한 권한이 부여된 것처럼 보입니다. 그러나 AWS S3 콘솔을 통해 버킷을 볼 때, 단순히 특정 작업에 대한
권한을 부여하는 것만으로는 충분하지 않습니다.

AWS S3 콘솔을 사용하여 버킷을 탐색하려면 사용자는 두 가지 특별한 권한이 필요합니다. 첫 번째는 'ListAllMyBuckets' 작업입니다. 이 작업은 사용자가 AWS 계정의 모든 버킷 목록을 볼 수 있게
해줍니다. 두 번째는 'GetBucketLocation' 작업입니다. 이 작업은 사용자가 S3 콘솔에 처음 접속할 때 버킷의 위치 정보를 가져오는 데 필요합니다.

따라서, 비록 "s3:*"로 모든 S3 작업에 대한 권한이 부여되었다고 해도, 이 두 가지 특별한 작업에 대한 권한이 명시적으로 포함되어 있지 않다면 사용자는 S3 콘솔을 통해 버킷을 볼 수 없습니다. 이것이 해당
IAM 정책이 S3 콘솔을 사용하여 버킷을 볼 수 있도록 충분하지 않은 이유입니다.

---
Q20
What does elasticity mean to AWS?

A. The ability to scale computing resources up easily, with minimal friction and down with latency.<br>
B. The ability to scale computing resources up and down easily, with minimal friction.<br>
C. The ability to provision cloud computing resources in expectation of future demand.<br>
D. The ability to recover from business continuity events with minimal friction.<br>

정답 : B

---
Q21
The following are AWS Storage services? (Choose two.)

A. AWS Relational Database Service (AWS RDS)<br>
B. AWS ElastiCache<br>
C. AWS Glacier<br>
D. AWS Import/Export<br>

정답 : A, C

---
Q22
How is AWS readily distinguished from other vendors in the traditional IT computing landscape?

A. Experienced. Scalable and elastic. Secure. Cost-effective. Reliable<br>
B. Secure. Flexible. Cost-effective. Scalable and elastic. Global<br>
C. Secure. Flexible. Cost-effective. Scalable and elastic. Experienced<br>
D. Flexible. Cost-effective. Dynamic. Secure. Experienced.<br>

정답 : B

---
Q23
You have launched an EC2 instance with four (4) 500 GB EBS Provisioned IOPS volumes attached. The EC2 instance is
EBS-Optimized and supports 500 Mbps throughput between EC2 and EBS. The four EBS volumes are configured as a single RAID
0 device, and each Provisioned IOPS volume is provisioned with 4,000
IOPS (4,000 16KB reads or writes), for a total of 16,000 random IOPS on the instance. The EC2 instance initially
delivers the expected 16,000 IOPS random read and write performance. Sometime later, in order to increase the total
random I/O performance of the instance, you add an additional two 500 GB EBS Provisioned
IOPS volumes to the RAID. Each volume is provisioned to 4,000 IOPs like the original four, for a total of 24,000 IOPS on
the EC2 instance. Monitoring shows that the EC2 instance CPU utilization increased from 50% to 70%, but the total random
IOPS measured at the instance level does not increase at all.
What is the problem and a valid solution?

A. The EBS-Optimized throughput limits the total IOPS that can be utilized; use an EBSOptimized instance that provides
larger throughput.<br>
B. Small block sizes cause performance degradation, limiting the I/O throughput; configure the instance device driver
and filesystem to use 64KB blocks to increase throughput.<br>
C. The standard EBS Instance root volume limits the total IOPS rate; change the instance root volume to also be a 500GB
4,000 Provisioned IOPS volume.<br>
D. Larger storage volumes support higher Provisioned IOPS rates; increase the provisioned volume storage of each of the
6 EBS volumes to 1TB.<br>
E. RAID 0 only scales linearly to about 4 devices; use RAID 0 with 4 EBS Provisioned IOPS volumes, but increase each
Provisioned IOPS EBS volume to 6,000 IOPS.<br>

---
Q24
Your company is storing millions of sensitive transactions across thousands of 100-GB files that must be encrypted in
transit and at rest. Analysts concurrently depend on subsets of files, which can consume up to 5 TB of space, to
generate simulations that can be used to steer business decisions.
You are required to design an AWS solution that can cost effectively accommodate the long-term storage and in-flight
subsets of data.
Which approach can satisfy these objectives?

A. Use Amazon Simple Storage Service (S3) with server-side encryption, and run simulations on subsets in ephemeral
drives on Amazon EC2. <br>
B. Use Amazon S3 with server-side encryption, and run simulations on subsets in-memory on Amazon EC2.<br>
C. Use HDFS on Amazon EMR, and run simulations on subsets in ephemeral drives on Amazon EC2.<br>
D. Use HDFS on Amazon Elastic MapReduce (EMR), and run simulations on subsets in-memory on Amazon Elastic Compute
Cloud (EC2).<br>
E. Store the full data set in encrypted Amazon Elastic Block Store (EBS) volumes, and regularly capture snapshots that
can be cloned to EC2 workstations.<br>

정답 : A

---
Q25
Your customer is willing to consolidate their log streams (access logs, application logs, security logs, etc.) in one
single system. Once consolidated, the customer wants to analyze these logs in real time based on heuristics. From time
to time, the customer needs to validate heuristics, which requires going back to data samples extracted from the last 12
hours.
What is the best approach to meet your customer's requirements?

A. Send all the log events to Amazon SQS, setup an Auto Scaling group of EC2 servers to consume the logs and apply the
heuristics.<br>
B. Send all the log events to Amazon Kinesis, develop a client process to apply heuristics on the logs<br>
C. Configure Amazon CloudTrail to receive custom logs, use EMR to apply heuristics the logs<br>
D. Setup an Auto Scaling group of EC2 syslogd servers, store the logs on S3, use EMR to apply heuristics on the logs<br>

정답 : B

---
Q26
A newspaper organization has an on-premises application which allows the public to search its back catalogue and
retrieve individual newspaper pages via a website written in Java. They have scanned the old newspapers into JPEGs (
approx 17TB) and used Optical Character Recognition (OCR) to populate a commercial search product. The hosting platform
and software are now end of life and the organization wants to migrate its archive to AWS and produce a cost efficient
architecture and still be designed for availability and durability.
Which is the most appropriate?

A. Use S3 with reduced redundancy lo store and serve the scanned files, install the commercial search application on EC2
Instances and configure with auto- scaling and an Elastic Load Balancer.<br>
B. Model the environment using CloudFormation use an EC2 instance running Apache webserver and an open source search
application, stripe multiple standard EBS volumes together to store the JPEGs and search index.<br>
C. Use S3 with standard redundancy to store and serve the scanned files, use CloudSearch for query processing, and use
Elastic Beanstalk to host the website across multiple availability zones.<br>
D. Use a single-AZ RDS MySQL instance lo store the search index 33d the JPEG images use an EC2 instance to serve the
website and translate user queries into SQL.<br>
E. Use a CloudFront download distribution to serve the JPEGs to the end users and Install the current commercial search
product, along with a Java Container Tor the website on EC2 instances and use Route53 with DNS round-robin.<br>

정답 : C

---
Q27
A company has a complex web application that leverages Amazon CloudFront for global scalability and performance. Over
time, users report that the web application is slowing down.
The company's operations team reports that the CloudFront cache hit ratio has been dropping steadily. The cache metrics
report indicates that query strings on some URLs are inconsistently ordered and are specified sometimes in mixed-case
letters and sometimes in lowercase letters.
Which set of actions should the solutions architect take to increase the cache hit ratio as quickly possible?

A. Deploy a Lambda@Edge function to sort parameters by name and force them to be lowercase. Select the CloudFront viewer
request trigger to invoke the function.<br>
B. Update the CloudFront distribution to disable caching based on query string parameters.<br>
C. Deploy a reverse proxy after the load balancer to post process the emitted URLs in the application to force the URL
strings to be lowercase.<br>
D. Update the CloudFront distribution to specify case-insensitive query string processing.<br>

---
Q28
You are looking to migrate your Development (Dev) and Test environments to AWS. You have decided to use separate AWS
accounts to host each environment.
You plan to link each accounts bill to a Master AWS account using Consolidated Billing. To make sure you keep within
budget you would like to implement a way for administrators in the Master account to have access to stop, delete and/or
terminate resources in both the Dev and Test accounts.
Identify which option will allow you to achieve this goal.

A. Create IAM users in the Master account with full Admin permissions. Create cross-account roles in the Dev and Test
accounts that grant the Master account access to the resources in the account by inheriting permissions from the Master
account.<br>
B. Create IAM users and a cross-account role in the Master account that grants full Admin permissions to the Dev and
Test accounts.<br>
C. Create IAM users in the Master account. Create cross-account roles in the Dev and Test accounts that have full Admin
permissions and grant the Master account access.<br>
D. Link the accounts using Consolidated Billing. This will give IAM users in the Master account access to resources in
the Dev and Test accounts<br>

정답 : C

---
Q29
You're running an application on-premises due to its dependency on non-x86 hardware and want to use AWS for data backup.
Your backup application is only able to write to POSIX-compatible block-based storage. You have 140TB of data and would
like to mount it as a single folder on your file server. Users must be able to access portions of this data while the
backups are taking place.
What backup solution would be most appropriate for this use case?

A. Use Storage Gateway and configure it to use Gateway Cached volumes.<br>
B. Configure your backup software to use S3 as the target for your data backups.<br>
C. Configure your backup software to use Glacier as the target for your data backups.<br>
D. Use Storage Gateway and configure it to use Gateway Stored volumes.<br>

정답 : D

---
Q30
To serve Web traffic for a popular product your chief financial officer and IT director have purchased 10 m1.large heavy
utilization Reserved Instances (RIs), evenly spread across two availability zones; Route 53 is used to deliver the
traffic to an Elastic Load Balancer (ELB). After several months, the product grows even more popular and you need
additional capacity. As a result, your company purchases two C3.2xlarge medium utilization Ris. You register the two
c3.2xlarge instances with your ELB and quickly find that the m1.large instances are at 100% of capacity and the
c3.2xlarge instances have significant capacity that's unused.
Which option is the most cost effective and uses EC2 capacity most effectively?

A. Configure Autoscaling group and Launch Configuration with ELB to add up to 10 more on-demand m1.large instances when
triggered by Cloudwatch. Shut off c3.2xlarge instances.<br>
B. Configure ELB with two c3.2xlarge instances and use on-demand Autoscaling group for up to two additional c3.2xlarge
instances. Shut off m1.large instances.<br>
C. Route traffic to EC2 m1.large and c3.2xlarge instances directly using Route 53 latency based routing and health
checks. Shut off ELB.<br>
D. Use a separate ELB for each instance type and distribute load to ELBs with Route 53 weighted round robin.<br>

정답 : D

---
Q31
You have deployed a web application targeting a global audience across multiple AWS Regions under the domain
name.example.com. You decide to use
Route53 Latency-Based Routing to serve web requests to users from the region closest to the user. To provide business
continuity in the event of server downtime you configure weighted record sets associated with two web servers in
separate Availability Zones per region. Dunning a DR test you notice that when you disable all web servers in one of the
regions Route53 does not automatically direct all users to the other region.
What could be happening? (Choose two.)

A. Latency resource record sets cannot be used in combination with weighted resource record sets.<br>
B. You did not setup an HTTP health check to one or more of the weighted resource record sets associated with me
disabled web servers.<br>
C. The value of the weight associated with the latency alias resource record set in the region with the disabled servers
is higher than the weight for the other region.<br>
D. One of the two working web servers in the other region did not pass its HTTP health check.<br>
E. You did not set "Evaluate Target Health" to "Yes" on the latency alias resource record set associated with example
com in the region where you disabled the servers.<br>

정답 : B, E

---
Q32
Your startup wants to implement an order fulfillment process for selling a personalized gadget that needs an average of
3-4 days to produce with some orders taking up to 6 months you expect 10 orders per day on your first day. 1000 orders
per day after 6 months and 10,000 orders after 12 months.
Orders coming in are checked for consistency men dispatched to your manufacturing plant for production quality control
packaging shipment and payment processing If the product does not meet the quality standards at any stage of the process
employees may force the process to repeat a step Customers are notified via email about order status and any critical
issues with their orders such as payment failure.
Your base architecture includes AWS Elastic Beanstalk for your website with an RDS MySQL instance for customer data and
orders.
How can you implement the order fulfillment process while making sure that the emails are delivered reliably?

A. Add a business process management application to your Elastic Beanstalk app servers and re-use the ROS database for
tracking order status use one of the Elastic Beanstalk instances to send emails to customers.<br>
B. Use SWF with an Auto Scaling group of activity workers and a decider instance in another Auto Scaling group with
min/max=1 Use the decider instance to send emails to customers.<br>
C. Use SWF with an Auto Scaling group of activity workers and a decider instance in another Auto Scaling group with
min/max=1 use SES to send emails to customers.<br>
D. Use an SQS queue to manage all process tasks Use an Auto Scaling group of EC2 Instances that poll the tasks and
execute them. Use SES to send emails to customers.<br>

정답 : C

AWS의 Simple Workflow Service (SWF)는 개발자들이 분산된 애플리케이션, 프로세스, 또는 워크플로우를 쉽게 구축하고 실행할 수 있게 해주는 서비스입니다. SWF의 주요 역할과 기능은 다음과
같습니다:

워크플로우 관리: SWF는 복잡한 워크플로우의 조정과 실행을 관리합니다. 예를 들어, 여러 단계의 작업 처리 순서를 정의하고, 각 단계가 성공적으로 완료되었는지 추적할 수 있습니다.

태스크 분배: SWF는 다양한 태스크(작업)를 적절한 작업자(소프트웨어 프로그램 또는 프로세스)에게 할당합니다. 이는 워크플로우 내에서 특정 작업이 어느 시점에 실행되어야 하는지 결정하는 데 도움이 됩니다.

상태 유지 및 조정: SWF는 워크플로우의 상태를 유지하며, 각 태스크의 진행 상황을 추적합니다. 이를 통해 어느 단계가 완료되었는지, 어떤 작업이 다음으로 수행되어야 하는지 파악할 수 있습니다.

신뢰성과 일관성: SWF는 작업의 중복 실행을 방지하고, 워크플로우의 일관성을 유지하는 데 도움을 줍니다. 이는 오류가 발생했을 때 안정적인 복구 및 재실행을 가능하게 합니다.

확장성: SWF는 확장성이 뛰어나며, 수많은 작업과 복잡한 워크플로우를 효율적으로 관리할 수 있습니다.

통합 및 호환성: 다른 AWS 서비스와의 통합이 용이하여, 예를 들어 Amazon EC2, Amazon RDS, Amazon S3 등과 함께 사용할 수 있습니다.


---
Q33
A read only news reporting site with a combined web and application tier and a database tier that receives large and
unpredictable traffic demands must be able to respond to these traffic fluctuations automatically.
What AWS services should be used meet these requirements?

A. Stateless instances for the web and application tier synchronized using ElastiCache Memcached in an autoscaimg group
monitored with CloudWatch and RDS with read replicas.<br>
B. Stateful instances for the web and application tier in an autoscaling group monitored with CloudWatch and RDS with
read replicas.<br>
C. Stateful instances for the web and application tier in an autoscaling group monitored with CloudWatch and multi-AZ
RDS.<br>
D. Stateless instances for the web and application tier synchronized using ElastiCache Memcached in an autoscaling group
monitored with CloudWatch and multi-AZ RDS.<br>

정답 : A

---
Q34

You are designing a photo-sharing mobile app. The application will store all pictures in a single Amazon S3 bucket.
Users will upload pictures from their mobile device directly to Amazon S3 and will be able to view and download their
own pictures directly from Amazon S3.
You want to configure security to handle potentially millions of users in the most secure manner possible.
What should your server-side application do when a new user registers on the photo-sharing mobile application?

A. Create an IAM user. Update the bucket policy with appropriate permissions for the IAM user. Generate an access key
and secret key for the IAM user, store them in the mobile app and use these credentials to access Amazon S3.<br>
B. Create an IAM user. Assign appropriate permissions to the IAM user. Generate an access key and secret key for the IAM
user, store them in the mobile app and use these credentials to access Amazon S3.<br>
C. Create a set of long-term credentials using AWS Security Token Service with appropriate permissions. Store these
credentials in the mobile app and use them to access Amazon S3.<br>
D. Record the user's information in Amazon RDS and create a role in IAM with appropriate permissions. When the user uses
their mobile app, create temporary credentials using the AWS Security Token Service "AssumeRole" function. Store these
credentials in the mobile app's memory and use them to access Amazon S3. Generate new credentials the next time the user
runs the mobile app.<br>
E. Record the user's information in Amazon DynamoDB. When the user uses their mobile app, create temporary credentials
using AWS Security Token Service with appropriate permissions. Store these credentials in the mobile app's memory and
use them to access Amazon S3. Generate new credentials the next time the user runs the mobile app.<br>

정답 : D

1. 사용자 회원가입

사용자가 회원가입을 하여 아이디와 패스워드를 디비에 저장합니다.

2. 사용자 로그인

사용자가 아이디와 패스워드로 로그인합니다.

3. IAM 역할과 STS

서버는 STS를 사용하여 해당 사용자에 대한 임시 접근 권한을 가진 IAM 역할을 "Assume"하도록 요청합니다.

이 임시 자격 증명은 사용자가 자신의 S3 경로에만 접근할 수 있도록 제한된 권한을 가집니다.

4. 클라이언트에 IAM 역할 전달

서버는 생성된 임시 자격 증명을 클라이언트에 전달합니다. 클라이언트는 이 자격 증명을 사용하여 S3에 접근하여 사진을 업로드하거나 다운로드합니다.

5. 자격 증명 만료 및 재요청:

임시 자격 증명은 제한된 시간 동안만 유효합니다. 만료되면, 사용자는 다시 로그인하여 새로운 임시 자격 증명을 요청해야 합니다.

---
Q35
You are tasked with moving a legacy application from a virtual machine running inside your datacenter to an Amazon VPC.
Unfortunately, this app requires access to a number of on-premises services and no one who configured the app still
works for your company. Even worse there's no documentation for it.
What will allow the application running inside the VPC to reach back and access its internal dependencies without being
reconfigured? (Choose three.)

A. An AWS Direct Connect link between the VPC and the network housing the internal services.<br>
B. An Internet Gateway to allow a VPN connection.<br>
C. An Elastic IP address on the VPC instance<br>
D. An IP address space that does not conflict with the one on-premises<br>
E. Entries in Amazon Route 53 that allow the Instance to resolve its dependencies' IP addresses<br>
F. A VM Import of the current virtual machine<br>

---
Q36
You have a periodic image analysis application that gets some files in input, analyzes them and tor each file writes
some data in output to a ten file the number of files in input per day is high and concentrated in a few hours of the
day.
Currently you have a server on EC2 with a large EBS volume that hosts the input data and the results. It takes almost 20
hours per day to complete the process.
What services could be used to reduce the elaboration time and improve the availability of the solution?

A. S3 to store I/O files. SQS to distribute elaboration commands to a group of hosts working in parallel. Auto scaling
to dynamically size the group of hosts depending on the length of the SQS queue <br>
B. EBS with Provisioned IOPS (PIOPS) to store I/O files. SNS to distribute elaboration commands to a group of hosts
working in parallel Auto Scaling to dynamically size the group of hosts depending on the number of SNS
notifications <br>
C. S3 to store I/O files, SNS to distribute evaporation commands to a group of hosts working in parallel. Auto scaling
to dynamically size the group of hosts depending on the number of SNS notifications <br>
D. EBS with Provisioned IOPS (PIOPS) to store I/O files SQS to distribute elaboration commands to a group of hosts
working in parallel Auto Scaling to dynamically size the group ot hosts depending on the length of the SQS queue. <br>

정답 : A

D로 고민했지만 EBS는 병렬처리에서 공유가안된다. 또한 비용 효울적이다.

---
Q37
You have been asked to design the storage layer for an application. The application requires disk performance of at
least 100,000 IOPS. In addition, the storage layer must be able to survive the loss of an individual disk, EC2 instance,
or Availability Zone without any data loss. The volume you provide must have a capacity of at least 3 TB.
Which of the following designs will meet these objectives?

A. Instantiate a c3.8xlarge instance in us-east-1. Provision 4x1TB EBS volumes, attach them to the instance, and
configure them as a single RAID 5 volume. Ensure that EBS snapshots are performed every 15 minutes.<br>
B. Instantiate a c3.8xlarge instance in us-east-1. Provision 3xlTB EBS volumes, attach them to the Instance, and
configure them as a single RAID 0 volume. Ensure that EBS snapshots are performed every 15 minutes.<br>
C. Instantiate an i2.8xlarge instance in us-east-1a. Create a RAID 0 volume using the four 800GB SSD ephemeral disks
provided with the instance. Provision 3x1TB EBS volumes, attach them to the instance, and configure them as a second
RAID 0 volume. Configure synchronous, block-level replication from the ephemeral-backed volume to the EBS-backed
volume.<br>
D. Instantiate a c3.8xlarge instance in us-east-1. Provision an AWS Storage Gateway and configure it for 3 TB of storage
and 100,000 IOPS. Attach the volume to the instance.<br>
E. Instantiate an i2.8xlarge instance in us-east-1a. Create a RAID 0 volume using the four 800GB SSD ephemeral disks
provided with the instance. Configure synchronous, block-level replication to an identically configured instance in
us-east-1b.<br>

정답 : E

E : 가용영역 2개 + 동기식 복제로 안전하게 보호, RAID0으로 IOPS 충족

---
Q38

You are the new IT architect in a company that operates a mobile sleep tracking application.
When activated at night, the mobile app is sending collected data points of 1 kilobyte every 5 minutes to your backend.
The backend takes care of authenticating the user and writing the data points into an Amazon DynamoDB table.
Every morning, you scan the table to extract and aggregate last night's data on a per user basis, and store the results
in Amazon S3. Users are notified via
Amazon SNS mobile push notifications that new data is available, which is parsed and visualized by the mobile app.
Currently you have around 100k users who are mostly based out of North America.
You have been tasked to optimize the architecture of the backend system to lower cost.
What would you recommend? (Choose two.)

A. Have the mobile app access Amazon DynamoDB directly Instead of JSON files stored on Amazon S3.<br>
B. Write data directly into an Amazon Redshift cluster replacing both Amazon DynamoDB and Amazon S3.<br>
C. Introduce an Amazon SQS queue to buffer writes to the Amazon DynamoDB table and reduce provisioned write
throughput.<br>
D. Introduce Amazon Elasticache to cache reads from the Amazon DynamoDB table and reduce provisioned read
throughput.<br>
E. Create a new Amazon DynamoDB table each day and drop the one for the previous day after its data is on Amazon S3.<br>

정답 : C, E

---
Q39

A large real-estate brokerage is exploring the option of adding a cost-effective location based alert to their existing
mobile application. The application backend infrastructure currently runs on AWS. Users who opt in to this service will
receive alerts on their mobile device regarding real-estate otters in proximity to their location. For the alerts to be
relevant delivery time needs to be in the low minute count the existing mobile app has 5 million users across the US.
Which one of the following architectural suggestions would you make to the customer?

A. The mobile application will submit its location to a web service endpoint utilizing Elastic Load Balancing and EC2
instances; DynamoDB will be used to store and retrieve relevant offers EC2 instances will communicate with mobile
earners/device providers to push alerts back to mobile application.<br>
B. Use AWS DirectConnect or VPN to establish connectivity with mobile carriers EC2 instances will receive the mobile
applications location through carrier connection: RDS will be used to store and relevant offers. EC2 instances will
communicate with mobile carriers to push alerts back to the mobile application.<br>
C. The mobile application will send device location using SQS. EC2 instances will retrieve the relevant others from
DynamoDB. AWS Mobile Push will be used to send offers to the mobile application.<br>
D. The mobile application will send device location using AWS Mobile Push EC2 instances will retrieve the relevant
offers from DynamoDB. EC2 instances will communicate with mobile carriers/device providers to push alerts back to the
mobile application.<br>

정답 : C

---
Q40
You currently operate a web application. In the AWS US-East region. The application runs on an auto-scaled layer of EC2
instances and an RDS Multi-AZ database. Your IT security compliance officer has tasked you to develop a reliable and
durable logging solution to track changes made to your EC2.IAM And RDS resources. The solution must ensure the integrity
and confidentiality of your log data.
Which of these solutions would you recommend?

A. Create a new CloudTrail trail with one new S3 bucket to store the logs and with the global services option selected.
Use IAM roles S3 bucket policies and Multi Factor Authentication (MFA) Delete on the S3 bucket that stores your
logs.<br>
B. Create a new CloudTrail with one new S3 bucket to store the logs Configure SNS to send log file delivery
notifications to your management system. Use IAM roles and S3 bucket policies on the S3 bucket mat stores your logs.<br>
C. Create a new CloudTrail trail with an existing S3 bucket to store the logs and with the global services option
selected. Use S3 ACLs and Multi Factor Authentication (MFA). Delete on the S3 bucket that stores your logs.<br>
D. Create three new CloudTrail trails with three new S3 buckets to store the logs one for the AWS Management console,
one for AWS SDKs and one for command line tools. Use IAM roles and S3 bucket policies on the S3 buckets that store your
logs.<br>

정답 : A

