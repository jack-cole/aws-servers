require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const AWS = require('aws-sdk');

// Initialize Discord bot
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Initialize AWS SDK
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const ec2 = new AWS.EC2();
const instanceId = process.env.EC2_INSTANCE_ID;

// Function to start EC2 instance
async function startInstance(interaction) {
    try {
        await ec2.startInstances({ InstanceIds: [instanceId] }).promise();
        await interaction.reply(`✅ EC2 instance **${instanceId}** is starting...`);
    } catch (error) {
        console.error(error);
        await interaction.reply(`❌ Error starting instance: ${error.message}`);
    }
}

// Function to stop EC2 instance
async function stopInstance(interaction) {
    try {
        await ec2.stopInstances({ InstanceIds: [instanceId] }).promise();
        await interaction.reply(`✅ EC2 instance **${instanceId}** is stopping...`);
    } catch (error) {
        console.error(error);
        await interaction.reply(`❌ Error stopping instance: ${error.message}`);
    }
}

// Handle commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'start') {
        await startInstance(interaction);
    } else if (commandName === 'stop') {
        await stopInstance(interaction);
    }
});

// Bot login
client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_BOT_TOKEN);
