package core

const (
	// MsgTypeSys indicates the message is from system to user
	MsgTypeSys = iota + 1
	// MsgTypeClient indicates the message is from user to user
	MsgTypeClient
)

// Message message
type Message struct {
	Sender   string
	Receiver string
	Content  string
	Type     int
}

func newSysMsg(receiver, content string) Message {
	return Message{
		Receiver: receiver,
		Content:  content,
		Type:     MsgTypeSys,
	}
}

func newClientMsg(sender, receiver, content string) Message {
	return Message{
		Sender:   sender,
		Receiver: receiver,
		Content:  content,
		Type:     MsgTypeClient,
	}
}
