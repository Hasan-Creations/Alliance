import type { Metadata } from "next";
import { TodoView } from "@/components/todos/todo-view";

export const metadata: Metadata = {
  title: "To-Do List | Alliance",
  description: "Manage your tasks and stay organized.",
};

export default function TodosPage() {
  return <TodoView />;
}
