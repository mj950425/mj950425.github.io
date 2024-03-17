Oauth 2.0의 핵심은

인증은 유저가하고, 인가 토큰을 서버에 제공한다는것이다.

SAML 프로세스
사용자가 AWS(서비스 제공업체)에 로그인을 시도합니다.
사용자는 회사 IdP 로그인으로 리디렉션됩니다.
로그인하면 IdP가 해당 디렉토리(예: LDAP)에 대해 사용자를 인증합니다.
IdP는 SAML 어설션을 생성하고 이를 사용자의 브라우저로 반환합니다.
사용자의 브라우저는 자동으로 SAML 어설션을 AWS에 게시합니다. 그러면 AWS는 어설션에 따라 액세스 권한을 부여합니다.
SAML 흐름에서 어설션은 실제로 사용자의 브라우저를 통해 전달되지만 사용자가 이를 수동으로 처리하지는 않습니다. 브라우저는 안전한 전송 메커니즘으로 사용되어 IdP에서 SP로 SAML 어설션을 전달합니다.

OAuth 프로세스
OAuth를 사용하면 사용자의 브라우저와 관련된 간접적인 흐름도 있지만 SAML과는 다릅니다:

사용자는 타사 애플리케이션에 서비스(예: Google 또는 Facebook)의 리소스에 대한 액세스 권한을 부여하는 프로세스를 시작합니다.
서비스는 사용자를 로그인 및 인증 페이지로 리디렉션합니다.
사용자가 로그인하여 타사 애플리케이션에 권한을 부여합니다.
서비스가 사용자의 브라우저로 인증 코드를 전송하고, 이 인증 코드가 애플리케이션으로 전송됩니다.
애플리케이션은 인증 코드를 서비스와 액세스 토큰으로 교환합니다.
액세스 토큰을 획득하면 애플리케이션은 서비스에서 사용자의 리소스에 액세스할 수 있습니다.
OAuth에서 액세스 토큰은 사용자에게 노출되지 않으며 애플리케이션에서 프로그래밍 방식으로 처리됩니다. 사용자의 브라우저는 서비스에서 애플리케이션으로 인증 코드를 리디렉션하여 전달하는 데 사용되며, 애플리케이션은 이 코드를 사용하여 액세스 토큰을 안전하게 획득합니다.

요약하자면:

SAML과 OAuth는 모두 브라우저 리디렉션을 사용하여 인증 및 권한 부여 정보의 흐름을 원활하게 합니다.
SAML에서 어설션은 사용자의 브라우저를 통해 자동으로 SP에 게시되는 인증 정보를 포함합니다.
OAuth에서는 인증 코드가 사용자의 브라우저를 통해 애플리케이션으로 전달되고, 애플리케이션은 이를 서비스와 직접 액세스 토큰으로 교환합니다. 액세스 토큰은 인증에 사용되며 사용자에게 노출되지 않습니다.


IDP and LDAP
An IDP is a service that creates, maintains, and manages identity information for principals (such as users, computer systems, and services) and provides principal authentication to other service providers within a federation or distributed network.
It is responsible for issuing identity assertions, which may be used for authentication and authorization purposes. In the context of SAML, the IDP generates SAML assertions based on successful authentication of a user.
The IDP interacts with user directories or databases to validate credentials and create the appropriate assertions for access control.

Lightweight Directory Access Protocol (LDAP)
