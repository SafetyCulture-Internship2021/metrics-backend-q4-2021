/**
 * Account encapsulates a set of login credentials
 */
export type Account = {
  /**
   * UUID for this account
   */
  id: string;
  /**
   * Email address of the account
   */
  email: string;
  /**
   * Bcrypt hash of the password of the account
   */
  hash: string;
  /**
   * Display name of the account
   */
  name: string;
  /**
   * Created at date for the account
   */
  created_at: Date;
};
