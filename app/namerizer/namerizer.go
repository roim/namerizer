package namerizer

import (
	"appengine"
	"appengine/datastore"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

type Nickname struct {
	AuthorId int64
	TargetId int64
	Alias    string
	Name     string
	Username string
}

type Pair struct {
	Key   string
	Value int
}

type PairList []Pair

func (p PairList) Swap(i, j int)      { p[i], p[j] = p[j], p[i] }
func (p PairList) Len() int           { return len(p) }
func (p PairList) Less(i, j int) bool { return p[i].Value > p[j].Value } // Since we want in descending order

func sortMapKeysByValue(m map[string]int, qtd int) []string {
	p := make(PairList, len(m))
	i := 0
	for k, v := range m {
		p[i] = Pair{k, v}
		i++
	}
	sort.Sort(p)

	var min int
	if qtd < len(m) {
		min = qtd
	} else {
		min = len(m)
	}

	keys := make([]string, min)
	for j := 0; j < min; j++ {
		keys[j] = p[j].Key
	}

	return keys
}

func init() {
	http.HandleFunc("/addNewNickname", addNewNickname)
	http.HandleFunc("/getNicknamesForUser/", getNicknamesForUser)
	http.HandleFunc("/getSuggestions/", getSuggestions)
}

func addNewNickname(w http.ResponseWriter, r *http.Request) {
	// Validate request
	if r.Method != "POST" {
		http.Error(w, "403 method forbidden", 400)
		return
	}

	requestBody := make([]byte, r.ContentLength)

	if _, err := r.Body.Read(requestBody); err != nil {
		http.Error(w, "400 invalid request body", 400)
		return
	}

	var nick Nickname

	if err := json.Unmarshal(requestBody, &nick); err != nil {
		http.Error(w, "400 invalid json in request body", 400)
		return
	}

	// Process request

	c := appengine.NewContext(r)

	q := datastore.NewQuery("Nickname").Filter("AuthorId =", nick.AuthorId).Filter("TargetId =", nick.TargetId).KeysOnly()

	keys := make([]*datastore.Key, 0, 3000)

	keys, err := q.GetAll(c, nil)
	if err != nil {
		http.Error(w, "500 error querying the database", 500)
		return
	}

	if err := datastore.DeleteMulti(c, keys); err != nil {
		http.Error(w, "500 failure removing previous entries from the database", 500)
		return
	}

	if _, err := datastore.Put(c, datastore.NewIncompleteKey(c, "Nickname", nil), &nick); err != nil {
		http.Error(w, "500 could not add nickname to the database", 500)
		return
	}

}

func getNicknamesForUser(w http.ResponseWriter, r *http.Request) {
	// Validate request
	if r.Method != "GET" {
		http.Error(w, "403 method forbidden", 400)
		return
	}

	urlRegex, _ := regexp.Compile("^/getNicknamesForUser/")
	id, err := strconv.ParseInt(urlRegex.ReplaceAllString(r.URL.String(), ""), 10, 64)

	if err != nil {
		http.Error(w, "400 invalid id", 400)
		return
	}

	// Process request

	c := appengine.NewContext(r)

	q := datastore.NewQuery("Nickname").Filter("AuthorId =", id)

	results := make([]Nickname, 0, 3000)

	if _, err := q.GetAll(c, &results); err != nil {
		http.Error(w, "500 failure querying the databse", 500)
		return
	}

	b, err := json.Marshal(results)

	if err != nil {
		http.Error(w, "500 failure encoding result array to json", 500)
		return
	}

	fmt.Fprint(w, string(b))
}

func getSuggestions(w http.ResponseWriter, r *http.Request) {
	// Validate request
	if r.Method != "GET" {
		http.Error(w, "403 method forbidden", 400)
		return
	}

	urlRegex, _ := regexp.Compile("^/getSuggestions/")
	urlWithoutApiName := urlRegex.ReplaceAllString(r.URL.String(), "")

	idQtd := strings.Split(urlWithoutApiName, "?qtd=")

	if len(idQtd) > 2 {
		http.Error(w, "400 invalid request", 400)
		return
	}

	id, err := strconv.ParseInt(idQtd[0], 10, 64)
	if err != nil {
		http.Error(w, "400 invalid id", 400)
		return
	}

	var qtd int64
	if len(idQtd) == 1 {
		qtd = 3
	} else {
		qtd, err = strconv.ParseInt(idQtd[1], 10, 64)
		if err != nil {
			http.Error(w, "400 invalid qtd", 400)
			return
		}
	}

	// Process request

	c := appengine.NewContext(r)

	q := datastore.NewQuery("Nickname").Filter("TargetId =", id).Limit(3000)

	nicknames := make([]Nickname, 0, 3000)

	if _, err := q.GetAll(c, &nicknames); err != nil {
		http.Error(w, "500 failure querying the database", 500)
		return
	}

	var nickFrequency map[string]int = make(map[string]int)

	for i := 0; i < len(nicknames); i++ {
		nickFrequency[nicknames[i].Alias]++
	}

	results := sortMapKeysByValue(nickFrequency, int(qtd))

	b, err := json.Marshal(results)

	if err != nil {
		http.Error(w, "500 failure encoding result array to json", 500)
		return
	}

	fmt.Fprint(w, string(b))
}
