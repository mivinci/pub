package core

const (
	// RoomAvailable indicates that a room is available
	// which means the room has only one user in it
	RoomAvailable = iota + 1
	// RoomUnavailable indicates that a room is unavailable
	RoomUnavailable
	// RoomDestroyed indicates that a room is destroyed
	// due to an offline of the other client
	RoomDestroyed

	// MaxClients maximum amount of client
	MaxClients = 2
)

// Room room
type Room struct {
	ID         string
	state      int
	maxClients int
	Clients    []*Client
}

func (r *Room) hasClient(c *Client) bool {
	for _, client := range r.Clients {
		if client.ID == c.ID {
			return true
		}
	}
	return false
}
