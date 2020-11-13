package core

import (
	"log"
	"net"

	"github.com/gobwas/ws/wsutil"
)

// Client client
type Client struct {
	ID     string
	Topic  string
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
			log.Printf("close client(%s) error(%v)", c.ID, err)
		}
		log.Printf("client(%s) closed", c.ID)
	}
}

func (c *Client) start() {
	defer c.close()

	log.Printf("start new client(%s)", c.ID)

	for {
		msg, _, err := wsutil.ReadClientData(*c.conn)
		if err != nil {
			log.Printf("read client(%s) data failed, client closed", c.ID)
			c.close()
			break
		}
		log.Printf("read client(%s) data(%s)", c.ID, msg)
		c.room.broadcast <- newClientMsg(c.ID, "", string(msg))
	}
}
