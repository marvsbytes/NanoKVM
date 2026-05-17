package kvmswitch

import (
	"fmt"
	"sync"

	"NanoKVM-Server/service/extensions/kvmswitch/devices/tesmart"

	log "github.com/sirupsen/logrus"
)

type Service struct {
	mu           sync.RWMutex
	activeDevice KVMSwitch
}

func NewService() *Service {
	s := &Service{}
	s.tryRestoreConnection()
	return s
}

// tryRestoreConnection attempts to reconnect to the previously saved device on startup.
func (s *Service) tryRestoreConnection() {
	cfg, err := loadConfig()
	if err != nil || cfg == nil {
		return
	}

	device, err := newDevice(cfg)
	if err != nil {
		log.Debugf("kvm switch: could not restore device %q: %s", cfg.Model, err)
		return
	}

	if err := device.Connect(); err != nil {
		log.Debugf("kvm switch: could not reconnect to %q: %s", cfg.Model, err)
		return
	}

	s.activeDevice = device
	log.Debugf("kvm switch: restored connection to %q", cfg.Model)
}

// newDevice instantiates the correct KVMSwitch implementation for the given config.
func newDevice(cfg *DeviceConfig) (KVMSwitch, error) {
	switch cfg.Model {
	case "tesmart":
		return tesmart.New(cfg.Host, cfg.Port, cfg.PortCount), nil
	default:
		return nil, fmt.Errorf("unsupported model %q", cfg.Model)
	}
}
