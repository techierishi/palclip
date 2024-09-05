package main

import (
	"context"
	"encoding/json"
	"fmt"
	"palclip/pkg/clipm"
	"palclip/pkg/config"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.design/x/clipboard"
	"golang.design/x/hotkey"
	"golang.design/x/hotkey/mainthread"
)

type AppService struct {
	ctx context.Context
}

func (g *AppService) Greet(name string) string {
	return "Hello " + name + "!"
}

func NewAppService() *AppService {
	return &AppService{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *AppService) startup(ctx context.Context) {
	a.ctx = ctx
	go clipm.Record(ctx)
	// register hotkey on the app startup
	// if you try to register it anywhere earlier - the app will hang on compile step
	mainthread.Init(a.RegisterHotKey)
}

func (a *AppService) GetClipData(name string) string {

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

func (a *AppService) CopyItemContent(content string) {
	fmt.Println("Copied the content...")
	clipboard.Write(clipboard.FmtText, []byte(content))
}

// just a wrapper to have access to App functions
// not necessary if you don't plan to do anything with your App on shortcut use
func (a *AppService) RegisterHotKey() {
	registerHotkey(a)
}

func registerHotkey(a *AppService) {
	// the actual shortcut keybind - Ctrl + Shift + S
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
