import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCalendarDays, getMonthName, navigateMonth, getCategoryColor } from "@/lib/calendar-utils";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { Event } from "@shared/schema";
import { format, startOfMonth, endOfMonth } from "date-fns";

interface CalendarGridProps {
  onDayClick?: (date: Date) => void;
  onEventClick?: (event: Event) => void;
  searchQuery?: string;
}

export function CalendarGrid({ onDayClick, onEventClick, searchQuery = "" }: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>();
  const isMobile = useIsMobile();

  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);

  const { data: allEvents = [] } = useQuery<Event[]>({
    queryKey: ['/api/events', { 
      start: format(startDate, 'yyyy-MM-dd'), 
      end: format(endDate, 'yyyy-MM-dd') 
    }],
  });

  // Filter events based on search query
  const events = allEvents.filter(event => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return event.title.toLowerCase().includes(query) || 
           (event.description?.toLowerCase() ?? "").includes(query);
  });

  const calendarDays = getCalendarDays(currentDate, selectedDate);

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    onDayClick?.(date);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(navigateMonth(currentDate, 'prev'));
  };

  const handleNextMonth = () => {
    setCurrentDate(navigateMonth(currentDate, 'next'));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-muted">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold" data-testid="text-current-month">
            {getMonthName(currentDate)}
          </h2>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handlePreviousMonth}
              data-testid="button-prev-month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleNextMonth}
              data-testid="button-next-month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleToday}
              data-testid="button-today"
            >
              Today
            </Button>
          </div>
        </div>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 bg-muted/50">
        {dayNames.map((day) => (
          <div key={day} className="p-2 md:p-4 text-center text-xs md:text-sm font-medium text-muted-foreground">
            <span className="md:hidden">{day.slice(0, 2)}</span>
            <span className="hidden md:inline">{day}</span>
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const dayEvents = getEventsForDay(day.date);
          
          return (
            <div
              key={index}
              className={`
                calendar-day min-h-20 md:min-h-32 p-1.5 md:p-3 border-b border-r border-border cursor-pointer transition-colors
                ${day.isCurrentMonth ? '' : 'bg-muted/50'}
                ${day.isToday ? 'today' : ''}
                ${day.isSelected ? 'selected' : ''}
              `}
              onClick={() => handleDayClick(day.date)}
              data-testid={`calendar-day-${format(day.date, 'yyyy-MM-dd')}`}
            >
              <span 
                className={`
                  text-xs md:text-sm font-medium
                  ${day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}
                  ${day.isSelected ? 'text-primary-foreground' : ''}
                `}
              >
                {day.dayNumber}
              </span>
              
              {dayEvents.length > 0 && (
                <div className="mt-0.5 md:mt-1 space-y-0.5 md:space-y-1">
                  {dayEvents.slice(0, isMobile ? 2 : 3).map((event) => (
                    <div
                      key={event.id}
                      className={`
                        text-xs p-0.5 md:p-1 rounded cursor-pointer truncate
                        event-${event.category}
                      `}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      data-testid={`event-${event.id}`}
                      title={event.title} // Show full title on hover
                    >
                      {isMobile && event.title.length > 8 ? `${event.title.slice(0, 8)}...` : event.title}
                    </div>
                  ))}
                  {dayEvents.length > (isMobile ? 2 : 3) && (
                    <div className="text-xs text-muted-foreground">
                      +{dayEvents.length - (isMobile ? 2 : 3)} more
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
