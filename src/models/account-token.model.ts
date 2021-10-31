/**
 * Account token is a singular token for an account
 */
export type AccountToken = {
  /**
   * UUID for this token
   */
  id: string;

  /**
   * UUID of the account this token is generated for
   */
  account_id: string;

  /**
   * Created at date for the token
   */
  created_at: Date;
};
