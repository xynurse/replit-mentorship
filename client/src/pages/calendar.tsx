import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Clock, MapPin, Plus, ChevronLeft, ChevronRight, Ban, Users, Video } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, addMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CalendarEvent, User } from "@shared/schema";

type PublicUserInfo = Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role' | 'profileImage'>;

interface DisplayEvent {
  id: string;
  title: string;
  date: Date;
  endDate?: Date;
  type: "task" | "meeting" | "block";
  status?: string;
  location?: string;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showNewEventDialog, setShowNewEventDialog] = useState(false);
  const [eventType, setEventType] = useState<"meeting" | "block">("meeting");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    duration: 30,
    meetingUrl: "",
    location: "",
  });

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<any[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: calendarEvents = [], isLoading: isLoadingEvents } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar-events"],
  });

  const { data: messageableUsers = [] } = useQuery<PublicUserInfo[]>({
    queryKey: ["/api/users/messageable"],
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/calendar-events", data);
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to create event" }));
        throw new Error(error.message || "Failed to create event");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: eventType === "meeting" ? "Meeting scheduled" : "Time blocked",
        description: eventType === "meeting" 
          ? "Your meeting has been scheduled successfully."
          : "Your time has been blocked on the calendar.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events"] });
      setShowNewEventDialog(false);
      resetNewEventForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    },
  });

  const resetNewEventForm = () => {
    setNewEvent({
      title: "",
      description: "",
      date: "",
      startTime: "",
      endTime: "",
      duration: 30,
      meetingUrl: "",
      location: "",
    });
    setSelectedParticipants([]);
    setEventType("meeting");
  };

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.startTime) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (eventType === "meeting" && selectedParticipants.length === 0) {
      toast({
        title: "No participants",
        description: "Please select at least one participant for the meeting",
        variant: "destructive",
      });
      return;
    }

    const startTime = new Date(`${newEvent.date}T${newEvent.startTime}`);
    let endTime: Date;
    
    if (newEvent.endTime) {
      endTime = new Date(`${newEvent.date}T${newEvent.endTime}`);
    } else {
      endTime = addMinutes(startTime, newEvent.duration);
    }

    const eventData = {
      type: eventType === "meeting" ? "MEETING" : "BLOCK",
      title: newEvent.title,
      description: newEvent.description || undefined,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      location: newEvent.location || undefined,
      meetingUrl: newEvent.meetingUrl || undefined,
      format: newEvent.meetingUrl ? "VIRTUAL" : (newEvent.location ? "IN_PERSON" : undefined),
      participantIds: eventType === "meeting" ? [...selectedParticipants, user?.id] : [user?.id],
    };

    createEventMutation.mutate(eventData);
  };

  const taskEvents: DisplayEvent[] = tasks
    .filter(t => t.dueDate)
    .map(t => ({
      id: t.id,
      title: t.title,
      date: new Date(t.dueDate),
      type: "task" as const,
      status: t.status,
    }));

  const calendarDisplayEvents: DisplayEvent[] = calendarEvents.map(e => ({
    id: e.id,
    title: e.title,
    date: new Date(e.startTime),
    endDate: new Date(e.endTime),
    type: e.type === "BLOCK" ? "block" as const : "meeting" as const,
    status: e.status || undefined,
    location: e.location || undefined,
  }));

  const allEvents = [...taskEvents, ...calendarDisplayEvents];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startPadding = monthStart.getDay();
  const paddingDays = Array(startPadding).fill(null);

  const getEventsForDay = (date: Date) => {
    return allEvents.filter(event => isSameDay(event.date, date));
  };

  const selectedDateEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  const openNewEventWithDate = (date: Date) => {
    setNewEvent(prev => ({
      ...prev,
      date: format(date, "yyyy-MM-dd"),
    }));
    setShowNewEventDialog(true);
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  if (!user) return null;

  const isLoading = isLoadingTasks || isLoadingEvents;

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-calendar-title">
              <CalendarIcon className="h-6 w-6" />
              Calendar
            </h1>
            <p className="text-muted-foreground">View your schedule and manage events</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => {
                setEventType("block");
                setShowNewEventDialog(true);
              }}
              data-testid="button-block-time"
            >
              <Ban className="h-4 w-4 mr-2" />
              Block Time
            </Button>
            <Button 
              onClick={() => {
                setEventType("meeting");
                setShowNewEventDialog(true);
              }}
              data-testid="button-new-meeting"
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  data-testid="button-prev-month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold min-w-[160px] text-center">
                  {format(currentMonth, "MMMM yyyy")}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  data-testid="button-next-month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentMonth(new Date());
                  setSelectedDate(new Date());
                }}
                data-testid="button-today"
              >
                Today
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {paddingDays.map((_, index) => (
                  <div key={`pad-${index}`} className="aspect-square" />
                ))}
                
                {daysInMonth.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);
                  const hasMeetings = dayEvents.some(e => e.type === "meeting");
                  const hasTasks = dayEvents.some(e => e.type === "task");
                  const hasBlocks = dayEvents.some(e => e.type === "block");
                  
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "aspect-square p-1 rounded-md text-sm relative hover-elevate",
                        isSelected && "bg-primary text-primary-foreground",
                        isTodayDate && !isSelected && "bg-accent",
                        !isSameMonth(day, currentMonth) && "text-muted-foreground opacity-50"
                      )}
                      data-testid={`button-day-${format(day, "yyyy-MM-dd")}`}
                    >
                      <span className="font-medium">{format(day, "d")}</span>
                      {dayEvents.length > 0 && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {hasMeetings && (
                            <div
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isSelected ? "bg-primary-foreground" : "bg-blue-500"
                              )}
                            />
                          )}
                          {hasTasks && (
                            <div
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isSelected ? "bg-primary-foreground" : "bg-primary"
                              )}
                            />
                          )}
                          {hasBlocks && (
                            <div
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isSelected ? "bg-primary-foreground" : "bg-orange-500"
                              )}
                            />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Meetings</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span>Tasks</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span>Blocked</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">
                    {selectedDate 
                      ? format(selectedDate, "EEEE, MMMM d") 
                      : "Select a Date"}
                  </CardTitle>
                  <CardDescription>
                    {selectedDate 
                      ? `${selectedDateEvents.length} event${selectedDateEvents.length !== 1 ? "s" : ""}` 
                      : "Click on a date to see events"}
                  </CardDescription>
                </div>
                {selectedDate && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => openNewEventWithDate(selectedDate)}
                    data-testid="button-add-event-to-date"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : selectedDate ? (
                selectedDateEvents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDateEvents.map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "p-3 rounded-md",
                          event.type === "block" ? "bg-orange-100 dark:bg-orange-950/30" : "bg-muted/50"
                        )}
                        data-testid={`event-${event.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{event.title}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{format(event.date, "h:mm a")}</span>
                              {event.endDate && (
                                <span>- {format(event.endDate, "h:mm a")}</span>
                              )}
                            </div>
                            {event.type === "meeting" && event.location && (
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>
                          <Badge 
                            variant={event.type === "meeting" ? "default" : event.type === "block" ? "secondary" : "outline"}
                            className="text-xs shrink-0"
                          >
                            {event.type === "task" ? "Task" : event.type === "block" ? "Blocked" : "Meeting"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No events on this date</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => openNewEventWithDate(selectedDate)}
                      data-testid="button-schedule-for-date"
                    >
                      Add an event
                    </Button>
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select a date to view events</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
            <CardDescription>Meetings, tasks, and blocked time coming up</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : allEvents.filter(e => e.date >= new Date()).length > 0 ? (
              <div className="space-y-2">
                {allEvents
                  .filter(e => e.date >= new Date())
                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                  .slice(0, 8)
                  .map((event) => (
                    <div
                      key={`${event.type}-${event.id}`}
                      className={cn(
                        "flex items-center justify-between gap-4 p-3 rounded-md",
                        event.type === "block" ? "bg-orange-100 dark:bg-orange-950/30" : "bg-muted/50"
                      )}
                      data-testid={`upcoming-${event.type}-${event.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          event.type === "meeting" ? "bg-blue-500" : 
                          event.type === "block" ? "bg-orange-500" :
                          event.status === "COMPLETED" ? "bg-green-500" : "bg-primary"
                        )} />
                        <div>
                          <span className="font-medium text-sm">{event.title}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {event.type === "meeting" ? "Meeting" : event.type === "block" ? "Blocked" : "Task"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{format(event.date, "MMM d, h:mm a")}</span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No upcoming events</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showNewEventDialog} onOpenChange={(open) => {
        if (!open) resetNewEventForm();
        setShowNewEventDialog(open);
      }}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {eventType === "meeting" ? "Schedule a Meeting" : "Block Time"}
            </DialogTitle>
            <DialogDescription>
              {eventType === "meeting" 
                ? "Schedule a meeting with any platform user"
                : "Block time on your calendar for focus or unavailability"
              }
            </DialogDescription>
          </DialogHeader>

          <Tabs value={eventType} onValueChange={(v) => setEventType(v as "meeting" | "block")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="meeting" data-testid="tab-meeting">
                <Video className="h-4 w-4 mr-2" />
                Meeting
              </TabsTrigger>
              <TabsTrigger value="block" data-testid="tab-block">
                <Ban className="h-4 w-4 mr-2" />
                Block Time
              </TabsTrigger>
            </TabsList>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  {eventType === "meeting" ? "Meeting Title" : "Block Title"} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder={eventType === "meeting" ? "e.g., Weekly Check-in" : "e.g., Focus Time"}
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  data-testid="input-event-title"
                />
              </div>

              {eventType === "meeting" && (
                <div className="space-y-2">
                  <Label>
                    Participants <span className="text-destructive">*</span>
                  </Label>
                  <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                    {messageableUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No users available</p>
                    ) : (
                      <div className="space-y-2">
                        {messageableUsers.map((u) => (
                          <div 
                            key={u.id}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-md cursor-pointer hover-elevate",
                              selectedParticipants.includes(u.id) && "bg-primary/10"
                            )}
                            onClick={() => toggleParticipant(u.id)}
                            data-testid={`participant-${u.id}`}
                          >
                            <input 
                              type="checkbox" 
                              checked={selectedParticipants.includes(u.id)}
                              onChange={() => toggleParticipant(u.id)}
                              className="rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {u.role}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedParticipants.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {selectedParticipants.length} participant{selectedParticipants.length !== 1 ? "s" : ""} selected
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date <span className="text-destructive">*</span></Label>
                  <Input
                    id="date"
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                    data-testid="input-event-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start <span className="text-destructive">*</span></Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                    data-testid="input-event-start"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                    data-testid="input-event-end"
                  />
                </div>
              </div>

              {!newEvent.endTime && (
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Select
                    value={String(newEvent.duration)}
                    onValueChange={(value) => setNewEvent(prev => ({ ...prev, duration: parseInt(value) }))}
                  >
                    <SelectTrigger data-testid="select-duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="240">4 hours</SelectItem>
                      <SelectItem value="480">8 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {eventType === "meeting" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="meetingUrl">Video Call Link</Label>
                    <Input
                      id="meetingUrl"
                      placeholder="https://zoom.us/j/..."
                      value={newEvent.meetingUrl}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, meetingUrl: e.target.value }))}
                      data-testid="input-meeting-url"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Conference Room A"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                      data-testid="input-meeting-location"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder={eventType === "meeting" ? "Meeting agenda or notes..." : "Reason for blocking this time..."}
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  data-testid="input-event-description"
                />
              </div>
            </div>
          </Tabs>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowNewEventDialog(false)} 
              data-testid="button-cancel-event"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateEvent} 
              disabled={createEventMutation.isPending}
              data-testid="button-create-event"
            >
              {createEventMutation.isPending 
                ? (eventType === "meeting" ? "Scheduling..." : "Blocking...") 
                : (eventType === "meeting" ? "Schedule Meeting" : "Block Time")
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
