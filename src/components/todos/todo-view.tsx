"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import type { Priority, Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { useCollection, useFirestore, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High"]),
  dueDate: z.date().nullable(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

type SortKey = 'default' | 'priority' | 'dueDate';
type SortOrder = 'asc' | 'desc';

const priorityColors: Record<Priority, string> = {
  High: "bg-red-500",
  Medium: "bg-yellow-500",
  Low: "bg-green-500",
};

export function TodoView() {
  const { user } = useUser();
  const firestore = useFirestore();

  const tasksRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'tasks');
  }, [firestore, user]);
  
  const { data: tasks, isLoading: isLoadingTasks } = useCollection<Task>(tasksRef);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "Medium",
      dueDate: null,
    },
  });

  const onSubmit = (values: TaskFormValues) => {
    if (!firestore || !user) return;

    const taskData = {
      ...values,
      dueDate: values.dueDate ? format(values.dueDate, 'yyyy-MM-dd') : null,
      priority: values.priority as Priority,
    };

    if (editingTask) {
      const docRef = doc(firestore, 'users', user.uid, 'tasks', editingTask.id);
      updateDocumentNonBlocking(docRef, taskData);
    } else {
      if (!tasksRef) return;
      addDocumentNonBlocking(tasksRef, { ...taskData, completed: false });
    }
    form.reset();
    setEditingTask(null);
    setIsFormOpen(false);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    form.reset({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate ? parseISO(task.dueDate) : null,
    });
    setIsFormOpen(true);
  };

  const deleteTask = (id: string) => {
    if (!firestore || !user) return;
    const docRef = doc(firestore, 'users', user.uid, 'tasks', id);
    deleteDocumentNonBlocking(docRef);
  };

  const toggleTaskCompletion = (id: string) => {
    if (!firestore || !user || !tasks) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const docRef = doc(firestore, 'users', user.uid, 'tasks', id);
    updateDocumentNonBlocking(docRef, { completed: !task.completed });
  };

  const openNewTaskDialog = () => {
    setEditingTask(null);
    form.reset({
      title: "",
      description: "",
      priority: "Medium",
      dueDate: null,
    });
    setIsFormOpen(true);
  };
  
  const sortedTasks = useMemo(() => {
    if (!tasks) return [];
    const priorityOrder: Record<Priority, number> = { High: 1, Medium: 2, Low: 3 };

    return [...tasks].sort((a, b) => {
      // Completed tasks always at the bottom
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      
      let comparison = 0;

      switch(sortKey) {
        case 'priority':
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'dueDate':
          if (a.dueDate && b.dueDate) {
            comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          } else if (a.dueDate) {
            comparison = -1; // a has due date, b doesn't
          } else if (b.dueDate) {
            comparison = 1; // b has due date, a doesn't
          }
          break;
        case 'default':
        default:
          // Keep original order if not sorting, typically based on creation time if available
          return 0; 
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [tasks, sortKey, sortOrder]);


  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">To-Do List</h1>
          <p className="text-muted-foreground">
            Manage your tasks and stay organized.
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewTaskDialog}>
              <Plus className="mr-2 h-4 w-4" /> Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Finish project proposal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Add more details..." {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Due Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ?? undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                  </DialogClose>
                  <Button type="submit">{editingTask ? "Save Changes" : "Add Task"}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Sort by:</span>
        <Select value={sortKey} onValueChange={(value: SortKey) => setSortKey(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="dueDate">Due Date</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={(value: SortOrder) => setSortOrder(value)} disabled={sortKey === 'default'}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {isLoadingTasks ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : sortedTasks.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">You have no tasks yet. Add one to get started!</p>
            </CardContent>
          </Card>
        ) : (
          sortedTasks.map((task) => (
            <Card key={task.id} className={cn("transition-opacity", task.completed && "opacity-50")}>
              <CardContent className="p-4 flex items-start gap-4">
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.completed}
                  onCheckedChange={() => toggleTaskCompletion(task.id)}
                  className="mt-1"
                />
                <div className="flex-1 grid gap-1 min-w-0">
                  <label
                    htmlFor={`task-${task.id}`}
                    className={cn(
                      "font-medium cursor-pointer break-words",
                      task.completed && "line-through"
                    )}
                  >
                    {task.title}
                  </label>
                  {task.description && (
                    <p className="text-sm text-muted-foreground break-words">{task.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-1">
                    <div className="flex items-center gap-2">
                       <span className={cn("h-2.5 w-2.5 rounded-full", priorityColors[task.priority])} />
                       <span>{task.priority}</span>
                    </div>
                    {task.dueDate && (
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        <span>{format(parseISO(task.dueDate), "PPP")}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(task)}>Edit</Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8" onClick={() => deleteTask(task.id)}>
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}