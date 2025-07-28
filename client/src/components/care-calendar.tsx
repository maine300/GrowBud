import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CalendarEvent } from "@shared/schema";

interface CareCalendarProps {
  plantId?: string;
}

// Editable Task Item Component
function EditableTaskItem({ event }: { event: CalendarEvent }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(event.task);
  const queryClient = useQueryClient();

  const updateTaskMutation = useMutation({
    mutationFn: async ({ eventId, task }: { eventId: string; task: string }) => {
      const response = await fetch(`/api/calendar-events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task }),
      });
      if (!response.ok) throw new Error("Failed to update task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events"] });
      setIsEditing(false);
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ eventId, completed }: { eventId: string; completed: boolean }) => {
      const response = await fetch(`/api/calendar-events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!response.ok) throw new Error("Failed to update task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events"] });
    },
  });

  const handleSave = () => {
    if (editText.trim() && editText !== event.task) {
      updateTaskMutation.mutate({ eventId: event.id, task: editText.trim() });
    } else {
      setIsEditing(false);
      setEditText(event.task);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditText(event.task);
    }
  };

  return (
    <div
      className={`text-xs mt-1 p-1 rounded cursor-pointer ${
        event.completed 
          ? "bg-gray-600 text-gray-400 line-through" 
          : event.task.toLowerCase().includes('water') 
            ? "bg-blue-600 text-white"
            : event.task.toLowerCase().includes('nutrients')
              ? "bg-amber-600 text-white"
              : "bg-plant-green-600 text-white"
      }`}
    >
      {isEditing ? (
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyPress}
          className="w-full bg-transparent border-none outline-none text-xs text-white placeholder-gray-300"
          autoFocus
        />
      ) : (
        <div 
          onClick={() => setIsEditing(true)}
          className="flex items-center justify-between"
        >
          <span className="flex-1">{event.task}</span>
          <input
            type="checkbox"
            checked={event.completed}
            onChange={(e) => 
              toggleTaskMutation.mutate({ 
                eventId: event.id, 
                completed: e.target.checked 
              })
            }
            onClick={(e) => e.stopPropagation()}
            className="ml-1 w-3 h-3"
          />
        </div>
      )}
    </div>
  );
}

export default function CareCalendar({ plantId }: CareCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [generateStage, setGenerateStage] = useState("");
  const [generateStartDate, setGenerateStartDate] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: allEvents = [] } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar-events"],
  });

  const events = plantId 
    ? allEvents.filter(event => event.plantId === plantId)
    : allEvents;

  const generateScheduleMutation = useMutation({
    mutationFn: async ({ stage, startDate }: { stage: string; startDate: string }) => {
      if (!plantId) throw new Error("Plant ID required");
      
      const response = await fetch("/api/calendar-events/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plantId, stage, startDate }),
      });
      if (!response.ok) throw new Error("Failed to generate schedule");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events"] });
      setGenerateStage("");
      setGenerateStartDate("");
      toast({
        title: "Schedule generated",
        description: "Care schedule has been automatically generated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate schedule.",
        variant: "destructive",
      });
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ eventId, completed }: { eventId: string; completed: boolean }) => {
      const response = await fetch(`/api/calendar-events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!response.ok) throw new Error("Failed to update task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events"] });
    },
  });

  const getMonthData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events.filter(event => event.date === dateStr);
      days.push({ day, dateStr, events: dayEvents });
    }

    return { days, monthName: firstDay.toLocaleDateString('default', { month: 'long', year: 'numeric' }) };
  };

  const { days, monthName } = getMonthData();

  const todaysTasks = events.filter(event => {
    const today = new Date().toISOString().split('T')[0];
    return event.date === today && !event.completed;
  });

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleGenerateSchedule = () => {
    if (generateStage && generateStartDate) {
      generateScheduleMutation.mutate({ stage: generateStage, startDate: generateStartDate });
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-white">Care Calendar</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-white font-medium min-w-32 text-center">{monthName}</span>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Schedule Generation */}
        {plantId && (
          <div className="flex items-center space-x-2 mt-4">
            <Select value={generateStage} onValueChange={setGenerateStage}>
              <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seed">Seed</SelectItem>
                <SelectItem value="seedling">Seedling</SelectItem>
                <SelectItem value="vegetative">Vegetative</SelectItem>
                <SelectItem value="flowering">Flowering</SelectItem>
                <SelectItem value="complete">Complete (Seed to Harvest)</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              type="date"
              value={generateStartDate}
              onChange={(e) => setGenerateStartDate(e.target.value)}
              className="w-40 bg-gray-700 border-gray-600 text-white"
            />
            
            <Button
              size="sm"
              onClick={handleGenerateSchedule}
              disabled={!generateStage || !generateStartDate || generateScheduleMutation.isPending}
              className="bg-plant-green-600 hover:bg-plant-green-700"
            >
              Generate
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-400 p-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <div key={index} className="bg-gray-700 rounded p-2 min-h-16 text-sm">
              {day ? (
                <>
                  <div className="text-white font-medium">{day.day}</div>
                  {day.events.map((event) => (
                    <EditableTaskItem key={event.id} event={event} />
                  ))}
                </>
              ) : null}
            </div>
          ))}
        </div>

        {/* Today's Tasks */}
        {todaysTasks.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h4 className="text-white font-medium mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Today's Tasks
            </h4>
            <div className="space-y-2">
              {todaysTasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-3 p-2 bg-gray-700 rounded">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={(e) => 
                      toggleTaskMutation.mutate({ 
                        eventId: task.id, 
                        completed: e.target.checked 
                      })
                    }
                    className="w-4 h-4 text-plant-green-600 rounded focus:ring-plant-green-500"
                  />
                  <span className={`text-white text-sm ${task.completed ? 'line-through text-gray-400' : ''}`}>
                    {task.task}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
