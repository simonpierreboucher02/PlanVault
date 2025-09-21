import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { 
  loginSchema, 
  registerSchema, 
  insertEventSchema,
  eventUpdateSchema,
  insertReminderSchema
} from "@shared/schema";
import { z } from "zod";

interface AuthenticatedRequest extends Request {
  userId?: string;
}

// Middleware to verify authentication
async function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const sessionToken = req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionToken) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const session = await storage.getSession(sessionToken);
  if (!session) {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }

  req.userId = session.userId;
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate recovery key
  app.post('/api/generate-recovery-key', (req, res) => {
    const words = [
      'alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel',
      'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa',
      'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey', 'xray'
    ];
    
    const recoveryKey = Array.from({ length: 8 }, () => 
      words[Math.floor(Math.random() * words.length)]
    ).join('-');
    
    res.json({ recoveryKey });
  });

  // Register
  app.post('/api/auth/register', async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      // Hash password and create encryption key
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const encryptionKey = crypto.randomBytes(32).toString('hex');
      
      const user = await storage.createUser({
        username: data.username,
        password: hashedPassword,
        recoveryKey: data.recoveryKey,
        encryptionKey: encryptionKey
      });

      // Create session
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      await storage.createSession({
        userId: user.id,
        sessionToken,
        expiresAt
      });

      res.json({
        user: {
          id: user.id,
          username: user.username,
          encryptionKey: user.encryptionKey
        },
        sessionToken
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(data.username);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(data.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Create session
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      await storage.createSession({
        userId: user.id,
        sessionToken,
        expiresAt
      });

      res.json({
        user: {
          id: user.id,
          username: user.username,
          encryptionKey: user.encryptionKey
        },
        sessionToken
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Logout
  app.post('/api/auth/logout', async (req, res) => {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    if (sessionToken) {
      await storage.deleteSession(sessionToken);
    }
    res.json({ message: 'Logged out successfully' });
  });

  // Get current user
  app.get('/api/auth/me', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    const user = await storage.getUser(req.userId!);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      id: user.id,
      username: user.username,
      encryptionKey: user.encryptionKey
    });
  });

  // Get events
  app.get('/api/events', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { start, end } = req.query;
      const startDate = start ? new Date(start as string) : undefined;
      const endDate = end ? new Date(end as string) : undefined;
      
      const events = await storage.getEvents(req.userId!, startDate, endDate);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch events' });
    }
  });

  // Create event
  app.post('/api/events', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = insertEventSchema.parse(req.body);
      const event = await storage.createEvent({ ...data, userId: req.userId! } as any);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create event' });
    }
  });

  // Update event
  app.put('/api/events/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = insertEventSchema.partial().parse(req.body);
      
      const event = await storage.updateEvent(id, req.userId!, data);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update event' });
    }
  });

  // Delete event
  app.delete('/api/events/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteEvent(id, req.userId!);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      res.json({ message: 'Event deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete event' });
    }
  });

  // Get event reminders
  app.get('/api/events/:eventId/reminders', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { eventId } = req.params;
      
      // Verify event belongs to user
      const event = await storage.getEvent(eventId, req.userId!);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      const reminders = await storage.getEventReminders(eventId);
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch reminders' });
    }
  });

  // Create reminder
  app.post('/api/reminders', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = insertReminderSchema.parse(req.body);
      
      // Verify event belongs to user
      const event = await storage.getEvent(data.eventId, req.userId!);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      const reminder = await storage.createReminder(data);
      res.status(201).json(reminder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create reminder' });
    }
  });

  // Get category statistics
  app.get('/api/stats/categories', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = await storage.getEventCountsByCategory(req.userId!);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch statistics' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
