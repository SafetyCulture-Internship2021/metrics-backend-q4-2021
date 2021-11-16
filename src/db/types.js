/**
 * DBErrorCode defines the error codes that can be expected to be returned from the DB
 */
export const DBErrorCode = Object.seal({
  /**
   * Conflict error code, typically thrown on primary key or unique constraint violations
   */
  Conflict: '23505'
})
