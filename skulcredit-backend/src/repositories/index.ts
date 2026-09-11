import { BaseRepository } from './BaseRepository';
import User, { UserInstance } from '../models/User';
import Parent, { ParentInstance } from '../models/Parent';
import School, { SchoolInstance } from '../models/School';
import RefreshToken, { RefreshTokenInstance } from '../models/RefreshToken';

export const UserRepository         = new BaseRepository<UserInstance>(User);
export const ParentRepository       = new BaseRepository<ParentInstance>(Parent);
export const SchoolRepository       = new BaseRepository<SchoolInstance>(School);
export const RefreshTokenRepository = new BaseRepository<RefreshTokenInstance>(RefreshToken);
