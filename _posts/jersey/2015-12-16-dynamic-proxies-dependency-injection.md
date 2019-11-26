---
layout: post
title: "Dynamic Proxies and Dependency Injection"
description: "How dynamic proxies work in Java and how they can be used with dependency injection."
categories: jersey
category: jersey
featured: true
thumb: "paul-samsotha-donald-duck"
tags: java
---

In this article, I will discuss how dynamic proxies work in the Java platform and how dependency injection takes advantage of this Java feature. This writing is derived from my search to try and inject request scope objects into singleton objects, within the HK2 framework (or more precisely, HK2 within a Jersey application). I was going to include my findings all into one blog, but I felt this topic is too broad for a problem that is solved in two lines of code.

First, I will go through a quick discussion about the Proxy Pattern, then show how to use dynamic proxies with the Java language, then finally go through an example using dynamic proxies and custom dependency injection.

### Table of Contents:

* [Proxy Pattern](#proxyPattern)
* [Java Dynamic Proxies](#dynamicProxies)
* [Dynamic Proxy and Custom Injection Example](#example)
* [Summary](#summary)


{% include ads/in-article-ad.html %}


<a name="proxyPattern"></a>

## Proxy Pattern

I won't get into too much detail about the proxy pattern. There is good reading all over the internet. I will just give a brief analogy, along with some brief code example of the pattern.

I'm sure most of you have heard the phrase "vote by proxy". It's when someone places a vote for someone else. For example say there is some arbitrary vote among board members of a corporation. Member B is sick in the hospital, so can't attend the board meeting. So member B signs over a proxy vote to member A. So during the vote meeting, member A places member B's vote for them. Member A is just acting as a delegate for member B.

The proxy pattern works the same. Here is a class diagram ([from wikipedia][2]).

![Proxy Pattern Diagram][1]

Say `Member` is the interface

```java
public interface Member {
   void vote();
}
```

Then you have `MemberA` and `MemberB`

```java
public class MemberA implements Member {
    public void vote() {}
}

public class MemberB implements Member {
    public void vote() {}
}
```

Since member B will not be present, we need a proxy for it. The proxy should also implement the `Member` interface and it should hold a reference to `MemberB`.

```java
public class MemberBProxy implements Member {
    private MemberB memberB;

    public void vote {
        memberB.vote();
    }
}
```

So now `MemberA` can get a the member B proxy and make the proxy vote for member B.

This might not be the greatest example, as the proxy does nothing but call the vote on member B. But with real proxies, there is usually something else going on under the hood. For example in the case of remote proxies, the `vote()` method might actually make a network call to a remote `MemberB`. An example of this in the Java platform, would be RMI (remote method invocation). The example later will describe another use case, that is usually handled transparently for the developer.

[1]: https://www.dropbox.com/s/oe4g600n80rsb05/proxy-pattern-diagram.png?dl=1
[2]: https://en.wikipedia.org/wiki/Proxy_pattern

<a name="dynamicProxies"></a>

## Dynamic Proxies

With the example above, we had to manually write the proxy class. In Java though, this is not required, with the introduction of dynamic proxies in 1.3. The core interface to dynamic proxies is [`java.lang.reflect.Proxy`][3]. To use it, we require to components, our interface to proxy, and an [`InvocationHandler`][4]. Let's look at a quick example, using the same above analogy.

```java
Member memberBProxy = (Memeber) Proxy.newProxyInstance(
        Memeber.class.getClassLoader(),
        new Class[] { Member.class },
        new InvocationHandler() {
            @Override
            public Object invoke(Object proxy, Method method, Object[] args) {
                return method.invoke(new MemberB(), args);
            }
        }
);
```

That's it. Now `memberBProxy` is a `Proxy` instance, not a `MemberB` instance. If you print out the class name of the `Member` object, you will actually see that the class name is `com.sun.proxy.ProxyX`, and not `MemberB`.

Let's walk through it real quick. Here's is the signature for `Proxy#newProxyInstance`

```java
newProxyInstance(ClassLoader loader, Class<?>[] interfaces, InvocationHandler h)
```

It first requires the `ClassLoader` for which to define proxy. Second it requires to interfaces to implements, then finally the `InvocationHandler`. The `InvocationHandler` has only a single _callback_ method we need to implement

```java
Object invoke(Object proxy, Method method, Object[] args)
```

The first argument is the actual proxy object. You should rarely have use for this. The second argument is the `java.lang.reflect.Method`. If you've had any experience with Java reflection, you should be familiar with the interface. With the `Method`, we can invoke a method call by passing the object for which to invoke the method on, along with any arguments, hence the last line

```java
return method.invoke(new MemberB(), args);
```

Here the proxy hands the `Method` and the arguments passed to the method call on the proxy. We as the `InvocationHandler` implementer, can do whatever we want with the `Method` and method arguments. Here we are simply say that the called method should be invoked in the `new MemberB()` object, passing in the arguments. 

To get a clearer picture, just look at it like the `Proxy` instance has all the methods the `Member` interface has. So when we call `Proxy#vote()`, it calls the `InvocationHandler#invoke` passing in itself, the `Method`, and the arguments passed to `vote()` (if any). And out `InvocationHandler` implementation simply _call_ the method, by calling `inovoke` on the `Method` object. the `Method` object then invokes the `vote()` on the actual `MemberB` object.

And that's it. As you can see, dynamic proxies are fairly simple to implements.

[3]: https://docs.oracle.com/javase/8/docs/api/java/lang/reflect/Proxy.html
[4]: https://docs.oracle.com/javase/8/docs/api/java/lang/reflect/InvocationHandler.html

<a name="example"></a>

{% include ads/post-in-article-banner-1.html %}

## Dynamic Proxy and Custom Injection Example

* Get the [GitHub project][10]

[10]: https://github.com/psamsotha/dynamic-proxies-example

What I will attempt to do here is try to explain how dynamic proxies are used in a dependency injection framework. One of the main use cases for dynamic proxies within DI, is when dealing with scopes. For instance you have a service or a controller that is in a singleton scope, meaning that there is only one create per application. That singleton service is dependent on a server this is in a request scope, meaning that one should be created for each request. The classes might look something like (it's all imaginary - no specific framework).

```java
@Controller(scope = "singleton")
public class AppController {
    @Inject
    SingletonService service;
}

@Singleton
public class SingletonService {
    @Inject
    RequestScopedService service;
}

@RequestScoped
public class RequestScopedService {}
```

The problem here is that when the `SingletonService` is created on start-up, all the injections need to be performed. But there is no request on start-up, so there should be no `RequestScopedService` currently tied to a request. Another problem is how do we managed which request gets which `RequestScopedService`. Maybe we can add a setter in the `SingletonService` where we can set a new `RequestScopedService` for each request. But that doesn't work, because the `SingletonService` will be accessed concurrently, as is how some servers work (a thread per request).

This is where dynamic proxies come to the rescue. When the `SingletonService` is created on start up, instead of injection an actual `RequestScopedService`, we will inject a `Proxy` of the service. When calls are made on the `RequestScopedService` from inside the `SingletonService`, the call will actually be made on the `Proxy`, which will delegate the call to the `InvocationHandler#invoke` method, which we will implement to call a `RequestScopedService` that we obtain from a `ThreadLocal`. A new `RequestScopedService` will be set in the `ThreadLocal` every time a request is processed, which will be handled in a separate thread. If you have ever heard the term "thread local proxy", this is pretty much the gist of how it works.

So let's try and implement all this. We will even implement our own dependency injection. We will implement a simple server framework, that allows a user to implement a custom `RequestHandler` that can inject our `SingletonService` which will in turn be dependent on a `RequestScopedService`. Here is the class diagram. (To follow along, it's best to grab the GitHub project from the above link). 

![Server Class Diagram][5]

As stated earlier, the user will be able to implement a custom `RequestHandler` and inject our `SingletonService`. In the project, there is default implementation that just returns the message from the `SingletonService`, as a `Response`

```java
public class DefaultRequestHandler implements RequestHandler {
    
    @Inject
    private SingletonService singletonService;

    @Override
    public Response handleRequest(Request request) {
        return new Response(singletonService.getMessage());
    }  
}
```

Then the user creates the `Server` passing the implementation class to the constructor

```java
Server server = new Server(DefaultRequestHandler.class);
```

In the server constructor, you will see a couple things, the validation of the user defined `RequestHandler` class, and the creation of the `SingletonService`. Validation is not important here, and here is the creation of the `SingletonService`.

```java
private static SingletonService initSingletonService() {
    Service proxyService = (Service) Proxy.newProxyInstance(
            Service.class.getClassLoader(), new Class[]{Service.class},
            new ServiceInvocationHandler());
    return new SingletonService(proxyService);
}
```

The first thing we do is create the proxy of the `Service` class. Here is the `ServiceInvocationHandler`

```java
public class ServiceInvocationHandler implements InvocationHandler {

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) .. {
        Service service = ThreadLocalService.get();
        return method.invoke(service, args);
    }
}
```

It doesn't do much. It just retrieves the `Service` from the `ThreadLocalService`, and invokes the proxied method on the service. We will see a bit later when the instance of the `RequestScopedService` is set into the `ThreadLocal`.

Then the `SingletonService` is created with the proxy `Service`. So now, when `SingletonService` calls a method on the `Service`, the proxy will lookup the thread local `Service` and delegate the call to _its_ methods.

That's it for the server bootstrap. Now we can get into the runtime and request processing. Here is the sequence diagram from the request processing flow.

![Server Sequence Diagram][6]

First the `Main` program calls `Server#sendRequest(Request)` passing in a new `Request` object. A `Request` object has nothing more than the name of the client. 

when we call `sendRequest` on the `Server`, all it does it add the `Request` to the `BlockingQueue`.

```java
public void sendRequest(Request request) {
    try {
        requests.put(request);
    } catch (InterruptedException ex) {
        throw new RuntimeException(ex);
    }
}
```

When the server is started, it constantly polls the `BlockingQueue`, waiting for a new `Request`

```java
public void startServer() {
    executors.submit(new Runnable() {
        @Override
        public void run() {
            while (true) {
                try {
                    Request request = requests.take();
                    if (request.isShutdownTrigger()) {
                        break;
                    }
                    executors.submit(new RequestProcessor(userDefineHandler,
                                                          singletonService,
                                                          request));
                } catch (InterruptedException ex) {
                    throw new RuntimeException(ex);
                }
            }
            System.out.println("Server shutdown!");
        }
    });  
}
```

When a `Request` is received, the `Server` creates a new `RequestProcessor`, passing in the `Request` object, the `SingletonService` object, and the use defined `RequestHandler` class. If you look at the `run()` method of the `RequestProcessor`, you will see the following

```java
private void setThreadLocalService() {
    ThreadLocalService.set(new RequestScopedService(request));
}

@Override
public void run() {
    setThreadLocalService();
    RequestHandler handler = initInjections();
    Response response = handler.handleRequest(request);
    System.out.println(response.getMessage());
}
```

So the first thing the processor does is set the `RequestScopedService` into the `ThreadLocalService`. Then the `RequestHandler` is instantiated, using some reflection, as seen in the `initInjections()` method

```java
RequestHandler initInjections() {
    try {
        for (Field field : handlerCls.getDeclaredFields()) {
            if (field.isAnnotationPresent(Inject.class)
                    && field.getType() == SingletonService.class) {
                return createHandler(field, handlerCls);
            }
        }

        Constructor[] cons = handlerCls.getConstructors();
        for (Constructor con : cons) {
            if (con.isAnnotationPresent(Inject.class)
                    && con.getParameterCount() == 1
                    && con.getParameterTypes()[0] == SingletonService.class) {
                return (RequestHandler) con.newInstance(singletonService);
            }
        }
    } catch (Exception ex) {
        throw new RuntimeException(ex);
    }
    throw new RuntimeException("RequestHandler could not be created.");
}
```

The method simply checks to see if we should be doing field injection or constructor injection. It makes sure the field or constructor in annotated with `@Inject`. If the field is annotated, and the field type is `SingletonService`, we will set the field with the `SingletonService`, using reflection. Similar events occur to process constructor injection.

The last thing the `RequestHander` does is simply call the `handleRequest`of the `RequestHandler`, which returns a `Response`, then the processor prints the `Response` message. And that's it for the processing of a single request.

If you run the `Main` class, you should see something similar to the following

```
Message: Hello Kobe
  meta-info:
    service class: com.sun.proxy.$Proxy2
    service id: 1
    thread name: pool-1-thread-2

Message: Hello Lebron
  meta-info:
    service class: com.sun.proxy.$Proxy2
    service id: 2
    thread name: pool-1-thread-3

... three more
```

The first thing that you should notice is that the service class is indeed the `Proxy` instance, and not the `RequestScopedService`. The underlying will `RequestScopedService` will remain the same as long as the request is being processed. So all made on the `Service` inside the `SingletonService` will always be delegated to actual `RequestScopedService` associated with a particular thread.

And that's it.

<a name="summary"></a>

## Summary

We covered some basics on the Proxy Pattern, and saw how it uses a wrapper or delegation model to make calls to an underlying object. Then we covered dynamic proxies, and how it is implemented in the Java language. The finally we went through an example of how dynamic proxies work with scoped dependency injection. If an object in a lesser scope needs to be injected in to an object in a wider scope, the lesser scope object needs to be proxied, so that different thread have access to their own lesser scoped object instance. 

The example is far from some thing you'd use in real life, but I hope it gives you a better understanding of what goes on under the hood with regards to the combination of the two subject matters we discussed, dynamic proxies and dependency injection.


[5]: https://www.dropbox.com/s/hq6honttl0ibf64/server-class-diagram.jpg?dl=1
[6]: https://www.dropbox.com/s/oohqrhj05r6u8ch/server-sequence.jpg?dl=1

