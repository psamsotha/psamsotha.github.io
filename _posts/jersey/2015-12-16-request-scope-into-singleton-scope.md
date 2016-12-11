---
layout: post
title: "Request Scoped Injection into a Singleton with and Jersey"
description: "How we can inject request scoped objects into singleton objects when using Jersey2 and its DI framework HK2"
categories: jersey
featured: true
thumb: "bus-stop"
tags: jersey jersey-2.0 dependency-injection hk2
---


I had a problem recently where I was trying to inject a request scoped service into a singleton object. This article will briefly go through my findings.

Say for instance you have something like

```java
@Provider
public class SomeFilter implements ContainerRequestFilter {
    
    @Inject
    private RequestScopedService service;
}

public class AppBinder extends AbstractBinder {
    @Override
    protected void configure() {
        bindFactory(RequestScopedServiceFactory.class)
                .to(RequestScopedService.class)
                .in(RequestScoped.class);
    }
}
```

The problem with this is that `SomeFilter` is created on startup, and there is only one single instance for the entire application. So the injection fails, as it should, as there is no request and so no request to bind the request scoped service to. So the application doesn't start.

My normal fix would have need to inject the service as a [`javax.inject.Provider<T>`][1] instead. This allows me to lazily retrieve the service, which will actually be a proxy.

```java
@Provider
public class SomeFilter implements ContainerRequestFilter {
    
    @Inject
    private javax.inject.Provider<RequestScopedService> serviceProvider;

      @Override
      public void filter(ContainerRequestContext context) {
          RequestScopedService serivce = serviceProvider.get();
      }
}
```

But I don't like this. It may be fine for my application, but my problem actually involved creating a framework feature, where I wanted the user to be able to inject the service transparently, without the need to have to worry about scopes, `javax.inject.Provider`s, and such. 

Now have a look at this

```java
@Provider
public class SomeFilter implements ContainerRequestFilter {
    
      @Context
      private HttpServletRequest request; 

      @Context
      private UriInfo uriInfo;
 
      @Context
      private SecurityContext securityContext;
}
```

All three of those injected objects are inherently request scoped, but this doesn't fail on start up. Everything works fine as expected. So how does it work? It works through the use of Java's dynamic proxies. If you are unfamiliar with the concept, [this article][2] should help get you up to speed.

With dynamic proxies, you are not actually working with the injected instance, but actually a proxy wrapping access to the current request scoped instance. If you print out/log any of the above injected objects' class names, you will see the it is actually an instance of `com.sun.proxy.ProxyX`, rather than an instance  of the actual advertised types. 

In order for the framework to inject a proxy, we need to make sure the type is proxiable. With HK2, this is simple. We do not need to create our own proxy or create an `InvocationHandler`s. It is simply a matter of making a one or to chained method calls in our binding of the `RequestScopedService`

```java
@Override
protected void configure() {
    bindFactory(RequestScopedServiceFactory.class)
            .proxy(true)
            .proxyForSameScope(false)
            .to(RequestScopedService.class)
            .in(RequestScoped.class);
}
```

The `proxy` method makes the object proxiable. That is the least we need to make this work. With just that one method call, we get dynamic proxies for free, and the injection should now work. The second call to `proxyForSameScope` is set to false. This means that if an object, say a resource object is in the same request scope, the actual instance should be injected instead of the proxy. This is actually how the three objects injected above works also. You will see that in a request scope, they are the actual objects, but in singletons, they are proxies.

* A complete example can be found in [this Gist][3]

### Bonus (Warning!)

One thing I discovered while testing things out is that when using `@Singleton` on a resource class, you would expect the request scoped injection (without proxying) to fail on start up, as it would trying to inject into the filter

```java
@Singleton
@Path("resource")
public class SingletonResource {

    @Inject
    private RequestScopedService service;
}
```
 
But surprisingly, this does not fail. But what's worse is that it is injected only once. What you were expecting to change per request will stay the same. The reason is that `@Singleton` resources are not created until the first request. So there actually is a request scope during injection. So any request sensitive information is injected with the service only once. Now all subsequent request will see all the first request's context sensitive information.

Yes, I think this is a huge bug. I will probably file JIRA issue. But in the mean time, I strongly suggest staying away from the `@Singleton` annotation. If you want a singleton, just register the instance in your `ResourceConfig`

```java
public class AppConfig extends ResourceConfig {
    public AppConfig() {
        register(new SingletonResource());
    }
}
```

On start up, Jersey will try to inject the resource, and will fail as expected, as there is not request scope. 

[1]: https://docs.oracle.com/javaee/7/api/javax/inject/Provider.html

[2]: {{ site.baseurl }}{% link _posts/jersey/2015-12-16-dynamic-proxies-dependency-injection.md %}

[3]: https://gist.github.com/psamsotha/fd77d9bf9f5362453ac0f8bad9fdd751