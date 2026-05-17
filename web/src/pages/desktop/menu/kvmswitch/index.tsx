import { useEffect } from 'react';
import { Divider } from 'antd';
import { CableIcon } from 'lucide-react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/extensions/kvmswitch.ts';
import { kvmSwitchStatusAtom, kvmSwitchPortNamesAtom } from '@/jotai/kvmswitch.ts';

import { MenuItem } from '@/components/menu-item.tsx';
import clsx from 'clsx';

export const KvmSwitch = () => {
  const { t } = useTranslation();

  const status = useAtomValue(kvmSwitchStatusAtom);
  const portNames = useAtomValue(kvmSwitchPortNamesAtom);
  const setPortNames = useSetAtom(kvmSwitchPortNamesAtom);
  const setStatus = useSetAtom(kvmSwitchStatusAtom);

  useEffect(() => {
    refreshStatus();
    refreshPortNames();
  }, []);

  function refreshStatus() {
    api.getStatus().then((rsp) => {
      if (rsp.code === 0) setStatus(rsp.data);
    });
  }

  function refreshPortNames() {
    api.getPortNames().then((rsp) => {
      if (rsp.code === 0 && rsp.data?.names) {
        setPortNames(rsp.data.names);
      }
    });
  }

  function handleSwitch(port: number) {
    api.switchPort(port).then((rsp) => {
      if (rsp.code === 0) {
        refreshStatus();
      }
    });
  }

  const portCount = status?.portCount || 0;

  const icon = (
    <>
      <CableIcon size={18} />
      {status?.connected && (
        <span className="hidden text-xs sm:block">
          {portNames[status!.currentPort] || t('kvmSwitch.ports.portLabel', { portNum: status!.currentPort + 1 })}
        </span>
      )}
    </>
  );

  const content = (
    <div className="min-w-[200px]">
      <div className="flex items-center justify-between px-1">
        <span className="text-base font-bold text-neutral-300">{t('kvmSwitch.title')}</span>
      </div>

      <Divider style={{ margin: '10px 0 15px 0' }} />
       
      {status?.connected ? (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(4, minmax(0, 1fr))` }}
        >
          {Array.from({ length: portCount }, (_, i) => {
            const label = portNames[i];
            return (
              <div
                key={i}
                className={clsx(
                  'flex flex-col cursor-pointer items-center justify-center rounded border transition-all duration-200 p-1 min-w-[40px] h-10',
                  status?.currentPort === i
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400 font-bold shadow-[0_0_12px_rgba(59,130,246,0.3)] scale-105'
                    : 'border-neutral-700 bg-neutral-800 text-neutral-400 hover:border-neutral-500 hover:text-white hover:bg-neutral-700'
                )}
                onClick={() => handleSwitch(i)}
              >
                <span className={clsx('text-xs', label ? 'text-[10px]' : 'text-sm')}>{i + 1}</span>
                {label && (
                  <span className="text-[9px] truncate max-w-[45px] opacity-80 leading-none mt-0.5">
                    {label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-3 py-2 text-sm text-red-500">{t('kvmSwitch.status.disconnected')}</div>
      )}
    </div>
  );

  return (
    <MenuItem
      className="flex h-[30px] cursor-pointer items-center justify-center rounded text-neutral-300 hover:bg-neutral-700/80 hover:text-white space-x-1 px-1.5"
      title={t('kvmSwitch.title')}
      icon={icon}
      content={content}
      onOpenChange={refreshStatus}
    />
  );
};
