import { Op, UniqueConstraintError } from 'sequelize';
import SupportTicket, { TicketStatus, TicketPriority, TicketUserRole, TicketCategory } from '../models/SupportTicket';
import SupportTicketMessage from '../models/SupportTicketMessage';
import SupportTicketTag from '../models/SupportTicketTag';
import User from '../models/User';
import AdminProfile from '../models/AdminProfile';
import {
  SupportTicketRepository,
  SupportTicketMessageRepository,
  SupportTicketTagRepository,
  UserRepository,
} from '../repositories';
import ApiError from '../utils/apiError';
import auditLogService from './auditLog.service';

function qInt(val: unknown, fallback: number): number {
  const n = parseInt(String(val ?? ''), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open:              ['in_progress', 'awaiting_customer', 'escalated', 'resolved', 'closed'],
  in_progress:       ['awaiting_customer', 'escalated', 'resolved', 'closed', 'open'],
  awaiting_customer: ['in_progress', 'escalated', 'resolved', 'closed'],
  escalated:         ['in_progress', 'resolved', 'closed'],
  resolved:          ['closed', 'in_progress', 'open'],
  closed:            ['in_progress', 'open'],
};

async function generateTicketNumber(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const candidate = `SC-${Math.floor(100000 + Math.random() * 900000)}`;
    const existing = await SupportTicketRepository.findOne({ ticketNumber: candidate } as never);
    if (!existing) return candidate;
  }
  throw new ApiError(500, 'Could not generate ticket number');
}

export interface ListTicketsOptions {
  status?:       string;
  priority?:     string;
  category?:     string;
  userRole?:     string;
  search?:       string;
  fromDate?:     string;
  toDate?:       string;
  page?:         string;
  limit?:        string;
  escalated?:    string;
  assignedTo?:   string;
  taggedTo?:     string;
  submitterId?:  string;
  includeHidden?: boolean;
}

class SupportService {
  async listTickets(opts: ListTicketsOptions) {
    const page   = qInt(opts.page, 1);
    const limit  = qInt(opts.limit, 20);
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (opts.status)   where.status   = opts.status;
    if (opts.priority) where.priority = opts.priority;
    if (opts.category) where.category = opts.category;
    if (opts.userRole) where.userRole = opts.userRole;
    if (opts.assignedTo) where.assignedTo = opts.assignedTo;

    if (opts.submitterId) {
      where.userId = opts.submitterId;
      if (!opts.includeHidden) {
        where.userDeletedAt = null;
      }
    }

    if (opts.escalated === 'true') {
      where.escalationLevel = { [Op.gt]: 0 };
    }

    if (opts.fromDate || opts.toDate) {
      const range: Record<symbol, unknown> = {};
      if (opts.fromDate) range[Op.gte] = new Date(opts.fromDate);
      if (opts.toDate)   range[Op.lte] = new Date(opts.toDate + 'T23:59:59');
      where.createdAt = range;
    }

    const includeArr: object[] = [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'phoneNumber', 'isActive'],
      },
    ];

    if (opts.taggedTo) {
      includeArr.push({
        model: SupportTicketTag,
        as: 'tags',
        where: { userId: opts.taggedTo },
        required: true,
      });
    }

    const { count, rows } = await SupportTicket.findAndCountAll({
      where: where as never,
      include: includeArr,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    let data = rows as unknown as (typeof rows[number] & { user?: { email?: string; ticketNumber?: string } })[];

    if (opts.search) {
      const q = opts.search.toLowerCase();
      data = data.filter(
        (r) =>
          r.subject?.toLowerCase().includes(q) ||
          (r as unknown as { user?: { email?: string } }).user?.email?.toLowerCase().includes(q) ||
          r.ticketNumber?.toLowerCase().includes(q),
      );
    }

    return { total: count, page, limit, data };
  }

  async getTicket(id: string, viewer?: { userId: string; role: string }) {
    const ticket = await SupportTicket.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'phoneNumber', 'isActive'],
        },
        {
          model: SupportTicketMessage,
          as: 'messages',
          include: [{ model: User, as: 'author', attributes: ['id', 'email'] }],
          separate: true,
          order: [['createdAt', 'ASC']],
        },
        {
          model: SupportTicketTag,
          as: 'tags',
          include: [{ model: User, as: 'taggedUser', attributes: ['id', 'email'] }],
        },
      ],
    });

    if (!ticket) throw new ApiError(404, 'Ticket not found');

    if (!viewer || viewer.role === 'admin') return ticket;

    if (viewer.role === 'customer_service' || viewer.role === 'customer_service_manager') return ticket;

    if (viewer.role === 'parent' || viewer.role === 'school') {
      if (ticket.userId !== viewer.userId || ticket.userDeletedAt) {
        throw new ApiError(404, 'Ticket not found');
      }
      const plain = ticket.toJSON() as unknown as Record<string, unknown>;
      const messages = (plain.messages as Array<Record<string, unknown>> | undefined) ?? [];
      plain.messages = messages.filter((m) => m.visibility === 'public');
      plain.tags = [];
      return plain;
    }

    return ticket;
  }

  async listMyTickets(userId: string, opts: ListTicketsOptions) {
    return this.listTickets({ ...opts, submitterId: userId });
  }

  async createTicket(data: {
    userId: string;
    userRole: TicketUserRole;
    subject: string;
    message: string;
    category?: TicketCategory;
    priority?: TicketPriority;
  }) {
    const ticketNumber = await generateTicketNumber();
    return SupportTicketRepository.create({
      userId:   data.userId,
      userRole: data.userRole,
      subject:  data.subject,
      message:  data.message,
      category: data.category ?? 'general_inquiry',
      priority: data.priority ?? 'medium',
      status:   'open',
      ticketNumber,
    } as never);
  }

  async replyToTicket(id: string, userId: string, body: string) {
    const ticket = await SupportTicket.findByPk(id);
    if (!ticket || ticket.userId !== userId || ticket.userDeletedAt) {
      throw new ApiError(404, 'Ticket not found');
    }
    const msg = await SupportTicketMessageRepository.create({
      ticketId:   id,
      authorId:   userId,
      authorType: 'submitter',
      body,
      visibility: 'public',
    } as never);
    if (ticket.status === 'awaiting_customer') {
      await ticket.update({ status: 'in_progress' } as never);
    }
    return msg;
  }

  async hideTicket(id: string, userId: string) {
    const ticket = await SupportTicket.findByPk(id);
    if (!ticket || ticket.userId !== userId) {
      throw new ApiError(404, 'Ticket not found');
    }
    if (ticket.userDeletedAt) return ticket;
    await ticket.update({ userDeletedAt: new Date() } as never);
    return ticket;
  }

  async updateTicketStatus(id: string, status: TicketStatus) {
    const ticket = await SupportTicket.findByPk(id);
    if (!ticket) throw new ApiError(404, 'Ticket not found');

    const current = ticket.status;
    if (current === status) return ticket;

    const allowed = TRANSITIONS[current];
    if (!allowed || !allowed.includes(status)) {
      throw new ApiError(409, `Invalid status transition from ${current} to ${status}`);
    }

    const updates: Record<string, unknown> = { status };
    if (status === 'resolved' || status === 'closed') {
      updates.resolvedAt = new Date();
    }

    await ticket.update(updates as never);
    return ticket;
  }

  async addMessage(id: string, data: {
    body: string;
    visibility: 'public' | 'internal';
    authorId: string;
    authorType: 'submitter' | 'customer_service';
  }) {
    const ticket = await SupportTicket.findByPk(id);
    if (!ticket) throw new ApiError(404, 'Ticket not found');

    const msg = await SupportTicketMessageRepository.create({
      ticketId:   id,
      authorId:   data.authorId,
      authorType: data.authorType,
      body:       data.body,
      visibility: data.visibility,
    } as never);

    if (data.authorType === 'customer_service' && data.visibility === 'public') {
      await ticket.update({ repliedAt: new Date() } as never);
    }

    return msg;
  }

  async escalateTicket(id: string, data: { managerId: string; note?: string; taggedBy: string }) {
    const ticket = await SupportTicket.findByPk(id);
    if (!ticket) throw new ApiError(404, 'Ticket not found');

    const manager = await UserRepository.findById(data.managerId);
    if (!manager || manager.role !== 'customer_service_manager' || !manager.isActive) {
      throw new ApiError(400, 'Invalid escalation target');
    }

    let tag;
    try {
      tag = await SupportTicketTagRepository.create({
        ticketId: id,
        userId:   data.managerId,
        taggedBy: data.taggedBy,
        note:     data.note ?? null,
      } as never);
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ApiError(409, 'Manager already tagged on this ticket');
      }
      throw err;
    }

    const ticketUpdates: Record<string, unknown> = {
      escalatedTo:     data.managerId,
      escalatedAt:     new Date(),
      escalationLevel: (ticket.escalationLevel ?? 0) + 1,
      escalationNote:  data.note ?? null,
    };
    if (ticket.status === 'open' || ticket.status === 'in_progress') {
      ticketUpdates.status = 'escalated';
    }
    await ticket.update(ticketUpdates as never);

    return { ticket, tag };
  }

  async listManagers() {
    const users = await User.findAll({
      where: { role: 'customer_service_manager', isActive: true },
      include: [{ model: AdminProfile, as: 'adminProfile', attributes: ['fullName'] }],
    });
    return users.map((u) => {
      const plain = u.toJSON() as unknown as Record<string, unknown>;
      const profile = plain.adminProfile as { fullName?: string | null } | null;
      return {
        id:       u.id,
        email:    u.email,
        fullName: profile?.fullName ?? null,
      };
    });
  }

  async getCsDashboard() {
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
    const [total, open, inProgress, resolvedToday, escalated] = await Promise.all([
      SupportTicket.count({}),
      SupportTicket.count({ where: { status: 'open' } }),
      SupportTicket.count({ where: { status: 'in_progress' } }),
      SupportTicket.count({
        where: {
          status:     { [Op.in]: ['resolved', 'closed'] },
          resolvedAt: { [Op.gte]: startOfToday },
        },
      }),
      SupportTicket.count({ where: { escalationLevel: { [Op.gt]: 0 } } }),
    ]);
    return {
      totalIssues:        total,
      openIssues:         open,
      inProgressIssues:   inProgress,
      resolvedToday,
      escalated,
      totalIssuesChange:  0,
      openIssuesChange:   0,
      inProgressChange:   0,
      resolvedTodayChange: 0,
      escalatedChange:    0,
    };
  }

  async getTicketAudit(id: string, page: number, limit: number) {
    const ticket = await SupportTicket.findByPk(id);
    if (!ticket) throw new ApiError(404, 'Ticket not found');
    return auditLogService.listLogs({
      entityType: 'SupportTicket',
      entityId:   id,
      page:       String(page),
      limit:      String(limit),
    });
  }

  async updateTicket(id: string, data: {
    status?:     TicketStatus;
    priority?:   TicketPriority;
    adminReply?: string;
    assignedTo?: string | null;
  }) {
    const ticket = await SupportTicket.findByPk(id);
    if (!ticket) throw new ApiError(404, 'Ticket not found');

    const updates: Partial<typeof data & { repliedAt?: Date; resolvedAt?: Date }> = { ...data };

    if (data.adminReply) {
      updates.repliedAt = new Date();
      if (!data.status) updates.status = 'in_progress';
    }

    if (data.status === 'resolved' || data.status === 'closed') {
      updates.resolvedAt = new Date();
    }

    return ticket.update(updates as never);
  }

  async deleteTicket(id: string) {
    const ticket = await SupportTicket.findByPk(id);
    if (!ticket) throw new ApiError(404, 'Ticket not found');
    await ticket.destroy();
  }

  async getStats() {
    const [open, in_progress, resolved, closed] = await Promise.all([
      SupportTicket.count({ where: { status: 'open' } }),
      SupportTicket.count({ where: { status: 'in_progress' } }),
      SupportTicket.count({ where: { status: 'resolved' } }),
      SupportTicket.count({ where: { status: 'closed' } }),
    ]);
    return { open, in_progress, resolved, closed, total: open + in_progress + resolved + closed };
  }
}

export default new SupportService();
