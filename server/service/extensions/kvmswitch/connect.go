package kvmswitch

import (
	"NanoKVM-Server/proto"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

func (s *Service) GetStatus(c *gin.Context) {
	var rsp proto.Response

	s.mu.RLock()
	defer s.mu.RUnlock()

	// Always load config so the frontend can pre-fill the connect form even when
	// not currently connected.
	cfg, _ := loadConfig()

	if s.activeDevice == nil {
		if cfg == nil {
			rsp.OkRspWithData(c, &proto.GetKvmSwitchStatusRsp{Connected: false})
			return
		}
		rsp.OkRspWithData(c, &proto.GetKvmSwitchStatusRsp{
			Connected: false,
			Model:     cfg.Model,
			Host:      cfg.Host,
			Port:      cfg.Port,
			PortCount: cfg.PortCount,
		})
		return
	}

	currentPort, err := s.activeDevice.GetCurrentPort()
	if err != nil {
		log.Errorf("failed to get kvm current port: %s", err)
	}

	var host, port string
	if cfg != nil {
		host = cfg.Host
		port = cfg.Port
	}

	rsp.OkRspWithData(c, &proto.GetKvmSwitchStatusRsp{
		Connected:   true,
		Model:       s.activeDevice.ModelName(),
		Host:        host,
		Port:        port,
		CurrentPort: currentPort,
		PortCount:   s.activeDevice.PortCount(),
	})
	log.Debugf("get kvm switch status success")
}

func (s *Service) Connect(c *gin.Context) {
	var req proto.ConnectKvmSwitchReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	cfg := &DeviceConfig{
		Model:     req.Model,
		Host:      req.Host,
		Port:      req.Port,
		PortCount: req.PortCount,
	}

	device, err := newDevice(cfg)
	if err != nil {
		rsp.ErrRsp(c, -2, "unsupported device model")
		log.Errorf("kvm switch: unsupported model %q: %s", req.Model, err)
		return
	}

	if err := device.Connect(); err != nil {
		rsp.ErrRsp(c, -3, "connection failed")
		log.Errorf("failed to connect to kvm switch: %s", err)
		return
	}

	s.mu.Lock()
	if s.activeDevice != nil {
		_ = s.activeDevice.Disconnect()
	}
	s.activeDevice = device
	s.mu.Unlock()

	if err := saveConfig(cfg); err != nil {
		log.Errorf("failed to save kvm switch config: %s", err)
	}

	rsp.OkRsp(c)
	log.Debugf("kvm switch connected: model=%s", req.Model)
}

func (s *Service) Disconnect(c *gin.Context) {
	var rsp proto.Response

	s.mu.Lock()
	defer s.mu.Unlock()

	if s.activeDevice == nil {
		rsp.OkRsp(c)
		return
	}

	if err := s.activeDevice.Disconnect(); err != nil {
		log.Errorf("failed to disconnect kvm switch: %s", err)
	}
	s.activeDevice = nil

	// Config is intentionally kept on disconnect so the reconnect form can be
	// pre-filled with the last-used connection settings.

	rsp.OkRsp(c)
	log.Debugf("kvm switch disconnected")
}
