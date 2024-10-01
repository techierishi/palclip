package main

import (
	"context"
	"encoding/json"
	"fmt"
	"palclip/pkg/clipm"
	"palclip/pkg/config"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	wails_runtime "github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.design/x/clipboard"
	"golang.design/x/hotkey"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	wails_runtime.EventsOn(ctx, "mark_secret", func(optionalData ...interface{}) {
		clipDb := config.GetInstance()

		clipm := &clipm.ClipM{
			DB: clipDb.DB,
		}
		clipm.MarkSecret(string(optionalData[0].(string)))

	})

	wails_runtime.EventsOn(ctx, "menu_clear", func(optionalData ...interface{}) {
		clipDb := config.GetInstance()
		clipm := &clipm.ClipM{
			DB: clipDb.DB,
		}
		clipm.DeleteBucket()

	})

	wails_runtime.EventsOn(ctx, "menu_quit", func(optionalData ...interface{}) {
		wails_runtime.Quit(ctx)
	})

	go clipm.Record(ctx)
	// register hotkey on the app startup
	// if you try to register it anywhere earlier - the app will hang on compile step
	// mainthread.Init(a.RegisterHotKey)
	a.RegisterHotKey()
}

func (a *App) GetClipData(name string) string {

	clipDb := config.GetInstance()

	clipm := &clipm.ClipM{
		DB: clipDb.DB,
	}

	clipList, err := clipm.ReadAll()
	if err != nil {
		fmt.Println("ReadAll", err)
		return "[]"
	}
	clipm.SortByTimestamp(*clipList)
	jsonClipList, err := json.Marshal(clipList)
	if err != nil {
		fmt.Println("Reverse", err)
	}
	return string(jsonClipList)
}

func (a *App) CopyItemContent(content string) {
	fmt.Println("Copied the content...")
	clipboard.Write(clipboard.FmtText, []byte(content))
}

// just a wrapper to have access to App functions
// not necessary if you don't plan to do anything with your App on shortcut use
func (a *App) RegisterHotKey() {
	registerHotkey(a)
}

func registerHotkey(a *App) {
	// the actual shortcut keybind - Ctrl + Shift + Space
	// for more info - refer to the golang.design/x/hotkey documentation
	hk := hotkey.New([]hotkey.Modifier{hotkey.ModCtrl, hotkey.ModShift}, hotkey.KeySpace)
	err := hk.Register()
	if err != nil {
		return
	}

	// you have 2 events available - Keyup and Keydown
	// you can either or neither, or both
	fmt.Printf("hotkey: %v is registered\n", hk)
	<-hk.Keydown()
	// do anything you want on Key down event
	fmt.Printf("hotkey: %v is down\n", hk)

	<-hk.Keyup()
	// do anything you want on Key up event
	fmt.Printf("hotkey: %v is up\n", hk)

	runtime.EventsEmit(a.ctx, "Backend:GlobalHotkeyEvent", time.Now().String())

	hk.Unregister()
	fmt.Printf("hotkey: %v is unregistered\n", hk)

	// reattach listener
	registerHotkey(a)
}
