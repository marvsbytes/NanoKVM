// Package device defines the KVMSwitch interface that all KVM switch
// implementations must satisfy. It is a separate package to avoid import cycles
// between the parent kvmswitch service and its device sub-packages.
package device

// KVMSwitch is the interface all KVM switch device implementations must satisfy.
// Implementations are constructed with device-specific parameters via a factory
// function (e.g. tesmart.New, mock.New); Connect/Disconnect manage the transport.
type KVMSwitch interface {
	// ModelName returns the device model identifier.
	ModelName() string

	// PortCount returns the total number of input ports on the device.
	PortCount() int

	// Connect establishes the connection to the device.
	Connect() error

	// Disconnect closes the connection to the device.
	Disconnect() error

	// SwitchPort switches the active input to the given 0-based port index.
	SwitchPort(port int) error

	// GetCurrentPort returns the currently active 0-based port index.
	GetCurrentPort() (int, error)
}
