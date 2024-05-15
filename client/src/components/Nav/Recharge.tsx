import * as Tabs from '@radix-ui/react-tabs';
import { MessageSquare } from 'lucide-react';
import { SettingsTabValues } from 'librechat-data-provider';
import type { TDialogProps } from '~/common';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui';
import { GearIcon, DataIcon, UserIcon, ExperimentIcon } from '~/components/svg';
import { General, Messages, Beta, Data, Account } from './SettingsTabs';
import { useMediaQuery, useLocalize } from '~/hooks';
import { cn } from '~/utils';

export default function Recharge({ open, onOpenChange }: TDialogProps) {
  const isSmallScreen = useMediaQuery('(max-width: 767px)');
  const localize = useLocalize();

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
        <div className="max-h-[373px] overflow-auto px-6 md:min-h-[373px] md:w-[680px]">
          <p>todo...</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
