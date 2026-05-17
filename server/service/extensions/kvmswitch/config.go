package kvmswitch

import (
	"encoding/json"
	"errors"
	"os"
)

const (
	ConfigDir  = "/etc/kvm/kvmswitch"
	ConfigFile = "/etc/kvm/kvmswitch/config.json"
)

// DeviceConfig holds the persisted connection parameters for the active device.
type DeviceConfig struct {
	Model     string `json:"model"`
	Host      string `json:"host,omitempty"`      // TESmart: IP address or hostname
	Port      string `json:"port,omitempty"`      // TESmart: TCP port
	PortCount int    `json:"portCount,omitempty"` // number of ports on the switch
}

func loadConfig() (*DeviceConfig, error) {
	data, err := os.ReadFile(ConfigFile)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil, nil
		}
		return nil, err
	}

	var cfg DeviceConfig
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}

func saveConfig(cfg *DeviceConfig) error {
	if err := os.MkdirAll(ConfigDir, 0o755); err != nil {
		return err
	}

	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(ConfigFile, data, 0o644)
}

func deleteConfig() error {
	err := os.Remove(ConfigFile)
	if errors.Is(err, os.ErrNotExist) {
		return nil
	}
	return err
}
