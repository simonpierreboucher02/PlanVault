import { 
  users, 
  events, 
  reminders, 
  userSessions,
  type User, 
  type InsertUser, 
  type Event, 
  type InsertEvent,
  type Reminder,
  type InsertReminder,
  type UserSession,
  type InsertSession
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Session methods
  createSession(session: InsertSession): Promise<UserSession>;
  getSession(sessionToken: string): Promise<UserSession | undefined>;
  deleteSession(sessionToken: string): Promise<void>;
  
  // Event methods
  getEvents(userId: string, startDate?: Date, endDate?: Date): Promise<Event[]>;
  getEvent(id: string, userId: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent & { userId: string }): Promise<Event>;
  updateEvent(id: string, userId: string, updates: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string, userId: string): Promise<boolean>;
  
  // Reminder methods
  getEventReminders(eventId: string): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  deleteReminder(id: string): Promise<boolean>;
  
  // Statistics
  getEventCountsByCategory(userId: string): Promise<{ category: string; count: number }[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createSession(insertSession: InsertSession): Promise<UserSession> {
    const [session] = await db
      .insert(userSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getSession(sessionToken: string): Promise<UserSession | undefined> {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(and(
        eq(userSessions.sessionToken, sessionToken),
        gte(userSessions.expiresAt, new Date())
      ));
    return session || undefined;
  }

  async deleteSession(sessionToken: string): Promise<void> {
    await db.delete(userSessions).where(eq(userSessions.sessionToken, sessionToken));
  }

  async getEvents(userId: string, startDate?: Date, endDate?: Date): Promise<Event[]> {
    let conditions = [eq(events.userId, userId)];
    
    if (startDate && endDate) {
      conditions.push(gte(events.startDate, startDate));
      conditions.push(lte(events.startDate, endDate));
    }
    
    const query = db.select().from(events).where(and(...conditions));
    
    return await query.orderBy(events.startDate);
  }

  async getEvent(id: string, userId: string): Promise<Event | undefined> {
    const [event] = await db
      .select()
      .from(events)
      .where(and(eq(events.id, id), eq(events.userId, userId)));
    return event || undefined;
  }

  async createEvent(insertEvent: InsertEvent & { userId: string }): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values(insertEvent)
      .returning();
    return event;
  }

  async updateEvent(id: string, userId: string, updates: Partial<InsertEvent>): Promise<Event | undefined> {
    const [event] = await db
      .update(events)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(events.id, id), eq(events.userId, userId)))
      .returning();
    return event || undefined;
  }

  async deleteEvent(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(events)
      .where(and(eq(events.id, id), eq(events.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getEventReminders(eventId: string): Promise<Reminder[]> {
    return await db.select().from(reminders).where(eq(reminders.eventId, eventId));
  }

  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    const [reminder] = await db
      .insert(reminders)
      .values(insertReminder)
      .returning();
    return reminder;
  }

  async deleteReminder(id: string): Promise<boolean> {
    const result = await db.delete(reminders).where(eq(reminders.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getEventCountsByCategory(userId: string): Promise<{ category: string; count: number }[]> {
    const results = await db
      .select({
        category: events.category,
        count: sql<number>`count(*)::int`
      })
      .from(events)
      .where(eq(events.userId, userId))
      .groupBy(events.category);
    
    return results;
  }
}

// Fallback MemStorage for development
export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private events: Map<string, Event> = new Map();
  private reminders: Map<string, Reminder> = new Map();
  private sessions: Map<string, UserSession> = new Map();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = { 
      ...insertUser, 
      id: randomUUID(),
      createdAt: new Date()
    };
    this.users.set(user.id, user);
    return user;
  }

  async createSession(insertSession: InsertSession): Promise<UserSession> {
    const session: UserSession = {
      ...insertSession,
      id: randomUUID(),
      createdAt: new Date()
    };
    this.sessions.set(session.sessionToken, session);
    return session;
  }

  async getSession(sessionToken: string): Promise<UserSession | undefined> {
    const session = this.sessions.get(sessionToken);
    if (session && session.expiresAt > new Date()) {
      return session;
    }
    return undefined;
  }

  async deleteSession(sessionToken: string): Promise<void> {
    this.sessions.delete(sessionToken);
  }

  async getEvents(userId: string, startDate?: Date, endDate?: Date): Promise<Event[]> {
    let userEvents = Array.from(this.events.values()).filter(e => e.userId === userId);
    
    if (startDate && endDate) {
      userEvents = userEvents.filter(e => 
        e.startDate >= startDate && e.startDate <= endDate
      );
    }
    
    return userEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  async getEvent(id: string, userId: string): Promise<Event | undefined> {
    const event = this.events.get(id);
    return event && event.userId === userId ? event : undefined;
  }

  async createEvent(insertEvent: InsertEvent & { userId: string }): Promise<Event> {
    const event: Event = {
      id: randomUUID(),
      userId: insertEvent.userId,
      title: insertEvent.title,
      description: insertEvent.description || null,
      startDate: insertEvent.startDate,
      endDate: insertEvent.endDate || null,
      category: insertEvent.category || 'personal',
      isRecurring: insertEvent.isRecurring || false,
      recurringPattern: insertEvent.recurringPattern || null,
      recurringEndDate: insertEvent.recurringEndDate || null,
      encryptedData: insertEvent.encryptedData || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.events.set(event.id, event);
    return event;
  }

  async updateEvent(id: string, userId: string, updates: Partial<InsertEvent>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event || event.userId !== userId) return undefined;
    
    const updatedEvent = { ...event, ...updates, updatedAt: new Date() };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: string, userId: string): Promise<boolean> {
    const event = this.events.get(id);
    if (!event || event.userId !== userId) return false;
    
    return this.events.delete(id);
  }

  async getEventReminders(eventId: string): Promise<Reminder[]> {
    return Array.from(this.reminders.values()).filter(r => r.eventId === eventId);
  }

  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    const reminder: Reminder = {
      ...insertReminder,
      id: randomUUID(),
      isTriggered: false,
      createdAt: new Date()
    };
    this.reminders.set(reminder.id, reminder);
    return reminder;
  }

  async deleteReminder(id: string): Promise<boolean> {
    return this.reminders.delete(id);
  }

  async getEventCountsByCategory(userId: string): Promise<{ category: string; count: number }[]> {
    const userEvents = Array.from(this.events.values()).filter(e => e.userId === userId);
    const counts = new Map<string, number>();
    
    userEvents.forEach(event => {
      counts.set(event.category, (counts.get(event.category) || 0) + 1);
    });
    
    return Array.from(counts.entries()).map(([category, count]) => ({ category, count }));
  }
}

export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
