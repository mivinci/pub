package core

const (
	// MsgTypeSys indicates the message is from system
	MsgTypeSys = iota + 1
	// MsgTypeClient indicates the message is from user
	MsgTypeClient
)

// Message message
type Message struct {
	Sender   string
	Receiver string
	Content  string
	Type     int
}

func newMsgSys(receiver, content string) Message {
	return Message{
		Receiver: receiver,
		Content:  content,
		Type:     MsgTypeSys,
	}
}

func newMsgClient(sender, receiver, content string) Message {
	return Message{
		Sender:   sender,
		Receiver: receiver,
		Content:  content,
		Type:     MsgTypeClient,
	}
}

func newMsgSysHalt(receiver string) Message {
	return newMsgSys(receiver, "halt")
}

func newMsgSysStart() Message {
	return newMsgSys("", "start")
}

func newMsgSysClose() Message {
	return newMsgSys("", "close")
}

func newMsgSysLose() Message {
	return newMsgSys("", "lose")
}
