import { BaseRepository } from './BaseRepository';
import User, { UserInstance } from '../models/User';
import Parent, { ParentInstance } from '../models/Parent';
import School, { SchoolInstance } from '../models/School';
import RefreshToken, { RefreshTokenInstance } from '../models/RefreshToken';
import SupportTicket, { SupportTicketInstance } from '../models/SupportTicket';
import SupportTicketMessage, { SupportTicketMessageInstance } from '../models/SupportTicketMessage';
import SupportTicketTag, { SupportTicketTagInstance } from '../models/SupportTicketTag';

export const UserRepository                 = new BaseRepository<UserInstance>(User);
export const ParentRepository               = new BaseRepository<ParentInstance>(Parent);
export const SchoolRepository               = new BaseRepository<SchoolInstance>(School);
export const RefreshTokenRepository         = new BaseRepository<RefreshTokenInstance>(RefreshToken);
export const SupportTicketRepository        = new BaseRepository<SupportTicketInstance>(SupportTicket);
export const SupportTicketMessageRepository = new BaseRepository<SupportTicketMessageInstance>(SupportTicketMessage);
export const SupportTicketTagRepository     = new BaseRepository<SupportTicketTagInstance>(SupportTicketTag);
