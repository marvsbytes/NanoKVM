import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Input } from 'antd';
import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/extensions/kvmswitch.ts';
import { kvmSwitchPortNamesAtom } from '@/jotai/kvmswitch.ts';
import type { Status } from './types.ts';
import { XIcon } from 'lucide-react';

type PortsProps = {
  status: Status;
};

const Panel = ({ title, description, children }: { title: string; description?: string; children: ReactNode }) => (
  <div className="overflow-hidden rounded-xl bg-neutral-800/50">
    <div className="px-4 pb-1.5 pt-3">
      <div className="font-semibold text-neutral-100">{title}</div>
      {description && <div className="mt-0.5 text-xs leading-snug text-neutral-500">{description}</div>}
    </div>
    <div>{children}</div>
  </div>
);

const EditablePortNameRow = ({
  value,
  placeholder,
  onChange
}: {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) => (
  <div className="group px-4 py-1.5">
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <Button
        tabIndex={-1}
        size="small"
        shape="circle"
        icon={<XIcon size={14} />}
        onClick={() => onChange('')}
        className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
      />
    </div>
  </div>
);

export const Ports = ({ status }: PortsProps) => {
  const { t } = useTranslation();

  const [portNames, setPortNames] = useAtom(kvmSwitchPortNamesAtom);

  const [originalPortNames, setOriginalPortNames] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(refreshPortNames, []);

  function refreshPortNames() {
    api.getPortNames().then((rsp) => {
      if (rsp.code === 0 && rsp.data?.names) {
        setPortNames(rsp.data.names);
        setOriginalPortNames(rsp.data.names);
      }
    });
  }

  function handleNameChange(port: number, value: string) {
    setMessage('');
    setError('');
    const updated = [...portNames];
    updated[port] = value;
    setPortNames(updated);
  }

  async function save() {
    if (isSaving) return;
    setMessage('');
    setError('');
    setIsSaving(true);

    try {
      const rsp = await api.setPortNames(portNames);
      if (rsp.code !== 0) throw new Error(rsp.msg);

      setOriginalPortNames({ ...portNames });
      setMessage(t('kvmSwitch.ports.saved'));
    } catch {
      setError(t('kvmSwitch.ports.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  }

  const hasChanges = portNames.some((v, i) => (v || '') !== (originalPortNames[i] || ''));

  const statusText = error || message || (hasChanges ? t('kvmSwitch.ports.unsaved') : '');
  const statusColor = error ? 'text-red-400' : message ? 'text-green-400' : 'text-yellow-400/80';

  return (
    <div className="flex flex-col space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-1">
          <span>{t('kvmSwitch.ports.title')}</span>
          <span className="text-xs text-neutral-500">{t('kvmSwitch.ports.description')}</span>
        </div>
      </div>

      <Panel title={t('kvmSwitch.ports.title')}>
        {Array.from({ length: status?.portCount || 0 }, (_, i) => (
          <EditablePortNameRow
            key={i}
            value={portNames[i] || ''}
            placeholder={t('kvmSwitch.ports.namePlaceholder', { portNum: i + 1 })}
            onChange={(value) => handleNameChange(i, value)}
          />
        ))}
      </Panel>

      {/* Footer: status + save button */}
      {(hasChanges || statusText) && (
        <div className="flex items-center justify-between">
          <span className={`text-xs ${statusColor}`}>{statusText}</span>
          <Button
            type={hasChanges ? 'primary' : 'default'}
            loading={isSaving}
            disabled={!hasChanges}
            onClick={save}
          >
            {t('kvmSwitch.ports.save')}
          </Button>
        </div>
      )}
    </div>
  );
};
