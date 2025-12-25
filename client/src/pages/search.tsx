import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Search, 
  Filter, 
  X, 
  User, 
  FileText, 
  Target, 
  ListTodo, 
  Clock,
  Star,
  Trash2,
  Save,
  History
} from "lucide-react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface SearchResult {
  users: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    profileImage?: string;
    organizationName?: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    dueDate?: string;
  }>;
  goals: Array<{
    id: string;
    title: string;
    description?: string;
    status: string;
    progress: number;
    targetDate?: string;
  }>;
  documents: Array<{
    id: string;
    name: string;
    description?: string;
    category: string;
    fileType: string;
  }>;
  total: number;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  searchType: string;
  createdAt: string;
}

interface SearchHistoryItem {
  id: string;
  query: string;
  searchType: string;
  resultCount: number;
  createdAt: string;
}

const searchTypes = [
  { value: "ALL", label: "All", icon: Search },
  { value: "USERS", label: "Users", icon: User },
  { value: "TASKS", label: "Tasks", icon: ListTodo },
  { value: "GOALS", label: "Goals", icon: Target },
  { value: "DOCUMENTS", label: "Documents", icon: FileText },
];

export default function SearchPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchType, setSearchType] = useState("ALL");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results, isLoading: isSearching } = useQuery<SearchResult>({
    queryKey: ["/api/search", { q: debouncedQuery, type: searchType }],
    enabled: debouncedQuery.length >= 2,
  });

  const { data: searchHistory } = useQuery<SearchHistoryItem[]>({
    queryKey: ["/api/search/history"],
  });

  const { data: savedSearches } = useQuery<SavedSearch[]>({
    queryKey: ["/api/search/saved"],
  });

  const saveSearchMutation = useMutation({
    mutationFn: async (data: { name: string; query: string; searchType: string }) => {
      return apiRequest("POST", "/api/search/saved", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/search/saved"] });
      toast({ title: "Search saved successfully" });
      setSaveDialogOpen(false);
      setSearchName("");
    },
    onError: () => {
      toast({ title: "Failed to save search", variant: "destructive" });
    },
  });

  const deleteSavedSearchMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/search/saved/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/search/saved"] });
      toast({ title: "Saved search deleted" });
    },
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/search/history");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/search/history"] });
      toast({ title: "Search history cleared" });
    },
  });

  const handleSaveSearch = () => {
    if (!searchName.trim() || !query.trim()) return;
    saveSearchMutation.mutate({
      name: searchName,
      query: query,
      searchType: searchType,
    });
  };

  const loadSavedSearch = (saved: SavedSearch) => {
    setQuery(saved.query);
    setSearchType(saved.searchType);
  };

  const loadFromHistory = (item: SearchHistoryItem) => {
    setQuery(item.query);
    setSearchType(item.searchType);
  };

  const totalResults = results?.total || 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Search</h1>
          <p className="text-muted-foreground mt-1">
            Search across users, tasks, goals, and documents
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for anything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-query"
            />
          </div>
          
          <Select value={searchType} onValueChange={setSearchType}>
            <SelectTrigger className="w-full md:w-48" data-testid="select-search-type">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {searchTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className="h-4 w-4" />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {query.length >= 2 && (
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-save-search">
                  <Save className="h-4 w-4 mr-2" />
                  Save Search
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Search</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Search Name</Label>
                    <Input
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      placeholder="e.g., Active mentors"
                      data-testid="input-search-name"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Query: "{query}" in {searchTypes.find(t => t.value === searchType)?.label}
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveSearch}
                    disabled={!searchName.trim()}
                    data-testid="button-confirm-save"
                  >
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {query.length < 2 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg">Start searching</h3>
                  <p className="text-muted-foreground mt-1">
                    Enter at least 2 characters to search
                  </p>
                </CardContent>
              </Card>
            ) : isSearching ? (
              <Card>
                <CardContent className="p-6 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : totalResults === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg">No results found</h3>
                  <p className="text-muted-foreground mt-1">
                    Try adjusting your search terms or filters
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="all">
                    All ({totalResults})
                  </TabsTrigger>
                  {results?.users && results.users.length > 0 && (
                    <TabsTrigger value="users">
                      Users ({results.users.length})
                    </TabsTrigger>
                  )}
                  {results?.tasks && results.tasks.length > 0 && (
                    <TabsTrigger value="tasks">
                      Tasks ({results.tasks.length})
                    </TabsTrigger>
                  )}
                  {results?.goals && results.goals.length > 0 && (
                    <TabsTrigger value="goals">
                      Goals ({results.goals.length})
                    </TabsTrigger>
                  )}
                  {results?.documents && results.documents.length > 0 && (
                    <TabsTrigger value="documents">
                      Documents ({results.documents.length})
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                  {results?.users && results.users.length > 0 && (
                    <ResultSection title="Users" icon={User}>
                      {results.users.slice(0, 5).map((user) => (
                        <UserResult key={user.id} user={user} />
                      ))}
                    </ResultSection>
                  )}
                  {results?.tasks && results.tasks.length > 0 && (
                    <ResultSection title="Tasks" icon={ListTodo}>
                      {results.tasks.slice(0, 5).map((task) => (
                        <TaskResult key={task.id} task={task} />
                      ))}
                    </ResultSection>
                  )}
                  {results?.goals && results.goals.length > 0 && (
                    <ResultSection title="Goals" icon={Target}>
                      {results.goals.slice(0, 5).map((goal) => (
                        <GoalResult key={goal.id} goal={goal} />
                      ))}
                    </ResultSection>
                  )}
                  {results?.documents && results.documents.length > 0 && (
                    <ResultSection title="Documents" icon={FileText}>
                      {results.documents.slice(0, 5).map((doc) => (
                        <DocumentResult key={doc.id} document={doc} />
                      ))}
                    </ResultSection>
                  )}
                </TabsContent>

                <TabsContent value="users" className="space-y-2">
                  {results?.users?.map((user) => (
                    <UserResult key={user.id} user={user} />
                  ))}
                </TabsContent>

                <TabsContent value="tasks" className="space-y-2">
                  {results?.tasks?.map((task) => (
                    <TaskResult key={task.id} task={task} />
                  ))}
                </TabsContent>

                <TabsContent value="goals" className="space-y-2">
                  {results?.goals?.map((goal) => (
                    <GoalResult key={goal.id} goal={goal} />
                  ))}
                </TabsContent>

                <TabsContent value="documents" className="space-y-2">
                  {results?.documents?.map((doc) => (
                    <DocumentResult key={doc.id} document={doc} />
                  ))}
                </TabsContent>
              </Tabs>
            )}
          </div>

          <div className="space-y-6">
            {savedSearches && savedSearches.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Saved Searches
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {savedSearches.map((saved) => (
                    <div
                      key={saved.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-md hover-elevate cursor-pointer"
                      onClick={() => loadSavedSearch(saved)}
                      data-testid={`saved-search-${saved.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{saved.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          "{saved.query}"
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSavedSearchMutation.mutate(saved.id);
                        }}
                        data-testid={`delete-saved-${saved.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {searchHistory && searchHistory.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Recent Searches
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearHistoryMutation.mutate()}
                      data-testid="button-clear-history"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {searchHistory.slice(0, 10).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-md hover-elevate cursor-pointer"
                      onClick={() => loadFromHistory(item)}
                      data-testid={`history-${item.id}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate">{item.query}</span>
                      </div>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {item.resultCount}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ResultSection({ 
  title, 
  icon: Icon, 
  children 
}: { 
  title: string; 
  icon: typeof Search; 
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {children}
      </CardContent>
    </Card>
  );
}

function UserResult({ user }: { user: SearchResult["users"][0] }) {
  return (
    <div 
      className="flex items-center gap-4 p-3 rounded-md hover-elevate cursor-pointer"
      data-testid={`user-result-${user.id}`}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.profileImage || undefined} />
        <AvatarFallback>
          {user.firstName[0]}{user.lastName[0]}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-sm text-muted-foreground truncate">
          {user.email}
        </p>
      </div>
      <Badge variant="outline">{user.role}</Badge>
    </div>
  );
}

function TaskResult({ task }: { task: SearchResult["tasks"][0] }) {
  const statusColors: Record<string, string> = {
    TODO: "bg-muted",
    IN_PROGRESS: "bg-blue-500/10 text-blue-500",
    COMPLETED: "bg-green-500/10 text-green-500",
    BLOCKED: "bg-red-500/10 text-red-500",
  };

  return (
    <div 
      className="flex items-center gap-4 p-3 rounded-md hover-elevate cursor-pointer"
      data-testid={`task-result-${task.id}`}
    >
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
        <ListTodo className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{task.title}</p>
        {task.description && (
          <p className="text-sm text-muted-foreground truncate">
            {task.description}
          </p>
        )}
      </div>
      <Badge className={cn("text-xs", statusColors[task.status] || "")}>
        {task.status.replace("_", " ")}
      </Badge>
    </div>
  );
}

function GoalResult({ goal }: { goal: SearchResult["goals"][0] }) {
  return (
    <div 
      className="flex items-center gap-4 p-3 rounded-md hover-elevate cursor-pointer"
      data-testid={`goal-result-${goal.id}`}
    >
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
        <Target className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{goal.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary" 
              style={{ width: `${goal.progress}%` }} 
            />
          </div>
          <span className="text-xs text-muted-foreground">{goal.progress}%</span>
        </div>
      </div>
      <Badge variant="outline">{goal.status.replace("_", " ")}</Badge>
    </div>
  );
}

function DocumentResult({ document }: { document: SearchResult["documents"][0] }) {
  return (
    <div 
      className="flex items-center gap-4 p-3 rounded-md hover-elevate cursor-pointer"
      data-testid={`document-result-${document.id}`}
    >
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
        <FileText className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{document.name}</p>
        {document.description && (
          <p className="text-sm text-muted-foreground truncate">
            {document.description}
          </p>
        )}
      </div>
      <Badge variant="outline">{document.category}</Badge>
    </div>
  );
}
