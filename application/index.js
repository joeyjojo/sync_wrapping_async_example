/*
    I have over commented this file for the sake of future me reading this
*/
const express = require('express')
const AWS = require('aws-sdk');
const uuidv4 = require('uuid/v4')
 const app = express()
const port = 3000

// I've used AWS kinesis streams for this example, but the theory should be the same :S
const awsConfig = new AWS.Config({
    region: 'eu-west-2',
    apiVersions: {
        kinesis: '2013-12-02'
    }
});
const kinesis = new AWS.Kinesis(awsConfig);

// our in memory 'database' we use to udnerstand the state of the record
const db = {};

/*
    PDSSendTrace
    Puts a PDS Trace message on a queue
*/
async function PDSSendTrace() {
    // generate a unique id we can use to retrieve the status info from later
    const guid = uuidv4();
    // create the message we want to send
    const event = {
        status: "TRACE_STARTED",
        correlationId: guid
    }
    // aws gunf
    // create a kinesis record
    const record = {
        Data: JSON.stringify(event),
        PartitionKey: "partitionKey-1"
    };
    const recordData = [record];    
    
    try {
        // put it on the appropriate queue
        const result = await kinesis.putRecords({
            Records: recordData,
            StreamName: 'pds_trace_stream_in'
        }).promise();
    } catch (error) {
        console.log(error);
    }
    // return thhe correlation id
    return event;
}

/*
    PDSTraceResult
    Retrieves the result of the pds trace
*/
async function PDSTraceResult(correlationObject) {
    // create a return object based on the correlation id
    let returnObject = {...{}, ...correlationObject};
    // aws gunf
    // get the records
    const stream = await kinesis.describeStream({StreamName: "pds_trace_stream_out"}).promise();
    const shardIterator = await kinesis.getShardIterator({
        ShardId: stream.StreamDescription.Shards[0].ShardId,
        ShardIteratorType: "TRIM_HORIZON",
        StreamName: 'pds_trace_stream_out'
    }).promise();

    let currentShardIterator = shardIterator;
    let notFound = true;
    console.log(`Starting search for ${correlationObject.correlationId}`);
    while (notFound) {                    
        const records = await kinesis.getRecords(shardIterator).promise();
        // with the records update the appropriate ids in the table
        records.Records.forEach((record) => {        
            const event = JSON.parse(new Buffer(record.Data, "base64"));  
            console.log(`...`);
            if (event.correlationId === correlationObject.correlationId) {
                console.log(`Found ${event.correlationId}`);
                returnObject.status = event.status;
                notFound = false;
            }
        })
        currentShardIterator.ShardIterator = records.NextShardIterator;
    }

    // return the one we were interested in
    return returnObject
}

function StoreStatus(statusObject) {
    db[statusObject.correlationId] = statusObject;
    return true;
}

function RetrieveStatus(correlationObject) {
    return db[correlationObject.correlationId];
}

async function sleep(numberOfSecondsToWait) {
    const milliseconds = numberOfSecondsToWait * 1000;
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

app.get('/', async (req, res) => {

    // send trace to PDS
    const correlationObject = await PDSSendTrace();
    const sendTraceStatusSaved = StoreStatus(correlationObject);

    // wait for trace result
    const wait = await sleep(2);

    // get the result out the queue
    const pdsTraceResultObject = await PDSTraceResult(correlationObject);
    const traceResultStatusSaved = StoreStatus(pdsTraceResultObject);
    // render trace result  
    res.send(RetrieveStatus(correlationObject))
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))