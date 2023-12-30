# Route53

1. 직접 'mj950425.github.io'를 브라우저에 입력했을 때:
   브라우저 요청: 사용자가 브라우저에 'mj950425.github.io'를 입력하고 엔터를 누릅니다.
   DNS 조회: 브라우저는 DNS 시스템을 통해 'mj950425.github.io'의 IP 주소를 찾습니다.
   서버 요청: 찾은 IP 주소로 HTTP 요청을 보냅니다. 이 요청의 'Host' 헤더에는 'mj950425.github.io'가 포함됩니다.
   GitHub Pages 처리: GitHub Pages는 'Host' 헤더를 확인하고, 'mj950425.github.io'에 해당하는 컨텐츠를 반환합니다.
   브라우저에서 컨텐츠 표시: 브라우저는 받은 컨텐츠를 사용자에게 보여줍니다.
2. 'www.minj-blog.com'을 CNAME으로 'mj950425.github.io'에 매핑했을 때:
   브라우저 요청: 사용자가 브라우저에 'www.minj-blog.com'을 입력하고 엔터를 누릅니다.
   DNS 조회: 브라우저는 DNS 시스템을 통해 'www.minj-blog.com'의 IP 주소를 찾습니다. DNS 시스템은 'www.minj-blog.com'이 'mj950425.github.io'로 매핑되어 있음을 알려줍니다.
   다시 DNS 조회: 브라우저는 'mj950425.github.io'의 IP 주소를 찾기 위해 다시 DNS 조회를 합니다.
   서버 요청: 찾은 IP 주소로 HTTP 요청을 보냅니다. 이 요청의 'Host' 헤더에는 여전히 'www.minj-blog.com'이 포함됩니다.
   GitHub Pages 처리: GitHub Pages는 'Host' 헤더를 확인합니다. 여기서 'www.minj-blog.com'을 사용자 지정 도메인으로 설정해 두었다면, 해당 도메인에 매핑된 컨텐츠를 반환합니다. 설정되지 않았다면, 오류 페이지나 기본 페이지를 반환할 수 있습니다.
   브라우저에서 컨텐츠 표시: 브라우저는 받은 컨텐츠를 사용자에게 보여줍니다.
   이 두 상황의 주요 차이점은 'Host' 헤더의 값입니다. 첫 번째 상황에서는 'mj950425.github.io'가, 두 번째 상황에서는 'www.minj-blog.com'이 'Host' 헤더에 포함되어 GitHub Pages 서버에 전달됩니다. GitHub Pages는 이 'Host' 헤더 값을 기반으로 어떤 사이트의 컨텐츠를 제공할지 결정합니다. 따라서 CNAME 레코드로 매핑을 설정하는 것뿐만 아니라 GitHub Pages 설정에서도 'www.minj-blog.com'을 등록해야 합니다.
   185.199.108.153 주소는 mj950425.github.io 에서 제공해주는 자원들을 갖고 있는 호스트 주소가 맞지?

minj-blog.com이 깃헙에 등록되어있지않으면 404를 뱉어주는 이유가 뭐야? 인증에 실패해서 403을 반환하는건 이해되어도 자원을 못찾았다는게 이해가안돼.

기존에 브라우저가 호스트에 값을 minj-blog.com으로 채워넣지않을때는 잘만 185.199.108.153의 자원을 반환해줬잖아
ChatGPT
네, 185.199.108.153 주소는 GitHub Pages가 사용하는 주소 중 하나로, mj950425.github.io에 호스팅된 자원들을 갖고 있는 서버의 IP 주소입니다.

minj-blog.com이 GitHub에 등록되어 있지 않을 때 404 오류가 발생하는 이유는, GitHub Pages 서버가 'Host' 헤더를 통해 들어오는 도메인을 확인하고 해당하는 저장소의 웹페이지를 제공하기 때문입니다. mj950425.github.io로 직접 접속할 때와 minj-blog.com을 통해 접속할 때 서버가 처리하는 방식에는 차이가 있습니다.

mj950425.github.io로 직접 접속하는 경우: 브라우저는 'Host' 헤더에 mj950425.github.io를 포함하여 GitHub Pages 서버로 요청을 보냅니다. GitHub Pages 서버는 mj950425.github.io를 'Host' 헤더에서 인식하고, 해당 저장소에 설정된 웹페이지를 찾아서 반환합니다.

minj-blog.com을 통해 접속하는 경우: 'Host' 헤더에는 minj-blog.com이 포함되어 있습니다. 이 경우 GitHub Pages 서버는 minj-blog.com이라는 'Host' 값에 해당하는 저장소를 찾습니다. 이 도메인이 GitHub Pages 설정에 등록되고, 해당하는 GitHub 저장소에 연결되어 있지 않다면, 서버는 해당 웹페이지를 찾을 수 없다고 판단하고 404 오류를 반환합니다.

GitHub Pages는 사용자 지정 도메인이 자신들의 시스템 내에서 어떤 저장소와 연결되는지 알아야 올바르게 요청을 처리할 수 있습니다. 만약 minj-blog.com 또는 www.minj-blog.com이 GitHub Pages 설정에 등록되어 있지 않다면, GitHub Pages 서버는 이 요청을 어느 저장소의 페이지로 라우팅해야 하는지 알 수 없습니다. 그래서 'Host' 헤더의 값에 해당하는 웹페이지를 찾을 수 없다고 판단하여 404 오류를 반환하는 것입니다.

결국, mj950425.github.io로 직접 접속할 때와 사용자 지정 도메인으로 접속할 때 모두 올바른 웹페이지를 반환받으려면, 해당 도메인들이 GitHub Pages 설정에 정확히 등록되어 있어야 하며, 각각의 도메인에 대한 요청을 처리할 수 있도록 GitHub 저장소에 설정되어 있어야 합니다.

User
host 헤더의 의미가 뭐야?
ChatGPT
HTTP 요청을 할 때, 'Host' 헤더는 해당 요청이 어떤 호스트와 통신하려고 하는지를 지정하는 역할을 합니다. 웹 서버가 여러 도메인을 처리할 수 있을 때, 'Host' 헤더를 통해 서버는 어떤 도메인에 대한 요청인지를 식별하고, 각 도메인에 맞는 적절한 웹 페이지나 리소스를 제공할 수 있습니다.

예를 들어, 하나의 웹 서버가 example.com과 anotherexample.com 두 개의 도메인을 서비스하고 있다고 가정해 봅시다. 사용자가 웹 브라우저를 통해 example.com에 접속하려고 하면, 브라우저는 'Host' 헤더에 example.com을 포함한 HTTP 요청을 서버로 보냅니다. 서버는 이 'Host' 헤더를 확인하고 example.com에 해당하는 컨텐츠를 사용자에게 반환합니다.

이와 마찬가지로, anotherexample.com에 접속하려고 하면, 브라우저는 'Host' 헤더에 anotherexample.com을 포함하여 요청을 보내고, 서버는 그에 맞는 컨텐츠를 제공합니다.

'Host' 헤더는 특히 가상 호스팅 환경에서 중요한데, 이는 여러 도메인이 동일한 IP 주소를 공유할 때 각각의 도메인에 대해 서로 다른 웹사이트를 호스팅할 수 있도록 해줍니다. 따라서 'Host' 헤더는 서버가 올바른 웹사이트를 클라이언트에게 제공하는 데 필수적인 정보를 담고 있습니다.

GitHub Pages에서 사용자 지정 도메인을 설정할 때에도 이 'Host' 헤더가 중요한 역할을 하는데, GitHub Pages 서버는 'Host' 헤더를 통해 들어오는 요청이 어떤 사용자 지정 도메인에 해당하는지를 식별하고, 설정된 저장소의 컨텐츠를 반환합니다.

User
아.. 185.199.108.153주소의 호스트가 갖고있는 자원이 mj950425.github.io 말고도 여러가지가 있는거구나? 그래서 host 정보가 필요한거고
ChatGPT
네, 맞습니다. 185.199.108.153 같은 IP 주소를 가진 GitHub Pages 서버는 mj950425.github.io를 포함하여 수많은 다른 GitHub Pages 사이트들을 호스팅하고 있습니다. 이 서버는 들어오는 각 HTTP 요청의 'Host' 헤더를 확인하여, 요청이 어떤 도메인을 대상으로 하는지를 식별합니다.

'Host' 헤더에 명시된 도메인 이름을 기반으로, 서버는 해당 도메인에 연결된 특정 GitHub 사용자의 저장소에서 호스팅되는 웹 페이지나 자원을 찾아 사용자에게 제공합니다. 이는 '가상 호스팅'이라는 방식으로, 하나의 서버가 다수의 웹사이트를 서비스할 수 있게 해주는 기술입니다.

그래서 만약 www.minj-blog.com으로 요청이 들어온다면, 서버는 'Host' 헤더를 보고 이 요청이 해당하는 GitHub 저장소의 설정을 참조하여 적절한 웹 페이지를 반환하게 됩니다. 만약 GitHub Pages 설정에 www.minj-blog.com이 등록되어 있지 않다면, 서버는 이 요청에 대한 적절한 자원을 찾을 수 없고, 결과적으로 사용자에게 404 오류를 반환하게 됩니다.

- A : maps a hostname to IPv4
- AAAA : maps a hostname to IPv6
- CNAME : maps a hostname to another hostname
  - example.com 으로는 CNAME을 만들 수 없고, www.example.com 으로 만들어야한다.
- NS : control how traffic is routed for a domain

ALB의 lbl-1234.us-east-2.elb.amazonaws.com 이라는 DNS을 myapp.mydomain.com 으로 매핑하려고한다면

CNAME
hostname to hostname인데 루트 도메인이 아니어야한다.
Alias 
루트 도메인이어도 된다.
따라서 ALB는 Alias로 해야한다.
하지만 다른건 다 되는데 EC2 DNS를 Alias를 할 수 없다.

ttl이 있다.

하나의 dns에 여러개의 ip가 mapping될 수 있다. 
이 경우 클라이언트에게 여러개의 ip를 건네주면, 클라이언트가 그 중에 랜덤하게 고른다.

weighted
라우팅 비중을 다르게할 수 있다.

latency
레이턴시 기반

public dns

private dns

dns resolver란?

Title: Setting Up a Wildcard SSL Certificate on AWS: A Step-by-Step Guide

Securing your web application with HTTPS is not just a good practice; it's a necessity. Here's a straightforward guide on how to set up a wildcard SSL/TLS certificate for your domain using AWS Certificate Manager (ACM).

Step 1: Request Your Wildcard Certificate

Log in to the AWS Certificate Manager (ACM) service.
Choose to provision a new certificate and specify your domain in the format *.yourdomain.com. This wildcard notation ensures the certificate covers all subdomains.
Step 2: Prove Your Domain Ownership to ACM

ACM will need to verify that you actually control the domain for which you're requesting the certificate.
Choose DNS validation. ACM will then generate a CNAME record that you'll use in the next step.
Step 3: Add the CNAME Record to Your Domain's DNS Configuration

Access your domain's DNS settings, which might be in AWS Route 53 or another domain hosting provider.
Add the CNAME record provided by ACM. This step is like leaving a digital signature on your domain's DNS records to prove that it's really yours.
Step 4: ACM Issues Your Certificate

Once ACM detects the CNAME record and confirms everything checks out, your certificate status will change to "Issued."
Note that the certificate isn't something you download; ACM handles it entirely, associating it with your AWS resources.
Step 5: Attach the Certificate to Your AWS Resources

Now that your certificate is ready, you can attach it to your Application Load Balancer (ALB) or any other AWS service that needs it.
Configure your ALB with an HTTPS listener and select your newly issued wildcard certificate for it.
Step 6: Celebrate a Secure Connection

After you've pointed your domain (like subdomain.yourdomain.com) to the ALB, and the DNS changes have propagated, your application should be accessible via HTTPS.
You'll see a padlock symbol in the browser's address bar when visiting your website, indicating that the connection is secure.
And there you have it! Your application is now using a secure communication protocol, which not only protects your users' data but also boosts your SEO rankings and trustworthiness