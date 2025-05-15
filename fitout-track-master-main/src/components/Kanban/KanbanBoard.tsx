'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Task } from '@/lib/types';
import { 
  getTasksByProjectId, 
  createTask, 
  updateTask, 
  updateTaskStatus, 
  deleteTask,
  reorderTasks
} from '@/lib/api';
import { 
  Plus, 
  X, 
  Pencil, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Flag
} from 'lucide-react';
import { format } from 'date-fns';

// Priority color maps
const priorityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-red-100 text-red-800'
};

// Status columns
const columns = [
  {
    id: 'todo',
    display: 'To Do',
    color: 'bg-slate-100'
  },
  {
    id: 'in_progress',
    display: 'In Progress',
    color: 'bg-blue-50'
  },
  {
    id: 'review',
    display: 'Review',
    color: 'bg-amber-50'
  },
  {
    id: 'done',
    display: 'Done',
    color: 'bg-green-50'
  }
];

// Database status value mapping - these MUST match the database constraint values exactly
const statusMapping = {
  'todo': 'todo',
  'in_progress': 'in_progress',
  'review': 'review',
  'done': 'done'
};

interface KanbanBoardProps {
  projectId: string;
}

interface TaskFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  assigned_to: string;
  due_date: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  order_index?: number;
}

export default function KanbanBoard({ projectId }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    assigned_to: '',
    due_date: '',
    status: 'todo',
    order_index: 0
  });

  // Fetch tasks for the project
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const fetchedTasks = await getTasksByProjectId(projectId);
        setTasks(fetchedTasks);
        setError(null);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to load tasks. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [projectId]);

  // Group tasks by status
  const tasksByStatus = columns.reduce((acc, column) => {
    // Get the expected database value for this column
    const expectedDbStatus = statusMapping[column.id as keyof typeof statusMapping] || column.id;
    
    // Map UI status to database status values with more robust matching
    acc[column.id] = tasks.filter(task => {
      // Handle potential null/undefined status
      if (!task.status) return false;
      
      const taskStatus = String(task.status).toLowerCase();
      const columnId = column.id.toLowerCase();
      const dbStatus = expectedDbStatus.toLowerCase();
      
      // More comprehensive matching to handle all possible status formats
      return taskStatus === columnId || 
             taskStatus === dbStatus || 
             taskStatus === columnId.replace('_', '-') ||
             taskStatus === dbStatus.replace('_', '-') ||
             taskStatus === columnId.replace('_', ' ') ||
             taskStatus === dbStatus.replace('_', ' ');
    }).sort((a, b) => {
      const aIndex = a.order_index ?? 0;
      const bIndex = b.order_index ?? 0;
      return aIndex - bIndex;
    });
    
    return acc;
  }, {} as Record<string, Task[]>);

  // Handle drag end event
  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    // If there's no destination or the item was dropped back in the same place
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // Get the task that was dragged
    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    // Create a new array of tasks
    const newTasks = [...tasks];
    
    // Find the source and destination columns
    const sourceColumn = tasksByStatus[source.droppableId];
    const destColumn = tasksByStatus[destination.droppableId];
    
    // If moving within the same column
    if (source.droppableId === destination.droppableId) {
      // Remove the task from its original position
      const columnTasks = [...sourceColumn];
      const [removed] = columnTasks.splice(source.index, 1);
      // Insert the task at its new position
      columnTasks.splice(destination.index, 0, removed);
      
      // Update the order_index values for all affected tasks
      const updatedTasks = columnTasks.map((t, idx) => ({
        ...t,
        order_index: idx
      }));
      
      // Update the tasks array
      const updatedTasksArray = newTasks.map(t => 
        updatedTasks.find(ut => ut.id === t.id) || t
      );
      
      // Optimistically update the UI
      setTasks(updatedTasksArray);
      
      // Update the order in the backend
      try {
        await reorderTasks(
          updatedTasks.map(t => ({
            id: t.id,
            status: t.status,
            order_index: t.order_index ?? 0
          }))
        );
      } catch (err) {
        console.error('Error updating task order:', err);
        // Revert to original tasks if there's an error
        setTasks(tasks);
      }
    } 
    // If moving to a different column
    else {
      // Remove the task from the source column
      const sourceColumnTasks = [...sourceColumn];
      sourceColumnTasks.splice(source.index, 1);
      
      // Add the task to the destination column
      const destColumnTasks = [...destColumn];
      const updatedTask = {
        ...task,
        status: statusMapping[destination.droppableId as keyof typeof statusMapping] || destination.droppableId
      };
      destColumnTasks.splice(destination.index, 0, updatedTask);
      
      // Update order_index values for both columns
      const updatedSourceTasks = sourceColumnTasks.map((t, idx) => ({
        ...t,
        order_index: idx
      }));
      
      const updatedDestTasks = destColumnTasks.map((t, idx) => ({
        ...t,
        order_index: idx
      }));
      
      // Combine all updated tasks
      const allUpdatedTasks = [...updatedSourceTasks, ...updatedDestTasks];
      
      // Update the tasks array
      const updatedTasksArray = newTasks.map(t => 
        allUpdatedTasks.find(ut => ut.id === t.id) || t
      );
      
      // Optimistically update the UI
      setTasks(updatedTasksArray);
      
      // Update the backend
      try {
        // First update the status
        await updateTaskStatus(
          draggableId, 
          destination.droppableId, 
          destination.index
        );
        
        // Then update the order for all affected tasks
        await reorderTasks([
          ...updatedSourceTasks.map(t => ({
            id: t.id,
            status: t.status,
            order_index: t.order_index ?? 0
          })),
          ...updatedDestTasks.map(t => ({
            id: t.id,
            status: t.status,
            order_index: t.order_index ?? 0
          }))
        ]);
      } catch (err) {
        console.error('Error updating task status and order:', err);
        // Revert to original tasks if there's an error
        setTasks(tasks);
      }
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for status to ensure it's always using the correct format
    if (name === 'status') {
      // Map to the exact database values
      let mappedStatus: 'todo' | 'in_progress' | 'review' | 'done';
      
      // Ensure we're only using valid statuses
      if (value === 'in_progress') {
        mappedStatus = 'in_progress';
      } else if (value === 'todo') {
        mappedStatus = 'todo';
      } else if (value === 'review') {
        mappedStatus = 'review';
      } else if (value === 'done') {
        mappedStatus = 'done';
      } else {
        // Default to todo for any unexpected values
        mappedStatus = 'todo';
      }
      
      setFormData(prev => ({
        ...prev,
        status: mappedStatus
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Initialize form for editing a task
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      assigned_to: task.assigned_to || '',
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      status: task.status as any,
      order_index: task.order_index
    });
    setShowAddTask(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      assigned_to: '',
      due_date: '',
      status: 'todo',
      order_index: 0
    });
    setEditingTask(null);
    setShowAddTask(false);
  };

  // Handle task submission
  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Convert any 'in_progress' values to 'in-progress' to match database constraint
      const sanitizedFormData = {
        ...formData,
        // This is a redundant check since we've already handled it in handleInputChange
        // but keeping it as an extra safety measure
        status: formData.status === 'in_progress' ? formData.status : formData.status
      };
      
      if (editingTask) {
        // Update existing task
        const updatedTask = await updateTask(editingTask.id, {
          ...sanitizedFormData,
          project_id: projectId
        });
        
        if (updatedTask) {
          setTasks(tasks.map(t => 
            t.id === updatedTask.id ? updatedTask : t
          ));
        }
      } else {
        // Create new task
        const newTask = await createTask({
          ...sanitizedFormData,
          project_id: projectId,
          order_index: 0 // Ensure order_index is always provided
        });
        
        if (newTask) {
          setTasks([...tasks, newTask]);
        }
      }
      
      resetForm();
    } catch (err: any) {
      console.error('Error saving task:', err);
      setError(err?.message || 'Failed to save task. Please try again.');
      
      // Show the error for a limited time
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const success = await deleteTask(taskId);
      if (success) {
        setTasks(tasks.filter(t => t.id !== taskId));
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task. Please try again.');
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-1 px-3 rounded-md text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Board header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Project Tasks</h2>
        <button
          onClick={() => setShowAddTask(true)}
          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
        >
          <Plus size={16} />
          <span>Add Task</span>
        </button>
      </div>

      {/* Task form modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h3>
              <button 
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitTask}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                ></textarea>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {columns.map(column => (
                      <option key={column.id} value={statusMapping[column.id as keyof typeof statusMapping] || column.id}>
                        {column.display}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned To
                  </label>
                  <input
                    type="text"
                    name="assigned_to"
                    value={formData.assigned_to}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kanban board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 h-full overflow-hidden">
          {columns.map(column => (
            <div 
              key={column.id} 
              className={`flex flex-col border border-gray-200 rounded-lg overflow-hidden ${column.color}`}
            >
              <div className="p-3 border-b border-gray-200 bg-white bg-opacity-70">
                <h3 className="font-medium">{column.display}</h3>
                <div className="text-xs text-gray-500 mt-1">
                  {tasksByStatus[column.id]?.length || 0} tasks
                </div>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-1 p-2 overflow-y-auto"
                    style={{ minHeight: '300px' }}
                  >
                    {tasksByStatus[column.id]?.length > 0 ? (
                      tasksByStatus[column.id].map((task, index) => (
                        <Draggable 
                          key={task.id} 
                          draggableId={task.id} 
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white p-3 rounded-md shadow-sm border border-gray-100 mb-2 hover:shadow-md transition-shadow"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium">{task.title}</h4>
                                <div className="flex gap-1">
                                  <button 
                                    onClick={() => handleEditTask(task)}
                                    className="text-gray-400 hover:text-blue-600 p-1"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="text-gray-400 hover:text-red-600 p-1"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {task.description}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span 
                                    className={`text-xs px-2 py-1 rounded-full ${priorityColors[task.priority]}`}
                                  >
                                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                  </span>
                                  
                                  {task.assigned_to && (
                                    <div className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                                      {task.assigned_to}
                                    </div>
                                  )}
                                </div>
                                
                                {task.due_date && (
                                  <div className="flex items-center text-xs text-gray-500">
                                    <Clock size={12} className="mr-1" />
                                    {format(new Date(task.due_date), 'MMM d')}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm">
                        <div className="mb-2">No tasks</div>
                        <button
                          onClick={() => {
                            // Ensure we use the proper database status format
                            const mappedStatus = statusMapping[column.id as keyof typeof statusMapping] || column.id;
                            setFormData(prev => ({ ...prev, status: mappedStatus as any }));
                            setShowAddTask(true);
                          }}
                          className="text-blue-500 hover:text-blue-700 text-xs flex items-center"
                        >
                          <Plus size={12} className="mr-1" />
                          Add a task
                        </button>
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
} 