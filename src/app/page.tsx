'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash, ListCheck, Sigma, LoaderCircle } from 'lucide-react'
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import EditTask from "@/components/edit-task";
import { GetTasks } from "@/actions/get-tasks-from-db";
import { useEffect, useState } from "react";
import { Tasks } from "@prisma/client";
import { NewTask } from "@/actions/add-tasks";
import { deleteTask } from "@/actions/delete-tasks";
import { toast } from "sonner";
import { updateTaskStatus } from "@/actions/toggle-done";
import Filter, { FilterType } from "@/components/filter";
import { deletedCompletedTasks } from "@/actions/clear-completed-tasks";

export default function Home() {
  const [taskList, setTaskList] = useState<Tasks[]>([])
  const [task, setTask] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all')
  const [filteredTasks, setFilteredTasks] = useState<Tasks[]>([])

  const handleGetTasks = async () => {
    try {
      const tasks = await GetTasks()
      if (!tasks) return
      setTaskList(tasks)
    } catch (error) {
      throw error
    }
  };


  const handleAddTasks = async () => {
    setLoading(true)
    try {
      if (task.length === 0 || !task) {
        toast.error('Insira uma atividade')
        setLoading(false)
        return
      }

      const myNewTask = await NewTask(task)

      if (!myNewTask) return

      setTask('')

      toast.success('Atividade adicionada com sucesso.')

      await handleGetTasks()

    } catch (error) {
      throw (error)
    }
    setLoading(false)
  }

  const handleDeleteTasks = async (id: string) => {
    try {
      if (!id) return

      const deletedTask = await deleteTask(id)

      if (!deletedTask) return

      await handleGetTasks()
      toast.warning('Tarefa deletada com sucesso.')

    } catch (error) {
      throw error
    }
    setLoading(false)
  }

  const handleToggleTask = async (taskId: string) => {
    const previousTasks = [...taskList]
    try {
      setTaskList((prev) => {
        const updateTaskList = prev.map(task => {
          if (task.id === taskId) {
            return {
              ...task,
              done: !task.done
            }
          } else {
            return task
          }
        })
        return updateTaskList
      })

      const getFromDb = await updateTaskStatus(taskId)
    } catch (error) {
      setTaskList(previousTasks)
      throw error
    }
  }

  const clearCompletedTask = async () => {
    const deletedTask = await deletedCompletedTasks()

    if (!deletedTask) return

    setTaskList(deletedTask)
  }

  useEffect(() => {
    handleGetTasks()
  }, []);

  useEffect(() => {
    switch (currentFilter) {
      case "all":
        setFilteredTasks(taskList)
        break

      case "pending":
        const pedingTasks = taskList.filter(task => task.done === false)
        setFilteredTasks(pedingTasks)
        break

      case "completed":
        const completedTasks = taskList.filter(task => task.done === true)
        setFilteredTasks(completedTasks)
    }
  }, [currentFilter, taskList]);

  return (
    <main className="w-full h-screen bg-gray-100 flex justify-center items-center">
      <Card className="w-lg p-4">
        <CardHeader className="flex gap-2">
          <Input placeholder="Adicionar uma tarefa" onChange={(e) => setTask(e.target.value)} value={task} />
          <Button className="cursor-pointer" onClick={handleAddTasks}
          >
            {loading ? <LoaderCircle className="animate-spin" /> : <Plus />}
            Cadastrar</Button>
        </CardHeader>


        <CardContent>
          <Separator className="mb-4" />
          <Filter currentFilter={currentFilter} setCurrentFilter={setCurrentFilter} />

          <div className="mt-4 border-b">
            {taskList.length === 0 && <p className="text-xs border-t py-4">Você não possui atividades cadastradas.</p>}

            {filteredTasks.map(task => (
              <div className="h-14 flex justify-between items-center border-t" key={task.id}>
                <div className={`${task.done ? 'w-1 h-full bg-green-400' : 'w-1 h-full bg-red-400'} `}></div>
                <p className="flex-1 px-2 text-sm cursor-pointer hover:text-gray-700"
                  onClick={() => handleToggleTask(task.id)}
                >{task.task}</p>
                <div className="flex gap-2 items-center">
                  <EditTask task={task} handleGetTasks={handleGetTasks} />
                  <Trash size={16} className="cursor-pointer" onClick={() => handleDeleteTasks(task.id)} /></div>

              </div>
            ))}

          </div>

          <div className="flex justify-between mt-4">
            <div className="flex gap-2 items-center">
              <ListCheck size={18} />
              <p className="text-xs">Tarefas Concluídas ({taskList.filter(task => task.done).length}/{taskList.length})</p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="text-xs h-7 cursor-pointer" variant="outline"><Trash />Limpar tarefas concluídas</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza que deseja excluir x itens?</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction className="cursor-pointer" onClick={clearCompletedTask}>Continuar</AlertDialogAction>
                  <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="h-2 w-full bg-gray-100 mt-4 rounded-md">
            <div className="h-full bg-blue-500 rounded-md" style={{ width: `${((taskList.filter(task => task.done).length) / taskList.length) * 100}%` }}></div>
          </div>

          <div className="flex justify-end items-center mt-2 gap-2">
            <Sigma size={18} />
            <p className="text-xs">{taskList.length}</p>
          </div>
        </CardContent>

      </Card>
    </main>
  );
}

