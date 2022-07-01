---
title: '2022-02-18-NextStep ATDD 추상화'
excerpt: ' '
categories:
    - java
tag:
    - java
toc: false
---

# NextStep ATDD 추상화 리팩토링

**🙋‍♀️이번 추상화 미션을 진행하면서 배워가는게 많았습니다.**

**추상화를 통해 객체간의 커플링을 어떻게 낮추었는지 기록하고자 합니다.**

---

## 👀 1. 인증 과정 설명

**인증 플로우는 AppConfig에서 등록한 URL로 접근하면 특정 인터셉터가 낚아채서**
**세션 또는 토큰을 통해서 인증하는 형식입니다.**

**사용되는 클래스 부터 정리하고, 클래스별로 확인한다면 눈에 잘 들어오지 않기 때문에
따로 메소드 별로 분석해보겠습니다.**

#### 아래와 같이 AppConfig가 존재합니다.

```
@Configuration
public class AuthConfig implements WebMvcConfigurer {
    private final CustomUserDetailsService userDetailsService;
 private final JwtTokenProvider jwtTokenProvider;

 public AuthConfig(CustomUserDetailsService userDetailsService, JwtTokenProvider jwtTokenProvider) {
        this.userDetailsService = userDetailsService;
 this.jwtTokenProvider = jwtTokenProvider;
  }

    @Override
  public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new SessionAuthenticationInterceptor(userDetailsService)).addPathPatterns("/login/session");
  registry.addInterceptor(new TokenAuthenticationInterceptor(userDetailsService, jwtTokenProvider, new ObjectMapper())).addPathPatterns("/login/token");
  registry.addInterceptor(new SessionSecurityContextPersistenceInterceptor());
  registry.addInterceptor(new TokenSecurityContextPersistenceInterceptor(jwtTokenProvider));
  }

    @Override
  public void addArgumentResolvers(List argumentResolvers) {
        argumentResolvers.add(new AuthenticationPrincipalArgumentResolver());
  }
}
```

#### 아래와 같이 TokenSecurityContextPersistenceInterceptor 가 존재합니다.

```
public class TokenAuthenticationInterceptor implements HandlerInterceptor {

    private final CustomUserDetailsService customUserDetailsService;
 private final JwtTokenProvider jwtTokenProvider;
 private final ObjectMapper objectMapper;

 public TokenAuthenticationInterceptor(CustomUserDetailsService customUserDetailsService
            , JwtTokenProvider jwtTokenProvider, ObjectMapper objectMapper) {
        this.customUserDetailsService = customUserDetailsService;
 this.jwtTokenProvider = jwtTokenProvider;
 this.objectMapper = objectMapper;
  }

    @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws IOException {
        AuthenticationToken authenticationToken = convert(request);
  Authentication authentication = authenticate(authenticationToken);

  String payload = objectMapper.writeValueAsString(authentication.getPrincipal());
  TokenResponse tokenResponse = new TokenResponse(jwtTokenProvider.createToken(payload));

  String responseToClient = objectMapper.writeValueAsString(tokenResponse);
  response.setStatus(HttpServletResponse.SC_OK);
  response.setContentType(MediaType.APPLICATION_JSON_VALUE);
  response.getOutputStream().print(responseToClient);
 return false;  }

    public AuthenticationToken convert(HttpServletRequest request) throws IOException {
        TokenRequest tokenRequest = objectMapper.readValue(request.getInputStream(), TokenRequest.class);

  String principal = tokenRequest.getEmail();
  String credentials = tokenRequest.getPassword();
 return new AuthenticationToken(principal, credentials);
  }

    public Authentication authenticate(AuthenticationToken authenticationToken) {
        String principal = authenticationToken.getPrincipal();
  LoginMember principalDetails = customUserDetailsService.loadUserByUsername(principal);
 return new Authentication(principalDetails);
  }
}
```

#### 비슷하게 아래와 같이 SessionAuthenticationInterceptor가 존재합니다.

```
public class SessionAuthenticationInterceptor implements HandlerInterceptor {
    public static final String USERNAME_FIELD = "username";
 public static final String PASSWORD_FIELD = "password";

 private final CustomUserDetailsService userDetailsService;

 public SessionAuthenticationInterceptor(CustomUserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
  }

    @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        AuthenticationToken token = convert(request);
  Authentication authentication = authenticate(token);

  HttpSession httpSession = request.getSession();
  httpSession.setAttribute(SPRING_SECURITY_CONTEXT_KEY, new SecurityContext(authentication));
  response.setStatus(HttpServletResponse.SC_OK);
 return false;  }

    public AuthenticationToken convert(HttpServletRequest request) {
        Map<String, String[]> paramMap = request.getParameterMap();
  String principal = paramMap.get(USERNAME_FIELD)[0];
  String credentials = paramMap.get(PASSWORD_FIELD)[0];

 return new AuthenticationToken(principal, credentials);
  }

    public Authentication authenticate(AuthenticationToken token) {
        String principal = token.getPrincipal();
  LoginMember userDetails = userDetailsService.loadUserByUsername(principal);
  checkAuthentication(userDetails, token);

 return new Authentication(userDetails);
  }

    private void checkAuthentication(LoginMember userDetails, AuthenticationToken token) {
        if (userDetails == null) {
            throw new AuthenticationException();
  }

        if (!userDetails.checkPassword(token.getCredentials())) {
            throw new AuthenticationException();
  }
    }
}
```

차례대로 자세히 적어보면, AppConfig에서 아래 생성자를 통해서 CustomUserDetailsService와 JwtTokenProvider를 입력받습니다.

```
public AuthConfig(CustomUserDetailsService userDetailsService, JwtTokenProvider jwtTokenProvider) {
    this.userDetailsService = userDetailsService;
 this.jwtTokenProvider = jwtTokenProvider;
}
```

**그리고 아래와 같이 특정 URI에 인터셉터를 설정해서 /login/session으로 접근하면 session 인터셉터가, /login/token으로 접근하면 /login/token 인터셉터가 인증 과정을 처리하도록 위임해줍니다.**

```
@Override
public void addInterceptors(InterceptorRegistry registry) {
    registry.addInterceptor(new SessionAuthenticationInterceptor(userDetailsService)).addPathPatterns("/login/session");
  registry.addInterceptor(new TokenAuthenticationInterceptor(userDetailsService, jwtTokenProvider, new ObjectMapper())).addPathPatterns("/login/token");
  registry.addInterceptor(new SessionSecurityContextPersistenceInterceptor());
  registry.addInterceptor(new TokenSecurityContextPersistenceInterceptor(jwtTokenProvider));
}
```

다시 SessionAuthenticationInterceptor에 대해서 살펴보면

```
public static final String USERNAME_FIELD = "username";
public static final String PASSWORD_FIELD = "password";
```

에서 유저네임과 패스워드를 설정해줍니다.
그 뒤에 preHandle을 통해서 컨트롤러 통과이전에 인증과정을 진행하는데, 아래의 코드를 통해서 유저가 입력한 아이디 패스워드를 통해서 AuthenticationToken을 만듭니다.

```
public AuthenticationToken convert(HttpServletRequest request) {
    Map<String, String[]> paramMap = request.getParameterMap();
  String principal = paramMap.get(USERNAME_FIELD)[0];
  String credentials = paramMap.get(PASSWORD_FIELD)[0];

 return new AuthenticationToken(principal, credentials);
}
```

그 다음 AuthenticationToken을 통해서 디비에 저장된 데이터로 유저객체를 만들고, 실제 인증에 사용될 인증 객체인 Authentication을 만듭니다. 이때 userDetailsService의 loadUserByUsername메소드로 디비에 저장된 유저의 정보와 클라이언트가 보낸 정보가 일치하는지 과정을 거칩니다.

```
public Authentication authenticate(AuthenticationToken token) {
    String principal = token.getPrincipal();
  LoginMember userDetails = userDetailsService.loadUserByUsername(principal);
  checkAuthentication(userDetails, token);

 return new Authentication(userDetails);
}
```

```
@Service
public class CustomUserDetailsService {
    private final MemberRepository memberRepository;

 public CustomUserDetailsService(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
  }

    public LoginMember loadUserByUsername(String email) {
        Member member = memberRepository.findByEmail(email).orElseThrow(RuntimeException::new);
 return LoginMember.of(member);
  }
}
```

**그 다음은 토큰을 통한 인증 방법입니다.**

아래와 같이 생성자로 만들어줍니다

```
public TokenAuthenticationInterceptor(CustomUserDetailsService customUserDetailsService
        , JwtTokenProvider jwtTokenProvider, ObjectMapper objectMapper) {
    this.customUserDetailsService = customUserDetailsService;
 this.jwtTokenProvider = jwtTokenProvider;
 this.objectMapper = objectMapper;
}
```

그리고 똑같이 preHandle로 컨트롤러 통과 이전에 인증과정을 처리해줍니다.

convert와 authenticate 메소드도 마찬가지로 구현 내용은 다르지만 위에서 설명한 session인터셉터와
같은 용도로 존재합니다.

convert 메소드는 request를 통해서 유저의 아이디와 비밀번호를 비교하고 AuthenticationToken을 만듭니다.

이를 통해서 authenticate 다시 인증객체인 Authentication 를 만듭니다.

그 다음 JwtTokenProvider로 jwt 토큰을 만들어서 response에 담아서 보내줍니다.

```
@Override
public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws IOException {
    AuthenticationToken authenticationToken = convert(request);
  Authentication authentication = authenticate(authenticationToken);

  String payload = objectMapper.writeValueAsString(authentication.getPrincipal());
  TokenResponse tokenResponse = new TokenResponse(jwtTokenProvider.createToken(payload));

  String responseToClient = objectMapper.writeValueAsString(tokenResponse);
  response.setStatus(HttpServletResponse.SC_OK);
  response.setContentType(MediaType.APPLICATION_JSON_VALUE);
  response.getOutputStream().print(responseToClient);
 return false;}
```

```
public AuthenticationToken convert(HttpServletRequest request) throws IOException {
    TokenRequest tokenRequest = objectMapper.readValue(request.getInputStream(), TokenRequest.class);

  String principal = tokenRequest.getEmail();
  String credentials = tokenRequest.getPassword();
 return new AuthenticationToken(principal, credentials);
}

public Authentication authenticate(AuthenticationToken authenticationToken) {
    String principal = authenticationToken.getPrincipal();
  LoginMember principalDetails = customUserDetailsService.loadUserByUsername(principal);
 return new Authentication(principalDetails);
}
```

---

# 추상화 시작

## 1. convert 추상화

**위의 코드에서 문제점을 찾아보면 convert, authenticate, prehandle method가 공통적으로 사용되고 있다는 점 입니다.**

**우선 convert 기능은 interceptor 에서 class 분리가 필요하다고 생각했습니다.**

**아래와 같이 인터페이스를 만들고 구현체들을 각각 만들었습니다.**

```
public interface AuthenticationConverter {
   AuthenticationToken convert(HttpServletRequest request) throws IOException;
}
```

@Component 으로 스프링 IOC 컨테이너가 관리하면서 주입할 수 있도록 설정해줬습니다.

```
@Component
public class SessionAuthenticationConverter implements AuthenticationConverter {

   @Override
  public AuthenticationToken convert(HttpServletRequest request) throws IOException {
      Map<String, String[]> paramMap = request.getParameterMap();
  String principal = paramMap.get(USERNAME_FIELD)[0];
  String credentials = paramMap.get(PASSWORD_FIELD)[0];

 return new AuthenticationToken(principal, credentials);
  }
}
```

```
@Component
public class TokenAuthenticationConverter implements AuthenticationConverter {
   public TokenAuthenticationConverter() {
   }

   @Override
  public AuthenticationToken convert(HttpServletRequest request) throws IOException {
      ObjectMapper objectMapper = new ObjectMapper();
  TokenRequest tokenRequest = objectMapper.readValue(request.getInputStream(), TokenRequest.class);
  String principal = tokenRequest.getEmail();
  String credentials = tokenRequest.getPassword();
 return new AuthenticationToken(principal, credentials);
  }
}
```

**그리고 세션과 토큰 인터셉터 클래스들이 인터페이스 타입의 컨버터를 주입 받도록 만들어서, 커플링을 약하게 강제했습니다.**

```
   public TokenAuthenticationInterceptor(AuthenticationConverter authenticationConverter,
  UserDetailsService userDetailsService
   , JwtTokenProvider jwtTokenProvider) {
   super(authenticationConverter, userDetailsService);
 this.jwtTokenProvider = jwtTokenProvider;
}
```

```
public SessionAuthenticationInterceptor(SessionAuthenticationConverter sessionAuthenticationConverter,
  UserDetailsService userDetailsService) {
   super(sessionAuthenticationConverter, userDetailsService);
}
```

## 2. CustomUserDetails 추상화

**현재 Auth와 관련된 구성들과 CustomUserDetails는 강한 의존성을 갖고 있습니다.**

**📌인증과정에서 CustomUserDetails 의 loadByUsername 메소드를 통해서 디비의 값과 클라이언트의 요청값을 비교해서 인증하기 때문입니다.**

**CustomUserDetails를 UserDetailsService를 상속받도록 만들고 UserDetailsService 타입으로 객체에게 메세지를 보내는식으로 변경해서 의존성을 줄여줍니다.**

**이제 아래와 같이 Session과 Token interceptor는 UserDetailsService를 생성자로 받기 때문에 CustomUserDetails에 대해서는 알지 못합니다.**

그 결과 느슨해진 커플링으로 App config에서 의존성을 주입할 때 UserDetailsService의 원하는 구현체들을 주입해주면 됩니다.

```
AuthenticationInterceptor(AuthenticationConverter authenticationConverter, UserDetailsService userDetailsService) {
   this.authenticationConverter = authenticationConverter;
 this.userDetailsService = userDetailsService;
}
```

## 3. AuthenticationInterceptor 추상화

**다음으로는 prehandle과 authenticate 과정을 추상화했습니다.**

**Session과 Token interceptor는 각각 prehandle과 authenticate 메소드를 가지고 있지만 내부 동작과정은 조금씩 다릅니다.**

### 📌여기에서 추상화의 진정한 강점이 들어났다고 생각했습니다.

**두 메소드의 공통된 부분만 추상화 해서 묶으면 나중에 새로운 인증 방식을 도입한다고 해도 뼈대 코드는 그대로 두고, 구현체 부분만 수정해주면 됩니다. 리팩토링에 큰 장점이 생깁니다.**

**아래에서 이를 구현했습니다.**

**세션과 토큰의 interceptor의 부모 클래스인 AuthenticationInterceptor를 만들어줬습니다.**

**그 다음 아래와 같은 추상화 메소드를 만들어 주고 Session과 Token interceptor 들은 각각 이를 구현했습니다.**

```
public abstract void afterAuthentication(HttpServletRequest request, HttpServletResponse response,
  Authentication authentication) throws IOException;
```

**아래부터 차례대로 session interceptor와 token interceptor 구현체입니다.**

```
public class SessionAuthenticationInterceptor extends AuthenticationInterceptor {
   public static final String USERNAME_FIELD = "username";
 public static final String PASSWORD_FIELD = "password";

 public SessionAuthenticationInterceptor(SessionAuthenticationConverter sessionAuthenticationConverter,
  UserDetailsService userDetailsService) {
      super(sessionAuthenticationConverter, userDetailsService);
  }

   @Override
  public void afterAuthentication(HttpServletRequest request, HttpServletResponse response,
  Authentication authentication) throws IOException {
      HttpSession httpSession = request.getSession();
  httpSession.setAttribute(SPRING_SECURITY_CONTEXT_KEY, new SecurityContext(authentication));
  response.setStatus(HttpServletResponse.SC_OK);
  }
}
```

```
public class TokenAuthenticationInterceptor extends AuthenticationInterceptor {

   private final JwtTokenProvider jwtTokenProvider;

 public TokenAuthenticationInterceptor(AuthenticationConverter authenticationConverter,
  UserDetailsService userDetailsService
      , JwtTokenProvider jwtTokenProvider) {
      super(authenticationConverter, userDetailsService);
 this.jwtTokenProvider = jwtTokenProvider;
  }

   @Override
  public void afterAuthentication(HttpServletRequest request, HttpServletResponse response,
  Authentication authentication) throws IOException {
      ObjectMapper objectMapper = new ObjectMapper();
  String payload = objectMapper.writeValueAsString(authentication.getPrincipal());
  TokenResponse tokenResponse = new TokenResponse(jwtTokenProvider.createToken(payload));
  String responseToClient = objectMapper.writeValueAsString(tokenResponse);
  response.setStatus(HttpServletResponse.SC_OK);
  response.setContentType(MediaType.APPLICATION_JSON_VALUE);
  response.getOutputStream().print(responseToClient);
  }
}
```

**📌그리고 필요한 나머지 prehandle, convert, authenticate 는 부모 클래스에서 구성해줬습니다.**

```
public abstract class AuthenticationInterceptor implements HandlerInterceptor {
   private final AuthenticationConverter authenticationConverter;
 private final UserDetailsService userDetailsService;

  AuthenticationInterceptor(AuthenticationConverter authenticationConverter, UserDetailsService userDetailsService) {
      this.authenticationConverter = authenticationConverter;
 this.userDetailsService = userDetailsService;
  }

   public AuthenticationToken convert(HttpServletRequest request) throws IOException {
      return authenticationConverter.convert(request);
  }

   @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
  Object handler) throws IOException {
      AuthenticationToken token = convert(request);
  Authentication authentication = authenticate(token);
  afterAuthentication(request, response, authentication);
 return false;  }

   public Authentication authenticate(AuthenticationToken token) {
      String principal = token.getPrincipal();
  UserDetails userDetails = userDetailsService.loadUserByUsername(principal);
  checkAuthentication(userDetails, token);
 return new Authentication(userDetails);
  }

   public abstract void afterAuthentication(HttpServletRequest request, HttpServletResponse response,
  Authentication authentication) throws IOException;

 private void checkAuthentication(UserDetails userDetails, AuthenticationToken token) {
      if (userDetails == null) {
         throw new AuthenticationException();
  }
      if (!userDetails.checkPassword(token.getCredentials())) {
         throw new AuthenticationException();
  }
   }
}
```

---

## 정리

**📌 추상화를 통해서 얻을 수 있는 장점**

1. 리팩토링에 용이하다. 뼈대 코드는 건들이지 않고 리팩토링이 가능하다.
2. DI가 가능하다. 생성자로 추상클래스를 받도록 만들고 자식클래스를 주입하면 된다.

---

**참고자료**

[ATDD 관련 코드](https://github.com/mj950425/atdd-subway-favorite)
[# [우아한테크세미나] 190620 우아한객체지향 by 우아한형제들 개발실장 조영호님](https://www.youtube.com/watch?t=2941&v=dJ5C4qRqAgA&feature=youtu.be)
