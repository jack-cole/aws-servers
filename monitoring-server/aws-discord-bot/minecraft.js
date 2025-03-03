import MinecraftServerQuery from "./minecraft_query.js";

class Minecraft {

    /**
     * @param {Parameters} instance - The instance object containing details like `instanceId`, `name`, `short_name`, etc.
     * @param {string} ipAddress - The IP address associated with the instance (either public or private).
     * @param {DiscordInterface} discord - An instance of the `DiscordInterface` class to interact with Discord.
     */
    constructor(instance, publicIpAddress, privateIpAddress, discord, aws) {
        this.instance = instance;
        this.publicIpAddress = publicIpAddress;
        this.privateIpAddress = privateIpAddress;
        this.port = instance.minecraft_query.port || 25565;
        this.bottomComment = instance.minecraft_query.bottomComment || "";
        this.discord = discord;
        this.aws = aws;
        this.lastMessage = null;
    }

    async updateStatus() {
        let newMessage;
        try {
            try {
                // Query if Minecraft online
                console.log(`Querying ${this.privateIpAddress}:${this.port}`)
                const serverInfo = await MinecraftServerQuery.statusQuery(this.privateIpAddress, this.port, 10);
                console.log(`Got response from ${this.privateIpAddress}:${this.port}:`, serverInfo);
                newMessage = this.generateMessage({
                    "state": "ONLINE",
                    "version": serverInfo.maxPlayers,
                    "motd": serverInfo.motd,
                    "onlinePlayers": serverInfo.numPlayers,
                    "maxPlayers": serverInfo.maxPlayers,
                    "bottomComment": this.bottomComment
                });
            } catch (err) {
                console.error(`Error while querying ${this.privateIpAddress}:${this.port}`, err);
                // Check if instance is running and report it as starting if so, otherwise report as offline
                const instanceInfo = await this.aws.getInstanceParams(this.instance.instance_id);
                if (instanceInfo.state === "running") {
                    newMessage = this.generateMessage({
                        "state": "STARTING",
                        "bottomComment": this.bottomComment
                    });
                } else {
                    newMessage = this.generateMessage({
                        "state": "OFFLINE",
                        "bottomComment": this.bottomComment
                    });
                }
            }
            if (this.lastMessage !== newMessage) {
                console.log(`Updating discord message ${this.instance.minecraft_query.message_id} with the following:`, newMessage);
                this.lastMessage = newMessage;
                this.discord.updateMessage(this.instance.minecraft_query.channel_id, this.instance.minecraft_query.message_id, newMessage)
            }
        } catch (err) {
            console.error("Error when trying to update status", err)

        }

    }

    generateMessage({state, version, motd, onlinePlayers, maxPlayers, bottomComment}) {
        if (state === 'ONLINE') {

            return `🌎 **Minecraft Server Status** ${this.publicIpAddress}:${this.port}
🟢 Online  
🎮 **Players Online:** ${onlinePlayers} ${onlinePlayers === 0 ? "" : "(Server will shutdown if empty for 30 minutes)"} 
🖥️ **Version:** ${version}  
💬 **MOTD:** ${motd}
${bottomComment}`;
        } else if (state === 'STARTING') {
            return `🌎 **Minecraft Server Status** ${this.publicIpAddress}:${this.port}
🟡 Starting...  
🎮 **Players Online:**  
🖥️ **Version:**   
💬 **MOTD:**
${bottomComment}`;
        } else {
            return `🌎 **Minecraft Server Status** ${this.publicIpAddress}:${this.port} 
🔴 Offline  
🎮 **Players Online:**  
🖥️ **Version:**   
💬 **MOTD:**
${bottomComment}
Please ask someone to start the server if you'd like to play now.`
        }
    }
}

export default Minecraft;
