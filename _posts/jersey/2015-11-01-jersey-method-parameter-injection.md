---
layout: post
title: "Custom Method Parameter Injection with Jersey"
description: "How we can use custom annotation injection for method parameters of our resource methods in Jersey."
categories: jersey
category: jersey
thumb: self-park
tags: jersey jersey-2.0
---

In this article I will explain how to handle custom method parameter injection with Jersey 2. I will first go through some "non-custom" injections that work, then go through some custom injections that _don't_ work, then finally go through how to make them work.

This article assumes you have _some_ working knowledge of dependency injection with Jersey, which is handle by it's underlying DI framework [HK2][1]. if you don't have any experience, you can still follow along, but it would probably make more sense to you if you first go through [Custom Injection and Lifecycle Management][2] from the Jersey user guide.

Let's start off with an example. I will use the concept of a tenant in the example, but in no way does the example try to implement any multi-tenant features. When I was trying to think of an example, the first thing that came to mind was a Stack Overflow question where the poster was having trouble with method parameter injection, and the domain of the question was about multi-tenancy. So the example kind of stuck in my head.

The code can be found [on GitHub as a single Gist file][3]. I didn't think it was necessary to create a complete project for this. The class is a JUnit test class using [Jersey Test Framework][4]. So just run it like any other JUnit test. There is only one Maven dependency to make it work, which is listed in the comments.

If you look at the file, you will see a lot of things commented out. This is on purpose. What I will do is start with a first example, and as we move along I will have you un-comment things to demonstrate something else.

So let's get started. We are going to start with a simple `Tenant` class, which we want to inject into a method parameter.

```java
public static class Tenant {
    public String name;
    public Tenant(String name) { this.name = name; }
}
```

The first example is a working example. We will inject the `Tenant` using the `@Context` annotation, which is known by Jersey. If you look at the first paragraph, this is what I mean by "non-custom" injection. Later we will try to use our own annotation, which is what I consider "custom" injection.

```java
@Path("with-context")
public static class WithContextNoOther {

    @GET
    public String get(@Context Tenant tenant) {
        return tenant.name;
    }
}
```

To make this work, we will use an HK2 `Factory` to create the `Tenant`

```java
public static class TenantFactory implements Factory<Tenant> {

    @Override
    public Tenant provide() { return new Tenant(TENANT_NAME); }

    @Override
    public void dispose(Tenant t) { }
}
```

Then we need to bind the factory to HK2 in a `AbstractBinder`, then register the binder with the `ResourceConfig`

```java
public static class TenantBinder extends AbstractBinder {
    @Override
    protected void configure() {
        bindFactory(TenantFactory.class).to(Tenant.class);
    }
}

@Override
public ResourceConfig configure() {
    return new ResourceConfig()
            .register(new TenantBinder())
            .register(WithContextNoOther.class)
            .register(DebugMapper.class);
}
```


If you run the test, you will see that it passes. 

```java
@Test
public void should_return_tenant_with_Context_injection() {
    Response response = target("with-context").request().get();
    assertEquals(200, response.getStatus());
    assertEquals(TENANT_NAME, response.readEntity(String.class));
}
```

The injection works fine as expected. Next we will add a another method parameter, which will be the entity body of the request. This is just so we have some context later on.

```java
@Path("with-context-and-entity")
public static class WithContextAndEntity {

    @POST
    public String post(@Context Tenant tenant, String body) {
        return tenant.name + ":" + body;
    }
}
```

To run the test on this endpoint, you should un-comment the configuration where I register the class

```java
@Override
public ResourceConfig configure() {
    return new ResourceConfig()
            .register(new TenantBinder())
            .register(WithContextNoOther.class)
            .register(WithContextAndEntity.class)
            .register(DebugMapper.class);
}
```

And un-comment the `@Test` method.

```java
@Test
public void should_return_tenant_with_Context_injection_and_entity() {
    Response response = target("with-context-and-entity").request()
            .post(Entity.text(MESSAGE_BODY));
    assertEquals(200, response.getStatus());
    assertEquals(NAME_AND_MESSAGE, response.readEntity(String.class));
}
```

You will see that this also passes. But now we want to inject with a custom annotation, say 

```java
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public static @interface TenantParam {}
```

If you've ever used a custom annotation or if you look at the Jersey user guide link I provided above, you will see that in order to use a custom annotation for injection, we need to provide our own `InjectionResolver`. Here is the implementation we will use for the example

```java
public static class TenantParamResolver implements InjectionResolver<TenantParam> {
    
    @Inject
    @Named(InjectionResolver.SYSTEM_RESOLVER_NAME)
    InjectionResolver<Inject> systemInjectionResolver;

    @Override
    public Object resolve(Injectee injectee, ServiceHandle<?> root) {
        if (Tenant.class == injectee.getRequiredType()) {
            return systemInjectionResolver.resolve(injectee, root);
        }
        return null;
    }

    @Override
    public boolean isConstructorParameterIndicator() { return false; }

    @Override
    public boolean isMethodParameterIndicator() { return false; }   
}
```

Then we will register the `InjectionResolver` in our `AbstractBinder`. Just un-comment the part in the `TenantBinder` where we register it

```java
public static class TenantBinder extends AbstractBinder {
    @Override
    protected void configure() {
        bindFactory(TenantFactory.class).to(Tenant.class);
        bind(TenantParamResolver.class)
                .to(new TypeLiteral<InjectionResolver<TenantParam>>(){})
                .in(Singleton.class);
    }
}
```

Here is the resource class/method we will use to test

```java
@Path("with-custom")
public static class WithCustomNoOther {

    @GET
    public String get(@TenantParam Tenant tenant) {
        return tenant.name;
    }
}
```

And un-comment the registration of the resource class, and also the `@Test` method for this test

```java
@Override
public ResourceConfig configure() {
    return new ResourceConfig()
            .register(new TenantBinder())
            .register(WithContextNoOther.class)
            .register(WithContextAndEntity.class)
            .register(WithCustomNoOther.class)
            .register(DebugMapper.class);
}

@Test
public void should_return_tenant_with_Custom_injection() {
    Response response = target("with-custom").request().get();
    assertEquals(200, response.getStatus());
    assertEquals(TENANT_NAME, response.readEntity(String.class));
}
```

When you run the test you will see two things. The first is that the test assertion fails, as it expects a 200 response, but we get a 500. Second, if you look at the log (or console), you will see that we logged a `NullPointerException` where we tried to call `tenant.name` in the resource method. This is because the injection failed, and the `Tenant` never got injected.

Now before we try to fix this, let's try out something else to see a different result. First comment back out the previous `@Test`. We don't care for it right now. Also comment out the registration of the `WithCustomNoOther.class`. What we will do here is use the `WithCustomAndEntity.class`. We will not test it though, we will only register it.

```java
@Path("with-custom-and-entity")
public static class WithCustomAndEntity {

    @POST
    public String post(@TenantParam Tenant tenant, String body) {
        return tenant.name + ":" + body;
    }
}

@Override
public ResourceConfig configure() {
    return new ResourceConfig()
            .register(new TenantBinder())
            .register(WithContextNoOther.class)
            .register(WithContextAndEntity.class)
            //.register(WithCustomNoOther.class)
            .register(WithCustomAndEntity.class)
            .register(DebugMapper.class);
}
```

So at this point, the only thing that should be changed from the previous successful test, is that we just registered the `WithCustomAndEntity.class`. We should still only have the previous successful `@Test` methods un-commented.

Now run the test and see what happens....

What the heck! Both tests fail, when previously they passed, and all we did was register a new resource class. Part of the error/exception reads

>org.glassfish.jersey.server.model.ModelValidationException: Validation of the application resource model has failed during application initialization

If you remember the previous failing test, hopefully you noticed that this is a completely different exception. The previous exception was a `NullPointerException`, meaning that the endpoint was actually being hit. This new exception actually caused the server to not even start. You will see that no requests were logged from our `LoggingFilter`. 

So what _is_ this `ModelValidationException`? Well anytime you create an object-oriented application, you want to carefully model your application domain. This way you can just process the domain objects. With this same concept in mind, Jersey models _its_ application domain, which consists of resources and resource methods, etc. Behind the scene, these concepts are modeled as [`Resource`][5] and [`ResourceMethod`][6], respectively.

On startup, Jersey validates these model components to make sure that they follow the rules, ensuring there are no unexpected problems at runtime related resource definitions. Part of the validation consists of making sure that all method parameters are injectable. When Jersey sees that something is not injectable, it will raise a flag and throw an exception, making sure we fix the problem.

When scanning the resource methods, Jersey introspects the method parameters looking to make sure that each parameter has a [`ValueFactoryProvider`][6] that can handle the injection. This is what the documentation fails to mention. The `InjectionResolver` is enough to handle field and constructor injection, but not for method parameter injection. The reason it works for `@Context` is that there is a `ValueFactoryProvider` that handle the `@Context` annotated parameters.

The reason we didn't get this exception on the first fail to 

```java
@GET
public String get(@TenantParam Tenant tenant) {
    return tenant.name;
}
```

is that we are allowed to have one method parameter as the entity body parameter. I'm sure you've noticed in your experience with Jersey, that when you want a method parameter to be the body, say a JSON-parsed-to-POJO body, you don't use an annotation (unless its for form or multipart). This is allowed for one method parameter. A request should only have one entity body, therefore only one entity parameter is allowed. There is even a [`EntityParamValueFactoryProvider`][8] to handle this one entity parameter. The reason we get the exception with  
```java
@POST
public String post(@TenantParam Tenant tenant, String body) {
    return tenant.name + ":" + body;
}
```

is that the `@TenantParam` is not recognized by the validator. So it thinks there may be two entity body parameters. It validates the `Tenant` just fine, but then it gets to the second parameter, which is also assumed to be and entity. So the exception points to the `String` parameter, and not the `Tenant` parameter. 

>No injection source found for a parameter of type public java.lang.String

So with all that being said, the fix here is to provide a `ValueFactoryProvider`. The main method is the `Factory<?> getValueFactory(Parameter)` method, which returns a `Factory`. In the method, we should check the `Parameter` argument to see if we can handle it. If not we just return null. What happens on startup is that all the `ValueFactoryProvider`s registered are traversed while trying to validate each parameter. If none of the providers return a `Factory` for the parameter, then a validation error is thrown. Since the `EntityParamValueFactoryProvider` can only handle one parameter for each resource method, the first method parameter get the provider, and the second doesn't, and the traversal returns null.

Here is the example `ValueFactoryProvider` we will use.

```java
public static class TenantParamValueProvider implements ValueFactoryProvider {

    @Override
    public Factory<?> getValueFactory(Parameter parameter) {
        if (parameter.getRawType() == Tenant.class
                && parameter.isAnnotationPresent(TenantParam.class)) {
            return new TenantFactory();
        }
        return null;
    }

    @Override
    public ValueFactoryProvider.PriorityType getPriority() {
        return Priority.NORMAL;
    }
}
```

Here's we just check that the parameter is of type `Tenant` and that it is annotated with `@TenantParam`. Any other parameter qualifications, we cannot handle and just return null. Now just un-comment the registration of this provider in the `TenantBinder`

```java
public static class TenantBinder extends AbstractBinder {
    @Override
    protected void configure() {
        bindFactory(TenantFactory.class).to(Tenant.class);
        bind(TenantParamResolver.class)
                .to(new TypeLiteral<InjectionResolver<TenantParam>>(){})
                .in(Singleton.class);
        bind(TenantParamValueProvider.class)
                .to(ValueFactoryProvider.class)
                .in(Singleton.class);
    }
}
```

Make sure all the resource classes are registered

```java
@Override
public ResourceConfig configure() {
    return new ResourceConfig()
            .register(new TenantBinder())
            .register(WithContextNoOther.class)
            .register(WithContextAndEntity.class)
            .register(WithCustomNoOther.class)
            .register(WithCustomAndEntity.class)
            .register(DebugMapper.class);
}
```

And un-comment all the `@Test` methods. There should be four in total. Then run the test... and Woo Hoo!. We passed.

If you look at the bottom of the test class, you will see a `TenantParamValueFactoryProvider`. This is a model I use for many of the param providers I create. I closely models how Jersey creates them. You can look in [this package][9] for some of the providers that handle such parameters like `@PathParam` and `@QueryParam`. 

In this implementation you will notice that the `TenantFactory`, instead of implementing `Factory`, it extends `AbstractContainerRequestValueFactory`. This is a convenience class that  gives us access the `ContainerRequest`, which is the context of the request. You can get a lot of information from it. Also instead of directly implementing `InjectionResolver`, we extend `ParamInjectionResolver`. This is also a convenience class that needs to get passed an instance of `AbstractValueFactoryProvider` (which is actually a `ValueFactoryProvider`).

To see this version work, you can un-comment the registration of its `Binder` and comment the registration of the `TenantBinder`

```java
@Override
public ResourceConfig configure() {
    return new ResourceConfig()
            //.register(new TenantBinder())
            .register(new TenantParamValueFactoryProvider.Binder())
            .register(WithContextNoOther.class)
            .register(WithContextAndEntity.class)
            .register(WithCustomNoOther.class)
            .register(WithCustomAndEntity.class)
            .register(DebugMapper.class);
}
```

And that's it. Hope you guys found this article informative.


[1]: https://hk2.java.net/2.4.0-b07/
[2]: https://jersey.java.net/documentation/latest/ioc.html
[3]: https://gist.github.com/psamsotha/3f7e1a1b31e0611f37ec
[4]: https://jersey.java.net/documentation/latest/test-framework.html
[5]: https://jersey.java.net/apidocs/2.19/jersey/org/glassfish/jersey/server/model/Resource.html
[6]: https://jersey.java.net/apidocs/2.19/jersey/org/glassfish/jersey/server/model/ResourceMethod.html
[7]: https://github.com/jersey/jersey/blob/master/core-server/src/main/java/org/glassfish/jersey/server/spi/internal/ValueFactoryProvider.java
[8]: https://github.com/jersey/jersey/blob/master/core-server/src/main/java/org/glassfish/jersey/server/internal/inject/EntityParamValueFactoryProvider.java
[9]: https://github.com/jersey/jersey/tree/master/core-server/src/main/java/org/glassfish/jersey/server/internal/inject