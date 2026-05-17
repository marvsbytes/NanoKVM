import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Form, Input, InputNumber, Select } from 'antd';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/extensions/kvmswitch.ts';
import type { Status } from './types.ts';

type ConnectProps = {
  status: Status | undefined;
  onConnected: () => void;
  onDisconnected: () => void;
};

const Panel = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="overflow-hidden rounded-xl bg-neutral-800/50">
    <div className="px-4 pb-1.5 pt-3">
      <div className="font-semibold text-neutral-100">{title}</div>
    </div>
    <div>{children}</div>
  </div>
);

const InfoRow = ({ label, value, isLast = false }: { label: string; value?: string; isLast?: boolean }) => (
  <div className="px-4">
    <div className={`flex min-h-[44px] items-center justify-between ${isLast ? '' : 'border-b border-neutral-700/50'}`}>
      <span className="text-sm text-neutral-300">{label}</span>
      <span className="max-w-[330px] break-all text-right text-sm text-neutral-500">{value || '-'}</span>
    </div>
  </div>
);

export const Connect = ({ status, onConnected, onDisconnected }: ConnectProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const [form] = Form.useForm();

  const isConnected = status?.connected === true;

  function handleConnect(values: { model: string; host: string; port: string; portCount: number }) {
    if (loading) return;
    setLoading(true);
    setErrMsg('');

    api
      .connect({ model: values.model, host: values.host, port: values.port, portCount: values.portCount })
      .then((rsp) => {
        if (rsp.code !== 0) {
          setErrMsg(rsp.msg || t('kvmSwitch.connect.failed'));
          return;
        }
        onConnected();
      })
      .catch((err) => {
        setErrMsg(err?.message || t('kvmSwitch.connect.failed'));
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function handleDisconnect() {
    if (loading) return;
    setLoading(true);
    setErrMsg('');

    api
      .disconnect()
      .then((rsp) => {
        if (rsp.code !== 0) {
          setErrMsg(rsp.msg);
          return;
        }
        onDisconnected();
      })
      .catch((err) => {
        setErrMsg(err?.message || '');
      })
      .finally(() => {
        setLoading(false);
      });
  }

  if (isConnected) {
    const modelLabel = t('kvmSwitch.models.' + status!.model, { defaultValue: status!.model });
    return (
      <div className="flex flex-col space-y-4">
        <Panel title={t('kvmSwitch.connect.title')}>
          <InfoRow label={t('kvmSwitch.connect.infoModel')} value={modelLabel} />
          <InfoRow label={t('kvmSwitch.connect.infoHost')} value={status!.host} />
          <InfoRow label={t('kvmSwitch.connect.infoTcpPort')} value={status!.port || '5000'} />
          <InfoRow label={t('kvmSwitch.connect.infoPortCount')} value={String(status!.portCount)} isLast />
        </Panel>

        <div>
          <Button danger onClick={handleDisconnect} loading={loading}>
            {loading ? t('kvmSwitch.connect.disconnecting') : t('kvmSwitch.connect.disconnectBtn')}
          </Button>
          {errMsg && <div className="mt-2 text-sm text-red-500">{errMsg}</div>}
        </div>
      </div>
    );
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleConnect}
      initialValues={{ model: status?.model || 'tesmart', host: status?.host || '', port: status?.port || '5000', portCount: status?.portCount || 8 }}
      className="space-y-0"
    >
      <Form.Item
        name="model"
        label={t('kvmSwitch.connect.model')}
        rules={[{ required: true }]}
      >
        <Select>
          <Select.Option value="tesmart">{t('kvmSwitch.models.tesmart')}</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="host"
        label={t('kvmSwitch.connect.host')}
        rules={[{ required: true }]}
      >
        <Input placeholder={t('kvmSwitch.connect.hostPlaceholder')} />
      </Form.Item>

      <Form.Item name="port" label={t('kvmSwitch.connect.port')}>
        <Input placeholder={t('kvmSwitch.connect.portPlaceholder')} />
      </Form.Item>

      <Form.Item name="portCount" label={t('kvmSwitch.connect.portCount')}>
        <InputNumber min={1} max={64} placeholder={t('kvmSwitch.connect.portCountPlaceholder')} className="w-full" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          {loading ? t('kvmSwitch.connect.connecting') : t('kvmSwitch.connect.connectBtn')}
        </Button>
      </Form.Item>

      {errMsg && <div className="text-sm text-red-500">{errMsg}</div>}
    </Form>
  );
};
