import LogManager from '@utils/Logger'
import { RemoteInfo, Socket, createSocket } from 'dgram'

export class RconClient {
    private static socket: Socket | null = null

    private static options = {
        host: process.env.RCON_HOST ?? '',
        port: parseInt(process.env.RCON_PORT ?? '0'),
        password: process.env.RCON_PASSWORD ?? '',
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
        if (!RconClient.socket) {
            var error = new Error('UDP socket is not initialized')
            LogManager.error(error)
            throw error
        }

        const password = RconClient.options.password
        const packetLength = 14 + password.length + command.length
        const buffer = Buffer.alloc(packetLength)
        buffer.write('\xFF\xFF\xFF\xFF', 0, 4, 'binary')
        buffer.write(`rcon ${password} ${command}\0`, 4, packetLength - 4, 'ascii')
        return await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject('Timeout: Server hat nicht innerhalb von 5 Sekunden geantwortet')
            }, 5000) // Timeout nach 5 Sekunden

            RconClient.socket!.once('message', (msg, rinfo) => {
                clearTimeout(timeout)
                const response = msg.toString('ascii')
                resolve(response)
            })

            RconClient.socket!.send(buffer, 0, buffer.length, RconClient.options.port, RconClient.options.host)
        })
    }

    public static disconnect() {
        if (RconClient.socket) {
            RconClient.socket.close()
            RconClient.socket = null
        }
    }
}
