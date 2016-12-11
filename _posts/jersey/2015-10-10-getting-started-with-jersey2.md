---
layout: post
title:  "Getting Started with Jersey 2"
categories: jersey
description: "Quickly create a running Jersey 2 application from scratch"
featured: true
thumb: train-station
tags: jersey jersey-2.0
---

This is my first blog. But I truly felt the need to write it after seeing so many people struggling just to get a Jersey application up and running.

Jersey is the reference implementation for the [JAX-RS specification](https://jax-rs-spec.java.net/). Currently there are two major specification versions, 1 and 2. Jersey also currently is at a major level of 2.x. Jersey 1.x works with the JAX-RS 1.0/1.1 spec, while Jersey 2.x works with the JAX-RS 2.0 spec. These two versions are incompatible. On Stackoverflow, I often see people mixing and matching jars/dependencies, not really knowing what is required to get a Jersey app up and running. They seem to be taking different pieces of different tutorials, throwing them together, hoping that it'll stick..

What I will do here is try and break down the basic requirements to get a Jersey 2.x (I will work with the latest version - as of this writing - 2.16) app up and running, and explain some basics of a Jersey app, as well as get into some tools I use when working with Jersey.

### Requirements (mostly optional)

* **Maven** - I know some are already turned off by this, as some don't know Maven. So I'll leave this requirement as optional. I will have an image showing all the jars that are pulled in by Maven, so those that don't know Maven, can go searching for the jars. It's not a fun task, that's why I suggest learning Maven, if you don't already know it.
* **[cURL](http://curl.haxx.se/)** - cURL is a command line tool that I use all the time, while developing Jersey applications. It allows you to make HTTP requests from the command line, as well as work with other protocols, other than just HTTP. See the link for download and installation instructions, as well as some user guides. I will do my best to explain the commands I use here.
* **Netbeans or Eclipse** - Again these are optional, but I will go through steps on how to easily get started with a Jersey app, using these IDEs, so it would help.

### What I'm Going to Cover

* **[Getting Started](#gettingStarted)**
    * [With Netbeans](#netbeans)
    * [With Eclipse](#eclipse)
    * [From Command Line](#commandLine)
* **[Explaining Source Code and Configuration](#sourceCode)**
    * [Jersey Configuration](#jerseyConfig)
    * [Running the Application](#runApp)
* **[Adding Additional Features](#addFeatures)**
    * [Adding JSON Support](#jsonSupport) 

<a name="gettingStarted"></a>

### Getting Started

* [Netbeans](#netbeans)
* [Eclipse](#eclipse)
* [Command Line](#commandLine)

What I will do here is just show how easy it is to start a simple Jersey project, assuming you are using Maven. If you aren't using Maven, then set up may be a little more painful, and you may not be able to follow along so well. That being said, the IDEs I will be using have plugins for Maven support, and most likely, if you installed anything more than the basic distribution, it should already come with Maven support, so you may still be able to following along, not knowing anything about Maven.

If you don't want to use Maven at all, then you can still see images (below) of the all the jars you will need. You can get most of the Jersey jars [here](https://jersey.java.net/download.html). Click the link that says "Jersey JAX-RS 2.0 RI bundle", which should include all the Jersey jars in the tutorial. As for the Jackson jars, you can download them [here](http://mvnrepository.com/artifact/com.fasterxml.jackson.jaxrs/jackson-jaxrs-json-provider). Just download them one by one. Click the version link, then you should see a link to download. You can search for all of them in the search bar.

<a name="netbeans"></a>

#### With Netbeans

1. Go to `File` &rarr; `New Project` &rarr; `Select "Maven"` &rarr; `Select "Project from Archetype"` &rarr; `Next`

    ![image 1][1]

[1]: https://www.dropbox.com/s/snsp28ib19n0uxg/img01.png?dl=1

2. In the dialog search bar, type `jersey-quickstart-webapp`. There will be two different ones. One for Jersey 1 and one for Jersey 2. We will select the Jersey 2 one, with the groupId `org.glassfish.jersey.archetypes`. Also change the Version to 2.16, then hit <kbd>Next</kbd>

    ![image 2][2]

[2]: https://www.dropbox.com/s/u8z3ctee3oma4u1/img02.png?dl=1


3. Then type the project name (I will use `jersey-getting-started`), the location to save the project, and the Maven coordinates, then hit <kbd>Finish</kbd>

    ![image 3][3]

[3]: https://www.dropbox.com/s/g4vgvdjf7inkv3m/img03.png?dl=0=1

4. You should now see a project structure like this below. This is a fully functional Jersey application. That's all there is to it.
<a name="depsImg"></a>

    ![image 4][4]

[4]: https://www.dropbox.com/s/szuftdlws8koucb/img04.png?dl=1

You can now jump to [Explaining Source Code and Configuration](#sourceCode)

<a name="eclipse"></a>

#### With Eclipse

1. Go to `File` &rarr; `New` &rarr; `Other`

2. In the dialog, select the `Maven` file the `Maven Project`, then <kbd>Next</kbd>

    ![image 8][8]

[8]: https://www.dropbox.com/s/gg0melyx6qnore9/img08.png?dl=1

3. In the next dialog keep all the defaults, and hit <kbd>Next</kbd>

    ![image 5][5]

[5]: https://www.dropbox.com/s/duxsds6s1r12m76/img05.png?dl=1

4. In this next dialog we will select the Maven archetype. In the search box, type `jersey-quickstart-webapp`. All the archetypes takes a few moments to load. You can see the progress at the bottom right of the IDE is they are still loading. This shouldn't take more than maybe 5 seconds. If you are not seeing any results come up from the search, then it's likely you don't have the archetypes installed. See [this Stackoverflow answer](http://stackoverflow.com/a/29116241/2587435) for how you can get the archetypes.

    Once the archetypes load, and you see the `jersey-quickstart-webapp` in the results list, uncheck "Show the last version of Archetype only". I made a mistake above stating that the latest version of Jersey is 2.16. As of this writing, it's actually 2.17. So to stay consistent with the Netbeans getting started, I will use 2.16 here. So once you have unchecked that, you should see more version available. Scroll down to the `org.glassfish.jersey.archetypes` and select the version 2.16. Then hit <kbd>Next</kbd>

    ![image 6][6]

[6]: https://www.dropbox.com/s/ppzderuqwbq7csp/img06.png?dl=1

5. In the next dialog, enter the groupId, artifactId, and package, then hit <kbd>Finish</kbd>

    ![image 7][7]

[7]: https://www.dropbox.com/s/ted8wznt4g8erg7/img07.png?dl=1


6. You should now see a project with the following structure. There will be an error in the project because of you jsp page. We have no use for it here, so you can delete it if you want. This should get rid of the error.

    ![image 9][9]

[9]: https://www.dropbox.com/s/xsbb7zty1dbkwru/img09.png?dl=1


You can now jump to [Explaining Source Code and Configuration](#sourceCode)

<a name="commandLine"></a>

#### From Command line

You need to have Maven installed on your system to be able to issue these commands. This should all be types on one line (without the `\`s)

```bash
mvn archetype:generate \
	-DarchetypeArtifactId=jersey-quickstart-webapp \
	-DarchetypeGroupId=org.glassfish.jersey.archetypes \
	-DinteractiveMode=false \
	-DgroupId=com.underdog.jersey \
	-DartifactId=jersey-getting-started \
	-Dpackage=com.underdog.jersey \
	-DarchetypeVersion=2.16
```

You should see the archetype being created. If you look at the contents, you should be able to navigate a project structure similar to the ones you see in the above images in the IDE sections.

<a name="sourceCode"></a>

### Explaining Source Code and Configuration

<a name="jerseyConfig"></a>

#### Jersey Configuration

* [pom.xml](#pom)
* [web.xml](#webxml)
* [Resource class](#resource)

<a name="pom"></a>

##### pom.xml
Now let's look at some of the source. Lets look at the pom.xml first. You should find this in the project root. We'll go through it piece by piece

```xml
<build>
    <finalName>jersey-getting-started</finalName>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>2.5.1</version>
            <inherited>true</inherited>
            <configuration>
                <source>1.7</source>
                <target>1.7</target>
            </configuration>
        </plugin>
    </plugins>
</build>
```

You will normally find this plugin in a Maven project. This is the plugin maven uses to compile our source code. Maven is built around plugins, and we use these plugins for different aspects of our builds. Maven projects come equipped with some default implicit plugins, that we don't need to declare in our pom.xml file. This is one of those plugins. The reason that it _is_ declared here, is to override the default source and target version, which is (Java) 1.5. If we wanted to compile against Java 8, then we would change the source and target to 1.8. 1.7 is fine for now, so we'll leave it.

Let's add one thing to this. A plugin that allows us to run our web app in an embedded Jetty container. I use this plugin all the time for development. I find that it speeds things up for me. So add the following between `<plugins>` and `<plugin>`

```xml
<build>
    <finalName>jersey-getting-started</finalName>
    <plugins>
        <plugin>
            <groupId>org.eclipse.jetty</groupId>
            <artifactId>jetty-maven-plugin</artifactId>
            <version>9.2.4.v20141103</version>
            <configuration>
                <scanIntervalSeconds>5</scanIntervalSeconds>
            </configuration>
        </plugin>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
        ...
```

We will see this plugin in action later. Notice the `<scanIntervalSeconds>5</scanIntervalSeconds>`. This is useful, as it scan out project every 5 seconds for any changes. Saved changes to Java source code will be recompiled (or compiled in the case of added classes) and the container will restart. Depending on the size of the project, restart relatively doesn't take too long. If you don't want this behavior, then you can just change the 5 to 0 or just completely remove the element. If you do this, then you will need to stop and start the container yourself when you want to view changes.

Now let's look at the dependencies.

```xml
  <dependencyManagement>
      <dependencies>
          <dependency>
              <groupId>org.glassfish.jersey</groupId>
              <artifactId>jersey-bom</artifactId>
              <version>${jersey.version}</version>
              <type>pom</type>
              <scope>import</scope>
          </dependency>
      </dependencies>
  </dependencyManagement>

  <dependencies>
      <dependency>
          <groupId>org.glassfish.jersey.containers</groupId>
          <artifactId>jersey-container-servlet-core</artifactId>
          <!-- use the following artifactId if you don't need servlet 2.x compatibility -->
          <!-- artifactId>jersey-container-servlet</artifactId -->
      </dependency>
      <!-- uncomment this to get JSON support
      <dependency>
          <groupId>org.glassfish.jersey.media</groupId>
          <artifactId>jersey-media-moxy</artifactId>
      </dependency>
      -->
  </dependencies>
```

First look at the `<dependencyManagement>`. You can see that it uses a BOM (Bill of Materials) `jersey-bom`. For those unfamiliar with what a BOM is, it's basically a list of dependencies and project modules that are used with the main project (in this case the Jersey project). One benefit of using it is that we don't need to worry about versions. If the artifact is included in the BOM, then it's version is known to us (or Maven), so we don't need to specify the version when we declare the out dependencies. This helps to avoid using incompatible versions of any dependencies.

Let's look at the only dependency this project uses.

```xml
<dependency>
    <groupId>org.glassfish.jersey.containers</groupId>
    <artifactId>jersey-container-servlet-core</artifactId>
    <!-- use the following artifactId if you don't need servlet 2.x compatibility -->
    <!-- artifactId>jersey-container-servlet</artifactId -->
</dependency>
```

If you know Maven, then you know that artifacts have transitive dependencies, meaning that it depends on other artifacts. This particular artifact will pull in all the required artifacts to get a Jersey app running. You can see in [the image above](#depsImg) that 16 jars are pulled in, by this one dependency. 

Now look at the commented out section in the above dependency. It says that if we don't need Servlet 2.x support, we should use the `jersey-container-servlet` instead. So let's do that. The Jetty plugin we will be using is a Servlet 3 container. The benefit of using the other dependency is that it comes equipped with a [`ServletContainerInitializer`](http://docs.oracle.com/javaee/7/api/javax/servlet/ServletContainerInitializer.html) (which is a Servlet 3 pluggability interface) implementation, which creates a Jersey servlet for us, so we can get away with using _no_ web.xml (discussed below), and our app will still work fine. So change the dependency to this 

```xml
<dependency>
    <groupId>org.glassfish.jersey.containers</groupId>
    <artifactId>jersey-container-servlet</artifactId>
</dependency>
```

The other commented out dependency, we will back to later. Let's look at the web.xml now.

<a name="web.xml"></a>

##### web.xml

The web.xml file is located in the `WEB-INF` folder.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app version="2.5" 
         xmlns="http://java.sun.com/xml/ns/javaee" 
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
         xsi:schemaLocation="http://java.sun.com/xml/ns/javaee 
         http://java.sun.com/xml/ns/javaee/web-app_2_5.xsd">
    <servlet>
        <servlet-name>Jersey Web Application</servlet-name>
        <servlet-class>org.glassfish.jersey.servlet.ServletContainer</servlet-class>
        <init-param>
            <param-name>jersey.config.server.provider.packages</param-name>
            <param-value>jersey.getting.started</param-value>
        </init-param>
        <load-on-startup>1</load-on-startup>
    </servlet>
    <servlet-mapping>
        <servlet-name>Jersey Web Application</servlet-name>
        <url-pattern>/webapi/*</url-pattern>
    </servlet-mapping>
</web-app>
```

JAX-RS applications run in a web application packaged in a .war, which gets deployed to a Servlet container or a Java EE Server. Jersey can also be deployed to a Http server like Grizzly, but that is out side the scope of this tutorial. That being said, when run as a web application, it needs a servlet for the servlet container to map to. In the case of Jersey, we have the `ServletContainer`, which you can see configured above. You can also see the URL mapping to this servlet, which is `/webapi/*`. So when requests come in to the servlet container, the container will match our `ServletContainer` to the request URL, and send the request to our Jersey application. Then our application will handle the request.

Another part of the web.xml configuration is the `<init-param>` `jersey.config.server.provider.packages`. This tell Jersey to scan the package in the `<param-value>` for classes annotated with `@Path` and `@Provider`. The `@Path` annotated classes, are our resource classes (which we will see later), and `@Provider` annotated classes are other not resource classes, like filters, interceptors, `MessageBodyReader`s (will be discussed later) and such.

<a name="resource"></a>

##### Resource class

Now let's get into the last bit of source code to discuss, the resource class.

```java
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

@Path("myresource")
public class MyResource {

    /**
     * Method handling HTTP GET requests. The returned object will be sent
     * to the client as "text/plain" media type.
     *
     * @return String that will be returned as a text/plain response.
     */
    @GET
    @Produces(MediaType.TEXT_PLAIN)
    public String getIt() {
        return "Got it!";
    }
} 
```

The `@Path` annotation defines the URL path mapping for this particular resource class. Currently what we have seen so far is the URL mapping for our application, inside the web.xml, which is `/webapi/*`. So the full path that would map to this resource class would be

    http://localhost:8080/<context-path>/webapi/myresource

`<context-path>` will be the context path for the application specified at the server level. In the case of the Jetty Maven plugin we will be using, the default context path is `/`. So the URL will be using to map to this resource is 

    http://localhost:8080/webapi/myresource

A couple other things you will notice is the `@GET` annotation, and the `@Produces` annotation. `@GET` simply means that the method is only accessible to HTTP GET requests. Each method can only be mapped to one HTTP method (e.g. POST, PUT, DELETE, GET). The produces annotation means that the method only produces plain text. This is important for [Content Negotiation](http://en.wikipedia.org/wiki/Content_negotiation). If the client sends a request to this URL and specifies an `Accept` header, that does not match `text/plain` (which is the String equivalent of `MediaType.TEXT_PLAIN`), the server should send a response with a status code of 406 Not Acceptable.

Now let's run the application to test it out.

<a name="runApp"></a>

#### Running the Application

When developing Jersey applications, as discussed earlier, I tend to use the Jetty Maven plugin. We can run our web app from the command line, simply by using the command

```bash
mvn jetty:run
```

Personally, even though developing in the IDE, I tend to run the app/plugin through the command line. But I'll first go through how you can do this in the IDE. First I'll start with Netbeans (or skip to [Eclipse](#runEclipse) or [Command Line](#runCL)).

##### Netbeans

From Netbeans, you can Right click on the project to open the context menu, then go to [`Custom`] &rarr; [`Goals`].

In the dialog type `jetty:run`

![image 10][10]

[10]: https://www.dropbox.com/s/c84qv3j4isuwrqq/img10.png?dl=1

You should see the output window open, and Maven is building the project, and the plugin should start. Once it's finished starting, you should see this in the output window. (You can stop it by hitting the red stop button on the left)

![image 11][11]

[11]: https://www.dropbox.com/s/kzilyl5v1dfr9sf/img11.png?dl=1


That means our application has launched, and we are ready to access the URL. You can proceed to [Testing](#testing)

<a name="runEclipse"></a>

##### Eclipse

From Eclipse, right click on the project, in the context menu go to [`Run As`] &rarr; [`Maven Build`]

In the dialog type `jetty:run` in the `goals` text field. Then click <kbd>Run</kbd>. You should see the console window open an the Maven build beginning, then the Jetty server should start. Once it's done loading, you should see

![image 12][12]

[12]: https://www.dropbox.com/s/4kd6pne3txwqt87/img12.png?dl=1

Now you are ready to access the URL. You can proceed to [Testing](#testing)

<a name="runCL"></a>

##### Command Line

For the command line, simply `cd` to the directory of the project, then run `mvn jetty:run` command, you should see the build start and when the server starts, you should see something similar to 

![image 13][13]

[13]: https://www.dropbox.com/s/rjhrhrfkeeeuj2r/img13.png?dl=1

We can now [Test](#test)

#### Testing

At this point, the application should be up and running. And if you remembered from the earlier, the URL we should use to access our resource is

```bash
http://localhost:8080/webapi/myresource
```

So assuming you have installed cURL, as recommended in the beginning, use this following cURL command (from another command window)

```bash
curl -v http://localhost:8080/webapi/myresource
```

And you should see something similar to 

![image 14][14]

[14]: https://www.dropbox.com/s/8az6jqo0wqlmdwb/img14.png?dl=1

<a name="addFeatures"></a>

### Adding Additional Features

<a name="jsonSupport"></a>

#### Adding JSON Support

If you've ever working with a JSON/POJO framework/library like Jackson, you know that JSON/POJO mapping is pretty common practice. For example say we have this JSON

```json
{
  "firstName": "Paul",
  "lastName": "Samsotha"
}
```

In the POJO Mapping, we would map the `firstName` and `lastName` JSON fields to POJO properties. So we could have
	
```java
public class Person {
    private String firstName;
    private String lastName;
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
}
```

Naming convention is very important here. The Beans should follow [JavaBean Naming Convention](https://en.wikipedia.org/wiki/JavaBeans#JavaBean_conventions).

With Jackson, to convert the JSON to `Person` we would to

```java
Sting json = aboveJson;
Person person = new ObjectMapper().readValue(json, Person.class);
```

And to convert the `Person` object back to JSON, we could do

```java
String serialized = new ObjectMapper().writeValueAsString(person);
```

In a nutshell, that's how POJO binding works. 

Now let's take that concept and try and make it work with Jersey. Let's add the following method into our `MyResource` class

```java
@Path("myresource")
public class MyResource {

    @GET
    @Path("person")
    @Produces(MediaType.APPLICATION_JSON)
    public Person getPerson() {
        Person p = new Person();
        p.setFirstName("Paul");
        p.setLastName("Samsotha");
        return p;
    }
}
```

Here's we are saying that the URI to access this endpoint should be `../myresource/person` and that this endpoint can only produce `application/json` MIME type. We return the `Person` object, and hopefully Jersey will convert it to the JSON above.

If you left the `<scanIntervalSeconds>5` above in the pom.xml file, then after saving, the Jetty plugin server should restart. If you removed it, then just `ctrl+c` to stop the server, and start it again with the same `mvn jetty:run`.

Now from the other terminal we can issue the cURL command to try and access this new end point.

```bash
D:\>curl -v http://localhost:8080/webapi/myresource/person
> GET /webapi/myresource/person HTTP/1.1
> Accept: */*
...
< HTTP/1.1 500 Internal Server Error
...
```

You'll see here in the cURL terminal that we get a 500 serve error. If we look at the server terminal, we will see the error logged

```bash
SEVERE: MessageBodyWriter not found for media type=application/json,
        type=class jersey.getting.started.Person 
        genericType=class jersey.getting.started.Person.
```

To understand what is happening here we need a better understanding of how Java object conversion/serialization is done in Jersey. Just as an example let say we have this

```java
@GET
@Produces("application/octet-stream")
public File getSomeFile() {}
```

Now we don't want to set the Java `File` object to the client. We want it to be serialized to the MIME type `application/octet-stream`, that way the client knows how to deserialize it, based on the `Content-Type`. Likewise, with the previous example, we don't want the Java `Person` object to be set to the client, we want the JSON representation of it sent to the client.

To handle conversion, Jersey (and JAX-RS) uses the concept of [`MessageBodyWriter`](http://docs.oracle.com/javaee/7/api/javax/ws/rs/ext/MessageBodyWriter.html) to handle outbound conversion and [`MessageBodyReader`](http://docs.oracle.com/javaee/7/api/javax/ws/rs/ext/MessageBodyReader.html) to handle inbound conversion, for example

```java
@POST
@Consumes("application/json")
public Response createPerson(Person person) {}
```

Here, the incoming JSON should be deserialized into `Person`. For more information about the reader and writer, see [JAX-RS Entity Providers](https://jersey.java.net/documentation/latest/message-body-workers.html). If we created our own writer, it might look something like

```java
@Produces("application/json")
public class PersonBodyWriter implements MessageBodyWriter<Person> {
 
    @Override
    public boolean isWriteable(Class<?> type, Type genericType,
                               Annotation[] annotations, MediaType mediaType) {
        return type == Person.class;
    }

    // parsing `writeTo` method
```

On start-up, all the readers and writers are put into a registry. During the Jersey request processing, when it encounters a `Person` return object in which it should convert to `application/json`, it will look through the registry for a writer that returns true for `isWriteable` and produces `application/json`. If we were to register the above the writer, then we would no longer get the error we originally got.

That being said, we of course don't want to have to write a reader and writer for all of our model type. Fortunately, there are JSON/POJO frameworks out there that already implement a generic reader and writer that we can use. If you look back in the pom.xml file, you will see this commented out.

```xml
<!-- uncomment this to get JSON support
<dependency>
    <groupId>org.glassfish.jersey.media</groupId>
    <artifactId>jersey-media-moxy</artifactId>
</dependency>
-->
```

This is the dependency for the MOXy JSON support. MOXy is OK, but me personally I prefer to use Jackson. So instead of un-commenting the above dependency, add this one

```xml
<dependency>
    <groupId>org.glassfish.jersey.media</groupId>
    <artifactId>jersey-media-json-jackson</artifactId>
</dependency>
```

The cool thing about this dependency is that we don't need to do anything else. The writer/reader will be automatically registered. If you are not Using Maven, see this [Stackoverflow answer](http://stackoverflow.com/a/32412830/2587435) for the jars you need and where you can get them.

Now if we restart the server, and access the same endpoint, we should now see the JSON result

```bash
D:\>curl -v http://localhost:8080/webapi/myresource/person
> GET /webapi/myresource/person HTTP/1.1
...
< HTTP/1.1 200 OK
< Date: Sun, 11 Oct 2015 04:25:05 GMT
< Content-Type: application/json

{"firstName":"Paul","lastName":"Samsotha"}
```

Now let's try to POST some data. Add this method into the `MyResource` class

```java
@POST
@Path("person")
@Produces(MediaType.APPLICATION_JSON)
public Person createPerson(Person person) {
    return person;
}
```

Wait for the server to reload or restart it. The from the cURL terminal make the following command.

```bash
D:\>curl -v -X POST http://localhost:8080/webapi/myresource/person 
            -H "Content-Type: application/json" 
            -d "{\"firstName\":\"Paul\", \"lastName\": \"Samsotha\"}

> POST /webapi/myresource/person HTTP/1.1
> Content-Type: application/json
...
< HTTP/1.1 200 OK
< Date: Sun, 11 Oct 2015 04:36:13 GMT
< Content-Type: application/json
<
{"firstName":"Paul","lastName":"Samsotha"}
```

Here we are POSTing the JSON data and we get the same JSON data back. We set the `Content-Type` header to `application/json` so that Jersey knows what type of data it is and so it can find the right `MessageBodyReader` to handle it. It will find the Jackson provider to handle it and Jackson deserializes it for us into `Person`, and Jersey passes the `Person` into our resource method.

I've gone through a lot in this blog, but these two things are the most common problems I see people having on Stackoverflow; Getting started and handling JSON. So I thought I'd give a thorough explanation of how to get started with both.


