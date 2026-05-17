import { useTranslation } from 'react-i18next';
import type { KvmSwitchState } from './types.ts';

type HeaderProps = {
  state: KvmSwitchState;
};

export const Header = ({ state }: HeaderProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between">
      <div className="text-base">{t('kvmSwitch.title')}</div>
      <span
        className={
          state === 'connected'
            ? 'rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400'
            : 'rounded-full bg-neutral-500/20 px-2 py-0.5 text-xs text-neutral-400'
        }
      >
        {state === 'connected'
          ? t('kvmSwitch.status.connected')
          : t('kvmSwitch.status.disconnected')}
      </span>
    </div>
  );
};
