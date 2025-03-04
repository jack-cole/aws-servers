# Monitoring Server

These scripts are ran on the server that monitors the other servers. The server must be deployed in AWS as an EC2 instance, running NodeJS.

## Setup

### Add user

```bash
sudo adduser monitor
sudo mkdir -p /home/monitor/.ssh
sudo chmod 700 /home/monitor/.ssh
# Your SSH key goes here
echo "ssh-rsa..." | sudo tee /home/monitor/.ssh/authorized_keys
sudo chmod 600 /home/monitor/.ssh/authorized_keys
sudo chown -R monitor:monitor /home/monitor/.ssh
sudo systemctl restart sshd
```

### Install apps

```bash
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo yum install -y nodejs python3 python3-pip
sudo pip3 install mcstatus
```

### Set up service

```bash
sudo cp /home/monitor/aws-discord-bot/aws-discord-bot.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable aws-discord-bot.service
sudo systemctl start aws-discord-bot.service
```

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
      "Resource": "arn:aws:ssm:us-west-2:<your account>:*"
    }
  ]
}
```
Then run the following command as the monitor user and put in your IAM API ID and KEY

```bash
aws configure
```
Then run the following commands on the server after filling out the placeholders:

```bash
aws ssm put-parameter --name "DISCORD_BOT_TOKEN" --value "your_discord_bot_token" --type "SecureString"
```