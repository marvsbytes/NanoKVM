package kvmswitch

import (
	"NanoKVM-Server/proto"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

func (s *Service) SwitchPort(c *gin.Context) {
	var req proto.SwitchKvmPortReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	if s.activeDevice == nil {
		rsp.ErrRsp(c, -2, "not connected")
		return
	}

	if req.Port < 0 || req.Port > s.activeDevice.PortCount() {
		rsp.ErrRsp(c, -3, "port out of range")
		return
	}

	if err := s.activeDevice.SwitchPort(req.Port); err != nil {
		rsp.ErrRsp(c, -4, "switch port failed")
		log.Errorf("failed to switch kvm port to %d: %s", req.Port, err)
		return
	}

	rsp.OkRsp(c)
	log.Debugf("kvm switch port changed to %d", req.Port)
}
