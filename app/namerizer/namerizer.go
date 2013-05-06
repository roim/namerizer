package namerizer

import (
	"appengine"
	"appengine/datastore"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
)

type Nickname struct {
	AuthorId int64
	TargetId int64
	Alias    string
	Name     string
	Username string
}

func init() {
	http.HandleFunc("/getNicknamesForUser/", getNicknamesForUser)
	http.HandleFunc("/addNewNickname", addNewNickname)
}

func getNicknamesForUser(w http.ResponseWriter, r *http.Request) {
	// Validate request

	urlRegex, _ := regexp.Compile("^/getNicknamesForUser/")
	id, err := strconv.ParseInt(urlRegex.ReplaceAllString(r.URL.String(), ""), 10, 64)

	if err != nil {
		http.Error(w, "400: Invalid id", 400)
		return
	}

	// Process request

	c := appengine.NewContext(r)

	q := datastore.NewQuery("Nickname").Filter("AuthorId =", id)

	results := make([]Nickname, 0, 3000)

	if _, err := q.GetAll(c, &results); err != nil {
		http.Error(w, "500: Failure querying the databse", 500)
		return
	}

	b, err := json.Marshal(results)

	if err != nil {
		http.Error(w, "500: Failure encoding result array to json", 500)
		return
	}

	fmt.Fprint(w, string(b))
}

func addNewNickname(w http.ResponseWriter, r *http.Request) {
	// Validate request

	requestBody := make([]byte, r.ContentLength)

	if _, err := r.Body.Read(requestBody); err != nil {
		http.Error(w, "400: Invalid request body", 400)
		return
	}

	var nick Nickname

	if err := json.Unmarshal(requestBody, &nick); err != nil {
		http.Error(w, "400: Invalid json in request body", 400)
		return
	}

	// Process request

	c := appengine.NewContext(r)

	q := datastore.NewQuery("Nickname").Filter("AuthorId =", nick.AuthorId).Filter("TargetId =", nick.TargetId).KeysOnly()

	keys := make([]*datastore.Key, 0, 3000)

	keys, err := q.GetAll(c, nil)
	if err != nil {
		http.Error(w, "500: Error querying the database", 500)
		return
	}

	if err := datastore.DeleteMulti(c, keys); err != nil {
		http.Error(w, "500: Failure removing previous entries from the database", 500)
		return
	}

	if _, err := datastore.Put(c, datastore.NewIncompleteKey(c, "Nickname", nil), &nick); err != nil {
		http.Error(w, "500: Could not add nickname to the database", 500)
		return
	}

}
