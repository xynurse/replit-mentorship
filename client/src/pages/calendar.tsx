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
import { Calendar as CalendarIcon, Clock, MapPin, Plus, ChevronLeft, ChevronRight, Ban, Users, Video, ExternalLink, Pencil, Trash2, X, Target } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, addMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CalendarEvent, User, Goal } from "@shared/schema";

type PublicUserInfo = Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role' | 'profileImage'>;

interface DisplayEvent {
  id: string;
  title: string;
  date: Date;
  endDate?: Date;
  type: "task" | "meeting" | "block" | "goal";
  status?: string;
  location?: string;
  progress?: number;
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
  
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDetailDialog, setShowEventDetailDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editEvent, setEditEvent] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    meetingUrl: "",
    location: "",
  });
  const [editParticipants, setEditParticipants] = useState<string[]>([]);

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<any[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: calendarEvents = [], isLoading: isLoadingEvents } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar-events"],
  });

  const { data: goals = [], isLoading: isLoadingGoals } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
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

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/calendar-events/${id}`, data);
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to update event" }));
        throw new Error(error.message || "Failed to update event");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Event updated",
        description: "Your event has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events"] });
      setShowEventDetailDialog(false);
      setIsEditing(false);
      setSelectedEvent(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update event",
        variant: "destructive",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/calendar-events/${id}`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to delete event" }));
        throw new Error(error.message || "Failed to delete event");
      }
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Event deleted",
        description: "Your event has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events"] });
      setShowEventDetailDialog(false);
      setSelectedEvent(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
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

  const goalEvents: DisplayEvent[] = goals
    .filter(g => g.targetDate)
    .map(g => ({
      id: g.id,
      title: `Goal: ${g.title}`,
      date: new Date(g.targetDate!),
      type: "goal" as const,
      status: g.status || undefined,
      progress: g.progress || 0,
    }));

  const allEvents = [...taskEvents, ...calendarDisplayEvents, ...goalEvents];

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

  const toggleEditParticipant = (userId: string) => {
    setEditParticipants(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const openEventDetail = (eventId: string) => {
    const event = calendarEvents.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setShowEventDetailDialog(true);
      setIsEditing(false);
    }
  };

  const startEditing = () => {
    if (!selectedEvent) return;
    const startDate = new Date(selectedEvent.startTime);
    const endDate = new Date(selectedEvent.endTime);
    setEditEvent({
      title: selectedEvent.title,
      description: selectedEvent.description || "",
      date: format(startDate, "yyyy-MM-dd"),
      startTime: format(startDate, "HH:mm"),
      endTime: format(endDate, "HH:mm"),
      meetingUrl: selectedEvent.meetingUrl || "",
      location: selectedEvent.location || "",
    });
    setEditParticipants((selectedEvent as any).participantIds || []);
    setIsEditing(true);
  };

  const handleUpdateEvent = () => {
    if (!selectedEvent || !editEvent.title || !editEvent.date || !editEvent.startTime) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const startTime = new Date(`${editEvent.date}T${editEvent.startTime}`);
    const endTime = new Date(`${editEvent.date}T${editEvent.endTime}`);

    const updateData: any = {
      title: editEvent.title,
      description: editEvent.description || null,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      location: editEvent.location || null,
      meetingUrl: editEvent.meetingUrl || null,
    };

    if (selectedEvent.type === "MEETING") {
      updateData.participantIds = Array.from(new Set([...editParticipants, user?.id].filter(Boolean)));
    }

    updateEventMutation.mutate({ id: selectedEvent.id, data: updateData });
  };

  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    if (confirm("Are you sure you want to delete this event?")) {
      deleteEventMutation.mutate(selectedEvent.id);
    }
  };

  const getParticipantNames = (event: CalendarEvent) => {
    const participantIds = (event as any).participantIds || [];
    return participantIds
      .map((id: string) => {
        const u = messageableUsers.find(mu => mu.id === id);
        return u ? `${u.firstName} ${u.lastName}` : null;
      })
      .filter(Boolean);
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
                  const hasGoals = dayEvents.some(e => e.type === "goal");
                  
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
                          {hasGoals && (
                            <div
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isSelected ? "bg-primary-foreground" : "bg-purple-500"
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
                      <button
                        key={event.id}
                        onClick={() => event.type !== "task" && event.type !== "goal" && openEventDetail(event.id)}
                        className={cn(
                          "w-full text-left p-3 rounded-md hover-elevate",
                          event.type === "block" ? "bg-orange-100 dark:bg-orange-950/30" :
                          event.type === "goal" ? "bg-purple-100 dark:bg-purple-950/30" : "bg-muted/50",
                          event.type !== "task" && event.type !== "goal" && "cursor-pointer"
                        )}
                        data-testid={`event-${event.id}`}
                        disabled={event.type === "task" || event.type === "goal"}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{event.title}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              {event.type === "goal" ? (
                                <>
                                  <Target className="h-3 w-3" />
                                  <span>Target: {format(event.date, "MMM d, yyyy")}</span>
                                  {event.progress !== undefined && (
                                    <span className="text-purple-600 dark:text-purple-400">({event.progress}% complete)</span>
                                  )}
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3 w-3" />
                                  <span>{format(event.date, "h:mm a")}</span>
                                  {event.endDate && (
                                    <span>- {format(event.endDate, "h:mm a")}</span>
                                  )}
                                </>
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
                            variant={event.type === "meeting" ? "default" : event.type === "block" ? "secondary" : event.type === "goal" ? "outline" : "outline"}
                            className={cn("text-xs shrink-0", event.type === "goal" && "border-purple-500 text-purple-600 dark:text-purple-400")}
                          >
                            {event.type === "task" ? "Task" : event.type === "block" ? "Blocked" : event.type === "goal" ? "Goal" : "Meeting"}
                          </Badge>
                        </div>
                      </button>
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
                    <button
                      key={`${event.type}-${event.id}`}
                      onClick={() => event.type !== "task" && event.type !== "goal" && openEventDetail(event.id)}
                      className={cn(
                        "w-full flex items-center justify-between gap-4 p-3 rounded-md hover-elevate",
                        event.type === "block" ? "bg-orange-100 dark:bg-orange-950/30" :
                        event.type === "goal" ? "bg-purple-100 dark:bg-purple-950/30" : "bg-muted/50",
                        event.type !== "task" && event.type !== "goal" && "cursor-pointer"
                      )}
                      data-testid={`upcoming-${event.type}-${event.id}`}
                      disabled={event.type === "task" || event.type === "goal"}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          event.type === "meeting" ? "bg-blue-500" : 
                          event.type === "block" ? "bg-orange-500" :
                          event.type === "goal" ? "bg-purple-500" :
                          event.status === "COMPLETED" ? "bg-green-500" : "bg-primary"
                        )} />
                        <div>
                          <span className="font-medium text-sm">{event.title}</span>
                          <Badge 
                            variant="outline" 
                            className={cn("ml-2 text-xs", event.type === "goal" && "border-purple-500 text-purple-600 dark:text-purple-400")}
                          >
                            {event.type === "meeting" ? "Meeting" : event.type === "block" ? "Blocked" : event.type === "goal" ? "Goal" : "Task"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {event.type === "goal" ? (
                          <>
                            <Target className="h-4 w-4" />
                            <span>{format(event.date, "MMM d, yyyy")}</span>
                          </>
                        ) : (
                          <>
                            <CalendarIcon className="h-4 w-4" />
                            <span>{format(event.date, "MMM d, h:mm a")}</span>
                          </>
                        )}
                      </div>
                    </button>
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

      <Dialog open={showEventDetailDialog} onOpenChange={(open) => {
        if (!open) {
          setIsEditing(false);
          setSelectedEvent(null);
        }
        setShowEventDetailDialog(open);
      }}>
        <DialogContent className="sm:max-w-[550px]">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <DialogTitle className="flex items-center gap-2">
                      {selectedEvent.type === "MEETING" ? (
                        <Video className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Ban className="h-5 w-5 text-orange-500" />
                      )}
                      {isEditing ? "Edit Event" : selectedEvent.title}
                    </DialogTitle>
                    <DialogDescription>
                      {isEditing 
                        ? "Update the event details below" 
                        : (selectedEvent.type === "MEETING" ? "Meeting details" : "Blocked time details")
                      }
                    </DialogDescription>
                  </div>
                  {!isEditing && (
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={startEditing}
                        data-testid="button-edit-event"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleDeleteEvent}
                        className="text-destructive hover:text-destructive"
                        data-testid="button-delete-event"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </DialogHeader>

              {isEditing ? (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Title <span className="text-destructive">*</span></Label>
                    <Input
                      id="edit-title"
                      value={editEvent.title}
                      onChange={(e) => setEditEvent(prev => ({ ...prev, title: e.target.value }))}
                      data-testid="input-edit-title"
                    />
                  </div>

                  {selectedEvent.type === "MEETING" && (
                    <div className="space-y-2">
                      <Label>Participants</Label>
                      <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
                        {messageableUsers.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No users available</p>
                        ) : (
                          <div className="space-y-2">
                            {messageableUsers.map((u) => (
                              <div 
                                key={u.id}
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded-md cursor-pointer hover-elevate",
                                  editParticipants.includes(u.id) && "bg-primary/10"
                                )}
                                onClick={() => toggleEditParticipant(u.id)}
                                data-testid={`edit-participant-${u.id}`}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={editParticipants.includes(u.id)}
                                  onChange={() => toggleEditParticipant(u.id)}
                                  className="rounded"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {u.firstName} {u.lastName}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-date">Date <span className="text-destructive">*</span></Label>
                      <Input
                        id="edit-date"
                        type="date"
                        value={editEvent.date}
                        onChange={(e) => setEditEvent(prev => ({ ...prev, date: e.target.value }))}
                        data-testid="input-edit-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-start">Start <span className="text-destructive">*</span></Label>
                      <Input
                        id="edit-start"
                        type="time"
                        value={editEvent.startTime}
                        onChange={(e) => setEditEvent(prev => ({ ...prev, startTime: e.target.value }))}
                        data-testid="input-edit-start"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-end">End <span className="text-destructive">*</span></Label>
                      <Input
                        id="edit-end"
                        type="time"
                        value={editEvent.endTime}
                        onChange={(e) => setEditEvent(prev => ({ ...prev, endTime: e.target.value }))}
                        data-testid="input-edit-end"
                      />
                    </div>
                  </div>

                  {selectedEvent.type === "MEETING" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="edit-meetingUrl">Video Call Link</Label>
                        <Input
                          id="edit-meetingUrl"
                          placeholder="https://zoom.us/j/..."
                          value={editEvent.meetingUrl}
                          onChange={(e) => setEditEvent(prev => ({ ...prev, meetingUrl: e.target.value }))}
                          data-testid="input-edit-meeting-url"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-location">Location</Label>
                        <Input
                          id="edit-location"
                          placeholder="e.g., Conference Room A"
                          value={editEvent.location}
                          onChange={(e) => setEditEvent(prev => ({ ...prev, location: e.target.value }))}
                          data-testid="input-edit-location"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      placeholder="Add notes or description..."
                      value={editEvent.description}
                      onChange={(e) => setEditEvent(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      data-testid="input-edit-description"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {format(new Date(selectedEvent.startTime), "EEEE, MMMM d, yyyy")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedEvent.startTime), "h:mm a")} - {format(new Date(selectedEvent.endTime), "h:mm a")}
                      </p>
                    </div>
                  </div>

                  {selectedEvent.type === "MEETING" && (
                    <>
                      {(() => {
                        const names = getParticipantNames(selectedEvent);
                        return names.length > 0 ? (
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">Participants</Label>
                            <div className="flex flex-wrap gap-2">
                              {names.map((name: string, i: number) => (
                                <Badge key={i} variant="secondary">
                                  <Users className="h-3 w-3 mr-1" />
                                  {name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {selectedEvent.meetingUrl && (
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Video Call Link</Label>
                          <a
                            href={selectedEvent.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md text-blue-600 dark:text-blue-400 hover:underline"
                            data-testid="link-meeting-url"
                          >
                            <Video className="h-4 w-4" />
                            <span className="flex-1 truncate">{selectedEvent.meetingUrl}</span>
                            <ExternalLink className="h-4 w-4 shrink-0" />
                          </a>
                        </div>
                      )}

                      {selectedEvent.location && (
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Location</Label>
                          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{selectedEvent.location}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {selectedEvent.description && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Description</Label>
                      <p className="text-sm whitespace-pre-wrap p-3 bg-muted/50 rounded-md">
                        {selectedEvent.description}
                      </p>
                    </div>
                  )}

                  {selectedEvent.status && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Status</Label>
                      <Badge variant={selectedEvent.status === "COMPLETED" ? "default" : "secondary"}>
                        {selectedEvent.status}
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter>
                {isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      data-testid="button-cancel-edit"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleUpdateEvent}
                      disabled={updateEventMutation.isPending}
                      data-testid="button-save-event"
                    >
                      {updateEventMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowEventDetailDialog(false)}
                    data-testid="button-close-event-detail"
                  >
                    Close
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
