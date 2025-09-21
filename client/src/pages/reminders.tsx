import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Event, Reminder } from "@shared/schema";
import { format } from "date-fns";
import { Bell, BellRing, Clock, Calendar } from "lucide-react";
import { AppLayout } from "@/components/layouts/app-layout";

export default function RemindersPage() {
  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ['/api/events', {}], // Use consistent hierarchical format
  });

  // Get events with their calculated reminder times
  const eventsWithReminders = events
    .filter(event => new Date(event.startDate) > new Date()) // Only future events
    .map(event => ({
      ...event,
      reminderTime15: new Date(new Date(event.startDate).getTime() - 15 * 60 * 1000),
      reminderTime30: new Date(new Date(event.startDate).getTime() - 30 * 60 * 1000),
      reminderTime60: new Date(new Date(event.startDate).getTime() - 60 * 60 * 1000),
      reminderTime1440: new Date(new Date(event.startDate).getTime() - 24 * 60 * 60 * 1000),
    }))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const upcomingReminders = eventsWithReminders.filter(event => {
    const now = new Date();
    const eventDate = new Date(event.startDate);
    const daysBefore = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysBefore <= 7; // Show reminders for events in the next 7 days
  });

  const getTimeUntilEvent = (eventDate: Date): string => {
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `in ${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `in ${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return 'now';
    }
  };

  return (
    <AppLayout title="Reminders">
      {/* Desktop Header */}
      <header className="hidden md:block bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Reminders</h2>
        </div>
      </header>

      {/* Reminders Content */}
      <div className="flex-1 p-3 md:p-6">
        {eventsLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-4 md:gap-6">
            {/* Upcoming Reminders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base md:text-lg">
                  <BellRing className="h-4 md:h-5 w-4 md:w-5 mr-2" />
                  Upcoming Events (Next 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingReminders.length === 0 ? (
                  <div className="text-center py-6 md:py-8">
                    <Bell className="h-12 md:h-16 w-12 md:w-16 text-muted-foreground mx-auto mb-3 md:mb-4" />
                    <h3 className="text-base md:text-lg font-semibold mb-2">No upcoming events</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      You have no events scheduled for the next 7 days
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    {upcomingReminders.map((event) => (
                      <div 
                        key={event.id} 
                        className={`p-3 md:p-4 rounded-lg border event-${event.category}`}
                        data-testid={`reminder-${event.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 md:mb-2">
                              <h4 className="font-semibold text-sm md:text-base">{event.title}</h4>
                              <Badge variant="secondary" className="text-[10px] md:text-xs">
                                {event.category}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center text-xs md:text-sm text-muted-foreground mb-2">
                              <Calendar className="h-3 md:h-4 w-3 md:w-4 mr-1 md:mr-2" />
                              {format(new Date(event.startDate), 'MMM dd, yyyy')}
                              <Clock className="h-3 md:h-4 w-3 md:w-4 mr-1 md:mr-2 ml-3 md:ml-4" />
                              {format(new Date(event.startDate), 'h:mm a')}
                            </div>
                            
                            {event.description && (
                              <p className="text-xs md:text-sm text-muted-foreground mb-2 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                            
                            <div className="text-xs md:text-sm font-medium text-primary">
                              {getTimeUntilEvent(new Date(event.startDate))}
                            </div>
                          </div>
                          
                          <div className="ml-3 md:ml-4">
                            <Bell className="h-4 md:h-5 w-4 md:w-5 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Future Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base md:text-lg">
                  <Calendar className="h-4 md:h-5 w-4 md:w-5 mr-2" />
                  All Future Events ({eventsWithReminders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eventsWithReminders.length === 0 ? (
                  <div className="text-center py-6 md:py-8">
                    <Calendar className="h-12 md:h-16 w-12 md:w-16 text-muted-foreground mx-auto mb-3 md:mb-4" />
                    <h3 className="text-base md:text-lg font-semibold mb-2">No future events</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Create some events to see reminders here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 md:space-y-3">
                    {eventsWithReminders.slice(0, 10).map((event) => (
                      <div 
                        key={event.id}
                        className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-muted/50"
                        data-testid={`future-event-${event.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium text-sm md:text-base truncate">{event.title}</h5>
                            <Badge variant="outline" className="text-[10px] md:text-xs shrink-0">
                              {event.category}
                            </Badge>
                          </div>
                          <div className="text-xs md:text-sm text-muted-foreground mt-1">
                            {format(new Date(event.startDate), 'MMM dd, yyyy • h:mm a')}
                          </div>
                        </div>
                        <div className="text-xs md:text-sm text-primary font-medium ml-3">
                          {getTimeUntilEvent(new Date(event.startDate))}
                        </div>
                      </div>
                    ))}
                    {eventsWithReminders.length > 10 && (
                      <div className="text-center pt-2 md:pt-3">
                        <p className="text-xs md:text-sm text-muted-foreground">
                          And {eventsWithReminders.length - 10} more events...
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}