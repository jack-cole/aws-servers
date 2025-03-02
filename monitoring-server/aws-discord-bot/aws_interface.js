import {SSMClient, GetParameterCommand} from '@aws-sdk/client-ssm';
import {EC2Client, StartInstancesCommand, StopInstancesCommand} from "@aws-sdk/client-ec2";

export class AWSInterface {

    constructor(region) {
        // Load AWS credentials from the instance profile (if running on EC2) or IAM role
        this.ssmClient = new SSMClient({region: region});
        this.ec2Client = new EC2Client({region: region});

    }


    async getParameter(name, isSecure = false) {
        const command = new GetParameterCommand({
            Name: name,
            WithDecryption: isSecure,
        });

        try {
            const result = await this.ssmClient.send(command);
            return result.Parameter?.Value;
        } catch (error) {
            console.error('❌ Error fetching parameter:', error);
        }
    }

    async startInstance(instanceId) {
        const command = new StartInstancesCommand({
            InstanceIds: [instanceId],
        });

        await this.ec2Client.send(command);
    }


    async stopInstance(instanceId) {
        const command = new StopInstancesCommand({
            InstanceIds: [instanceId],
        });

        await this.ec2Client.send(command);
    }
}