---
layout: post
title: "Creating Reusable Jersey Extensions"
description: "How we can create reusable extension when working with Jersey"
categories: jersey
tags: jersey jersey-2.0
---

When developing in Jersey, you may find yourself reusing some components for different projects, or you would like to share your components with the world to use. In either case, it is likely the components will need to be configured to suit the user's needs. In this article I will show a pattern of how to create these reusable components and to package them up into easily usable and configurable features. 

The pattern I will be describing is the pattern used by most of the features in Jersey. For example, you might find yourself doing this

```java
register(SomeFeature.class);
property(SomeFeature.SOME_PROPERTY, false);
property(SomeFeature.ANOTHER_PROPERTY, true);
```

Here we are registering the `SomeFeature` and setting configuration properties on that feature. This is the usability pattern we will follow in the example I describe in this article.

The example we will use is an API key feature that allows clients to obtain a API key to use your APIs. Do note that the implementation should probably not be used in the real world. I put more thought into creating the framework components and making them fit, than into any security good practices.

So these are the requirements we will try to meet.

* When a client tries to access an endpoint, if a API key header is not set with a valid key, the client will get sent an Unauthorized response.
* The client can obtain a key from an endpoint created by the feature.

For the first of the bullet points we will use a `ContainerRequestFilter`. For the second point, we will create an endpoint class just like any other resource class you create in Jersey.

**Configurables**

* The user should be able to configure how the key is generated.
* The user should be to configure their own data access.
* The user should be able to configure the API key endpoint URI.
* The user should be able to configure the header name the key should come in.
* The user should be able to add test data to a default (in-memory) data store.

All the code examples can be found in [the GitHub project][10]. The code discussed here will be from the [jersey-extension-framework][11] child project, and the client of the feature project can be found in the [jersey-extension-client][12] child project

[10]: https://github.com/psamsotha/jersey-extensions
[11]: https://github.com/psamsotha/jersey-extensions/tree/master/jersey-extension-framework
[12]: https://github.com/psamsotha/jersey-extensions/tree/master/jersey-extension-client

The first component we will introduce is the `ClientStore`. 
	
```java
public interface ClientStore {
    void saveClient(ClientDetails clientDetails);
    ClientDetails getClientById(String clientId);
    ClientDetails getClientByApiKey(String apiKey);
}
```

These methods will allow the feature to lookup clients from the data store, and to save clients. There is a default implementation (`DefaulClientStore`) provided that will just save to a `ConcurrentHashMap`. The user of the feature can use this default just to test, but will want to provide their own implementation that will actual store the data to a persistent store.

The `ClientDetails` is a simple domain model that has three properties.

```java
public class ClientDetails {
    private String clientId;
    private String clientPassHash;
    private String apiKey;
    // getters and setters
}
```

The next component is the `ApiKeyFilter`, which is a `ContainerRequestFilter`. This will filter out the requests to check for API keys

```java
final class ApiKeyFilter implements ContainerRequestFilter {
    
    private final String authEndpoint;
    private final String apiKeyHeader;
    
    @Inject
    private ClientStore clientStore;
    
    public ApiKeyFilter(String authEndpoint, String apiKeyHeader) {
        this.authEndpoint = authEndpoint;
        this.apiKeyHeader = apiKeyHeader;
    }

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        String requestUri = requestContext.getUriInfo().getRequestUri().toString();
        if (requestUri.endsWith(authEndpoint)) {
            return;
        }
        
        String keyValue = requestContext.getHeaderString(apiKeyHeader);
        if (keyValue == null) {
            throw new WebApplicationException(Response.Status.UNAUTHORIZED);
        }
        
        ClientDetails client = clientStore.getClientByApiKey(keyValue);
        if (client == null) {
            throw new WebApplicationException(Response.Status.UNAUTHORIZED);
        }
    }
}
```

As stated earlier, the API key endpoint is configurable, and so it the API key header. So we provide those in a dependencies through the constructor. In th `filter` method we check three things

1. If the request is to the API key endpoint, we let it through.
2. If the API key is missing, the client will get an Unauthorized response.
3. If the client can't be found through the API key, they will also get an Unauthorized response.

The next component we will create the `ApiKeyEndpoint`. This is the endpoint requested to get a key.

```java
@Path(ApiKeyFeature.DEFAULT_URI)
@Produces(MediaType.APPLICATION_JSON)
public class ApiKeyEndpoint {
    
    @Inject
    private KeyGenerator keyGenerator;
    
    @Inject
    private ClientStore clientStore;

    private Response getApiKey(ClientPostInfo clientInfo) {
        ClientDetails client = clientStore.getClientById(clientInfo.clientId);
        if (client == null) {
            throw new WebApplicationException(Response.Status.UNAUTHORIZED);
        }
        String hash = noOpHash(clientInfo.clientPass);
        if (!client.getClientPassHash().equals(hash)) {
            throw new WebApplicationException(Response.Status.UNAUTHORIZED);
        }
        String apiKey = keyGenerator.generateKey(client.getClientId());
        client.setApiKey(apiKey);
        clientStore.saveClient(client);
        return Response.ok(new ApiKey(apiKey)).build();
    }
}
```

I took out some code for brevity, but you can find the complete code in the project. The main functionality of the endpoint is enclosed in the `getApiKey` method. There are actually two resource methods, one to handle `application/json` POST data, and one to handle `application/x-www-form-urlencoded` POST data. They both make the same call to the `getApiKey` method, so I just left them out.

In the `getApiKey` method we look up the `ClientDetails` from the `ClientStore`. If the client is not in the store, they get an `Unauthorized` response. In this example we will assume the client it put into the store in some out of band way, so the feature will be so concerned with being able to add clients to the store.

If the client is found, then they will be issued an API key, in JSON form. For example

```json
{"apiKey" : " dj8e2-d2idj-wed32-32jdw"}
```

The other thing to note about this class is the `KeyGenerator`. This is another interface the user can implements and configure.

```java
public interface KeyGenerator {
    String generateKey(String clientId);
}
```

There is a default one (`UUIDKeyGenerator`) that does nothing more than return a random UUID.

These are all the main components involved in the actual _functionality_ of the feature. I tried to keep it sweet and simple. To use the feature the user should be able to do the following

```java
property(ApiKeyFeature.API_KEY_HEADER, "X-API-TOKEN");
property(ApiKeyFeature.API_KEY_URI, "apikey");
property(ApiKeyFeature.CLIENT_STORE_CLASS, JpaClientStore.class);
property(ApiKeyFeature.KEY_GEN_CLASS, SomeKeyGenerator.class);

register(ApiKeyFeature.class);
```

In this example the user is opting to change the default properties by supplying their own. Hopefully you can figure the use of the first two. The latter two are the two components implemented by the user, and provided to the feature, which overrides the default components. Then the user registers the `ApiKeyFeature` which we will described shortly. The thing to note is that we will have defaults for all these properties.

Also if the user wanted to test out the feature just using the `DefaultClientStore`, then they would not have to configure the `ApiKeyFeature.CLIENT_STORE_CLASS` property. Instead they should use `ApiKeyFeature.INIT_CLIENT_DATA` to supply a `List<ClientDetails>` as the property value. This will be the initial data to put into the store.

Now here is where the main configuration component comes in, the `ApiKeyFeature`. It is a lot of code to put into on code block, so I will go through it piece by piece. So to follow along, you should open up the file.

The first to check out are the couple of helper methods at the bottom of the class.

```java
public static <T> T getValue(Map<String, ?> properties, String key, Class<T> type) {
    return PropertiesHelper.getValue(properties, key, type, null);
}

public static <T> T getValue(Map<String, ?> properties, String key, T defaultValue) {
    return PropertiesHelper.getValue(properties, key, defaultValue, null);
}
```

I just copied these from a different feature in the Jersey project. They just help in obtaining property values from the property map. For example at the beginning of the `configure` method, you will see

```java
@Override
public boolean configure(FeatureContext context) {
    Map<String, Object> properties = context.getConfiguration().getProperties();

    final String apiKeyHeader = getValue(properties, API_KEY_HEADER, DEFAULT_KEY_HEADER);
    
    final String apiKeyPath = getValue(properties, API_KEY_URI, DEFAULT_URI);

    context.register(new ApiKeyFilter(apiKeyPath, apiKeyHeader));
    ...
}
```

When a user set a property in the `ResourceConfig` by calling `property(prop, value);`, The property gets set the `Configuration` properties, that we obtains from the `FeatureContext`. Then we look then up with our helper methods, supplying default values. So if the `API_KEY_HEADER` is not set, then use the `DEFAULT_KEY_HEADER`. Same goes for the `API_KEY_URI`. After we obtain these two properties, then we can construct the `ApiKeyFilter`, and then register the filter with the application.

Next we are going to programmatically create the `ApiKeyEnpoint` resource. This is required because the URI is configurable. When the user provides a different URI from the default, we need to reconstruct the resource model. To do this we will use a combination of a [`Resource.Builder`][2] and a [`ModelProcess`][3]. Details about using these components is outside the scope of this article. To get more information on programmatically creating resources, I suggest you check out [Programmatic API for Building Resources][4]

[2]: https://jersey.java.net/apidocs/2.19/jersey/index.html?org/glassfish/jersey/server/model/Resource.Builder.html
[3]: https://jersey.java.net/apidocs/2.19/jersey/index.html?org/glassfish/jersey/server/model/ModelProcessor.html
[4]: https://jersey.java.net/documentation/latest/resource-builder.html

```java
final Resource apiKeyResource
           = Resource.builder(ApiKeyEndpoint.class).path(apiKeyPath).build();
context.register(new ApiKeyModelProcessor(apiKeyResource));
[...]
private static class ApiKeyModelProcessor implements ModelProcessor {

    private final Resource apiKeyResource;

    public ApiKeyModelProcessor(Resource apiKeyResource) {
        this.apiKeyResource = apiKeyResource;
    }

    @Override
    public ResourceModel processResourceModel(ResourceModel resourceModel,
            Configuration config) {
        ResourceModel.Builder builder
                = new ResourceModel.Builder(resourceModel.getResources(), false);
        builder.addResource(apiKeyResource);
        return builder.build();
    }
}
```

The last part of the `Feature` configuration is to handle the `KeyGenerator` and the `ClientStore`.

```java
Class<? extends KeyGenerator> generatorCls = getValue(properties, KEY_GEN_CLASS, Class.class);
generatorCls = generatorCls == null ? UUIDKeyGenerator.class : generatorCls;

Class<? extends ClientStore> clientStoreCls = getValue(properties, CLIENT_STORE_CLASS, Class.class);
// Using DefaultClientStore. 
if (clientStoreCls == null) {
    DefaultClientStore defaultClientStore = new DefaultClientStore();
    List<ClientDetails> db = getValue(properties, INIT_CLIENT_DATA, List.class);
    if (db == null) {
        throw new RuntimeException("Either set ClientStore or init List");
    }
    for (ClientDetails c : db) {
        defaultClientStore.saveClient(c);
    }
    context.register(new ApiKeyBinder(defaultClientStore, generatorCls));
} else {
    context.register(new ApiKeyBinder(clientStoreCls, generatorCls));
}
```

The first couple of lines set the `KeyGenerator` class. If the property is not set, `getValue` will return null. In that case we use the default `UUIDKeyGenerator`.

For the `ClientStore` it will be a bit different. If the user doesn't set their own `ClientStore` implementation, then they can set the `List<ClientDetails>` to initialize the `DefaultClientStore` with come data. In which case we will use an _instance_ of the `DefaultDataStore` instead of the class. This is necessary to initialize the data.

Once we have the `KeyGenerator` class and the `ClientStore` class or `DefaultClientStore` instance, we will register then with an `AbstractBinder`, which is used by Jersey's dependency injection framework HK2 to register the services. These services are injected into both the `ApiKeyFilter` and the `ApiKeyEndpoint`. To learn more about HK2 and using it with Jersey, see [Custom Injection and Lifecycle Management][6]

[6]: https://jersey.java.net/documentation/latest/ioc.html

And that's it for the feature. You can see the test cases in the project. There are two sets of tests. Both of which extend from `BaseApiKeyFeatureTest`. One of the test sets use all defaults, while the other uses all configured properties.

You can also see the `jersey-extension-client` project to see a real client of the feature in action. It implements the `ClientStore` using JPA. Instructions to run the client project are its README.

Hope you enjoyed this article and hope you start building and sharing your new features! 




