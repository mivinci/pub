package core

import (
	"encoding/json"
	"net"

	"github.com/gobwas/ws/wsutil"
)

// Engine engine
type Engine struct {
	clients    map[string]*Client
	rooms      map[string]*Room
	register   chan *Client
	unregister chan *Client
}

// NewEngine creates a new engine
func NewEngine() *Engine {
	e := &Engine{
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[string]*Client),
		rooms:      make(map[string]*Room),
	}
	go e.start()
	return e
}

func (e *Engine) start() {
	for {
		select {
		// 当有新用户连接
		case client := <-e.register:
			// 通知用户正在匹配
			e.send(client, newSysMsg(client.ID, "HALT"))

			e.clients[client.ID] = client
			room := e.match(client)
			room.AddClient(client)
			client.room = room
			// log.Printf("client(%s) join room(%s)", client.ID, room.ID)

		// 当有用户断开连接
		case client := <-e.unregister:
			// log.Printf("unregister client(%s)", client.ID)
			room := client.room
			err := room.DelClient(client)
			if err == nil {
				room.Stop()
			}
			delete(e.rooms, room.ID)
			delete(e.clients, client.ID)
		}
	}
}

func (e *Engine) match(c *Client) *Room {
	for _, r := range e.rooms {
		if r.Match(c) {
			return r
		}
	}
	// 若没有匹配到房间，则创建一个房间并启动它
	r := NewRoom(c.Topic)
	go r.Start()
	e.rooms[r.ID] = r
	// log.Printf("created new room(%s) that has topic(%s)", r.ID, r.Topic)
	return r
}

func (e *Engine) send(c *Client, m Message) {
	b, _ := json.Marshal(&m)
	wsutil.WriteServerText(*c.conn, b)
}

// NewClient creates a new client and starts it
func (e *Engine) NewClient(conn *net.Conn, id, topic string) *Client {
	client := &Client{
		ID:     id,
		Topic:  topic,
		engine: e,
		conn:   conn,
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
