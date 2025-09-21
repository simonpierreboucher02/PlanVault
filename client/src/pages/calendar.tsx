import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarGrid } from "@/components/calendar-grid";
import { EventModal } from "@/components/event-modal";
import { AppLayout } from "@/components/layouts/app-layout";
import { Event } from "@shared/schema";

export default function CalendarPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const handleAddEvent = () => {
    setSelectedEvent(undefined);
    setIsEventModalOpen(true);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(undefined);
    setIsEventModalOpen(true);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setSelectedDate(undefined);
    setIsEventModalOpen(true);
  };

  return (
    <AppLayout title="Calendar">
      {/* Desktop Header */}
      <header className="hidden md:block bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold">Calendar</h2>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative" data-testid="search-events">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            {/* View Toggle - Responsive */}
            <div className="hidden lg:flex bg-muted rounded-lg p-1">
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-card text-foreground shadow-sm"
                data-testid="view-month"
              >
                Month
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground"
                disabled
                data-testid="view-week"
              >
                Week
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground"
                disabled
                data-testid="view-day"
              >
                Day
              </Button>
            </div>

            {/* Add Event Button */}
            <Button 
              onClick={handleAddEvent}
              data-testid="button-add-event"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Add Event</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <div className="md:hidden bg-card border-b border-border px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="relative flex-1" data-testid="search-events-mobile">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button 
            onClick={handleAddEvent}
            size="icon"
            data-testid="button-add-event-mobile"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 p-3 md:p-6">
        <CalendarGrid 
          onDayClick={handleDayClick}
          onEventClick={handleEventClick}
          searchQuery={searchQuery}
        />
      </div>

      <EventModal
        open={isEventModalOpen}
        onOpenChange={setIsEventModalOpen}
        event={selectedEvent}
        initialDate={selectedDate}
      />
    </AppLayout>
  );
}