---
layout: post
title: "Why and How to Use Spring With Jersey?"
description: "Some benefits of why we should use Spring with Jersey, along with some examples."
categories: jersey
category: jersey
thumb: walkway-bridge
tags: spring jersey
---

I've seen a few question on Stack Overflow where people are confused about the difference between Jersey and Spring MVC, and I thought it would be a good opportunity to try and demystify some of the confusion. In this article I will first go through some analysis on why we should (or shouldn't) mix the two frameworks, then I will get into some example implementation.

### Table of Contents:

* [WHY?](#why)
* [Implementation](#impl)
	* [Maven Dependencies](#mavenDeps)
	* [Basic Configuration](#config)
	* [Component Implementation](#compImpl)
	* [Running and Testing with cURL](#runTest)


{% include ads/in-article-ad.html %}


<a name="why"></a>

## WHY?

So why use Spring with Jersey? First notice the careful naming of the title. It's not "Using Jersey with Spring". That title would imply a Spring application integrating Jersey, while the current title implies integrating Spring into a Jersey application. It's a subtle difference as far as the title is concerned, but a difference that should be acknowledged for this discussion. An article on "integrating Jersey into Spring" might be more aimed at Spring users that would like to learn Jersey, and may give some tutorial on beginning Jersey stuff. This article is not that. This article assumes you know Jersey, and are thinking about integrating Spring into your Jersey application.

Now to answer the question of "why integrate?", it helps to look at an application architecture from the three-tier view. Anyone who's had any experience creating an enterprise web application should be familiar with this architecture. It is basically modeled as shown below

![three-tier][1]

[1]: https://www.dropbox.com/s/cwmgq0oex7p3ldl/three-tier.png?dl=1

In a web application, the Presentation Layer would normally consist of the view/controller layer in an MVC framework. The Business Layer would consist of the business services and the Persistence Layer would consist of the repositories (or DAOs) that interact with the Database. No layer can interact with the above layer, and each layer only interacts with the layer below it. In code form, it might translate to something like

```java
public class Controller {
    private CusotomerService customerService;
}

public class CustomerService {
    private CustomerRepositoty customerRepository;

    public Customer findCustomer(long id) {
          return customerRepository.findById(id);
      }
}

public class CustomerRepository {
    private EntityManager em;

    public Customer findById(long id) {
        return em.find(Customer.class, id):
    }
}
```

The `Controller` is part of the presentation layer, the `CustomerService` is in the business layer, and the `CustomerRepository` is in the persistence layer. As you can see, the constraints I described above are maintained in this example. The presentation layer only interacts with the business layer, the business layer only interacts with the persistence layer, and the persistence layer only interacts with the database. 

In this example, the business layer and persistence layer may seem redundant, but in a real application, the service layer also handles the business logic of the domain, not just a simple "find data", but  also "do manipulate data". The persistence layer should only be concerned with database interactions, and not with any business logic.

So back to the topic at hand. In a REST application, there _is_ no presentation layer. But does that mean that this architecture doesn't apply to REST applications? Absolutely not. We should still adhere to this separation of concerns in REST applications. It is just good design.

So with that being said, we can say that instead of a presentation layer, the presentation layer is replaced with a "REST interface layer" or "REST layer". AFAIK there is no such term widely used, it's just something I made up for the sake of this discussion.

With Spring, its REST layer is implemented in its MVC framework. The MVC framework is widely know for its MVC capabilities with the use of controllers. But with a little tweaking of the controllers and the annotations used, the controllers can easily become a REST controller, where instead of return models and views, you are return RESTful representation objects.

So Spring already comes with REST support. What my time on Stack Overflow has shown me, is that there is not a lot of enthusiasm from established Spring users to learn and/or switch over to using Jersey as the REST layer, even though you can use Spring components (business, persistence) with a Jersey application. And it makes sense. Why learn a different framework, when the one I am using and am comfortable with using, works just fine? So that is part of the reasoning behind why I specifically made this article about integrating Spring with Jersey and not the other way around. 

Really there is no difference in implementation. Integrating Spring with Jersey and integrating Jersey with Spring mean the same thing as far as code is concerned. I am pretty much just giving an analysis to answer the question (which I've seen a few times on Stack Overflow), "As a Spring user, why should I learn Jersey?" Answer - If you don't want to... Don't. If you're comfortable with implementing REST controllers with Spring, then more power to you. Stick with what you know. The only answer I could give that makes any sense to "why" is "it doesn't hurt to learn new things."

So now let's try and answer the question "Why integrate Spring into Jersey?". The core features of Spring are Dependency Injection and AOP. But Jersey already has a Dependency Injection framework in [HK2][2]. And HK2 has support for AOP. So the core of Spring wouldn't be the reason we would want to integrate. But then we get to the persistence layer. Spring has great persistence support. For example with Spring Data, we get free support for common CRUD operations, without having to implements a single method. For example all we need is this

```java
public interface CustomerRepository implements JpaRepository<Customer, Long> {}
```

Notice that it's just an `interface`. We don't need to create a concrete class. That's it, and we get nearly 20 free methods that handle normal CRUD operations. Here are some to name a few

* `List<Customer> findAll()`
* `Customer findOne(Long id)`
* `Customer save(Customer c)`
* `void delete(Customer c)`

And there are more. You can view all of the in [the javadocs][3]. Let's say we want to find `Customer`s by `firstName`. All we do is declare a method in the interface

[2]: https://hk2.java.net/2.4.0-b07/
[3]: http://docs.spring.io/spring-data/jpa/docs/current/api/org/springframework/data/jpa/repository/JpaRepository.html

```java
public interface CustomerRepository implements JpaRepository<Customer, Long> {
    List<Customer> findByFirstName(String firstName);
}
```

Spring Data uses a domain specific language that parses the method signature. As long as we follow the rules, there are unlimited possibilities with the method signatures. And we never have to implement anything. Spring data handles all of it under the hood. 

Also we get transaction support in a declarative way. If you were to try an implement your own DAO layer in Jersey, you might find alot of this all over the place

```java
public Customer save(Customer c) {
    entityManager.getTransaction().begin();
    entityManager.perist(c);
    entityManager.getTransaction().commit();
    return c;
}
```

We are explicitly handling the transaction ourselves, where with Spring transaction support, we can just declare our _service_ method as `@Transactional`

```java
public class CustomerService {
    public CustomerRepository customerRepository;

    @Transactional
    public Customer save(Customer c) {
        return customerRepository.save(c);
    }
}
```

Spring will transparently handle the transactions in an AOP way.

The example above is for JPA (hence `JpaRepository`), but Spring data has a wide range of other types databases other than relational ones. For instance MongoDB, or Neo4j. Spring Data offer similar repository support. To learn more about the different Spring Data project, you should check out the reference guides in the [Spring Reference Documentations][4].

[4]: http://spring.io/docs/reference

Going through the previous link, you will see that Spring has a rich ecosystem. In a Jersey project, we could bind our service layer to Spring, and from there all those services have access to a wide range of other Spring projects.

So I hope that gives you an idea of why you should consider integrating. If not for the ecosystem, I'd say it's a good argument that simply taking into account the persistence support, that is a good enough reason to consider integrating.

<a name="impl"></a>

## Implementation

So let's get into some implementation. You can find the complete project as [Github][8].

What you will need to make the most of this guide are:

* [cURL][5] - A command line tool that I use as a REST client. You may use a different client, but any other tools usages will be outside the scope of this article.
* [Maven][6] - To build and run the app with the [jetty-maven-plugin][7]

[5]: http://curl.haxx.se/
[6]: https://maven.apache.org/
[7]: http://www.eclipse.org/jetty/documentation/current/jetty-maven-plugin.html

You can clone the project

```java
git clone https://github.com/psamsotha/jersey-spring-example.git
```

Or download it from 

    https://github.com/psamsotha/jersey-spring-example

[8]: https://github.com/psamsotha/jersey-spring-example

What I will cover will be as follows

* [Dependencies](#mavenDeps)
* [Basic Configuration](#config)
* [Component Implementation](#compImpl)
* [Running and Testing with cURL](#runTest)


{% include ads/post-in-article-banner-1.html %}


<a name="mavenDeps"></a>

### Maven Dependencies

So we are creating a new Maven web project. The following dependencies are ones we going to use. Note that there are exclusions in the `jersey-spring3` dependency. We want to replace the Spring 3 dependencies with Spring 4, and also exclude some conflicting bean validation transitive dependencies. The exclusion are  not shown in the following list. Please the pom in the Github project

```xml
<dependencies>
    <dependency>
        <groupId>org.glassfish.jersey.containers</groupId>
        <artifactId>jersey-container-servlet</artifactId>
        <version>${jersey.version}</version>
    </dependency>
    <dependency>
        <groupId>org.glassfish.jersey.media</groupId>
        <artifactId>jersey-media-json-jackson</artifactId>
        <version>${jersey.version}</version>
    </dependency>
    <dependency>
        <groupId>org.glassfish.jersey.ext</groupId>
        <artifactId>jersey-spring3</artifactId>
        <version>${jersey.version}</version>
        <exclusions>
          ...
        </exclusions>
    </dependency>
    <dependency>
        <groupId>org.springframework.data</groupId>
        <artifactId>spring-data-jpa</artifactId>
        <version>1.9.0.RELEASE</version>
    </dependency>
    <dependency>
        <groupId>org.hibernate</groupId>
        <artifactId>hibernate-entitymanager</artifactId>
        <version>5.0.1.Final</version>
    </dependency>
    <dependency>
        <groupId>com.h2database</groupId>
        <artifactId>h2</artifactId>
        <version>1.4.182</version>
    </dependency>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-web</artifactId>
        <version>4.1.7.RELEASE</version>
    </dependency>
    <dependency>
        <groupId>javax.servlet</groupId>
        <artifactId>javax.servlet-api</artifactId>
        <version>3.1.0</version>
    </dependency>
</dependencies>
```

`jersey-spring3` is the dependency that has the Spring integration components. One thing to note about the `jersey-spring3` dependency is that as of this writing, `jersey-spring4` is in the master branch of the Jersey project. So it appears that in the next release Spring 4 will be supported, so we won't need to use `jersey-spring3` with exclusions (unless of course the Spring 4 version is older than the one we want to use). The `jersey-media-json-jackson` is for JSON/POJO support.

For Spring Data JPA, we added the `spring-data-jpa` dependency. This will pull in a bunch of other Spring 4.1.7.RELEASE jars. Then we have `hibernate-entitymanager`, which will be our JPA implementation. `h2` will be out in-memory database we will use for testing.

<a name="config"></a>

### Basic Configuration

Here we will cover both Jersey and Spring. The way we will implement this application is web.xml-less. For Jersey, this will be made possible with the `jersey-container-servlet` dependency. Note that for this to work, the application must be run an Servlet 3.x container. For example Tomcat 7, will work, but Tomcat 6 will not work as it is a Servlet 2.5 container. We will simply be running with the Jetty Maven plugin, which will be a Servlet 3.1 container.

The following is all that we need for Jersey configuration (see the actual project for import statements)

```java
@ApplicationPath("/api")
public class AppConfig extends ResourceConfig {
    
    public AppConfig() {
        packages("com.underdog.jersey.spring.example.resource");
          register(RequestContextFilter.class);
          property(ServerProperties.RESPONSE_SET_STATUS_OVER_SEND_ERROR, true);
    }
}
```

The `@ApplicationPath` annotation works similar to the `<servlet-mapping>` in a web.xml. The `/api` value will the root path of our application. The `packages` method tells Jersey to scan the `com.underdog.jersey.spring.example.resource` package for our resources (classes annotated with `@Path`). The `RequestContextFilter` is provide a bridge between Jersey and the Spring request attributes. The property we set is so that instead of the server sending a server error page on error statuses, it just sends the status code.

For the Spring configuration, we have two different components. The first is the Spring application configuration. For this app this will mostly consist of persistence configuration. (Again see project for import statements)

```java
@Configuration
@EnableTransactionManagement
@ComponentScan("com.underdog.jersey.spring.example.service")
@EnableJpaRepositories("com.underdog.jersey.spring.example.repository")
public class SpringConfig {

    @Bean
    public DataSource dataSource() {
        return new EmbeddedDatabaseBuilder()
                .setType(EmbeddedDatabaseType.H2)
                .addScript("classpath:schema.sql")
                .addScript("classpath:data.sql")
                .build();
    }

    @Bean
    public JpaTransactionManager transactionManager(EntityManagerFactory emf) {
        return new JpaTransactionManager(emf);
    }

    @Bean
    public JpaVendorAdapter jpaVendorAdapter() {
        HibernateJpaVendorAdapter jpaVendorAdapter = new HibernateJpaVendorAdapter();
        jpaVendorAdapter.setDatabase(Database.H2);
        jpaVendorAdapter.setShowSql(true);
        jpaVendorAdapter.setGenerateDdl(false);
        return jpaVendorAdapter;
    }

    @Bean
    public LocalContainerEntityManagerFactoryBean entityManagerFactory() {
        LocalContainerEntityManagerFactoryBean lemfb 
                = new LocalContainerEntityManagerFactoryBean();
        lemfb.setDataSource(dataSource());
        lemfb.setJpaVendorAdapter(jpaVendorAdapter());
        lemfb.setPackagesToScan("com.underdog.jersey.spring.example.domain");
        return lemfb;
    }
}
```

The `@EnableTransactionManagement` is so that we can use annotation driven transaction management, meaning we can just add `@Transactional` onto our service classes/methods.

The `@Component` scan tells Spring to scan the declared package for our Spring service components.

The `@EnableJpaRepositories` tell Spring to scan the declared package for Spring repository extension, i.e. our `CustomerRepository`.

All the `@Bean` implementations are the basic beans that need to be configured to bootstrap JPA persistence support. In order of declaration, we have configured the in-memory database, the transaction manager, the JPA implementation (Hibernate) and the `EntityManagerFactory` for JPA. One thing to note about the in-memory database configuration is that we are using a couple sql scripts to create the table and insert the initial data. You can look in the `src/main/resources` for those files.

The next Spring configuration component we will use is a `WebApplicationInitializer` to bootstrap the Spring components in a xml-less way. The odd looking init-param `("contextConfigLocation", "noop")` is needed to avoid [this bug][10]. To get some explanation about how the `WebApplicationInitializer` works, you can see [this Stack Overflow question][11].

```java
@Order(1)
public class SpringInitializer implements WebApplicationInitializer {

    @Override
    public void onStartup(ServletContext sc) throws ServletException {
        sc.setInitParameter("contextConfigLocation", "noop");
        
        AnnotationConfigWebApplicationContext context
                = new AnnotationConfigWebApplicationContext();
        context.register(SpringConfig.class);
        sc.addListener(new ContextLoaderListener(context));
          sc.addListener(new RequestContextListener());
    } 
}
```

The important thing to note about this components is the `@Order(1)`. We want to make sure this initializer occurs before Jersey tries to create the app context. If we fail to do this, Jersey will look for a `applicationContext.xml` Spring configuration file. When it doesn't find it we will get a `FileNotFoundException`. Since we don't want to use xml configuration, we need to include the initializer.

[10]: https://java.net/jira/browse/JERSEY-2038
[11]: http://stackoverflow.com/q/32550131/2587435

<a name="compImpl"></a>

### Component Implementation

The JPA entity we will use a simple `Customer` class with an `id`, `firstName`, and `lastName`

```java
@Entity
public class Customer {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String firstName;
    private String lastName;
    // Getters and Setters
}
```

Then we have our Spring Data JPA repository.

```java
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    List<Customer> findByFirstNameAndLastName(String firstName, String lastName);
}
```

As discussed earlier, this is nothing more than an interface. We never have to implement this, but with this we get a bunch of free implementations. The only extra method we added, is one to search for `Customer` by their first and last name. This method name follows the Spring Data DSL for method naming convention. We return a `List<Customer>` instead of just a single `Customer`, as it is possible for more than one customer to have the same name. 

In the next component, the service layer component, you can actually see the usage of the repository's "free" methods. I will not show all the method, just for brevity, but you can see the project code for the entire implementation.

```java
@Service
@Transactional
public class CustomerServiceImpl implements CustomerService {
    
    @Autowired
    private CustomerRepository customerRepository;

    @Override
    public List<Customer> findAll() {
        return customerRepository.findAll();
    }

    @Override
    public Customer findOne(Long id) {
        return customerRepository.findOne(id);
    }

    @Override
    public Customer save(Customer customer) {
        return customerRepository.save(customer);
    }

    @Override
    public List<Customer> findByFirstAndLastName(String fname, String lname) {
        return customerRepository.findByFirstNameAndLastName(fname, lname);
    } 
}
```

As you can see the only method we added to the interface was the `findByFirstNameAndLastName`, which we use here in the service class, but also we make use of the free repository methods in out other service methods.

The last application component is the Jersey resource class. I will only show a couple methods. You can find the rest in the project source code. 

```java
@Path("customers")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CustomerResource {
    
    @Autowired
    private CustomerService customerService;
    
    @GET
    public Response getAllCustomers(@QueryParam("firstName") String firstName,
                                    @QueryParam("lastName") String lastName) {
        
        List<Customer> customers;
        if (firstName != null && lastName != null) {
            customers = customerService.findByFirstAndLastName(firstName, lastName);
        } else {
            customers = customerService.findAll();
        }
        return Response.ok(new GenericEntity<List<Customer>>(customers){}).build();
    }
    
    @POST
    public Response createCustomer(Customer customer, @Context UriInfo uriInfo) {
        customer = customerService.save(customer);
        long id = customer.getId();
        
        URI createdUri = uriInfo.getAbsolutePathBuilder().path(Long.toString(id)).build();
        return Response.created(createdUri).build();
    }
}
```

We inject the `CustomerService` into our resource class with the `@Autowired` annotation. The interesting thing about the `getAllCustomers` endpoint is that we include an optional search by first name and last name. If these filter parameters are included, we will call the custom repository's method. If these parameters are missing, we just return all the customers.

In the other resource method, we implement a `POST` to create a customer resource. When customer is created, it gets an id. From that id, we create the new resource URI, and pass it to the `created` method, which will send a `201 Created` status along with a `Location` header with the new resource URI.


{% include ads/post-in-article-banner-2.html %}

<a name="runTest"></a>

## Running and Testing with cURL

In testing our application will will use cURL. For a real application, you will probably also want to include automated JUnit tests, but I consider myself to be a pretty thorough tester, so for me to implement the JUnit tests in this example application would pretty much double the work. And this article is not really about testing. In future articles I may cover testing with Jersey.

What we will do is the following

1. Make a GET to get all the customers
2. Make a GET to get customers by first and last name
3. Create a customer through a POST
4. Make a GET request for the customer we previously created
5. Make a PUT request to  update a customer
6. And finally delete a customer.

First thing you will want to do is start the server. `cd` to the project root, and use the `jetty-maven-plugin` to start the server.

```bash
cd jersey-spring-example
mvn jetty:run
```

**1. Get all Customers**

```bash
C:\>curl -i http://localhost:8080/api/customers
HTTP/1.1 200 OK
Date: Tue, 20 Oct 2015 03:45:15 GMT
Content-Type: application/json
Content-Length: 251

[
  {"id":1,"firstName":"Michael","lastName":"Jordan"},
  {"id":2,"firstName":"Kobe","lastName":"Bryant"},
  {"id":3,"firstName":"Lebron","lastName":"James"},
  {"id":4,"firstName":"Stephan","lastName":"Curry"},
  {"id":5,"firstName":"Carmelo","lastName":"Anthony"}
]
```

In our `data.sql` file you can see that we inserted five customers. So hitting to root `/customers` resource, we get back all five.

**2. Get Customers by First and Last Name**

```bash
C:\>curl -i "http://localhost:8080/api/customers?firstName=Michael&lastName=Jordan"
HTTP/1.1 200 OK
Date: Tue, 20 Oct 2015 03:47:49 GMT
Content-Type: application/json
Content-Length: 52

[
  {"id":1,"firstName":"Michael","lastName":"Jordan"}
]
```

As noted earlier, there may be more than one customer that has the same first name and last name. That's why we return a `List`. You can see that instead of a single JSON object, we get a JSON array, even though it is only one customer.

**3. Create a Customer**

```bash
C:\>curl -i -X POST -H "Content-Type:application/json" 
         -d "{\"firstName\":\"Charles\", \"lastName\": \"Barkley\"}"
         http://localhost:8080/api/customers
HTTP/1.1 201 Created
Date: Tue, 20 Oct 2015 03:53:47 GMT
Location: http://localhost:8080/api/customers/6
Content-Length: 0
```

A couple things to note. I am on Windows, so escaping the double quotes is necessary. On Unix machines, you should be able to use single quotes, so you don't have to escape the double quotes. For example `'{"firstName":"Charles"}'`

Next you can see that instead of return the any data, a `Location` header is returned. That is the URI for the newly created Charles Barley customer resource.

**4. Get Customer by Id**

In the previous step, we created a new customer, and got back a newly created URI, we can now access this URI.

```bash
C:\>curl -i http://localhost:8080/api/customers/6
HTTP/1.1 200 OK
Date: Tue, 20 Oct 2015 03:57:57 GMT
Content-Type: application/json
Content-Length: 51

{"id":6,"firstName":"Charles","lastName":"Barkley"}
```

If you look at the `data.sql` you will see that I inserted the initial data with ids `1, 2, 3, 4, 5`. Since the ids are auto incremented, Charles is created with the new db id of `6`. So just like you can access Charles with the `/5` path, you can access the others with their appropriate ids in the URI.

**5. Update a Customer**

```bash
C:\>curl -i -X PUT -H "Content-Type:application/json" 
         -d "{\"firstName\":\"Michael\", \"lastName\": \"Jackson\"}"
         http://localhost:8080/api/customers/1
HTTP/1.1 204 No Content
Date: Tue, 20 Oct 2015 04:04:53 GMT

C:\>curl -i http://localhost:8080/api/customers/1
HTTP/1.1 200 OK
Date: Tue, 20 Oct 2015 04:05:02 GMT
Content-Type: application/json
Content-Length: 51

{"id":1,"firstName":"Michael","lastName":"Jackson"}
```

Here we are making two separate requests. The first to update the customer at the URI `/1`. Then we GET the same resource to see that it has been updated.

**6. Delete a Customer**
	
```bash
C:\>curl -i -X DELETE http://localhost:8080/api/customers/1
HTTP/1.1 200 OK
Date: Tue, 20 Oct 2015 04:10:45 GMT
Content-Length: 0

C:\>curl -i http://localhost:8080/api/customers/1
HTTP/1.1 404 Not Found
Date: Tue, 20 Oct 2015 04:10:56 GMT
Content-Length: 0
```

Here we made two separate requests. One to delete the customer, and the next try and GET it. We will see in the second request, that the resource is no longer available, so we get a 404.

And that wraps up this article. I hope you all found it informative.




