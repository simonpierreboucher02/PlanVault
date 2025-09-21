import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Event, InsertEvent } from "@shared/schema";
import { formatEventDate, formatEventDateTime } from "@/lib/calendar-utils";

interface EventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Event;
  initialDate?: Date;
}

export function EventModal({ open, onOpenChange, event, initialDate }: EventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [category, setCategory] = useState<"work" | "personal" | "health" | "finance">("personal");
  const [reminderMinutes, setReminderMinutes] = useState<number>(0);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState<"daily" | "weekly" | "monthly" | "yearly">("weekly");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createEventMutation = useMutation({
    mutationFn: async (eventData: InsertEvent) => {
      const res = await apiRequest('POST', '/api/events', eventData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/categories'] });
      toast({
        title: "Success",
        description: "Event created successfully",
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (eventData: Partial<InsertEvent> & { id: string }) => {
      const { id, ...data } = eventData;
      const res = await apiRequest('PUT', `/api/events/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/categories'] });
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update event",
        variant: "destructive",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await apiRequest('DELETE', `/api/events/${eventId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/categories'] });
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive",
      });
    },
  });

  // Reset form when modal opens/closes or event changes
  useEffect(() => {
    if (open) {
      if (event) {
        // Edit mode
        setTitle(event.title);
        setDescription(event.description || "");
        const eventDate = new Date(event.startDate);
        setStartDate(formatEventDate(eventDate));
        setStartTime(eventDate.toTimeString().slice(0, 5));
        setCategory(event.category as typeof category);
        setIsRecurring(event.isRecurring || false);
        setRecurringPattern((event.recurringPattern as typeof recurringPattern) || "weekly");
      } else {
        // Create mode
        const dateToUse = initialDate || new Date();
        setTitle("");
        setDescription("");
        setStartDate(formatEventDate(dateToUse));
        setStartTime("09:00");
        setCategory("personal");
        setReminderMinutes(0);
        setIsRecurring(false);
        setRecurringPattern("weekly");
      }
    }
  }, [open, event, initialDate]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Event title is required",
        variant: "destructive",
      });
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    
    const eventData: InsertEvent = {
      title: title.trim(),
      description: description.trim() || null,
      startDate: startDateTime,
      endDate: null,
      category,
      isRecurring,
      recurringPattern: isRecurring ? recurringPattern : null,
      recurringEndDate: null,
      encryptedData: null,
    };

    if (event) {
      updateEventMutation.mutate({ ...eventData, id: event.id });
    } else {
      createEventMutation.mutate(eventData);
    }
  };

  const handleDelete = () => {
    if (event && window.confirm("Are you sure you want to delete this event?")) {
      deleteEventMutation.mutate(event.id);
    }
  };

  const isLoading = createEventMutation.isPending || updateEventMutation.isPending || deleteEventMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="modal-title">
            {event ? "Edit Event" : "Add New Event"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div data-testid="input-event-title">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              placeholder="Enter event title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div data-testid="input-start-date">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div data-testid="input-start-time">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div data-testid="select-category">
            <Label>Category</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as typeof category)} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div data-testid="input-description">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Add event description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div data-testid="select-reminder">
            <Label>Reminder</Label>
            <Select 
              value={reminderMinutes.toString()} 
              onValueChange={(value) => setReminderMinutes(parseInt(value))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No reminder</SelectItem>
                <SelectItem value="15">15 minutes before</SelectItem>
                <SelectItem value="30">30 minutes before</SelectItem>
                <SelectItem value="60">1 hour before</SelectItem>
                <SelectItem value="1440">1 day before</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2" data-testid="checkbox-recurring">
            <Checkbox
              id="recurring"
              checked={isRecurring}
              onCheckedChange={(checked) => setIsRecurring(checked === true)}
              disabled={isLoading}
            />
            <Label htmlFor="recurring">Recurring event</Label>
          </div>

          {isRecurring && (
            <div data-testid="select-recurring-pattern">
              <Label>Repeat</Label>
              <Select 
                value={recurringPattern} 
                onValueChange={(value) => setRecurringPattern(value as typeof recurringPattern)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="flex justify-between pt-4 border-t border-border">
            <div>
              {event && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isLoading}
                  data-testid="button-delete"
                >
                  Delete
                </Button>
              )}
            </div>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                data-testid="button-save"
              >
                {isLoading ? "Saving..." : event ? "Update" : "Save Event"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
