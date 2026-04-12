'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { submitContactForm } from '@/lib/contact-actions'
import { initialContactFormState } from '@/lib/contact-form-state'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full gap-2" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      {pending ? 'Sending...' : 'Send Message'}
    </Button>
  )
}

export function ContactForm() {
  const [state, formAction] = useActionState(submitContactForm, initialContactFormState)
  const formRef = useRef<HTMLFormElement>(null)
  const lastHandledSubmission = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!state.submittedAt || lastHandledSubmission.current === state.submittedAt) {
      return
    }

    lastHandledSubmission.current = state.submittedAt

    if (state.status === 'success') {
      formRef.current?.reset()
      toast({
        title: 'Message sent',
        description: state.message,
      })
      return
    }

    if (state.status === 'error' && state.message) {
      toast({
        title: 'Unable to send message',
        description: state.message,
        variant: 'destructive',
      })
    }
  }, [state])

  const errors = state.fieldErrors || {}

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium mb-2">
            First Name *
          </label>
          <Input id="firstName" name="firstName" placeholder="John" required aria-invalid={Boolean(errors.firstName?.length)} />
          {errors.firstName?.length ? (
            <p className="mt-2 text-sm text-destructive">{errors.firstName[0]}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium mb-2">
            Last Name *
          </label>
          <Input id="lastName" name="lastName" placeholder="Doe" required aria-invalid={Boolean(errors.lastName?.length)} />
          {errors.lastName?.length ? (
            <p className="mt-2 text-sm text-destructive">{errors.lastName[0]}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email *
        </label>
        <Input id="email" name="email" type="email" placeholder="john@example.com" required aria-invalid={Boolean(errors.email?.length)} />
        {errors.email?.length ? (
          <p className="mt-2 text-sm text-destructive">{errors.email[0]}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium mb-2">
          Subject *
        </label>
        <Input id="subject" name="subject" placeholder="What is this about?" required aria-invalid={Boolean(errors.subject?.length)} />
        {errors.subject?.length ? (
          <p className="mt-2 text-sm text-destructive">{errors.subject[0]}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-2">
          Message *
        </label>
        <Textarea
          id="message"
          name="message"
          placeholder="Tell us how we can help..."
          rows={6}
          required
          aria-invalid={Boolean(errors.message?.length)}
        />
        {errors.message?.length ? (
          <p className="mt-2 text-sm text-destructive">{errors.message[0]}</p>
        ) : null}
      </div>

      <SubmitButton />
    </form>
  )
}
