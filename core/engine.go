package core

import (
	"encoding/json"
	"net"

	"github.com/gobwas/ws/wsutil"
	"github.com/issue9/unique"
)

// Engine engine
type Engine struct {
	clients    map[string]*Client
	broadcast  chan Message
	register   chan *Client
	unregister chan *Client
	rooms      map[string]*Room
}

// NewEngine creates a chat engine and starts it
func NewEngine() *Engine {
	engine := &Engine{
		broadcast:  make(chan Message),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[string]*Client),
		rooms:      make(map[string]*Room),
	}
	go engine.start()
	return engine
}

func (e *Engine) start() {
	for {
		select {
		// 新用户连线
		case client := <-e.register:
			e.clients[client.ID] = client
			room := e.available(client)
			room.Clients = append(room.Clients, client)
			client.room = room
			// log.Printf("accept new client: %v", client)

			// 告诉客户端正在匹配
			b, _ := json.Marshal(newMsgSysHalt(client.ID))
			wsutil.WriteServerText(*client.conn, b)

			if len(room.Clients) == room.maxClients {
				room.state = RoomUnavailable
				b, _ := json.Marshal(newMsgSysStart())
				e.send(b, room)
			}

		// 某个用户连接断线
		case client := <-e.unregister:
			room := client.room
			if room != nil {
				b, _ := json.Marshal(newMsgSysLose())
				e.send(b, room)
				room.state = RoomDestroyed
				// 删掉聊天室
				delete(e.rooms, room.ID)
			}
			// 删掉用户
			delete(e.clients, client.ID)

		// 收到一条消息，将该条消息发送到对应的聊天室
		case msg := <-e.broadcast:
			// log.Printf("accept message: %v", msg)
			room := e.clients[msg.Sender].room
			if room.state == RoomUnavailable {
				b, _ := json.Marshal(msg)
				e.send(b, room)
			}
		}
	}
}

func (e *Engine) send(msg []byte, room *Room) {
	for _, c := range room.Clients {
		wsutil.WriteServerText(*c.conn, msg)
	}
}

func (e *Engine) available(c *Client) *Room {
	var room *Room
	var avail bool
	for _, r := range e.rooms {
		if r.state == RoomAvailable && !r.hasClient(c) {
			room = r
			avail = true
		}
	}
	if !avail {
		id := unique.String().String()
		room = &Room{
			ID:         id,
			state:      RoomAvailable,
			maxClients: MaxClients,
			Clients:    make([]*Client, 0, MaxClients),
		}
		e.rooms[id] = room
	}
	// log.Printf("create new room: %v", room)
	return room
}

// NewClient creates a client and starts it
func (e *Engine) NewClient(conn *net.Conn, id string) *Client {
	client := &Client{
		ID:     id,
		conn:   conn,
		engine: e,
	}
	e.register <- client
	go client.start()
	return client
}

// Status is engine status
type Status struct {
	ClientCount int
	RoomCount   int
	HaltCount   int
}

// Status reads engine status
func (e Engine) Status() Status {
	return Status{
		ClientCount: len(e.clients),
		RoomCount:   len(e.rooms),
	}
}
