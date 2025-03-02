import {Client, GatewayIntentBits, SlashCommandBuilder, MessageFlags} from 'discord.js';

export class DiscordInterface {

    constructor(discordToken, channelId, instances, authorizedUsers) {
        this.discordToken = discordToken;
        this.channelId = channelId;
        this.instances = instances;
        this.authorizedUsers = authorizedUsers;
        this.client = new Client({intents: [GatewayIntentBits.Guilds]});
        this.setup();
    }

    login() {
        client.login(this.discordToken);
    }

    setup() {

        // Registering Slash commands
        this.client.once('ready', async () => {
            console.log(`✅ Logged in as ${this.client.user.tag}`);

            const startCommand = new SlashCommandBuilder().setName('start').setDescription("Starts a specific server");
            const stopCommand = new SlashCommandBuilder().setName('stop').setDescription("Stops a specific server");
            const choices = this.instances.map((instance) => {
                return {"name": instance.name, "value": instance.short_name}
            });
            startCommand.addStringOption(option =>
                option.setName("server").setDescription("The server to start").setRequired(true).addChoices(choices));
            stopCommand.addStringOption(option =>
                option.setName("server").setDescription("The server to stop").setRequired(true).addChoices(choices));


            // Register commands globally (this can take up to 1 hour to propagate)
            await this.client.application.commands.set([startCommand, stopCommand]);

            console.log('✅ Slash commands registered!');

        });

        // The event that captures a user sending a command
        this.client.on('interactionCreate', async interaction => {
            if (!interaction.isCommand()) return;

            const userId = interaction.user.id;

            // Check if the user is in the authorized list
            if (!this.authorizedUsers.includes(userId)) {
                return interaction.reply({
                    content: 'You do not have permission to use this command.',
                    flags: MessageFlags.Ephemeral
                });
            }

            if (interaction.commandName === 'start') {
                await this.startInstance(interaction);
            } else if (interaction.commandName === 'stop') {
                await this.stopInstance(interaction);
            }
        });


        this.client.login(this.discordToken);

    }

    setStartFunc(startFunc) {
        this.startFunc = startFunc;
    }

    setStopFunc(stopFunc) {
        this.stopFunc = stopFunc;
    }

    async reply(interaction, message, deletionSeconds = null) {
        const reply = await interaction.reply({
            content: message,
            flags: MessageFlags.Ephemeral
        });

        // Delete the message after a period of time
        if (deletionSeconds)
            setTimeout(async () => {
                await interaction.deleteReply(); // Deletes the ephemeral reply after the timeout
            }, deletionSeconds * 1000);
    }

    async startInstance(interaction) {
        const server = interaction.options.getString('server');
        await this.startFunc(server);
        await this.reply(interaction, `✅  Minecraft server is starting. See <#${this.channelId}> for more info.`, 2 * 60);

        const serverNickname = interaction.member.nickname || interaction.user.username;
        console.log("Minecraft server started by", serverNickname);
    }

    async stopInstance(interaction) {
        const server = interaction.options.getString('server');
        await this.stopFunc(server)
        await this.reply(interaction, `✅ Minecraft server is stopping. See <#${this.channelId}> for more info.`, 2 * 60);

        const serverNickname = interaction.member.nickname || interaction.user.username;
        console.log("Minecraft server stopped by", serverNickname);
    }

}