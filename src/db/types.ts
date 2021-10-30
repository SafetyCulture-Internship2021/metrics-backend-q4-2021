export const DBErrorCode = Object.seal({
  Conflict: '23505'
})

export type DBError = Error & {
  code: string;
  schema?: string;
  table?: string;
  column?: string;
  constraint?: string;
}
