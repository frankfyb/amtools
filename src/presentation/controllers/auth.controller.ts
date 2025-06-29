/**
 * 认证控制器 - 表示层
 *
 * 使用装饰器系统重构的认证控制器，支持自动参数验证、
 * 统一响应格式、错误处理等功能。
 *
 * @author AMTools Team
 * @version 2.0.0
 */

import { Injectable, Inject } from '../../core/di/decorators';
import { CQRS_TOKENS } from '../../core/di/tokens';
import { ICommandBus, IQueryBus } from '../../core/cqrs/types';
import { Request, Response } from 'express';
import { RegisterUserCommand } from '../../application/commands/auth/register-user.command';
import { SendVerificationCodeCommand } from '../../application/commands/auth/send-verification-code.command';
import { VerifyEmailCommand } from '../../application/commands/auth/verify-email.command';
import { LoginUserCommand } from '../../application/commands/auth/login-user.command';
import { RefreshTokenCommand } from '../../application/commands/auth/refresh-token.command';
import { LogoutUserCommand } from '../../application/commands/auth/logout-user.command';
import { ResetPasswordCommand } from '../../application/commands/auth/reset-password.command';
import { GetUserByEmailQuery } from '../../application/queries/auth/get-user-by-email.query';
import { GetCurrentUserQuery } from '../../application/queries/auth/get-current-user.query';
import { AUTH_SUCCESS_MESSAGES } from '../../shared/constants/auth.constants';
import { VerificationCodeType } from '../../shared/types/auth.types';

// 导入装饰器系统
import { Controller, Post, Get, HttpCode } from '../../core/routing/decorators';
import { ValidatedBody, Query } from '../../core/routing/decorators';
import { ValidationPipe } from '../../core/routing/pipes/validation.pipe';
import { UseGuards, OptionalAuth } from '../../core/routing/guards/auth.guard';
import { AuthenticatedRequest } from '../../core/routing/guards/auth.guard';

// 导入Swagger装饰器
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiBody,
  CommonApiResponses
} from '../../core/swagger/decorators';

// 导入DTO和响应类型
import {
  SendVerificationCodeDto,
  RegisterUserDto,
  VerifyEmailDto,
  LoginUserDto,
  RefreshTokenDto,
  ResetPasswordDto,
  UserResponseDto,
  AuthTokensResponseDto
} from '../dto/auth.dto';
import { ApiResponse } from '../../shared/responses/api-response';

/**
 * 认证控制器
 *
 * 使用装饰器系统的现代化认证控制器，支持自动参数验证、
 * 统一响应格式、错误处理等功能。
 */
@Controller('/auth')
@Injectable()
@ApiTags('认证管理')
export class AuthController {
  constructor(
    @Inject(CQRS_TOKENS.COMMAND_BUS)
    private readonly commandBus: ICommandBus,
    @Inject(CQRS_TOKENS.QUERY_BUS)
    private readonly queryBus: IQueryBus
  ) {}

  /**
   * 发送验证码
   * POST /api/v1/auth/send-verification-code
   */
  @Post('/send-verification-code')
  @HttpCode(200)
  @ApiOperation({
    summary: '发送邮箱验证码',
    description: '向指定邮箱发送验证码，用于用户注册或密码重置',
    tags: ['认证管理']
  })
  @ApiBody({
    description: '发送验证码请求数据',
    type: SendVerificationCodeDto
  })
  @SwaggerApiResponse({
    status: 200,
    description: '验证码发送成功',
    type: 'object'
  })
  @CommonApiResponses.BadRequest('请求参数错误')
  @CommonApiResponses.InternalServerError('服务器内部错误')
  async sendVerificationCode(
    @ValidatedBody(ValidationPipe) requestData: SendVerificationCodeDto
  ): Promise<ApiResponse> {
    console.log('🔍 AuthController.sendVerificationCode 开始执行');
    console.log('📋 请求数据:', requestData);

    // 从验证管道获取验证后的数据
    const actualData = (requestData as any)?.body || requestData;
    console.log('📋 实际数据:', actualData);

    // 类型转换：将前端字符串类型转换为后端枚举类型
    const typeMapping: Record<string, VerificationCodeType> = {
      'register': VerificationCodeType.EMAIL_VERIFICATION,
      'reset_password': VerificationCodeType.PASSWORD_RESET,
      'login': VerificationCodeType.LOGIN_VERIFICATION
    };

    const verificationCodeType = typeMapping[actualData.type] || VerificationCodeType.EMAIL_VERIFICATION;

    // 创建命令
    const command = new SendVerificationCodeCommand(
      actualData.email,
      verificationCodeType,
      actualData.captcha
    );
    console.log('📋 创建命令:', command);

    // 执行命令
    console.log('🚀 开始执行命令...');
    const result = await this.commandBus.execute(command);
    console.log('✅ 命令执行完成:', result);

    if (result.success) {
      const response = ApiResponse.success(
        result.data,
        result.data?.message || '验证码发送成功'
      );
      console.log('✅ 返回成功响应:', response);
      return response;
    } else {
      const response = ApiResponse.validationError(
        result.errors || [],
        '验证码发送失败'
      );
      console.log('❌ 返回错误响应:', response);
      return response;
    }
  }

  /**
   * 用户注册
   * POST /api/v1/auth/register
   */
  @Post('/register')
  @HttpCode(201)
  async register(
    @ValidatedBody(ValidationPipe) requestData: RegisterUserDto
  ): Promise<ApiResponse<AuthTokensResponseDto>> {
    console.log('🔍 AuthController.register 被调用');
    console.log('📧 邮箱:', requestData?.email);
    console.log('👤 用户名:', requestData?.username);
    console.log('🔑 验证码:', requestData?.verificationCode);
    console.log('📋 请求数据类型:', typeof requestData);
    console.log('📋 请求数据键:', Object.keys(requestData || {}));
    console.log('📦 请求体:', requestData);
    console.log('📦 请求体类型:', typeof requestData);

    // 创建命令
    const command = new RegisterUserCommand(
      requestData.email,
      requestData.username,
      requestData.password,
      requestData.confirmPassword,
      requestData.verificationCode,
      requestData.firstName,
      requestData.lastName,
      requestData.rememberMe,
      requestData.utmSource,
      requestData.utmMedium,
      requestData.utmCampaign
    );

    // 执行命令
    const result = await this.commandBus.execute(command);

    if (result.success) {
      // 构建响应DTO
      const responseDto = new AuthTokensResponseDto(
        result.data.tokens,
        result.data.user
      );

      return ApiResponse.success(
        responseDto,
        AUTH_SUCCESS_MESSAGES.REGISTRATION_SUCCESS
      );
    } else {
      return ApiResponse.validationError(
        result.errors || [],
        '注册失败'
      );
    }
  }

  /**
   * 验证邮箱
   * POST /api/v1/auth/verify-email
   */
  @Post('/verify-email')
  @HttpCode(200)
  async verifyEmail(
    @ValidatedBody() requestData: VerifyEmailDto
  ): Promise<ApiResponse<AuthTokensResponseDto>> {
    // 创建命令
    const command = new VerifyEmailCommand(
      requestData.email,
      requestData.verificationCode
    );

    // 执行命令
    const result = await this.commandBus.execute(command);

    if (result.success) {
      // 构建响应DTO
      const responseDto = new AuthTokensResponseDto(
        result.data.tokens,
        result.data.user
      );

      return ApiResponse.success(
        responseDto,
        '邮箱验证成功'
      );
    } else {
      return ApiResponse.validationError(
        result.errors || [],
        '邮箱验证失败'
      );
    }
  }

  /**
   * 用户登录
   * POST /api/v1/auth/login
   */
  @Post('/login')
  @HttpCode(200)
  @ApiOperation({
    summary: '用户登录',
    description: '使用邮箱/用户名和密码进行登录认证',
    tags: ['认证管理']
  })
  @ApiBody({
    description: '登录请求数据',
    type: LoginUserDto
  })
  @SwaggerApiResponse({
    status: 200,
    description: '登录成功',
    type: AuthTokensResponseDto
  })
  @CommonApiResponses.BadRequest('请求参数错误')
  @CommonApiResponses.Unauthorized('用户名或密码错误')
  @CommonApiResponses.Forbidden('账户被禁用或未验证')
  @CommonApiResponses.InternalServerError('服务器内部错误')
  async login(
    @ValidatedBody(ValidationPipe) requestData: LoginUserDto
  ): Promise<ApiResponse<AuthTokensResponseDto>> {
    console.log('🔍 AuthController.login 开始执行');
    console.log('📋 请求数据:', {
      emailOrUsername: requestData.emailOrUsername,
      rememberMe: requestData.rememberMe,
      hasCaptcha: !!requestData.captcha
    });

    try {
      // 从验证管道获取验证后的数据
      const actualData = (requestData as any)?.body || requestData;

      // 创建登录命令
      const command = new LoginUserCommand(
        actualData.emailOrUsername,
        actualData.password,
        actualData.rememberMe || false,
        'unknown', // IP地址 - 在测试环境中使用默认值
        'unknown', // User-Agent - 在测试环境中使用默认值
        actualData.captcha
      );

      console.log('📤 执行登录命令');
      const result = await this.commandBus.execute(command);

      if (result.success) {
        console.log('✅ 登录成功');

        // 构建响应数据
        const responseData = new AuthTokensResponseDto(
          result.data.tokens,
          result.data.user
        );

        return ApiResponse.success(
          responseData,
          '登录成功'
        );
      } else {
        console.log('❌ 登录失败:', result.error);
        return ApiResponse.error('登录失败', 'LOGIN_FAILED');
      }
    } catch (error: any) {
      console.error('❌ 登录过程中发生错误:', error);

      // 根据异常类型返回相应的错误响应
      if (error.name === 'InvalidCredentialsException') {
        return ApiResponse.error(error.message, 'INVALID_CREDENTIALS');
      }
      if (error.name === 'AccountNotVerifiedException') {
        return ApiResponse.error(error.message, 'ACCOUNT_NOT_VERIFIED');
      }
      if (error.name === 'AccountSuspendedException') {
        return ApiResponse.error(error.message, 'ACCOUNT_SUSPENDED');
      }
      if (error.name === 'TooManyAttemptsException') {
        return ApiResponse.error(error.message, 'TOO_MANY_ATTEMPTS');
      }
      if (error.name === 'UserNotFoundException') {
        return ApiResponse.error('用户名或密码错误', 'INVALID_CREDENTIALS');
      }

      return ApiResponse.error('登录失败，请稍后重试', 'LOGIN_FAILED');
    }
  }

  /**
   * 用户登出
   * POST /api/v1/auth/logout
   */
  @Post('/logout')
  @UseGuards()
  @HttpCode(200)
  @ApiOperation({
    summary: '用户登出',
    description: '登出当前用户，撤销访问令牌和刷新令牌',
    tags: ['认证管理']
  })
  @SwaggerApiResponse({
    status: 200,
    description: '登出成功',
    type: 'object'
  })
  @CommonApiResponses.Unauthorized('未登录或令牌无效')
  @CommonApiResponses.BadRequest('请求参数错误')
  @CommonApiResponses.InternalServerError('服务器内部错误')
  async logout(
    req: AuthenticatedRequest
  ): Promise<ApiResponse> {
    console.log('🔍 AuthController.logout 开始执行');
    console.log('👤 用户ID:', req.user?.id);

    try {
      // 从认证中间件获取用户ID
      const userId = req.user?.id;
      if (!userId) {
        return ApiResponse.error('用户身份验证失败', 'AUTHENTICATION_FAILED');
      }

      // 使用虚拟的访问令牌（在测试环境中）
      const accessToken = 'test_access_token';

      // 使用默认的登出参数
      const refreshToken = undefined;
      const logoutAllDevices = false;

      // 创建登出命令
      const command = new LogoutUserCommand(
        userId,
        accessToken,
        refreshToken,
        logoutAllDevices,
        'unknown', // IP地址 - 在测试环境中使用默认值
        'unknown'  // User-Agent - 在测试环境中使用默认值
      );

      console.log('📤 执行登出命令:', {
        logoutType: command.getLogoutType(),
        hasRefreshToken: !!refreshToken
      });

      const result = await this.commandBus.execute(command);

      if (result.success) {
        console.log('✅ 登出成功');
        console.log('📊 登出结果:', {
          logoutType: result.data.logoutType,
          revokedTokensCount: result.data.revokedTokensCount
        });

        return ApiResponse.success(
          {
            logoutType: result.data.logoutType,
            revokedTokensCount: result.data.revokedTokensCount,
            logoutTime: result.data.logoutTime
          },
          '登出成功'
        );
      } else {
        console.log('❌ 登出失败:', result.error);
        return ApiResponse.error('登出失败', 'LOGOUT_FAILED');
      }
    } catch (error: any) {
      console.error('❌ 登出过程中发生错误:', error);

      // 根据异常类型返回相应的错误响应
      if (error.name === 'InvalidTokenException') {
        return ApiResponse.error(error.message, 'INVALID_TOKEN');
      }
      if (error.name === 'UserNotFoundException') {
        return ApiResponse.error('用户不存在', 'USER_NOT_FOUND');
      }

      return ApiResponse.error('登出失败，请稍后重试', 'LOGOUT_FAILED');
    }
  }

  /**
   * 刷新令牌
   * POST /api/v1/auth/refresh
   */
  @Post('/refresh')
  @HttpCode(200)
  @ApiOperation({
    summary: '刷新访问令牌',
    description: '使用刷新令牌获取新的访问令牌和刷新令牌',
    tags: ['认证管理']
  })
  @ApiBody({
    description: '刷新令牌请求数据',
    type: RefreshTokenDto
  })
  @SwaggerApiResponse({
    status: 200,
    description: '令牌刷新成功',
    type: AuthTokensResponseDto
  })
  @CommonApiResponses.BadRequest('请求参数错误')
  @CommonApiResponses.Unauthorized('刷新令牌无效或已过期')
  @CommonApiResponses.NotFound('用户不存在')
  @CommonApiResponses.InternalServerError('服务器内部错误')
  async refreshToken(
    @ValidatedBody(ValidationPipe) requestData: RefreshTokenDto
  ): Promise<ApiResponse<AuthTokensResponseDto>> {
    console.log('🔄 AuthController.refreshToken 开始执行');
    console.log('📋 请求数据:', { hasRefreshToken: !!requestData.refreshToken });

    try {
      // 从验证管道获取验证后的数据
      const actualData = (requestData as any)?.body || requestData;

      // 创建刷新令牌命令
      const command = new RefreshTokenCommand(
        actualData.refreshToken,
        'unknown', // IP地址 - 在测试环境中使用默认值
        'unknown'  // User-Agent - 在测试环境中使用默认值
      );

      console.log('📤 执行刷新令牌命令');
      const result = await this.commandBus.execute(command);

      if (result.success) {
        console.log('✅ 令牌刷新成功');

        // 构建响应数据
        const responseData = new AuthTokensResponseDto(
          result.data.tokens,
          result.data.user
        );

        return ApiResponse.success(
          responseData,
          '令牌刷新成功'
        );
      } else {
        console.log('❌ 令牌刷新失败:', result.error);
        return ApiResponse.error('令牌刷新失败', 'REFRESH_FAILED');
      }
    } catch (error: any) {
      console.error('❌ 令牌刷新过程中发生错误:', error);

      // 根据异常类型返回相应的错误响应
      if (error.name === 'InvalidTokenException') {
        return ApiResponse.error(error.message, 'INVALID_TOKEN');
      }
      if (error.name === 'TokenExpiredException') {
        return ApiResponse.error(error.message, 'TOKEN_EXPIRED');
      }
      if (error.name === 'UserNotFoundException') {
        return ApiResponse.error('用户不存在', 'USER_NOT_FOUND');
      }

      return ApiResponse.error('令牌刷新失败，请重新登录', 'REFRESH_FAILED');
    }
  }

  /**
   * 重置密码
   * POST /api/v1/auth/reset-password
   */
  @Post('/reset-password')
  @HttpCode(200)
  @ApiOperation({
    summary: '重置密码',
    description: '使用邮箱验证码重置用户密码',
    tags: ['认证管理']
  })
  @ApiBody({
    description: '重置密码请求数据',
    type: ResetPasswordDto
  })
  @SwaggerApiResponse({
    status: 200,
    description: '密码重置成功',
    type: 'object'
  })
  @CommonApiResponses.BadRequest('请求参数错误')
  @CommonApiResponses.Unauthorized('验证码无效或已过期')
  @CommonApiResponses.NotFound('用户不存在')
  @CommonApiResponses.InternalServerError('服务器内部错误')
  async resetPassword(
    @ValidatedBody(ValidationPipe) requestData: ResetPasswordDto
  ): Promise<ApiResponse> {
    console.log('🔍 AuthController.resetPassword 开始执行');
    console.log('📋 请求数据:', {
      email: requestData.email,
      hasVerificationCode: !!requestData.verificationCode,
      hasNewPassword: !!requestData.newPassword
    });

    try {
      // 从验证管道获取验证后的数据
      const actualData = (requestData as any)?.body || requestData;

      // 创建重置密码命令
      const command = new ResetPasswordCommand(
        actualData.email,
        actualData.verificationCode,
        actualData.newPassword,
        actualData.confirmPassword,
        'unknown', // IP地址 - 在测试环境中使用默认值
        'unknown'  // User-Agent - 在测试环境中使用默认值
      );

      console.log('📤 执行重置密码命令');
      const result = await this.commandBus.execute(command);

      if (result.success) {
        console.log('✅ 密码重置成功');
        console.log('📊 重置结果:', {
          userId: result.data.user.id,
          resetTime: result.data.resetTime,
          forceReauthentication: result.data.forceReauthentication
        });

        return ApiResponse.success(
          {
            success: true,
            resetTime: result.data.resetTime,
            forceReauthentication: result.data.forceReauthentication,
            message: '密码重置成功，请使用新密码重新登录'
          },
          '密码重置成功'
        );
      } else {
        console.log('❌ 密码重置失败:', result.error);
        return ApiResponse.error('密码重置失败', 'RESET_PASSWORD_FAILED');
      }
    } catch (error: any) {
      console.error('❌ 密码重置过程中发生错误:', error);

      // 根据异常类型返回相应的错误响应
      if (error.name === 'InvalidVerificationCodeException') {
        return ApiResponse.error(error.message, 'INVALID_VERIFICATION_CODE');
      }
      if (error.name === 'UserNotFoundException') {
        return ApiResponse.error('用户不存在或邮箱地址错误', 'USER_NOT_FOUND');
      }
      if (error.name === 'WeakPasswordException') {
        return ApiResponse.error(error.message, 'WEAK_PASSWORD');
      }
      if (error.name === 'PasswordMismatchException') {
        return ApiResponse.error(error.message, 'PASSWORD_MISMATCH');
      }

      return ApiResponse.error('密码重置失败，请稍后重试', 'RESET_PASSWORD_FAILED');
    }
  }

  /**
   * 检查邮箱可用性
   * GET /check-email-availability
   */
  async checkEmailAvailability(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      // 从查询参数中获取邮箱
      const email = req.query.email as string;

      // 基本邮箱格式验证
      if (!email) {
        const response = ApiResponse.validationError([{
          field: 'email',
          message: '邮箱参数不能为空',
          code: 'EMAIL_REQUIRED',
          value: email
        }], '邮箱参数验证失败');
        res.status(400).json(response);
        return;
      }

      // 邮箱格式验证
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!emailRegex.test(email)) {
        const response = ApiResponse.validationError([{
          field: 'email',
          message: '邮箱格式不正确',
          code: 'INVALID_EMAIL_FORMAT',
          value: email
        }], '邮箱格式验证失败');
        res.status(400).json(response);
        return;
      }

      // 创建查询命令来检查邮箱是否已存在
      const checkQuery = new GetUserByEmailQuery(email);
      const result = await this.queryBus.execute(checkQuery);

      // 如果查询成功且找到用户，说明邮箱已被使用
      const available = !result.success;

      const response = ApiResponse.success({
        available,
        email,
        message: available ? '邮箱可用' : '邮箱已被使用'
      }, available ? '邮箱可用' : '邮箱已被使用');

      res.status(200).json(response);

    } catch (error) {
      console.error('Check email availability error:', error);
      const response = ApiResponse.internalError('邮箱可用性检查失败');
      res.status(500).json(response);
    }
  }

  /**
   * 获取当前用户信息
   * GET /api/v1/auth/me
   */
  @Get('/me')
  @UseGuards()
  @HttpCode(200)
  @ApiOperation({
    summary: '获取当前用户信息',
    description: '获取当前登录用户的详细信息，包括基本资料、权限等',
    tags: ['认证管理']
  })
  @SwaggerApiResponse({
    status: 200,
    description: '获取用户信息成功',
    type: UserResponseDto
  })
  @CommonApiResponses.Unauthorized('未登录或令牌无效')
  @CommonApiResponses.NotFound('用户不存在')
  @CommonApiResponses.InternalServerError('服务器内部错误')
  async getCurrentUser(
    req: AuthenticatedRequest
  ): Promise<ApiResponse<UserResponseDto>> {
    console.log('🔍 AuthController.getCurrentUser 开始执行');
    console.log('👤 用户ID:', req.user?.id);

    try {
      // 从认证中间件获取用户ID
      const userId = req.user?.id;
      if (!userId) {
        return ApiResponse.error('用户身份验证失败', 'AUTHENTICATION_FAILED');
      }

      // 创建获取用户信息查询
      const query = new GetCurrentUserQuery(
        userId,
        true,  // 包含敏感信息（权限等）
        false  // 不包含统计信息（提高性能）
      );

      console.log('📤 执行获取用户信息查询');
      const result = await this.queryBus.execute(query);

      if (result.success) {
        console.log('✅ 获取用户信息成功');
        console.log('📊 查询结果:', {
          fromCache: result.data.fromCache,
          queryTime: result.data.queryTime
        });

        return ApiResponse.success(
          result.data.user,
          '获取用户信息成功'
        );
      } else {
        console.log('❌ 获取用户信息失败:', result.error);
        return ApiResponse.error('获取用户信息失败', 'GET_USER_FAILED');
      }
    } catch (error: any) {
      console.error('❌ 获取用户信息过程中发生错误:', error);

      // 根据异常类型返回相应的错误响应
      if (error.name === 'UserNotFoundException') {
        return ApiResponse.error('用户不存在', 'USER_NOT_FOUND');
      }

      return ApiResponse.error('获取用户信息失败，请稍后重试', 'GET_USER_FAILED');
    }
  }

  /**
   * 健康检查
   * GET /api/v1/auth/health
   */
  @Get('/health')
  @HttpCode(200)
  async healthCheck(): Promise<ApiResponse<{
    status: string;
    timestamp: string;
    service: string;
    version: string;
  }>> {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'auth-service',
      version: '1.0.0'
    };

    return ApiResponse.success(healthData, '认证服务运行正常');
  }
}
