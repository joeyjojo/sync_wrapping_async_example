const AWS = require("aws-sdk");
const awsConfig = new AWS.Config({
    region: 'eu-west-2',
    apiVersions: {
        kinesis: '2013-12-02'
    }
});
const kinesis = new AWS.Kinesis(awsConfig);

exports.handler = (event, context, callback) => {
  var params = {
    Records: event.Records.map(record => {
      let event = JSON.parse(new Buffer(record.kinesis.data, "base64"));
      event.status = "TRACE_COMPLETED";
      return {
        Data: JSON.stringify(event),
        PartitionKey: "1"
      };
    }),
    StreamName: "pds_trace_stream_out"
  };

  console.log(params);

  kinesis.putRecords(params, (err, data) => {
    if (err) {
      console.log("ERROR!");
      console.error(err);
      callback(`There was an error. ${err}`);
    } else {
      console.log("SUCCESS!");
      callback(null, "Completed successfully");
    }
  });
};
