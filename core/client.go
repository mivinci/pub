package core

import (
	"log"
	"net"

	"github.com/gobwas/ws/wsutil"
)

// Client client
type Client struct {
	ID     string
	conn   *net.Conn
	room   *Room
	engine *Engine
	closed bool
}

func (c *Client) close() {
	if !c.closed {
		c.closed = true
		c.engine.unregister <- c
		err := (*c.conn).Close()
		if err != nil {
			log.Printf("close client(%s) failed %v", c.ID, err)
		}
		log.Printf("client(%s) left", c.ID)
	}
}

func (c *Client) start() {
	defer c.close()

	// log.Printf("start new client")

	for {
		msg, _, err := wsutil.ReadClientData(*c.conn)
		if err != nil {
			c.close()
			log.Printf("read client(%s) data failed, client closed", c.ID)
			break
		}
		c.engine.broadcast <- newMsgClient(c.ID, "", string(msg))
	}
}
