resource "aws_iam_role" "single_table_iam_exec" {
  name = "single_table_iam_exec"

  assume_role_policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
POLICY
}

resource "aws_iam_policy" "single_table_dynamodb_access" {
  name = "singleTableDesignDynamoDBAccess"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Query"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:dynamodb:us-west-2:*:table/single_table_design*"
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "single_table_design_lambda_policy" {
  role       = aws_iam_role.single_table_iam_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "single_table_design_dynamodb_access" {
  role       = aws_iam_role.single_table_iam_exec.name
  policy_arn = aws_iam_policy.single_table_dynamodb_access.arn
}

resource "aws_lambda_function" "dynamo-single-table-design" {
  function_name = "dynamo-single-table-design"

  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key    = aws_s3_object.single_table_design_lambda_bucket.key

  runtime = "nodejs16.x"
  handler = "index.handler"

  source_code_hash = data.archive_file.single_table_design_lambda_file.output_base64sha256

  role = aws_iam_role.single_table_iam_exec.arn
}

resource "aws_cloudwatch_log_group" "dynamo-single-table-design" {
  name = "/aws/lambda/${aws_lambda_function.dynamo-single-table-design.function_name}"

  retention_in_days = 3
}

data "archive_file" "single_table_design_lambda_file" {
  type = "zip"
  source_dir  = "../${path.module}/dist"
  output_path = "../${path.module}/upload.zip"
}

resource "aws_s3_object" "single_table_design_lambda_bucket" {
  bucket = aws_s3_bucket.lambda_bucket.id

  key    = "single_table_design_lambda.zip"
  source = data.archive_file.single_table_design_lambda_file.output_path

  source_hash = filemd5(data.archive_file.single_table_design_lambda_file.output_path)
}

resource "aws_lambda_function_url" "single_table_design_lambda_url" {
  function_name      = aws_lambda_function.dynamo-single-table-design.function_name
  authorization_type = "NONE"
}

output "run_url" {
  value = aws_lambda_function_url.single_table_design_lambda_url.function_url
}
