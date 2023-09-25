import { ICommand } from '../interfaces/ICommand'
import { Ping } from './Ping'
import { WhoIs } from './user/whois'

export const CommandList: ICommand[] = [Ping, WhoIs]
