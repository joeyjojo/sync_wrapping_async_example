# NOT PRODUCTION CODE
This is not production code. Now we have that over withh

# What is it?
This is an example (rightly or wrongly :S) of making a wrapping a synchronous API around an asynchronous call based around streams.

## application
In the application folder is a sample nodejs app based on express that provides and endpoint that puts a record on a stream ... waits ... then checks a different stream for a matching record

It uses a correlation id propagated across the messages to correlate the two events.

## dependencies
In the dependencies folder is the AWS infrastructure needed to exercise the application, it contains:

- 2 kineses streams one "inbound", one "outbound"
- a lambda to take messages from inbound and put a corresponding message on outbound.

## Running it

### Dependencies
You will need:

- An AWS account and profile that has sufficient privileges to create the infrastructure described above.
- terraform (developed in v0.12.3)
- nodejs (developed in v12.4.0)

## create the infrastructure

```bash

cd dependencies
terraform init
terraform plan
terraform apply
```

## run the app
```bash
cd application
node index.js
```

## open your browser
Ue http://localhost:3000/

And you should have to wait 3 seconds or so ... and then you can see the result.

et voila!