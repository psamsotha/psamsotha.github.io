---
layout: post
title: "Jersey Configuration Properties"
description: "A few different ways to work with configuration properties in Jersey"
categories: jersey
thumb: "abandoned-chair"
featured: true
tags: jersey jersey-2.0
---

Often in a Jersey application, you need configuration properties that need to be applied dynamically. In this article I will describe some native capabilities in Jersey, how we can extend that native capability into make injectable properties, and finally I will explain how to use a small module I created for working with properties.

* **[Native Capabilities](#native)**
* **[Custom Injection of Properties](#customInject)**
* **[`jersey-properties` Module](#jerseyProps)**

<a name="native"></a>

### Native Capabilities

JAX-RS contains a class [`javax.ws.rs.core.Configuration`][1] from which we can obtain arbitrary properties from, that can be compiled from different locations. With Jersey, these properties can come from either servlet init-params or from explicitly set properties from a `ResourceConfig` or `Application` subclass. In a `ResourceConfig`, we could just call the `property(key, value)` method. For example

```java
public class AppConfig extends ResourceConfig {
    public AppConfig() {
        property(PROP_KEY, PROP_VALUE);
    }
}
```

Or in an `Application` (only JAX-RS 2.0) subclass

```java
public MyApplication extends Application {
    @Override
    public Map<String, Object> getProperties() {
        Map<String, Object> props = new HashMap<>(); 
        props.put(PROP_KEY, PROP_VALUE);
        return props;
    }
}
```

Either way, there are a countless number of ways you could populate the configuration properties. For instance you can read a `.properties` file, and fill the properties with the contents of the `Properties` object.

Once you've registered your properties, you can inject the above mentioned `Configuration` instance into your resource classes or providers. For example

```java
@Path("config")
public class ConfigResource {
    
    @Context
    private Configuration configuration;
    
    @GET
    public String getConfigProp() {
        return (String)configuration.getProperty(CONFIG_PROP);
    }
}
```

You can see a complete test case of the above example in [this GitHub Gist][2]

[1]: http://docs.oracle.com/javaee/7/api/javax/ws/rs/core/Configuration.html
[2]: https://gist.github.com/psamsotha/1edddc6f47785ed4f3b3

<a name="customInject"></a>

### Custom Injection of Properties

What if we want to avoid having to repetitively get the property from the `Configuration` object? Say we want to just inject the property value, maybe with a custom annotation. That is possible with the use of an (HK2) [`InjectionResolver`][3]. For example you can do something like

```java
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public static @interface Config {
    String value();
}

public class ConfigInjectionResolver implements InjectionResolver<Config> {
    
    @Context
    private Configuration configuration;

    @Override
    public Object resolve(Injectee injectee, ServiceHandle<?> handle) {
        if (String.class == injectee.getRequiredType()) {
            Config annotation = injectee.getParent().getAnnotation(Config.class);
            if (annotation != null) {
                String prop = annotation.value();
                return (String)configuration.getProperty(prop);
            }
        }
        return null;
    }
    ...
}
```

Then register the `InjectionResolver` with HK2

```java
ResourceConfig config = new ResourceConfig();
config.register(new AbstractBinder(){
    @Override
    protected void configure() {
        bind(ConfigInjectionResolver.class)
                .to(new TypeLiteral<InjectionResolver<Config>>(){})
                .in(Singleton.class);
    }
});
```

This will now allow us to inject the property as a String value into our resource class or provider.

```java
@Path("config")
public class ConfigResource {
    
    @Config(PROP_KEY)
    private String propValue;
    
    @GET
    public String getConfigProp() {
        return propValue;
    }
}
```

You can see a complete runnable test case at [this GitHub Gist][4].

One limitation of the above implementation is that it doesn't allow for method parameter injection. This is not so much that there is anything wrong with the implementation, it is about the way the Jersey handles parameter injection. To read more about it, see [Custom Method Parameter Injection in Jersey 2][5]. Usually though, there is not much need to inject configuration properties into method parameters.

[3]: https://hk2.java.net/apidocs/org/glassfish/hk2/api/InjectionResolver.html
[4]: https://gist.github.com/psamsotha/981796428ed736977eed
[5]: {{ site.baseurl }}{% link _posts/jersey/2015-11-01-jersey-method-parameter-injection.md %}

<a name="jerseyProps"></a>

### `jersey-properties` Module

I created a small module that helps with working with configuration properties. You can find the project [at GitHub][6], where there you can read more about about it. To use it you need to add this Maven artifact

```java
<dependency>
    <groupId>com.github.psamsotha</groupId>
    <artifactId>jersey-properties</artifactId>
    <version>0.1.1</version>
<dependency>
```

To use it at it's most basic form, you should register the `JerseyPropertiesFeature`, along with specifying a properties file from where it can obtain the properties.

```java
public class AppConfig extends ResourceConfig {

    public AppConfig() {
        register(JerseyPropertiesFeature.class);
        property(JerseyPropertiesFeature.RESOURCE_PATH, "app.properties");
    }
}
```

With this basic configuration, if your `app.properties` contained the following

```
some.prop=Some value
```

you would be able to do any of the following injections

```java
@Path("test")
public class SomeResource {

    @Prop("some.prop")
    private String someFieldProp;

    private String someConstructorProp;

    public SomeResource(@Prop("some.prop") String someConstructorProp) {
        this.someConstructorProp = someConstructorProp;
    }

    @GET
    public String get(@Prop("some.prop") String someParamProp) {
        return someParamProp;
    }
}
```

Aside from this basic set up, you can also implement a `PropertiesProvider`, that can be registered, and this where the properties would come from.

```java
public class MorePropertiesProvider implements PropertiesProvider {

    private final Map<String, String> moreProps = new HashMap<String, String>();

    public MorePropertiesProvider() {
        moreProps.put(PROP_ONE_KEY, PROP_ONE_VALUE);
    }

    @Override
    public Map<String, String> getProperties() {
        return moreProps;
    }
}
```

Then just register the provider in the `JerseyPropertiesFeature`

```java
public AppConfig() {
    register(JerseyPropertiesFeature(new MorePropertiesProvider());
    property(JerseyPropertiesFeature.RESOURCE_PATH, "app.properties");
}
```

With the `PropertiesProvider`, you are able to easily extend this feature to get property from some other way, say from a yaml file. 

To read more about this module, please read the README in the GitHub project, linked above. Also check out the tests in the project for some other use cases.

[6]: https://github.com/psamsotha/jersey-properties