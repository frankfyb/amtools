/**
 * 用户登出命令处理器
 * 
 * 处理用户登出请求，包括令牌撤销、黑名单管理和安全审计
 * 支持单设备登出和全设备登出两种模式
 */

import { CommandHandler, ICommandHandler } from '../../../core/cqrs/decorators';
import { Injectable, Inject } from '../../../core/di/decorators';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../core/di/tokens';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { ITokenBlacklistService } from '../../../domain/services/token-blacklist.service.interface';
import { LogoutUserCommand } from '../../commands/auth/logout-user.command';
import { CommandResult } from '../../../shared/types/cqrs.types';
import { User } from '../../../domain/entities/user.entity';
import { 
  InvalidTokenException,
  UserNotFoundException
} from '../../../shared/exceptions/auth.exceptions';

/**
 * 登出结果接口
 */
interface LogoutResult {
  /** 登出成功 */
  success: boolean;
  /** 登出类型 */
  logoutType: 'single_device' | 'all_devices';
  /** 撤销的令牌数量 */
  revokedTokensCount: number;
  /** 登出时间 */
  logoutTime: Date;
  /** 用户信息 */
  user: User;
}

@CommandHandler(LogoutUserCommand)
@Injectable()
export class LogoutUserHandler implements ICommandHandler<LogoutUserCommand> {
  constructor(
    @Inject(REPOSITORY_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(SERVICE_TOKENS.TOKEN_BLACKLIST_SERVICE)
    private readonly tokenBlacklistService: ITokenBlacklistService
  ) {}

  /**
   * 执行登出命令
   */
  async execute(command: LogoutUserCommand): Promise<CommandResult<LogoutResult>> {
    try {
      // 1. 验证命令参数
      const validation = command.validate();
      if (!validation.isValid) {
        const errorMessages = validation.errors.map(e => e.message).join(', ');
        throw new InvalidTokenException(errorMessages);
      }

      // 2. 获取用户信息
      const user = await this.getUserById(command.userId);

      // 3. 执行登出操作
      let revokedTokensCount = 0;
      
      if (command.logoutAllDevices) {
        // 全设备登出：撤销用户的所有令牌
        revokedTokensCount = await this.logoutAllDevices(command, user);
      } else {
        // 单设备登出：只撤销当前会话的令牌
        revokedTokensCount = await this.logoutCurrentDevice(command);
      }

      // 4. 更新用户登出信息
      await this.updateUserLogoutInfo(user, command);

      const logoutTime = new Date();

      return {
        success: true,
        data: {
          success: true,
          logoutType: command.getLogoutType(),
          revokedTokensCount,
          logoutTime,
          user
        }
      };
    } catch (error) {
      // 记录登出失败日志
      console.error('用户登出失败:', {
        userId: command.userId,
        logoutType: command.getLogoutType(),
        ipAddress: command.ipAddress,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * 获取用户信息
   */
  private async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new UserNotFoundException('用户不存在或已被删除');
    }

    return user;
  }

  /**
   * 单设备登出：撤销当前会话的令牌
   */
  private async logoutCurrentDevice(command: LogoutUserCommand): Promise<number> {
    let revokedCount = 0;

    try {
      // 撤销访问令牌
      const accessTokenExpiration = command.getAccessTokenExpiration();
      if (accessTokenExpiration) {
        await this.tokenBlacklistService.addToBlacklist(
          command.accessToken,
          accessTokenExpiration
        );
        revokedCount++;
        console.log('✅ 访问令牌已加入黑名单');
      }

      // 撤销刷新令牌（如果提供）
      if (command.refreshToken) {
        const refreshTokenExpiration = command.getRefreshTokenExpiration();
        if (refreshTokenExpiration) {
          await this.tokenBlacklistService.addToBlacklist(
            command.refreshToken,
            refreshTokenExpiration
          );
          revokedCount++;
          console.log('✅ 刷新令牌已加入黑名单');
        }
      }

      console.log(`✅ 单设备登出完成，撤销了 ${revokedCount} 个令牌`);
      return revokedCount;
    } catch (error) {
      console.error('单设备登出失败:', error);
      throw new Error('登出失败，请稍后重试');
    }
  }

  /**
   * 全设备登出：撤销用户的所有令牌
   */
  private async logoutAllDevices(command: LogoutUserCommand, user: User): Promise<number> {
    try {
      // 先执行单设备登出（撤销当前令牌）
      const currentDeviceCount = await this.logoutCurrentDevice(command);

      // 然后撤销用户的所有其他令牌
      await this.tokenBlacklistService.blacklistAllUserTokens(command.userId);
      
      console.log('✅ 全设备登出完成，用户的所有令牌已被撤销');
      
      // 返回撤销的令牌数量（当前设备的令牌 + 全局撤销标记）
      return currentDeviceCount + 1; // +1 表示全局撤销操作
    } catch (error) {
      console.error('全设备登出失败:', error);
      throw new Error('全设备登出失败，请稍后重试');
    }
  }

  /**
   * 更新用户登出信息
   */
  private async updateUserLogoutInfo(user: User, command: LogoutUserCommand): Promise<void> {
    try {
      // 记录登出信息（如果用户实体支持）
      if (typeof user.recordLogout === 'function') {
        user.recordLogout({
          logoutType: command.getLogoutType(),
          ipAddress: command.ipAddress,
          userAgent: command.userAgent,
          logoutTime: new Date()
        });
      }

      // 如果是全设备登出，可能需要更新安全相关字段
      if (command.logoutAllDevices && typeof user.forceReauthentication === 'function') {
        user.forceReauthentication('全设备登出');
      }

      // 保存用户信息
      await this.userRepository.save(user);
      
      console.log('✅ 用户登出信息已更新');
    } catch (error) {
      console.error('更新用户登出信息失败:', error);
      // 不抛出错误，因为登出已经成功
    }
  }

  /**
   * 验证令牌所有权（安全检查）
   */
  private validateTokenOwnership(command: LogoutUserCommand): boolean {
    try {
      // 检查访问令牌中的用户ID是否匹配
      const accessTokenPayload = command.getTokenPayload(command.accessToken);
      const accessTokenUserId = accessTokenPayload?.sub || accessTokenPayload?.userId;
      
      if (accessTokenUserId !== command.userId) {
        console.warn('⚠️ 访问令牌用户ID不匹配:', {
          commandUserId: command.userId,
          tokenUserId: accessTokenUserId
        });
        return false;
      }

      // 检查刷新令牌中的用户ID是否匹配（如果提供）
      if (command.refreshToken) {
        const refreshTokenPayload = command.getTokenPayload(command.refreshToken);
        const refreshTokenUserId = refreshTokenPayload?.sub || refreshTokenPayload?.userId;
        
        if (refreshTokenUserId !== command.userId) {
          console.warn('⚠️ 刷新令牌用户ID不匹配:', {
            commandUserId: command.userId,
            tokenUserId: refreshTokenUserId
          });
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('验证令牌所有权失败:', error);
      return false;
    }
  }

  /**
   * 记录安全审计日志
   */
  private async recordSecurityAudit(command: LogoutUserCommand, result: LogoutResult): Promise<void> {
    try {
      const auditInfo = command.getAuditInfo();
      
      // 这里可以集成审计日志服务
      console.log('🔍 登出安全审计:', {
        ...auditInfo,
        result: {
          success: result.success,
          revokedTokensCount: result.revokedTokensCount,
          logoutTime: result.logoutTime
        }
      });
      
      // TODO: 集成实际的审计日志服务
      // await this.auditService.recordLogout(auditInfo, result);
    } catch (error) {
      console.error('记录安全审计日志失败:', error);
      // 不抛出错误，因为这不应该影响登出功能
    }
  }
}
