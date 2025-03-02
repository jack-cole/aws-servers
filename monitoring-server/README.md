# Monitoring Server

These scripts are ran on the server that monitors the other servers. The server must be deployed in AWS as an EC2 instance, running NodeJS.

## Discord bot

Allows control of the AWS servers from Discord by letting you turn them on and off.

## AWS IAM and Parameters

Use the following policy for a new IAM user:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:StartInstances",
        "ec2:StopInstances",
        "ec2:DescribeInstances"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:PutParameter",
        "ssm:DescribeParameters"
      ],
      "Resource": "arn:aws:ssm:us-west-2:383217639384:*"
    }
  ]
}
```
Then run the following command and put in your IAM API ID and KEY

```bash
aws configure
```
Then run the following commands on the server after filling out the placeholders:

```bash
aws ssm put-parameter --name "DISCORD_BOT_TOKEN" --value "your_discord_bot_token" --type "SecureString"
```