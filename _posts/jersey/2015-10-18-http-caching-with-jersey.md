---
layout: post
categories: jersey
category: jersey
title: "HTTP Caching with Jersey (and JAX-RS)"
description: "Learn about HTTP caching semantics and how we can implement it in Jersey (and JAX-RS)."
thumb: chains
tags: jersey jersey-2.0 jax-rs
---

In this article I will be talking about caching in the context of the HTTP specs and REST (which is heavily linked with HTTP semantics). First I will cover the specifics covered in HTTP 1.0, then the changes made in HTTP 1.1, then conclude with how we can clean up some of the examples from the previous sections.

### Table of Contents

* [Requirements](#requirements)
* [Caching in HTTP 1.0](#http10)
    * [Expires Example](#http10example)
* [Caching in HTTP 1.1](#http11)
    * [Temporal Semantics](#temporal)
        * [Cache-Control example](#temporalExample)
    * [Revalidation Semantics](#revalidation)
        * [Temporal Revalidation](#temporalRevalidation)
            * [Temporal Revalidation Example](#temporalRevalidationExample)
        * [Etag Revalidation](#etagRevalidation)
            * [Etag Realidation Example](#etagRevalidationExample)
* [Keeping it DRY (don't repeat yourself)](#dry)


{% include ads/in-article-ad.html %}


<a name="requirements"></a>

## Requirements

Tools you will need to follow along.

* [cURL][1] - A command line tool that I use as a REST client. You may use a different client, but any other tools usages will be outside the scope of this article.
* [Maven][2] - To build and run the app with the [jetty-maven-plugin][3]

[1]: http://curl.haxx.se/
[2]: https://maven.apache.org/
[3]: http://www.eclipse.org/jetty/documentation/current/jetty-maven-plugin.html

You download or clone the app from Github

```bash
git clone https://github.com/psamsotha/jersey-cache-example.git
```

Or download it from the [Github project site][30]

[30]: https://github.com/psamsotha/jersey-cache-example


<a name="http10"></a>

## Caching in HTTP 1.0

In HTTP 1.0 the server sends an `Expires: <expiration-data>` header with the response. So a response might look something like

```bash
HTTP/1.0 200 OK
Date: Sun, 18 Oct 2015, 09:15:25 GMT
Content-Type: text/plain
Content-Length: 100
Expires: Sun, 18 Oct 2015, 10:15:25 GMT

  <body content>
```

Here the expiration data has been set to one hour from the time the response was sent out. 

<a name="http10example"></a>

### Expires example

In JAX-RS, we would simply to something like

```java
@GET
@Produces("text/plain")
public Response get() {
    long current = new Date().getTime();
    Date expires = new Date(current + (10 * 1_000));
    return Response.ok("Some Data").expires(expires).build();
}
```

There's nothing really interesting goind on here. We are calling `expires` on the [`ResponseBuilder`][4] which sets the `Exires` to ten seconds from the time of request. If we make the cURL request, we can see the header.

[4]: http://docs.oracle.com/javaee/7/api/javax/ws/rs/core/Response.ResponseBuilder.html

```bash
C:\>curl -v http://localhost:8080/api/expires
> GET /api/expires HTTP/1.1
> User-Agent: curl/7.40.0
> Host: localhost:8080
> Accept: */*
>
< HTTP/1.1 200 OK
< Date: Sun, 18 Oct 2015 03:34:50 GMT
< Expires: Sun, 18 Oct 2015 03:35:00 GMT
< Content-Type: text/plain
< Content-Length: 9
< Server: Jetty(9.2.6.v20141205)
<
Some Data
```

cURL doesn't support any caching features, so trying to make another call won't respect the `Expires` header, and another request will be made.

<a name="http11"></a>

## Caching in HTTP 1.1

Then came HTTP 1.1, which not only create new temporal semantics, but also added revalidation semantics to caching. Take for example the caching the `Expires` example above. Say the expiration time is 10 seconds. A request made after that ten seconds will _always_ get back new data from the server. With revalidation the server sends a _condition_ request, saying _"if the data has not been modified since [date]"_ and/or _"if data still matches the data in my cache"_, don't send back the data. This helps in bandwidth usage, as the data is not always sent back, as would be the case with the old Expires semantics. Here's a flow chart of basics of the process

![cache-flow][5]

[5]: https://www.dropbox.com/s/vxuzxwthzg2cj5s/cache-flow.png?dl=1

<a name="temporal"></a>

### Temporal caching 

When I say "temporal", I am talking about time. As discussed, the old spec used the `Expires` header to set the expiration date on the data. The problem with this is that it is an absolute time that is dependent on system clock being set correctly. To fix this problem, the `Cache-Control` header was introduced. Instead of an absolute date, it uses a relative time in the form of `max-age`. For example a response might look like

```bash
HTTP/1.1 200 OK
Date: Sun, 18 Oct 2015 03:47:18 GMT
Cache-Control: max-age=10
Content-Type: text/plain
Content-Length: 9
Server: Jetty(9.2.6.v20141205)

Some Data
```

Here the `Cache-Control` header is saying that the data is only good in the cache for 10 second, after which a supporting client should get new data. 

<a name="temporalExmple"></a>

#### Cache-Control Example

Here's how we could code it in JAX-RS

```java
@GET
@Produces("text/plain")
public Response get() {
    CacheControl cc = new CacheControl();
    cc.setMaxAge(10);
    return Response.ok("Some Data").cacheControl(cc).build();
}
```

This example is from `CacheControlResource` in the Github project. We are setting the `max-age` to 10 seconds. So let's test it out. From the command line, `cd` to the project root, then run the project with the Maven Jetty plugin (You will need to have Maven installed, or you can deploy the project to any servlet container).

```bash
cd <to> jersey-cache-example
mvn jetty:run
```

You should see the embedded Jetty server start. Wait until you see `[INFO] Started Jetty Server`. That's when you know the server startup is complete.

Instead of testing with cURL, we will use the browser. As I mentioned above cURL doesn't offer any caching support. For testing with the browser, I often make use of some developer tool. In Firefox, there should be able to go to `Tools`&rarr;`Web Developer`&rarr;`Web Console` to see the below console, or with Chrome there is also a dev tool installed. Just hit F12 to open it.

This what we are going to do. First make a request, and see the request being sent to the server. Then make another immediate request, and see that the browser doesn't make a request, but give's use the cache value. And lastly, wait 10 seconds and make another request, and see the request being sent to the server.

When you first start up Firefox Web Console, you will see a window like below. Hit the <kbd>Network</kbd> tab. Which will show networks calls.

![firefox1][6]

[6]: https://www.dropbox.com/s/z97efh9z2ee8l2a/firefox1.png?dl=1

Now in the URL bar, type in the URL `http://localhost:8080/api/cc` and hit Enter. You will can tell that a request is made, from the green dot on the left, as well as the request time in milliseconds on the right

![firefox2][7]

[7]: https://www.dropbox.com/s/1grasb6h3gpyiw4/firefox2.png?dl=1

Most likely 10 seconds has passed. So highlight the URL bar then make a request again by hitting Enter, but make a second request but highlighting and hitting enter again. This time what you should have seen if first the same screen as above, as a request _is_ made, but the second time you hit enter to make a request, you should see 

![firefox3][8]

[8]: https://www.dropbox.com/s/8xxof4v6j4i2mo3/firefox3.png?dl=1

This time there is no green dot, and no time elapsed for the request. This is because the browser respects the `Cache-Control` and knows the data is only good for the `max-age` of 10 seconds. At any time you can select the request table row to see all the request and response headers. You should see the header for the cache control.

```
Cache-Control: no-transform, max-age=10 
```

{% include ads/post-in-article-banner-1.html %}

<a name="revalidation"></a>

### Revalidation caching 

As previously mentioned, HTTP 1.1 also added the concept of revalidation. If there is a `Cache-Control` header, then after the time expires, the supporting client should revalidate the date and check to see if it has not changed. 

<a name="temporalRevalidation"></a>

#### Temporal Revalidation

There are two client request headers that could be involved in the revalidation process. The first is the `If-Modified-Since: [date]` header. How it works is that the server should send a `Last-Modified: [date]` response header along with the data. The server should have some way to maintaining this "last modified" date, for example a database field, that changes whenever the data is modified.

One subsequent requests, the client should send the `If-Modified-Since: [date]`, with the `[date]` being the same date in the `Last-Modified` response header from the server. The server should check if the data has been modified since that date. If it hasn't then the sever simply send back a `304 Not Modified`, other wise send the new data with a `200 OK`
    
<a name="temporalRevalidationExample"></a>

##### Temporal Revalidation Example

Let go through an example of using the `If-Modified-Since` and `Last-Modified` example. The code can be found in the `LastModifiedResource` in the Github project.

```java
@Singleton
@Path("last-modified")
public class LastModifiedResource {
    
    private String data = "Some Data";
    private Date lastModified = new Date();
    
    @GET
    @Produces("text/plain")
    public Response get(@Context Request request) {
        ResponseBuilder builder = request.evaluatePreconditions(lastModified);
        if (builder != null) {
            return builder.build();
        }
        return Response.ok(data).lastModified(lastModified).build();
    }
    
    @POST
    @Consumes("text/plain")
    public Response post(String data) {
        this.data = data;
        lastModified = new Date();
        return Response.noContent().build();
    }
}
```

Here we are creating a singleton resource (which _is not_ thread safe in this example; bare with me). Here is what we want to accomplish in this example.

1. The client sends a GET that will produce the `data`, and send with it a `Last-Modified` date being the `lastModfied` field.
2. We will make a GET request to the same endpoint, but this time adding the `If-Modified-Since` header, with the date value being the one the server sent us in the `Last-Modified` header. When we send this request, we will get back a `304 Not Modified` response, with no data
3. Then we will make a POST request, changing the data, which will also cause the `lastModfied` field to change.
4. Finally we will make the same request as in step two. But this time the revalidation will fail, as the dates are different. This time we will get the data back with a `200 OK` along with a new date in the `Last-Modified` response header.

In the example you will notice the uses of the [`javax.ws.rs.core.Request`][9] context object. How it works is that it already has reference to the `If-Modified-Since` header sent by the client. The `evaluatePreconditions` check to see if they are the same dates. If they are, the method will return a `ResponseBuilder` set up to return a `304 Not Modified`, so we don't need to do anything but build and return it. If the dates are different, then it fail the revalidation and return null.


[9]: http://docs.oracle.com/javaee/7/api/javax/ws/rs/core/Request.html

Here is the request sequence in cURL (listed as in the steps above)

Step 1 (initial GET)

```bash
C:\>curl -v http://localhost:8080/api/last-modified
> GET /api/last-modified HTTP/1.1
> ...
< HTTP/1.1 200 OK
< Date: Sun, 18 Oct 2015 05:44:48 GMT
< Last-Modified: Sun, 18 Oct 2015 05:44:48 GMT
< Content-Type: text/plain
<
Some Data
```

Step 2 (GET with If-Modified-Since)

```bash
C:\>curl -v http://localhost:8080/api/last-modified \
         -H "If-Modified-Since: Sun, 18 Oct 2015 05:44:48 GMT"
> GET /api/last-modified HTTP/1.1
> If-Modified-Since: Sun, 18 Oct 2015 05:44:48 GMT
> ...
< HTTP/1.1 304 Not Modified
< Date: Sun, 18 Oct 2015 05:45:28 GMT
```

Step 3 (POST to change data)

```bash
C:\>curl -v -X POST -d "new data" \
         -H "Content-Type:text/plain" \
         http://localhost:8080/api/last-modified
> POST /api/last-modified HTTP/1.1
> Content-Type:text/plain
> Content-Length: 8
> ...
< HTTP/1.1 204 No Content
< Date: Sun, 18 Oct 2015 05:45:45 GMT
```

Step 4 (Same GET as in Step 2)

```bash
C:\>curl -v http://localhost:8080/api/last-modified 
         -H "If-Modified-Since: Sun, 18 Oct 2015 05:44:48 GMT"
> GET /api/last-modified HTTP/1.1
> If-Modified-Since: Sun, 18 Oct 2015 05:44:48 GMT
> ...
< HTTP/1.1 200 OK
< Date: Sun, 18 Oct 2015 05:46:01 GMT
< Last-Modified: Sun, 18 Oct 2015 05:45:45 GMT
< Content-Type: text/plain
< Content-Length: 8
<
new data
```

Hope you can easily follow along. The important point to notice is that in step two, we are getting no content back and a 304 as the date is the same as on the server. But in the last request, the date change because of the previous POST, so now we get back new data with a different date.

<a name="etagRevalidation"></a>

#### Etag Revalidation

The second form of validation is validating the content has not changed. To do that the server should send something to the client the represents the current state of the content being sent in the request. This is handled with the `Etag` header. In most cases, this will be a hash of the data. The server sends the `Etag: <hash>` header with the response. When the client makes a request for the same resource, it should send a `If-None-Match: <hash>` to the server. If the value does not match that of the server's, then the resource has been changed since the client last received it, and the server should send the new data with the new `Etag`. Otherwise if the data is the same, the server should send a `304 Not Modified`.

<a name="etagRevalidationExample"></a>

##### Etag Revalidation Example

Below is an example implementation. It is very similar to the one above, except we are not checking the time the resource was last modified, but _if_ is was actually modified

```java
@Singleton
@Path("etag")
public class EtagResource {
    
    private String data = "Some Data";
    
    @GET
    @Produces("text/plain")
    public Response get(@Context Request request) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("MD5");
        byte[] hash = digest.digest(data.getBytes(StandardCharsets.UTF_8));
        String hex = DatatypeConverter.printHexBinary(hash);
        EntityTag etag = new EntityTag(hex);
        
        ResponseBuilder builder = request.evaluatePreconditions(etag);
        if (builder != null) {
            return builder.build();
        }
        
        return Response.ok(data).tag(etag).build();
    }
    
    @POST
    @Consumes("text/plain")
    public Response post(String data) {
        this.data = data;
        return Response.noContent().build();
    }
}
```

You can see the same use of the `Request` context object, and a similar usage of the `evaluatePreconditions`. Only this time we are using the overloaded method that accepts and `EntityTag`. We construct the `EntityTag` from the hash of the `data`. In the initial request, the revalidation will not pass as there is no header from the client, so we just return the normal response, setting the `Etag` response header, by calling `tag(EntityTag)` on the `ResponseBuilder`. In subsequent requests, if the `EntityTag` matches, the the `ResponseBuilder` will not be null, and we create the pre-configured `ResponseBuilder` that is set to send a `304 Not Modified`.

Below I'll post the same steps as I did with the above example and you will see similar results

1. Send initial GET to get the data for the first time. We will get a response with the hash in the `Etag` header.
2. We will make the same request, except this time we will add the `If-None-Match` header, with the etag value. We should get back a `304 Not Modified` with no data.
3. We will send a POST request to change the data.
4. We will make the exact same request as in step 2, but this time we will get the new data, with the new `Etag`.

Step 1 (initial GET)

```bash
C:\>curl -v http://localhost:8080/api/etag
> GET /api/etag HTTP/1.1
> ...
< HTTP/1.1 200 OK
< Date: Sun, 18 Oct 2015 07:57:29 GMT
< ETag: "30057E5031BCF44D47B005A1F1700F7B"
< Content-Type: text/plain
< Content-Length: 9
<
Some Data
```

Step 2 (GET with If-None-Match))

```bash
C:\>curl -v http://localhost:8080/api/etag \
         -H "If-None-Match: \"30057E5031BCF44D47B005A1F1700F7B\""
> GET /api/etag HTTP/1.1
> If-None-Match: "30057E5031BCF44D47B005A1F1700F7B"
> ...
< HTTP/1.1 304 Not Modified
< Date: Sun, 18 Oct 2015 07:58:22 GMT
< ETag: "30057E5031BCF44D47B005A1F1700F7B"
```

Step 3 (change data with POST)

```bash
C:\>curl -v -X POST -d "new data" \
         -H "Content-Type: text/plain" \
         http://localhost:8080/api/etag
> POST /api/etag HTTP/1.1
> Content-Type: text/plain
> Content-Length: 8
> ...
< HTTP/1.1 204 No Content
< Date: Sun, 18 Oct 2015 07:58:57 GMT
< Server: Jetty(9.2.6.v20141205)
```

Step 4 (set GET from step 2)

```bash
C:\>curl -v http://localhost:8080/api/etag 
         -H "If-None-Match: \"30057E5031BCF44D47B005A1F1700F7B\""
> GET /api/etag HTTP/1.1
> If-None-Match: "30057E5031BCF44D47B005A1F1700F7B"
> ...
< HTTP/1.1 200 OK
< Date: Sun, 18 Oct 2015 07:59:01 GMT
< ETag: "E83CA39A795E57283EC1D12EDA0FECD3"
< Content-Type: text/plain
< Content-Length: 8
<
new data
```

You can see that in the 2nd step, we are not getting content back with a 304, but in the 4th request, we are getting the new data with a 200 and the new etag.


{% include ads/post-in-article-banner-2.html %}


<a name="dry"></a>

## Staying DRY Using Filters and Interceptors

If you've been following along up to this point, you will have noticed that there is a lot of boilerplate that goes into producing the functionality for handling HTTP caching. With more resource methods, we will need to repeat similar code over and over. With Jersey (and JAX-RS), when we are faced with this, it is often an opportunity to handle this repetition inside of a filter or interceptor. If you are unfamiliar with these, I suggest taking some time to review [Filters and Interceptors][10] from the Jersey user guide.

[10]: https://jersey.java.net/documentation/latest/filters-and-interceptors.html

What I will do here is not try to implement this functionality myself, but I will direct your attention to RESTeasy's implementation. For those that don't know, RESTeasy is another implementation of JAX-RS. From this implementation you can get an idea of what it takes to implement this.

What I did was port the functionality over to Jersey for my example. Some of the classes used in the implementation were RESTeasy specific, so I had to change some of it.

You will find all classes in the `com.underdog.jersey.cache.example.dry` in my Github example project. All of the classes in the package are either complete duplicates or just altered a bit to port to Jersey. Below is a list of the classes, with a link to the original source code from the RESTeasy project. I will then describe them.

* [`@Cache`][12]
* [`CacheControlFilter`][14]
* [`CacheControlFeature`][15]
* [`ServerCache`][16]
* [`SimpleServerCache`][17]
* [`ServerCacheHitFilter`][18]
* [`ServerCacheInterceptor`][19]
* [`ServerCacheFeature`][20]

[12]: https://github.com/resteasy/Resteasy/blob/master/jaxrs/resteasy-jaxrs/src/main/java/org/jboss/resteasy/annotations/cache/Cache.java
[14]: https://github.com/resteasy/Resteasy/blob/master/jaxrs/resteasy-jaxrs/src/main/java/org/jboss/resteasy/plugins/interceptors/CacheControlFilter.java
[15]: https://github.com/resteasy/Resteasy/blob/master/jaxrs/resteasy-jaxrs/src/main/java/org/jboss/resteasy/plugins/interceptors/CacheControlFeature.java
[16]: https://github.com/resteasy/Resteasy/blob/master/jaxrs/resteasy-cache/resteasy-cache-core/src/main/java/org/jboss/resteasy/plugins/cache/server/ServerCache.java
[17]: https://github.com/resteasy/Resteasy/blob/master/jaxrs/resteasy-cache/resteasy-cache-core/src/main/java/org/jboss/resteasy/plugins/cache/server/SimpleServerCache.java
[18]: https://github.com/resteasy/Resteasy/blob/master/jaxrs/resteasy-cache/resteasy-cache-core/src/main/java/org/jboss/resteasy/plugins/cache/server/ServerCacheHitFilter.java
[19]: https://github.com/resteasy/Resteasy/blob/master/jaxrs/resteasy-cache/resteasy-cache-core/src/main/java/org/jboss/resteasy/plugins/cache/server/ServerCacheHitFilter.java
[20]: https://github.com/resteasy/Resteasy/blob/master/jaxrs/resteasy-cache/resteasy-cache-core/src/main/java/org/jboss/resteasy/plugins/cache/server/ServerCacheFeature.java

**`@Cache`** - Is used as metadata for resource method or resource class. For example

```java
@GET
@Cache(maxAge=10)
public Responge get(){}
```

The `CacheControlFilter` uses this meta data to send the `Cache-Control` header to the client

**`CacheControlFilter`** - It uses the `@Cache` metadata to create a `CacheControl` object to send with the response header.

**`CacheControlFeature`** is a [`DynamicFeature`][21] that is registered with the application. This is what registers the `CacheControlFilter` for each endpoint.

[21]: https://docs.oracle.com/javaee/7/api/javax/ws/rs/container/DynamicFeature.html

**`ServerCache`** - This is an interface for the internal caching operations. Implementation will have an internal cache and the contract has methods to save to the cache, get from the cache, and remove from the cache

**`SimpleServerCache`** - This is deprecated implementation of the `ServerCache`. I only use it for this example so I don't have to introduce other dependencies. The preferred implementation is the [`InfinispanCache`][22], which uses [Infinispan][22] as the underlying cache, as opposed to the `SimpleServerCache` which simply uses a `ConcurrentHashMap`

[22]: https://github.com/resteasy/Resteasy/blob/master/jaxrs/resteasy-cache/resteasy-cache-core/src/main/java/org/jboss/resteasy/plugins/cache/server/InfinispanCache.java
[23]: http://infinispan.org/

Now get to where all the action lies.

**`ServerCacheHitFilter`** The basic algorithm goes like this

1. If it is not a GET request (e.g. PUT or POST), then remove the URI from the cache. (Note that cache keys are the URI and MediaTypes)
2. If it is a GET request then `handleGET`
    1. Lookup cache from URI and MediaType key
    2. If entry is null, end filter, go to resource method
    3. If the entry is expired, remove from cache and end filter, go to resource method.
    4. Else if entry not null
        1. Create `EntityTag` and `Request.evaluatePreconditions()`
        2. If `ResponseBuilder` is returned, then etag from client matches. Return `304 Not Modified`
        3. If `ResponseBuilder` is null, that means that the etag from the client is different from the one in the cache. So we just send an OK response with the entity in the cache.

**`ServerCacheInterceptor`** - This is the component that adds to the cache. 

1. If not GET, proceed and return.
2. If there is no `Cache-Control` header set (from the `CacheControlFilter`), proceed. The component will only handle caching for endpoints that send out `Cache-Control`
3. If all is well, the interceptor sets the `OutputStream` for the writer to a `ByteArrayOutputStream`. The reason for this is that the interceptor works in an AOP "around-invoke" style. It handles some "before" stuff, calls `proceed` so the `MessageBodyWriter` can do its serialization, then it handle the "after" stuff. So what happens is the after `proceed` is called, the `MessageBodyWriter` has written the data to the `ByteArrayOutputStream`. Not the interceptor can get the `byte[]` and use it to create the hash for the etag.
4. With the etag created, the interceptor saves the `byte[]` entity data along with the etag into the cache.

Now the process is complete. To register this functionality, we use the last component

**`ServerCacheFeature`** - The original `ServerCacheFeature` (linked above) registers the `InfinispanCache` as the default cache, so I change it up to register the `SimpleServerCache` instead. The feature also registers the `ServerCacheHitFilter`, the `ServerCacheInterceptor`, and the `CacheControlFilter`. 

All that's needed to make everything work, is to annotate a method with `@Cache`, and to register the `ServerCacheFeature`. You can see in the `DryResource` from the example project, where the `@Cache` annotation is used, and see the `AppConfig` where the `ServerCacheInterceptor` is registered.

To test this functionality out just start the server `mvn jetty:run`, then follow the four cURL steps above in the Etag section. So will see the same results. The URL will be different though. Use `http://localhost:8080/api/dry`


