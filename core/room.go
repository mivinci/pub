package core

import (
	"encoding/json"

	"github.com/gobwas/ws/wsutil"
	"github.com/issue9/unique"
)

const (
	// RoomFull indicates that a room is available
	// which means the room has only one user in it
	RoomFull = iota + 1
	// RoomNotFull indicates
	RoomNotFull

	// MaxClients is maximum amount of client
	MaxClients = 2

	// ClientStateOnTyping indicates that the other user is typing
	ClientStateOnTyping = iota + 1
	// ClientStateOffTyping indicates that the other user stoped typing
	ClientStateOffTyping
)

// Room room
type Room struct {
	ID          string
	Topic       string
	state       int
	maxClients  int
	Clients     map[string]*Client
	broadcast   chan Message
	clientState chan int
	done        chan struct{}
}

// NewRoom creates a new room
func NewRoom(topic string) *Room {
	return &Room{
		ID:          unique.String().String(),
		Topic:       topic,
		state:       RoomNotFull,
		maxClients:  MaxClients,
		Clients:     make(map[string]*Client, MaxClients),
		broadcast:   make(chan Message),
		clientState: make(chan int),
		done:        make(chan struct{}, 1),
	}
}

// AddClient 添加一个用户，若添加后，人数达到最大值则通知所有用户匹配成功
func (r *Room) AddClient(c *Client) error {
	r.Clients[c.ID] = c
	// 若房间满了，设置房间已满状态，通知房间里的人匹配成功
	if len(r.Clients) == r.maxClients {
		r.state = RoomFull
		r.Broadcast(newSysMsg("", "START"))
	}
	return nil
}

// DelClient 删除一个用户
func (r *Room) DelClient(c *Client) error {
	delete(r.Clients, c.ID)
	r.Broadcast(newSysMsg("", "LOSE"))
	return nil
}

func (r Room) hasClient(c *Client) bool {
	if _, ok := r.Clients[c.ID]; ok {
		return true
	}
	return false
}

// Match matches for client
func (r Room) Match(c *Client) bool {
	return r.state == RoomNotFull && !r.hasClient(c)
}

// Broadcast broadcast to all clients
func (r Room) Broadcast(m Message) {
	b, _ := json.Marshal(m)
	for _, c := range r.Clients {
		wsutil.WriteServerText(*c.conn, b)
	}
}

// Start starts listening messages
func (r *Room) Start() {
	for {
		select {
		case msg := <-r.broadcast:
			r.Broadcast(msg)
		case <-r.done:
			// log.Printf("room(%s) received a stop signal", r.ID)
			return
		}
	}
}

// Stop stops room and gives itself away to GC
func (r *Room) Stop() {
	r.done <- struct{}{}
	r.Clients = nil
	r.clientState = nil
	r.broadcast = nil
	// log.Printf("room(%s) stopped", r.ID)
}
