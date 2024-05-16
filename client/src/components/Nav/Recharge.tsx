import type { TDialogProps } from '~/common';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui';
import { useMediaQuery, useLocalize, useAuthContext } from '~/hooks';
import { cn } from '~/utils';
import { useGetStartupConfig } from 'librechat-data-provider/react-query';

export default function Recharge({ open, onOpenChange }: TDialogProps) {
  const isSmallScreen = useMediaQuery('(max-width: 767px)');
  const localize = useLocalize();
  const { user } = useAuthContext();
  const { data: startupConfig } = useGetStartupConfig();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'overflow-hidden shadow-2xl md:min-h-[373px] md:w-[680px]',
          isSmallScreen ? 'top-5 -translate-y-0' : '',
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-medium leading-6 text-gray-800 dark:text-gray-200">
            {localize('com_nav_user_update')}
          </DialogTitle>
        </DialogHeader>
        <div className="flex max-h-[373px] flex-col overflow-auto px-6 md:min-h-[373px] md:w-[680px] md:flex-row">
          <div
            className="border-token-border-light relative flex flex-1 flex-col gap-5 border-t px-6 py-4 text-sm last:border-r-0 md:max-w-xs md:border-r md:border-t-0"
            data-testid="free-pricing-modal-column"
          >
            <div className="bg-token-main-surface-primary relative flex flex-col">
              <div className="flex flex-col gap-1">
                <p className="flex items-center gap-2 text-xl font-medium">VIP</p>
                <div className="flex items-baseline gap-[6px]">
                  <p
                    className="text-token-text-tertiary text-base font-light"
                    data-testid="free-pricing-column-cost"
                  >
                    每月 30 元
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-token-main-surface-primary relative flex flex-col">
              <button
                onClick={() => window.open(`${startupConfig?.rechargeURL}${user?.email}`, '_blank')}
                className="mt-2 inline-flex h-10 items-center justify-center rounded-lg border border-none border-gray-200 bg-green-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-green-600 sm:mt-0"
              >
                <div className="flex w-full items-center justify-center gap-2">升级至 VIP</div>
              </button>
            </div>
            <div className="flex flex-grow flex-col gap-2">
              <div className="bg-token-main-surface-primary relative">
                <div className="text-l flex justify-start gap-2">
                  <div className="w-8 flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="mr-2 mt-1 h-4 w-4"
                    >
                      <path
                        fill="currentColor"
                        fillRule="evenodd"
                        d="M18.063 5.674a1 1 0 0 1 .263 1.39l-7.5 11a1 1 0 0 1-1.533.143l-4.5-4.5a1 1 0 1 1 1.414-1.414l3.647 3.647 6.82-10.003a1 1 0 0 1 1.39-.263"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <span>帮助您进行写作、解决问题等</span>
                </div>
              </div>
              <div className="bg-token-main-surface-primary relative">
                <div className="text-l flex justify-start gap-2">
                  <div className="w-8 flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="mr-2 mt-1 h-4 w-4"
                    >
                      <path
                        fill="currentColor"
                        fillRule="evenodd"
                        d="M18.063 5.674a1 1 0 0 1 .263 1.39l-7.5 11a1 1 0 0 1-1.533.143l-4.5-4.5a1 1 0 1 1 1.414-1.414l3.647 3.647 6.82-10.003a1 1 0 0 1 1.39-.263"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <span>对 GPT-3.5 的访问权限</span>
                </div>
              </div>
              <div className="bg-token-main-surface-primary relative">
                <div className="text-l flex justify-start gap-2">
                  <div className="w-8 flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="mr-2 mt-1 h-4 w-4"
                    >
                      <path
                        fill="currentColor"
                        fillRule="evenodd"
                        d="M18.063 5.674a1 1 0 0 1 .263 1.39l-7.5 11a1 1 0 0 1-1.533.143l-4.5-4.5a1 1 0 1 1 1.414-1.414l3.647 3.647 6.82-10.003a1 1 0 0 1 1.39-.263"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <span>对 GPT‑4o 的有限访问权限</span>
                </div>
              </div>
              <div className="bg-token-main-surface-primary relative">
                <div className="text-l flex justify-start gap-2">
                  <div className="w-8 flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="mr-2 mt-1 h-4 w-4"
                    >
                      <path
                        fill="currentColor"
                        fillRule="evenodd"
                        d="M18.063 5.674a1 1 0 0 1 .263 1.39l-7.5 11a1 1 0 0 1-1.533.143l-4.5-4.5a1 1 0 1 1 1.414-1.414l3.647 3.647 6.82-10.003a1 1 0 0 1 1.39-.263"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <span>
                    对高级数据分析、文件上传、视觉、网页浏览和自定义 GPT 等功能的有限访问权限
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div
            className="border-token-border-light relative flex flex-1 flex-col gap-5 border-t px-6 py-4 text-sm last:border-r-0 md:max-w-xs md:border-r md:border-t-0"
            data-testid="plus-pricing-modal-column"
          >
            <div className="bg-token-main-surface-primary relative flex flex-col">
              <div className="flex flex-col gap-1">
                <p className="flex items-center gap-2 text-xl font-medium">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="icon-md text-green-600"
                  >
                    <path
                      fill="currentColor"
                      d="M6.394 4.444c.188-.592 1.024-.592 1.212 0C8.4 8.9 9.1 9.6 13.556 10.394c.592.188.592 1.024 0 1.212C9.1 12.4 8.4 13.1 7.606 17.556c-.188.592-1.024.592-1.212 0C5.6 13.1 4.9 12.4.444 11.606c-.592-.188-.592-1.024 0-1.212C4.9 9.6 5.6 8.9 6.394 4.444m8.716 9.841a.41.41 0 0 1 .78 0c.51 2.865.96 3.315 3.825 3.826.38.12.38.658 0 .778-2.865.511-3.315.961-3.826 3.826a.408.408 0 0 1-.778 0c-.511-2.865-.961-3.315-3.826-3.826a.408.408 0 0 1 0-.778c2.865-.511 3.315-.961 3.826-3.826Zm2.457-12.968a.454.454 0 0 1 .866 0C19 4.5 19.5 5 22.683 5.567a.454.454 0 0 1 0 .866C19.5 7 19 7.5 18.433 10.683a.454.454 0 0 1-.866 0C17 7.5 16.5 7 13.317 6.433a.454.454 0 0 1 0-.866C16.5 5 17 4.5 17.567 1.317"
                    ></path>
                  </svg>
                  SVIP
                </p>
                <div className="flex items-baseline gap-[6px]">
                  <p
                    className="text-token-text-tertiary text-base font-light"
                    data-testid="plus-pricing-column-cost"
                  >
                    每月 50 元
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-token-main-surface-primary relative flex flex-col">
              <button
                onClick={() => window.open(`${startupConfig?.rechargeURL}${user?.email}`, '_blank')}
                className="mt-2 inline-flex h-10 items-center justify-center rounded-lg border border-none border-gray-200 bg-green-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-green-600 sm:mt-0"
              >
                <div className="flex w-full items-center justify-center gap-2">升级至 SVIP</div>
              </button>
            </div>
            <div className="flex flex-grow flex-col gap-2">
              <div className="bg-token-main-surface-primary relative">
                <div className="text-l flex justify-start gap-2">
                  <div className="w-8 flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="mr-2 mt-1 h-4 w-4"
                    >
                      <path
                        fill="currentColor"
                        fillRule="evenodd"
                        d="M18.063 5.674a1 1 0 0 1 .263 1.39l-7.5 11a1 1 0 0 1-1.533.143l-4.5-4.5a1 1 0 1 1 1.414-1.414l3.647 3.647 6.82-10.003a1 1 0 0 1 1.39-.263"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <span>Early access to new features</span>
                </div>
              </div>
              <div className="bg-token-main-surface-primary relative">
                <div className="text-l flex justify-start gap-2">
                  <div className="w-8 flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="mr-2 mt-1 h-4 w-4"
                    >
                      <path
                        fill="currentColor"
                        fillRule="evenodd"
                        d="M18.063 5.674a1 1 0 0 1 .263 1.39l-7.5 11a1 1 0 0 1-1.533.143l-4.5-4.5a1 1 0 1 1 1.414-1.414l3.647 3.647 6.82-10.003a1 1 0 0 1 1.39-.263"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <span>对 GPT-4、GPT‑4o、GPT-3.5 的访问权限</span>
                </div>
              </div>
              <div className="bg-token-main-surface-primary relative">
                <div className="text-l flex justify-start gap-2">
                  <div className="w-8 flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="mr-2 mt-1 h-4 w-4"
                    >
                      <path
                        fill="currentColor"
                        fillRule="evenodd"
                        d="M18.063 5.674a1 1 0 0 1 .263 1.39l-7.5 11a1 1 0 0 1-1.533.143l-4.5-4.5a1 1 0 1 1 1.414-1.414l3.647 3.647 6.82-10.003a1 1 0 0 1 1.39-.263"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <span>Up to 5x more messages for GPT‑4o</span>
                </div>
              </div>
              <div className="bg-token-main-surface-primary relative">
                <div className="text-l flex justify-start gap-2">
                  <div className="w-8 flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="mr-2 mt-1 h-4 w-4"
                    >
                      <path
                        fill="currentColor"
                        fillRule="evenodd"
                        d="M18.063 5.674a1 1 0 0 1 .263 1.39l-7.5 11a1 1 0 0 1-1.533.143l-4.5-4.5a1 1 0 1 1 1.414-1.414l3.647 3.647 6.82-10.003a1 1 0 0 1 1.39-.263"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <span>对高级数据分析、文件上传、视觉和网页浏览功能的访问权限</span>
                </div>
              </div>
              <div className="bg-token-main-surface-primary relative">
                <div className="text-l flex justify-start gap-2">
                  <div className="w-8 flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="mr-2 mt-1 h-4 w-4"
                    >
                      <path
                        fill="currentColor"
                        fillRule="evenodd"
                        d="M18.063 5.674a1 1 0 0 1 .263 1.39l-7.5 11a1 1 0 0 1-1.533.143l-4.5-4.5a1 1 0 1 1 1.414-1.414l3.647 3.647 6.82-10.003a1 1 0 0 1 1.39-.263"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <span>DALL·E 图片生成</span>
                </div>
              </div>
              <div className="bg-token-main-surface-primary relative">
                <div className="text-l flex justify-start gap-2">
                  <div className="w-8 flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="mr-2 mt-1 h-4 w-4"
                    >
                      <path
                        fill="currentColor"
                        fillRule="evenodd"
                        d="M18.063 5.674a1 1 0 0 1 .263 1.39l-7.5 11a1 1 0 0 1-1.533.143l-4.5-4.5a1 1 0 1 1 1.414-1.414l3.647 3.647 6.82-10.003a1 1 0 0 1 1.39-.263"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <span>创建和使用自定义 GPT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
