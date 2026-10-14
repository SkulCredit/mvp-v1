import { Request, Response, NextFunction } from 'express';
import supportService from '../services/support.service';
import { successResponse } from '../utils/response';
import { writeAuditLog } from '../utils/auditLogger';
import emailService from '../emails/email.service';
import notificationService from '../notifications/notification.service';
import env from '../config/env';
import { User, Parent, School } from '../models/index';

function toPlain(obj: unknown): Record<string, unknown> {
  if (obj && typeof (obj as { toJSON?: unknown }).toJSON === 'function') {
    return (obj as { toJSON: () => unknown }).toJSON() as Record<string, unknown>;
  }
  return obj as Record<string, unknown>;
}

class SupportController {
  async listTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.query;
      const data = await supportService.listTickets({
        status:   q.status   ? String(q.status)   : undefined,
        priority: q.priority ? String(q.priority) : undefined,
        userRole: q.userRole ? String(q.userRole) : undefined,
        search:   q.search   ? String(q.search)   : undefined,
        fromDate: q.fromDate ? String(q.fromDate) : undefined,
        toDate:   q.toDate   ? String(q.toDate)   : undefined,
        page:     q.page     ? String(q.page)     : undefined,
        limit:    q.limit    ? String(q.limit)    : undefined,
      });
      successResponse(res, 200, 'Tickets fetched', data);
    } catch (e) { next(e); }
  }

  async getTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await supportService.getTicket(String(req.params.id));
      successResponse(res, 200, 'Ticket fetched', ticket);
    } catch (e) { next(e); }
  }

  async updateTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const before = await supportService.getTicket(id);
      const ticket = await supportService.updateTicket(id, req.body as never);
      await writeAuditLog({
        req,
        category:   'SYSTEM',
        action:     'UPDATE_SUPPORT_TICKET',
        eventType:  'ADMIN_ACTION',
        status:     'SUCCESS',
        message:    'Support ticket updated',
        entityType: 'SupportTicket',
        entityId:   id,
        metadata: {
          before: { status: (before as unknown as { status?: string }).status },
          after:  { status: (ticket as unknown as { status?: string }).status },
        },
      });
      successResponse(res, 200, 'Ticket updated', ticket);
    } catch (e) { next(e); }
  }

  async deleteTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      await supportService.deleteTicket(id);
      await writeAuditLog({
        req,
        category:   'SYSTEM',
        action:     'DELETE_SUPPORT_TICKET',
        eventType:  'ADMIN_ACTION',
        status:     'SUCCESS',
        message:    'Support ticket deleted',
        entityType: 'SupportTicket',
        entityId:   id,
      });
      successResponse(res, 200, 'Ticket deleted', {});
    } catch (e) { next(e); }
  }

  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await supportService.getStats();
      successResponse(res, 200, 'Stats fetched', stats);
    } catch (e) { next(e); }
  }

  async listMyTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.query;
      const data = await supportService.listMyTickets(req.user!.userId, {
        status:   q.status   ? String(q.status)   : undefined,
        priority: q.priority ? String(q.priority) : undefined,
        category: q.category ? String(q.category) : undefined,
        search:   q.search   ? String(q.search)   : undefined,
        page:     q.page     ? String(q.page)     : undefined,
        limit:    q.limit    ? String(q.limit)    : undefined,
      });
      successResponse(res, 200, 'Tickets fetched', data);
    } catch (e) { next(e); }
  }

  async getMyTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await supportService.getTicket(String(req.params.id), {
        userId: req.user!.userId,
        role:   (req.user!.roles?.[0] ?? 'parent').toLowerCase(),
      });
      successResponse(res, 200, 'Ticket fetched', ticket);
    } catch (e) { next(e); }
  }

  async createTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const role   = (req.user!.roles?.[0] ?? 'parent').toLowerCase() as 'parent' | 'school';
      const ticket = await supportService.createTicket({
        userId,
        userRole: role,
        subject:  req.body.subject,
        message:  req.body.message,
        category: req.body.category,
        priority: req.body.priority,
      });

      const ticketPlain = toPlain(ticket);

      void (async () => {
        try {
          const user = await User.findByPk(userId);
          if (!user) return;
          let recipientName = user.email;
          if (role === 'parent') {
            const parent = await Parent.findOne({ where: { userId } });
            if (parent) {
              const p = toPlain(parent);
              recipientName = `${(p.firstName as string) ?? ''} ${(p.lastName as string) ?? ''}`.trim() || user.email;
            }
          } else {
            const school = await School.findOne({ where: { userId } });
            if (school) {
              const s = toPlain(school);
              recipientName = (s.schoolName as string) || user.email;
            }
          }
          await emailService.sendTicketCreated({
            email:        user.email,
            recipientName,
            ticketNumber: ticketPlain.ticketNumber as string,
            subject:      ticketPlain.subject as string,
            category:     (ticketPlain.category as string) ?? 'general_inquiry',
            trackUrl:     `${env.frontendUrl}/${role}/support`,
          });
        } catch (_) {}
      })();

      void notificationService.dispatch({
        userId,
        type:          'general',
        title:         'Ticket received',
        message:       `Your ticket #${ticketPlain.ticketNumber} has been received.`,
        referenceId:   ticketPlain.id as string,
        referenceType: 'SupportTicket',
      }).catch(() => {});

      await writeAuditLog({
        req,
        category:   'SYSTEM',
        action:     'CREATE_SUPPORT_TICKET',
        eventType:  'USER_ACTIVITY',
        status:     'SUCCESS',
        message:    'Support ticket created',
        entityType: 'SupportTicket',
        entityId:   ticketPlain.id as string,
        metadata:   { ticketNumber: ticketPlain.ticketNumber },
      });

      successResponse(res, 201, 'Ticket created', ticket);
    } catch (e) { next(e); }
  }

  async replyToTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id  = String(req.params.id);
      const msg = await supportService.replyToTicket(id, req.user!.userId, req.body.message);
      await writeAuditLog({
        req,
        category:   'SYSTEM',
        action:     'REPLY_SUPPORT_TICKET',
        eventType:  'USER_ACTIVITY',
        status:     'SUCCESS',
        message:    'Reply sent on support ticket',
        entityType: 'SupportTicket',
        entityId:   id,
      });
      successResponse(res, 201, 'Reply sent', msg);
    } catch (e) { next(e); }
  }

  async hideTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      await supportService.hideTicket(id, req.user!.userId);
      await writeAuditLog({
        req,
        category:   'SYSTEM',
        action:     'HIDE_SUPPORT_TICKET',
        eventType:  'USER_ACTIVITY',
        status:     'SUCCESS',
        message:    'Support ticket hidden by user',
        entityType: 'SupportTicket',
        entityId:   id,
      });
      successResponse(res, 200, 'Ticket removed from view', {});
    } catch (e) { next(e); }
  }

  async csListTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q        = req.query;
      const taggedTo = q.taggedTo ? String(q.taggedTo) : undefined;
      const data = await supportService.listTickets({
        status:     q.status     ? String(q.status)     : undefined,
        priority:   q.priority   ? String(q.priority)   : undefined,
        category:   q.category   ? String(q.category)   : undefined,
        userRole:   q.userRole   ? String(q.userRole)   : undefined,
        search:     q.search     ? String(q.search)     : undefined,
        fromDate:   q.fromDate   ? String(q.fromDate)   : undefined,
        toDate:     q.toDate     ? String(q.toDate)     : undefined,
        escalated:  q.escalated  ? String(q.escalated)  : undefined,
        assignedTo: q.assignedTo ? String(q.assignedTo) : undefined,
        page:       q.page       ? String(q.page)       : undefined,
        limit:      q.limit      ? String(q.limit)      : undefined,
        taggedTo:   taggedTo === 'me' ? req.user!.userId : taggedTo,
      });
      successResponse(res, 200, 'Tickets fetched', data);
    } catch (e) { next(e); }
  }

  async csGetTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await supportService.getTicket(String(req.params.id), {
        userId: req.user!.userId,
        role:   (req.user!.roles?.[0] ?? 'customer_service').toLowerCase(),
      });
      successResponse(res, 200, 'Ticket fetched', ticket);
    } catch (e) { next(e); }
  }

  async csUpdateTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id     = String(req.params.id);
      const before = await supportService.getTicket(id);
      const ticket = await supportService.updateTicketStatus(id, req.body.status);
      const ticketPlain = toPlain(ticket);

      await writeAuditLog({
        req,
        category:   'SYSTEM',
        action:     'UPDATE_SUPPORT_TICKET_STATUS',
        eventType:  'ADMIN_ACTION',
        status:     'SUCCESS',
        message:    'Support ticket status updated by CS',
        entityType: 'SupportTicket',
        entityId:   id,
        metadata: {
          before: { status: (before as unknown as { status?: string }).status },
          after:  { status: req.body.status },
        },
      });

      void (async () => {
        try {
          const userId = ticketPlain.userId as string;
          const user   = await User.findByPk(userId);
          if (!user) return;
          const beforeStatus = (before as unknown as { status?: string }).status ?? '';
          await emailService.sendTicketStatusUpdate({
            email:         user.email,
            recipientName: user.email,
            ticketNumber:  ticketPlain.ticketNumber as string,
            subject:       ticketPlain.subject as string,
            oldStatus:     beforeStatus,
            newStatus:     req.body.status,
            trackUrl:      `${env.frontendUrl}/${ticketPlain.userRole}/support`,
          });
          await notificationService.dispatch({
            userId,
            type:          'general',
            title:         'Ticket status updated',
            message:       `Your ticket #${ticketPlain.ticketNumber} status changed to ${req.body.status}.`,
            referenceId:   id,
            referenceType: 'SupportTicket',
          });
        } catch (_) {}
      })();

      successResponse(res, 200, 'Ticket status updated', ticket);
    } catch (e) { next(e); }
  }

  async csAddMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id         = String(req.params.id);
      const visibility = (req.body.visibility ?? 'public') as 'public' | 'internal';
      const msg = await supportService.addMessage(id, {
        body:       req.body.body,
        visibility,
        authorId:   req.user!.userId,
        authorType: 'customer_service',
      });

      const msgPlain = toPlain(msg);

      await writeAuditLog({
        req,
        category:   'SYSTEM',
        action:     'ADD_SUPPORT_TICKET_MESSAGE',
        eventType:  'ADMIN_ACTION',
        status:     'SUCCESS',
        message:    'Message added to support ticket',
        entityType: 'SupportTicket',
        entityId:   id,
        metadata:   { visibility, messageId: msgPlain.id },
      });

      if (visibility === 'public') {
        void (async () => {
          try {
            const ticketData = await supportService.getTicket(id);
            const ticketPlain = toPlain(ticketData);
            const userId = ticketPlain.userId as string;
            const user   = await User.findByPk(userId);
            if (!user) return;
            await emailService.sendTicketReply({
              email:         user.email,
              recipientName: user.email,
              ticketNumber:  ticketPlain.ticketNumber as string,
              subject:       ticketPlain.subject as string,
              message:       req.body.body,
              agentName:     'SkulCredit Support',
              trackUrl:      `${env.frontendUrl}/${ticketPlain.userRole}/support`,
            });
            await notificationService.dispatch({
              userId,
              type:          'general',
              title:         'New reply on your ticket',
              message:       `A reply has been posted on your ticket #${ticketPlain.ticketNumber}.`,
              referenceId:   id,
              referenceType: 'SupportTicket',
            });
          } catch (_) {}
        })();
      }

      successResponse(res, 201, 'Message added', msg);
    } catch (e) { next(e); }
  }

  async csEscalate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id     = String(req.params.id);
      const result = await supportService.escalateTicket(id, {
        managerId: req.body.managerId,
        note:      req.body.note,
        taggedBy:  req.user!.userId,
      });

      const ticketPlain = toPlain(result.ticket);

      await writeAuditLog({
        req,
        category:   'SYSTEM',
        action:     'ESCALATE_SUPPORT_TICKET',
        eventType:  'ADMIN_ACTION',
        status:     'SUCCESS',
        message:    'Support ticket escalated',
        entityType: 'SupportTicket',
        entityId:   id,
        metadata:   { managerId: req.body.managerId, note: req.body.note },
      });

      void (async () => {
        try {
          const manager   = await User.findByPk(req.body.managerId);
          const submitter = await User.findByPk(ticketPlain.userId as string);
          const agentUser = await User.findByPk(req.user!.userId);

          if (manager) {
            await notificationService.dispatch({
              userId:        manager.id,
              type:          'general',
              title:         'Ticket escalated to you',
              message:       `Ticket #${ticketPlain.ticketNumber} has been escalated to you.`,
              referenceId:   id,
              referenceType: 'SupportTicket',
            });
            await emailService.sendManagerEscalation({
              email:           manager.email,
              managerName:     manager.email,
              ticketNumber:    ticketPlain.ticketNumber as string,
              subject:         ticketPlain.subject as string,
              customerName:    submitter?.email ?? 'Customer',
              escalatedByName: agentUser?.email ?? 'Agent',
              note:            req.body.note,
              ticketUrl:       `${env.frontendUrl}/cs/tickets/${id}`,
            });
          }

          if (submitter) {
            await emailService.sendTicketEscalated({
              email:         submitter.email,
              recipientName: submitter.email,
              ticketNumber:  ticketPlain.ticketNumber as string,
              subject:       ticketPlain.subject as string,
              managerName:   manager?.email ?? 'Manager',
              trackUrl:      `${env.frontendUrl}/${ticketPlain.userRole}/support`,
            });
            await notificationService.dispatch({
              userId:        submitter.id,
              type:          'general',
              title:         'Your ticket has been escalated',
              message:       `Your ticket #${ticketPlain.ticketNumber} has been escalated for priority handling.`,
              referenceId:   id,
              referenceType: 'SupportTicket',
            });
          }
        } catch (_) {}
      })();

      successResponse(res, 200, 'Ticket escalated', result);
    } catch (e) { next(e); }
  }

  async csTicketAudit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id    = String(req.params.id);
      const page  = parseInt(String(req.query.page ?? '1'), 10);
      const limit = parseInt(String(req.query.limit ?? '20'), 10);
      const data  = await supportService.getTicketAudit(id, page, limit);
      successResponse(res, 200, 'Audit log fetched', data);
    } catch (e) { next(e); }
  }

  async csListManagers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const managers = await supportService.listManagers();
      successResponse(res, 200, 'Managers fetched', managers);
    } catch (e) { next(e); }
  }

  async csDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await supportService.getCsDashboard();
      successResponse(res, 200, 'Dashboard fetched', stats);
    } catch (e) { next(e); }
  }
}

export default new SupportController();
