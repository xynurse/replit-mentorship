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
import { Calendar as CalendarIcon, Clock, MapPin, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MeetingLog, MentorshipMatch, User } from "@shared/schema";

type PublicUserInfo = Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role' | 'profileImage'>;

interface ConnectionWithUser extends MentorshipMatch {
  mentor?: PublicUserInfo;
  mentee?: PublicUserInfo;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: "task" | "meeting";
  status?: string;
  location?: string;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showNewMeetingDialog, setShowNewMeetingDialog] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: "",
    description: "",
    scheduledDate: "",
    scheduledTime: "",
    duration: 30,
    meetingUrl: "",
    location: "",
    matchId: "",
  });

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<any[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: meetings = [], isLoading: isLoadingMeetings } = useQuery<MeetingLog[]>({
    queryKey: ["/api/meetings"],
  });

  const { data: matches = [] } = useQuery<ConnectionWithUser[]>({
    queryKey: ["/api/matches/my"],
  });

  const activeMatches = matches.filter(m => m.status === "ACTIVE");
  const isMentor = user?.role === "MENTOR";

  const createMeetingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/meetings", data);
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to schedule meeting" }));
        throw new Error(error.message || "Failed to schedule meeting");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Meeting scheduled",
        description: "Your meeting has been scheduled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      setShowNewMeetingDialog(false);
      resetNewMeetingForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule meeting",
        variant: "destructive",
      });
    },
  });

  const resetNewMeetingForm = () => {
    setNewMeeting({
      title: "",
      description: "",
      scheduledDate: "",
      scheduledTime: "",
      duration: 30,
      meetingUrl: "",
      location: "",
      matchId: "",
    });
  };

  const handleCreateMeeting = () => {
    if (!newMeeting.title || !newMeeting.scheduledDate || !newMeeting.scheduledTime || !newMeeting.matchId) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const scheduledDateTime = new Date(`${newMeeting.scheduledDate}T${newMeeting.scheduledTime}`);
    
    createMeetingMutation.mutate({
      matchId: newMeeting.matchId,
      agenda: newMeeting.title,
      discussionNotes: newMeeting.description || undefined,
      scheduledDate: scheduledDateTime.toISOString(),
      duration: newMeeting.duration,
      location: newMeeting.location || undefined,
      format: newMeeting.meetingUrl ? "VIRTUAL" : "IN_PERSON",
      platform: newMeeting.meetingUrl ? "ZOOM" : undefined,
      meetingType: "ONE_ON_ONE",
    });
  };

  const taskEvents: CalendarEvent[] = tasks
    .filter(t => t.dueDate)
    .map(t => ({
      id: t.id,
      title: t.title,
      date: new Date(t.dueDate),
      type: "task" as const,
      status: t.status,
    }));

  const meetingEvents: CalendarEvent[] = meetings
    .filter(m => m.scheduledDate)
    .map(m => ({
      id: m.id,
      title: m.agenda || `Mentorship Session ${m.meetingNumber ? `#${m.meetingNumber}` : ""}`.trim(),
      date: new Date(m.scheduledDate!),
      type: "meeting" as const,
      status: (m.mentorAttended && m.menteeAttended) ? "COMPLETED" : "SCHEDULED",
      location: m.location || undefined,
    }));

  const allEvents = [...taskEvents, ...meetingEvents];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startPadding = monthStart.getDay();
  const paddingDays = Array(startPadding).fill(null);

  const getEventsForDay = (date: Date) => {
    return allEvents.filter(event => isSameDay(event.date, date));
  };

  const selectedDateEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  const openNewMeetingWithDate = (date: Date) => {
    setNewMeeting(prev => ({
      ...prev,
      scheduledDate: format(date, "yyyy-MM-dd"),
    }));
    setShowNewMeetingDialog(true);
  };

  if (!user) return null;

  const isLoading = isLoadingTasks || isLoadingMeetings;

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-calendar-title">
              <CalendarIcon className="h-6 w-6" />
              Calendar
            </h1>
            <p className="text-muted-foreground">View your schedule and upcoming events</p>
          </div>
          <Button 
            onClick={() => setShowNewMeetingDialog(true)}
            disabled={activeMatches.length === 0}
            data-testid="button-new-event"
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
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
                {selectedDate && activeMatches.length > 0 && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => openNewMeetingWithDate(selectedDate)}
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
                        className="p-3 rounded-md bg-muted/50"
                        data-testid={`event-${event.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{event.title}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{format(event.date, "h:mm a")}</span>
                            </div>
                            {event.type === "meeting" && event.location && (
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>
                          <Badge 
                            variant={event.type === "meeting" ? "default" : "outline"}
                            className="text-xs shrink-0"
                          >
                            {event.type === "task" ? "Task" : "Meeting"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No events on this date</p>
                    {activeMatches.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => openNewMeetingWithDate(selectedDate)}
                        data-testid="button-schedule-for-date"
                      >
                        Schedule a meeting
                      </Button>
                    )}
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
            <CardDescription>Meetings and tasks coming up</CardDescription>
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
                      className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/50"
                      data-testid={`upcoming-${event.type}-${event.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          event.type === "meeting" ? "bg-blue-500" : 
                          event.status === "COMPLETED" ? "bg-green-500" : "bg-primary"
                        )} />
                        <div>
                          <span className="font-medium text-sm">{event.title}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {event.type === "meeting" ? "Meeting" : "Task"}
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

      <Dialog open={showNewMeetingDialog} onOpenChange={setShowNewMeetingDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule a Meeting</DialogTitle>
            <DialogDescription>
              Set up a mentorship session with your {isMentor ? "mentee" : "mentor"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="match">
                {isMentor ? "Mentee" : "Mentor"} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={newMeeting.matchId}
                onValueChange={(value) => setNewMeeting(prev => ({ ...prev, matchId: value }))}
              >
                <SelectTrigger data-testid="select-match">
                  <SelectValue placeholder={`Select ${isMentor ? "mentee" : "mentor"}`} />
                </SelectTrigger>
                <SelectContent>
                  {activeMatches.map((match) => {
                    const person = isMentor ? match.mentee : match.mentor;
                    if (!person) return null;
                    return (
                      <SelectItem key={match.id} value={match.id}>
                        {person.firstName} {person.lastName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Meeting Title <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                placeholder="e.g., Weekly Check-in"
                value={newMeeting.title}
                onChange={(e) => setNewMeeting(prev => ({ ...prev, title: e.target.value }))}
                data-testid="input-meeting-title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date <span className="text-destructive">*</span></Label>
                <Input
                  id="date"
                  type="date"
                  value={newMeeting.scheduledDate}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  data-testid="input-meeting-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time <span className="text-destructive">*</span></Label>
                <Input
                  id="time"
                  type="time"
                  value={newMeeting.scheduledTime}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, scheduledTime: e.target.value }))}
                  data-testid="input-meeting-time"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select
                value={String(newMeeting.duration)}
                onValueChange={(value) => setNewMeeting(prev => ({ ...prev, duration: parseInt(value) }))}
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
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meetingUrl">Video Call Link</Label>
              <Input
                id="meetingUrl"
                placeholder="https://zoom.us/j/..."
                value={newMeeting.meetingUrl}
                onChange={(e) => setNewMeeting(prev => ({ ...prev, meetingUrl: e.target.value }))}
                data-testid="input-meeting-url"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                placeholder="e.g., Conference Room A"
                value={newMeeting.location}
                onChange={(e) => setNewMeeting(prev => ({ ...prev, location: e.target.value }))}
                data-testid="input-meeting-location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Meeting agenda or notes..."
                value={newMeeting.description}
                onChange={(e) => setNewMeeting(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                data-testid="input-meeting-description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewMeetingDialog(false)} data-testid="button-cancel-meeting">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateMeeting} 
              disabled={createMeetingMutation.isPending}
              data-testid="button-create-meeting"
            >
              {createMeetingMutation.isPending ? "Scheduling..." : "Schedule Meeting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
