/**
 * 命令总线实现
 */

import { Injectable } from '../di/decorators';
import {
  ICommand,
  ICommandBus,
  ICommandHandler,
  CommandHandlerNotFoundError,
  ValidationFailedError,
  ValidationResult
} from './types';

@Injectable()
export class CommandBus implements ICommandBus {
  private readonly handlers = new Map<string, ICommandHandler<any>>();

  /**
   * 执行命令
   */
  async execute<TResult = any>(command: ICommand): Promise<TResult> {
    const commandType = command.constructor.name;

    // 查找处理器
    const handler = this.handlers.get(commandType);
    if (!handler) {
      throw new CommandHandlerNotFoundError(commandType);
    }

    // 执行命令
    try {
      const result = await handler.execute(command);
      return result;
    } catch (error) {
      // 记录错误日志
      console.error(`Command execution failed for ${commandType}:`, error);
      throw error;
    }
  }

  /**
   * 注册命令处理器
   */
  register<TCommand extends ICommand>(
    commandType: new (...args: any[]) => TCommand,
    handler: ICommandHandler<TCommand>
  ): void {
    const commandTypeName = commandType.name;
    
    if (this.handlers.has(commandTypeName)) {
      throw new Error(`Command handler already registered for ${commandTypeName}`);
    }

    this.handlers.set(commandTypeName, handler);
  }

  /**
   * 取消注册命令处理器
   */
  unregister<TCommand extends ICommand>(commandType: new (...args: any[]) => TCommand): void {
    const commandTypeName = commandType.name;
    this.handlers.delete(commandTypeName);
  }

  /**
   * 检查是否已注册处理器
   */
  hasHandler<TCommand extends ICommand>(commandType: new (...args: any[]) => TCommand): boolean {
    const commandTypeName = commandType.name;
    return this.handlers.has(commandTypeName);
  }

  /**
   * 获取所有已注册的命令类型
   */
  getRegisteredCommandTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * 清空所有处理器
   */
  clear(): void {
    this.handlers.clear();
  }


}
