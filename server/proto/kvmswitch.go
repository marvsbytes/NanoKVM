package proto

// ConnectKvmSwitchReq is the request body for POST /api/extensions/kvmswitch/connect.
type ConnectKvmSwitchReq struct {
	Model     string `validate:"required"`        // device model: "tesmart"
	Host      string `validate:"omitempty"`       // TESmart: IP address or hostname
	Port      string `validate:"omitempty"`       // TESmart: TCP port (default "5000")
	PortCount int    `validate:"omitempty,min=1"` // number of ports on the switch (default 8)
}

// SwitchKvmPortReq is the request body for POST /api/extensions/kvmswitch/switch.
type SwitchKvmPortReq struct {
	Port int `validate:"min=0"`
}

// SetKvmPortNamesReq is the request body for POST /api/extensions/kvmswitch/port-names.
type SetKvmPortNamesReq struct {
	Names []string `validate:"required"` // ["My PC", "Server"]
}

// GetKvmSwitchStatusRsp is the response for GET /api/extensions/kvmswitch/status.
type GetKvmSwitchStatusRsp struct {
	Connected   bool   `json:"connected"`
	Model       string `json:"model"`
	Host        string `json:"host"`
	Port        string `json:"port"`
	CurrentPort int    `json:"currentPort"`
	PortCount   int    `json:"portCount"`
}

// GetKvmPortNamesRsp is the response for GET /api/extensions/kvmswitch/port-names.
type GetKvmPortNamesRsp struct {
	Names []string `json:"names"`
}
