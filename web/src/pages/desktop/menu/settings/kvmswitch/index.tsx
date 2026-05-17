import { useEffect, useState } from 'react';
import { Divider } from 'antd';
import { LoaderCircleIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/extensions/kvmswitch.ts';

import { Connect } from './connect.tsx';
import { Header } from './header.tsx';
import { Ports } from './ports.tsx';
import type { Status } from './types.ts';

export const KvmSwitch = () => {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<Status>();
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    loadStatus();
  }, []);

  function loadStatus() {
    if (isLoading) return;
    setIsLoading(true);

    api
      .getStatus()
      .then((rsp) => {
        if (rsp.code !== 0) {
          setErrMsg(rsp.msg);
          return;
        }
        setStatus(rsp.data);
      })
      .catch((err) => {
        setErrMsg(err?.message || 'Failed to get status');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  const state = status?.connected ? 'connected' : 'disconnected';

  return (
    <>
      <Header state={state} />
      <Divider className="opacity-50" />

      {isLoading ? (
        <div className="flex w-full items-center justify-center space-x-2 pt-5 text-neutral-500">
          <LoaderCircleIcon className="animate-spin" size={18} />
          <span>{t('kvmSwitch.connect.connecting')}</span>
        </div>
      ) : (
        <div className="flex flex-col space-y-6">
          <Connect
            status={status}
            onConnected={loadStatus}
            onDisconnected={loadStatus}
          />

          {status?.connected && (
            <>
              <Divider className="opacity-50" />
              <Ports status={status} />
            </>
          )}

          {errMsg && <div className="text-sm text-red-500">{errMsg}</div>}
        </div>
      )}
    </>
  );
};
