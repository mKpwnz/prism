import LogManager from '@utils/Logger'
import { RemoteInfo, Socket, createSocket } from 'dgram'

export class RconClient {
    private static socket: Socket | null = null

    private static options = {
        host: process.env.RCON_HOST as string,
        port: parseInt(process.env.RCON_PORT as string),
        password: process.env.RCON_PASSWORD as string,
    }

    constructor() {
        if (!RconClient.socket) {
            RconClient.socket = createSocket('udp4')
            RconClient.socket.on('message', (msg, rinfo) => this.onMessage(msg, rinfo))
        }
    }

    private onMessage(msg: Buffer, rinfo: RemoteInfo) {
        const response = msg.toString('ascii')
        LogManager.log('RCON Response: ' + response)
    }

    public static async sendCommand(command: string): Promise<string> {
        if (RconClient.socket) {
            const password = RconClient.options.password
            const packetLength = 14 + password.length + command.length
            const buffer = Buffer.alloc(packetLength)
            buffer.write('\xFF\xFF\xFF\xFF', 0, 4, 'binary')
            buffer.write(`rcon ${password} ${command}\0`, 4, packetLength - 4, 'ascii')
            try {
                return await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(
                            new Error(
                                'Timeout: Server hat nicht innerhalb von 5 Sekunden geantwortet',
                            ),
                        )
                    }, 5000) // Timeout nach 5 Sekunden

                    RconClient.socket!.once('message', (msg, rinfo) => {
                        clearTimeout(timeout)
                        const response = msg.toString('ascii')
                        resolve(response)
                    })

                    RconClient.socket!.send(
                        buffer,
                        0,
                        buffer.length,
                        RconClient.options.port,
                        RconClient.options.host,
                    )
                })
            } catch (error) {
                LogManager.log(error)
                return 'Error'
            }
            // Erstelle ein Promise, das auf die Serverantwort wartet
        } else {
            throw new Error('UDP socket is not initialized')
        }
    }

    public static disconnect() {
        if (RconClient.socket) {
            RconClient.socket.close()
            RconClient.socket = null
        }
    }
}
