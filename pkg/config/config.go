package config

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"runtime"
	"time"

	"sync"

	"github.com/pkg/errors"
	bolt "go.etcd.io/bbolt"
)

var ClipBucket = []byte("Clipboard")

type Config struct {
	DB *bolt.DB
}

var (
	instance *Config
	once     sync.Once
)

func GetInstance() *Config {
	once.Do(func() {
		instance = &Config{}
		dir, err := GetDefaultConfigDir()
		if err != nil {
			log.Fatal(errors.Wrap(err, "Failed to get the default config directory"))
		}

		db, err := bolt.Open(path.Join(dir, "palcb.db"), 0600, &bolt.Options{Timeout: 1 * time.Second})
		if err != nil {
			log.Fatal("DB Open", err)
		}
		err = db.Update(func(tx *bolt.Tx) error {
			_, err := tx.CreateBucketIfNotExists(ClipBucket)
			return err
		})
		if err != nil {
			log.Fatal("DB Update", err)
		}

		instance.DB = db

	})
	return instance
}

func GetUserConfigDir() (dir string, err error) {
	if runtime.GOOS == "windows" {
		dir = os.Getenv("APPDATA")
		if dir == "" {
			dir = filepath.Join(os.Getenv("USERPROFILE"), "Application Data", "pal")
		}
		dir = filepath.Join(dir, "pal")
	} else {
		dir = filepath.Join(os.Getenv("HOME"), ".config", "pal")
	}

	return dir, err
}

func GetDefaultConfigDir() (dir string, err error) {
	if env, ok := os.LookupEnv("PAL_CONFIG_DIR"); ok {
		dir = env
	} else if runtime.GOOS == "windows" {
		dir = os.Getenv("APPDATA")
		if dir == "" {
			dir = filepath.Join(os.Getenv("USERPROFILE"), "Application Data", "pal")
		}
		dir = filepath.Join(dir, "pal")
	} else {
		dir = filepath.Join(os.Getenv("HOME"), ".config", "pal")
	}
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return "", fmt.Errorf("cannot create directory: %v", err)
	}
	return dir, nil
}

func expandPath(s string) string {
	if len(s) >= 2 && s[0] == '~' && os.IsPathSeparator(s[1]) {
		if runtime.GOOS == "windows" {
			s = filepath.Join(os.Getenv("USERPROFILE"), s[2:])
		} else {
			s = filepath.Join(os.Getenv("HOME"), s[2:])
		}
	}
	return os.Expand(s, os.Getenv)
}

func isCommandAvailable(name string) bool {
	cmd := exec.Command("/bin/sh", "-c", "command -v "+name)
	if err := cmd.Run(); err != nil {
		return false
	}
	return true
}

func Touch(fileName string) error {
	if _, err := os.Stat(fileName); os.IsNotExist(err) {
		file, err := os.Create(fileName)
		if err != nil {
			return err
		}
		defer file.Close()
	}
	return nil
}
