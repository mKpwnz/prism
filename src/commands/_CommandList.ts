import { ICommand } from '../interfaces/ICommand'
import { message } from './Messages'
import { openTicket } from './OpenTicket'

export const CommandList: ICommand[] = [openTicket, message]
