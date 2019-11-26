---
layout: post
title: "Jersey Pagination With Spring Data JPA"
description: "How we can implement pagination and sorting using Jersey along with Spring Data JPA."
categories: jersey
category: jersey
thumb: "paul-samsotha-bearded-statue"
featured: true
tags: jersey spring-data-jpa
---


Applications that deal with retrieving and displaying data, will often run into situations where
retrieving an entire dataset is just not efficient. For example, say that a database contains data
for 1,000 products. On the client side, you want to display the products, but will only be displaying
25 products at a time. There will be links to next pages that will display more products. It would
be inefficient to grab all 1,000 products, especially if the user never even goes past the first page.
This is one of the cases where pagination of data would be appropriate.


{% include ads/in-article-ad.html %}


Pagination in the context of data, is basically the process of splitting a dataset into multiple
pages (or "block" of results), with a set size for each page. To get the next set of results, we would
just change the "page" query parameter. Assuming you have some experience working with
JPA (Java Persistence API), what that might look in code is something like

```java
public List<Product> getProducts(int page, int size) {
    return this.entityManager.createNamedQuery("Product.findAll", Product.class)
        .setFirstResult(page * size)
        .setMaxResults(size)
        .getResultList();
}
```

The above code is a just a method in some arbitrary service class that has access to the `EntityManager`.
The call to `setFirstResult` determines the first result that is returned. This allows use to paginate
by multiplying the supplied page by the size of each page. The size of the result set is determined by 
the value passed to `setMaxResults`. If 0 is passed as the `page`, and the `size` passed is 5, 
then the first result would be the 0<sup>th</sup> result, and the size of the result set would be five. 
If 1 was passed as the `page` and 5 as the `size` then the first result would be the 5<sup>th</sup> and 
the result set would be the 5<sup>th</sup> through 9<sup>th</sup>.

This is pretty much how we can do pagination with vanilla JPA. This article though, will not be using 
vanilla JPA. My personal goto persistence framework is [Spring Data JPA][spring-data-jpa], which is a 
Spring-based abstraction layer over vanilla JPA, offering easier data management strategies. If you are 
unfamiliar with Spring Data, please read the previous linked documentation. You may also be interested 
in a previous article [Why and How to Use Spring with Jersey][spring-jersey-post].

>**Note:** The source code for the examples in the article can be found in this 
[GitHub project][github-project].

When working with Spring Data JPA, we are able to simply extend an interface 
([`JpaRepository`][jpa-repository]) with an interface of our own, and Spring Data will provide 
implementations for some basic CRUD and paging method implementations. For example, take this interface:

```java
public interface CustomerRepository extends JpaRepository<Customer, Long> {}
```

The `JpaRepository` defines (or more precisely, inherits) methods such as

```java
List<T> findAll();

T save(T t);

void delete(T t);
```

where `T` is the entity type (in this case `Customer`). These are not the only methods defined though. 
There are a bunch more. And we do not need to implement these. These are all implemented by Spring Data.
Along with the "vanilla" `findAll` method, there is also a "pageable" version defined:

    Page<T> findAll(Pageable pageable);

This allows us to pass a [`Pageable`][pageable] instance and returns to us a [`Page`][page]. An 
implementation of the `Pageable` interface is the [`PageRequest`][page-request], which has the following 
overloaded constructors:

```java
PageRequest(int page, int size)

PageRequest(int page, int size, Sort.Direction direction, String... properties)

PageRequest(int page, int size, Sort sort)
```

The first constructor allows us to simply pass the page and size, just like in our vanilla JPA example. 
The next two constructors allow for sorting of the pre-paged results. The sorting is based on properties 
on the entity, and `Sort.Direction` specifies the direction of the sort, either ascending or descending. 
In our example, we will use the third constructor which allows us to pass a `Sort` instance.

Let's now implement our resource class, that makes use of the `CustomerRepository`. The paging and 
sorting parameters will be passed as query parameters. An example URL will be

```
http://localhost:8080/api/customers?page=1&size=2&sort=firstName,DESC
```

Here, the result will be the second page, with two results, sorted by the first name, in descending 
order. The following is our first implementation of the resource class:

```java
@Path("customers")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CustomerResource {

    private final CustomerRepository repository;

    @Autowired
    public CustomerResource(CustomerRepository repository) {
        this.repository = repository;
    }

    @GET
    public Response getAllCustomers(
            @QueryParam("page") @DefaultValue("0") Integer page,
            @QueryParam("size") @DefaultValue("3") Integer size,
            @QueryParam("sort") List<String> sort) {

        List<Sort.Order> orders = new ArrayList<>();
        for (String propOrder: sort) {
            String[] propOrderSplit = propOrder.split(",");
            String property = propOrderSplit[0]);
            if (propOrderSplit.length == 1) {
                orders.add(new Sort.Order(property));
            } else {
                Sort.Direction direction
                        = Sort.Direction.fromStringOrNull(propOrderSplit[1]);
                orders.add(new Sort.Order(direction, property));
            }
        }

        Pageable pageable = new PageRequest(page, size,
                orders.isEmpty() ? null : new Sort(orders));

        List<Customer> customers = repository.findAll(pageable).getContent(); 
        return Response.ok(new GenericEntity<List<Customer>>(customers) {}).build();
    }
}
```

The `sort` query parameter can be used multiple times like

```
sort=firstName&sort=lastName,DESC
```

so we accept a `List<String>` as the parameter type. We want to turn that `List<String>` into 
a `List<Sort.Order>`, as that's what the `Sort` constructor takes. Remember, we are using the 
third `PageRequest` constructor that accepts a `Sort` instance. Once we have the list, we create 
the `PageRequest` and pass it to the `findAll` method.


{% include ads/post-in-article-banner-1.html %}


The result of the `findAll` call, will be a `Page<Customer>` instance. Here we are just getting 
the content of the page, which is the `List<Customer>`. If we wanted to create some HATEOAS links, 
we could use the other properties on the `Page`. But we won't be discussing HATEOAS here, so we just 
return the content.

This example works fine, but we can improve it. There's not much wrong with the code itself, but 
the problem is that we would have to do this for every resource method where we wanted to add paging. 
We could create a helper/utility class, but we would still have to accept the `@QueryParam`s to the 
resource method, then pass them to the helper. Ideally, we would rather be able to do something like

```java
@GET
public Response getAllCustomers(@Pagination Pageable pageable) {
    List<Customer> customers = repository.findAll(pageable).getContent();
    return Response.ok(new GenericEntity<List<Customer>>(customers) {}).build();
}
```

where the `Pageable` is transparently created and passed to us. In Jersey, we can do this with 
a `ValueFactoryProvider`, which is the SPI we need to implement to tell Jersey that we want to create 
an injectable method parameter. The following is an implementation we can use for the `Pageable`

```java
public class PageableValueFactoryProvider implements ValueFactoryProvider {

    private final ServiceLocator locator;

    @Inject
    public PageableValueFactoryProvider(ServiceLocator locator) {
        this.locator = locator;
    }

    @Override
    public Factory<?> getValueFactory(Parameter parameter) {
        if (parameter.getRawType() == Pageable.class
                && parameter.isAnnotationPresent(Pagination.class)) {
            Factory<?> factory = new PageableValueFactory(locator);
            return factory;
        }
        return null;
    }

    @Override
    public PriorityType getPriority() {
        return Priority.NORMAL;
    }

    private static class PageableValueFactory
            extends AbstractContainerRequestValueFactory<Pageable> {

        @QueryParam("page") @DefaultValue("0") Integer page;
        @QueryParam("size") @DefaultValue("3") Integer size;
        @QueryParam("sort") List<String> sort;

        private final ServiceLocator locator;

        private PageableValueFactory(ServiceLocator locator) {
            this.locator = locator;
        }

        @Override
        public Pageable provide() {
            locator.inject(this);

            List<Sort.Order> orders = new ArrayList<>();
            for (String propOrder: sort) {
                String[] propOrderSplit = propOrder.split(",");
                String property = propOrderSplit[0];
                if (propOrderSplit.length == 1) {
                    orders.add(new Sort.Order(property));
                } else {
                    Sort.Direction direction
                            = Sort.Direction.fromStringOrNull(propOrderSplit[1]);
                    orders.add(new Sort.Order(direction, property));
                }
            }

            return new PageRequest(page, size,
                      orders.isEmpty() ? null : new Sort(orders));
        }
    }
}
```

The main method of the `ValueFactoryProvider` SPI, is the `createValueFactory` method

```java
@Override
public Factory<?> getValueFactory(Parameter parameter) {
    if (parameter.getRawType() == Pageable.class
            && parameter.isAnnotationPresent(Pagination.class)) {
        Factory<?> factory = new PageableValueFactory(locator);
        return factory;
    }
    return null;
}
```

In order for Jersey to see if it can handle a method parameter, it will call all the 
`ValueFactoryProvider`s, and call their `getValueFactory` methods. If the `ValueFactoryProvider` 
can handle the parameter, it should return a `Factory`, otherwise it should return null. In our 
implementation we are saying that we can handle parameters of type `Pageable` that are annotated 
with `@Pagination` (which is a custom annotation)

```java
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface Pagination {
}
```

The `PageableValueFactory` is our `Factory` implementation. This will be where we create the `Pageable`

```java
private static class PageableValueFactory
        extends AbstractContainerRequestValueFactory<Pageable> {

    @QueryParam("page") @DefaultValue("0") Integer page;
    @QueryParam("size") @DefaultValue("3") Integer size;
    @QueryParam("sort") List<String> sort;

    private final ServiceLocator locator;

    private PageableValueFactory(ServiceLocator locator) {
        this.locator = locator;
    }

    @Override
    public Pageable provide() {
        locator.inject(this);

        List<Sort.Order> orders = new ArrayList<>();
        for (String propOrder: sort) {
            String[] propOrderSplit = propOrder.split(",");
            String property = propOrderSplit[0];
            if (propOrderSplit.length == 1) {
                orders.add(new Sort.Order(property));
            } else {
                Sort.Direction direction
                        = Sort.Direction.fromStringOrNull(propOrderSplit[1]);
                orders.add(new Sort.Order(direction, property));
            }
        }

        return new PageRequest(page, size,
                orders.isEmpty() ? null : new Sort(orders));
    }
}
```

{% include ads/post-in-article-banner-2.html %}


One interesting thing about `@QueryParam`, `@PathParam` and other `@XxxParam`, is that they can 
also be injected into fields (instead of what you would normally see as method parameters). So here, 
we are injecting them into this `Factory` implementation. A new factory will be created for each request, 
so we don't need to worry about any concurrency issues. The only catch here, is that we need to 
explicitly inject it with the `ServiceLocator`. The reason is that Jersey will not inject it for us.

Now that we have our implementation, the last thing is just to register the provider with Jersey

```java
@ApplicationPath("/api")
public class AppConfig extends ResourceConfig {
    
    public AppConfig() {
        packages("com.example");
        register(new AbstractBinder() {
            @Override
            protected void configure() {
                bind(PageableValueFactoryProvider.class)
                        .to(ValueFactoryProvider.class)
                        .in(Singleton.class);
            }
        });
    }
}
```

And now we can do the following for any resource method that wants the `Pageable`

```java
@GET
public Response getAllCustomers(@Pagination Pageable pageable) {
    List<Customer> customers = repository.findAll(pageable).getContent();
    return Response.ok(new GenericEntity<List<Customer>>(customers) {}).build();
}
```

## Note

Earlier in this article, I mentioned something about HATEOAS and working with the `Page` object. 
The example above doesn't do anything with the `Page` object, and just returns the `List` content. 
Normally when working with pagination, you want to provide details to the client on what the next or 
previous page will be, or whether there _is_ a next, and things like that. This is where HATEOAS comes 
to play. Instead of just returning the list, you may want to provide links to next and previous URLs. 
For instance

```
http://localhost:8080/api/customers

{
  "_links": {
    "next": "/api/customers?page=1&size=5",
      "prev": null
  },
  "content": [ ..first five (default size) results.. ]
}
```

This is just an example. HATEOAS is implemented in different ways. There is not just one correct way. 
I am not going to get into the details, but HATEOAS is definitely something to consider, and research 
to see if it's the right fit for your application.



[spring-data-jpa]: http://docs.spring.io/spring-data/jpa/docs/1.10.6.RELEASE/reference/html/
[spring-jersey-post]: https://psamsotha.github.io/jersey/2015/10/19/why-use-spring-with-jersey.html
[github-project]: https://github.com/psamsotha/jersey-page-sort-example
[jpa-repository]: http://docs.spring.io/spring-data/jpa/docs/current/api/org/springframework/data/jpa/repository/JpaRepository.html
[pageable]: http://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/domain/Pageable.html
[page]: http://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/domain/Page.html
[page-request]: http://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/domain/PageRequest.html