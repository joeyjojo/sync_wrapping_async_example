provider "aws" {
  profile    = "default"
  region     = "eu-west-2"
}

resource "aws_kinesis_stream" "pds_trace_stream_in" {
  name             = "pds_trace_stream_in"
  shard_count      = 1
}

resource "aws_kinesis_stream" "pds_trace_stream_out" {
  name             = "pds_trace_stream_out"
  shard_count      = 1
}

resource "aws_lambda_event_source_mapping" "pds_in_out" {
  event_source_arn  = "${aws_kinesis_stream.pds_trace_stream_in.arn}"
  function_name     = "${aws_lambda_function.pds_in_out.arn}"
  starting_position = "TRIM_HORIZON"
}

resource "aws_lambda_function" "pds_in_out" {
  filename      = "pds_trace.zip"
  function_name = "pds_in_out"
  role          = "${aws_iam_role.iam_for_lambda.arn}"
  handler       = "index.handler"

  # The filebase64sha256() function is available in Terraform 0.11.12 and later
  # For Terraform 0.11.11 and earlier, use the base64sha256() function and the file() function:
  # source_code_hash = "${base64sha256(file("lambda_function_payload.zip"))}"
  source_code_hash = "${filebase64sha256("pds_trace.zip")}"

  runtime = "nodejs10.x"
}

resource "aws_iam_role" "iam_for_lambda" {
  name = "iam_for_lambda"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "deploy-lambda-policy" {
  name = "default"
  role = "${aws_iam_role.iam_for_lambda.id}"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": [
        "*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "kinesis:GetRecords",
        "kinesis:GetShardIterator",
        "kinesis:DescribeStream",
        "kinesis:ListStreams",
        "kinesis:PutRecords",
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
EOF
}