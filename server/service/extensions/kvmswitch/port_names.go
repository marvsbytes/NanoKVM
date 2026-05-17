package kvmswitch

import (
	"encoding/json"
	"errors"
	"os"

	"NanoKVM-Server/proto"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

const PortNamesFile = "/etc/kvm/kvmswitch/port_names.json"

func (s *Service) GetPortNames(c *gin.Context) {
	var rsp proto.Response

	names, err := loadPortNames()
	if err != nil {
		rsp.ErrRsp(c, -1, "failed to read port names")
		log.Errorf("failed to load kvm port names: %s", err)
		return
	}

	rsp.OkRspWithData(c, &proto.GetKvmPortNamesRsp{Names: names})
	log.Debugf("get kvm port names success")
}

func (s *Service) SetPortNames(c *gin.Context) {
	var req proto.SetKvmPortNamesReq
	var rsp proto.Response

	if err := proto.ParseFormRequest(c, &req); err != nil {
		rsp.ErrRsp(c, -1, "invalid arguments")
		return
	}

	if err := savePortNames(req.Names); err != nil {
		rsp.ErrRsp(c, -2, "failed to save port names")
		log.Errorf("failed to save kvm port names: %s", err)
		return
	}

	rsp.OkRsp(c)
	log.Debugf("set kvm port names success")
}

func loadPortNames() ([]string, error) {
	data, err := os.ReadFile(PortNamesFile)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return []string{}, nil
		}
		return nil, err
	}

	var names []string
	if err := json.Unmarshal(data, &names); err != nil {
		return nil, err
	}

	return names, nil
}

func savePortNames(names []string) error {
	if err := os.MkdirAll(ConfigDir, 0o755); err != nil {
		return err
	}

	data, err := json.MarshalIndent(names, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(PortNamesFile, data, 0o644)
}
