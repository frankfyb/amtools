/**
 * 认证相关异常类
 * 
 * 提供认证模块专用的异常类型，用于处理各种认证相关的错误情况
 * 包括登录失败、账户状态异常、令牌问题等
 */

/**
 * 无效凭据异常
 * 当用户提供的用户名/邮箱或密码不正确时抛出
 */
export class InvalidCredentialsException extends Error {
  constructor(message: string = '用户名或密码错误') {
    super(message);
    this.name = 'InvalidCredentialsException';
    
    // 确保堆栈跟踪正确指向此异常
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidCredentialsException);
    }
  }
}

/**
 * 账户未验证异常
 * 当用户账户的邮箱尚未验证时抛出
 */
export class AccountNotVerifiedException extends Error {
  constructor(message: string = '账户邮箱未验证，请先验证邮箱') {
    super(message);
    this.name = 'AccountNotVerifiedException';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AccountNotVerifiedException);
    }
  }
}

/**
 * 账户被暂停异常
 * 当用户账户被管理员暂停或停用时抛出
 */
export class AccountSuspendedException extends Error {
  constructor(message: string = '账户已被暂停，请联系管理员') {
    super(message);
    this.name = 'AccountSuspendedException';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AccountSuspendedException);
    }
  }
}

/**
 * 尝试次数过多异常
 * 当用户在短时间内进行过多次失败的登录尝试时抛出
 */
export class TooManyAttemptsException extends Error {
  constructor(message: string = '登录尝试次数过多，请稍后再试') {
    super(message);
    this.name = 'TooManyAttemptsException';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TooManyAttemptsException);
    }
  }
}

/**
 * 无效令牌异常
 * 当提供的JWT令牌格式不正确或已被撤销时抛出
 */
export class InvalidTokenException extends Error {
  constructor(message: string = '无效的令牌') {
    super(message);
    this.name = 'InvalidTokenException';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidTokenException);
    }
  }
}

/**
 * 令牌过期异常
 * 当JWT令牌已过期时抛出
 */
export class TokenExpiredException extends Error {
  constructor(message: string = '令牌已过期，请重新登录') {
    super(message);
    this.name = 'TokenExpiredException';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TokenExpiredException);
    }
  }
}

/**
 * 用户不存在异常
 * 当根据ID或其他标识符查找用户时，用户不存在时抛出
 */
export class UserNotFoundException extends Error {
  constructor(message: string = '用户不存在') {
    super(message);
    this.name = 'UserNotFoundException';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UserNotFoundException);
    }
  }
}

/**
 * 密码不匹配异常
 * 当密码和确认密码不一致时抛出
 */
export class PasswordMismatchException extends Error {
  constructor(message: string = '两次输入的密码不一致') {
    super(message);
    this.name = 'PasswordMismatchException';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PasswordMismatchException);
    }
  }
}

/**
 * 弱密码异常
 * 当用户设置的密码不符合安全要求时抛出
 */
export class WeakPasswordException extends Error {
  constructor(message: string = '密码强度不足，请设置更安全的密码') {
    super(message);
    this.name = 'WeakPasswordException';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WeakPasswordException);
    }
  }
}

/**
 * 验证码无效异常
 * 当提供的验证码不正确或已过期时抛出
 */
export class InvalidVerificationCodeException extends Error {
  constructor(message: string = '验证码无效或已过期') {
    super(message);
    this.name = 'InvalidVerificationCodeException';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidVerificationCodeException);
    }
  }
}

/**
 * 认证异常类型联合
 * 用于类型检查和错误处理
 */
export type AuthException = 
  | InvalidCredentialsException
  | AccountNotVerifiedException
  | AccountSuspendedException
  | TooManyAttemptsException
  | InvalidTokenException
  | TokenExpiredException
  | UserNotFoundException
  | PasswordMismatchException
  | WeakPasswordException
  | InvalidVerificationCodeException;

/**
 * 检查是否为认证相关异常
 * @param error 错误对象
 * @returns 是否为认证异常
 */
export function isAuthException(error: any): error is AuthException {
  return error instanceof InvalidCredentialsException ||
         error instanceof AccountNotVerifiedException ||
         error instanceof AccountSuspendedException ||
         error instanceof TooManyAttemptsException ||
         error instanceof InvalidTokenException ||
         error instanceof TokenExpiredException ||
         error instanceof UserNotFoundException ||
         error instanceof PasswordMismatchException ||
         error instanceof WeakPasswordException ||
         error instanceof InvalidVerificationCodeException;
}

/**
 * 获取认证异常的错误代码
 * @param error 认证异常
 * @returns 错误代码字符串
 */
export function getAuthExceptionCode(error: AuthException): string {
  switch (error.constructor) {
    case InvalidCredentialsException:
      return 'INVALID_CREDENTIALS';
    case AccountNotVerifiedException:
      return 'ACCOUNT_NOT_VERIFIED';
    case AccountSuspendedException:
      return 'ACCOUNT_SUSPENDED';
    case TooManyAttemptsException:
      return 'TOO_MANY_ATTEMPTS';
    case InvalidTokenException:
      return 'INVALID_TOKEN';
    case TokenExpiredException:
      return 'TOKEN_EXPIRED';
    case UserNotFoundException:
      return 'USER_NOT_FOUND';
    case PasswordMismatchException:
      return 'PASSWORD_MISMATCH';
    case WeakPasswordException:
      return 'WEAK_PASSWORD';
    case InvalidVerificationCodeException:
      return 'INVALID_VERIFICATION_CODE';
    default:
      return 'AUTH_ERROR';
  }
}

/**
 * 获取认证异常对应的HTTP状态码
 * @param error 认证异常
 * @returns HTTP状态码
 */
export function getAuthExceptionStatusCode(error: AuthException): number {
  switch (error.constructor) {
    case InvalidCredentialsException:
    case InvalidTokenException:
    case TokenExpiredException:
      return 401; // Unauthorized
    case AccountNotVerifiedException:
    case AccountSuspendedException:
      return 403; // Forbidden
    case UserNotFoundException:
      return 404; // Not Found
    case TooManyAttemptsException:
      return 429; // Too Many Requests
    case PasswordMismatchException:
    case WeakPasswordException:
    case InvalidVerificationCodeException:
      return 400; // Bad Request
    default:
      return 500; // Internal Server Error
  }
}
