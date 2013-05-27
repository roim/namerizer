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
	SourceId string `json:"source"`
	TargetId string `json:"target"`
	Alias    string `json:"alias"`
	Name     string `json:"name"`
	Username string `json:"username"`
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

func validateInt64(n string) error {
	_, err := strconv.ParseInt(n, 10, 64)
	return err
}

func init() {
	http.HandleFunc("/addNewNickname", addNewNickname)
	http.HandleFunc("/getNicknamesForUser/", getNicknamesForUser)
	http.HandleFunc("/getSuggestions/", getSuggestions)
}

func addNewNickname(w http.ResponseWriter, r *http.Request) {
	c := appengine.NewContext(r)

	// Validate request
	//
	if r.Method != "POST" {
		http.Error(w, "405 HTTP method not allowed", 405)
		return
	}

	requestBody := make([]byte, r.ContentLength)

	if _, err := r.Body.Read(requestBody); err != nil {
		http.Error(w, "400 invalid request body", 400)
		c.Warningf(err.Error())
		return
	}

	var nick Nickname

	if err := json.Unmarshal(requestBody, &nick); err != nil {
		http.Error(w, "400 invalid json in request body", 400)
		c.Warningf(err.Error())
		return
	}

	if err := validateInt64(nick.SourceId); err != nil {
		http.Error(w, "400 invalid SourceId", 400)
		c.Warningf(err.Error())
		return
	}

	if err := validateInt64(nick.TargetId); err != nil {
		http.Error(w, "400 invalid TargetId", 400)
		c.Warningf(err.Error())
		return
	}

	// Process request
	//
	q := datastore.NewQuery("Nickname").Filter("SourceId =", nick.SourceId).Filter("TargetId =", nick.TargetId).KeysOnly()

	keys := make([]*datastore.Key, 0, 3000)

	keys, err := q.GetAll(c, nil)
	if err != nil {
		http.Error(w, "500 error querying the database", 500)
		c.Errorf(err.Error())
		return
	}

	if err := datastore.DeleteMulti(c, keys); err != nil {
		http.Error(w, "500 failure removing previous entries from the database", 500)
		c.Errorf(err.Error())
		return
	}

	if _, err := datastore.Put(c, datastore.NewIncompleteKey(c, "Nickname", nil), &nick); err != nil {
		http.Error(w, "500 could not add nickname to the database", 500)
		c.Errorf(err.Error())
		return
	}

}

func getNicknamesForUser(w http.ResponseWriter, r *http.Request) {
	c := appengine.NewContext(r)

	// Validate request
	//
	if r.Method != "GET" {
		http.Error(w, "405 HTTP method not allowed", 405)
		return
	}

	urlRegex, _ := regexp.Compile("^(http://fbnamerizer.appspot.com)?/getNicknamesForUser/")
	id := urlRegex.ReplaceAllString(r.URL.String(), "")

	if err := validateInt64(id); err != nil {
		http.Error(w, "400 invalid id", 400)
		c.Warningf(err.Error())
		return
	}

	// Process request
	//
	q := datastore.NewQuery("Nickname").Filter("SourceId =", id)

	results := make([]Nickname, 0, 3000)

	if _, err := q.GetAll(c, &results); err != nil {
		http.Error(w, "500 failure querying the databse", 500)
		c.Errorf(err.Error())
		return
	}

	b, err := json.Marshal(results)

	if err != nil {
		http.Error(w, "500 failure encoding result array to json", 500)
		c.Errorf(err.Error())
		return
	}

	fmt.Fprint(w, string(b))
}

func getSuggestions(w http.ResponseWriter, r *http.Request) {
	c := appengine.NewContext(r)

	// Validate request
	//
	if r.Method != "GET" {
		http.Error(w, "405 HTTP method not allowed", 405)
		return
	}

	urlRegex, _ := regexp.Compile("^(http://fbnamerizer.appspot.com)?/getSuggestions/")
	urlWithoutApiName := urlRegex.ReplaceAllString(r.URL.String(), "")

	idQtd := strings.Split(urlWithoutApiName, "?qtd=")
	var qtd int64
	var idQtdErr error

	if len(idQtd) > 2 {
		http.Error(w, "400 invalid request", 400)
		c.Warningf("More than 1 '?qtd=' tokens in request.")
		return
	} else if len(idQtd) == 2 {
		qtd, idQtdErr = strconv.ParseInt(idQtd[1], 10, 64)
		if idQtdErr != nil {
			http.Error(w, "400 invalid qtd", 400)
			c.Warningf(idQtdErr.Error())
			return
		}
	} else {
		qtd = 3
	}

	id := idQtd[0]

	if err := validateInt64(id); err != nil {
		http.Error(w, "400 invalid id", 400)
		c.Warningf(err.Error())
		return
	}

	// Process request
	//
	q := datastore.NewQuery("Nickname").Filter("TargetId =", id).Limit(3000)

	nicknames := make([]Nickname, 0, 3000)

	if _, err := q.GetAll(c, &nicknames); err != nil {
		http.Error(w, "500 failure querying the database", 500)
		c.Errorf(err.Error())
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
		c.Errorf(err.Error())
		return
	}

	fmt.Fprint(w, string(b))
}
