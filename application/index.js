const express = require('express')
const app = express()
const port = 3000

function PDSSendTrace() {
    // put pds message trace message on queue
    // return correlation id
    return {
        correlationId: "12345-678910-1112131415",
        status: "TRACE_STARTED"
    }
}

function PDSMonitorStatusChange(statusObject) {
    // monitor for any change to status
    return {
        correlationId: "12345-678910-1112131415",
        oldStatus: "TRACE_STARTED",
        newStatus: "TRACE_COMPLETED"
    }
}

function PDSGetResult(statusObject) {
    return {
        correlationId: "12345-678910-1112131415",
        status: "TRACE_COMPLETED"
    }
}


app.get('/', (req, res) => {

    // send trace to PDS
    const correlationObject = PDSSendTrace()
    // wait for trace result
    const statusChange = PDSMonitorStatusChange(correlationObject)
    // render trace result
    const newStatus = PDSGetResult(correlationObject);

    res.send(newStatus)
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))