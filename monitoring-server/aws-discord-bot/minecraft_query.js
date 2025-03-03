import dgram from 'dgram';
import {exec} from 'child_process';

class MinecraftServerQuery {
    static query(ip, port = 25565, timeout = 1000) {
        return new Promise((resolve, reject) => {
            const socket = dgram.createSocket('udp4');

            // Generate a random session ID
            const sessionId = Math.floor(Math.random() * 0xFFFFFFFF);

            // Step 1: Send a Handshake Packet to Get a Challenge Token
            const handshakeBuffer = Buffer.from([0xFE, 0xFD, 0x09, ...MinecraftServerQuery.intToBytes(sessionId, 4)]);

            socket.send(handshakeBuffer, 0, handshakeBuffer.length, port, ip, (err) => {
                if (err) {
                    reject(`Error sending handshake packet: ${err.message}`);
                    socket.close();
                    return;
                }
            });

            // Step 2: Listen for the Challenge Response
            socket.on('message', (msg) => {
                if (msg.length < 5 || msg[0] !== 0x09) {
                    reject('Invalid response from server.');
                    socket.close();
                    return;
                }

                // Extract challenge token from response
                const challengeToken = parseInt(msg.toString('utf8', 5).trim());

                // Step 3: Send the Full Query Request
                const queryBuffer = Buffer.from([
                    0xFE, 0xFD, 0x00,
                    ...MinecraftServerQuery.intToBytes(sessionId, 4),
                    ...MinecraftServerQuery.intToBytes(challengeToken, 4),
                ]);

                socket.send(queryBuffer, 0, queryBuffer.length, port, ip, (err) => {
                    if (err) {
                        reject(`Error sending query request: ${err.message}`);
                        socket.close();
                        return;
                    }
                });

                // Step 4: Listen for the Full Query Response
                socket.once('message', (msg) => {
                    const data = MinecraftServerQuery.parseResponse(msg);
                    resolve(data);
                    socket.close();
                });

                // Step 5: Set a Timeout in case of no response
                setTimeout(() => {
                    reject('No response from server.');
                    socket.close();
                }, timeout);
            });
        });
    }

    // Convert integer to 4-byte buffer
    static intToBytes(int, length) {
        const buf = Buffer.alloc(length);
        for (let i = length - 1; i >= 0; i--) {
            buf[i] = int & 0xFF;
            int >>= 8;
        }
        return buf;
    }

    // Parse the server response and extract useful information
    static parseResponse(buffer) {
        const data = buffer.toString('utf8', 5).split('\x00\x01player_\x00\x00'); // Split header from player list
        const info = data[0].split('\x00');

        return {
            motd: info[3], // Message of the day
            gameType: info[5], // Game type (SMP, Creative, etc.)
            version: info[7], // Minecraft version
            plugins: info[9], // Plugins
            map: info[11], // World name
            numPlayers: parseInt(info[13]), // Players online
            maxPlayers: parseInt(info[15]), // Max players
            hostPort: parseInt(info[17]), // Server port
            hostIp: info[19], // Server IP
            players: data[1] ? data[1].split('\x00').filter((p) => p.length > 0) : [], // Player list
        };
    }

    static statusQuery(ip, port = 25565) {
        return new Promise((resolve, reject) => {
            let command = `mcstatus ${ip}:${port} status`
            console.log("Executing:", command);
            exec(command, (err, stdout, stderr) => {
                if (err || stderr) {
                    reject(err || stderr)
                } else {
                    // Regex to match version, MOTD, and player count
                    const versionMatch = stdout.match(/version: (.*)/);
                    const motdMatch = stdout.match(/parsed=\['(.*)'\]/);
                    const playersMatch = stdout.match(/players: (\d+)\/(\d+)/);

                    console.log(stdout);
                    console.log("versionMatch", versionMatch, "motdMatch", motdMatch, "playersMatch", playersMatch);

                    if (versionMatch && motdMatch && playersMatch) {
                        const version = versionMatch[1];
                        const motd = motdMatch[1];
                        const onlinePlayers = playersMatch[1];
                        const maxPlayers = playersMatch[2];
                        resolve({
                            motd: motd, // Message of the day
                            gameType: null, // Game type (SMP, Creative, etc.)
                            version: version, // Minecraft version
                            plugins: null, // Plugins
                            map: null, // World name
                            numPlayers: onlinePlayers, // Players online
                            maxPlayers: maxPlayers, // Max players
                            hostPort: port, // Server port
                            hostIp: ip, // Server IP
                            players: null, // Player list
                        });
                    } else {
                        reject("No server information");
                    }
                }
            });
        });
    }
}

export default MinecraftServerQuery;
