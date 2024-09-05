package util

import (
	"crypto/sha1"
	"encoding/hex"
	"strconv"
	"time"
)

func Itob(v int) []byte {
	return []byte(strconv.Itoa(v))
}

func CalculateHash(input string) string {
	hasher := sha1.New()
	hasher.Write([]byte(input))
	hash := hasher.Sum(nil)
	return hex.EncodeToString(hash)
}

func UnixMilli() int64 {
	return time.Now().UnixMilli()
}
