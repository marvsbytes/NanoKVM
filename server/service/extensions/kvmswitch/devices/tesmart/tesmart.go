package tesmart

import (
	"fmt"
	"io"
	"net"
	"time"

	"NanoKVM-Server/service/extensions/kvmswitch/device"

	log "github.com/sirupsen/logrus"
)

const (
	DefaultTCPPort   = "5000"
	defaultPortCount = 8
	connectTimeout   = 5 * time.Second
	readTimeout      = 3 * time.Second
)

// Device implements the KVMSwitch interface for TESmart IP/TCP KVM switches.
// Command protocol (6-byte frames):
//
//	Switch port:    AA BB 03 01 <port> EE  (port is 1-based)
//	Query port:     AA BB 03 10 00    EE
//	Query response: AA BB 03 11 <port> EE
type Device struct {
	host        string
	tcpPort     string
	portCount   int
	conn        net.Conn
	currentPort int
}

// New returns a TESmart KVMSwitch. tcpPort defaults to "5000" when empty.
// portCount defaults to defaultPortCount when <= 0.
func New(host, tcpPort string, portCount int) device.KVMSwitch {
	if tcpPort == "" {
		tcpPort = DefaultTCPPort
	}
	if portCount <= 0 {
		portCount = defaultPortCount
	}
	return &Device{
		host:      host,
		tcpPort:   tcpPort,
		portCount: portCount,
	}
}

func (d *Device) addr() string {
	return net.JoinHostPort(d.host, d.tcpPort)
}

func (d *Device) ModelName() string { return "tesmart" }
func (d *Device) PortCount() int    { return d.portCount }

func (d *Device) Connect() error {
	conn, err := net.DialTimeout("tcp", d.addr(), connectTimeout)
	if err != nil {
		return fmt.Errorf("dial %s: %w", d.addr(), err)
	}
	d.conn = conn

	if port, err := d.queryCurrentPort(true); err == nil {
		d.currentPort = port
	} else {
		d.currentPort = 1
		log.Debugf("kvm switch: could not query initial port, defaulting to 1: %s", err)
	}

	return nil
}

func (d *Device) Disconnect() error {
	if d.conn == nil {
		return nil
	}
	err := d.conn.Close()
	d.conn = nil
	d.currentPort = 0
	return err
}

func (d *Device) SwitchPort(port int) error {
	if d.conn == nil {
		return fmt.Errorf("not connected")
	}

	// TESmart protocol uses 1-based port numbers for switching. Convert from 0-based port index.
	portNum := port + 1

	oldPort, _ := d.GetCurrentPort()
	log.Debugf("kvm switch: switching from port %d to port %d", oldPort, portNum)

	if _, err := d.sendCommand(0x01, byte(portNum), true); err != nil {
		return fmt.Errorf("write switch command: %w", err)
	}

	newPort, _ := d.GetCurrentPort()

	d.currentPort = newPort
	return nil
}

func (d *Device) GetCurrentPort() (int, error) {
	if d.conn == nil {
		return 0, fmt.Errorf("not connected")
	}

	// TESmart protocol uses 0-based port numbers for querying.
	port, err := d.queryCurrentPort(true)
	if err != nil {
		// Return cached value rather than an error so callers can still render the UI.
		log.Warnf("kvm switch: using cached port %d after query error: %s", d.currentPort, err)
		return d.currentPort, nil
	}

	d.currentPort = port
	return port, nil
}

func (d *Device) queryCurrentPort(retry bool) (int, error) {
	// TESmart protocol uses 0-based port numbers for querying.
	port, err := d.sendCommand(0x10, 0x00, retry)
	return port, err
}

func (d *Device) sendCommand(cmd byte, val byte, retry bool) (int, error) {
	msg := []byte{0xAA, 0xBB, 0x03, cmd, val, 0xEE}
	log.Debugf("kvm switch: sending command: %X", msg)
	if _, err := d.conn.Write(msg); err != nil {
		return 0, fmt.Errorf("write query command: %w", err)
	}

	_ = d.conn.SetReadDeadline(time.Now().Add(readTimeout))
	defer func() { _ = d.conn.SetReadDeadline(time.Time{}) }()

	resp := make([]byte, 6)
	if _, err := io.ReadFull(d.conn, resp); err != nil {
		return 0, fmt.Errorf("read response: %w", err)
	}
	log.Debugf("kvm switch: received response: %X", resp)

	if resp[0] != 0xAA || resp[1] != 0xBB || resp[2] != 0x03 {
		// retry once if response is malformed, as some TESmart models may send an initial invalid frame before the correct one
		if retry {
			log.Debugf("kvm switch: unexpected response frame, retrying once: %X", resp)
			return d.sendCommand(cmd, val, false)
		}
		return 0, fmt.Errorf("unexpected response frame: %X", resp)
	}

	// Currently not used: cmdResp := resp[3]
	valResp := resp[4]

	return int(valResp), nil
}
