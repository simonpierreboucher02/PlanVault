import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Event, InsertEvent } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Download, Upload, FileText, Calendar, Database } from "lucide-react";
import { format } from "date-fns";
import Papa from "papaparse";
import { AppLayout } from "@/components/layouts/app-layout";

export default function ImportExportPage() {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation for importing events
  const importEventsMutation = useMutation({
    mutationFn: async (events: InsertEvent[]) => {
      // Get existing events for deduplication
      const existingEventsRes = await apiRequest('GET', '/api/events');
      const existingEvents = await existingEventsRes.json() as Event[];
      
      // Create deduplication key function
      const getDedupeKey = (event: InsertEvent | Event) => 
        `${event.title.toLowerCase()}-${new Date(event.startDate).toISOString()}-${event.category}`;
      
      const existingKeys = new Set(existingEvents.map(getDedupeKey));
      
      // Filter out duplicates
      const uniqueEvents = events.filter(event => !existingKeys.has(getDedupeKey(event)));
      
      const results = [];
      const skipped = events.length - uniqueEvents.length;
      
      for (const event of uniqueEvents) {
        try {
          const res = await apiRequest('POST', '/api/events', event);
          const createdEvent = await res.json();
          results.push(createdEvent);
        } catch (error) {
          console.error('Failed to import event:', event.title, error);
        }
      }
      return { results, skipped };
    },
    onSuccess: ({ results, skipped }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/categories'] });
      toast({
        title: "Import successful",
        description: `Successfully imported ${results.length} events${skipped > 0 ? `, skipped ${skipped} duplicates` : ''}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: "Failed to import events. Please try again.",
        variant: "destructive",
      });
    },
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ['/api/events', {}], // Use consistent hierarchical format
  });

  // Export to CSV
  const exportToCSV = () => {
    if (events.length === 0) {
      toast({
        title: "No events to export",
        description: "Create some events first before exporting.",
        variant: "destructive",
      });
      return;
    }

    const csvData = events.map(event => ({
      Title: event.title,
      Description: event.description || '',
      'Start Date': format(new Date(event.startDate), 'yyyy-MM-dd'),
      'Start Time': format(new Date(event.startDate), 'HH:mm'),
      Category: event.category,
      'Is Recurring': event.isRecurring ? 'Yes' : 'No',
      'Recurring Pattern': event.recurringPattern || '',
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `planvault-events-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: `Exported ${events.length} events to CSV`,
    });
  };

  // Export to iCal
  const exportToICal = () => {
    if (events.length === 0) {
      toast({
        title: "No events to export",
        description: "Create some events first before exporting.",
        variant: "destructive",
      });
      return;
    }

    let icalContent = "BEGIN:VCALENDAR\n";
    icalContent += "VERSION:2.0\n";
    icalContent += "PRODID:-//PlanVault//PlanVault Calendar//EN\n";
    icalContent += "CALSCALE:GREGORIAN\n";

    events.forEach(event => {
      const startDate = new Date(event.startDate);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Add 1 hour

      icalContent += "BEGIN:VEVENT\n";
      icalContent += `UID:${event.id}@planvault.com\n`;
      icalContent += `DTSTART:${format(startDate, "yyyyMMdd'T'HHmmss")}\n`;
      icalContent += `DTEND:${format(endDate, "yyyyMMdd'T'HHmmss")}\n`;
      icalContent += `SUMMARY:${event.title}\n`;
      if (event.description) {
        icalContent += `DESCRIPTION:${event.description}\n`;
      }
      icalContent += `CATEGORIES:${event.category}\n`;
      icalContent += "END:VEVENT\n";
    });

    icalContent += "END:VCALENDAR";

    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `planvault-events-${format(new Date(), 'yyyy-MM-dd')}.ics`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: `Exported ${events.length} events to iCal format`,
    });
  };

  // Export to JSON backup
  const exportToJSON = () => {
    if (events.length === 0) {
      toast({
        title: "No events to export",
        description: "Create some events first before exporting.",
        variant: "destructive",
      });
      return;
    }

    const jsonData = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      events: events,
    };

    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `planvault-backup-${format(new Date(), 'yyyy-MM-dd')}.json`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Backup created",
      description: `Created backup with ${events.length} events`,
    });
  };

  // Import from file
  const handleFileImport = async (file: File) => {
    setIsImporting(true);
    
    try {
      const fileContent = await file.text();
      let eventsToImport: InsertEvent[] = [];
      
      if (file.name.endsWith('.csv')) {
        const parsed = Papa.parse(fileContent, { 
          header: true, 
          skipEmptyLines: true,
          transformHeader: (header: string) => {
            // Transform various header formats to our standard format
            const lowerHeader = header.toLowerCase().trim();
            const headerMap: { [key: string]: string } = {
              'title': 'Title',
              'name': 'Title', 
              'event': 'Title',
              'event title': 'Title',
              'event name': 'Title',
              'summary': 'Title',
              'subject': 'Title',
              'description': 'Description',
              'desc': 'Description',
              'details': 'Description',
              'notes': 'Description',
              'note': 'Description',
              'start date': 'Start Date',
              'startdate': 'Start Date',
              'date': 'Start Date',
              'event date': 'Start Date',
              'start time': 'Start Time',
              'starttime': 'Start Time',
              'time': 'Start Time',
              'event time': 'Start Time',
              'category': 'Category',
              'type': 'Category',
              'label': 'Category',
              'tag': 'Category',
              'is recurring': 'Is Recurring',
              'recurring': 'Is Recurring',
              'repeat': 'Is Recurring',
              'recurring pattern': 'Recurring Pattern',
              'pattern': 'Recurring Pattern',
              'frequency': 'Recurring Pattern'
            };
            return headerMap[lowerHeader] || header;
          }
        });
        
        if (parsed.errors.length > 0) {
          throw new Error(`CSV parsing error: ${parsed.errors[0].message}`);
        }

        eventsToImport = parsed.data.map((row: any) => {
          const startDateStr = row['Start Date'] || '';
          const startTimeStr = row['Start Time'] || '09:00';
          
          const startDateTime = new Date(`${startDateStr}T${startTimeStr}:00`);
          
          if (isNaN(startDateTime.getTime())) {
            throw new Error(`Invalid date format: ${startDateStr} ${startTimeStr}`);
          }

          return {
            title: row.Title || 'Untitled Event',
            description: row.Description || null,
            startDate: startDateTime,
            endDate: null,
            category: (row.Category?.toLowerCase() === 'work' ? 'work' :
                     row.Category?.toLowerCase() === 'personal' ? 'personal' :
                     row.Category?.toLowerCase() === 'health' ? 'health' :
                     row.Category?.toLowerCase() === 'finance' ? 'finance' : 'personal') as "work" | "personal" | "health" | "finance",
            isRecurring: row['Is Recurring']?.toLowerCase() === 'yes' || row['Is Recurring'] === true,
            recurringPattern: row['Recurring Pattern'] ? row['Recurring Pattern'].toLowerCase() as "daily" | "weekly" | "monthly" | "yearly" : null,
            recurringEndDate: null,
            encryptedData: null,
          };
        }).filter(event => event.title && event.title.trim() !== '');
        
      } else if (file.name.endsWith('.json')) {
        const jsonData = JSON.parse(fileContent);
        
        // Handle different JSON formats
        if (jsonData.events && Array.isArray(jsonData.events)) {
          // PlanVault backup format
          eventsToImport = jsonData.events.map((event: any) => ({
            title: event.title || 'Untitled Event',
            description: event.description || null,
            startDate: new Date(event.startDate),
            endDate: event.endDate ? new Date(event.endDate) : null,
            category: ['work', 'personal', 'health', 'finance'].includes(event.category) ? event.category : 'personal',
            isRecurring: Boolean(event.isRecurring),
            recurringPattern: event.recurringPattern || null,
            recurringEndDate: event.recurringEndDate ? new Date(event.recurringEndDate) : null,
            encryptedData: null,
          }));
        } else if (Array.isArray(jsonData)) {
          // Simple array format
          eventsToImport = jsonData.map((event: any) => ({
            title: event.title || event.name || 'Untitled Event',
            description: event.description || event.details || null,
            startDate: new Date(event.startDate || event.date),
            endDate: event.endDate ? new Date(event.endDate) : null,
            category: ['work', 'personal', 'health', 'finance'].includes(event.category) ? event.category : 'personal',
            isRecurring: Boolean(event.isRecurring || event.recurring),
            recurringPattern: event.recurringPattern || event.pattern || null,
            recurringEndDate: null,
            encryptedData: null,
          }));
        }
      } else {
        throw new Error('Unsupported file format. Please use CSV or JSON files.');
      }

      if (eventsToImport.length === 0) {
        throw new Error('No valid events found in the file');
      }

      await importEventsMutation.mutateAsync(eventsToImport);
      
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileImport(file);
    }
  };

  const earliestEventDate = events.length > 0 ? 
    format(new Date(Math.min(...events.map(e => new Date(e.startDate).getTime()))), 'MMM dd, yyyy') : 
    'N/A';
    
  const latestEventDate = events.length > 0 ? 
    format(new Date(Math.max(...events.map(e => new Date(e.startDate).getTime()))), 'MMM dd, yyyy') : 
    'N/A';

  return (
    <AppLayout title="Import/Export">
      {/* Desktop Header */}
      <header className="hidden md:block bg-card border-b border-border px-6 py-4">
        <h2 className="text-xl font-semibold">Import & Export</h2>
      </header>

      <div className="flex-1 p-3 md:p-6">
        <div className="grid gap-4 md:gap-6 md:grid-cols-2">
          
          {/* Export Section */}
          <div className="space-y-4 md:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base md:text-lg">
                  <Download className="h-4 md:h-5 w-4 md:w-5 mr-2" />
                  Export Your Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary */}
                <div className="bg-muted/50 rounded-lg p-3 md:p-4" data-testid="export-summary">
                  <div className="grid grid-cols-2 gap-3 md:gap-4 text-center">
                    <div>
                      <div className="text-lg md:text-2xl font-bold text-primary">{events.length}</div>
                      <div className="text-xs md:text-sm text-muted-foreground">Total Events</div>
                    </div>
                    <div>
                      <div className="text-sm md:text-base font-semibold">Date Range</div>
                      <div className="text-xs md:text-sm text-muted-foreground">
                        {events.length > 0 ? `${earliestEventDate} - ${latestEventDate}` : 'No events'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Export Buttons */}
                <div className="grid gap-2 md:gap-3">
                  <Button 
                    onClick={exportToCSV}
                    className="w-full justify-start"
                    variant="outline"
                    disabled={events.length === 0}
                    data-testid="button-export-csv"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Export to CSV
                  </Button>

                  <Button 
                    onClick={exportToICal}
                    className="w-full justify-start"
                    variant="outline"
                    disabled={events.length === 0}
                    data-testid="button-export-ics"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Export to iCal (.ics)
                  </Button>

                  <Button 
                    onClick={exportToJSON}
                    className="w-full justify-start"
                    variant="outline"
                    disabled={events.length === 0}
                    data-testid="button-export-json"
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Create JSON Backup
                  </Button>
                </div>

                {events.length === 0 && (
                  <p className="text-xs md:text-sm text-muted-foreground text-center">
                    Create some events first before exporting
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Import Section */}
          <div className="space-y-4 md:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base md:text-lg">
                  <Upload className="h-4 md:h-5 w-4 md:w-5 mr-2" />
                  Import Your Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Input */}
                <div>
                  <Label htmlFor="import-file" className="text-sm md:text-base">Choose File</Label>
                  <Input
                    id="import-file"
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.json"
                    onChange={handleFileSelect}
                    disabled={isImporting || importEventsMutation.isPending}
                    className="mt-1"
                    data-testid="input-import-file"
                  />
                </div>

                {/* Import Status */}
                {(isImporting || importEventsMutation.isPending) && (
                  <div className="flex items-center justify-center p-3 md:p-4 bg-muted/50 rounded-lg">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-3"></div>
                    <span className="text-sm">Processing import...</span>
                  </div>
                )}

                {/* Supported Formats */}
                <div className="bg-muted/50 rounded-lg p-3 md:p-4">
                  <h4 className="font-semibold mb-2 text-sm md:text-base">Supported Formats</h4>
                  <ul className="text-xs md:text-sm text-muted-foreground space-y-1">
                    <li>• <strong>CSV:</strong> Title, Description, Start Date, Start Time, Category</li>
                    <li>• <strong>JSON:</strong> PlanVault backup format or simple array</li>
                  </ul>
                  <p className="text-xs md:text-sm text-muted-foreground mt-2">
                    Duplicate events (same title, date, and category) will be automatically skipped.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}