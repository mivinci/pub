package topic

import (
	"sync"

	"github.com/golang/groupcache/lru"
)

var (
	locker sync.RWMutex
	cache  = lru.New(5)
)

// Topic is topic tag
type Topic struct {
	Name  string
	Color string
}

// Add adds a topic
func Add(topic string) {
	locker.Lock()
	defer locker.Unlock()
	cache.Add(topic, nil)
}

// List lists all topics exist
func List() []string {
	// for k := range cache {
	// }
	return nil
}
