package router

import (
	"NanoKVM-Server/middleware"
	"NanoKVM-Server/service/extensions/kvmswitch"

	"github.com/gin-gonic/gin"
)

func kvmswitchRouter(r *gin.Engine) {
	service := kvmswitch.NewService()

	api := r.Group("/api/extensions/kvmswitch").Use(middleware.CheckToken())

	api.GET("/status", service.GetStatus)        // get connection status and current port
	api.POST("/connect", service.Connect)        // connect to a KVM switch device
	api.POST("/disconnect", service.Disconnect)  // disconnect from the active device
	api.POST("/switch", service.SwitchPort)      // switch to a port
	api.GET("/port-names", service.GetPortNames) // get on-device port names
	api.POST("/port-names", service.SetPortNames) // update on-device port names
}
