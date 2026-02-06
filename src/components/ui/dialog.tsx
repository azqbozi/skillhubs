import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Dialog 上下文
 */
interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined);

function useDialogContext() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog');
  }
  return context;
}

/**
 * Dialog 根组件
 */
interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open = false, onOpenChange, children }: DialogProps) {
  const handleOpenChange = React.useCallback(
    (value: boolean) => {
      onOpenChange?.(value);
    },
    [onOpenChange]
  );

  return (
    <DialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

/**
 * Dialog 触发器
 */
interface DialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function DialogTrigger({ children, asChild }: DialogTriggerProps) {
  const { onOpenChange } = useDialogContext();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => onOpenChange(true),
    });
  }

  return (
    <button type="button" onClick={() => onOpenChange(true)}>
      {children}
    </button>
  );
}

/**
 * Dialog 内容（遮罩 + 弹窗）
 * @param priority - 设为 true 时使用更高 z-index，用于嵌套弹窗（如安装目标选择）
 */
interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
  priority?: boolean;
}

export function DialogContent({ children, className, priority }: DialogContentProps) {
  const { open, onOpenChange } = useDialogContext();

  // ESC 关闭
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const content = (
    <div
      className={cn(
        'fixed inset-0 flex items-center justify-center p-4',
        priority ? 'z-[60]' : 'z-50'
      )}
    >
      {/* 遮罩 */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md"
        onClick={() => onOpenChange(false)}
      />
      {/* 弹窗内容 - 使用 Portal 渲染到 body，避免被父级 overflow 裁切 */}
      <div
        className={cn(
          'relative z-50 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border/60 bg-card/95 p-6 shadow-xl backdrop-blur-xl',
          'shadow-[0_0_0_1px_hsl(var(--border)/0.5),0_25px_50px_-12px_rgba(0,0,0,0.5)]',
          'animate-in fade-in-0 zoom-in-95 duration-200',
          className
        )}
      >
        {/* 关闭按钮 */}
        <button
          type="button"
          className="absolute right-4 top-4 rounded-md p-1 opacity-60 ring-offset-background transition-all hover:opacity-100 hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">关闭</span>
        </button>
        {children}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

/**
 * Dialog 标题
 */
interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogHeader({ children, className }: DialogHeaderProps) {
  return (
    <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}>
      {children}
    </div>
  );
}

/**
 * Dialog 标题文字
 */
interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogTitle({ children, className }: DialogTitleProps) {
  return (
    <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)}>
      {children}
    </h2>
  );
}

/**
 * Dialog 描述
 */
interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogDescription({ children, className }: DialogDescriptionProps) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)}>{children}</p>
  );
}

/**
 * Dialog 底部
 */
interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}>
      {children}
    </div>
  );
}
