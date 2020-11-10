package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"net/http"

	"github.com/gobwas/ws"
	"github.com/issue9/unique"
	"github.com/mivinci/omega/core"
)

var (
	port string
)

func init() {
	flag.StringVar(&port, "p", "8000", "choose a port to run")
	flag.Parse()
}

func main() {
	engine := core.NewEngine()

	http.Handle("/", http.FileServer(http.Dir("./html")))

	http.HandleFunc("/chat", func(w http.ResponseWriter, r *http.Request) {
		id := r.URL.Query().Get("id")
		if id == "" {
			id = unique.String().String()
			http.Redirect(w, r, fmt.Sprintf("/chat?id=%s", id), http.StatusFound)
			return
		}
		http.ServeFile(w, r, "html/chat.html")
	})

	http.HandleFunc("/status", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Content-Type", "application/json")
		b, err := json.Marshal(engine.Status())
		if err != nil {
			http.Error(w, "", 500)
			return
		}
		w.Write(b)
	})

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		id := r.URL.Query().Get("id")
		if id == "" {
			http.Error(w, "invalid id", 401)
			return
		}

		conn, _, _, err := ws.UpgradeHTTP(r, w)
		if err != nil {
			http.Error(w, "server internal error", 500)
			return
		}

		engine.NewClient(&conn, id)
	})

	http.ListenAndServe(fmt.Sprintf(":%s", port), nil)
}
