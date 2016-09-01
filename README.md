# Urim
This project started more with the intention of exploring Spring Boot, making web applications with Java, while building something useful, extensible, maintainable and scalable at the same time, than anything else.  It hasn't turned into a monster... yet.

The idea is to have a dashboard that would monitor and display system statistics across multiple remote machines.  There is the basic system client, which will return JSON via REST web service calls.  Then, there is the client that will run any script, and return back any custom JSON response.  The server will read the JSON responses from the client, and render a UI from parsing the results.

### To run the client: 

mvn spring-boot:run -Dspring.profiles.active=client -Dname={system_name}

or

java -jar {rundir}/urim-{xxx}.jar --spring.profiles.active=client --name={system_name}

### To run the server: 

mvn spring-boot:run -Dspring.profiles.active=server -Dname={system_name}

or

java -jar {rundir}/urim-{xxx}.jar --spring.profiles.active=server --name={system_name}

### To run the application with endpoints from both modes turned on:

mvn spring-boot:run -Dname={system_name}

or

java -jar {rundir}/urim-{xxx}.jar --name={system_name}

{rundir} is the directory path containing the jar file.

{xxx} is the version number.

{system_name} is the system's id; can be any custom string.  It is used in the JSON response to tell which system the response is monitoring.



## Setup 

### Prerequisites (version used in parenthesis)
- Java JDK (1.8) - for supporting the application
- MySQL (5.7) - for persisting the data
- MongoDB (3.2) - for storing user settings
- Erlang (18.3) - for supporting RabbitMQ
- RabbitMQ (3.6) - for supporting message queue
- Maven (3.0.5) - for building the Java project

### Instructions
- Install prerequisites.
- Download this project
- Build the project by running "mvn clean install" from the terminal
- Extract the distribution zip file from the target directory (should have been generated in the project from running mvn clean install) to the directory where you want to run the dashboard (rundir)
- Make sure RabbitMQ and MySQL are running; they should be automatically running when installed
- Create a new MySQL schema called "dashboard", a new user "dashboard", with password "dashboard"
- Start up MongoDB by running "mongod -dbpath=rundir", where "rundir" is the directory the distribution zip file was extracted to
- Customize the configuration via config/application-client.properties, config/application-server.properties, or config/application.properties
- Add any script files under the scripts/ directory (be sure to set the execute permission on Linux/Mac OSX systems)
- Run "java -jar rundir/urim-xxx.jar --spring.profiles.active=TYPE --name=NAME", where xxx is the version number, TYPE is either "client" or "server", and NAME can be any string
- In a browser, navigate to "http://localhost:8080"

### Troubleshooting
- "Access denied to user 'dashboard'@'localhost'" - run "FLUSH PRIVILEGES;" in a MySQL console
 

## Architecture
There are two components to this application - the server and the client.  The server runs on any web server that is accessible to users.  Its role is to receive web browser traffic from the user, configure and persist the monitors that are being monitored, and to send and read messages to and from clients.  The client runs on the system that is to be monitored.  Its role is to receive message requests from the server, to run the appropriate script for querying statistics, and to return a valid JSON response.  The server then sends the responses of all the monitors to the user, whose browser then parses the response and renders the monitor using one of the defined chart types.

![Alt text](http://g.gravizo.com/g?
 digraph G {
   Browsers [penwidth=2];
   Clients [penwidth=2];
   Systems [penwidth=2];
   Browsers -> Server [label=set_settings];
   Clients -> Systems [label=get_stats, penwidth=2];
   Server -> Clients [label=REST, penwidth=2];
   Clients -> RabbitMQ [label=MQ, penwidth=2];
   Clients -> Server [label=REST, penwidth=2];
   Clients -> Client_Log [style=dotted];
   Server -> Server_Log [style=dotted];
   Server -> MySQL [label=persist_settings];
   Server -> MongoDB [label=persist_user_settings];
   RabbitMQ -> MongoDB [label=MQ, penwidth=2];
   MongoDB -> Server [label=MQ, penwidth=2];
   Server -> Browsers [label=send_stats, penwidth=2];
   Systems -> Clients [label=stats_response, penwidth=2];
 }
)

The data structure is straightforward.  There are five types of data - User, Dashboard, Monitor, MonitorSetting, and UserSetting.  The first four are stored in MySQL.  Only UserSetting is stored in MongoDB, due to the unexpected nature of what will be persisted in the future.

![Alt text](http://g.gravizo.com/g?
 digraph G {
   rankdir="LR";
   UserSetting [penwidth=2];
   UserSetting -> User;
   User -> Dashboard -> Monitor [label=one_to_many, penwidth=2];
   MonitorSetting -> Monitor;
 }
)



## Configuration
The groundbreaking idea that sets this application above all other dashboards is that the user is able to monitor virtually anything without having to customize and build this application, or extend its classes.  To accomplish this, a few crucial handles are exposed: the name of the script to be run on the client, the chart type, and the output parser.  This allows the user to specify the data (s)he wishes to monitor, set the chart type to appropriately render the information, and then to massage the data so that the chart type can process and render the results.

### Script
The script should be placed in a `scripts` directory that is on the same level as the `.jar` file.  Some examples are present when extracting the distribution `.zip` file.  Currently, Windows `.bat` files and Linux/Mac OSX `.sh` files are supported.  On Linux and/or Mac OSX systems, the executable permission may need to be set explicitly on the script file.

### Chart Type
The chart type includes many various types, which are explained in more detail in the **Chart Types** section.  If none is specified, the raw JSON response will be printed.

### Output Parser
This is an inline JS function that is evaluated every time the monitor response is available.  What is returned here is the value used to update the chart.  Thus, it is the job of this function to return something in a format that is valid to the chart type being used.  Each chart type has a specific format, which is explained in more detail in the **Chart Types** section.  **Note: The maximum length of the output parser is 1023 characters long.**  This number was chosen both as a sane number large enough for accomplishing the job of massaging the data to fit the inputs for the charts, and small enough to not negatively impact performance too much and to discourage potential security exploits (where custom JS is run, there is the potential it can cause harm to the user's system).

### Protocol
There are two main data flows supported by this application - REST and MQ (Message Queue via RabbitMQ).  When REST is selected, the server will periodically send REST webservice requests to clients.  Clients will respond with JSON responses, which will then be sent to the browser.  This is the simplest data flow.  When MQ is selected, the server will periodically send REST webservice requests to clients to start the clients.  Clients will then periodically send messages to the message queue, which the server will listen for.  Once a message appears in the message queue, the server will consume it by parsing the message, and persisting it in MongoDB.  Concurrently, the server will be returning responses found in MongoDB within the last 5 seconds (every 5 seconds) to the browser.  With MQ, the data flow is significantly more complex, with quite a few extra moving pieces, as follows: 
- Every time a client receives a start REST request to start the MQ, the client will send a maximum of 10 messages before stopping.  
- In order to keep the client running, the server sends periodic start REST requests every four messages, which will restart the client's remaining message count.
- Messages older than 1 minute old are cleared from MongoDB.


