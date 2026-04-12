export type ContactField = 'firstName' | 'lastName' | 'email' | 'subject' | 'message'

export type ContactFormState = {
  status: 'idle' | 'success' | 'error'
  message: string
  fieldErrors?: Partial<Record<ContactField, string[]>>
  submittedAt?: number
}

export const initialContactFormState: ContactFormState = {
  status: 'idle',
  message: '',
}
