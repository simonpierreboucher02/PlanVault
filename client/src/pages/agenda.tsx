import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Event } from "@shared/schema";
import { format, isToday, isTomorrow, isYesterday, isSameWeek, isThisWeek } from "date-fns";
import { Search, Calendar, Clock } from "lucide-react";
import { getCategoryColor } from "@/lib/calendar-utils";
import { AppLayout } from "@/components/layouts/app-layout";

export default function AgendaPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events', {}], // Use consistent hierarchical format
  });

  const filteredEvents = events
    .filter(event => 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description?.toLowerCase() ?? "").includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const getDateLabel = (date: Date): string => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isYesterday(date)) return "Yesterday";
    if (isThisWeek(date)) return format(date, 'EEEE');
    return format(date, 'MMM dd, yyyy');
  };

  const groupEventsByDate = (events: Event[]) => {
    const groups = new Map<string, Event[]>();
    
    events.forEach(event => {
      const date = new Date(event.startDate);
      const dateKey = format(date, 'yyyy-MM-dd');
      
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(event);
    });

    return Array.from(groups.entries()).map(([dateKey, events]) => ({
      date: new Date(dateKey),
      events,
    }));
  };

  const groupedEvents = groupEventsByDate(filteredEvents);

  return (
    <AppLayout title="Agenda">
      {/* Desktop Header */}
      <header className="hidden md:block bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Agenda</h2>
          
          <div className="flex items-center space-x-4">
            <div className="relative" data-testid="search-agenda">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <div className="md:hidden bg-card border-b border-border px-4 py-3">
        <div className="relative" data-testid="search-agenda-mobile">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Agenda Content */}
      <div className="flex-1 p-3 md:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : groupedEvents.length === 0 ? (
          <Card>
            <CardContent className="p-8 md:p-12 text-center">
              <Calendar className="h-12 md:h-16 w-12 md:w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base md:text-lg font-semibold mb-2">No events found</h3>
              <p className="text-sm md:text-base text-muted-foreground">
                {searchQuery 
                  ? "Try adjusting your search terms" 
                  : "Create your first event to get started"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {groupedEvents.map(({ date, events }) => (
              <div key={format(date, 'yyyy-MM-dd')} data-testid={`agenda-date-${format(date, 'yyyy-MM-dd')}`}>
                <div className="flex items-center mb-3 md:mb-4">
                  <div className="flex items-center text-base md:text-lg font-semibold">
                    <Calendar className="h-4 md:h-5 w-4 md:w-5 mr-2 text-primary" />
                    {getDateLabel(date)}
                  </div>
                  <div className="ml-3 md:ml-4 text-xs md:text-sm text-muted-foreground">
                    {format(date, 'MMM dd, yyyy')}
                  </div>
                  <div className="flex-1 h-px bg-border ml-3 md:ml-4" />
                </div>
                
                <div className="space-y-2 md:space-y-3">
                  {events.map((event) => (
                    <Card 
                      key={event.id} 
                      className={`hover:shadow-sm transition-shadow cursor-pointer event-${event.category}`}
                      data-testid={`agenda-event-${event.id}`}
                    >
                      <CardContent className="p-3 md:p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 md:mb-2">
                              <h3 className="font-semibold text-sm md:text-base truncate">{event.title}</h3>
                              <Badge 
                                variant="secondary" 
                                className={`${getCategoryColor(event.category as "personal" | "work" | "health" | "finance")} text-[10px] md:text-xs shrink-0`}
                              >
                                {event.category}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">
                              <Clock className="h-3 md:h-4 w-3 md:w-4 mr-1 md:mr-2" />
                              {format(new Date(event.startDate), 'h:mm a')}
                            </div>
                            
                            {event.description && (
                              <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                                {event.description}
                              </p>
                            )}
                            
                            {event.isRecurring && (
                              <div className="mt-1 md:mt-2">
                                <Badge variant="outline" className="text-[10px] md:text-xs">
                                  Recurring {event.recurringPattern}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}