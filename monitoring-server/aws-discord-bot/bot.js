import AWSInterface from './aws_interface.js';
import DiscordInterface from './discord_interface.js';
import Minecraft from './minecraft.js';
import fs from 'fs';

/** @typedef {import('./types.js').Parameters} Parameters */

const parametersFile = './parameters.json';
if (!fs.existsSync(parametersFile)) {
    console.log('❌ parameters.json file not found. Ensure the file exists with the correct structure.');
    process.exit(1);
}
/**
 * @typedef {Object} MinecraftQueryParams
 * @property {string} channel_id - The channel id to post to
 * @property {string} message_id - The message id of the already existing message
 */
/**
 * @typedef {Object} Instance
 * @property {string} instance_id - The unique identifier of the instance (e.g., i-219387129)
 * @property {string} short_name - The short name of the server (e.g., "minecraft")
 * @property {string} name - The full name of the server (e.g., "Minecraft")
 * @property {MinecraftQueryParams} minecraft_query - Values if a minecraft server
 */
/**
 * @typedef {Object} Parameters
 * @property {string} aws_region - The AWS region (e.g., "us-west-2")
 * @property {string[]} authorized_users - List of authorized user IDs
 * @property {string} servers_channel - The server channel ID
 * @property {Instance[]} instances - List of instances
 */
/** @type {Parameters} */
const PARAMETERS = JSON.parse(fs.readFileSync(parametersFile));

console.log("Parameters file loaded:", PARAMETERS);

async function main() {
    try {

        // Setup the environments
        const AWS = new AWSInterface(PARAMETERS.aws_region);
        const discordToken = await AWS.getParameter('DISCORD_BOT_TOKEN', true);
        const DISCORD = await new DiscordInterface(discordToken, PARAMETERS.servers_channel, PARAMETERS.instances, PARAMETERS.authorized_users);

        DISCORD.setStartFunc(async (server) => {
            const instance = PARAMETERS.instances.find(s => s.short_name === server);
            await AWS.startInstance(instance.instance_id);
        })

        DISCORD.setStopFunc(async (server) => {
            const instance = PARAMETERS.instances.find(s => s.short_name === server);
            await AWS.stopInstance(instance.instance_id);
        })

        const client = await DISCORD.login();
        console.log(`✅ Logged in as ${client.user.tag}`);

        // custom functionality
        for (const instance of PARAMETERS.instances) {

            // Minecraft
            if (instance.minecraft_query) {
                const instanceData = await AWS.getInstanceParams(instance.instance_id);
                const privateIpAddress = instanceData.privateIpAddress;
                const publicIpAddress = instanceData.publicIpAddress;
                const minecraftServer = new Minecraft(instance, publicIpAddress, privateIpAddress, DISCORD);
                console.log(`Adding Minecraft Server checking for ${instance.name}(${instance.instance_id})`);
                minecraftServer.updateStatus();
                setInterval(minecraftServer.updateStatus.bind(minecraftServer), 30 * 1000);
            }
        }


    } catch (error) {
        console.error('❌ Error initializing bot:', error);
    }
}

main();
