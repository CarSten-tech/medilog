'use client'

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { updateTelegramChatId } from "@/app/dashboard/actions"
import { toast } from "sonner"

const FormSchema = z.object({
  telegramChatId: z.string().min(1, "Chat ID is required"),
})

interface SettingsDialogProps {
  initialChatId?: string | null
}

export function SettingsDialog({ initialChatId }: SettingsDialogProps) {
  const [open, setOpen] = useState(false)
  
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      telegramChatId: initialChatId || "",
    },
  })

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      await updateTelegramChatId(data.telegramChatId)
      toast.success("Settings saved successfully")
      setOpen(false)
    } catch (error) {
      toast.error("Failed to save settings")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5 text-slate-500" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your account settings and integrations.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <h3 className="text-sm font-medium leading-none">Telegram Integration</h3>
            <p className="text-sm text-slate-500 mb-2">
                Receive inventory updates and check status via Telegram.
            </p>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="telegramChatId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telegram Chat ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 12345678" {...field} />
                      </FormControl>
                      <FormDescription>
                        Start a chat with <strong>@MediLogBot</strong> and send <code>/start</code> to get your ID.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </form>
            </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
