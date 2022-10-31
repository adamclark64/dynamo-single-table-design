resource "aws_dynamodb_table" "single_table_design" {
  name           = "single_table_design"
  billing_mode   = "PAY_PER_REQUEST"
#  read_capacity  = 100
#  write_capacity = 100
  hash_key       = "pk"
  range_key      = "sk"

  # https://github.com/hashicorp/terraform-provider-aws/issues/13693#issuecomment-885119618
#  lifecycle {
#    ignore_changes = [ read_capacity, write_capacity ]
#  }

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  attribute {
    name = "artist_key"
    type = "S"
  }

  attribute {
    name = "album"
    type = "S"
  }

  global_secondary_index {
    hash_key        = "artist_key"
    range_key       = "album"
    name            = "artist-albums"
    projection_type = "ALL"
  }
}
